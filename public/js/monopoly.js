import { state } from "./state.js";
import { escapeHtml, showToast, getApiHeaders } from "./utils.js";

function monopolyCurrentUserId() {
  return window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user
    ? Number(window.Telegram.WebApp.initDataUnsafe.user.id)
    : null;
}

function monopolySetStatus(text) {
  const statusEl = document.getElementById("monopolyStatusText");
  if (statusEl) statusEl.textContent = text;
}

function monopolyCanUseSocket() {
  return !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData && typeof WebSocket !== "undefined");
}

function monopolyUpdateSnapshot(snapshot) {
  const monopolyState = state.monopolyState;
  if (!snapshot) return;
  const localUserId = monopolyCurrentUserId();
  if (Array.isArray(snapshot.players)) {
    snapshot.me =
      snapshot.players.find(function (player) {
        return Number(player.userId) === Number(localUserId);
      }) || null;
    const activePlayers = snapshot.players.filter(function (player) {
      return !player.bankrupt;
    });
    const readyPlayers = activePlayers.filter(function (player) {
      return !!player.ready;
    });
    snapshot.canStart =
      !!(snapshot.room && Number(snapshot.room.hostUserId) === Number(localUserId) && snapshot.room.status === "lobby" && activePlayers.length >= 2 && activePlayers.length <= 4 && readyPlayers.length === activePlayers.length);
  }
  monopolyState.snapshot = snapshot;
  monopolyState.roomCode = snapshot.room && snapshot.room.roomCode ? String(snapshot.room.roomCode) : monopolyState.roomCode;
  const roomInput = document.getElementById("monopolyRoomCodeInput");
  if (roomInput && monopolyState.roomCode) roomInput.value = monopolyState.roomCode;
  monopolyRender();
}

function monopolyHandleApiError(data, fallback) {
  const code = data && data.error ? String(data.error) : "";
  if (code === "unauthorized") return "Откройте приложение из Telegram Mini App";
  if (code === "room_not_found") return "Комната не найдена";
  if (code === "room_is_full") return "Комната уже заполнена";
  if (code === "room_not_in_lobby") return "Партия уже началась";
  if (code === "duplicate_token_in_room") return "Такая фишка уже используется в комнате";
  if (code === "token_too_large") return "Файл больше 1MB";
  if (code === "unsupported_mime_type") return "Нужен PNG или JPG";
  return fallback || "Ошибка";
}

async function monopolyApi(path, options) {
  const request = options || {};
  const method = request.method || "GET";
  const headers = request.formData ? getApiHeaders(false) : getApiHeaders(method !== "GET");
  const init = {
    method,
    headers,
  };
  if (request.formData) {
    init.body = request.formData;
    delete init.headers["Content-Type"];
  } else if (request.body != null) {
    init.body = JSON.stringify(request.body);
  }
  const res = await fetch(path, init);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message = monopolyHandleApiError(data, "Не удалось выполнить действие");
    const err = new Error(message);
    err.code = data && data.error ? data.error : "request_failed";
    throw err;
  }
  return data;
}

function monopolyBuildSocketUrl() {
  const monopolyState = state.monopolyState;
  if (!monopolyCanUseSocket() || !monopolyState.roomCode) return "";
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return protocol + window.location.host + "/ws/monopoly?roomCode=" + encodeURIComponent(monopolyState.roomCode) + "&initData=" + encodeURIComponent(window.Telegram.WebApp.initData);
}

function monopolyDisconnectSocket() {
  const monopolyState = state.monopolyState;
  if (monopolyState.reconnectTimer) {
    clearTimeout(monopolyState.reconnectTimer);
    monopolyState.reconnectTimer = null;
  }
  if (monopolyState.socket) {
    try {
      monopolyState.socket.onclose = null;
      monopolyState.socket.close();
    } catch {}
    monopolyState.socket = null;
  }
}

function monopolyScheduleReconnect() {
  const monopolyState = state.monopolyState;
  const overlay = document.getElementById("monopolyOverlay");
  if (!overlay || !overlay.classList.contains("open")) return;
  if (!monopolyState.roomCode || monopolyState.reconnectTimer) return;
  const delay = Math.min(6000, 1000 + monopolyState.reconnectAttempts * 700);
  monopolyState.reconnectTimer = setTimeout(function () {
    monopolyState.reconnectTimer = null;
    monopolyConnectSocket();
  }, delay);
}

function monopolyConnectSocket() {
  const monopolyState = state.monopolyState;
  const url = monopolyBuildSocketUrl();
  if (!url) return;
  monopolyDisconnectSocket();
  try {
    const socket = new WebSocket(url);
    monopolyState.socket = socket;
    socket.onopen = function () {
      monopolyState.reconnectAttempts = 0;
    };
    socket.onmessage = function (message) {
      try {
        const data = JSON.parse(message.data || "{}");
        if (data.event === "snapshot" && data.payload) {
          monopolyUpdateSnapshot(data.payload);
          return;
        }
        if (data.event === "player_token_updated" && data.payload && data.payload.snapshot) {
          monopolyUpdateSnapshot(data.payload.snapshot);
          return;
        }
      } catch (e) {
        console.error("Failed to parse monopoly websocket message", e);
      }
      if (monopolyState.roomCode) {
        monopolyLoadBootstrap(monopolyState.roomCode).catch(function () {});
      }
    };
    socket.onclose = function () {
      monopolyState.socket = null;
      monopolyState.reconnectAttempts += 1;
      monopolyScheduleReconnect();
    };
    socket.onerror = function (e) {
      console.error("Monopoly websocket error", e);
    };
  } catch (e) {
    console.error("Failed to connect monopoly websocket", e);
    monopolyScheduleReconnect();
  }
}

function monopolyFormatRemaining(deadline) {
  if (!deadline) return "—";
  const ms = Date.parse(deadline) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return mm + ":" + ss;
}

function monopolyOwnerName(snapshot, userId) {
  if (!snapshot || userId == null) return "Банк";
  const player = (snapshot.players || []).find(function (p) {
    return Number(p.userId) === Number(userId);
  });
  return player ? player.displayName : "Банк";
}

function monopolyRenderBoard(snapshot) {
  const boardEl = document.getElementById("monopolyBoardGrid");
  if (!boardEl) return;
  if (!snapshot || !Array.isArray(snapshot.board)) {
    boardEl.innerHTML = "";
    return;
  }
  const ownership = (snapshot.state && snapshot.state.ownership) || {};
  boardEl.innerHTML = snapshot.board
    .map(function (cell) {
      const ownerId = ownership[String(cell.index)];
      const ownerText = ownerId == null ? "Банк" : monopolyOwnerName(snapshot, ownerId);
      const sub = cell.type === "property" ? "$" + String(cell.price || 0) + " / rent $" + String(cell.rent || 0) : cell.type;
      return (
        '<div class="monopoly-cell">' +
        '<div class="monopoly-cell-title">' +
        escapeHtml(String(cell.index) + ". " + (cell.name || "")) +
        "</div>" +
        '<div class="monopoly-cell-sub">' +
        escapeHtml(sub) +
        "</div>" +
        '<div class="monopoly-cell-owner">' +
        escapeHtml(ownerText) +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

function monopolyRenderPlayers(snapshot) {
  const listEl = document.getElementById("monopolyPlayersList");
  const tradeTargetEl = document.getElementById("monopolyTradeTarget");
  if (listEl) {
    if (!snapshot || !Array.isArray(snapshot.players) || !snapshot.players.length) {
      listEl.innerHTML = "";
    } else {
      listEl.innerHTML = snapshot.players
        .map(function (player) {
          const badges = [];
          if (player.ready) badges.push("ready");
          if (player.bankrupt) badges.push("bankrupt");
          if (snapshot.room && Number(snapshot.room.hostUserId) === Number(player.userId)) badges.push("host");
          const token = player.tokenUrl
            ? '<img class="monopoly-token" src="' + escapeHtml(player.tokenUrl) + '" alt="token">'
            : '<div class="monopoly-token"></div>';
          return (
            '<div class="monopoly-player-row">' +
            '<div class="monopoly-player-main">' +
            token +
            '<div>' +
            '<div class="monopoly-player-name">' +
            escapeHtml(player.displayName || ("ID " + String(player.userId))) +
            "</div>" +
            '<div class="monopoly-player-meta">$' +
            escapeHtml(String(player.cash || 0)) +
            " • pos " +
            escapeHtml(String(player.position || 0)) +
            (player.inJail ? " • jail" : "") +
            "</div>" +
            "</div></div>" +
            '<div class="monopoly-player-badge">' +
            escapeHtml(badges.join(", ") || "playing") +
            "</div>" +
            "</div>"
          );
        })
        .join("");
    }
  }
  if (tradeTargetEl) {
    const meId = snapshot && snapshot.me ? Number(snapshot.me.userId) : null;
    tradeTargetEl.innerHTML = (snapshot && Array.isArray(snapshot.players) ? snapshot.players : [])
      .filter(function (player) {
        return Number(player.userId) !== Number(meId) && !player.bankrupt;
      })
      .map(function (player) {
        return '<option value="' + String(player.userId) + '">' + escapeHtml(player.displayName || ("ID " + String(player.userId))) + "</option>";
      })
      .join("");
  }
}

function monopolyRenderHistory(snapshot) {
  const historyEl = document.getElementById("monopolyHistory");
  if (!historyEl) return;
  const list = snapshot && snapshot.state && Array.isArray(snapshot.state.history) ? snapshot.state.history : [];
  historyEl.innerHTML = list.length
    ? list
        .slice(0, 20)
        .map(function (entry) {
          return '<div class="monopoly-history-item">' + escapeHtml((entry.message || entry.type || "") + " • " + (entry.createdAt || "")) + "</div>";
        })
        .join("")
    : '<div class="monopoly-history-item">История действий появится после начала игры.</div>';
}

function monopolyRenderActions(snapshot) {
  const phase = snapshot && snapshot.state ? snapshot.state.phase : "";
  const meId = snapshot && snapshot.me ? Number(snapshot.me.userId) : null;
  const isMyTurn = snapshot && snapshot.state && Number(snapshot.state.activePlayerId) === Number(meId);
  const pendingKind = snapshot && snapshot.state && snapshot.state.pending ? snapshot.state.pending.kind : "";
  const canStart = !!(snapshot && snapshot.canStart);
  const readyBtn = document.getElementById("monopolyReadyBtn");
  const startBtn = document.getElementById("monopolyStartBtn");
  const rollBtn = document.getElementById("monopolyRollBtn");
  const endBtn = document.getElementById("monopolyEndTurnBtn");
  const buyBtn = document.getElementById("monopolyBuyBtn");
  const declineBtn = document.getElementById("monopolyDeclineBtn");
  if (readyBtn) readyBtn.disabled = !(snapshot && snapshot.room && snapshot.room.status === "lobby" && snapshot.me);
  if (startBtn) startBtn.disabled = !canStart;
  if (rollBtn) rollBtn.disabled = !(phase === "turn" && isMyTurn);
  if (endBtn) endBtn.disabled = !(phase === "turn" && isMyTurn);
  if (buyBtn) buyBtn.disabled = !(phase === "await_buy" && pendingKind === "buy_offer");
  if (declineBtn) declineBtn.disabled = !(phase === "await_buy" && pendingKind === "buy_offer");
}

function monopolyRender() {
  const monopolyState = state.monopolyState;
  const snapshot = monopolyState.snapshot;
  const roomMetaEl = document.getElementById("monopolyRoomMeta");
  if (!snapshot) {
    monopolySetStatus("Создайте комнату или введите код комнаты");
    if (roomMetaEl) roomMetaEl.textContent = "Нет активной комнаты";
    monopolyRenderBoard(null);
    monopolyRenderPlayers(null);
    monopolyRenderHistory(null);
    monopolyRenderActions(null);
    return;
  }
  const phase = snapshot.state && snapshot.state.phase ? snapshot.state.phase : "lobby";
  const turnTimer = monopolyFormatRemaining(phase === "turn" ? snapshot.state.turnDeadlineAt : snapshot.state.phaseDeadlineAt);
  monopolySetStatus("Комната " + snapshot.room.roomCode + " • Фаза: " + phase + " • Таймер: " + turnTimer);
  if (roomMetaEl) {
    roomMetaEl.textContent =
      "Игроков: " +
      String((snapshot.players || []).length) +
      " • Лимит ходов: " +
      String(snapshot.room.turnCap || 120) +
      " • Текущий ход: " +
      String(snapshot.state.turnCount || 0);
  }
  monopolyRenderBoard(snapshot);
  monopolyRenderPlayers(snapshot);
  monopolyRenderHistory(snapshot);
  monopolyRenderActions(snapshot);
}

async function monopolyLoadBootstrap(roomCode) {
  const monopolyState = state.monopolyState;
  const code = String(roomCode || monopolyState.roomCode || "").trim().toUpperCase();
  if (!code) return;
  const snapshot = await monopolyApi("/api/monopoly/rooms/" + encodeURIComponent(code) + "/bootstrap", { method: "GET" });
  monopolyUpdateSnapshot(snapshot);
}

export async function monopolyCreateRoom() {
  const monopolyState = state.monopolyState;
  try {
    const capInput = document.getElementById("monopolyTurnCapInput");
    const turnCap = capInput ? Number(capInput.value || 120) : 120;
    const snapshot = await monopolyApi("/api/monopoly/rooms", {
      method: "POST",
      body: { turnCap: turnCap },
    });
    monopolyUpdateSnapshot(snapshot);
    monopolyConnectSocket();
  } catch (e) {
    showToast(e.message || "Не удалось создать комнату");
  }
}

export async function monopolyJoinRoom() {
  const monopolyState = state.monopolyState;
  const input = document.getElementById("monopolyRoomCodeInput");
  const roomCode = input ? String(input.value || "").trim().toUpperCase() : "";
  if (!roomCode) {
    showToast("Введите код комнаты");
    return;
  }
  try {
    const snapshot = await monopolyApi("/api/monopoly/rooms/join", {
      method: "POST",
      body: { roomCode: roomCode },
    });
    monopolyUpdateSnapshot(snapshot);
    monopolyConnectSocket();
  } catch (e) {
    showToast(e.message || "Не удалось войти в комнату");
  }
}

export async function monopolySetReady() {
  const monopolyState = state.monopolyState;
  if (!monopolyState.snapshot) return;
  try {
    const readyNow = monopolyState.snapshot.me ? !!monopolyState.snapshot.me.ready : false;
    const snapshot = await monopolyApi("/api/monopoly/rooms/" + encodeURIComponent(monopolyState.roomCode) + "/ready", {
      method: "POST",
      body: { ready: !readyNow },
    });
    monopolyUpdateSnapshot(snapshot);
  } catch (e) {
    showToast(e.message || "Не удалось изменить готовность");
  }
}

export async function monopolyStartGame() {
  await monopolyAction("start_game", {});
}

async function monopolyAction(type, payload) {
  const monopolyState = state.monopolyState;
  if (!monopolyState.roomCode) {
    showToast("Сначала войдите в комнату");
    return;
  }
  try {
    const snapshot = await monopolyApi("/api/monopoly/rooms/" + encodeURIComponent(monopolyState.roomCode) + "/action", {
      method: "POST",
      body: {
        type: type,
        payload: payload || {},
      },
    });
    monopolyUpdateSnapshot(snapshot);
  } catch (e) {
    showToast(e.message || "Действие отклонено");
  }
}

export function monopolyBid() {
  const amountEl = document.getElementById("monopolyBidAmount");
  const amount = amountEl ? Number(amountEl.value || 0) : 0;
  if (!Number.isInteger(amount) || amount <= 0) {
    showToast("Укажите корректную ставку");
    return;
  }
  monopolyAction("auction_bid", { amount: amount });
}

export function monopolyOfferTrade() {
  const targetEl = document.getElementById("monopolyTradeTarget");
  const offerCashEl = document.getElementById("monopolyTradeOfferCash");
  const requestCashEl = document.getElementById("monopolyTradeRequestCash");
  const offerPropsEl = document.getElementById("monopolyTradeOfferProps");
  const requestPropsEl = document.getElementById("monopolyTradeRequestProps");
  const targetUserId = targetEl ? Number(targetEl.value || 0) : 0;
  if (!targetUserId) {
    showToast("Выберите игрока для сделки");
    return;
  }
  const parseProps = function (raw) {
    return String(raw || "")
      .split(",")
      .map(function (item) {
        return Number(String(item).trim());
      })
      .filter(function (value) {
        return Number.isInteger(value) && value >= 0 && value <= 39;
      });
  };
  monopolyAction("offer_trade", {
    targetUserId: targetUserId,
    offerCash: offerCashEl ? Number(offerCashEl.value || 0) : 0,
    requestCash: requestCashEl ? Number(requestCashEl.value || 0) : 0,
    offerProperties: parseProps(offerPropsEl ? offerPropsEl.value : ""),
    requestProperties: parseProps(requestPropsEl ? requestPropsEl.value : ""),
  });
}

export function monopolyRespondTrade(accept) {
  monopolyAction("respond_trade", { accept: !!accept });
}

export function monopolyRequestLeave() {
  monopolyAction("leave_request", {});
}

export function monopolyVoteLeave(approve) {
  monopolyAction("vote_leave", { approve: !!approve });
}

export async function monopolyUploadToken(inputEl) {
  const monopolyState = state.monopolyState;
  if (!inputEl || !inputEl.files || !inputEl.files.length) return;
  if (!monopolyState.roomCode) {
    showToast("Сначала войдите в комнату");
    inputEl.value = "";
    return;
  }
  const file = inputEl.files[0];
  const formData = new FormData();
  formData.append("token", file);
  try {
    const data = await monopolyApi("/api/monopoly/rooms/" + encodeURIComponent(monopolyState.roomCode) + "/token", {
      method: "POST",
      formData: formData,
    });
    if (data && data.snapshot) monopolyUpdateSnapshot(data.snapshot);
    showToast("Фишка обновлена");
  } catch (e) {
    showToast(e.message || "Не удалось загрузить фишку");
  } finally {
    inputEl.value = "";
  }
}

export function openMonopolyModal() {
  const monopolyState = state.monopolyState;
  document.getElementById("monopolyOverlay").classList.add("open");
  monopolyRender();
  if (monopolyState.roomCode) {
    monopolyLoadBootstrap(monopolyState.roomCode)
      .then(function () {
        monopolyConnectSocket();
      })
      .catch(function () {});
  }
}

export function closeMonopolyModal() {
  document.getElementById("monopolyOverlay").classList.remove("open");
  monopolyDisconnectSocket();
}

export function initMonopoly() {
  const overlay = document.getElementById("monopolyOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this) closeMonopolyModal();
    });
  }
  setInterval(function () {
    const ov = document.getElementById("monopolyOverlay");
    if (!ov || !ov.classList.contains("open")) return;
    monopolyRender();
  }, 500);
}
