"use strict";

const config = require("../../shared/config");
const subscribersRepo = require("../../shared/repositories/subscribers");
const rouletteRepo = require("./repository");
const rolesService = require("../../shared/lib/roles");
const {
  ROULETTE_ADMIN_GRANTS_LIMIT,
  ROULETTE_BET_WINDOW_MS,
  ROULETTE_HISTORY_LIMIT,
  ROULETTE_SPIN_MS,
  ROULETTE_STARTING_BALANCE,
  buildRouletteHistoryEntry,
  normalizeRouletteBets,
  pickRouletteNumber,
  rouletteColorForNumber,
} = require("./lib/roulette");

function createServiceError(code, status) {
  const err = new Error(code);
  err.code = code;
  err.status = status;
  return err;
}

function toTimestamp(value) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : null;
}

function buildDisplayName(userId, profiles) {
  const profile = profiles && profiles[String(userId)] ? profiles[String(userId)] : profiles && profiles[userId] ? profiles[userId] : {};
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (fullName && profile.username) return fullName + " (@" + profile.username + ")";
  if (fullName) return fullName;
  if (profile.username) return "@" + profile.username;
  return "ID " + String(userId);
}

class RouletteService {
  constructor(options) {
    this.repo = (options && options.repo) || rouletteRepo;
    this.subscribersRepo = (options && options.subscribersRepo) || subscribersRepo;
    this.now = (options && options.now) || (() => Date.now());
    this.pickNumber = (options && options.pickNumber) || pickRouletteNumber;
    this.betWindowMs = (options && options.betWindowMs) || ROULETTE_BET_WINDOW_MS;
    this.spinMs = (options && options.spinMs) || ROULETTE_SPIN_MS;
    this.startingBalance = (options && options.startingBalance) || ROULETTE_STARTING_BALANCE;
    this.hub = null;
    this._timer = null;
    this._tickInFlight = false;
  }

  attachHub(hub) {
    this.hub = hub || null;
  }

  start() {
    if (this._timer) return;
    this._timer = setInterval(() => {
      this.tick().catch((err) => {
        console.error("roulette tick failed", err);
      });
    }, 1000);
    if (typeof this._timer.unref === "function") {
      this._timer.unref();
    }
    this.tick().catch((err) => {
      console.error("roulette initial tick failed", err);
    });
  }

  stop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
  }

  getContext(authData) {
    const userId = authData && authData.user && authData.user.id != null ? Number(authData.user.id) : null;
    const roomIdRaw = rolesService.getCurrentChatId(authData);
    const roomId = roomIdRaw != null ? String(roomIdRaw) : null;
    if (!userId || !roomId) {
      throw createServiceError("unauthorized", 401);
    }
    return {
      userId,
      roomId,
      isAdmin: rolesService.isConfiguredAdminUser(authData),
    };
  }

  async ensureSubscriberProfile(authData) {
    const userId = authData && authData.user && authData.user.id != null ? Number(authData.user.id) : null;
    if (!userId) return;
    const user = authData.user || {};
    await this.subscribersRepo.ensureVisitor(userId, {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
    });
  }

  serializeRound(round, summary) {
    if (!round) return null;
    const now = this.now();
    const closesAt = toTimestamp(round.closesAt);
    const spunAt = toTimestamp(round.spunAt);
    let timeRemainingMs = 0;
    if (round.status === "open" && closesAt != null) {
      timeRemainingMs = Math.max(0, closesAt - now);
    } else if (round.status === "spinning" && spunAt != null) {
      timeRemainingMs = Math.max(0, spunAt + this.spinMs - now);
    }
    const safeSummary = summary || { betCount: 0, participantCount: 0, totalAmount: 0 };
    return {
      id: Number(round.id),
      roomId: String(round.roomId),
      status: round.status,
      winningNumber: round.winningNumber == null ? null : Number(round.winningNumber),
      winningColor: round.winningColor || null,
      openedAt: round.openedAt || null,
      closesAt: round.closesAt || null,
      spunAt: round.spunAt || null,
      settledAt: round.settledAt || null,
      timeRemainingMs,
      betCount: Number(safeSummary.betCount || 0),
      participantCount: Number(safeSummary.participantCount || 0),
      totalAmount: Number(safeSummary.totalAmount || 0),
    };
  }

  decorateAdminGrantEntry(entry, profiles) {
    if (!entry) return null;
    return {
      id: Number(entry.id),
      userId: Number(entry.userId),
      displayName: buildDisplayName(entry.userId, profiles),
      amount: Number(entry.amount),
      balanceAfter: Number(entry.balanceAfter),
      reason: entry.reason,
      note: entry.meta && entry.meta.note ? String(entry.meta.note) : "",
      actorUserId: entry.meta && entry.meta.actorUserId != null ? Number(entry.meta.actorUserId) : null,
      createdAt: entry.createdAt || null,
    };
  }

  async getAdminExtras() {
    const [walletUsers, grants, subscriberData] = await Promise.all([
      this.repo.listWalletUsers(),
      this.repo.getRecentAdminGrants(ROULETTE_ADMIN_GRANTS_LIMIT),
      this.subscribersRepo.getSubscribersData(),
    ]);
    const profiles = (subscriberData && subscriberData.profiles) || {};
    return {
      participants: walletUsers.map((wallet) => ({
        userId: Number(wallet.userId),
        balance: Number(wallet.balance),
        displayName: buildDisplayName(wallet.userId, profiles),
      })),
      adminGrants: grants.map((entry) => this.decorateAdminGrantEntry(entry, profiles)),
    };
  }

  async getBootstrap(authData) {
    const ctx = this.getContext(authData);
    await this.ensureSubscriberProfile(authData);
    await this.repo.ensureWallet(ctx.userId, {
      now: new Date(this.now()),
      startingBalance: this.startingBalance,
    });
    const currentRound = await this.syncRoom(ctx.roomId);
    const [wallet, myBets, historyRounds, roundSummary] = await Promise.all([
      this.repo.getWallet(ctx.userId),
      currentRound ? this.repo.getUserBetsForRound(currentRound.id, ctx.userId) : [],
      this.repo.getRoomHistory(ctx.roomId, ROULETTE_HISTORY_LIMIT),
      currentRound ? this.repo.getRoundSummary(currentRound.id) : { betCount: 0, participantCount: 0, totalAmount: 0 },
    ]);
    const payload = {
      wallet,
      currentRound: this.serializeRound(currentRound, roundSummary),
      myBets,
      history: historyRounds.map(buildRouletteHistoryEntry).filter(Boolean),
      isAdmin: ctx.isAdmin,
    };
    if (ctx.isAdmin) {
      Object.assign(payload, await this.getAdminExtras());
    }
    return payload;
  }

  async placeBets(authData, rawBets) {
    const ctx = this.getContext(authData);
    await this.ensureSubscriberProfile(authData);
    const bets = normalizeRouletteBets(rawBets);
    if (!bets.length) {
      throw createServiceError("invalid_bets", 400);
    }

    const currentRound = await this.syncRoom(ctx.roomId);
    if (!currentRound || currentRound.status !== "open") {
      throw createServiceError("round_closed", 409);
    }

    const result = await this.repo.placeBets({
      userId: ctx.userId,
      roomId: ctx.roomId,
      roundId: currentRound.id,
      bets,
      now: new Date(this.now()),
      startingBalance: this.startingBalance,
    });
    const summary = await this.repo.getRoundSummary(currentRound.id);
    const serializedRound = this.serializeRound(currentRound, summary);

    this.broadcastRoom(ctx.roomId, "bets_updated", {
      currentRound: serializedRound,
      actorUserId: ctx.userId,
    });
    this.broadcastUser(ctx.userId, "wallet_updated", {
      wallet: result.wallet,
      reason: "bet",
    });

    return {
      roundId: currentRound.id,
      bets: result.myBets,
      wallet: result.wallet,
      currentRound: serializedRound,
    };
  }

  async grantAdmin(authData, payload) {
    const ctx = this.getContext(authData);
    if (!ctx.isAdmin) {
      throw createServiceError("forbidden", 403);
    }

    const targetUserId = payload && payload.userId != null ? Number(payload.userId) : NaN;
    const amount = payload && payload.amount != null ? Number(payload.amount) : NaN;
    const note = payload && payload.note ? String(payload.note).trim().slice(0, 200) : "";
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      throw createServiceError("invalid_user_id", 400);
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      throw createServiceError("invalid_amount", 400);
    }

    const result = await this.repo.applyAdminGrant({
      actorUserId: ctx.userId,
      targetUserId,
      amount,
      note,
      now: new Date(this.now()),
      startingBalance: this.startingBalance,
    });
    const extras = await this.getAdminExtras();
    const subscriberData = await this.subscribersRepo.getSubscribersData();
    const profiles = (subscriberData && subscriberData.profiles) || {};
    const entry = this.decorateAdminGrantEntry(result.entry, profiles);

    this.broadcastUser(targetUserId, "wallet_updated", {
      wallet: result.wallet,
      reason: "admin_grant",
    });
    this.broadcastUser(targetUserId, "admin_grant_applied", { entry });
    this.broadcastUser(ctx.userId, "admin_grant_applied", { entry });

    return {
      wallet: result.wallet,
      entry,
      participants: extras.participants,
      adminGrants: extras.adminGrants,
    };
  }

  async syncRoom(roomId) {
    for (let i = 0; i < 4; i++) {
      const current = await this.repo.getCurrentRound(roomId);
      if (!current) {
        return this.repo.ensureOpenRound(roomId, {
          now: new Date(this.now()),
          betWindowMs: this.betWindowMs,
        });
      }

      const now = this.now();
      const closesAt = toTimestamp(current.closesAt);
      const spunAt = toTimestamp(current.spunAt);
      if (current.status === "open" && closesAt != null && closesAt <= now) {
        const spun = await this.spinRound(current);
        if (spun) return spun;
        continue;
      }
      if (current.status === "spinning" && spunAt != null && spunAt + this.spinMs <= now) {
        const nextRound = await this.finishRound(current);
        if (nextRound) return nextRound;
        continue;
      }
      return current;
    }

    const current = await this.repo.getCurrentRound(roomId);
    if (current) return current;
    return this.repo.ensureOpenRound(roomId, {
      now: new Date(this.now()),
      betWindowMs: this.betWindowMs,
    });
  }

  async spinRound(round) {
    const winningNumber = this.pickNumber((max) => Math.floor(Math.random() * max));
    const spunAt = new Date(this.now());
    const updated = await this.repo.startRoundSpin(round.id, {
      winningNumber,
      winningColor: rouletteColorForNumber(winningNumber),
      spunAt,
    });
    if (!updated) {
      return this.repo.getRoundById(round.id);
    }

    const summary = await this.repo.getRoundSummary(updated.id);
    this.broadcastRoom(updated.roomId, "round_spinning", {
      currentRound: this.serializeRound(updated, summary),
      winningNumber: updated.winningNumber,
      winningColor: updated.winningColor,
      settlesAt: new Date(spunAt.getTime() + this.spinMs).toISOString(),
    });
    return updated;
  }

  async finishRound(round) {
    const settled = await this.repo.settleRound(round.id, {
      settledAt: new Date(this.now()),
    });
    if (!settled) {
      return this.repo.getCurrentRound(round.roomId);
    }

    for (const payout of settled.payouts || []) {
      this.broadcastUser(payout.userId, "wallet_updated", {
        wallet: payout.wallet,
        reason: "payout",
        amount: payout.amount,
      });
    }

    const historyEntry = buildRouletteHistoryEntry(settled.round);
    this.broadcastRoom(settled.round.roomId, "round_result", {
      round: historyEntry,
    });

    const nextRound = await this.repo.ensureOpenRound(settled.round.roomId, {
      now: new Date(this.now()),
      betWindowMs: this.betWindowMs,
    });
    const nextSummary = await this.repo.getRoundSummary(nextRound.id);
    this.broadcastRoom(settled.round.roomId, "round_open", {
      currentRound: this.serializeRound(nextRound, nextSummary),
      historyEntry,
    });
    return nextRound;
  }

  async tick() {
    if (this._tickInFlight) return;
    this._tickInFlight = true;
    try {
      const activeRounds = await this.repo.listActiveRounds();
      for (const round of activeRounds) {
        const now = this.now();
        const closesAt = toTimestamp(round.closesAt);
        const spunAt = toTimestamp(round.spunAt);
        if (round.status === "open" && closesAt != null && closesAt <= now) {
          await this.spinRound(round);
          continue;
        }
        if (round.status === "spinning" && spunAt != null && spunAt + this.spinMs <= now) {
          await this.finishRound(round);
        }
      }
    } finally {
      this._tickInFlight = false;
    }
  }

  broadcastRoom(roomId, event, payload) {
    if (!this.hub || typeof this.hub.broadcastRoom !== "function") return;
    this.hub.broadcastRoom(String(roomId), event, payload);
  }

  broadcastUser(userId, event, payload) {
    if (!this.hub || typeof this.hub.broadcastUser !== "function") return;
    this.hub.broadcastUser(Number(userId), event, payload);
  }
}

module.exports = new RouletteService({
  repo: rouletteRepo,
  subscribersRepo,
});

module.exports.RouletteService = RouletteService;
