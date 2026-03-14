import { state } from "./state.js";
import { escapeHtml, getApiHeaders } from "./utils.js";

const GAME2048_SIZE = 4;
const GAME2048_BEST_KEY = "game2048_best";

export function openGame2048FromMinigames() {
  if (typeof window.closeMinigamesModal === "function") window.closeMinigamesModal();
  game2048NewGame();
  game2048SetupInput();
  game2048LoadLeaderboard();
  const overlay = document.getElementById("game2048Overlay");
  if (overlay) overlay.classList.add("open");
  document.body.classList.add("game2048-open");
}

export function closeGame2048Modal() {
  const overlay = document.getElementById("game2048Overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.classList.remove("game2048-open");
}

function game2048Init() {
  const grid = [];
  for (let r = 0; r < GAME2048_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GAME2048_SIZE; c++) grid[r][c] = 0;
  }
  state.game2048Grid = grid;
  state.game2048Score = 0;
  state.game2048Over = false;
}

function game2048EmptyCells() {
  const out = [];
  const grid = state.game2048Grid || [];
  for (let r = 0; r < GAME2048_SIZE; r++)
    for (let c = 0; c < GAME2048_SIZE; c++)
      if (grid[r] && grid[r][c] === 0) out.push({ r, c });
  return out;
}

function game2048AddRandomTile() {
  const empty = game2048EmptyCells();
  if (empty.length === 0) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  if (!state.game2048Grid[r]) state.game2048Grid[r] = [];
  state.game2048Grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function game2048MergeLine(line) {
  const indices = [];
  const values = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== 0) {
      indices.push(i);
      values.push(line[i]);
    }
  }
  const merged = [];
  const fromIndices = [];
  let i = 0;
  while (i < values.length) {
    if (i + 1 < values.length && values[i] === values[i + 1]) {
      merged.push(values[i] * 2);
      fromIndices.push(indices[i + 1]);
      state.game2048Score += values[i] * 2;
      i += 2;
    } else {
      merged.push(values[i]);
      fromIndices.push(indices[i]);
      i += 1;
    }
  }
  while (merged.length < GAME2048_SIZE) {
    merged.push(0);
    fromIndices.push(-1);
  }
  return { values: merged, fromIndices };
}

export function game2048Move(dir) {
  if (state.game2048Over) return;
  const grid = state.game2048Grid || [];
  const prevGrid = grid.map((row) => row.slice());
  let changed = false;
  state.game2048FromGrid = [];
  for (let r = 0; r < GAME2048_SIZE; r++) {
    state.game2048FromGrid[r] = [];
    for (let c = 0; c < GAME2048_SIZE; c++) state.game2048FromGrid[r][c] = { r, c };
  }
  if (dir === "left") {
    for (let r = 0; r < GAME2048_SIZE; r++) {
      const line = prevGrid[r].slice();
      const { values: merged, fromIndices } = game2048MergeLine(line);
      if (merged.some((v, i) => v !== (state.game2048Grid[r] && state.game2048Grid[r][i]))) changed = true;
      state.game2048Grid[r] = merged;
      for (let c = 0; c < GAME2048_SIZE; c++)
        state.game2048FromGrid[r][c] = fromIndices[c] >= 0 ? { r, c: fromIndices[c] } : null;
    }
  } else if (dir === "right") {
    for (let r = 0; r < GAME2048_SIZE; r++) {
      const line = prevGrid[r].slice().reverse();
      const { values: merged, fromIndices } = game2048MergeLine(line);
      const revMerged = merged.reverse();
      if (revMerged.some((v, i) => v !== (state.game2048Grid[r] && state.game2048Grid[r][i]))) changed = true;
      state.game2048Grid[r] = revMerged;
      for (let c = 0; c < GAME2048_SIZE; c++) {
        const revPos = GAME2048_SIZE - 1 - c;
        const fi = fromIndices[revPos];
        state.game2048FromGrid[r][c] = fi >= 0 ? { r, c: GAME2048_SIZE - 1 - fi } : null;
      }
    }
  } else if (dir === "up") {
    for (let c = 0; c < GAME2048_SIZE; c++) {
      const line = [];
      for (let r = 0; r < GAME2048_SIZE; r++) line.push(prevGrid[r][c]);
      const { values: merged, fromIndices } = game2048MergeLine(line);
      for (let r = 0; r < GAME2048_SIZE; r++) {
        if ((state.game2048Grid[r] && state.game2048Grid[r][c]) !== merged[r]) changed = true;
        if (!state.game2048Grid[r]) state.game2048Grid[r] = [];
        state.game2048Grid[r][c] = merged[r];
        state.game2048FromGrid[r][c] = fromIndices[r] >= 0 ? { r: fromIndices[r], c } : null;
      }
    }
  } else if (dir === "down") {
    for (let c = 0; c < GAME2048_SIZE; c++) {
      const line = [];
      for (let r = GAME2048_SIZE - 1; r >= 0; r--) line.push(prevGrid[r][c]);
      const { values: merged, fromIndices } = game2048MergeLine(line);
      const revMerged = merged.reverse();
      const revFrom = fromIndices.reverse().map((fi) => (fi >= 0 ? GAME2048_SIZE - 1 - fi : -1));
      for (let r = 0; r < GAME2048_SIZE; r++) {
        if ((state.game2048Grid[r] && state.game2048Grid[r][c]) !== revMerged[r]) changed = true;
        if (!state.game2048Grid[r]) state.game2048Grid[r] = [];
        state.game2048Grid[r][c] = revMerged[r];
        state.game2048FromGrid[r][c] = revFrom[r] >= 0 ? { r: revFrom[r], c } : null;
      }
    }
  }
  if (changed) {
    game2048AddRandomTile();
    const best = Math.max(state.game2048Score, parseInt(localStorage.getItem(GAME2048_BEST_KEY) || "0", 10));
    localStorage.setItem(GAME2048_BEST_KEY, String(best));
  } else {
    state.game2048FromGrid = null;
  }
  game2048CheckOver();
  game2048Render();
}

function game2048CanMove() {
  const grid = state.game2048Grid || [];
  for (let r = 0; r < GAME2048_SIZE; r++) {
    for (let c = 0; c < GAME2048_SIZE; c++) {
      if ((grid[r] && grid[r][c]) === 0) return true;
      if (c + 1 < GAME2048_SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < GAME2048_SIZE && grid[r][c] === (grid[r + 1] && grid[r + 1][c])) return true;
    }
  }
  return false;
}

function game2048CheckOver() {
  if (game2048EmptyCells().length > 0) return;
  if (!game2048CanMove()) {
    state.game2048Over = true;
    game2048SubmitScore();
  }
}

function game2048Render() {
  const gridEl = document.getElementById("game2048Grid");
  const scoreEl = document.getElementById("game2048Score");
  const bestEl = document.getElementById("game2048Best");
  const overEl = document.getElementById("game2048Over");
  if (!gridEl) return;
  const grid = state.game2048Grid || [];
  if (scoreEl) scoreEl.textContent = state.game2048Score;
  if (bestEl) bestEl.textContent = localStorage.getItem(GAME2048_BEST_KEY) || "0";
  if (overEl) overEl.style.display = state.game2048Over ? "block" : "none";
  gridEl.innerHTML = "";
  for (let r = 0; r < GAME2048_SIZE; r++) {
    for (let c = 0; c < GAME2048_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "game2048-cell";
      const val = grid[r] && grid[r][c] ? grid[r][c] : 0;
      if (val > 0) {
        const tile = document.createElement("div");
        tile.className = "game2048-tile game2048-tile-" + Math.min(val, 2048);
        tile.textContent = val;
        cell.appendChild(tile);
      }
      gridEl.appendChild(cell);
    }
  }
}

export function game2048NewGame() {
  game2048Init();
  game2048AddRandomTile();
  game2048AddRandomTile();
  game2048Render();
}

export async function game2048LoadLeaderboard() {
  try {
    const res = await fetch("/api/game2048-leaderboard");
    state.game2048Leaderboard = res.ok ? await res.json() : [];
    if (!Array.isArray(state.game2048Leaderboard)) state.game2048Leaderboard = [];
    game2048RenderLeaderboard();
  } catch (e) {
    state.game2048Leaderboard = [];
    game2048RenderLeaderboard();
  }
}

function game2048RenderLeaderboard() {
  const listEl = document.getElementById("game2048LeaderboardList");
  if (!listEl) return;
  const list = state.game2048Leaderboard || [];
  if (list.length === 0) {
    listEl.innerHTML = "<p class=\"game2048-leaderboard-empty\">Пока никого нет. Сыграйте и попадите в топ!</p>";
    return;
  }
  listEl.innerHTML =
    "<ol class=\"game2048-leaderboard-ol\">" +
    list
      .map(
        (e, i) =>
          "<li class=\"game2048-leaderboard-li\"><span class=\"game2048-lb-rank\">" +
          (i + 1) +
          "</span><span class=\"game2048-lb-name\">" +
          escapeHtml(e.name || "Игрок") +
          "</span><span class=\"game2048-lb-score\">" +
          e.score +
          "</span></li>"
      )
      .join("") +
    "</ol>";
}

export function game2048ToggleLeaderboard() {
  const listEl = document.getElementById("game2048LeaderboardList");
  if (!listEl) return;
  const visible = listEl.style.display !== "none";
  listEl.style.display = visible ? "none" : "block";
  if (!visible) game2048LoadLeaderboard();
}

export async function game2048SubmitScore() {
  if (state.game2048Score <= 0) return;
  try {
    const name =
      (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user && window.Telegram.WebApp.initDataUnsafe.user.first_name) ||
      "Игрок";
    await fetch("/api/game2048-leaderboard", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ score: state.game2048Score, name }),
    });
    game2048LoadLeaderboard();
  } catch (e) {
    console.error(e);
  }
}

export function game2048SetupInput() {
  const overlay = document.getElementById("game2048Overlay");
  if (!overlay || overlay._game2048Input) return;
  overlay._game2048Input = true;
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) === -1) return;
    e.preventDefault();
    const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
    game2048Move(map[e.key]);
  });
  let touchStartX = 0, touchStartY = 0;
  overlay.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  overlay.addEventListener("touchmove", (e) => {
    if (overlay.classList.contains("open")) e.preventDefault();
  }, { passive: false });
  overlay.addEventListener("touchend", (e) => {
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const min = 30;
    if (Math.abs(dx) >= min || Math.abs(dy) >= min) {
      if (Math.abs(dx) > Math.abs(dy)) game2048Move(dx > 0 ? "right" : "left");
      else game2048Move(dy > 0 ? "down" : "up");
    }
  }, { passive: true });
}
