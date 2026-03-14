const { pool } = require("../../shared/db");

async function getHiddenPairs(chatId) {
  const r = await pool.query("SELECT pair_id, mode FROM hidden_pairs WHERE chat_id = $1", [Number(chatId)]);
  const hiddenIds = [];
  const dimmedIds = [];
  for (const row of r.rows) {
    if (row.mode === "hidden") hiddenIds.push(row.pair_id);
    else if (row.mode === "dimmed") dimmedIds.push(row.pair_id);
  }
  return { hiddenIds, dimmedIds };
}

async function setHiddenPairs(chatId, hiddenIds, dimmedIds) {
  const cid = Number(chatId);
  await pool.query("DELETE FROM hidden_pairs WHERE chat_id = $1", [cid]);
  const insert = async (pairId, mode) => {
    await pool.query("INSERT INTO hidden_pairs (chat_id, pair_id, mode) VALUES ($1, $2, $3)", [cid, pairId, mode]);
  };
  for (const id of hiddenIds || []) await insert(Number(id), "hidden");
  for (const id of dimmedIds || []) await insert(Number(id), "dimmed");
}

module.exports = {
  getHiddenPairs,
  setHiddenPairs,
};
