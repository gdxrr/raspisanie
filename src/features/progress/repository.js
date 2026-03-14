const { pool } = require("../../shared/db");

async function getProgress(userId) {
  const r = await pool.query("SELECT deadline_id, done FROM progress WHERE user_id = $1", [Number(userId)]);
  const out = {};
  for (const row of r.rows) out[row.deadline_id] = row.done;
  return out;
}

async function setProgressItem(userId, deadlineId, done) {
  await pool.query(
    `INSERT INTO progress (user_id, deadline_id, done) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, deadline_id) DO UPDATE SET done = EXCLUDED.done`,
    [Number(userId), String(deadlineId), !!done]
  );
  return getProgress(userId);
}

module.exports = {
  getProgress,
  setProgressItem,
};
