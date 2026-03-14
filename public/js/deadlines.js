import { state } from "./state.js";
import { DEADLINES_LIST } from "./constants.js";
import { escapeHtml, showToast, getApiHeaders } from "./utils.js";

export function isDeadlineVisible(d) {
  return state.deadlinesVisibleBySubject[d.subject] !== false;
}

export function getDeadlinesOnDate(year, month1Based, dayOfMonth) {
  const dateStr =
    String(year) +
    "-" +
    String(month1Based).padStart(2, "0") +
    "-" +
    String(dayOfMonth).padStart(2, "0");
  return DEADLINES_LIST.filter((d) => d.date === dateStr && isDeadlineVisible(d));
}

export function formatDeadlineDate(dateStr) {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return (d || "") + "." + (m || "") + "." + (y || "");
}

export function shortDeadlineTask(task) {
  if (!task || typeof task !== "string") return task;
  const i = task.indexOf(" – ");
  if (i !== -1) return task.slice(0, i).trim();
  const j = task.indexOf(" - ");
  if (j !== -1) return task.slice(0, j).trim();
  return task;
}

const DEADLINE_REMINDER_OPTIONS = [
  { days: 1, label: "за 1 день" },
  { days: 3, label: "за 3 дня" },
  { days: 7, label: "за 1 неделю" },
  { days: 14, label: "за 2 недели" },
];

function renderDeadlinesListHtml(sortByDate) {
  const typeIcon = (t) => (t === "strict" ? "🔒 " : "");
  const typeLabel = (t) => (t === "strict" ? "Строгий" : "Нестрогий");
  const renderItem = (d, showSubject) => {
    const vis = isDeadlineVisible(d) ? "" : " (скрыт)";
    const taskShort = shortDeadlineTask(d.task);
    return (
      '<div class="deadlines-item' +
      (d.type === "strict" ? " deadline-strict" : "") +
      '">' +
      '<span class="deadlines-item-type" title="' +
      typeLabel(d.type) +
      '">' +
      typeIcon(d.type) +
      "</span>" +
      '<span class="deadlines-item-task">' +
      escapeHtml(taskShort) +
      "</span>" +
      (showSubject ? '<span class="deadlines-item-subject">' + escapeHtml(d.subject) + "</span>" : "") +
      '<span class="deadlines-item-date">' +
      formatDeadlineDate(d.date) +
      "</span>" +
      (vis ? '<span class="deadlines-item-hidden">' + vis + "</span>" : "") +
      "</div>"
    );
  };
  let html = "";
  if (sortByDate) {
    const byDate = {};
    DEADLINES_LIST.forEach((d) => {
      if (!byDate[d.date]) byDate[d.date] = [];
      byDate[d.date].push(d);
    });
    Object.keys(byDate)
      .sort()
      .forEach((dateStr) => {
        html += '<div class="deadlines-group"><div class="deadlines-group-title">' + formatDeadlineDate(dateStr) + "</div>";
        byDate[dateStr].sort((a, b) => (a.subject || "").localeCompare(b.subject || ""));
        byDate[dateStr].forEach((d) => (html += renderItem(d, true)));
        html += "</div>";
      });
  } else {
    const grouped = {};
    DEADLINES_LIST.forEach((d) => {
      if (!grouped[d.subject]) grouped[d.subject] = [];
      grouped[d.subject].push(d);
    });
    Object.keys(grouped)
      .sort()
      .forEach((subject) => {
        html += '<div class="deadlines-group"><div class="deadlines-group-title">' + escapeHtml(subject) + "</div>";
        grouped[subject].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        grouped[subject].forEach((d) => (html += renderItem(d, false)));
        html += "</div>";
      });
  }
  return html;
}

export function openDeadlinesModal() {
  const listEl = document.getElementById("deadlinesList");
  const sortEl = document.getElementById("deadlinesSortSelect");
  if (!listEl) return;
  if (sortEl) sortEl.value = state.deadlinesSort;
  listEl.innerHTML = renderDeadlinesListHtml(state.deadlinesSort === "date");
  const subjEl = document.getElementById("deadlinesSubjectToggles");
  if (subjEl) {
    const subjects = [...new Set(DEADLINES_LIST.map((d) => d.subject))];
    subjEl.innerHTML =
      '<span class="deadlines-visibility-label">В календаре и расписании:</span>' +
      subjects
        .map(
          (s) =>
            '<label class="settings-action-check">' +
            '<input type="checkbox" class="deadline-subject-cb" data-subject="' +
            escapeHtml(s).replace(/"/g, "&quot;") +
            '"' +
            (state.deadlinesVisibleBySubject[s] !== false ? " checked" : "") +
            "> " +
            escapeHtml(s) +
            "</label>"
        )
        .join("");
  }
  document.getElementById("deadlinesOverlay").classList.add("open");
  buildDeadlinesRemindersGrid();
  loadDeadlineRemindersIntoModal();
}

export function buildDeadlinesRemindersGrid() {
  const container = document.getElementById("deadlinesRemindersOptions");
  if (!container) return;
  const subjects = [...new Set(DEADLINES_LIST.map((d) => d.subject).filter(Boolean))].sort();
  if (subjects.length === 0) {
    container.innerHTML = "<p class=\"deadlines-reminders-empty\">Нет предметов с дедлайнами</p>";
    return;
  }
  let html = "";
  DEADLINE_REMINDER_OPTIONS.forEach((opt) => {
    html += '<div class="deadlines-reminders-row">';
    html += '<span class="deadlines-reminders-row-label">' + escapeHtml(opt.label) + "</span>";
    html += '<div class="deadlines-reminders-row-checks">';
    subjects.forEach((subj) => {
      html +=
        '<label class="settings-action-check">' +
        '<input type="checkbox" class="deadline-reminder-cb" data-days="' +
        opt.days +
        '" data-subject="' +
        escapeHtml(subj).replace(/"/g, "&quot;") +
        '"> ' +
        escapeHtml(subj) +
        "</label>";
    });
    html += "</div></div>";
  });
  container.innerHTML = html;
}

export async function loadDeadlineRemindersIntoModal() {
  try {
    const res = await fetch("/api/deadline-reminders", { headers: getApiHeaders(false) });
    const data = await res.json();
    const bySubject = (data.bySubject && typeof data.bySubject === "object") ? data.bySubject : {};
    document.querySelectorAll(".deadline-reminder-cb").forEach((cb) => {
      const days = Number(cb.getAttribute("data-days"));
      const subject = cb.getAttribute("data-subject");
      const arr = bySubject[subject];
      cb.checked = Array.isArray(arr) && Number.isInteger(days) && arr.includes(days);
    });
  } catch (e) {}
}

export function closeDeadlinesModal() {
  const el = document.getElementById("deadlinesOverlay");
  if (el) el.classList.remove("open");
}

export function changeDeadlinesSort() {
  const sortEl = document.getElementById("deadlinesSortSelect");
  if (!sortEl) return;
  state.deadlinesSort = sortEl.value === "date" ? "date" : "subject";
  try {
    localStorage.setItem("schedule_deadlines_sort", state.deadlinesSort);
  } catch (e) {}
  const listEl = document.getElementById("deadlinesList");
  if (!listEl) return;
  listEl.innerHTML = renderDeadlinesListHtml(state.deadlinesSort === "date");
}

export function toggleDeadlinesVisibilitySection() {
  const body = document.getElementById("deadlinesVisibilityBody");
  const btn = document.getElementById("deadlinesToggleVisibility");
  if (body) body.style.display = body.style.display === "none" ? "block" : "none";
  if (btn) btn.setAttribute("aria-pressed", body && body.style.display !== "none" ? "true" : "false");
}

export function toggleDeadlinesRemindersSection() {
  const body = document.getElementById("deadlinesRemindersBody");
  const btn = document.getElementById("deadlinesToggleReminders");
  if (body) body.style.display = body.style.display === "none" ? "block" : "none";
  if (btn) btn.setAttribute("aria-pressed", body && body.style.display !== "none" ? "true" : "false");
}

export function saveDeadlinesVisibility() {
  const bySubject = {};
  document.querySelectorAll(".deadline-subject-cb").forEach((cb) => {
    bySubject[cb.getAttribute("data-subject")] = cb.checked;
  });
  state.deadlinesVisibleBySubject = bySubject;
  try {
    localStorage.setItem("schedule_deadlines_visible", JSON.stringify(bySubject));
  } catch (e) {}
  if (typeof window.renderSchedule === "function") window.renderSchedule();
  if (state.viewMode === "calendar" && typeof window.renderCalendar === "function") window.renderCalendar();
  showToast("Настройки дедлайнов сохранены");
}

export async function saveDeadlineReminders() {
  const subjects = [...new Set(DEADLINES_LIST.map((d) => d.subject).filter(Boolean))];
  const bySubject = {};
  subjects.forEach((s) => (bySubject[s] = []));
  document.querySelectorAll(".deadline-reminder-cb:checked").forEach((cb) => {
    const subject = cb.getAttribute("data-subject");
    const d = Number(cb.getAttribute("data-days"));
    if (subject && bySubject[subject] && Number.isInteger(d)) bySubject[subject].push(d);
  });
  Object.keys(bySubject).forEach((s) => {
    bySubject[s] = [...new Set(bySubject[s])];
    if (bySubject[s].length === 0) delete bySubject[s];
  });
  try {
    const res = await fetch("/api/deadline-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders(false) },
      body: JSON.stringify({ bySubject }),
    });
    if (res.ok) showToast("Напоминания о дедлайнах сохранены");
  } catch (e) {
    showToast("Ошибка сохранения");
  }
}
