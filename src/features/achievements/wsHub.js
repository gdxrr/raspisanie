"use strict";

const { URL } = require("url");
const { WebSocketServer } = require("ws");
const { resolveTelegramAuth } = require("../../shared/middleware/telegramAuth");

class AchievementsWsHub {
  constructor(options) {
    this.path = (options && options.path) || "/ws/achievements";
    this.achievementsService = options && options.achievementsService;
    this.wss = new WebSocketServer({ noServer: true });
    this._heartbeat = null;

    this.wss.on("connection", (socket, request, authData) => {
      this.handleConnection(socket, authData).catch((err) => {
        console.error("achievements websocket connection failed", err);
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

  async handleConnection(socket, authData) {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    socket.on("error", (err) => {
      console.error("achievements websocket error", err);
    });

    const snapshot = await this.achievementsService.getBootstrap(authData);
    this.send(socket, "snapshot", snapshot);
  }

  send(socket, event, payload) {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ event, payload }));
  }

  broadcastAll(event, payload) {
    for (const socket of this.wss.clients) {
      this.send(socket, event, payload);
    }
  }
}

module.exports = AchievementsWsHub;
