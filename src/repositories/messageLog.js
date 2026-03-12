const { pool } = require("../db");

async function appendMessageLog(chatId, text) {
  await pool.query("INSERT INTO message_log (chat_id, text) VALUES ($1, $2)", [Number(chatId), text]);
}

module.exports = {
  appendMessageLog,
};
