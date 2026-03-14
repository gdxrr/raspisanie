import { state } from "../core/state.js";

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
  const grid = state.blockBlastGrid;
  grid.length = 0;
  for (let r = 0; r < BLOCK_BLAST_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < BLOCK_BLAST_SIZE; c++) grid[r][c] = 0;
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
  const grid = state.blockBlastGrid;
  const h = piece.length;
  const w = piece[0].length;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!piece[r][c]) continue;
      const nr = row + r;
      const nc = col + c;
      if (nr < 0 || nr >= BLOCK_BLAST_SIZE || nc < 0 || nc >= BLOCK_BLAST_SIZE) return false;
      if (grid[nr] && grid[nr][nc]) return false;
    }
  }
  return true;
}

function blockBlastPlace(piece, row, col) {
  const grid = state.blockBlastGrid;
  const pieces = state.blockBlastPieces;
  const h = piece.length;
  const w = piece[0].length;
  let cells = 0;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (piece[r][c]) {
        grid[row + r][col + c] = 1;
        cells++;
      }
    }
  }
  state.blockBlastScore += cells;
  blockBlastClearLines();
  const idx = state.blockBlastSelectedPieceIndex;
  pieces.splice(idx, 1);
  state.blockBlastSelectedPieceIndex = -1;
  if (pieces.length === 0) state.blockBlastPieces.push(...blockBlastGetRandomPieces(3));
  blockBlastRender();
}

function blockBlastClearLines() {
  const grid = state.blockBlastGrid;
  let cleared = 0;
  for (let r = 0; r < BLOCK_BLAST_SIZE; r++) {
    if (grid[r] && grid[r].every((v) => v === 1)) {
      grid[r].fill(0);
      cleared++;
    }
  }
  for (let c = 0; c < BLOCK_BLAST_SIZE; c++) {
    let full = true;
    for (let r = 0; r < BLOCK_BLAST_SIZE; r++) if (!grid[r] || !grid[r][c]) full = false;
    if (full) {
      for (let r = 0; r < BLOCK_BLAST_SIZE; r++) grid[r][c] = 0;
      cleared++;
    }
  }
  if (cleared > 0) state.blockBlastScore += cleared * BLOCK_BLAST_SIZE * 2;
}

function blockBlastCanPlaceAny() {
  const grid = state.blockBlastGrid;
  const pieces = state.blockBlastPieces;
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    for (let r = 0; r <= BLOCK_BLAST_SIZE - piece.length; r++) {
      for (let c = 0; c <= BLOCK_BLAST_SIZE - piece[0].length; c++) {
        if (blockBlastCanPlace(piece, r, c)) return true;
      }
    }
  }
  return false;
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

function blockBlastCreateGhost(piece) {
  const ghost = document.createElement("div");
  ghost.className = "blockblast-ghost";
  ghost.innerHTML = blockBlastPieceToHtml(piece);
  ghost.style.left = "0";
  ghost.style.top = "0";
  return ghost;
}

function blockBlastOnCellClick(e) {
  const grid = state.blockBlastGrid;
  const pieces = state.blockBlastPieces;
  if (state.blockBlastSelectedPieceIndex < 0 || state.blockBlastGameOver) return;
  const row = parseInt(e.currentTarget.dataset.row, 10);
  const col = parseInt(e.currentTarget.dataset.col, 10);
  const piece = pieces[state.blockBlastSelectedPieceIndex];
  if (!blockBlastCanPlace(piece, row, col)) return;
  blockBlastPlace(piece, row, col);
  if (!blockBlastCanPlaceAny()) {
    state.blockBlastGameOver = true;
    blockBlastRender();
  }
}

function blockBlastRender() {
  const grid = state.blockBlastGrid;
  const pieces = state.blockBlastPieces;
  const gridEl = document.getElementById("blockBlastGrid");
  const piecesEl = document.getElementById("blockBlastPieces");
  const scoreEl = document.getElementById("blockBlastScore");
  const statusEl = document.getElementById("blockBlastStatus");
  const restartBtn = document.getElementById("blockBlastRestartBtn");
  if (!gridEl || !piecesEl) return;
  if (scoreEl) scoreEl.textContent = state.blockBlastScore;
  gridEl.innerHTML = "";
  gridEl.style.pointerEvents = state.blockBlastGameOver ? "none" : "";
  for (let r = 0; r < BLOCK_BLAST_SIZE; r++) {
    for (let c = 0; c < BLOCK_BLAST_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "blockblast-cell" + (grid[r] && grid[r][c] ? " filled" : "");
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
      if (state.blockBlastGameOver) return;
      if (e.target.closest(".blockblast-cell")) gridEl.classList.add("blockblast-grid-drag-over");
    });
    gridEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (state.blockBlastGameOver) return;
      e.dataTransfer.dropEffect = "copy";
    });
    gridEl.addEventListener("dragleave", (e) => {
      if (!gridEl.contains(e.relatedTarget)) gridEl.classList.remove("blockblast-grid-drag-over");
    });
    gridEl.addEventListener("drop", (e) => {
      e.preventDefault();
      if (state.blockBlastGameOver) return;
      const cell = e.target.closest(".blockblast-cell");
      if (!cell || cell.classList.contains("filled")) return;
      const row = parseInt(cell.dataset.row, 10);
      const col = parseInt(cell.dataset.col, 10);
      const idx = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (isNaN(idx) || idx < 0 || idx >= pieces.length) return;
      const piece = pieces[idx];
      if (!blockBlastCanPlace(piece, row, col)) return;
      state.blockBlastSelectedPieceIndex = idx;
      blockBlastPlace(piece, row, col);
      if (!blockBlastCanPlaceAny()) state.blockBlastGameOver = true;
      state.blockBlastDraggedPieceIndex = -1;
      gridEl.classList.remove("blockblast-grid-drag-over");
      blockBlastRender();
    });
  }
  piecesEl.innerHTML = "";
  pieces.forEach((piece, idx) => {
    const wrap = document.createElement("div");
    wrap.role = "button";
    wrap.tabIndex = 0;
    wrap.className = "blockblast-piece-wrap" + (state.blockBlastSelectedPieceIndex === idx ? " selected" : "");
    wrap.innerHTML = blockBlastPieceToHtml(piece);
    wrap.dataset.pieceIndex = String(idx);
    let pointerMoved = false;
    wrap.addEventListener("click", (e) => {
      if (state.blockBlastGameOver) return;
      if (state.blockBlastTouchPlaced || pointerMoved) {
        state.blockBlastTouchPlaced = false;
        pointerMoved = false;
        return;
      }
      e.preventDefault();
      state.blockBlastSelectedPieceIndex = state.blockBlastSelectedPieceIndex === idx ? -1 : idx;
      blockBlastRender();
    });
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        wrap.click();
      }
    });
    wrap.addEventListener("pointerdown", (e) => {
      if (state.blockBlastGameOver || (e.pointerType === "mouse" && e.button !== 0)) return;
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
            state.blockBlastSelectedPieceIndex = idx;
            blockBlastPlace(piece, row, col);
            if (!blockBlastCanPlaceAny()) state.blockBlastGameOver = true;
            state.blockBlastTouchPlaced = true;
            blockBlastRender();
            return;
          }
        }
        if (pointerMoved) state.blockBlastTouchPlaced = true;
        blockBlastRender();
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    });
    piecesEl.appendChild(wrap);
  });
  if (state.blockBlastGameOver) {
    if (statusEl) {
      statusEl.textContent = "Игра окончена! Очки: " + state.blockBlastScore;
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

export function blockBlastRestart() {
  blockBlastInitGrid();
  state.blockBlastPieces.length = 0;
  state.blockBlastPieces.push(...blockBlastGetRandomPieces(3));
  state.blockBlastScore = 0;
  state.blockBlastSelectedPieceIndex = -1;
  state.blockBlastGameOver = false;
  state.blockBlastTouchPlaced = false;
  blockBlastRender();
}

export function initBlockBlast() {
  const overlay = document.getElementById("blockBlastOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this && typeof window.closeBlockBlastModal === "function") window.closeBlockBlastModal();
    });
  }
}
