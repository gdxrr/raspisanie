const scheduleUtils = require("./scheduleUtils");

const DAY_NAMES_RU = scheduleUtils.DAY_NAMES_RU;
const DAY_NAME_TO_NUM = scheduleUtils.DAY_NAME_TO_NUM;

function getDayNameRu(date) {
  return DAY_NAMES_RU[date.getDay()];
}

function getWeekType(date) {
  return scheduleUtils.getWeekType(date);
}

/** Format date for iCal DTSTART/DTEND: YYYYMMDDTHHMMSS (local) */
function formatIcalDateTime(date, timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const ho = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const s = "00";
  return `${y}${mo}${day}T${ho}${mi}${s}`;
}

function escapeIcalText(s) {
  if (s == null || s === "") return "";
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Build iCal calendar string for schedule in date range [fromDate, toDate].
 * @param {Array<{day, start, end, type, subject, room, teacher, week}>} schedule
 * @param {Date} fromDate
 * @param {Date} toDate
 * @returns {string}
 */
function buildIcal(schedule, fromDate, toDate) {
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  const events = [];
  const now = new Date();
  const nowStr = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const dayName = getDayNameRu(d);
    const weekType = getWeekType(d);
    for (const item of schedule) {
      if (item.day !== dayName) continue;
      if (item.week && item.week !== "both" && item.week !== weekType) continue;
      const startStr = formatIcalDateTime(d, item.start || "00:00");
      const endStr = formatIcalDateTime(d, item.end || item.start || "01:00");
      const summary = [item.subject, item.type].filter(Boolean).join(" ");
      const desc = [item.room, item.teacher].filter(Boolean).join("\n");
      const uid = `schedule-${item.id}-${d.getTime()}@raspisanie`;
      events.push(
        [
          "BEGIN:VEVENT",
          "UID:" + uid,
          "DTSTAMP:" + nowStr,
          "DTSTART:" + startStr,
          "DTEND:" + endStr,
          "SUMMARY:" + escapeIcalText(summary || "Пара"),
          desc ? "DESCRIPTION:" + escapeIcalText(desc) : "",
          "END:VEVENT",
        ]
          .filter(Boolean)
          .join("\r\n")
      );
    }
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Raspisanie//RU",
    "CALSCALE:GREGORIAN",
    events.join("\r\n"),
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Build plain text schedule for date range.
 */
function buildText(schedule, fromDate, toDate) {
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  const lines = ["Расписание", ""];

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const dayName = getDayNameRu(d);
    const weekType = getWeekType(d);
    const dayItems = schedule.filter(
      (item) => item.day === dayName && (!item.week || item.week === "both" || item.week === weekType)
    );
    if (dayItems.length === 0) continue;
    const dateStr = d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
    lines.push(dateStr);
    dayItems
      .sort((a, b) => (a.start || "").localeCompare(b.start || ""))
      .forEach((item) => {
        lines.push(`  ${item.start || ""}-${item.end || ""} ${item.subject || ""} ${item.room || ""}`);
      });
    lines.push("");
  }
  return lines.join("\n");
}

module.exports = { buildIcal, buildText };