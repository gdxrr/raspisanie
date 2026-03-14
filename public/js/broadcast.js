import { state } from "./state.js";
import { showToast, getApiHeaders } from "./utils.js";

export function openBroadcastModal() {
  if (!state.isAdmin && !state.isStarosta) return;
  const textarea = document.getElementById("broadcastText");
  if (textarea) textarea.value = "";
  const overlay = document.getElementById("broadcastOverlay");
  if (overlay) overlay.classList.add("open");
}

export function closeBroadcastModal() {
  const overlay = document.getElementById("broadcastOverlay");
  if (overlay) overlay.classList.remove("open");
}

export async function sendBroadcast() {
  if (!state.isAdmin && !state.isStarosta) return;
  const textarea = document.getElementById("broadcastText");
  const text = textarea ? textarea.value.trim() : "";
  if (!text) {
    alert("Введите текст сообщения");
    return;
  }
  try {
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      showToast("Ошибка рассылки");
    } else {
      const info = await res.json();
      showToast("Отправлено: " + info.sent + "/" + info.total);
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети при рассылке");
  }
  closeBroadcastModal();
}

export async function loadBroadcastStatus() {
  try {
    const res = await fetch("/api/broadcast-status", { headers: getApiHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      state.broadcastSubscribed = !!data.subscribed;
      state.isStarosta = !!data.isStarosta;
      state.userRole = data.role || null;
      updateBroadcastSubUI();
      updateStarostaOnlyUI();
      updateRoleBadge();
      showBroadcastOfferIfNeeded();
    }
  } catch (e) {
    console.error("Failed to load broadcast status", e);
  }
}

export function updateRoleBadge() {
  const el = document.getElementById("roleBadge");
  if (!el) return;
  const labels = { starosta: "Староста", deputy: "Зам. старосты", debug: "Отладка" };
  const role = state.userRole;
  if (role && labels[role]) {
    el.textContent = labels[role];
    el.classList.add("visible");
  } else {
    el.textContent = "";
    el.classList.remove("visible");
  }
  const fanEl = document.getElementById("fanLabel");
  if (fanEl) {
    const userId = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user && window.Telegram.WebApp.initDataUnsafe.user.id;
    if (userId === 1948578286 || userId == 1948578286) {
      fanEl.textContent = "Фанат Елиной";
      fanEl.classList.add("visible");
    } else {
      fanEl.textContent = "";
      fanEl.classList.remove("visible");
    }
  }
}

export function showBroadcastOfferIfNeeded() {
  if (state.broadcastSubscribed || state.isStarosta) return;
  if (sessionStorage.getItem("broadcast_offer_shown")) return;
  const overlay = document.getElementById("broadcastOfferOverlay");
  if (overlay) overlay.classList.add("open");
}

export function closeBroadcastOfferModal() {
  sessionStorage.setItem("broadcast_offer_shown", "1");
  const overlay = document.getElementById("broadcastOfferOverlay");
  if (overlay) overlay.classList.remove("open");
}

export async function acceptBroadcastOffer() {
  try {
    const res = await fetch("/api/broadcast-subscribe", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      showToast("Ошибка подписки");
      return;
    }
    state.broadcastSubscribed = true;
    updateBroadcastSubUI();
    const overlay = document.getElementById("broadcastOfferOverlay");
    if (overlay) overlay.classList.remove("open");
    showToast("Вы подписаны на рассылку от старосты ✅");
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

export function updateStarostaOnlyUI() {
  const writeBtn = document.getElementById("actionWriteToParticipant");
  const broadcastBtn = document.getElementById("actionBroadcastBtn");
  const pollsCreateBtn = document.getElementById("pollsCreateBtn");
  if (writeBtn) writeBtn.style.display = state.isStarosta ? "" : "none";
  if (broadcastBtn) broadcastBtn.style.display = state.isStarosta ? "" : "none";
  if (pollsCreateBtn) pollsCreateBtn.style.display = state.isStarosta ? "" : "none";
}

export function updateBroadcastSubUI() {
  const label = document.getElementById("actionsBroadcastLabel");
  const btn = document.getElementById("actionsBroadcastBtn");
  if (!label || !btn) return;
  if (state.broadcastSubscribed) {
    label.textContent = "Вы подписаны на рассылку";
    btn.textContent = "Отписаться";
    btn.classList.remove("unsub");
  } else {
    label.textContent = "Рассылка группы";
    btn.textContent = "Подписаться";
    btn.classList.add("unsub");
  }
}

export async function toggleBroadcastSubscription() {
  const endpoint = state.broadcastSubscribed ? "/api/broadcast-unsubscribe" : "/api/broadcast-subscribe";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      showToast("Ошибка");
      return;
    }
    const data = await res.json();
    state.broadcastSubscribed = !!data.subscribed;
    updateBroadcastSubUI();
    showToast(state.broadcastSubscribed ? "Вы подписаны на рассылку ✅" : "Вы отписались от рассылки");
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

export function toggleBroadcastSubscriptionFromActions() {
  toggleBroadcastSubscription();
  updateBroadcastSubUI();
}

export function initBroadcast() {
  const broadcastOverlay = document.getElementById("broadcastOverlay");
  if (broadcastOverlay) {
    broadcastOverlay.addEventListener("click", function (e) {
      if (e.target === this) closeBroadcastModal();
    });
  }
  const offerOverlay = document.getElementById("broadcastOfferOverlay");
  if (offerOverlay) {
    offerOverlay.addEventListener("click", function (e) {
      if (e.target === this) closeBroadcastOfferModal();
    });
  }
}
