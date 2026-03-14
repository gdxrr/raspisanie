"use strict";

const { URL } = require("url");
const { WebSocketServer } = require("ws");
const { resolveTelegramAuth } = require("../../shared/middleware/telegramAuth");

class MonopolyWsHub {
  constructor(options) {
    this.path = (options && options.path) || "/ws/monopoly";
    this.monopolyService = options && options.monopolyService;
    this.wss = new WebSocketServer({ noServer: true });
    this.roomConnections = new Map();
    this._heartbeat = null;

    this.wss.on("connection", (socket, request, params, authData) => {
      this.handleConnection(socket, params, authData).catch((err) => {
        console.error("monopoly websocket connection failed", err);
        try {
          socket.close(1011, "bootstrap_failed");
        } catch {
          socket.terminate();
        }
      });
    });
  }

  attachToServer(server) {
    server.on("upgrade", async (request, socket, head) => {
      try {
        const url = new URL(request.url, "http://localhost");
        if (url.pathname !== this.path) return;
        const authData = await resolveTelegramAuth(url.searchParams.get("initData") || "", { strict: true });
        const params = {
          roomCode: String(url.searchParams.get("roomCode") || "").trim().toUpperCase(),
        };
        if (!params.roomCode) {
          socket.write("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\nroom_code_required");
          socket.destroy();
          return;
        }
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit("connection", ws, request, params, authData);
        });
      } catch (err) {
        const status = err && err.status ? err.status : 401;
        const code = err && err.code ? err.code : "unauthorized";
        socket.write("HTTP/1.1 " + status + " Unauthorized\r\nConnection: close\r\n\r\n" + code);
        socket.destroy();
      }
    });

    if (!this._heartbeat) {
      this._heartbeat = setInterval(() => {
        for (const socket of this.wss.clients) {
          if (socket.isAlive === false) {
            socket.terminate();
            continue;
          }
          socket.isAlive = false;
          try {
            socket.ping();
          } catch {
            socket.terminate();
          }
        }
      }, 30000);
      if (typeof this._heartbeat.unref === "function") this._heartbeat.unref();
    }
  }

  async handleConnection(socket, params, authData) {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    socket.on("error", (err) => {
      console.error("monopoly websocket error", err);
    });
    socket.on("close", () => {
      this.unregister(socket);
    });

    const snapshot = await this.monopolyService.getBootstrap(authData, params.roomCode);
    socket._monopolyCtx = {
      roomId: Number(snapshot.room.id),
      userId: Number(snapshot.me && snapshot.me.userId),
    };
    this.registerRoomSocket(snapshot.room.id, socket);
    this.send(socket, "snapshot", snapshot);
  }

  registerRoomSocket(roomId, socket) {
    const key = Number(roomId);
    const set = this.roomConnections.get(key) || new Set();
    set.add(socket);
    this.roomConnections.set(key, set);
  }

  unregister(socket) {
    const ctx = socket && socket._monopolyCtx;
    if (!ctx) return;
    const set = this.roomConnections.get(Number(ctx.roomId));
    if (set) {
      set.delete(socket);
      if (!set.size) this.roomConnections.delete(Number(ctx.roomId));
    }
    delete socket._monopolyCtx;
  }

  send(socket, event, payload) {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ event, payload }));
  }

  broadcastRoom(roomId, event, payload) {
    const set = this.roomConnections.get(Number(roomId));
    if (!set || !set.size) return;
    for (const socket of set) {
      this.send(socket, event, payload);
    }
  }
}

module.exports = MonopolyWsHub;
