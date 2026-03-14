import { state } from "./state.js";
import { escapeHtml, showToast, getApiHeaders } from "./utils.js";

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
  const achievementsState = state.achievementsState;
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
  const achievementsState = state.achievementsState;
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
  const achievementsState = state.achievementsState;
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
  const achievementsState = state.achievementsState;
  achievementsState.available = false;
  achievementsState.canCreate = false;
  achievementsState.items = [];
  achievementsState.statuettesCount = 0;
  achievementsState.statusText = message;
  achievementsRender();
}

async function achievementsLoadBootstrap() {
  const achievementsState = state.achievementsState;
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
  const achievementsState = state.achievementsState;
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
  const achievementsState = state.achievementsState;
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
  const achievementsState = state.achievementsState;
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
  const achievementsState = state.achievementsState;
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

export function openAchievementsModal() {
  const achievementsState = state.achievementsState;
  achievementsState.available = null;
  achievementsState.statusText = "Загрузка данных...";
  achievementsRender();
  document.getElementById("achievementsOverlay").classList.add("open");
  achievementsLoadBootstrap().then(function () {
    if (achievementsState.available !== false) achievementsConnectSocket();
  });
}

export function closeAchievementsModal() {
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

export async function achievementsSubmitCreate() {
  const achievementsState = state.achievementsState;
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

export function initAchievements() {
  const overlay = document.getElementById("achievementsOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this) closeAchievementsModal();
    });
  }
}
