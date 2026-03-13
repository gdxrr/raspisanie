"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";

const { MonopolyService } = require("../src/services/monopolyService");

function createAuth(userId, chatId) {
  return {
    user: {
      id: userId,
      first_name: "User" + String(userId),
      username: "user" + String(userId),
    },
    chat: {
      id: chatId,
    },
  };
}

class MemoryMonopolyRepo {
  constructor() {
    this.rooms = [];
    this.states = new Map();
    this.players = new Map();
    this.events = new Map();
    this.nextRoomId = 1;
  }

  _clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  _resolveRoom(chatId, roomCode) {
    const normalizedRoomCode = String(roomCode || "").trim().toUpperCase();
    const exact = this.rooms.find((room) => Number(room.chatId) === Number(chatId) && room.roomCode === normalizedRoomCode);
    if (exact) return exact;

    const matches = this.rooms.filter((room) => room.roomCode === normalizedRoomCode);
    if (!matches.length) {
      const err = new Error("room_not_found");
      err.code = "room_not_found";
      err.status = 404;
      throw err;
    }
    if (matches.length > 1) {
      const err = new Error("room_code_ambiguous");
      err.code = "room_code_ambiguous";
      err.status = 409;
      throw err;
    }
    return matches[0];
  }

  async createRoom(options) {
    const room = {
      id: this.nextRoomId++,
      chatId: Number(options.chatId),
      roomCode: String(options.roomCode).toUpperCase(),
      status: "lobby",
      hostUserId: Number(options.hostUserId),
      turnCap: Number(options.turnCap),
      currentTurn: 0,
      winnerUserId: null,
      createdAt: new Date(options.now).toISOString(),
      startedAt: null,
      finishedAt: null,
    };
    const hostPlayer = {
      roomId: room.id,
      userId: Number(options.hostUserId),
      displayName: String(options.hostDisplayName || ""),
      ready: !!options.hostReady,
      bankrupt: false,
      tokenId: null,
      tokenSha256: null,
      joinedAt: new Date(options.now).toISOString(),
    };
    this.rooms.push(room);
    this.states.set(room.id, {
      roomId: room.id,
      version: 1,
      state: this._clone(options.state || {}),
    });
    this.players.set(room.id, [hostPlayer]);
    this.events.set(room.id, []);
    return {
      room: this._clone(room),
      state: this._clone(options.state || {}),
      version: 1,
      players: this._clone([hostPlayer]),
    };
  }

  async withRoomTransaction(chatId, roomCode, fn) {
    const room = this._resolveRoom(chatId, roomCode);
    const stateRow = this.states.get(room.id);
    return fn({
      client: null,
      room: this._clone(room),
      players: this._clone(this.players.get(room.id) || []),
      state: this._clone(stateRow.state),
      version: Number(stateRow.version),
    });
  }

  async insertRoomPlayerTx(client, roomId, userId, displayName, now) {
    const list = this.players.get(Number(roomId)) || [];
    const existing = list.find((player) => Number(player.userId) === Number(userId));
    if (existing) {
      existing.displayName = String(displayName || "");
      return;
    }
    list.push({
      roomId: Number(roomId),
      userId: Number(userId),
      displayName: String(displayName || ""),
      ready: false,
      bankrupt: false,
      tokenId: null,
      tokenSha256: null,
      joinedAt: new Date(now).toISOString(),
    });
    this.players.set(Number(roomId), list);
  }

  async getRoomPlayersTx(client, roomId) {
    return this._clone(this.players.get(Number(roomId)) || []);
  }

  async saveStateTx(client, options) {
    const roomId = Number(options.roomId);
    const room = this.rooms.find((entry) => Number(entry.id) === roomId);
    room.status = String(options.status);
    room.currentTurn = Number(options.currentTurn || 0);
    room.winnerUserId = options.winnerUserId == null ? null : Number(options.winnerUserId);
    room.startedAt = options.startedAt || null;
    room.finishedAt = options.finishedAt || null;
    this.states.set(roomId, {
      roomId,
      version: Number(options.version),
      state: this._clone(options.state || {}),
    });
  }

  async appendEventsTx(client, roomId, version, events) {
    const list = this.events.get(Number(roomId)) || [];
    for (const event of events || []) {
      list.unshift({
        type: event.type,
        version: Number(version),
        payload: this._clone(event.payload || {}),
        createdAt: event.createdAt || new Date().toISOString(),
      });
    }
    this.events.set(Number(roomId), list);
  }

  async getBootstrap(chatId, roomCode) {
    const room = this._resolveRoom(chatId, roomCode);
    const stateRow = this.states.get(room.id);
    return {
      room: this._clone(room),
      state: this._clone(stateRow.state),
      version: Number(stateRow.version),
      players: this._clone(this.players.get(room.id) || []),
      events: this._clone(this.events.get(room.id) || []),
    };
  }
}

test("player can join room created in another chat context using room code", async () => {
  const repo = new MemoryMonopolyRepo();
  const service = new MonopolyService({
    repo,
    subscribersRepo: { async ensureVisitor() {} },
    telegramService: { async sendTelegramMessage() {} },
    now: () => Date.parse("2026-03-13T10:00:00.000Z"),
    random: () => 0,
  });

  const created = await service.createRoom(createAuth(101, 5001), { turnCap: 120 });
  const joined = await service.joinRoom(createAuth(202, 9002), created.room.roomCode);

  assert.equal(joined.room.roomCode, created.room.roomCode);
  assert.equal(joined.players.length, 2);
  assert.equal(joined.me.userId, 202);

  const bootstrap = await service.getBootstrap(createAuth(202, 9002), created.room.roomCode);
  assert.equal(bootstrap.players.length, 2);
  assert.equal(bootstrap.me.userId, 202);
});
