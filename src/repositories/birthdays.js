const { pool } = require("../db");

async function getBirthday(chatId) {
  const r = await pool.query("SELECT day, month FROM birthdays WHERE chat_id = $1", [Number(chatId)]);
  if (r.rows.length === 0) return { day: null, month: null };
  return { day: r.rows[0].day, month: r.rows[0].month };
}

async function setBirthday(chatId, day, month) {
  const cid = Number(chatId);
  if (day == null || month == null) {
    await pool.query("DELETE FROM birthdays WHERE chat_id = $1", [cid]);
    return { day: null, month: null };
  }
  await pool.query(
    "INSERT INTO birthdays (chat_id, day, month) VALUES ($1, $2, $3) ON CONFLICT (chat_id) DO UPDATE SET day = EXCLUDED.day, month = EXCLUDED.month",
    [cid, day, month]
  );
  return { day, month };
}

async function getAllBirthdays() {
  const r = await pool.query("SELECT chat_id, day, month FROM birthdays");
  return r.rows.map((row) => ({
    chatId: String(row.chat_id),
    day: row.day,
    month: row.month,
    name: "Участник",
  }));
}

module.exports = {
  getBirthday,
  setBirthday,
  getAllBirthdays,
};
