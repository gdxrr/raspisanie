"use strict";

const D20_MIN_DC = 5;
const D20_MAX_DC = 30;
const D20_DEFAULT_DC = 15;

function clampDc(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return D20_DEFAULT_DC;
  return Math.min(D20_MAX_DC, Math.max(D20_MIN_DC, Math.round(num)));
}

function clampModifierValue(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(20, Math.max(-20, Math.round(num)));
}

function computeModifierTotal(modifiers) {
  if (!Array.isArray(modifiers)) return 0;
  return modifiers.reduce((sum, item) => {
    if (!item || item.enabled === false) return sum;
    return sum + clampModifierValue(item.value);
  }, 0);
}

function evaluateD20Outcome(natural, modifierTotal, dc) {
  const nat = Number(natural);
  const mod = Number(modifierTotal) || 0;
  const safeDc = clampDc(dc);
  const finalTotal = nat + mod;

  if (nat === 20) {
    return {
      code: "critical_success",
      finalTotal,
      isSuccess: true,
      isCritical: true,
    };
  }

  if (nat === 1) {
    return {
      code: "critical_fail",
      finalTotal,
      isSuccess: false,
      isCritical: true,
    };
  }

  if (finalTotal >= safeDc + 5) {
    return {
      code: "strong_success",
      finalTotal,
      isSuccess: true,
      isCritical: false,
    };
  }
  if (finalTotal >= safeDc) {
    return {
      code: "success",
      finalTotal,
      isSuccess: true,
      isCritical: false,
    };
  }
  if (finalTotal >= safeDc - 4) {
    return {
      code: "near_miss",
      finalTotal,
      isSuccess: false,
      isCritical: false,
    };
  }
  return {
    code: "fail",
    finalTotal,
    isSuccess: false,
    isCritical: false,
  };
}

module.exports = {
  D20_DEFAULT_DC,
  D20_MAX_DC,
  D20_MIN_DC,
  clampDc,
  clampModifierValue,
  computeModifierTotal,
  evaluateD20Outcome,
};
