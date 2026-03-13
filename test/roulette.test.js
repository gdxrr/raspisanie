"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";

const {
  ROULETTE_STARTING_BALANCE,
  getRouletteBetGrossPayout,
  normalizeRouletteBets,
} = require("../src/lib/roulette");
const { RouletteService } = require("../src/services/rouletteService");

function createSubscribersRepo(profiles) {
  const data = profiles || {};
  return {
    async ensureVisitor() {},
    async getSubscribersData() {
      return { profiles: data, visitors: Object.keys(data).map(Number), broadcast: [] };
    },
  };
}

function createHub() {
  return {
    roomEvents: [],
    userEvents: [],
    broadcastRoom(roomId, event, payload) {
      this.roomEvents.push({ roomId, event, payload });
    },
    broadcastUser(userId, event, payload) {
      this.userEvents.push({ userId, event, payload });
    },
  };
}

function createAuth(userId, roomId) {
  return {
    user: { id: userId, first_name: "User" + userId, username: "user" + userId },
    chat: { id: roomId },
  };
}

class MemoryRouletteRepo {
  constructor() {
    this.wallets = new Map();
    this.rounds = [];
    this.bets = [];
    this.ledger = [];
    this.nextRoundId = 1;
    this.nextLedgerId = 1;
  }

  _toIso(value) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }

  _clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  _ensureWallet(userId, options) {
    const id = Number(userId);
    const nowIso = this._toIso(options.now || new Date());
    const startingBalance = Number(options.startingBalance != null ? options.startingBalance : ROULETTE_STARTING_BALANCE);
    let wallet = this.wallets.get(id);
    if (wallet) return { wallet, created: false };

    wallet = {
      userId: id,
      balance: startingBalance,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.wallets.set(id, wallet);
    this.ledger.push({
      id: this.nextLedgerId++,
      userId: id,
      reason: "welcome_bonus",
      amount: startingBalance,
      balanceAfter: startingBalance,
      roundId: null,
      meta: {},
      createdAt: nowIso,
    });
    return { wallet, created: true };
  }

  async ensureWallet(userId, options) {
    return this._clone(this._ensureWallet(userId, options || {}).wallet);
  }

  async getWallet(userId) {
    return this._clone(this.wallets.get(Number(userId)) || null);
  }

  async getCurrentRound(roomId) {
    const active = this.rounds
      .filter((round) => round.roomId === String(roomId) && (round.status === "open" || round.status === "spinning"))
      .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt));
    return this._clone(active[0] || null);
  }

  async getRoundById(roundId) {
    const round = this.rounds.find((item) => item.id === Number(roundId));
    return this._clone(round || null);
  }

  async ensureOpenRound(roomId, options) {
    const current = await this.getCurrentRound(roomId);
    if (current) return current;
    const now = options && options.now ? options.now : new Date();
    const openedAt = this._toIso(now);
    const closesAt = this._toIso(new Date(new Date(now).getTime() + Number(options.betWindowMs || 15000)));
    const round = {
      id: this.nextRoundId++,
      roomId: String(roomId),
      status: "open",
      winningNumber: null,
      winningColor: null,
      openedAt,
      closesAt,
      spunAt: null,
      settledAt: null,
    };
    this.rounds.push(round);
    return this._clone(round);
  }

  async getRoundSummary(roundId) {
    const list = this.bets.filter((bet) => bet.roundId === Number(roundId));
    return {
      betCount: list.length,
      participantCount: new Set(list.map((bet) => bet.userId)).size,
      totalAmount: list.reduce((sum, bet) => sum + Number(bet.amount), 0),
    };
  }

  async getUserBetsForRound(roundId, userId) {
    return this._clone(
      this.bets.filter((bet) => bet.roundId === Number(roundId) && bet.userId === Number(userId))
    );
  }

  async getRoomHistory(roomId, limit) {
    return this._clone(
      this.rounds
        .filter((round) => round.roomId === String(roomId) && round.status === "settled")
        .sort((a, b) => Date.parse(b.settledAt) - Date.parse(a.settledAt))
        .slice(0, Number(limit))
    );
  }

  async listActiveRounds() {
    return this._clone(this.rounds.filter((round) => round.status === "open" || round.status === "spinning"));
  }

  async placeBets(options) {
    const round = this.rounds.find((item) => item.id === Number(options.roundId) && item.roomId === String(options.roomId));
    const nowIso = this._toIso(options.now || new Date());
    if (!round || round.status !== "open" || Date.parse(round.closesAt) <= Date.parse(nowIso)) {
      const err = new Error("round_closed");
      err.code = "round_closed";
      err.status = 409;
      throw err;
    }

    const ensured = this._ensureWallet(options.userId, { now: options.now, startingBalance: options.startingBalance });
    const total = options.bets.reduce((sum, bet) => sum + Number(bet.amount), 0);
    if (ensured.wallet.balance < total) {
      const err = new Error("insufficient_balance");
      err.code = "insufficient_balance";
      err.status = 400;
      throw err;
    }

    for (const bet of options.bets) {
      const existing = this.bets.find((item) => item.roundId === Number(options.roundId) && item.userId === Number(options.userId) && item.kind === bet.kind && item.value === String(bet.value));
      if (existing) existing.amount += Number(bet.amount);
      else {
        this.bets.push({
          roundId: Number(options.roundId),
          userId: Number(options.userId),
          kind: bet.kind,
          value: String(bet.value),
          amount: Number(bet.amount),
          createdAt: nowIso,
        });
      }
    }

    ensured.wallet.balance -= total;
    ensured.wallet.updatedAt = nowIso;
    this.ledger.push({
      id: this.nextLedgerId++,
      userId: Number(options.userId),
      reason: "bet",
      amount: -total,
      balanceAfter: ensured.wallet.balance,
      roundId: Number(options.roundId),
      meta: {},
      createdAt: nowIso,
    });

    return {
      round: this._clone(round),
      wallet: this._clone(ensured.wallet),
      myBets: await this.getUserBetsForRound(options.roundId, options.userId),
    };
  }

  async startRoundSpin(roundId, options) {
    const round = this.rounds.find((item) => item.id === Number(roundId));
    if (!round || round.status !== "open") return null;
    round.status = "spinning";
    round.winningNumber = Number(options.winningNumber);
    round.winningColor = options.winningColor;
    round.spunAt = this._toIso(options.spunAt || new Date());
    return this._clone(round);
  }

  async settleRound(roundId, options) {
    const round = this.rounds.find((item) => item.id === Number(roundId));
    const settledAtIso = this._toIso(options.settledAt || new Date());
    if (!round || round.status !== "spinning" || round.settledAt) return null;

    const payoutsByUser = new Map();
    for (const bet of this.bets.filter((item) => item.roundId === Number(roundId))) {
      const gross = getRouletteBetGrossPayout(bet, round.winningNumber);
      if (gross <= 0) continue;
      payoutsByUser.set(bet.userId, (payoutsByUser.get(bet.userId) || 0) + gross);
    }

    const payouts = [];
    for (const [userId, amount] of payoutsByUser.entries()) {
      const wallet = this.wallets.get(Number(userId));
      wallet.balance += amount;
      wallet.updatedAt = settledAtIso;
      this.ledger.push({
        id: this.nextLedgerId++,
        userId: Number(userId),
        reason: "payout",
        amount,
        balanceAfter: wallet.balance,
        roundId: Number(roundId),
        meta: {},
        createdAt: settledAtIso,
      });
      payouts.push({ userId: Number(userId), amount, wallet: this._clone(wallet) });
    }

    round.status = "settled";
    round.settledAt = settledAtIso;
    return { round: this._clone(round), payouts };
  }

  async applyAdminGrant(options) {
    const ensured = this._ensureWallet(options.targetUserId, { now: options.now, startingBalance: options.startingBalance });
    const nowIso = this._toIso(options.now || new Date());
    ensured.wallet.balance += Number(options.amount);
    ensured.wallet.updatedAt = nowIso;
    const entry = {
      id: this.nextLedgerId++,
      userId: Number(options.targetUserId),
      reason: "admin_grant",
      amount: Number(options.amount),
      balanceAfter: ensured.wallet.balance,
      roundId: null,
      meta: { actorUserId: Number(options.actorUserId), note: options.note || "" },
      createdAt: nowIso,
    };
    this.ledger.push(entry);
    return { wallet: this._clone(ensured.wallet), entry: this._clone(entry) };
  }

  async listWalletUsers() {
    return this._clone(Array.from(this.wallets.values()));
  }

  async getRecentAdminGrants(limit) {
    return this._clone(
      this.ledger
        .filter((entry) => entry.reason === "admin_grant")
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, Number(limit))
    );
  }
}

test("normalizeRouletteBets merges duplicate selections", () => {
  const bets = normalizeRouletteBets([
    { kind: "number", value: 7, amount: 20 },
    { kind: "number", value: "7", amount: 30 },
    { kind: "color", value: "red", amount: 10 },
  ]);
  assert.deepEqual(bets, [
    { kind: "number", value: "7", amount: 50 },
    { kind: "color", value: "red", amount: 10 },
  ]);
});

test("roulette payouts handle number, color, parity and zero correctly", () => {
  assert.equal(getRouletteBetGrossPayout({ kind: "number", value: "0", amount: 10 }, 0), 360);
  assert.equal(getRouletteBetGrossPayout({ kind: "number", value: "17", amount: 10 }, 17), 360);
  assert.equal(getRouletteBetGrossPayout({ kind: "color", value: "red", amount: 10 }, 32), 20);
  assert.equal(getRouletteBetGrossPayout({ kind: "parity", value: "odd", amount: 10 }, 19), 20);
  assert.equal(getRouletteBetGrossPayout({ kind: "color", value: "red", amount: 10 }, 0), 0);
  assert.equal(getRouletteBetGrossPayout({ kind: "parity", value: "even", amount: 10 }, 0), 0);
});

test("welcome bonus is granted only once per player", async () => {
  const repo = new MemoryRouletteRepo();
  const service = new RouletteService({
    repo,
    subscribersRepo: createSubscribersRepo({ 101: { first_name: "Alice" } }),
    now: () => Date.parse("2026-03-12T10:00:00.000Z"),
    pickNumber: () => 7,
  });

  const auth = createAuth(101, 9001);
  const first = await service.getBootstrap(auth);
  const second = await service.getBootstrap(auth);

  assert.equal(first.wallet.balance, ROULETTE_STARTING_BALANCE);
  assert.equal(second.wallet.balance, ROULETTE_STARTING_BALANCE);
  assert.equal(repo.ledger.filter((entry) => entry.reason === "welcome_bonus" && entry.userId === 101).length, 1);
});

test("service rejects bets when balance is insufficient", async () => {
  const repo = new MemoryRouletteRepo();
  const service = new RouletteService({
    repo,
    subscribersRepo: createSubscribersRepo({ 102: { first_name: "Bob" } }),
    now: () => Date.parse("2026-03-12T10:00:00.000Z"),
    pickNumber: () => 7,
  });
  const auth = createAuth(102, 9002);
  await service.getBootstrap(auth);

  await assert.rejects(
    service.placeBets(auth, [{ kind: "number", value: 7, amount: ROULETTE_STARTING_BALANCE + 1 }]),
    function (err) {
      assert.equal(err.code, "insufficient_balance");
      return true;
    }
  );
});

test("settlement is idempotent for the same round", async () => {
  const repo = new MemoryRouletteRepo();
  const subscribers = createSubscribersRepo({ 103: { first_name: "Carol" } });
  const service = new RouletteService({
    repo,
    subscribersRepo: subscribers,
    now: () => Date.parse("2026-03-12T10:00:00.000Z"),
    pickNumber: () => 7,
  });
  const hub = createHub();
  service.attachHub(hub);

  const auth = createAuth(103, 9003);
  await service.getBootstrap(auth);
  await service.placeBets(auth, [{ kind: "number", value: 7, amount: 100 }]);
  const currentRound = await repo.getCurrentRound("9003");
  const spinningRound = await service.spinRound(currentRound);
  const firstNextRound = await service.finishRound(spinningRound);
  const balanceAfterFirst = (await repo.getWallet(103)).balance;
  const userEventsAfterFirst = hub.userEvents.length;
  const secondResult = await service.finishRound(spinningRound);

  assert.equal(balanceAfterFirst, 4500);
  assert.ok(firstNextRound);
  assert.ok(secondResult);
  assert.equal((await repo.getWallet(103)).balance, balanceAfterFirst);
  assert.equal(hub.userEvents.length, userEventsAfterFirst);
  assert.equal(repo.ledger.filter((entry) => entry.reason === "payout").length, 1);
});

test("admin grant is forbidden without explicit admin rights", async () => {
  const repo = new MemoryRouletteRepo();
  const service = new RouletteService({
    repo,
    subscribersRepo: createSubscribersRepo(),
    now: () => Date.parse("2026-03-12T10:00:00.000Z"),
    pickNumber: () => 7,
  });

  await assert.rejects(
    service.grantAdmin(createAuth(104, 9004), { userId: 105, amount: 100 }),
    function (err) {
      assert.equal(err.code, "forbidden");
      return true;
    }
  );
});
