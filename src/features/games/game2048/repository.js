const { pool } = require("../../shared/db");

const GAME2048_LEADERBOARD_MAX = 10;

async function getGame2048Leaderboard() {
  const r = await pool.query(
    "SELECT score, name, user_id, date FROM game2048_leaderboard ORDER BY score DESC LIMIT $1",
    [GAME2048_LEADERBOARD_MAX]
  );
  return r.rows.map((row) => ({
    score: row.score,
    name: row.name,
    userId: row.user_id,
    date: row.date ? row.date.toISOString().slice(0, 10) : null,
  }));
}

async function addGame2048Score(entry) {
  await pool.query(
    "INSERT INTO game2048_leaderboard (score, name, user_id, date) VALUES ($1, $2, $3, $4::date)",
    [entry.score, entry.name, entry.userId ?? null, entry.date]
  );
  const all = await pool.query("SELECT id, score FROM game2048_leaderboard ORDER BY score DESC");
  if (all.rows.length > GAME2048_LEADERBOARD_MAX) {
    const toDelete = all.rows.slice(GAME2048_LEADERBOARD_MAX).map((row) => row.id);
    await pool.query("DELETE FROM game2048_leaderboard WHERE id = ANY($1)", [toDelete]);
  }
  return getGame2048Leaderboard();
}

module.exports = {
  getGame2048Leaderboard,
  addGame2048Score,
};
