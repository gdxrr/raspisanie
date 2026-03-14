const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "💎", "7️⃣", "🎰"];
const SLOT_SYMBOL_HEIGHT = 72;
const SLOT_SPIN_SYMBOLS_COUNT = 22;

function pickRandomSymbol() {
  return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
}

function buildReelStrip(finalSymbol) {
  const arr = [];
  for (let i = 0; i < SLOT_SPIN_SYMBOLS_COUNT - 1; i++) {
    arr.push(pickRandomSymbol());
  }
  arr.push(finalSymbol);
  return arr;
}

function setReelStrip(stripEl, symbols) {
  if (!stripEl) return;
  stripEl.innerHTML = symbols.map((sym) => '<div class="slot-symbol">' + sym + "</div>").join("");
}

export function openCasinoModal() {
  const strip1 = document.getElementById("slotStrip1");
  const strip2 = document.getElementById("slotStrip2");
  const strip3 = document.getElementById("slotStrip3");
  const resultEl = document.getElementById("casinoResult");
  const spinBtn = document.getElementById("casinoSpinBtn");
  [strip1, strip2, strip3].forEach((s) => {
    if (!s) return;
    s.style.transition = "none";
    s.style.transform = "translateY(0)";
    s.innerHTML = '<div class="slot-symbol">' + SLOT_SYMBOLS[0] + "</div>";
  });
  if (resultEl) { resultEl.textContent = ""; resultEl.className = "casino-result"; }
  if (spinBtn) spinBtn.disabled = false;
  document.getElementById("casinoOverlay").classList.add("open");
}

export function closeCasinoModal() {
  document.getElementById("casinoOverlay").classList.remove("open");
}

export function spinSlots() {
  const strip1 = document.getElementById("slotStrip1");
  const strip2 = document.getElementById("slotStrip2");
  const strip3 = document.getElementById("slotStrip3");
  const resultEl = document.getElementById("casinoResult");
  const spinBtn = document.getElementById("casinoSpinBtn");
  if (!strip1 || !strip2 || !strip3 || !resultEl || !spinBtn || spinBtn.disabled) return;
  spinBtn.disabled = true;
  if (resultEl) { resultEl.textContent = ""; resultEl.className = "casino-result"; }

  const s1 = pickRandomSymbol();
  const s2 = pickRandomSymbol();
  const s3 = pickRandomSymbol();
  setReelStrip(strip1, buildReelStrip(s1));
  setReelStrip(strip2, buildReelStrip(s2));
  setReelStrip(strip3, buildReelStrip(s3));

  const endY = -(SLOT_SPIN_SYMBOLS_COUNT - 1) * SLOT_SYMBOL_HEIGHT;
  [strip1, strip2, strip3].forEach((s) => {
    s.classList.remove("spin");
    s.style.transition = "none";
    s.style.transform = "translateY(0)";
  });
  strip1.offsetHeight;
  strip2.offsetHeight;
  strip3.offsetHeight;
  [strip1, strip2, strip3].forEach((s, i) => {
    s.classList.add("spin");
    const delay = i * 120;
    s.style.transition = `transform 1.4s cubic-bezier(.2,.8,.2,1) ${delay}ms`;
    requestAnimationFrame(() => {
      s.style.transform = "translateY(" + endY + "px)";
    });
  });

  const totalDuration = 1400 + 240;
  setTimeout(() => {
    [strip1, strip2, strip3].forEach((s) => {
      s.classList.remove("spin");
      s.style.transition = "none";
      s.style.transform = "translateY(" + endY + "px)";
    });
    spinBtn.disabled = false;
    if (s1 === s2 && s2 === s3) {
      resultEl.textContent = s1 === "🎰" ? "🎉 ДЖЕКПОТ! 🎉" : "Три одинаковых!";
      resultEl.classList.add(s1 === "🎰" ? "jackpot" : "win");
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      resultEl.textContent = "Два одинаковых!";
      resultEl.classList.add("win");
    } else {
      resultEl.textContent = "Повезёт в следующий раз!";
    }
  }, totalDuration);
}

export function initCasino() {
  const overlay = document.getElementById("casinoOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this) closeCasinoModal();
    });
  }
}
