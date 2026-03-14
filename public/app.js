async function sendLike() {
  const btn = document.getElementById("likeBtn");
  if (btn) {
    btn.classList.add("just-liked");
    setTimeout(() => btn.classList.remove("just-liked"), 200);
  }
  try {
    await fetch("/api/like", { method: "POST" });
  } catch (e) {
    console.error(e);
  }
}

async function openLikesModal() {
  const el = document.getElementById("likesCountDisplay");
  if (el) el.textContent = "…";
  document.getElementById("likesOverlay").classList.add("open");
  try {
    const res = await fetch("/api/likes");
    const data = res.ok ? await res.json() : {};
    if (el) el.textContent = String(data.count != null ? data.count : "—");
  } catch (e) {
    console.error(e);
    if (el) el.textContent = "—";
  }
}

function closeLikesModal() {
  document.getElementById("likesOverlay").classList.remove("open");
}

document.getElementById("likesOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeLikesModal();
});

function achievementsSortItems(items) {
  return items
    .slice()
    .sort(function (a, b) {
      const ta = Date.parse(a.createdAt || "");
      const tb = Date.parse(b.createdAt || "");
      const safeA = Number.isFinite(ta) ? ta : 0;
      const safeB = Number.isFinite(tb) ? tb : 0;
      if (safeB !== safeA) return safeB - safeA;
      return Number(b.id || 0) - Number(a.id || 0);
    });
}

function achievementsNormalizeItems(rawItems) {
  const byId = new Map();
  if (!Array.isArray(rawItems)) return [];
  rawItems.forEach(function (raw) {
    const id = Number(raw && raw.id);
    if (!Number.isInteger(id) || id <= 0 || byId.has(id)) return;
    byId.set(id, {
      id: id,
      title: raw && raw.title ? String(raw.title) : "",
      description: raw && raw.description ? String(raw.description) : "",
      imageUrl: raw && raw.imageUrl ? String(raw.imageUrl) : "",
      createdBy: raw && raw.createdBy != null ? Number(raw.createdBy) : null,
      createdAt: raw && raw.createdAt ? String(raw.createdAt) : null,
    });
  });
  return achievementsSortItems(Array.from(byId.values()));
}

function achievementsUpsertItem(rawItem) {
  const id = Number(rawItem && rawItem.id);
  if (!Number.isInteger(id) || id <= 0) return;
  const normalized = achievementsNormalizeItems([rawItem])[0];
  if (!normalized) return;
  const idx = achievementsState.items.findIndex(function (item) {
    return Number(item.id) === id;
  });
  if (idx === -1) achievementsState.items.push(normalized);
  else achievementsState.items[idx] = normalized;
  achievementsState.items = achievementsSortItems(achievementsState.items);
}

function achievementsFormatDate(value) {
  const ts = Date.parse(value || "");
  if (!Number.isFinite(ts)) return "";
  return new Date(ts).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function achievementsRender() {
  const statusEl = document.getElementById("achievementsStatusText");
  const countEl = document.getElementById("achievementsStatuettesCount");
  const listEl = document.getElementById("achievementsList");
  const createCardEl = document.getElementById("achievementsCreateCard");
  if (statusEl) statusEl.textContent = achievementsState.statusText || "";
  if (countEl) countEl.textContent = String(Number(achievementsState.statuettesCount || 0));
  if (createCardEl) createCardEl.style.display = achievementsState.canCreate ? "" : "none";
  if (!listEl) return;

  if (achievementsState.available === false) {
    listEl.innerHTML = '<div class="achievements-empty">' + escapeHtml(achievementsState.statusText || "Модуль недоступен") + "</div>";
    return;
  }

  if (!achievementsState.items.length) {
    const text = achievementsState.available == null
      ? "Загрузка достижений..."
      : "Пока нет достижений. Добавьте первое достижение группы.";
    listEl.innerHTML = '<div class="achievements-empty">' + escapeHtml(text) + "</div>";
    return;
  }

  listEl.innerHTML = achievementsState.items
    .map(function (item) {
      const dateText = achievementsFormatDate(item.createdAt);
      return (
        '<div class="achievement-item">' +
        '<div class="achievement-item-media">' +
        '<img class="achievement-image" src="' +
        escapeHtml(item.imageUrl || "") +
        '" alt="' +
        escapeHtml(item.title || "achievement") +
        '">' +
        "</div>" +
        '<div class="achievement-item-main">' +
        '<div class="achievement-item-title">' +
        escapeHtml(item.title || "") +
        "</div>" +
        (item.description
          ? '<div class="achievement-item-description">' + escapeHtml(item.description) + "</div>"
          : "") +
        '<div class="achievement-item-meta">' +
        escapeHtml(dateText || "") +
        "</div>" +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

function achievementsApplySnapshot(data) {
  achievementsState.available = true;
  achievementsState.items = achievementsNormalizeItems(data && data.items);
  achievementsState.statuettesCount = Number((data && data.statuettesCount) || 0);
  achievementsState.canCreate = !!(data && data.canCreate);
  achievementsState.statusText = achievementsState.items.length
    ? "Новые достижения появляются здесь в реальном времени."
    : "Пока нет достижений.";
  achievementsRender();
}

function achievementsSetUnavailable(message) {
  achievementsState.available = false;
  achievementsState.canCreate = false;
  achievementsState.items = [];
  achievementsState.statuettesCount = 0;
  achievementsState.statusText = message;
  achievementsRender();
}

async function achievementsLoadBootstrap() {
  achievementsState.statusText = "Загрузка данных...";
  achievementsRender();
  try {
    const res = await fetch("/api/achievements/bootstrap", { headers: getApiHeaders(false) });
    const data = res.ok ? await res.json() : await res.json().catch(function () { return {}; });
    if (!res.ok) {
      if (data && data.error === "telegram_auth_unavailable") {
        achievementsSetUnavailable("Модуль доступен только при настроенном Telegram Bot Token.");
      } else {
        achievementsSetUnavailable("Откройте приложение из Telegram Mini App, чтобы просматривать достижения.");
      }
      return;
    }
    achievementsApplySnapshot(data);
  } catch (e) {
    console.error("Failed to load achievements bootstrap", e);
    achievementsSetUnavailable("Не удалось загрузить достижения. Проверьте соединение и попробуйте снова.");
  }
}

function achievementsDisconnectSocket() {
  if (achievementsState.reconnectTimer) {
    clearTimeout(achievementsState.reconnectTimer);
    achievementsState.reconnectTimer = null;
  }
  if (achievementsState.socket) {
    try {
      achievementsState.socket.onclose = null;
      achievementsState.socket.close();
    } catch {}
    achievementsState.socket = null;
  }
}

function achievementsScheduleReconnect() {
  const overlay = document.getElementById("achievementsOverlay");
  if (!overlay || !overlay.classList.contains("open")) return;
  if (achievementsState.reconnectTimer) return;
  const delay = Math.min(5000, 1000 + achievementsState.reconnectAttempts * 700);
  achievementsState.reconnectTimer = setTimeout(function () {
    achievementsState.reconnectTimer = null;
    achievementsConnectSocket();
  }, delay);
}

function achievementsBuildSocketUrl() {
  if (!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData)) return null;
  if (typeof WebSocket === "undefined") return null;
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return protocol + window.location.host + "/ws/achievements?initData=" + encodeURIComponent(window.Telegram.WebApp.initData);
}

function achievementsHandleWsEvent(event, payload) {
  if (event === "snapshot") {
    achievementsApplySnapshot(payload || {});
    return;
  }
  if (event === "achievement_created") {
    if (payload && payload.item) {
      achievementsState.available = true;
      achievementsUpsertItem(payload.item);
      achievementsState.statusText = "Новые достижения появляются здесь в реальном времени.";
    }
    if (payload && payload.statuettesCount != null) {
      achievementsState.statuettesCount = Number(payload.statuettesCount || 0);
    }
    achievementsRender();
  }
}

function achievementsConnectSocket() {
  const url = achievementsBuildSocketUrl();
  if (!url || achievementsState.available === false) return;
  achievementsDisconnectSocket();
  try {
    const socket = new WebSocket(url);
    achievementsState.socket = socket;
    socket.onopen = function () {
      achievementsState.reconnectAttempts = 0;
    };
    socket.onmessage = function (message) {
      try {
        const data = JSON.parse(message.data || "{}");
        achievementsHandleWsEvent(data.event, data.payload);
      } catch (e) {
        console.error("Failed to parse achievements websocket message", e);
      }
    };
    socket.onclose = function () {
      achievementsState.socket = null;
      achievementsState.reconnectAttempts += 1;
      achievementsScheduleReconnect();
    };
    socket.onerror = function (e) {
      console.error("Achievements websocket error", e);
    };
  } catch (e) {
    console.error("Failed to connect achievements websocket", e);
    achievementsScheduleReconnect();
  }
}

function openAchievementsModal() {
  achievementsState.available = null;
  achievementsState.statusText = "Загрузка данных...";
  achievementsRender();
  document.getElementById("achievementsOverlay").classList.add("open");
  achievementsLoadBootstrap().then(function () {
    if (achievementsState.available !== false) achievementsConnectSocket();
  });
}

function closeAchievementsModal() {
  document.getElementById("achievementsOverlay").classList.remove("open");
  achievementsDisconnectSocket();
}

function achievementsErrorText(code) {
  if (code === "forbidden") return "Недостаточно прав";
  if (code === "title_required") return "Введите название достижения";
  if (code === "title_too_long") return "Название должно быть не длиннее 80 символов";
  if (code === "description_too_long") return "Описание должно быть не длиннее 500 символов";
  if (code === "image_required") return "Добавьте картинку";
  if (code === "image_too_large") return "Файл больше 1MB";
  if (code === "unsupported_mime_type") return "Нужен PNG или JPG";
  if (code === "telegram_auth_unavailable") return "Telegram авторизация недоступна";
  if (code === "unauthorized") return "Откройте приложение через Telegram";
  return "Не удалось сохранить достижение";
}

async function achievementsSubmitCreate() {
  if (!achievementsState.canCreate) {
    showToast("Нет доступа");
    return;
  }
  const titleEl = document.getElementById("achievementsTitleInput");
  const descEl = document.getElementById("achievementsDescriptionInput");
  const imageEl = document.getElementById("achievementsImageInput");
  const title = titleEl ? String(titleEl.value || "").trim() : "";
  const description = descEl ? String(descEl.value || "").trim() : "";
  const image = imageEl && imageEl.files && imageEl.files.length ? imageEl.files[0] : null;

  if (!title) {
    showToast("Введите название");
    return;
  }
  if (title.length > 80) {
    showToast("Название слишком длинное");
    return;
  }
  if (description.length > 500) {
    showToast("Описание слишком длинное");
    return;
  }
  if (!image) {
    showToast("Добавьте картинку");
    return;
  }

  const body = new FormData();
  body.append("title", title);
  body.append("description", description);
  body.append("image", image);

  try {
    const res = await fetch("/api/achievements", {
      method: "POST",
      headers: getApiHeaders(false),
      body: body,
    });
    const data = res.ok ? await res.json() : await res.json().catch(function () { return {}; });
    if (!res.ok) {
      showToast(achievementsErrorText(data && data.error));
      return;
    }
    if (data && data.item) achievementsUpsertItem(data.item);
    if (data && data.statuettesCount != null) achievementsState.statuettesCount = Number(data.statuettesCount || 0);
    if (data && data.canCreate != null) achievementsState.canCreate = !!data.canCreate;
    achievementsState.available = true;
    achievementsState.statusText = "Новые достижения появляются здесь в реальном времени.";
    achievementsRender();
    if (titleEl) titleEl.value = "";
    if (descEl) descEl.value = "";
    if (imageEl) imageEl.value = "";
    showToast("Достижение добавлено");
  } catch (e) {
    console.error("Failed to create achievement", e);
    showToast("Ошибка сети");
  }
}

document.getElementById("achievementsOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeAchievementsModal();
});

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
  return rouletteState.available === true && rouletteState.currentRound && rouletteState.currentRound.status === "open" && rouletteGetRemainingMs() > 0;
}

function rouletteEnsureBoard() {
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
  const amountEl = document.getElementById("rouletteBetAmount");
  if (amountEl) amountEl.value = String(rouletteSelectedChip);
  document.querySelectorAll("#rouletteChipRow .roulette-chip").forEach(function (btn) {
    btn.classList.toggle("active", Number(btn.getAttribute("data-amount")) === Number(rouletteSelectedChip));
  });
}

function rouletteSelectChip(amount) {
  rouletteSelectedChip = Number(amount) || 25;
  rouletteUpdateChipUi();
}

function rouletteSyncChipInput() {
  const input = document.getElementById("rouletteBetAmount");
  if (!input) return;
  const amount = Number(input.value);
  if (Number.isInteger(amount) && amount > 0) {
    rouletteSelectedChip = amount;
  }
  rouletteUpdateChipUi();
}

function rouletteUpsertDraftBet(kind, value, amount) {
  const key = rouletteSelectionKey(kind, value);
  const idx = rouletteState.draftBets.findIndex(function (item) {
    return rouletteSelectionKey(item.kind, item.value) === key;
  });
  if (idx >= 0) rouletteState.draftBets[idx].amount += amount;
  else rouletteState.draftBets.push({ kind: kind, value: String(value), amount: amount });
}

function rouletteAddDraftBet(kind, value) {
  if (!rouletteCanBet()) {
    showToast("Ставки сейчас закрыты");
    return;
  }
  rouletteSyncChipInput();
  const amount = Number(rouletteSelectedChip);
  if (!Number.isInteger(amount) || amount <= 0) {
    showToast("Введите размер фишки");
    return;
  }
  rouletteUpsertDraftBet(kind, value, amount);
  rouletteRenderDraft();
  rouletteRefreshBoardState();
}

function rouletteRemoveDraftBet(key) {
  rouletteState.draftBets = rouletteState.draftBets.filter(function (item) {
    return rouletteSelectionKey(item.kind, item.value) !== key;
  });
  rouletteRenderDraft();
  rouletteRefreshBoardState();
}

function rouletteClearDraft() {
  rouletteState.draftBets = [];
  rouletteRenderDraft();
  rouletteRefreshBoardState();
}

function rouletteRenderDraft() {
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
  if (!entry || entry.roundId == null) return;
  rouletteState.history = [entry]
    .concat((rouletteState.history || []).filter(function (item) { return Number(item.roundId) !== Number(entry.roundId); }))
    .slice(0, 10);
}

function rouletteApplyBootstrap(data) {
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
  rouletteState.available = false;
  rouletteState.statusText = message;
  rouletteRenderAll();
}

async function rouletteLoadBootstrap() {
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

function openRouletteModal() {
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

function closeRouletteModal() {
  document.getElementById("rouletteOverlay").classList.remove("open");
  rouletteDisconnectSocket();
}

function openRouletteFromActions() {
  closeActionsModal();
  openRouletteModal();
}

async function rouletteSubmitDraft() {
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

async function rouletteSubmitGrant() {
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

document.getElementById("rouletteOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeRouletteModal();
});

document.getElementById("rouletteBetAmount").addEventListener("input", rouletteSyncChipInput);

setInterval(function () {
  const overlay = document.getElementById("rouletteOverlay");
  if (!overlay || !overlay.classList.contains("open")) return;
  rouletteRenderStatus();
  rouletteRefreshBoardState();
}, 500);

const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "💎", "7️⃣", "🎰"];
const SLOT_SYMBOL_HEIGHT = 72;
const SLOT_SPIN_SYMBOLS_COUNT = 22;

function buildReelStrip(finalSymbol) {
  const arr = [];
  for (let i = 0; i < SLOT_SPIN_SYMBOLS_COUNT - 1; i++) {
    arr.push(pickRandomSymbol());
  }
  arr.push(finalSymbol);
  return arr;
}

function openCasinoModal() {
  const strip1 = document.getElementById("slotStrip1");
  const strip2 = document.getElementById("slotStrip2");
  const strip3 = document.getElementById("slotStrip3");
  const resultEl = document.getElementById("casinoResult");
  const spinBtn = document.getElementById("casinoSpinBtn");
  [strip1, strip2, strip3].forEach((s) => {
    if (!s) return;
    s.style.transition = "none";
    s.style.transform = "translateY(0)";
    s.innerHTML = '<div class="slot-symbol">' + SLOT_SYMBOLS[0] + "</div>";
  });
  if (resultEl) { resultEl.textContent = ""; resultEl.className = "casino-result"; }
  if (spinBtn) spinBtn.disabled = false;
  document.getElementById("casinoOverlay").classList.add("open");
}

function closeCasinoModal() {
  document.getElementById("casinoOverlay").classList.remove("open");
}

function pickRandomSymbol() {
  return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
}

function setReelStrip(stripEl, symbols) {
  if (!stripEl) return;
  stripEl.innerHTML = symbols.map((sym) => '<div class="slot-symbol">' + sym + "</div>").join("");
}

function spinSlots() {
  const strip1 = document.getElementById("slotStrip1");
  const strip2 = document.getElementById("slotStrip2");
  const strip3 = document.getElementById("slotStrip3");
  const resultEl = document.getElementById("casinoResult");
  const spinBtn = document.getElementById("casinoSpinBtn");
  if (!strip1 || !strip2 || !strip3 || !resultEl || !spinBtn || spinBtn.disabled) return;
  spinBtn.disabled = true;
  if (resultEl) { resultEl.textContent = ""; resultEl.className = "casino-result"; }

  const s1 = pickRandomSymbol();
  const s2 = pickRandomSymbol();
  const s3 = pickRandomSymbol();
  setReelStrip(strip1, buildReelStrip(s1));
  setReelStrip(strip2, buildReelStrip(s2));
  setReelStrip(strip3, buildReelStrip(s3));

  const endY = -(SLOT_SPIN_SYMBOLS_COUNT - 1) * SLOT_SYMBOL_HEIGHT;
  [strip1, strip2, strip3].forEach((s) => {
    s.classList.remove("spin");
    s.style.transition = "none";
    s.style.transform = "translateY(0)";
  });
  strip1.offsetHeight;
  strip2.offsetHeight;
  strip3.offsetHeight;
  [strip1, strip2, strip3].forEach((s, i) => {
    s.classList.add("spin");
    const delay = i * 120;
    s.style.transition = `transform 1.4s cubic-bezier(.2,.8,.2,1) ${delay}ms`;
    requestAnimationFrame(() => {
      s.style.transform = "translateY(" + endY + "px)";
    });
  });

  const totalDuration = 1400 + 240;
  setTimeout(() => {
    [strip1, strip2, strip3].forEach((s) => {
      s.classList.remove("spin");
      s.style.transition = "none";
      s.style.transform = "translateY(" + endY + "px)";
    });
    spinBtn.disabled = false;
    if (s1 === s2 && s2 === s3) {
      resultEl.textContent = s1 === "🎰" ? "🎉 ДЖЕКПОТ! 🎉" : "Три одинаковых!";
      resultEl.classList.add(s1 === "🎰" ? "jackpot" : "win");
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      resultEl.textContent = "Два одинаковых!";
      resultEl.classList.add("win");
    } else {
      resultEl.textContent = "Повезёт в следующий раз!";
    }
  }, totalDuration);
}

document.getElementById("casinoOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeCasinoModal();
});

// --- Block Blast (аналог) ---
const BLOCK_BLAST_SIZE = 9;
const BLOCK_BLAST_PIECES = [
  [[1]],
  [[1, 1]],
  [[1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1], [1, 0]],
  [[1, 1], [0, 1]],
  [[1, 0], [1], [1]],
  [[0, 1], [1], [1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1], [1, 1], [1, 0]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1], [1], [1], [1]],
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1], [1, 0], [1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1], [1, 1], [1, 1]]
];
function blockBlastInitGrid() {
  blockBlastGrid = [];
  for (let r = 0; r < BLOCK_BLAST_SIZE; r++) {
    blockBlastGrid[r] = [];
    for (let c = 0; c < BLOCK_BLAST_SIZE; c++) blockBlastGrid[r][c] = 0;
  }
}

function blockBlastGetRandomPieces(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(BLOCK_BLAST_PIECES[Math.floor(Math.random() * BLOCK_BLAST_PIECES.length)]);
  }
  return out;
}

function blockBlastCanPlace(piece, row, col) {
  const h = piece.length;
  const w = piece[0].length;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!piece[r][c]) continue;
      const nr = row + r;
      const nc = col + c;
      if (nr < 0 || nr >= BLOCK_BLAST_SIZE || nc < 0 || nc >= BLOCK_BLAST_SIZE) return false;
      if (blockBlastGrid[nr][nc]) return false;
    }
  }
  return true;
}

function blockBlastPlace(piece, row, col) {
  const h = piece.length;
  const w = piece[0].length;
  let cells = 0;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (piece[r][c]) {
        blockBlastGrid[row + r][col + c] = 1;
        cells++;
      }
    }
  }
  blockBlastScore += cells;
  blockBlastClearLines();
  blockBlastPieces.splice(blockBlastSelectedPieceIndex, 1);
  blockBlastSelectedPieceIndex = -1;
  if (blockBlastPieces.length === 0) blockBlastPieces = blockBlastGetRandomPieces(3);
  blockBlastRender();
}

function blockBlastClearLines() {
  let cleared = 0;
  for (let r = 0; r < BLOCK_BLAST_SIZE; r++) {
    if (blockBlastGrid[r].every((v) => v === 1)) {
      blockBlastGrid[r].fill(0);
      cleared++;
    }
  }
  for (let c = 0; c < BLOCK_BLAST_SIZE; c++) {
    let full = true;
    for (let r = 0; r < BLOCK_BLAST_SIZE; r++) if (!blockBlastGrid[r][c]) full = false;
    if (full) {
      for (let r = 0; r < BLOCK_BLAST_SIZE; r++) blockBlastGrid[r][c] = 0;
      cleared++;
    }
  }
  if (cleared > 0) blockBlastScore += cleared * BLOCK_BLAST_SIZE * 2;
}

function blockBlastCanPlaceAny() {
  for (let i = 0; i < blockBlastPieces.length; i++) {
    const piece = blockBlastPieces[i];
    for (let r = 0; r <= BLOCK_BLAST_SIZE - piece.length; r++) {
      for (let c = 0; c <= BLOCK_BLAST_SIZE - piece[0].length; c++) {
        if (blockBlastCanPlace(piece, r, c)) return true;
      }
    }
  }
  return false;
}

function blockBlastRender() {
  const gridEl = document.getElementById("blockBlastGrid");
  const piecesEl = document.getElementById("blockBlastPieces");
  const scoreEl = document.getElementById("blockBlastScore");
  const statusEl = document.getElementById("blockBlastStatus");
  const restartBtn = document.getElementById("blockBlastRestartBtn");
  if (!gridEl || !piecesEl) return;
  if (scoreEl) scoreEl.textContent = blockBlastScore;
  gridEl.innerHTML = "";
  gridEl.style.pointerEvents = blockBlastGameOver ? "none" : "";
  for (let r = 0; r < BLOCK_BLAST_SIZE; r++) {
    for (let c = 0; c < BLOCK_BLAST_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "blockblast-cell" + (blockBlastGrid[r][c] ? " filled" : "");
      cell.dataset.row = r;
      cell.dataset.col = c;
      gridEl.appendChild(cell);
    }
  }
  if (!gridEl._blockBlastDelegate) {
    gridEl._blockBlastDelegate = true;
    gridEl.addEventListener("click", (e) => {
      const cell = e.target.closest(".blockblast-cell");
      if (cell && cell.dataset.row != null) blockBlastOnCellClick({ currentTarget: cell });
    });
    gridEl.addEventListener("dragenter", (e) => {
      e.preventDefault();
      if (blockBlastGameOver) return;
      if (e.target.closest(".blockblast-cell")) gridEl.classList.add("blockblast-grid-drag-over");
    });
    gridEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (blockBlastGameOver) return;
      e.dataTransfer.dropEffect = "copy";
    });
    gridEl.addEventListener("dragleave", (e) => {
      if (!gridEl.contains(e.relatedTarget)) gridEl.classList.remove("blockblast-grid-drag-over");
    });
    gridEl.addEventListener("drop", (e) => {
      e.preventDefault();
      if (blockBlastGameOver) return;
      const cell = e.target.closest(".blockblast-cell");
      if (!cell || cell.classList.contains("filled")) return;
      const row = parseInt(cell.dataset.row, 10);
      const col = parseInt(cell.dataset.col, 10);
      const idx = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (isNaN(idx) || idx < 0 || idx >= blockBlastPieces.length) return;
      const piece = blockBlastPieces[idx];
      if (!blockBlastCanPlace(piece, row, col)) return;
      blockBlastSelectedPieceIndex = idx;
      blockBlastPlace(piece, row, col);
      if (!blockBlastCanPlaceAny()) {
        blockBlastGameOver = true;
      }
      blockBlastDraggedPieceIndex = -1;
      gridEl.classList.remove("blockblast-grid-drag-over");
      blockBlastRender();
    });
  }
  piecesEl.innerHTML = "";
  blockBlastPieces.forEach((piece, idx) => {
    const wrap = document.createElement("div");
    wrap.role = "button";
    wrap.tabIndex = 0;
    wrap.className = "blockblast-piece-wrap" + (blockBlastSelectedPieceIndex === idx ? " selected" : "");
    wrap.innerHTML = blockBlastPieceToHtml(piece);
    wrap.dataset.pieceIndex = String(idx);
    let pointerMoved = false;
    wrap.addEventListener("click", (e) => {
      if (blockBlastGameOver) return;
      if (blockBlastTouchPlaced || pointerMoved) {
        blockBlastTouchPlaced = false;
        pointerMoved = false;
        return;
      }
      e.preventDefault();
      blockBlastSelectedPieceIndex = blockBlastSelectedPieceIndex === idx ? -1 : idx;
      blockBlastRender();
    });
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        wrap.click();
      }
    });
    wrap.addEventListener("pointerdown", (e) => {
      if (blockBlastGameOver || (e.pointerType === "mouse" && e.button !== 0)) return;
      e.preventDefault();
      pointerMoved = false;
      const ghost = blockBlastCreateGhost(piece);
      document.body.appendChild(ghost);
      ghost.style.left = e.clientX + "px";
      ghost.style.top = e.clientY + "px";
      wrap.classList.add("blockblast-dragging");
      if (wrap.setPointerCapture) wrap.setPointerCapture(e.pointerId);
      const onMove = (e2) => {
        pointerMoved = true;
        ghost.style.left = e2.clientX + "px";
        ghost.style.top = e2.clientY + "px";
        const el = document.elementFromPoint(e2.clientX, e2.clientY);
        if (gridEl && el && gridEl.contains(el)) gridEl.classList.add("blockblast-grid-drag-over");
        else gridEl.classList.remove("blockblast-grid-drag-over");
      };
      const onUp = (e2) => {
        wrap.classList.remove("blockblast-dragging");
        gridEl.classList.remove("blockblast-grid-drag-over");
        if (wrap.releasePointerCapture) wrap.releasePointerCapture(e2.pointerId);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        ghost.remove();
        const el = document.elementFromPoint(e2.clientX, e2.clientY);
        const cell = el && el.closest(".blockblast-cell");
        if (cell && !cell.classList.contains("filled")) {
          const row = parseInt(cell.dataset.row, 10);
          const col = parseInt(cell.dataset.col, 10);
          if (blockBlastCanPlace(piece, row, col)) {
            blockBlastSelectedPieceIndex = idx;
            blockBlastPlace(piece, row, col);
            if (!blockBlastCanPlaceAny()) blockBlastGameOver = true;
            blockBlastTouchPlaced = true;
            blockBlastRender();
            return;
          }
        }
        if (pointerMoved) blockBlastTouchPlaced = true;
        blockBlastRender();
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    });
    piecesEl.appendChild(wrap);
  });
  if (blockBlastGameOver) {
    if (statusEl) {
      statusEl.textContent = "Игра окончена! Очки: " + blockBlastScore;
      statusEl.classList.add("game-over");
    }
    if (restartBtn) restartBtn.style.display = "";
  } else {
    if (statusEl) {
      statusEl.textContent = "Перетащите фигуру на сетку или выберите и нажмите на клетку";
      statusEl.classList.remove("game-over");
    }
    if (restartBtn) restartBtn.style.display = "none";
  }
}

function blockBlastCreateGhost(piece) {
  const ghost = document.createElement("div");
  ghost.className = "blockblast-ghost";
  ghost.innerHTML = blockBlastPieceToHtml(piece);
  ghost.style.left = "0";
  ghost.style.top = "0";
  return ghost;
}

function blockBlastPieceToHtml(piece) {
  const h = piece.length;
  const w = piece[0].length;
  let html = '<div class="blockblast-piece-preview" style="grid-template-rows:repeat(' + h + ',1fr);grid-template-columns:repeat(' + w + ',1fr);">';
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      html += '<span class="' + (piece[r][c] ? "on" : "off") + '"></span>';
        }
  }
  html += "</div>";
  return html;
}

function blockBlastOnCellClick(e) {
  if (blockBlastSelectedPieceIndex < 0 || blockBlastGameOver) return;
  const row = parseInt(e.currentTarget.dataset.row, 10);
  const col = parseInt(e.currentTarget.dataset.col, 10);
  const piece = blockBlastPieces[blockBlastSelectedPieceIndex];
  if (!blockBlastCanPlace(piece, row, col)) return;
  blockBlastPlace(piece, row, col);
  if (!blockBlastCanPlaceAny()) {
    blockBlastGameOver = true;
    blockBlastRender();
  }
}

function blockBlastRestart() {
  blockBlastInitGrid();
  blockBlastPieces = blockBlastGetRandomPieces(3);
  blockBlastScore = 0;
  blockBlastSelectedPieceIndex = -1;
  blockBlastGameOver = false;
  blockBlastTouchPlaced = false;
  blockBlastRender();
}

const GROUP_SIZE_BETS = 28;

async function openBetsModal() {
  const listEl = document.getElementById("betsList");
  if (!listEl) return;
  listEl.innerHTML = "<p class=\"reminders-loading\">Загрузка...</p>";
  document.getElementById("betsOverlay").classList.add("open");
  let myBets = {};
  let aggregates = {};
  try {
    const res = await fetch("/api/bets", { headers: getApiHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      myBets = data.myBets || {};
      aggregates = data.aggregates || {};
    }
  } catch (e) {
    console.error(e);
  }
  const dayOrder = { Понедельник: 1, Вторник: 2, Среда: 3, Четверг: 4, Пятница: 5, Суббота: 6, Воскресенье: 7 };
  const sorted = schedule.slice().sort((a, b) => {
    const d = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
    if (d !== 0) return d;
    return (a.start || "").localeCompare(b.start || "");
  });
  listEl.innerHTML = sorted
    .map(
      (c) => {
        const id = c.id;
        const key = String(id);
        const myVal = myBets[key];
        const agg = aggregates[key];
        const aggText = agg ? `Средний прогноз: ${agg.avg}, ставок: ${agg.count}` : "Ставок пока нет";
        return (
          '<div class="bet-row" data-id="' +
          id +
          '">' +
          '<div class="bet-row-info">' +
          '<div class="bet-row-title">' +
          (c.subject || "Пара") +
          "</div>" +
          '<div class="bet-row-meta">' +
          c.day +
          ", " +
          c.start +
          (c.week !== "both" ? " (" + (c.week === "odd" ? "нечёт" : "чёт") + ")" : "") +
          "</div>" +
          '<div class="bet-row-stats">' +
          aggText +
          "</div></div>" +
          '<div class="bet-row-input">' +
          '<input type="number" min="0" max="' +
          GROUP_SIZE_BETS +
          '" value="' +
          (myVal !== undefined ? myVal : "") +
          '" placeholder="0–' +
          GROUP_SIZE_BETS +
          '" id="betInput' +
          id +
          '">' +
          '<button type="button" class="bet-save" onclick="saveBet(' +
          id +
          ')">Сохранить</button></div></div>'
        );
      }
    )
    .join("");
}

function closeBetsModal() {
  document.getElementById("betsOverlay").classList.remove("open");
}

async function saveBet(scheduleId) {
  const input = document.getElementById("betInput" + scheduleId);
  if (!input) return;
  let count = input.value.trim() === "" ? null : parseInt(input.value, 10);
  if (count != null && (isNaN(count) || count < 0 || count > GROUP_SIZE_BETS)) {
    showToast("Введите число от 0 до " + GROUP_SIZE_BETS);
    return;
  }
  if (count != null) count = Math.max(0, Math.min(GROUP_SIZE_BETS, count));
  try {
    const res = await fetch("/api/bet", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ scheduleId, count }),
    });
    if (!res.ok) {
      showToast("Ошибка сохранения");
      return;
    }
    showToast("Ставка сохранена");
    const row = document.querySelector('.bet-row[data-id="' + scheduleId + '"]');
    if (row) {
      const statsEl = row.querySelector(".bet-row-stats");
      const data = await res.json();
      if (statsEl && data.aggregate) {
        statsEl.textContent = `Средний прогноз: ${data.aggregate.avg}, ставок: ${data.aggregate.count}`;
      }
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

document.getElementById("betsOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeBetsModal();
});

document.getElementById("subjectCardOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeSubjectCard();
});

document.getElementById("calendarDayModalOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeCalendarDayModal();
});

document.getElementById("deadlinesOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeDeadlinesModal();
});

function openHiddenPairsFromActions() {
  closeActionsModal();
  openHiddenPairsModal();
}

function openHiddenPairsModal() {
  const listEl = document.getElementById("hiddenPairsList");
  if (!listEl) return;
  const dayOrder = { Понедельник: 1, Вторник: 2, Среда: 3, Четверг: 4, Пятница: 5, Суббота: 6, Воскресенье: 7 };
  const sorted = schedule.slice().sort((a, b) => {
    const d = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
    if (d !== 0) return d;
    return (a.start || "").localeCompare(b.start || "");
  });
  listEl.innerHTML = sorted
    .map(
      (c) => {
        let mode = "show";
        if (hiddenPairIds.has(c.id)) mode = "hidden";
        else if (dimmedPairIds.has(c.id)) mode = "dimmed";
        return (
          '<div class="hidden-pair-row">' +
          '<span class="hidden-pair-label">' +
          c.day +
          ", " +
          c.start +
          " — " +
          (c.subject || "") +
          "</span>" +
          '<select class="hidden-pair-mode" data-id="' +
          c.id +
          '" id="pairMode' +
          c.id +
          '">' +
          '<option value="show"' +
          (mode === "show" ? " selected" : "") +
          ">Показывать</option>" +
          '<option value="hidden"' +
          (mode === "hidden" ? " selected" : "") +
          ">Скрыть</option>" +
          '<option value="dimmed"' +
          (mode === "dimmed" ? " selected" : "") +
          ">Бледно</option>" +
          "</select></div>"
        );
      }
    )
    .join("");
  document.getElementById("hiddenPairsOverlay").classList.add("open");
}

function closeHiddenPairsModal() {
  document.getElementById("hiddenPairsOverlay").classList.remove("open");
}

async function saveHiddenPairs() {
  const listEl = document.getElementById("hiddenPairsList");
  if (!listEl) return;
  const hiddenIds = [];
  const dimmedIds = [];
  listEl.querySelectorAll(".hidden-pair-mode").forEach((sel) => {
    const id = Number(sel.dataset.id);
    if (!id) return;
    const val = sel.value;
    if (val === "hidden") hiddenIds.push(id);
    else if (val === "dimmed") dimmedIds.push(id);
  });
  try {
    const res = await fetch("/api/hidden-pairs", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ hiddenIds, dimmedIds }),
    });
    if (!res.ok) throw new Error("Save failed");
    const data = await res.json();
    hiddenPairIds = new Set(data.hiddenIds || []);
    dimmedPairIds = new Set(data.dimmedIds || []);
    renderSchedule();
    showToast("Список сохранён");
  } catch (e) {
    console.error(e);
    showToast("Ошибка сохранения");
  }
  closeHiddenPairsModal();
}

document.getElementById("hiddenPairsOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeHiddenPairsModal();
});

async function openRemindersModal() {
  const listEl = document.getElementById("remindersList");
  const minutesEl = document.getElementById("reminderMinutesSelect");
  const daysEl = document.getElementById("reminderDaysSelect");
  if (!listEl || !minutesEl) return;
  if (!daysEl) return;
  listEl.innerHTML = "<p class=\"reminders-loading\">Загрузка...</p>";
  document.getElementById("remindersOverlay").classList.add("open");

  let savedReminders = [];
  try {
    const res = await fetch("/api/reminders", { headers: getApiHeaders(false) });
    if (res.ok) savedReminders = await res.json();
  } catch (e) {
    console.error(e);
  }

  const seen = new Set();
  const items = [];
  for (const c of schedule) {
    const key = c.day + "|" + c.start;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ day: c.day, start: c.start, subject: c.subject });
  }
  items.sort((a, b) => {
    const dayOrder = { Понедельник: 1, Вторник: 2, Среда: 3, Четверг: 4, Пятница: 5, Суббота: 6 };
    const d = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
    if (d !== 0) return d;
    return a.start.localeCompare(b.start);
  });

  const savedSet = new Set(savedReminders.map((r) => r.day + "|" + r.start));
  const savedMinutes = savedReminders.length ? (savedReminders[0].minutesBefore || 0) : 15;
  const savedDays = savedReminders.length ? (savedReminders[0].daysBefore || 0) : 0;
  const savedAt = savedReminders.length && savedReminders[0].remindAt ? savedReminders[0].remindAt : "";
  if ([0, 5, 10, 15, 30, 60].includes(savedMinutes)) {
    minutesEl.value = String(savedMinutes);
  }
  if ([0, 1, 2, 3].includes(savedDays)) {
    daysEl.value = String(savedDays);
  }
  const atEl = document.getElementById("reminderAtInput");
  if (atEl) atEl.value = savedAt;

  listEl.innerHTML = "";
  items.forEach((item) => {
    const key = item.day + "|" + item.start;
    const label = document.createElement("label");
    label.className = "reminder-item";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.day = item.day;
    cb.dataset.start = item.start;
    cb.checked = savedSet.has(key);
    label.appendChild(cb);
    const span = document.createElement("span");
    span.className = "reminder-item-text";
    span.textContent = `${item.day}, ${item.start} — ${item.subject}`;
    label.appendChild(span);
    listEl.appendChild(label);
  });
}

function closeRemindersModal() {
  document.getElementById("remindersOverlay").classList.remove("open");
}

async function saveReminders() {
  const listEl = document.getElementById("remindersList");
  const minutesEl = document.getElementById("reminderMinutesSelect");
  const daysEl = document.getElementById("reminderDaysSelect");
  const atEl = document.getElementById("reminderAtInput");
  if (!listEl || !minutesEl) return;
  const minutesBefore = parseInt(minutesEl.value, 10) || 0;
  const daysBefore = (daysEl && parseInt(daysEl.value, 10)) || 0;
  const remindAt = (atEl && atEl.value && atEl.value.trim()) ? atEl.value.trim() : "";
  const reminders = [];
  listEl.querySelectorAll("input[type=checkbox]:checked").forEach((cb) => {
    reminders.push({
      day: cb.dataset.day,
      start: cb.dataset.start,
      minutesBefore: minutesBefore >= 1 && minutesBefore <= 120 ? minutesBefore : 0,
      daysBefore: daysBefore >= 1 && daysBefore <= 7 ? daysBefore : 0,
      remindAt: remindAt,
    });
  });
  const hasAt = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(remindAt);
  if (reminders.length > 0 && minutesBefore === 0 && daysBefore === 0 && !hasAt) {
    showToast("Укажите минуты, дни или время для напоминания");
    return;
  }
  try {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ reminders }),
    });
    if (!res.ok) {
      showToast("Ошибка сохранения");
      return;
    }
    showToast(reminders.length ? `Напоминания сохранены (${reminders.length}) ✅` : "Напоминания отключены");
    closeRemindersModal();
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

document.getElementById("remindersOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeRemindersModal();
});

async function openWriteToParticipantModal() {
  const select = document.getElementById("participantSelect");
  const textarea = document.getElementById("participantMessageText");
  if (!select || !textarea) return;
  select.innerHTML = "<option value=''>Загрузка...</option>";
  select.disabled = true;
  textarea.value = "";
  document.getElementById("writeToParticipantOverlay").classList.add("open");
  try {
    const res = await fetch("/api/participants", { headers: getApiHeaders(false) });
    if (!res.ok) {
      select.innerHTML = "<option value=''>Ошибка загрузки</option>";
      return;
    }
    const list = await res.json();
    select.innerHTML = "<option value=''>Выберите участника</option>";
    list.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.displayName;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
    select.innerHTML = "<option value=''>Ошибка сети</option>";
  } finally {
    select.disabled = false;
  }
}

function closeWriteToParticipantModal() {
  document.getElementById("writeToParticipantOverlay").classList.remove("open");
}

async function sendToParticipant() {
  const select = document.getElementById("participantSelect");
  const textarea = document.getElementById("participantMessageText");
  const toChatId = select && select.value ? Number(select.value) : 0;
  const text = textarea && textarea.value ? textarea.value.trim() : "";
  if (!toChatId || !text) {
    alert("Выберите участника и введите сообщение");
    return;
  }
  try {
    const res = await fetch("/api/send-to-participant", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ toChatId, text }),
    });
    if (!res.ok) {
      showToast("Ошибка отправки");
    } else {
      showToast("Сообщение отправлено ✅");
      closeWriteToParticipantModal();
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

document.getElementById("writeToParticipantOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeWriteToParticipantModal();
});

document.getElementById("actionsOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeActionsModal();
});

function openStarostaModal() {
  const textarea = document.getElementById("starostaText");
  textarea.value = "";
  document.getElementById("starostaOverlay").classList.add("open");
}

function closeStarostaModal() {
  document.getElementById("starostaOverlay").classList.remove("open");
}

async function sendStarostaMessage() {
  const textarea = document.getElementById("starostaText");
  const text = textarea.value.trim();
  if (!text) {
    alert("Введите текст сообщения");
    return;
  }
  try {
    const res = await fetch("/api/contact-starosta", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      showToast("Ошибка отправки старосте");
    } else {
      showToast("Сообщение отправлено старосте ✅");
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети при отправке");
  }
  closeStarostaModal();
}

document.getElementById("starostaOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeStarostaModal();
});

function openFeedbackModal() {
  const textarea = document.getElementById("feedbackText");
  if (textarea) textarea.value = "";
  document.getElementById("feedbackOverlay").classList.add("open");
}

function closeFeedbackModal() {
  document.getElementById("feedbackOverlay").classList.remove("open");
}

async function sendFeedback() {
  const textarea = document.getElementById("feedbackText");
  const text = textarea ? textarea.value.trim() : "";
  if (!text) {
    alert("Введите сообщение");
    return;
  }
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      showToast("Ошибка отправки");
    } else {
      showToast("Отправлено в Отладку ✅");
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети при отправке");
  }
  closeFeedbackModal();
}

document.getElementById("feedbackOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeFeedbackModal();
});

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
  if (!monopolyCanUseSocket() || !monopolyState.roomCode) return "";
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return protocol + window.location.host + "/ws/monopoly?roomCode=" + encodeURIComponent(monopolyState.roomCode) + "&initData=" + encodeURIComponent(window.Telegram.WebApp.initData);
}

function monopolyDisconnectSocket() {
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
  const code = String(roomCode || monopolyState.roomCode || "").trim().toUpperCase();
  if (!code) return;
  const snapshot = await monopolyApi("/api/monopoly/rooms/" + encodeURIComponent(code) + "/bootstrap", { method: "GET" });
  monopolyUpdateSnapshot(snapshot);
}

async function monopolyCreateRoom() {
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

async function monopolyJoinRoom() {
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

async function monopolySetReady() {
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

async function monopolyStartGame() {
  await monopolyAction("start_game", {});
}

async function monopolyAction(type, payload) {
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

function monopolyBid() {
  const amountEl = document.getElementById("monopolyBidAmount");
  const amount = amountEl ? Number(amountEl.value || 0) : 0;
  if (!Number.isInteger(amount) || amount <= 0) {
    showToast("Укажите корректную ставку");
    return;
  }
  monopolyAction("auction_bid", { amount: amount });
}

function monopolyOfferTrade() {
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

function monopolyRespondTrade(accept) {
  monopolyAction("respond_trade", { accept: !!accept });
}

function monopolyRequestLeave() {
  monopolyAction("leave_request", {});
}

function monopolyVoteLeave(approve) {
  monopolyAction("vote_leave", { approve: !!approve });
}

async function monopolyUploadToken(inputEl) {
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

function openMonopolyModal() {
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

function closeMonopolyModal() {
  document.getElementById("monopolyOverlay").classList.remove("open");
  monopolyDisconnectSocket();
}

document.getElementById("monopolyOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeMonopolyModal();
});

setInterval(function () {
  const overlay = document.getElementById("monopolyOverlay");
  if (!overlay || !overlay.classList.contains("open")) return;
  monopolyRender();
}, 500);

function d20ClampDc(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return D20_DEFAULT_DC;
  return Math.min(D20_MAX_DC, Math.max(D20_MIN_DC, Math.round(num)));
}

function d20ClampModifier(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(D20_MAX_MODIFIER, Math.max(D20_MIN_MODIFIER, Math.round(num)));
}

function d20FormatSigned(value) {
  const num = Number(value) || 0;
  return num > 0 ? "+" + String(num) : String(num);
}

function d20IsHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function d20SanitizePalette(rawPalette) {
  const raw = rawPalette && typeof rawPalette === "object" ? rawPalette : {};
  return {
    bg: d20IsHexColor(raw.bg) ? raw.bg : D20_DEFAULT_PALETTE.bg,
    edge: d20IsHexColor(raw.edge) ? raw.edge : D20_DEFAULT_PALETTE.edge,
    text: d20IsHexColor(raw.text) ? raw.text : D20_DEFAULT_PALETTE.text,
  };
}

function d20ComputeModifierTotal(modifiers) {
  if (!Array.isArray(modifiers)) return 0;
  return modifiers.reduce(function (sum, item) {
    if (!item || !item.enabled) return sum;
    return sum + d20ClampModifier(item.value);
  }, 0);
}

function d20EvaluateRoll(natural, modifierTotal, dc) {
  const nat = Number(natural);
  const mod = Number(modifierTotal) || 0;
  const safeDc = d20ClampDc(dc);
  const total = nat + mod;

  if (nat === 20) {
    return {
      finalTotal: total,
      outcome: "Критический успех",
      interpretation: "Натуральная 20. Проверка пройдена автоматически.",
      isSuccess: true,
      isCritical: true,
    };
  }

  if (nat === 1) {
    return {
      finalTotal: total,
      outcome: "Критический провал",
      interpretation: "Натуральная 1. Проверка провалена автоматически.",
      isSuccess: false,
      isCritical: true,
    };
  }

  if (total >= safeDc + 5) {
    return {
      finalTotal: total,
      outcome: "Уверенный успех",
      interpretation: "Запас к сложности " + String(total - safeDc) + ". Отличный результат.",
      isSuccess: true,
      isCritical: false,
    };
  }
  if (total >= safeDc) {
    return {
      finalTotal: total,
      outcome: "Успех",
      interpretation: "Порог сложности достигнут.",
      isSuccess: true,
      isCritical: false,
    };
  }
  if (total >= safeDc - 4) {
    return {
      finalTotal: total,
      outcome: "Почти получилось",
      interpretation: "Немного не хватило до DC.",
      isSuccess: false,
      isCritical: false,
    };
  }
  return {
    finalTotal: total,
    outcome: "Провал",
    interpretation: "Разрыв с DC слишком большой.",
    isSuccess: false,
    isCritical: false,
  };
}

function d20SafeSetLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error("Failed to persist D20 value", e);
    return false;
  }
}

function d20PersistModifiers() {
  return d20SafeSetLocalStorage(D20_STORAGE_KEYS.modifiers, JSON.stringify(d20State.modifiers));
}

function d20PersistDc() {
  return d20SafeSetLocalStorage(D20_STORAGE_KEYS.dc, String(d20State.dc));
}

function d20PersistPalette() {
  return d20SafeSetLocalStorage(D20_STORAGE_KEYS.palette, JSON.stringify(d20State.palette));
}

function d20PersistTexture() {
  if (!d20State.textureDataUrl) {
    try {
      localStorage.removeItem(D20_STORAGE_KEYS.texture);
    } catch (e) {
      console.error("Failed to remove D20 texture", e);
      return false;
    }
    return true;
  }
  return d20SafeSetLocalStorage(D20_STORAGE_KEYS.texture, d20State.textureDataUrl);
}

function d20RecomputeFromCurrentRoll() {
  d20State.modifierTotal = d20ComputeModifierTotal(d20State.modifiers);
  if (d20State.natural == null || !Number.isInteger(Number(d20State.natural))) {
    d20State.finalTotal = null;
    d20State.outcome = "";
    d20State.interpretation = "Бросьте кубик, чтобы получить исход проверки.";
    d20State.isSuccess = false;
    d20State.isCritical = false;
    return;
  }
  const result = d20EvaluateRoll(d20State.natural, d20State.modifierTotal, d20State.dc);
  d20State.finalTotal = result.finalTotal;
  d20State.outcome = result.outcome;
  d20State.interpretation = result.interpretation;
  d20State.isSuccess = result.isSuccess;
  d20State.isCritical = result.isCritical;
}

function d20LoadState() {
  let modifiers = [];
  try {
    const rawModifiers = JSON.parse(localStorage.getItem(D20_STORAGE_KEYS.modifiers) || "[]");
    if (Array.isArray(rawModifiers)) {
      for (const item of rawModifiers) {
        if (modifiers.length >= D20_MAX_MODIFIERS) break;
        const name = item && typeof item.name === "string" ? item.name.trim() : "";
        if (!name || name.length > 32) continue;
        modifiers.push({
          id: modifiers.length + 1,
          name: name,
          value: d20ClampModifier(item.value),
          enabled: item && item.enabled !== false,
        });
      }
    }
  } catch (e) {
    modifiers = [];
  }

  let dc = D20_DEFAULT_DC;
  try {
    dc = d20ClampDc(localStorage.getItem(D20_STORAGE_KEYS.dc));
  } catch (e) {
    dc = D20_DEFAULT_DC;
  }

  let palette = { ...D20_DEFAULT_PALETTE };
  try {
    const rawPalette = JSON.parse(localStorage.getItem(D20_STORAGE_KEYS.palette) || "{}");
    palette = d20SanitizePalette(rawPalette);
  } catch (e) {
    palette = { ...D20_DEFAULT_PALETTE };
  }

  let textureDataUrl = "";
  try {
    const rawTexture = localStorage.getItem(D20_STORAGE_KEYS.texture) || "";
    textureDataUrl = rawTexture.startsWith("data:image/") ? rawTexture : "";
  } catch (e) {
    textureDataUrl = "";
  }

  d20State.modifiers = modifiers;
  d20State.nextModifierId = modifiers.length + 1;
  d20State.dc = dc;
  d20State.palette = palette;
  d20State.textureDataUrl = textureDataUrl;
  d20State.natural = null;
  d20State.isRolling = false;
  d20RecomputeFromCurrentRoll();
}

function d20RenderModifierList() {
  const listEl = document.getElementById("d20ModifierList");
  if (!listEl) return;

  if (!d20State.modifiers.length) {
    listEl.innerHTML = '<div class="d20-empty">Пока нет активных эффектов.</div>';
    return;
  }

  listEl.innerHTML = d20State.modifiers
    .map(function (item) {
      const valueClass = Number(item.value) >= 0 ? "positive" : "negative";
      return (
        '<div class="d20-modifier-item">' +
        '<label class="d20-modifier-main">' +
        '<input type="checkbox" ' +
        (item.enabled ? "checked" : "") +
        ' onchange="d20ToggleModifier(' +
        String(item.id) +
        ', this.checked)">' +
        '<span class="d20-modifier-name">' +
        escapeHtml(item.name) +
        "</span>" +
        "</label>" +
        '<div class="d20-modifier-actions">' +
        '<span class="d20-modifier-value ' +
        valueClass +
        '">' +
        escapeHtml(d20FormatSigned(item.value)) +
        "</span>" +
        '<button type="button" class="d20-remove-btn" onclick="d20RemoveModifier(' +
        String(item.id) +
        ')">×</button>' +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

function d20RenderSkin() {
  const dieEl = document.getElementById("d20Die");
  if (!dieEl) return;

  dieEl.style.setProperty("--d20-bg", d20State.palette.bg);
  dieEl.style.setProperty("--d20-edge", d20State.palette.edge);
  dieEl.style.setProperty("--d20-text", d20State.palette.text);
  if (d20State.textureDataUrl) {
    dieEl.style.backgroundImage =
      "linear-gradient(140deg, rgba(0,0,0,.18), rgba(0,0,0,.48)), url('" + d20State.textureDataUrl.replace(/'/g, "\\'") + "')";
  } else {
    dieEl.style.backgroundImage = "";
  }

  const bgInput = document.getElementById("d20ColorBg");
  const edgeInput = document.getElementById("d20ColorEdge");
  const textInput = document.getElementById("d20ColorText");
  if (bgInput) bgInput.value = d20State.palette.bg;
  if (edgeInput) edgeInput.value = d20State.palette.edge;
  if (textInput) textInput.value = d20State.palette.text;
}

function d20RenderResult() {
  const naturalValue = document.getElementById("d20NaturalValue");
  const resultNatural = document.getElementById("d20ResultNatural");
  const resultModifier = document.getElementById("d20ResultModifier");
  const resultTotal = document.getElementById("d20ResultTotal");
  const resultOutcome = document.getElementById("d20ResultOutcome");
  const interpretation = document.getElementById("d20Interpretation");

  if (naturalValue) naturalValue.textContent = d20State.natural == null ? "?" : String(d20State.natural);
  if (resultNatural) resultNatural.textContent = d20State.natural == null ? "—" : String(d20State.natural);
  if (resultModifier) resultModifier.textContent = d20FormatSigned(d20State.modifierTotal);
  if (resultTotal) resultTotal.textContent = d20State.finalTotal == null ? "—" : String(d20State.finalTotal);
  if (resultOutcome) {
    resultOutcome.textContent = d20State.outcome || "Ожидание";
    resultOutcome.classList.remove("d20-outcome-success", "d20-outcome-fail", "d20-outcome-critical");
    if (d20State.outcome) {
      if (d20State.isCritical) resultOutcome.classList.add("d20-outcome-critical");
      else if (d20State.isSuccess) resultOutcome.classList.add("d20-outcome-success");
      else resultOutcome.classList.add("d20-outcome-fail");
    }
  }
  if (interpretation) interpretation.textContent = d20State.interpretation;
}

function d20Render() {
  const dcInput = document.getElementById("d20DcInput");
  const modifierTotalDisplay = document.getElementById("d20ModifierTotalDisplay");
  const rollBtn = document.getElementById("d20RollBtn");

  if (dcInput) dcInput.value = String(d20State.dc);
  if (modifierTotalDisplay) modifierTotalDisplay.textContent = d20FormatSigned(d20State.modifierTotal);
  if (rollBtn) rollBtn.disabled = !!d20State.isRolling;

  d20RenderModifierList();
  d20RenderSkin();
  d20RenderResult();
}

function openD20Modal() {
  d20Render();
  document.getElementById("d20Overlay").classList.add("open");
}

function d20StopRollTimers() {
  if (d20State.rollInterval) {
    clearInterval(d20State.rollInterval);
    d20State.rollInterval = null;
  }
  if (d20State.rollTimeout) {
    clearTimeout(d20State.rollTimeout);
    d20State.rollTimeout = null;
  }
}

function closeD20Modal() {
  d20StopRollTimers();
  d20State.isRolling = false;
  const dieEl = document.getElementById("d20Die");
  if (dieEl) dieEl.classList.remove("rolling");
  document.getElementById("d20Overlay").classList.remove("open");
}

function d20SetDc(rawValue) {
  d20State.dc = d20ClampDc(rawValue);
  d20PersistDc();
  d20RecomputeFromCurrentRoll();
  d20Render();
}

function d20AddModifier() {
  if (d20State.modifiers.length >= D20_MAX_MODIFIERS) {
    showToast("Лимит модификаторов: " + String(D20_MAX_MODIFIERS));
    return;
  }

  const nameInput = document.getElementById("d20ModifierNameInput");
  const valueInput = document.getElementById("d20ModifierValueInput");
  const name = nameInput ? String(nameInput.value || "").trim() : "";
  const valueRaw = valueInput ? valueInput.value : 0;
  const value = Number(valueRaw);

  if (!name || name.length > 32) {
    showToast("Название должно быть от 1 до 32 символов");
    return;
  }
  if (!Number.isFinite(value) || Math.round(value) < D20_MIN_MODIFIER || Math.round(value) > D20_MAX_MODIFIER) {
    showToast("Значение должно быть в диапазоне от -20 до +20");
    return;
  }

  d20State.modifiers.push({
    id: d20State.nextModifierId++,
    name: name,
    value: d20ClampModifier(value),
    enabled: true,
  });
  d20PersistModifiers();
  d20RecomputeFromCurrentRoll();
  d20Render();

  if (nameInput) nameInput.value = "";
  if (valueInput) valueInput.value = "0";
}

function d20ToggleModifier(modifierId, enabled) {
  const id = Number(modifierId);
  const modifier = d20State.modifiers.find(function (item) {
    return Number(item.id) === id;
  });
  if (!modifier) return;
  modifier.enabled = enabled == null ? !modifier.enabled : !!enabled;
  d20PersistModifiers();
  d20RecomputeFromCurrentRoll();
  d20Render();
}

function d20RemoveModifier(modifierId) {
  const id = Number(modifierId);
  d20State.modifiers = d20State.modifiers.filter(function (item) {
    return Number(item.id) !== id;
  });
  d20PersistModifiers();
  d20RecomputeFromCurrentRoll();
  d20Render();
}

function d20ChangePalette() {
  const bgInput = document.getElementById("d20ColorBg");
  const edgeInput = document.getElementById("d20ColorEdge");
  const textInput = document.getElementById("d20ColorText");
  const palette = d20SanitizePalette({
    bg: bgInput ? bgInput.value : d20State.palette.bg,
    edge: edgeInput ? edgeInput.value : d20State.palette.edge,
    text: textInput ? textInput.value : d20State.palette.text,
  });
  d20State.palette = palette;
  d20PersistPalette();
  d20RenderSkin();
}

function d20ResizeTextureFile(file, maxSize) {
  return new Promise(function (resolve, reject) {
    if (!file) {
      reject(new Error("no_file"));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = function () {
      try {
        const size = Number(maxSize) || 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size / image.width, size / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const offsetX = (size - drawWidth) / 2;
        const offsetY = (size - drawHeight) / 2;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      }
    };
    image.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image_decode_failed"));
    };
    image.src = objectUrl;
  });
}

async function d20UploadTexture(inputEl) {
  if (!inputEl || !inputEl.files || !inputEl.files.length) return;
  const file = inputEl.files[0];
  if (!file || (file.type !== "image/png" && file.type !== "image/jpeg")) {
    showToast("Нужен PNG или JPG");
    inputEl.value = "";
    return;
  }

  try {
    const dataUrl = await d20ResizeTextureFile(file, 256);
    d20State.textureDataUrl = dataUrl;
    const persisted = d20PersistTexture();
    d20RenderSkin();
    showToast(persisted ? "Скин обновлён" : "Скин применён только на текущую сессию");
  } catch (e) {
    console.error("Failed to process D20 texture", e);
    showToast("Не удалось обработать изображение");
  } finally {
    inputEl.value = "";
  }
}

function d20ResetSkin() {
  d20State.textureDataUrl = "";
  d20State.palette = { ...D20_DEFAULT_PALETTE };
  d20PersistTexture();
  d20PersistPalette();
  d20RenderSkin();
  showToast("Скин сброшен");
}

function d20Roll() {
  if (d20State.isRolling) return;

  d20State.isRolling = true;
  const dieEl = document.getElementById("d20Die");
  if (dieEl) dieEl.classList.add("rolling");
  d20Render();

  const target = 1 + Math.floor(Math.random() * 20);
  d20StopRollTimers();
  d20State.rollInterval = setInterval(function () {
    d20State.natural = 1 + Math.floor(Math.random() * 20);
    const naturalValueEl = document.getElementById("d20NaturalValue");
    if (naturalValueEl) naturalValueEl.textContent = String(d20State.natural);
  }, 70);

  d20State.rollTimeout = setTimeout(function () {
    d20StopRollTimers();
    d20State.isRolling = false;
    d20State.natural = target;
    d20RecomputeFromCurrentRoll();
    if (dieEl) dieEl.classList.remove("rolling");
    d20Render();
  }, D20_ROLL_MS);
}

document.getElementById("d20Overlay").addEventListener("click", function (e) {
  if (e.target === this) closeD20Modal();
});

if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#1c1c1e");
  tg.setBackgroundColor("#1c1c1e");
}

// Bootstrap is in main.js (setupMainUi + loadSchedule) so schedule loads even if app.js runs late
