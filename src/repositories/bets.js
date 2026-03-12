const { pool } = require("../db");

async function getBetsData() {
  const r = await pool.query("SELECT schedule_id, chat_id, count FROM bets");
  const out = {};
  for (const row of r.rows) {
    const sk = String(row.schedule_id);
    if (!out[sk]) out[sk] = {};
    out[sk][String(row.chat_id)] = row.count;
  }
  return out;
}

async function setBet(scheduleId, chatId, count) {
  const sid = Number(scheduleId);
  const cid = Number(chatId);
  if (count == null) {
    await pool.query("DELETE FROM bets WHERE schedule_id = $1 AND chat_id = $2", [sid, cid]);
  } else {
    await pool.query(
      "INSERT INTO bets (schedule_id, chat_id, count) VALUES ($1, $2, $3) ON CONFLICT (schedule_id, chat_id) DO UPDATE SET count = EXCLUDED.count",
      [sid, cid, count]
    );
  }
  const pairBets = await pool.query("SELECT chat_id, count FROM bets WHERE schedule_id = $1", [sid]);
  const values = pairBets.rows.map((r) => r.count).filter((v) => typeof v === "number" && v >= 0);
  const aggregate = values.length > 0
    ? { count: values.length, avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 }
    : null;
  const myBet = count != null ? count : null;
  return { myBet, aggregate };
}

module.exports = {
  getBetsData,
  setBet,
};
