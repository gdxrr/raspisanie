const { pool } = require("../../shared/db");

async function getReminders(chatId) {
  const r = await pool.query(
    "SELECT day, start, minutes_before, days_before, remind_at FROM reminders WHERE chat_id = $1 ORDER BY day, start",
    [Number(chatId)]
  );
  return r.rows.map((row) => ({
    day: row.day,
    start: row.start,
    minutesBefore: row.minutes_before,
    daysBefore: row.days_before,
    remindAt: row.remind_at || "",
  }));
}

async function getAllRemindersData() {
  const r = await pool.query("SELECT chat_id, day, start, minutes_before, days_before, remind_at FROM reminders ORDER BY chat_id, day, start");
  const byChat = {};
  for (const row of r.rows) {
    const cid = String(row.chat_id);
    if (!byChat[cid]) byChat[cid] = [];
    byChat[cid].push({
      day: row.day,
      start: row.start,
      minutesBefore: row.minutes_before,
      daysBefore: row.days_before,
      remindAt: row.remind_at || "",
    });
  }
  return byChat;
}

async function setReminders(chatId, list) {
  const cid = Number(chatId);
  await pool.query("DELETE FROM reminders WHERE chat_id = $1", [cid]);
  if (Array.isArray(list) && list.length > 0) {
    for (const r of list) {
      await pool.query(
        `INSERT INTO reminders (chat_id, day, start, minutes_before, days_before, remind_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (chat_id, day, start) DO UPDATE SET
           minutes_before = EXCLUDED.minutes_before,
           days_before = EXCLUDED.days_before,
           remind_at = EXCLUDED.remind_at`,
        [cid, r.day, r.start, r.minutesBefore ?? 0, r.daysBefore ?? 0, r.remindAt ?? ""]
      );
    }
  }
}

module.exports = {
  getReminders,
  getAllRemindersData,
  setReminders,
};
