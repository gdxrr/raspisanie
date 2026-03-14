import {
  DAY_NAMES,
  MONTH_NOM,
  LAST_ACADEMIC_WEEK,
  FIXED_HOLIDAYS,
  FIXED_HOLIDAY_LABELS,
  PRE_HOLIDAYS,
} from "./constants.js";
import { state } from "./state.js";

export function getAcademicWeekNum(date) {
  let y = date.getFullYear();
  if (date.getMonth() < 8) y--;
  const sep1 = new Date(y, 8, 1);
  const d1 = sep1.getDay() || 7;
  const mon = new Date(sep1);
  mon.setDate(sep1.getDate() - (d1 - 1));
  return Math.floor((date - mon) / 86400000 / 7) + 1;
}

export function getWeekType(date) {
  return getAcademicWeekNum(date) % 2 === 1 ? "odd" : "even";
}

export function getPeriodAfterTeaching(date) {
  const m = date.getMonth();
  const day = date.getDate();
  if (m === 5 && day >= 1 && day <= 7) return { short: "Зач. нед", cls: "calendar-day-credit-week" };
  if (m === 5 && day >= 8) return { short: "Сессия", cls: "calendar-day-session" };
  if (m === 6 && day <= 5) return { short: "Сессия", cls: "calendar-day-session" };
  if (m === 6 && day >= 6 && day <= 19) return { short: "Практика", cls: "calendar-day-practice" };
  if (m === 6 && day >= 20) return { short: "Каникулы", cls: "calendar-day-vacation" };
  if (m === 7) return { short: "Каникулы", cls: "calendar-day-vacation" };
  return null;
}

export function getHolidayLabel(date) {
  const m = date.getMonth();
  const d = date.getDate();
  const key = m + "," + d;
  return FIXED_HOLIDAY_LABELS[key] || "";
}

export function getBirthdaysOnDate(month1Based, dayOfMonth) {
  const showBirthdays = window.settingsShowBirthdays !== undefined ? window.settingsShowBirthdays : state.settingsShowBirthdays;
  const list = window.birthdaysList !== undefined ? window.birthdaysList : state.birthdaysList;
  if (!showBirthdays || !list || !list.length) return [];
  return list.filter((b) => b.month === month1Based && b.day === dayOfMonth).map((b) => b.name);
}

export function isHolidayDate(date) {
  const m = date.getMonth();
  const d = date.getDate();
  return FIXED_HOLIDAYS.some(([mm, dd]) => mm === m && dd === d);
}

export function isPreHolidayDate(date) {
  const m = date.getMonth();
  const d = date.getDate();
  return PRE_HOLIDAYS.some(([mm, dd]) => mm === m && dd === d);
}

export function isSaturdayEvenWeekend(date) {
  const dayName = date.getDay() === 0 ? "Воскресенье" : DAY_NAMES[date.getDay() - 1];
  if (dayName !== "Суббота") return false;
  const wNum = getAcademicWeekNum(date);
  if (wNum < 1 || wNum > LAST_ACADEMIC_WEEK) return false;
  return getWeekType(date) === "even";
}

export function formatDate(d) {
  return d.getDate() + " " + MONTH_NOM[d.getMonth()];
}
