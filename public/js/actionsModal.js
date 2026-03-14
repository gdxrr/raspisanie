import { state } from "./state.js";
import { GUAP_SSO_URL } from "./constants.js";
import { getApiHeaders } from "./utils.js";

export function openActionsModal() {
  if (typeof window.updateBroadcastSubUI === "function") window.updateBroadcastSubUI();
  if (typeof window.updateStarostaOnlyUI === "function") window.updateStarostaOnlyUI();
  document.querySelectorAll(".actions-modal-body [data-action-id]").forEach((el) => {
    const id = el.getAttribute("data-action-id");
    el.style.display = state.hiddenActionIds.has(id) ? "none" : "";
  });
  const overlay = document.getElementById("actionsOverlay");
  if (overlay) overlay.classList.add("open");
}

export function closeActionsModal() {
  const overlay = document.getElementById("actionsOverlay");
  if (overlay) overlay.classList.remove("open");
}

export function openStarostaFromActions() {
  closeActionsModal();
  if (typeof window.openStarostaModal === "function") window.openStarostaModal();
}

export async function openWriteToParticipantFromActions() {
  closeActionsModal();
  if (typeof window.openWriteToParticipantModal === "function") await window.openWriteToParticipantModal();
}

export function openBroadcastFromActions() {
  closeActionsModal();
  if (typeof window.openBroadcastModal === "function") window.openBroadcastModal();
}

export function openRemindersFromActions() {
  closeActionsModal();
  if (typeof window.openRemindersModal === "function") window.openRemindersModal();
}

export function openDeadlinesFromActions() {
  closeActionsModal();
  if (typeof window.openDeadlinesModal === "function") window.openDeadlinesModal();
}

export function openProgressFromActions() {
  closeActionsModal();
  if (typeof window.openProgressModal === "function") window.openProgressModal();
}

export function openPollsFromActions() {
  closeActionsModal();
  if (typeof window.openPollsModal === "function") window.openPollsModal();
}

export function openGuapLk() {
  if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.openLink === "function") {
    window.Telegram.WebApp.openLink(GUAP_SSO_URL);
  } else {
    window.open(GUAP_SSO_URL, "_blank", "noopener,noreferrer");
  }
}

export function toggleWeekLabel() {
  const popover = document.getElementById("weekLabelPopover");
  if (popover) popover.classList.toggle("visible");
}

export function openGuapFromActions() {
  closeActionsModal();
  openGuapLk();
}

export function openFeedbackFromActions() {
  closeActionsModal();
  if (typeof window.openFeedbackModal === "function") window.openFeedbackModal();
}

export function openLikesFromActions() {
  closeActionsModal();
  if (typeof window.openLikesModal === "function") window.openLikesModal();
}

export function openCasinoFromActions() {
  closeActionsModal();
  if (typeof window.openCasinoModal === "function") window.openCasinoModal();
}

export function openMinigamesFromActions() {
  closeActionsModal();
  const overlay = document.getElementById("minigamesOverlay");
  if (overlay) overlay.classList.add("open");
}

export function openMonopolyFromActions() {
  closeActionsModal();
  if (typeof window.openMonopolyModal === "function") window.openMonopolyModal();
}

export function openAchievementsFromActions() {
  closeActionsModal();
  if (typeof window.openAchievementsModal === "function") window.openAchievementsModal();
}

export function openD20FromActions() {
  closeActionsModal();
  if (typeof window.openD20Modal === "function") window.openD20Modal();
}

export function openBetsFromActions() {
  closeActionsModal();
  if (typeof window.openBetsModal === "function") window.openBetsModal();
}

export function sendLikeFromActions() {
  closeActionsModal();
  if (typeof window.sendLike === "function") window.sendLike();
  if (typeof window.showToast === "function") window.showToast("Лайк отправлен");
}

export async function exportScheduleFromActions() {
  closeActionsModal();
  const format = "ics";
  const today = new Date();
  const from = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  const toDate = new Date(today);
  toDate.setDate(toDate.getDate() + 28);
  const to = toDate.getFullYear() + "-" + String(toDate.getMonth() + 1).padStart(2, "0") + "-" + String(toDate.getDate()).padStart(2, "0");
  const url = "/api/schedule/export?format=" + format + "&from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to);
  try {
    const res = await fetch(url, { headers: getApiHeaders(false) });
    if (!res.ok) throw new Error(res.statusText);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "raspisanie.ics";
    a.click();
    URL.revokeObjectURL(a.href);
    if (typeof window.showToast === "function") window.showToast("Календарь сохранён");
  } catch (e) {
    console.error("Export failed", e);
    if (typeof window.showToast === "function") window.showToast("Ошибка экспорта");
  }
}
