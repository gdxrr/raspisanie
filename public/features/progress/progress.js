import { state } from "../../shared/core/state.js";
import { getDeadlinesList } from "../deadlines/deadlines.js";
import { escapeHtml, showToast, getApiHeaders } from "../../shared/core/utils.js";

export async function openProgressModal() {
  const overlay = document.getElementById("progressOverlay");
  if (overlay) overlay.classList.add("open");
  try {
    const res = await fetch("/api/progress", { headers: getApiHeaders(false) });
    state.progressData = res.ok ? await res.json() : {};
    if (typeof state.progressData !== "object") state.progressData = {};
  } catch (e) {
    state.progressData = {};
  }
  renderProgress();
}

export function renderProgress() {
  const summaryEl = document.getElementById("progressSummary");
  const bodyEl = document.getElementById("progressBySubject");
  if (!bodyEl) return;
  const isDeadlineVisible = window.isDeadlineVisible;
  const shortDeadlineTask = window.shortDeadlineTask;
  const formatDeadlineDate = window.formatDeadlineDate;
  if (!isDeadlineVisible || !shortDeadlineTask || !formatDeadlineDate) return;
  const visible = getDeadlinesList().filter((d) => isDeadlineVisible(d));
  const bySubject = {};
  visible.forEach((d) => {
    if (!bySubject[d.subject]) bySubject[d.subject] = [];
    bySubject[d.subject].push(d);
  });
  let totalDone = 0;
  let totalAll = 0;
  let html = "";
  const subjects = Object.keys(bySubject).sort();
  const progressData = state.progressData || {};
  subjects.forEach((subject) => {
    const items = bySubject[subject];
    let done = 0;
    items.forEach((d) => {
      totalAll++;
      if (progressData[d.id]) done++;
    });
    totalDone += done;
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    html += '<div class="progress-subject-block">';
    html += '<div class="progress-subject-header">';
    html += '<span class="progress-subject-name">' + escapeHtml(subject) + "</span>";
    html += '<span class="progress-subject-pct">' + done + "/" + items.length + " · " + pct + "%</span>";
    html += "</div>";
    html += '<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="progress-tasks">';
    items.forEach((d) => {
      const checked = progressData[d.id] ? " checked" : "";
      const strict = d.type === "strict" ? "🔒 " : "";
      html +=
        '<label class="progress-task-row">' +
        '<input type="checkbox" class="progress-task-cb" data-id="' +
        escapeHtml(d.id) +
        '"' +
        checked +
        " onchange=\"toggleProgressItem('" +
        escapeHtml(d.id) +
        "')\">" +
        "<span>" +
        strict +
        escapeHtml(shortDeadlineTask(d.task)) +
        " — " +
        formatDeadlineDate(d.date) +
        "</span></label>";
    });
    html += "</div></div>";
  });
  bodyEl.innerHTML = html || "<p class=\"progress-empty\">Нет дедлайнов из раздела «Дедлайны».</p>";
  if (summaryEl) {
    const totalPct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;
    summaryEl.textContent = "Всего: " + totalDone + " из " + totalAll + " (" + totalPct + "%)";
    summaryEl.style.display = totalAll ? "" : "none";
  }
}

export async function toggleProgressItem(deadlineId) {
  const cb = document.querySelector('.progress-task-cb[data-id="' + deadlineId + '"]');
  const done = cb ? cb.checked : false;
  state.progressData = state.progressData || {};
  state.progressData[deadlineId] = done;
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ deadlineId, done }),
    });
  } catch (e) {
    if (cb) cb.checked = !done;
    state.progressData[deadlineId] = !done;
    showToast("Не удалось сохранить");
  }
}

export function closeProgressModal() {
  const overlay = document.getElementById("progressOverlay");
  if (overlay) overlay.classList.remove("open");
}
