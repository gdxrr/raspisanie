import { state } from "../core/state.js";
import { showToast, getApiHeaders } from "../core/utils.js";

export function openHiddenPairsFromActions() {
  if (typeof window.closeActionsModal === "function") window.closeActionsModal();
  openHiddenPairsModal();
}

export function openHiddenPairsModal() {
  const schedule = state.schedule;
  const hiddenPairIds = state.hiddenPairIds;
  const dimmedPairIds = state.dimmedPairIds;
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

export function closeHiddenPairsModal() {
  document.getElementById("hiddenPairsOverlay").classList.remove("open");
}

export async function saveHiddenPairs() {
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
    state.hiddenPairIds = new Set(data.hiddenIds || []);
    state.dimmedPairIds = new Set(data.dimmedIds || []);
    if (typeof window.renderSchedule === "function") window.renderSchedule();
    showToast("Список сохранён");
  } catch (e) {
    console.error(e);
    showToast("Ошибка сохранения");
  }
  closeHiddenPairsModal();
}

export async function openRemindersModal() {
  const schedule = state.schedule;
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

export function closeRemindersModal() {
  document.getElementById("remindersOverlay").classList.remove("open");
}

export async function saveReminders() {
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

export async function openWriteToParticipantModal() {
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

export function closeWriteToParticipantModal() {
  document.getElementById("writeToParticipantOverlay").classList.remove("open");
}

export async function sendToParticipant() {
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

export function openStarostaModal() {
  const textarea = document.getElementById("starostaText");
  if (textarea) textarea.value = "";
  document.getElementById("starostaOverlay").classList.add("open");
}

export function closeStarostaModal() {
  document.getElementById("starostaOverlay").classList.remove("open");
}

export async function sendStarostaMessage() {
  const textarea = document.getElementById("starostaText");
  const text = textarea ? textarea.value.trim() : "";
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

export function openFeedbackModal() {
  const textarea = document.getElementById("feedbackText");
  if (textarea) textarea.value = "";
  document.getElementById("feedbackOverlay").classList.add("open");
}

export function closeFeedbackModal() {
  document.getElementById("feedbackOverlay").classList.remove("open");
}

export async function sendFeedback() {
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

export function initParticipantModals() {
  const overlays = [
    ["hiddenPairsOverlay", closeHiddenPairsModal],
    ["remindersOverlay", closeRemindersModal],
    ["writeToParticipantOverlay", closeWriteToParticipantModal],
    ["starostaOverlay", closeStarostaModal],
    ["feedbackOverlay", closeFeedbackModal],
  ];
  overlays.forEach(([id, closeFn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", function (e) { if (e.target === this) closeFn(); });
  });
}
