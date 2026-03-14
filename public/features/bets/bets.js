import { state } from "../../shared/core/state.js";
import { showToast, getApiHeaders } from "../../shared/core/utils.js";

const GROUP_SIZE_BETS = 28;

export async function openBetsModal() {
  const schedule = state.schedule;
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

export function closeBetsModal() {
  document.getElementById("betsOverlay").classList.remove("open");
}

export async function saveBet(scheduleId) {
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

export function initBets() {
  const overlay = document.getElementById("betsOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this) closeBetsModal();
    });
  }
}
