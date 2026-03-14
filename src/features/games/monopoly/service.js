"use strict";

const rolesService = require("../../shared/lib/roles");
const subscribersRepo = require("../../shared/repositories/subscribers");
const monopolyRepo = require("./repository");
const {
  BOARD,
  clampTurnCap,
  createEngineError,
  createInitialState,
  syncPlayers,
  applyAction,
  applyTimeouts,
} = require("./lib/monopolyEngine");
const { normalizeMonopolyToken } = require("./lib/monopolyTokens");

function createServiceError(code, status) {
  const err = new Error(code);
  err.code = code;
  err.status = status;
  return err;
}

function displayNameFromAuth(authData) {
  const user = authData && authData.user ? authData.user : {};
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (fullName && user.username) return fullName + " (@" + user.username + ")";
  if (fullName) return fullName;
  if (user.username) return "@" + user.username;
  return "Player";
}

function normalizeRoomCode(raw) {
  return String(raw || "").trim().toUpperCase();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pickRoomCode(randomFn) {
  const random = typeof randomFn === "function" ? randomFn : Math.random;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";
  for (let i = 0; i < 6; i += 1) {
    value += alphabet[Math.floor(random() * alphabet.length)];
  }
  return value;
}

class MonopolyService {
  constructor(options) {
    this.repo = (options && options.repo) || monopolyRepo;
    this.subscribersRepo = (options && options.subscribersRepo) || subscribersRepo;
    this.now = (options && options.now) || (() => Date.now());
    this.random = (options && options.random) || Math.random;
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
        console.error("monopoly tick failed", err);
      });
    }, 1000);
    if (typeof this._timer.unref === "function") this._timer.unref();
    this.tick().catch((err) => {
      console.error("monopoly initial tick failed", err);
    });
  }

  stop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
  }

  getContext(authData) {
    const userId = authData && authData.user && authData.user.id != null ? Number(authData.user.id) : null;
    const chatIdRaw = rolesService.getCurrentChatId(authData);
    const chatId = chatIdRaw != null ? Number(chatIdRaw) : null;
    if (!userId || !chatId) throw createServiceError("unauthorized", 401);
    return {
      userId,
      chatId,
      displayName: displayNameFromAuth(authData),
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

  roomStatusFromState(state) {
    if (!state || !state.phase) return "lobby";
    if (state.phase === "lobby") return "lobby";
    if (state.phase === "finished") return "finished";
    return "active";
  }

  buildSnapshot(data, viewerUserId) {
    const room = data.room;
    const state = syncPlayers(clone(data.state || {}), data.players || []);
    const players = (state.players || []).map((player) => ({
      userId: Number(player.userId),
      displayName: player.displayName || "Player",
      ready: !!player.ready,
      bankrupt: !!player.bankrupt,
      position: Number(player.position || 0),
      cash: Number(player.cash || 0),
      inJail: !!player.inJail,
      jailTurns: Number(player.jailTurns || 0),
      tokenId: player.tokenId == null ? null : Number(player.tokenId),
      tokenUrl: player.tokenId == null ? null : "/api/monopoly/tokens/" + String(player.tokenId),
    }));
    const me = players.find((player) => Number(player.userId) === Number(viewerUserId)) || null;
    const activePlayers = players.filter((player) => !player.bankrupt);
    const readyPlayers = activePlayers.filter((player) => player.ready);
    const canStart = room.status === "lobby" && Number(room.hostUserId) === Number(viewerUserId) && activePlayers.length >= 2 && activePlayers.length <= 4 && readyPlayers.length === activePlayers.length;
    return {
      room: {
        id: room.id,
        chatId: room.chatId,
        roomCode: room.roomCode,
        status: room.status,
        hostUserId: room.hostUserId,
        turnCap: room.turnCap,
        currentTurn: Number(state.turnCount || 0),
        winnerUserId: state.meta && state.meta.winnerUserId != null ? Number(state.meta.winnerUserId) : room.winnerUserId,
      },
      version: Number(data.version || 1),
      board: BOARD,
      state: {
        phase: state.phase || "lobby",
        activePlayerId: state.activePlayerId == null ? null : Number(state.activePlayerId),
        turnCount: Number(state.turnCount || 0),
        turnDeadlineAt: state.turnDeadlineAt || null,
        phaseDeadlineAt: state.phaseDeadlineAt || null,
        dice: state.dice || null,
        pending: state.pending || null,
        ownership: state.ownership || {},
        history: Array.isArray(state.history) ? state.history.slice(0, 30) : [],
        meta: state.meta || {},
      },
      players,
      me,
      canStart,
      recentEvents: Array.isArray(data.events) ? data.events.slice(0, 30) : [],
    };
  }

  broadcastRoom(roomId, event, payload) {
    if (!this.hub || typeof this.hub.broadcastRoom !== "function") return;
    this.hub.broadcastRoom(Number(roomId), event, payload);
  }

  async createRoom(authData, payload) {
    const ctx = this.getContext(authData);
    await this.ensureSubscriberProfile(authData);
    const turnCap = clampTurnCap(payload && payload.turnCap);
    let created = null;
    let lastError = null;
    for (let i = 0; i < 12; i += 1) {
      const code = pickRoomCode(this.random);
      const state = createInitialState({
        now: this.now(),
        turnCap,
        players: [
          {
            userId: ctx.userId,
            displayName: ctx.displayName,
            ready: false,
            tokenId: null,
          },
        ],
      });
      try {
        created = await this.repo.createRoom({
          chatId: ctx.chatId,
          roomCode: code,
          hostUserId: ctx.userId,
          hostDisplayName: ctx.displayName,
          hostReady: false,
          turnCap,
          state,
          now: new Date(this.now()),
        });
        break;
      } catch (err) {
        if (err && err.code === "23505") {
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    if (!created) {
      console.error("failed to create monopoly room", lastError);
      throw createServiceError("room_creation_failed", 500);
    }
    return this.buildSnapshot(
      {
        room: created.room,
        state: created.state,
        players: created.players,
        version: created.version,
        events: [],
      },
      ctx.userId
    );
  }

  async joinRoom(authData, roomCodeRaw) {
    const ctx = this.getContext(authData);
    await this.ensureSubscriberProfile(authData);
    const roomCode = normalizeRoomCode(roomCodeRaw);
    if (!roomCode) throw createServiceError("room_code_required", 400);

    const txResult = await this.repo.withRoomTransaction(ctx.chatId, roomCode, async (tx) => {
      if (tx.room.status !== "lobby") throw createServiceError("room_not_in_lobby", 409);
      const alreadyMember = tx.players.find((player) => Number(player.userId) === Number(ctx.userId));
      if (!alreadyMember && tx.players.length >= 4) {
        throw createServiceError("room_is_full", 409);
      }
      await this.repo.insertRoomPlayerTx(tx.client, tx.room.id, ctx.userId, ctx.displayName, new Date(this.now()));
      const players = await this.repo.getRoomPlayersTx(tx.client, tx.room.id);
      const state = syncPlayers(clone(tx.state), players);
      const version = Number(tx.version) + 1;
      await this.repo.saveStateTx(tx.client, {
        roomId: tx.room.id,
        state,
        version,
        status: this.roomStatusFromState(state),
        currentTurn: state.turnCount || 0,
        winnerUserId: state.meta && state.meta.winnerUserId != null ? state.meta.winnerUserId : null,
        startedAt: state.meta && state.meta.startedAt ? state.meta.startedAt : tx.room.startedAt,
        finishedAt: state.meta && state.meta.finishedAt ? state.meta.finishedAt : tx.room.finishedAt,
        now: new Date(this.now()),
      });
      const event = {
        type: "state_patch",
        message: "Player joined room",
        payload: { userId: ctx.userId },
        createdAt: new Date(this.now()).toISOString(),
      };
      await this.repo.appendEventsTx(tx.client, tx.room.id, version, [event], new Date(this.now()));
      return {
        room: {
          ...tx.room,
          status: this.roomStatusFromState(state),
        },
        state,
        players,
        version,
        events: [event],
      };
    });

    const snapshot = this.buildSnapshot(txResult, ctx.userId);
    this.broadcastRoom(txResult.room.id, "snapshot", snapshot);
    return snapshot;
  }

  async setReady(authData, roomCodeRaw, ready) {
    const ctx = this.getContext(authData);
    const roomCode = normalizeRoomCode(roomCodeRaw);
    const txResult = await this.repo.withRoomTransaction(ctx.chatId, roomCode, async (tx) => {
      if (tx.room.status !== "lobby") throw createServiceError("room_not_in_lobby", 409);
      const member = tx.players.find((player) => Number(player.userId) === Number(ctx.userId));
      if (!member) throw createServiceError("forbidden", 403);
      await this.repo.updatePlayerReadyTx(tx.client, tx.room.id, ctx.userId, !!ready);
      const players = await this.repo.getRoomPlayersTx(tx.client, tx.room.id);
      const state = syncPlayers(clone(tx.state), players);
      const version = Number(tx.version) + 1;
      await this.repo.saveStateTx(tx.client, {
        roomId: tx.room.id,
        state,
        version,
        status: this.roomStatusFromState(state),
        currentTurn: state.turnCount || 0,
        winnerUserId: state.meta && state.meta.winnerUserId != null ? state.meta.winnerUserId : null,
        startedAt: state.meta && state.meta.startedAt ? state.meta.startedAt : tx.room.startedAt,
        finishedAt: state.meta && state.meta.finishedAt ? state.meta.finishedAt : tx.room.finishedAt,
        now: new Date(this.now()),
      });
      const event = {
        type: "state_patch",
        message: "Ready state changed",
        payload: { userId: ctx.userId, ready: !!ready },
        createdAt: new Date(this.now()).toISOString(),
      };
      await this.repo.appendEventsTx(tx.client, tx.room.id, version, [event], new Date(this.now()));
      return {
        room: {
          ...tx.room,
          status: this.roomStatusFromState(state),
        },
        state,
        players,
        version,
        events: [event],
      };
    });
    const snapshot = this.buildSnapshot(txResult, ctx.userId);
    this.broadcastRoom(txResult.room.id, "snapshot", snapshot);
    return snapshot;
  }

  async getBootstrap(authData, roomCodeRaw) {
    const ctx = this.getContext(authData);
    const roomCode = normalizeRoomCode(roomCodeRaw);
    if (!roomCode) throw createServiceError("room_code_required", 400);
    const data = await this.repo.getBootstrap(ctx.chatId, roomCode);
    const member = data.players.find((player) => Number(player.userId) === Number(ctx.userId));
    if (!member) throw createServiceError("forbidden", 403);
    return this.buildSnapshot(data, ctx.userId);
  }

  async action(authData, roomCodeRaw, action) {
    const ctx = this.getContext(authData);
    const roomCode = normalizeRoomCode(roomCodeRaw);
    const actionInput = action && action.type ? action : { type: "", payload: {} };
    const txResult = await this.repo.withRoomTransaction(ctx.chatId, roomCode, async (tx) => {
      const member = tx.players.find((player) => Number(player.userId) === Number(ctx.userId));
      if (!member) throw createServiceError("forbidden", 403);
      let state = syncPlayers(clone(tx.state), tx.players);
      let result;
      if (actionInput.type === "start_game") {
        if (Number(tx.room.hostUserId) !== Number(ctx.userId)) throw createServiceError("forbidden", 403);
        result = applyAction(state, { type: "start_game", payload: actionInput.payload || {} }, {
          userId: ctx.userId,
          now: this.now(),
          random: this.random,
        });
      } else {
        if (tx.room.status !== "active") throw createServiceError("room_not_active", 409);
        result = applyAction(state, { type: actionInput.type, payload: actionInput.payload || {} }, {
          userId: ctx.userId,
          now: this.now(),
          random: this.random,
        });
      }
      state = result.state;
      const version = Number(tx.version) + 1;
      await this.repo.updatePlayersBankruptTx(tx.client, tx.room.id, state.players || []);
      await this.repo.saveStateTx(tx.client, {
        roomId: tx.room.id,
        state,
        version,
        status: this.roomStatusFromState(state),
        currentTurn: state.turnCount || 0,
        winnerUserId: state.meta && state.meta.winnerUserId != null ? state.meta.winnerUserId : null,
        startedAt: state.meta && state.meta.startedAt ? state.meta.startedAt : tx.room.startedAt,
        finishedAt: state.meta && state.meta.finishedAt ? state.meta.finishedAt : tx.room.finishedAt,
        now: new Date(this.now()),
      });
      await this.repo.appendEventsTx(tx.client, tx.room.id, version, result.events || [], new Date(this.now()));
      const players = await this.repo.getRoomPlayersTx(tx.client, tx.room.id);
      return {
        room: {
          ...tx.room,
          status: this.roomStatusFromState(state),
        },
        state,
        players,
        version,
        events: result.events || [],
      };
    });
    const snapshot = this.buildSnapshot(txResult, ctx.userId);
    this.broadcastRoom(txResult.room.id, "snapshot", snapshot);
    return snapshot;
  }

  async uploadToken(authData, roomCodeRaw, file) {
    const ctx = this.getContext(authData);
    if (!file || !Buffer.isBuffer(file.buffer) || !file.mimetype) {
      throw createServiceError("token_file_required", 400);
    }
    const roomCode = normalizeRoomCode(roomCodeRaw);
    const normalized = await normalizeMonopolyToken(file.buffer, String(file.mimetype));
    const txResult = await this.repo.withRoomTransaction(ctx.chatId, roomCode, async (tx) => {
      const member = tx.players.find((player) => Number(player.userId) === Number(ctx.userId));
      if (!member) throw createServiceError("forbidden", 403);
      if (tx.room.status !== "lobby") throw createServiceError("token_edit_locked", 409);
      if ((tx.state && tx.state.phase) !== "lobby") throw createServiceError("token_edit_locked", 409);
      const duplicate = await this.repo.roomHasTokenHashTx(tx.client, tx.room.id, normalized.sha256, ctx.userId);
      if (duplicate) throw createServiceError("duplicate_token_in_room", 409);

      const token = await this.repo.createPlayerTokenTx(tx.client, {
        userId: ctx.userId,
        mimeType: normalized.mimeType,
        imageData: normalized.buffer,
        sha256: normalized.sha256,
        now: new Date(this.now()),
      });
      await this.repo.assignPlayerTokenTx(tx.client, tx.room.id, ctx.userId, token.id);
      const players = await this.repo.getRoomPlayersTx(tx.client, tx.room.id);
      const state = syncPlayers(clone(tx.state), players);
      const version = Number(tx.version) + 1;
      const event = {
        type: "player_token_updated",
        message: "Player token updated",
        payload: {
          userId: ctx.userId,
          tokenId: token.id,
        },
        createdAt: new Date(this.now()).toISOString(),
      };
      await this.repo.saveStateTx(tx.client, {
        roomId: tx.room.id,
        state,
        version,
        status: this.roomStatusFromState(state),
        currentTurn: state.turnCount || 0,
        winnerUserId: null,
        startedAt: state.meta && state.meta.startedAt ? state.meta.startedAt : tx.room.startedAt,
        finishedAt: state.meta && state.meta.finishedAt ? state.meta.finishedAt : tx.room.finishedAt,
        now: new Date(this.now()),
      });
      await this.repo.appendEventsTx(tx.client, tx.room.id, version, [event], new Date(this.now()));
      return {
        room: {
          ...tx.room,
          status: "lobby",
        },
        state,
        players,
        version,
        events: [event],
        token,
      };
    });
    const snapshot = this.buildSnapshot(txResult, ctx.userId);
    this.broadcastRoom(txResult.room.id, "player_token_updated", {
      userId: ctx.userId,
      tokenId: txResult.token.id,
      snapshot,
    });
    this.broadcastRoom(txResult.room.id, "snapshot", snapshot);
    return {
      token: {
        tokenId: txResult.token.id,
        ownerUserId: ctx.userId,
        sha256: txResult.token.sha256,
        updatedAt: txResult.token.updatedAt,
      },
      snapshot,
    };
  }

  async getToken(tokenId) {
    const token = await this.repo.getTokenById(tokenId);
    if (!token) throw createServiceError("token_not_found", 404);
    return token;
  }

  async tick() {
    if (this._tickInFlight) return;
    this._tickInFlight = true;
    try {
      const rooms = await this.repo.listActiveRooms();
      for (const room of rooms) {
        await this.handleRoomTimeout(room.chatId, room.roomCode);
      }
    } finally {
      this._tickInFlight = false;
    }
  }

  async handleRoomTimeout(chatId, roomCode) {
    const txResult = await this.repo.withRoomTransaction(chatId, roomCode, async (tx) => {
      let state = syncPlayers(clone(tx.state), tx.players);
      const result = applyTimeouts(state, { now: this.now() });
      if (!result.events.length) return null;
      state = result.state;
      const version = Number(tx.version) + 1;
      await this.repo.updatePlayersBankruptTx(tx.client, tx.room.id, state.players || []);
      await this.repo.saveStateTx(tx.client, {
        roomId: tx.room.id,
        state,
        version,
        status: this.roomStatusFromState(state),
        currentTurn: state.turnCount || 0,
        winnerUserId: state.meta && state.meta.winnerUserId != null ? state.meta.winnerUserId : null,
        startedAt: state.meta && state.meta.startedAt ? state.meta.startedAt : tx.room.startedAt,
        finishedAt: state.meta && state.meta.finishedAt ? state.meta.finishedAt : tx.room.finishedAt,
        now: new Date(this.now()),
      });
      await this.repo.appendEventsTx(tx.client, tx.room.id, version, result.events, new Date(this.now()));
      const players = await this.repo.getRoomPlayersTx(tx.client, tx.room.id);
      return {
        room: {
          ...tx.room,
          status: this.roomStatusFromState(state),
        },
        state,
        players,
        version,
        events: result.events,
      };
    });
    if (!txResult) return;
    const firstActive = txResult.players.find((player) => !player.bankrupt);
    const snapshot = this.buildSnapshot(txResult, firstActive ? firstActive.userId : txResult.room.hostUserId);
    this.broadcastRoom(txResult.room.id, "snapshot", snapshot);
  }

  async notifyChatAboutKeyEvents(chatId, events, snapshot) {
    if (!Array.isArray(events) || !events.length) return;
    for (const event of events) {
      if (!event || !event.type) continue;
      if (event.type === "turn_changed") {
        const isTimeout = String(event.message || "").toLowerCase().includes("timeout");
        if (isTimeout) {
          await this.telegramService.sendTelegramMessage(chatId, "⏱ Monopoly: turn skipped by timeout.");
        }
        const active = (snapshot.players || []).find((player) => Number(player.userId) === Number(snapshot.state.activePlayerId));
        if (active) {
          await this.telegramService.sendTelegramMessage(chatId, "🎲 Monopoly: turn of " + active.displayName);
        }
      } else if (event.type === "player_eliminated") {
        const eliminated = (snapshot.players || []).find((player) => Number(player.userId) === Number(event.payload && event.payload.userId));
        if (eliminated) {
          await this.telegramService.sendTelegramMessage(chatId, "💥 Monopoly: " + eliminated.displayName + " is bankrupt.");
        }
      } else if (event.type === "game_finished") {
        const winner = (snapshot.players || []).find((player) => Number(player.userId) === Number(snapshot.room.winnerUserId));
        const winnerName = winner ? winner.displayName : "Unknown player";
        await this.telegramService.sendTelegramMessage(chatId, "🏁 Monopoly finished. Winner: " + winnerName);
      }
    }
  }
}

module.exports = new MonopolyService({
  repo: monopolyRepo,
  subscribersRepo,
});

module.exports.MonopolyService = MonopolyService;
