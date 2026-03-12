const BOT_TOKEN = process.env.BOT_TOKEN || "";
const STAROSTA_ID = Number(process.env.STAROSTA_ID || 0);
const DEPUTY_STAROSTA_IDS = (process.env.DEPUTY_STAROSTA_IDS || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean)
  .map((v) => Number(v));
const DEBUG_IDS = (process.env.DEBUG_IDS || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean)
  .map((v) => Number(v));
const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean)
  .map((v) => Number(v));

const GROUP_SIZE = 28;
const DEADLINE_REMINDER_OPTIONS = [1, 3, 7, 14];
const REMINDER_DAY_HOUR = 20;

module.exports = {
  BOT_TOKEN,
  STAROSTA_ID,
  DEPUTY_STAROSTA_IDS,
  DEBUG_IDS,
  ADMIN_IDS,
  GROUP_SIZE,
  DEADLINE_REMINDER_OPTIONS,
  REMINDER_DAY_HOUR,
};
