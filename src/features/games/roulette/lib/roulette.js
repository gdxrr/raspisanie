"use strict";

const ROULETTE_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const ROULETTE_RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const ROULETTE_STARTING_BALANCE = 1000;
const ROULETTE_BET_WINDOW_MS = 15000;
const ROULETTE_SPIN_MS = 6000;
const ROULETTE_HISTORY_LIMIT = 10;
const ROULETTE_ADMIN_GRANTS_LIMIT = 10;
const ROULETTE_MAX_BET_AMOUNT = 1000000;

function rouletteColorForNumber(number) {
  const value = Number(number);
  if (!Number.isInteger(value) || value < 0 || value > 36) return null;
  if (value === 0) return "green";
  return ROULETTE_RED_NUMBERS.has(value) ? "red" : "black";
}

function validateRouletteBet(kind, value) {
  if (kind === "number") {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0 || num > 36) return null;
    return { kind, value: String(num) };
  }
  if (kind === "color") {
    if (value !== "red" && value !== "black") return null;
    return { kind, value };
  }
  if (kind === "parity") {
    if (value !== "even" && value !== "odd") return null;
    return { kind, value };
  }
  return null;
}

function normalizeRouletteBets(rawBets) {
  if (!Array.isArray(rawBets)) return [];
  const merged = new Map();

  for (const item of rawBets) {
    const kind = item && typeof item.kind === "string" ? item.kind : item && typeof item.betType === "string" ? item.betType : "";
    const value = item && item.value != null ? item.value : item && item.betValue != null ? item.betValue : null;
    const amountRaw = item && item.amount != null ? Number(item.amount) : NaN;
    const normalizedBet = validateRouletteBet(kind, value);
    if (!normalizedBet) return [];
    if (!Number.isInteger(amountRaw) || amountRaw <= 0 || amountRaw > ROULETTE_MAX_BET_AMOUNT) return [];

    const key = normalizedBet.kind + ":" + normalizedBet.value;
    const prev = merged.get(key) || 0;
    const next = prev + amountRaw;
    if (next > ROULETTE_MAX_BET_AMOUNT) return [];
    merged.set(key, next);
  }

  return Array.from(merged.entries()).map(([key, amount]) => {
    const idx = key.indexOf(":");
    return {
      kind: key.slice(0, idx),
      value: key.slice(idx + 1),
      amount,
    };
  });
}

function getRouletteBetGrossPayout(bet, winningNumber) {
  if (!bet || !Number.isInteger(Number(bet.amount)) || Number(bet.amount) <= 0) return 0;
  const amount = Number(bet.amount);
  const number = Number(winningNumber);
  if (!Number.isInteger(number) || number < 0 || number > 36) return 0;

  if (bet.kind === "number") {
    return Number(bet.value) === number ? amount * 36 : 0;
  }

  if (bet.kind === "color") {
    if (number === 0) return 0;
    return bet.value === rouletteColorForNumber(number) ? amount * 2 : 0;
  }

  if (bet.kind === "parity") {
    if (number === 0) return 0;
    const expected = number % 2 === 0 ? "even" : "odd";
    return bet.value === expected ? amount * 2 : 0;
  }

  return 0;
}

function pickRouletteNumber(randomInt) {
  const fn = typeof randomInt === "function" ? randomInt : (max) => Math.floor(Math.random() * max);
  return fn(37);
}

function buildRouletteHistoryEntry(round) {
  if (!round) return null;
  return {
    roundId: Number(round.id),
    winningNumber: round.winningNumber == null ? null : Number(round.winningNumber),
    winningColor: round.winningColor || rouletteColorForNumber(round.winningNumber),
    settledAt: round.settledAt || null,
  };
}

module.exports = {
  ROULETTE_ADMIN_GRANTS_LIMIT,
  ROULETTE_BET_WINDOW_MS,
  ROULETTE_HISTORY_LIMIT,
  ROULETTE_MAX_BET_AMOUNT,
  ROULETTE_SPIN_MS,
  ROULETTE_STARTING_BALANCE,
  ROULETTE_WHEEL_ORDER,
  buildRouletteHistoryEntry,
  getRouletteBetGrossPayout,
  normalizeRouletteBets,
  pickRouletteNumber,
  rouletteColorForNumber,
  validateRouletteBet,
};
