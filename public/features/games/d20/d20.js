import { state } from "../../shared/core/state.js";
import { escapeHtml, showToast } from "../../shared/core/utils.js";
import {
  D20_STORAGE_KEYS,
  D20_DEFAULT_PALETTE,
  D20_MIN_DC,
  D20_MAX_DC,
  D20_DEFAULT_DC,
  D20_MIN_MODIFIER,
  D20_MAX_MODIFIER,
  D20_MAX_MODIFIERS,
  D20_ROLL_MS,
} from "../../shared/core/constants.js";

function d20ClampDc(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return D20_DEFAULT_DC;
  return Math.min(D20_MAX_DC, Math.max(D20_MIN_DC, Math.round(num)));
}

function d20ClampModifier(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(D20_MAX_MODIFIER, Math.max(D20_MIN_MODIFIER, Math.round(num)));
}

function d20FormatSigned(value) {
  const num = Number(value) || 0;
  return num > 0 ? "+" + String(num) : String(num);
}

function d20IsHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function d20SanitizePalette(rawPalette) {
  const raw = rawPalette && typeof rawPalette === "object" ? rawPalette : {};
  return {
    bg: d20IsHexColor(raw.bg) ? raw.bg : D20_DEFAULT_PALETTE.bg,
    edge: d20IsHexColor(raw.edge) ? raw.edge : D20_DEFAULT_PALETTE.edge,
    text: d20IsHexColor(raw.text) ? raw.text : D20_DEFAULT_PALETTE.text,
  };
}

function d20ComputeModifierTotal(modifiers) {
  if (!Array.isArray(modifiers)) return 0;
  return modifiers.reduce(function (sum, item) {
    if (!item || !item.enabled) return sum;
    return sum + d20ClampModifier(item.value);
  }, 0);
}

function d20EvaluateRoll(natural, modifierTotal, dc) {
  const nat = Number(natural);
  const mod = Number(modifierTotal) || 0;
  const safeDc = d20ClampDc(dc);
  const total = nat + mod;

  if (nat === 20) {
    return {
      finalTotal: total,
      outcome: "Критический успех",
      interpretation: "Натуральная 20. Проверка пройдена автоматически.",
      isSuccess: true,
      isCritical: true,
    };
  }

  if (nat === 1) {
    return {
      finalTotal: total,
      outcome: "Критический провал",
      interpretation: "Натуральная 1. Проверка провалена автоматически.",
      isSuccess: false,
      isCritical: true,
    };
  }

  if (total >= safeDc + 5) {
    return {
      finalTotal: total,
      outcome: "Уверенный успех",
      interpretation: "Запас к сложности " + String(total - safeDc) + ". Отличный результат.",
      isSuccess: true,
      isCritical: false,
    };
  }
  if (total >= safeDc) {
    return {
      finalTotal: total,
      outcome: "Успех",
      interpretation: "Порог сложности достигнут.",
      isSuccess: true,
      isCritical: false,
    };
  }
  if (total >= safeDc - 4) {
    return {
      finalTotal: total,
      outcome: "Почти получилось",
      interpretation: "Немного не хватило до DC.",
      isSuccess: false,
      isCritical: false,
    };
  }
  return {
    finalTotal: total,
    outcome: "Провал",
    interpretation: "Разрыв с DC слишком большой.",
    isSuccess: false,
    isCritical: false,
  };
}

function d20SafeSetLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error("Failed to persist D20 value", e);
    return false;
  }
}

function d20PersistModifiers() {
  const d20State = state.d20State;
  return d20SafeSetLocalStorage(D20_STORAGE_KEYS.modifiers, JSON.stringify(d20State.modifiers));
}

function d20PersistDc() {
  const d20State = state.d20State;
  return d20SafeSetLocalStorage(D20_STORAGE_KEYS.dc, String(d20State.dc));
}

function d20PersistPalette() {
  const d20State = state.d20State;
  return d20SafeSetLocalStorage(D20_STORAGE_KEYS.palette, JSON.stringify(d20State.palette));
}

function d20PersistTexture() {
  const d20State = state.d20State;
  if (!d20State.textureDataUrl) {
    try {
      localStorage.removeItem(D20_STORAGE_KEYS.texture);
    } catch (e) {
      console.error("Failed to remove D20 texture", e);
      return false;
    }
    return true;
  }
  return d20SafeSetLocalStorage(D20_STORAGE_KEYS.texture, d20State.textureDataUrl);
}

function d20RecomputeFromCurrentRoll() {
  const d20State = state.d20State;
  d20State.modifierTotal = d20ComputeModifierTotal(d20State.modifiers);
  if (d20State.natural == null || !Number.isInteger(Number(d20State.natural))) {
    d20State.finalTotal = null;
    d20State.outcome = "";
    d20State.interpretation = "Бросьте кубик, чтобы получить исход проверки.";
    d20State.isSuccess = false;
    d20State.isCritical = false;
    return;
  }
  const result = d20EvaluateRoll(d20State.natural, d20State.modifierTotal, d20State.dc);
  d20State.finalTotal = result.finalTotal;
  d20State.outcome = result.outcome;
  d20State.interpretation = result.interpretation;
  d20State.isSuccess = result.isSuccess;
  d20State.isCritical = result.isCritical;
}

export function d20LoadState() {
  const d20State = state.d20State;
  let modifiers = [];
  try {
    const rawModifiers = JSON.parse(localStorage.getItem(D20_STORAGE_KEYS.modifiers) || "[]");
    if (Array.isArray(rawModifiers)) {
      for (const item of rawModifiers) {
        if (modifiers.length >= D20_MAX_MODIFIERS) break;
        const name = item && typeof item.name === "string" ? item.name.trim() : "";
        if (!name || name.length > 32) continue;
        modifiers.push({
          id: modifiers.length + 1,
          name: name,
          value: d20ClampModifier(item.value),
          enabled: item && item.enabled !== false,
        });
      }
    }
  } catch (e) {
    modifiers = [];
  }

  let dc = D20_DEFAULT_DC;
  try {
    dc = d20ClampDc(localStorage.getItem(D20_STORAGE_KEYS.dc));
  } catch (e) {
    dc = D20_DEFAULT_DC;
  }

  let palette = { ...D20_DEFAULT_PALETTE };
  try {
    const rawPalette = JSON.parse(localStorage.getItem(D20_STORAGE_KEYS.palette) || "{}");
    palette = d20SanitizePalette(rawPalette);
  } catch (e) {
    palette = { ...D20_DEFAULT_PALETTE };
  }

  let textureDataUrl = "";
  try {
    const rawTexture = localStorage.getItem(D20_STORAGE_KEYS.texture) || "";
    textureDataUrl = rawTexture.startsWith("data:image/") ? rawTexture : "";
  } catch (e) {
    textureDataUrl = "";
  }

  d20State.modifiers = modifiers;
  d20State.nextModifierId = modifiers.length + 1;
  d20State.dc = dc;
  d20State.palette = palette;
  d20State.textureDataUrl = textureDataUrl;
  d20State.natural = null;
  d20State.isRolling = false;
  d20RecomputeFromCurrentRoll();
}

function d20RenderModifierList() {
  const d20State = state.d20State;
  const listEl = document.getElementById("d20ModifierList");
  if (!listEl) return;

  if (!d20State.modifiers.length) {
    listEl.innerHTML = '<div class="d20-empty">Пока нет активных эффектов.</div>';
    return;
  }

  listEl.innerHTML = d20State.modifiers
    .map(function (item) {
      const valueClass = Number(item.value) >= 0 ? "positive" : "negative";
      return (
        '<div class="d20-modifier-item">' +
        '<label class="d20-modifier-main">' +
        '<input type="checkbox" ' +
        (item.enabled ? "checked" : "") +
        ' onchange="d20ToggleModifier(' +
        String(item.id) +
        ', this.checked)">' +
        '<span class="d20-modifier-name">' +
        escapeHtml(item.name) +
        "</span>" +
        "</label>" +
        '<div class="d20-modifier-actions">' +
        '<span class="d20-modifier-value ' +
        valueClass +
        '">' +
        escapeHtml(d20FormatSigned(item.value)) +
        "</span>" +
        '<button type="button" class="d20-remove-btn" onclick="d20RemoveModifier(' +
        String(item.id) +
        ')">×</button>' +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

function d20RenderSkin() {
  const d20State = state.d20State;
  const dieEl = document.getElementById("d20Die");
  if (!dieEl) return;

  dieEl.style.setProperty("--d20-bg", d20State.palette.bg);
  dieEl.style.setProperty("--d20-edge", d20State.palette.edge);
  dieEl.style.setProperty("--d20-text", d20State.palette.text);
  if (d20State.textureDataUrl) {
    dieEl.style.backgroundImage =
      "linear-gradient(140deg, rgba(0,0,0,.18), rgba(0,0,0,.48)), url('" + d20State.textureDataUrl.replace(/'/g, "\\'") + "')";
  } else {
    dieEl.style.backgroundImage = "";
  }

  const bgInput = document.getElementById("d20ColorBg");
  const edgeInput = document.getElementById("d20ColorEdge");
  const textInput = document.getElementById("d20ColorText");
  if (bgInput) bgInput.value = d20State.palette.bg;
  if (edgeInput) edgeInput.value = d20State.palette.edge;
  if (textInput) textInput.value = d20State.palette.text;
}

function d20RenderResult() {
  const d20State = state.d20State;
  const naturalValue = document.getElementById("d20NaturalValue");
  const resultNatural = document.getElementById("d20ResultNatural");
  const resultModifier = document.getElementById("d20ResultModifier");
  const resultTotal = document.getElementById("d20ResultTotal");
  const resultOutcome = document.getElementById("d20ResultOutcome");
  const interpretation = document.getElementById("d20Interpretation");

  if (naturalValue) naturalValue.textContent = d20State.natural == null ? "?" : String(d20State.natural);
  if (resultNatural) resultNatural.textContent = d20State.natural == null ? "—" : String(d20State.natural);
  if (resultModifier) resultModifier.textContent = d20FormatSigned(d20State.modifierTotal);
  if (resultTotal) resultTotal.textContent = d20State.finalTotal == null ? "—" : String(d20State.finalTotal);
  if (resultOutcome) {
    resultOutcome.textContent = d20State.outcome || "Ожидание";
    resultOutcome.classList.remove("d20-outcome-success", "d20-outcome-fail", "d20-outcome-critical");
    if (d20State.outcome) {
      if (d20State.isCritical) resultOutcome.classList.add("d20-outcome-critical");
      else if (d20State.isSuccess) resultOutcome.classList.add("d20-outcome-success");
      else resultOutcome.classList.add("d20-outcome-fail");
    }
  }
  if (interpretation) interpretation.textContent = d20State.interpretation;
}

function d20Render() {
  const d20State = state.d20State;
  const dcInput = document.getElementById("d20DcInput");
  const modifierTotalDisplay = document.getElementById("d20ModifierTotalDisplay");
  const rollBtn = document.getElementById("d20RollBtn");

  if (dcInput) dcInput.value = String(d20State.dc);
  if (modifierTotalDisplay) modifierTotalDisplay.textContent = d20FormatSigned(d20State.modifierTotal);
  if (rollBtn) rollBtn.disabled = !!d20State.isRolling;

  d20RenderModifierList();
  d20RenderSkin();
  d20RenderResult();
}

export function openD20Modal() {
  d20Render();
  document.getElementById("d20Overlay").classList.add("open");
}

function d20StopRollTimers() {
  const d20State = state.d20State;
  if (d20State.rollInterval) {
    clearInterval(d20State.rollInterval);
    d20State.rollInterval = null;
  }
  if (d20State.rollTimeout) {
    clearTimeout(d20State.rollTimeout);
    d20State.rollTimeout = null;
  }
}

export function closeD20Modal() {
  const d20State = state.d20State;
  d20StopRollTimers();
  d20State.isRolling = false;
  const dieEl = document.getElementById("d20Die");
  if (dieEl) dieEl.classList.remove("rolling");
  document.getElementById("d20Overlay").classList.remove("open");
}

export function d20SetDc(rawValue) {
  const d20State = state.d20State;
  d20State.dc = d20ClampDc(rawValue);
  d20PersistDc();
  d20RecomputeFromCurrentRoll();
  d20Render();
}

export function d20AddModifier() {
  const d20State = state.d20State;
  if (d20State.modifiers.length >= D20_MAX_MODIFIERS) {
    showToast("Лимит модификаторов: " + String(D20_MAX_MODIFIERS));
    return;
  }

  const nameInput = document.getElementById("d20ModifierNameInput");
  const valueInput = document.getElementById("d20ModifierValueInput");
  const name = nameInput ? String(nameInput.value || "").trim() : "";
  const valueRaw = valueInput ? valueInput.value : 0;
  const value = Number(valueRaw);

  if (!name || name.length > 32) {
    showToast("Название должно быть от 1 до 32 символов");
    return;
  }
  if (!Number.isFinite(value) || Math.round(value) < D20_MIN_MODIFIER || Math.round(value) > D20_MAX_MODIFIER) {
    showToast("Значение должно быть в диапазоне от -20 до +20");
    return;
  }

  d20State.modifiers.push({
    id: d20State.nextModifierId++,
    name: name,
    value: d20ClampModifier(value),
    enabled: true,
  });
  d20PersistModifiers();
  d20RecomputeFromCurrentRoll();
  d20Render();

  if (nameInput) nameInput.value = "";
  if (valueInput) valueInput.value = "0";
}

export function d20ToggleModifier(modifierId, enabled) {
  const d20State = state.d20State;
  const id = Number(modifierId);
  const modifier = d20State.modifiers.find(function (item) {
    return Number(item.id) === id;
  });
  if (!modifier) return;
  modifier.enabled = enabled == null ? !modifier.enabled : !!enabled;
  d20PersistModifiers();
  d20RecomputeFromCurrentRoll();
  d20Render();
}

export function d20RemoveModifier(modifierId) {
  const d20State = state.d20State;
  const id = Number(modifierId);
  d20State.modifiers = d20State.modifiers.filter(function (item) {
    return Number(item.id) !== id;
  });
  d20PersistModifiers();
  d20RecomputeFromCurrentRoll();
  d20Render();
}

export function d20ChangePalette() {
  const d20State = state.d20State;
  const bgInput = document.getElementById("d20ColorBg");
  const edgeInput = document.getElementById("d20ColorEdge");
  const textInput = document.getElementById("d20ColorText");
  const palette = d20SanitizePalette({
    bg: bgInput ? bgInput.value : d20State.palette.bg,
    edge: edgeInput ? edgeInput.value : d20State.palette.edge,
    text: textInput ? textInput.value : d20State.palette.text,
  });
  d20State.palette = palette;
  d20PersistPalette();
  d20RenderSkin();
}

function d20ResizeTextureFile(file, maxSize) {
  return new Promise(function (resolve, reject) {
    if (!file) {
      reject(new Error("no_file"));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = function () {
      try {
        const size = Number(maxSize) || 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size / image.width, size / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const offsetX = (size - drawWidth) / 2;
        const offsetY = (size - drawHeight) / 2;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      }
    };
    image.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image_decode_failed"));
    };
    image.src = objectUrl;
  });
}

export async function d20UploadTexture(inputEl) {
  const d20State = state.d20State;
  if (!inputEl || !inputEl.files || !inputEl.files.length) return;
  const file = inputEl.files[0];
  if (!file || (file.type !== "image/png" && file.type !== "image/jpeg")) {
    showToast("Нужен PNG или JPG");
    inputEl.value = "";
    return;
  }

  try {
    const dataUrl = await d20ResizeTextureFile(file, 256);
    d20State.textureDataUrl = dataUrl;
    const persisted = d20PersistTexture();
    d20RenderSkin();
    showToast(persisted ? "Скин обновлён" : "Скин применён только на текущую сессию");
  } catch (e) {
    console.error("Failed to process D20 texture", e);
    showToast("Не удалось обработать изображение");
  } finally {
    inputEl.value = "";
  }
}

export function d20ResetSkin() {
  const d20State = state.d20State;
  d20State.textureDataUrl = "";
  d20State.palette = { ...D20_DEFAULT_PALETTE };
  d20PersistTexture();
  d20PersistPalette();
  d20RenderSkin();
  showToast("Скин сброшен");
}

export function d20Roll() {
  const d20State = state.d20State;
  if (d20State.isRolling) return;

  d20State.isRolling = true;
  const dieEl = document.getElementById("d20Die");
  if (dieEl) dieEl.classList.add("rolling");
  d20Render();

  const target = 1 + Math.floor(Math.random() * 20);
  d20StopRollTimers();
  d20State.rollInterval = setInterval(function () {
    d20State.natural = 1 + Math.floor(Math.random() * 20);
    const naturalValueEl = document.getElementById("d20NaturalValue");
    if (naturalValueEl) naturalValueEl.textContent = String(d20State.natural);
  }, 70);

  d20State.rollTimeout = setTimeout(function () {
    d20StopRollTimers();
    d20State.isRolling = false;
    d20State.natural = target;
    d20RecomputeFromCurrentRoll();
    if (dieEl) dieEl.classList.remove("rolling");
    d20Render();
  }, D20_ROLL_MS);
}

export function initD20() {
  const overlay = document.getElementById("d20Overlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this) closeD20Modal();
    });
  }
}
