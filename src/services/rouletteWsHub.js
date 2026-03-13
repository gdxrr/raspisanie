"use strict";

const { URL } = require("url");
const { WebSocketServer } = require("ws");
const { resolveTelegramAuth } = require("../middleware/telegramAuth");

class RouletteWsHub {
  constructor(options) {
    this.path = (options && options.path) || "/ws/roulette";
    this.rouletteService = options && options.rouletteService;
    this.wss = new WebSocketServer({ noServer: true });
    this.roomConnections = new Map();
    this.userConnections = new Map();
    this._heartbeat = null;

    this.wss.on("connection", (socket, request, authData) => {
      this.handleConnection(socket, request, authData).catch((err) => {
        console.error("roulette websocket connection failed", err);
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
        if (url.pathname !== this.path) {
          return;
        }

        const authData = await resolveTelegramAuth(url.searchParams.get("initData") || "", { strict: true });
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit("connection", ws, request, authData);
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
      if (typeof this._heartbeat.unref === "function") {
        this._heartbeat.unref();
      }
    }
  }

  async handleConnection(socket, request, authData) {
    const ctx = this.rouletteService.getContext(authData);
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    socket.on("error", (err) => {
      console.error("roulette websocket error", err);
    });
    socket.on("close", () => {
      this.unregister(socket);
    });

    socket._rouletteCtx = {
      roomId: ctx.roomId,
      userId: ctx.userId,
    };
    this.registerRoomSocket(ctx.roomId, socket);
    this.registerUserSocket(ctx.userId, socket);

    const snapshot = await this.rouletteService.getBootstrap(authData);
    this.send(socket, "snapshot", snapshot);
  }

  registerRoomSocket(roomId, socket) {
    const key = String(roomId);
    const set = this.roomConnections.get(key) || new Set();
    set.add(socket);
    this.roomConnections.set(key, set);
  }

  registerUserSocket(userId, socket) {
    const key = Number(userId);
    const set = this.userConnections.get(key) || new Set();
    set.add(socket);
    this.userConnections.set(key, set);
  }

  unregister(socket) {
    const ctx = socket && socket._rouletteCtx;
    if (!ctx) return;

    const roomSet = this.roomConnections.get(String(ctx.roomId));
    if (roomSet) {
      roomSet.delete(socket);
      if (roomSet.size === 0) {
        this.roomConnections.delete(String(ctx.roomId));
      }
    }

    const userSet = this.userConnections.get(Number(ctx.userId));
    if (userSet) {
      userSet.delete(socket);
      if (userSet.size === 0) {
        this.userConnections.delete(Number(ctx.userId));
      }
    }
    delete socket._rouletteCtx;
  }

  send(socket, event, payload) {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ event, payload }));
  }

  broadcastRoom(roomId, event, payload) {
    const set = this.roomConnections.get(String(roomId));
    if (!set || set.size === 0) return;
    for (const socket of set) {
      this.send(socket, event, payload);
    }
  }

  broadcastUser(userId, event, payload) {
    const set = this.userConnections.get(Number(userId));
    if (!set || set.size === 0) return;
    for (const socket of set) {
      this.send(socket, event, payload);
    }
  }
}

module.exports = RouletteWsHub;
