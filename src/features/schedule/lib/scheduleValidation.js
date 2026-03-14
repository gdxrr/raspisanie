const { createError } = require("./httpError");

const MAX_STRING_LENGTH = 500;
const DAY_NAMES = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
const VALID_TYPES = ["lab", "lec", "prac", "kurs"];
const VALID_WEEKS = ["both", "odd", "even"];

// Time format HH:MM or H:MM
const TIME_REGEX = /^\d{1,2}:\d{2}$/;

function trimStr(val) {
  if (val == null) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

function validateScheduleBody(body) {
  if (!Array.isArray(body)) {
    return { error: createError(400, "validation_error", "Body must be an array") };
  }
  const invalidFields = [];
  for (let i = 0; i < body.length; i++) {
    const item = body[i];
    if (!item || typeof item !== "object") {
      invalidFields.push(`[${i}]: not an object`);
      continue;
    }
    const id = item.id != null ? Number(item.id) : null;
    if (id == null || !Number.isInteger(id) || id < 1) {
      invalidFields.push(`[${i}].id: must be a positive integer`);
    }
    const day = trimStr(item.day);
    if (day != null && !DAY_NAMES.includes(day)) {
      invalidFields.push(`[${i}].day: invalid day name`);
    }
    const start = trimStr(item.start);
    if (start != null && !TIME_REGEX.test(start)) {
      invalidFields.push(`[${i}].start: must be time HH:MM`);
    }
    const end = trimStr(item.end);
    if (end != null && end !== "" && !TIME_REGEX.test(end)) {
      invalidFields.push(`[${i}].end: must be time HH:MM or empty`);
    }
    const type = trimStr(item.type);
    if (type != null && type !== "" && !VALID_TYPES.includes(type)) {
      invalidFields.push(`[${i}].type: must be one of ${VALID_TYPES.join(", ")}`);
    }
    const week = trimStr(item.week);
    if (week != null && week !== "" && !VALID_WEEKS.includes(week)) {
      invalidFields.push(`[${i}].week: must be one of ${VALID_WEEKS.join(", ")}`);
    }
    ["subject", "room", "teacher"].forEach((field) => {
      const val = item[field];
      if (val != null && String(val).length > MAX_STRING_LENGTH) {
        invalidFields.push(`[${i}].${field}: max length ${MAX_STRING_LENGTH}`);
      }
    });
  }
  if (invalidFields.length > 0) {
    return {
      error: createError(400, "validation_error", "Validation failed", {
        fields: invalidFields,
      }),
    };
  }
  return { valid: true };
}

module.exports = { validateScheduleBody };
