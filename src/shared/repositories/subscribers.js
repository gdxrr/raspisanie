const { pool } = require("../db");

async function getSubscribersData() {
  const r = await pool.query("SELECT chat_id, in_broadcast, first_name, last_name, username FROM subscribers ORDER BY chat_id");
  const visitors = [];
  const broadcast = [];
  const profiles = {};
  for (const row of r.rows) {
    const cid = Number(row.chat_id);
    visitors.push(cid);
    if (row.in_broadcast) broadcast.push(cid);
    profiles[cid] = {
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      username: row.username || "",
    };
  }
  return { visitors, broadcast, profiles };
}

async function addVisitor(chatId, profile) {
  const id = Number(chatId);
  await pool.query(
    `INSERT INTO subscribers (chat_id, in_broadcast, first_name, last_name, username)
     VALUES ($1, false, $2, $3, $4)
     ON CONFLICT (chat_id) DO UPDATE SET
       first_name = COALESCE(NULLIF(EXCLUDED.first_name,''), subscribers.first_name),
       last_name = COALESCE(NULLIF(EXCLUDED.last_name,''), subscribers.last_name),
       username = COALESCE(NULLIF(EXCLUDED.username,''), subscribers.username)`,
    [id, profile?.first_name ?? "", profile?.last_name ?? "", profile?.username ?? ""]
  );
}

async function setBroadcast(chatId, inBroadcast) {
  await pool.query(
    "UPDATE subscribers SET in_broadcast = $1 WHERE chat_id = $2",
    [!!inBroadcast, Number(chatId)]
  );
}

async function ensureVisitor(chatId, profile) {
  const id = Number(chatId);
  const r = await pool.query("SELECT 1 FROM subscribers WHERE chat_id = $1", [id]);
  if (r.rows.length === 0) {
    await pool.query(
      `INSERT INTO subscribers (chat_id, in_broadcast, first_name, last_name, username)
       VALUES ($1, false, $2, $3, $4)`,
      [id, profile?.first_name ?? "", profile?.last_name ?? "", profile?.username ?? ""]
    );
  } else if (profile && (profile.first_name || profile.last_name || profile.username)) {
    await pool.query(
      "UPDATE subscribers SET first_name = COALESCE(NULLIF(TRIM($2), ''), first_name), last_name = COALESCE(NULLIF(TRIM($3), ''), last_name), username = COALESCE(NULLIF(TRIM($4), ''), username) WHERE chat_id = $1",
      [id, profile.first_name ?? "", profile.last_name ?? "", profile.username ?? ""]
    );
  }
}

async function addToBroadcast(chatId) {
  await ensureVisitor(chatId, null);
  await pool.query("UPDATE subscribers SET in_broadcast = true WHERE chat_id = $1", [Number(chatId)]);
}

async function removeFromBroadcast(chatId) {
  await pool.query("UPDATE subscribers SET in_broadcast = false WHERE chat_id = $1", [Number(chatId)]);
}

module.exports = {
  getSubscribersData,
  addVisitor,
  setBroadcast,
  ensureVisitor,
  addToBroadcast,
  removeFromBroadcast,
};
