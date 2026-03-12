const { pool } = require("../db");

async function getLikesCount() {
  const r = await pool.query("SELECT count FROM likes WHERE id = 1");
  return r.rows.length ? r.rows[0].count : 0;
}

async function incrementLike() {
  await pool.query("UPDATE likes SET count = count + 1 WHERE id = 1");
  return getLikesCount();
}

module.exports = {
  getLikesCount,
  incrementLike,
};
