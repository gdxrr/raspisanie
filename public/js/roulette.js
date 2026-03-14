import { state } from "./state.js";
import { escapeHtml, showToast, getApiHeaders } from "./utils.js";
import { ROULETTE_RED_NUMBERS, ROULETTE_SPECIAL_BETS, ROULETTE_WHEEL_ORDER } from "./constants.js";

function rouletteColorForNumber(number) {
  const value = Number(number);
  if (!Number.isInteger(value) || value < 0 || value > 36) return null;
  if (value === 0) return "green";
  return ROULETTE_RED_NUMBERS.has(value) ? "red" : "black";
}

function rouletteCurrentUserId() {
  if (!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user)) return null;
  const id = window.Telegram.WebApp.initDataUnsafe.user.id;
  return id != null ? Number(id) : null;
}

function rouletteSelectionKey(kind, value) {
  return String(kind) + ":" + String(value);
}

function rouletteFormatCoins(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("ru-RU") + " мон.";
}

function rouletteFormatBetLabel(kind, value) {
  if (kind === "number") return "Число " + value;
  if (kind === "color") return value === "red" ? "Красное" : "Чёрное";
  if (kind === "parity") return value === "even" ? "Чётное" : "Нечётное";
  return String(value);
}

function rouletteFormatHistoryLabel(entry) {
  if (!entry) return "—";
  return "Выпало " + entry.winningNumber;
}

function rouletteGetRemainingMs() {
  const rouletteState = state.rouletteState;
  const round = rouletteState.currentRound;
  if (!round) return 0;
  if (round.status === "open" && round.closesAt) {
    return Math.max(0, Date.parse(round.closesAt) - Date.now());
  }
  if (round.status === "spinning" && round.spunAt) {
    return Math.max(0, Date.parse(round.spunAt) + 6000 - Date.now());
  }
  return 0;
}

function rouletteFormatCountdown(ms) {
  if (ms <= 0) return "0 c";
  return Math.ceil(ms / 1000) + " c";
}

function rouletteCanBet() {
  const rouletteState = state.rouletteState;
  return rouletteState.available === true && rouletteState.currentRound && rouletteState.currentRound.status === "open" && rouletteGetRemainingMs() > 0;
}

function rouletteEnsureBoard() {
  const rouletteState = state.rouletteState;
  if (rouletteState.boardReady) return;
  const zeroEl = document.getElementById("rouletteZeroBoard");
  const numbersEl = document.getElementById("rouletteNumberBoard");
  const specialEl = document.getElementById("rouletteSpecialBoard");
  if (!zeroEl || !numbersEl || !specialEl) return;

  zeroEl.innerHTML =
    '<button type="button" class="roulette-number-btn green" data-kind="number" data-value="0" onclick="rouletteAddDraftBet(\'number\',\'0\')">0</button>';

  numbersEl.innerHTML = Array.from({ length: 36 }, function (_, index) {
    const number = index + 1;
    const color = rouletteColorForNumber(number);
    return (
      '<button type="button" class="roulette-number-btn ' +
      color +
      '" data-kind="number" data-value="' +
      number +
      '" onclick="rouletteAddDraftBet(\'number\',\'' +
      number +
      '\')">' +
      number +
      "</button>"
    );
  }).join("");

  specialEl.innerHTML = ROULETTE_SPECIAL_BETS.map(function (bet) {
    return (
      '<button type="button" class="roulette-special-btn ' +
      bet.accent +
      '" data-kind="' +
      bet.kind +
      '" data-value="' +
      bet.value +
      '" onclick="rouletteAddDraftBet(\'' +
      bet.kind +
      '\',\'' +
      bet.value +
      '\')">' +
      escapeHtml(bet.label) +
      "</button>"
    );
  }).join("");

  rouletteState.boardReady = true;
}

function rouletteDrawWheel() {
  const canvas = document.getElementById("rouletteWheelCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 6;
  const innerRadius = radius * 0.3;
  const sector = (Math.PI * 2) / ROULETTE_WHEEL_ORDER.length;
  const styles = getComputedStyle(document.documentElement);
  const redColor = (styles.getPropertyValue("--red") || "#ff453a").trim();
  const greenColor = (styles.getPropertyValue("--green") || "#30d158").trim();
  const textColor = (styles.getPropertyValue("--text") || "#ffffff").trim();

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);

  for (let i = 0; i < ROULETTE_WHEEL_ORDER.length; i++) {
    const number = ROULETTE_WHEEL_ORDER[i];
    const color = rouletteColorForNumber(number);
    const start = -Math.PI / 2 - sector / 2 + i * sector;
    const end = start + sector;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = color === "green" ? greenColor : color === "red" ? redColor : "#191a1f";
    ctx.fill();

    ctx.save();
    ctx.rotate(start + sector / 2);
    ctx.translate(0, -radius * 0.78);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number), 0, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.12;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function rouletteSetWheelInstant(number) {
  const rouletteState = state.rouletteState;
  const rotor = document.getElementById("rouletteWheelRotor");
  if (!rotor) return;
  const idx = ROULETTE_WHEEL_ORDER.indexOf(Number(number));
  if (idx < 0) return;
  const sectorDeg = 360 / ROULETTE_WHEEL_ORDER.length;
  const target = (360 - idx * sectorDeg) % 360;
  rouletteState.wheelRotation = target;
  rotor.style.transition = "none";
  rotor.style.transform = "rotate(" + target + "deg)";
}

function rouletteAnimateToNumber(number, durationMs) {
  const rouletteState = state.rouletteState;
  const rotor = document.getElementById("rouletteWheelRotor");
  if (!rotor) return;
  const idx = ROULETTE_WHEEL_ORDER.indexOf(Number(number));
  if (idx < 0) return;

  const sectorDeg = 360 / ROULETTE_WHEEL_ORDER.length;
  const baseTarget = (360 - idx * sectorDeg) % 360;
  const current = ((rouletteState.wheelRotation % 360) + 360) % 360;
  let delta = baseTarget - current;
  if (delta < 0) delta += 360;
  const extraTurns = durationMs > 1200 ? 360 * 5 : 0;
  const nextRotation = rouletteState.wheelRotation + delta + extraTurns;
  rouletteState.wheelRotation = nextRotation;
  rotor.style.transition = "transform " + Math.max(durationMs, 600) / 1000 + "s cubic-bezier(.12,.73,.15,1)";
  requestAnimationFrame(function () {
    rotor.style.transform = "rotate(" + nextRotation + "deg)";
  });
}

function rouletteUpdateChipUi() {
  const rouletteSelectedChip = state.rouletteSelectedChip;
  const amountEl = document.getElementById("rouletteBetAmount");
  if (amountEl) amountEl.value = String(rouletteSelectedChip);
  document.querySelectorAll("#rouletteChipRow .roulette-chip").forEach(function (btn) {
    btn.classList.toggle("active", Number(btn.getAttribute("data-amount")) === Number(rouletteSelectedChip));
  });
}

export function rouletteSelectChip(amount) {
  state.rouletteSelectedChip = Number(amount) || 25;
  rouletteUpdateChipUi();
}

export function rouletteSyncChipInput() {
  const input = document.getElementById("rouletteBetAmount");
  if (!input) return;
  const amount = Number(input.value);
  if (Number.isInteger(amount) && amount > 0) {
    state.rouletteSelectedChip = amount;
  }
  rouletteUpdateChipUi();
}

function rouletteUpsertDraftBet(kind, value, amount) {
  const rouletteState = state.rouletteState;
  const key = rouletteSelectionKey(kind, value);
  const idx = rouletteState.draftBets.findIndex(function (item) {
    return rouletteSelectionKey(item.kind, item.value) === key;
  });
  if (idx >= 0) rouletteState.draftBets[idx].amount += amount;
  else rouletteState.draftBets.push({ kind: kind, value: String(value), amount: amount });
}

export function rouletteAddDraftBet(kind, value) {
  if (!rouletteCanBet()) {
    showToast("Ставки сейчас закрыты");
    return;
  }
  rouletteSyncChipInput();
  const amount = Number(state.rouletteSelectedChip);
  if (!Number.isInteger(amount) || amount <= 0) {
    showToast("Введите размер фишки");
    return;
  }
  rouletteUpsertDraftBet(kind, value, amount);
  rouletteRenderDraft();
  rouletteRefreshBoardState();
}

export function rouletteRemoveDraftBet(key) {
  const rouletteState = state.rouletteState;
  rouletteState.draftBets = rouletteState.draftBets.filter(function (item) {
    return rouletteSelectionKey(item.kind, item.value) !== key;
  });
  rouletteRenderDraft();
  rouletteRefreshBoardState();
}

export function rouletteClearDraft() {
  const rouletteState = state.rouletteState;
  rouletteState.draftBets = [];
  rouletteRenderDraft();
  rouletteRefreshBoardState();
}

function rouletteRenderDraft() {
  const rouletteState = state.rouletteState;
  const listEl = document.getElementById("rouletteDraftList");
  const submitBtn = document.getElementById("rouletteSubmitBtn");
  if (!listEl) return;
  if (!rouletteState.draftBets.length) {
    listEl.innerHTML = "";
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  listEl.innerHTML = rouletteState.draftBets
    .map(function (bet) {
      const key = rouletteSelectionKey(bet.kind, bet.value);
      return (
        '<div class="roulette-draft-item">' +
        '<div class="roulette-draft-meta">' +
        '<span class="roulette-draft-label">' +
        escapeHtml(rouletteFormatBetLabel(bet.kind, bet.value)) +
        "</span>" +
        '<span class="roulette-draft-sub">' +
        escapeHtml(rouletteFormatCoins(bet.amount)) +
        "</span>" +
        "</div>" +
        '<div class="roulette-draft-actions">' +
        '<span class="roulette-pill">' +
        escapeHtml(rouletteFormatCoins(bet.amount)) +
        "</span>" +
        '<button type="button" class="roulette-remove-btn" onclick="rouletteRemoveDraftBet(\'' +
        key +
        '\')">×</button>' +
        "</div>" +
        "</div>"
      );
    })
    .join("");
  if (submitBtn) submitBtn.disabled = !rouletteCanBet() || !rouletteState.draftBets.length;
}

function rouletteRenderMyBets() {
  const rouletteState = state.rouletteState;
  const listEl = document.getElementById("rouletteMyBets");
  if (!listEl) return;
  listEl.innerHTML = Array.isArray(rouletteState.myBets)
    ? rouletteState.myBets
        .map(function (bet) {
          return (
            '<div class="roulette-list-item">' +
            '<div class="roulette-list-meta">' +
            '<span class="roulette-list-label">' +
            escapeHtml(rouletteFormatBetLabel(bet.kind, bet.value)) +
            "</span>" +
            '<span class="roulette-list-sub">' +
            escapeHtml(rouletteFormatCoins(bet.amount)) +
            "</span>" +
            "</div>" +
            '<span class="roulette-pill">' +
            escapeHtml(rouletteFormatCoins(bet.amount)) +
            "</span>" +
            "</div>"
          );
        })
        .join("")
    : "";
}

function rouletteRenderHistory() {
  const rouletteState = state.rouletteState;
  const listEl = document.getElementById("rouletteHistory");
  if (!listEl) return;
  listEl.innerHTML = Array.isArray(rouletteState.history)
    ? rouletteState.history
        .slice(0, 10)
        .map(function (entry) {
          const color = entry && entry.winningColor ? entry.winningColor : rouletteColorForNumber(entry.winningNumber);
          return (
            '<div class="roulette-history-item">' +
            '<div class="roulette-history-meta">' +
            '<span class="roulette-history-label">' +
            escapeHtml(rouletteFormatHistoryLabel(entry)) +
            "</span>" +
            '<span class="roulette-history-sub">' +
            escapeHtml((entry && entry.settledAt ? new Date(entry.settledAt) : new Date()).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })) +
            "</span>" +
            "</div>" +
            '<span class="roulette-pill ' +
            color +
            '">' +
            escapeHtml(String(entry.winningNumber)) +
            "</span>" +
            "</div>"
          );
        })
        .join("")
    : "";
}

function rouletteRenderAdminPanel() {
  const rouletteState = state.rouletteState;
  const card = document.getElementById("rouletteAdminCard");
  const select = document.getElementById("rouletteAdminUser");
  const log = document.getElementById("rouletteAdminGrants");
  if (!card || !select || !log) return;
  card.style.display = rouletteState.isAdmin ? "" : "none";
  if (!rouletteState.isAdmin) return;

  const prevValue = select.value;
  const participants = Array.isArray(rouletteState.participants) ? rouletteState.participants.slice() : [];
  participants.sort(function (a, b) {
    return String(a.displayName || "").localeCompare(String(b.displayName || ""), "ru");
  });

  select.innerHTML = participants.length
    ? participants
        .map(function (item) {
          return (
            '<option value="' +
            item.userId +
            '">' +
            escapeHtml(item.displayName || "ID " + item.userId) +
            " • " +
            escapeHtml(rouletteFormatCoins(item.balance || 0)) +
            "</option>"
          );
        })
        .join("")
    : '<option value="">Пока нет игроков</option>';
  if (prevValue && participants.some(function (item) { return String(item.userId) === String(prevValue); })) {
    select.value = prevValue;
  }

  log.innerHTML = Array.isArray(rouletteState.adminGrants)
    ? rouletteState.adminGrants
        .slice(0, 10)
        .map(function (entry) {
          return (
            '<div class="roulette-admin-item">' +
            '<div class="roulette-admin-meta">' +
            '<span class="roulette-admin-label">' +
            escapeHtml(entry.displayName || "ID " + entry.userId) +
            "</span>" +
            '<span class="roulette-admin-sub">' +
            escapeHtml(entry.note || "Без комментария") +
            "</span>" +
            "</div>" +
            '<span class="roulette-admin-amount">+' +
            escapeHtml(rouletteFormatCoins(entry.amount || 0)) +
            "</span>" +
            "</div>"
          );
        })
        .join("")
    : "";
}

function rouletteRefreshBoardState() {
  const rouletteState = state.rouletteState;
  const selected = new Set(
    rouletteState.draftBets.map(function (bet) {
      return rouletteSelectionKey(bet.kind, bet.value);
    })
  );
  const disabled = !rouletteCanBet();
  document.querySelectorAll("#rouletteOverlay .roulette-number-btn, #rouletteOverlay .roulette-special-btn").forEach(function (btn) {
    const key = rouletteSelectionKey(btn.getAttribute("data-kind"), btn.getAttribute("data-value"));
    btn.classList.toggle("selected", selected.has(key));
    btn.classList.toggle("disabled", disabled);
    btn.disabled = disabled;
  });
}

function rouletteRenderStatus() {
  const rouletteState = state.rouletteState;
  const statusEl = document.getElementById("rouletteStatusText");
  const balanceEl = document.getElementById("rouletteBalance");
  const timerEl = document.getElementById("rouletteRoundTimer");
  const potEl = document.getElementById("roulettePot");
  const unavailableEl = document.getElementById("rouletteUnavailable");
  const contentEl = document.getElementById("rouletteContent");
  const resultEl = document.getElementById("rouletteLastResult");
  const centerEl = document.getElementById("rouletteWheelCenter");

  if (balanceEl) balanceEl.textContent = rouletteState.wallet ? rouletteFormatCoins(rouletteState.wallet.balance) : "—";
  if (potEl) potEl.textContent = rouletteState.currentRound ? rouletteFormatCoins(rouletteState.currentRound.totalAmount || 0) : "—";
  if (timerEl) timerEl.textContent = rouletteState.currentRound ? rouletteFormatCountdown(rouletteGetRemainingMs()) : "—";

  if (rouletteState.available === false) {
    if (unavailableEl) unavailableEl.style.display = "";
    if (contentEl) contentEl.style.display = "none";
    if (statusEl) statusEl.textContent = rouletteState.statusText || "Рулетка недоступна";
    if (unavailableEl) unavailableEl.textContent = rouletteState.statusText || "Рулетка недоступна в текущем режиме.";
    return;
  }

  if (unavailableEl) unavailableEl.style.display = "none";
  if (contentEl) contentEl.style.display = "";

  let statusText = rouletteState.statusText || "Ожидание данных";
  if (rouletteState.currentRound) {
    if (rouletteState.currentRound.status === "open") {
      statusText = "Ставки открыты";
    } else if (rouletteState.currentRound.status === "spinning") {
      statusText = "Колесо крутится";
    } else {
      statusText = "Раунд завершён";
    }
  }
  if (statusEl) statusEl.textContent = statusText;

  const latestHistory = rouletteState.history && rouletteState.history.length ? rouletteState.history[0] : null;
  if (rouletteState.currentRound && rouletteState.currentRound.status === "spinning" && rouletteState.currentRound.winningNumber != null) {
    if (resultEl) resultEl.textContent = "Спин: " + rouletteState.currentRound.winningNumber + " • " + (rouletteState.currentRound.winningColor || rouletteColorForNumber(rouletteState.currentRound.winningNumber));
    if (centerEl) centerEl.textContent = String(rouletteState.currentRound.winningNumber);
  } else if (latestHistory) {
    if (resultEl) resultEl.textContent = "Последний результат: " + latestHistory.winningNumber + " • " + (latestHistory.winningColor || rouletteColorForNumber(latestHistory.winningNumber));
    if (centerEl) centerEl.textContent = String(latestHistory.winningNumber);
  } else {
    if (resultEl) resultEl.textContent = "Ожидание нового раунда";
    if (centerEl) centerEl.textContent = "?";
  }
}

function rouletteRenderAll() {
  rouletteDrawWheel();
  rouletteRenderStatus();
  rouletteRenderDraft();
  rouletteRenderMyBets();
  rouletteRenderHistory();
  rouletteRenderAdminPanel();
  rouletteRefreshBoardState();
}

function rouletteApplyHistoryEntry(entry) {
  const rouletteState = state.rouletteState;
  if (!entry || entry.roundId == null) return;
  rouletteState.history = [entry]
    .concat((rouletteState.history || []).filter(function (item) { return Number(item.roundId) !== Number(entry.roundId); }))
    .slice(0, 10);
}

function rouletteApplyBootstrap(data) {
  const rouletteState = state.rouletteState;
  rouletteState.available = true;
  rouletteState.wallet = data && data.wallet ? data.wallet : { balance: 0 };
  rouletteState.currentRound = data && data.currentRound ? data.currentRound : null;
  rouletteState.myBets = Array.isArray(data && data.myBets) ? data.myBets : [];
  rouletteState.history = Array.isArray(data && data.history) ? data.history.slice(0, 10) : [];
  rouletteState.isAdmin = !!(data && data.isAdmin);
  rouletteState.participants = Array.isArray(data && data.participants) ? data.participants : [];
  rouletteState.adminGrants = Array.isArray(data && data.adminGrants) ? data.adminGrants : [];

  if (rouletteState.currentRound && rouletteState.currentRound.status === "spinning" && rouletteState.currentRound.winningNumber != null) {
    const remaining = rouletteGetRemainingMs();
    if (rouletteState.lastDisplayedRoundId !== rouletteState.currentRound.id) {
      rouletteAnimateToNumber(rouletteState.currentRound.winningNumber, remaining || 1400);
      rouletteState.lastDisplayedRoundId = rouletteState.currentRound.id;
    }
  } else if (rouletteState.history.length && rouletteState.history[0].winningNumber != null) {
    rouletteSetWheelInstant(rouletteState.history[0].winningNumber);
  }

  rouletteRenderAll();
}

function rouletteSetUnavailable(message) {
  const rouletteState = state.rouletteState;
  rouletteState.available = false;
  rouletteState.statusText = message;
  rouletteRenderAll();
}

async function rouletteLoadBootstrap() {
  const rouletteState = state.rouletteState;
  try {
    const res = await fetch("/api/roulette/bootstrap", { headers: getApiHeaders(false) });
    const data = res.ok ? await res.json() : await res.json().catch(function () { return {}; });
    if (!res.ok) {
      if (data && data.error === "telegram_auth_unavailable") {
        rouletteSetUnavailable("Рулетка доступна только при настроенном Telegram Bot Token.");
      } else {
        rouletteSetUnavailable("Откройте приложение из Telegram Mini App, чтобы играть.");
      }
      return;
    }
    rouletteApplyBootstrap(data);
  } catch (e) {
    console.error("Failed to load roulette bootstrap", e);
    rouletteSetUnavailable("Не удалось загрузить рулетку. Проверьте соединение и попробуйте снова.");
  }
}

function rouletteDisconnectSocket() {
  const rouletteState = state.rouletteState;
  if (rouletteState.reconnectTimer) {
    clearTimeout(rouletteState.reconnectTimer);
    rouletteState.reconnectTimer = null;
  }
  if (rouletteState.socket) {
    try {
      rouletteState.socket.onclose = null;
      rouletteState.socket.close();
    } catch (e) {}
    rouletteState.socket = null;
  }
}

function rouletteScheduleReconnect() {
  const rouletteState = state.rouletteState;
  if (!document.getElementById("rouletteOverlay").classList.contains("open")) return;
  if (rouletteState.reconnectTimer) return;
  const delay = Math.min(5000, 1000 + rouletteState.reconnectAttempts * 700);
  rouletteState.reconnectTimer = setTimeout(function () {
    rouletteState.reconnectTimer = null;
    rouletteConnectSocket();
  }, delay);
}

function rouletteBuildSocketUrl() {
  if (!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData)) return null;
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return protocol + window.location.host + "/ws/roulette?initData=" + encodeURIComponent(window.Telegram.WebApp.initData);
}

function rouletteHandleWsEvent(event, payload) {
  const rouletteState = state.rouletteState;
  if (event === "snapshot") {
    rouletteApplyBootstrap(payload || {});
    return;
  }
  if (event === "bets_updated") {
    if (payload && payload.currentRound) rouletteState.currentRound = payload.currentRound;
    rouletteRenderStatus();
    rouletteRefreshBoardState();
    return;
  }
  if (event === "round_spinning") {
    if (payload && payload.currentRound) rouletteState.currentRound = payload.currentRound;
    if (payload && payload.winningNumber != null) {
      rouletteAnimateToNumber(payload.winningNumber, rouletteGetRemainingMs() || 6000);
      rouletteState.lastDisplayedRoundId = rouletteState.currentRound ? rouletteState.currentRound.id : null;
    }
    rouletteRenderStatus();
    rouletteRefreshBoardState();
    return;
  }
  if (event === "round_result") {
    if (payload && payload.round) rouletteApplyHistoryEntry(payload.round);
    rouletteRenderStatus();
    rouletteRenderHistory();
    return;
  }
  if (event === "round_open") {
    if (payload && payload.historyEntry) rouletteApplyHistoryEntry(payload.historyEntry);
    if (payload && payload.currentRound) rouletteState.currentRound = payload.currentRound;
    rouletteState.myBets = [];
    rouletteClearDraft();
    rouletteRenderAll();
    return;
  }
  if (event === "wallet_updated") {
    if (payload && payload.wallet) rouletteState.wallet = payload.wallet;
    rouletteRenderStatus();
    return;
  }
  if (event === "admin_grant_applied") {
    if (payload && payload.entry && rouletteState.isAdmin) {
      rouletteState.adminGrants = [payload.entry]
        .concat((rouletteState.adminGrants || []).filter(function (item) { return Number(item.id) !== Number(payload.entry.id); }))
        .slice(0, 10);
      rouletteRenderAdminPanel();
    }
  }
}

function rouletteConnectSocket() {
  const rouletteState = state.rouletteState;
  const url = rouletteBuildSocketUrl();
  if (!url || typeof WebSocket === "undefined" || rouletteState.available === false) return;
  rouletteDisconnectSocket();
  try {
    const socket = new WebSocket(url);
    rouletteState.socket = socket;
    socket.onopen = function () {
      rouletteState.reconnectAttempts = 0;
    };
    socket.onmessage = function (message) {
      try {
        const data = JSON.parse(message.data);
        rouletteHandleWsEvent(data.event, data.payload);
      } catch (e) {
        console.error("Failed to parse roulette websocket message", e);
      }
    };
    socket.onclose = function () {
      rouletteState.socket = null;
      rouletteState.reconnectAttempts += 1;
      rouletteScheduleReconnect();
    };
    socket.onerror = function (e) {
      console.error("Roulette websocket error", e);
    };
  } catch (e) {
    console.error("Failed to connect roulette websocket", e);
    rouletteScheduleReconnect();
  }
}

export function openRouletteModal() {
  const rouletteState = state.rouletteState;
  rouletteEnsureBoard();
  rouletteDrawWheel();
  rouletteUpdateChipUi();
  rouletteRenderAll();
  document.getElementById("rouletteOverlay").classList.add("open");
  rouletteState.statusText = "Загрузка данных...";
  rouletteLoadBootstrap().then(function () {
    if (rouletteState.available !== false) rouletteConnectSocket();
  });
}

export function closeRouletteModal() {
  document.getElementById("rouletteOverlay").classList.remove("open");
  rouletteDisconnectSocket();
}

export async function rouletteSubmitDraft() {
  const rouletteState = state.rouletteState;
  if (!rouletteState.draftBets.length) {
    showToast("Добавьте хотя бы одну ставку");
    return;
  }
  if (!rouletteCanBet()) {
    showToast("Ставки уже закрыты");
    return;
  }

  try {
    const res = await fetch("/api/roulette/bets", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ bets: rouletteState.draftBets }),
    });
    const data = res.ok ? await res.json() : await res.json().catch(function () { return {}; });
    if (!res.ok) {
      if (data && data.error === "insufficient_balance") showToast("Недостаточно монет");
      else if (data && data.error === "round_closed") {
        showToast("Раунд уже закрыт");
        await rouletteLoadBootstrap();
      } else showToast("Не удалось поставить");
      return;
    }
    rouletteState.wallet = data.wallet || rouletteState.wallet;
    rouletteState.currentRound = data.currentRound || rouletteState.currentRound;
    rouletteState.myBets = Array.isArray(data.bets) ? data.bets : rouletteState.myBets;
    rouletteClearDraft();
    rouletteRenderAll();
    showToast("Ставка принята");
  } catch (e) {
    console.error("Failed to submit roulette bets", e);
    showToast("Ошибка сети");
  }
}

export async function rouletteSubmitGrant() {
  const rouletteState = state.rouletteState;
  const userEl = document.getElementById("rouletteAdminUser");
  const amountEl = document.getElementById("rouletteAdminAmount");
  const noteEl = document.getElementById("rouletteAdminNote");
  const userId = userEl && userEl.value ? Number(userEl.value) : NaN;
  const amount = amountEl && amountEl.value ? Number(amountEl.value) : NaN;
  const note = noteEl ? noteEl.value : "";
  if (!Number.isInteger(userId) || userId <= 0) {
    showToast("Выберите игрока");
    return;
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    showToast("Введите сумму");
    return;
  }
  try {
    const res = await fetch("/api/roulette/admin/grants", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ userId: userId, amount: amount, note: note }),
    });
    const data = res.ok ? await res.json() : await res.json().catch(function () { return {}; });
    if (!res.ok) {
      showToast(data && data.error === "forbidden" ? "Нет доступа" : "Не удалось начислить");
      return;
    }
    rouletteState.participants = Array.isArray(data.participants) ? data.participants : rouletteState.participants;
    rouletteState.adminGrants = Array.isArray(data.adminGrants) ? data.adminGrants : rouletteState.adminGrants;
    if (rouletteCurrentUserId() === userId && data.wallet) rouletteState.wallet = data.wallet;
    rouletteRenderAdminPanel();
    rouletteRenderStatus();
    if (noteEl) noteEl.value = "";
    showToast("Монеты начислены");
  } catch (e) {
    console.error("Failed to grant roulette coins", e);
    showToast("Ошибка сети");
  }
}

export function initRoulette() {
  const overlay = document.getElementById("rouletteOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this) closeRouletteModal();
    });
  }
  const betAmountEl = document.getElementById("rouletteBetAmount");
  if (betAmountEl) {
    betAmountEl.addEventListener("input", rouletteSyncChipInput);
  }
  setInterval(function () {
    const ov = document.getElementById("rouletteOverlay");
    if (!ov || !ov.classList.contains("open")) return;
    rouletteRenderStatus();
    rouletteRefreshBoardState();
  }, 500);
}
