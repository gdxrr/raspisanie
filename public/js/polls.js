import { state } from "./state.js";
import { escapeHtml, showToast, getApiHeaders } from "./utils.js";

export async function openPollsModal() {
  const overlay = document.getElementById("pollsOverlay");
  if (overlay) overlay.classList.add("open");
  await loadPolls();
}

export async function loadPolls() {
  try {
    const res = await fetch("/api/polls", { headers: getApiHeaders(false) });
    state.pollsListData = res.ok ? await res.json() : [];
    if (!Array.isArray(state.pollsListData)) state.pollsListData = [];
  } catch (e) {
    state.pollsListData = [];
  }
  renderPolls();
}

export function renderPolls() {
  const listEl = document.getElementById("pollsList");
  if (!listEl) return;
  const userId = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user && window.Telegram.WebApp.initDataUnsafe.user.id;
  const uid = userId != null ? String(userId) : "";
  const pollsListData = state.pollsListData || [];
  if (pollsListData.length === 0) {
    listEl.innerHTML = "<p class=\"polls-empty\">Пока нет голосований.</p>";
    return;
  }
  listEl.innerHTML = pollsListData
    .map((poll) => {
      const total = poll.options.reduce((s, o) => s + (o.count || 0), 0);
      const myVote = poll.voted && uid && poll.voted[uid] !== undefined ? poll.voted[uid] : -1;
      let optsHtml;
      if (poll.closed) {
        optsHtml = poll.options
          .map(
            (o) =>
              '<div class="polls-option-result">' +
              escapeHtml(o.text) +
              " — <strong>" +
              (o.count || 0) +
              "</strong></div>"
          )
          .join("");
      } else {
        optsHtml = poll.options
          .map(
            (o, i) =>
              '<button type="button" class="polls-option-btn' +
              (myVote === i ? " polls-option-voted" : "") +
              '" onclick="votePoll(\'' +
              poll.id +
              "', " +
              i +
              ')">' +
              escapeHtml(o.text) +
              (total > 0 ? " <span class=\"polls-option-count\">" + (o.count || 0) + "</span>" : "") +
              "</button>"
          )
          .join("");
      }
      return (
        '<div class="polls-card' +
        (poll.closed ? " polls-card-closed" : "") +
        '">' +
        '<div class="polls-question">' +
        escapeHtml(poll.question) +
        "</div>" +
        '<div class="polls-options">' +
        optsHtml +
        "</div>" +
        (state.isStarosta && !poll.closed
          ? '<button type="button" class="btn-secondary btn-small polls-close-btn" onclick="closePoll(\'' + poll.id + '\')">Закрыть голосование</button>'
          : "") +
        "</div>"
      );
    })
    .join("");
}

export async function votePoll(pollId, optionIndex) {
  try {
    const res = await fetch("/api/polls/" + encodeURIComponent(pollId) + "/vote", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ optionIndex }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error === "poll_closed" ? "Голосование закрыто" : "Ошибка");
      return;
    }
    const updated = await res.json();
    const list = state.pollsListData || [];
    const idx = list.findIndex((p) => p.id === pollId);
    if (idx >= 0) state.pollsListData[idx] = updated;
    renderPolls();
  } catch (e) {
    showToast("Ошибка сети");
  }
}

export async function closePoll(pollId) {
  try {
    await fetch("/api/polls/" + encodeURIComponent(pollId) + "/close", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({}),
    });
    const list = state.pollsListData || [];
    const idx = list.findIndex((p) => p.id === pollId);
    if (idx >= 0) state.pollsListData[idx].closed = true;
    renderPolls();
  } catch (e) {
    showToast("Ошибка");
  }
}

export function closePollsModal() {
  const overlay = document.getElementById("pollsOverlay");
  if (overlay) overlay.classList.remove("open");
}

export function openCreatePollModal() {
  const qEl = document.getElementById("createPollQuestion");
  const oEl = document.getElementById("createPollOptions");
  const overlay = document.getElementById("createPollOverlay");
  if (qEl) qEl.value = "";
  if (oEl) oEl.value = "";
  if (overlay) overlay.classList.add("open");
}

export function closeCreatePollModal() {
  const overlay = document.getElementById("createPollOverlay");
  if (overlay) overlay.classList.remove("open");
}

export async function submitCreatePoll() {
  const questionEl = document.getElementById("createPollQuestion");
  const optionsEl = document.getElementById("createPollOptions");
  const question = (questionEl && questionEl.value || "").trim();
  const raw = optionsEl ? optionsEl.value || "" : "";
  const options = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!question || options.length < 2) {
    showToast("Введите вопрос и минимум 2 варианта ответа");
    return;
  }
  try {
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ question, options }),
    });
    if (!res.ok) {
      showToast("Ошибка создания");
      return;
    }
    closeCreatePollModal();
    await loadPolls();
    showToast("Голосование создано");
  } catch (e) {
    showToast("Ошибка сети");
  }
}
