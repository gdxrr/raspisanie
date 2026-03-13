(function (global) {
  "use strict";

  const DISMISS_STORAGE_KEY = "schedule_holiday_dismissed";

  const HOLIDAY_THEME_DEFINITIONS = [
    { id: "new-year", month: 1, day: 1, beforeDays: 2, afterDays: 1, priority: 90, label: "Новый год", particles: ["snowflake", "confetti", "gift"], density: "high", canvas: null },
    { id: "orthodox-christmas", month: 1, day: 7, beforeDays: 1, afterDays: 1, priority: 60, label: "Рождество", particles: ["star", "snowflake", "candle"], density: "medium", canvas: null },
    { id: "valentines-day", month: 2, day: 14, beforeDays: 1, afterDays: 1, priority: 50, label: "День святого Валентина", particles: ["heart"], density: "medium", canvas: null },
    { id: "defender-day", month: 2, day: 23, beforeDays: 1, afterDays: 1, priority: 50, label: "День защитника Отечества", particles: ["star", "flag-confetti"], density: "medium", canvas: null },
    { id: "womens-day", month: 3, day: 8, beforeDays: 1, afterDays: 1, priority: 55, label: "Международный женский день", particles: ["petal"], density: "medium", canvas: null },
    { id: "maslenitsa", floating: "maslenitsa", beforeDays: 2, afterDays: 2, priority: 65, label: "Масленица", particles: ["blin"], density: "medium", canvas: null },
    { id: "april-fools", month: 4, day: 1, beforeDays: 1, afterDays: 1, priority: 45, label: "День смеха", particles: ["jester-hat", "spark"], density: "medium", canvas: null },
    { id: "cosmonautics-day", month: 4, day: 12, beforeDays: 1, afterDays: 1, priority: 55, label: "День космонавтики", particles: ["rocket", "planet"], density: "medium", canvas: null },
    { id: "labor-day", month: 5, day: 1, beforeDays: 1, afterDays: 1, priority: 45, label: "День труда", particles: ["tulip"], density: "medium", canvas: null },
    { id: "victory-day", month: 5, day: 9, beforeDays: 1, afterDays: 1, priority: 80, label: "День Победы", particles: ["ribbon"], density: "medium", canvas: "fireworks" },
    { id: "halloween", month: 10, day: 31, beforeDays: 1, afterDays: 1, priority: 55, label: "Хэллоуин", particles: ["pumpkin", "bat"], density: "medium", canvas: null },
    { id: "new-years-eve", month: 12, day: 31, beforeDays: 1, afterDays: 2, priority: 100, label: "Новогодняя ночь", particles: ["snowflake", "confetti"], density: "ultra", canvas: "fireworks" },
  ];

  function normalizeDate(date) {
    const value = date instanceof Date ? date : new Date(date);
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  function shiftDate(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return normalizeDate(result);
  }

  function toIsoDay(date) {
    const normalized = normalizeDate(date);
    return String(normalized.getFullYear()) + "-" + String(normalized.getMonth() + 1).padStart(2, "0") + "-" + String(normalized.getDate()).padStart(2, "0");
  }

  function getOrthodoxEasterDate(year) {
    const a = year % 4;
    const b = year % 7;
    const c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31);
    const day = ((d + e + 114) % 31) + 1;
    const julianDateUtc = Date.UTC(year, month - 1, day);
    const gregorianOffsetDays = year >= 2100 ? 14 : 13;
    return normalizeDate(new Date(julianDateUtc + gregorianOffsetDays * 86400000));
  }

  function getMaslenitsaDate(year) {
    const easter = getOrthodoxEasterDate(year);
    return shiftDate(easter, -55);
  }

  function resolveHolidayDate(definition, year) {
    if (definition.floating === "maslenitsa") return getMaslenitsaDate(year);
    return new Date(year, definition.month - 1, definition.day);
  }

  function expandDefinition(definition, year) {
    const holidayDate = normalizeDate(resolveHolidayDate(definition, year));
    return {
      id: definition.id,
      label: definition.label,
      priority: definition.priority,
      particles: definition.particles.slice(),
      density: definition.density,
      canvas: definition.canvas || null,
      date: holidayDate,
      windowStart: shiftDate(holidayDate, -definition.beforeDays),
      windowEnd: shiftDate(holidayDate, definition.afterDays),
    };
  }

  function getHolidayThemeForDate(date) {
    const target = normalizeDate(date);
    const years = [target.getFullYear() - 1, target.getFullYear(), target.getFullYear() + 1];
    const candidates = [];
    HOLIDAY_THEME_DEFINITIONS.forEach(function (definition) {
      years.forEach(function (year) {
        const expanded = expandDefinition(definition, year);
        if (target >= expanded.windowStart && target <= expanded.windowEnd) {
          candidates.push(expanded);
        }
      });
    });
    if (!candidates.length) return null;
    candidates.sort(function (a, b) {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const aDistance = Math.abs(target - a.date);
      const bDistance = Math.abs(target - b.date);
      if (aDistance !== bDistance) return aDistance - bDistance;
      return a.id.localeCompare(b.id);
    });
    return candidates[0];
  }

  function isHolidayThemeDismissed(themeId, date, storageValue) {
    if (!themeId) return false;
    let parsed = storageValue;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (err) {
        return false;
      }
    }
    if (!parsed || typeof parsed !== "object") return false;
    return parsed.holidayId === themeId && parsed.date === toIsoDay(date);
  }

  global.HolidayThemes = {
    DISMISS_STORAGE_KEY: DISMISS_STORAGE_KEY,
    HOLIDAY_THEME_DEFINITIONS: HOLIDAY_THEME_DEFINITIONS,
    getHolidayThemeForDate: getHolidayThemeForDate,
    getMaslenitsaDate: getMaslenitsaDate,
    isHolidayThemeDismissed: isHolidayThemeDismissed,
    toIsoDay: toIsoDay,
  };
})(window);
