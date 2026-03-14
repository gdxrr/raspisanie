const { pool } = require("../../shared/db");

async function getPolls(chatId) {
  const pollsRows = await pool.query(
    "SELECT id, question, created_by, created_at, closed FROM polls WHERE chat_id = $1 ORDER BY created_at DESC",
    [Number(chatId)]
  );
  const list = [];
  for (const p of pollsRows.rows) {
    const optRows = await pool.query(
      "SELECT option_index, text, count FROM poll_options WHERE poll_id = $1 ORDER BY option_index",
      [p.id]
    );
    const options = optRows.rows.map((o) => ({ text: o.text, count: o.count }));
    const voteRows = await pool.query("SELECT user_id, option_index FROM poll_votes WHERE poll_id = $1", [p.id]);
    const voted = {};
    for (const v of voteRows.rows) voted[String(v.user_id)] = v.option_index;
    list.push({
      id: p.id,
      question: p.question,
      options,
      voted,
      createdBy: p.created_by,
      createdAt: p.created_at ? p.created_at.toISOString() : null,
      closed: p.closed,
    });
  }
  return list;
}

async function createPoll(chatId, poll) {
  const pid = String(poll.id);
  await pool.query(
    "INSERT INTO polls (id, chat_id, question, created_by, created_at, closed) VALUES ($1, $2, $3, $4, $5::timestamptz, $6)",
    [pid, Number(chatId), poll.question, poll.createdBy ?? null, poll.createdAt ?? new Date().toISOString(), poll.closed ?? false]
  );
  for (let i = 0; i < (poll.options || []).length; i++) {
    const o = poll.options[i];
    await pool.query(
      "INSERT INTO poll_options (poll_id, option_index, text, count) VALUES ($1, $2, $3, $4)",
      [pid, i, o.text || "", o.count ?? 0]
    );
  }
  return getPolls(chatId).then((list) => list.find((p) => p.id === pid) || poll);
}

async function votePoll(pollId, userId, optionIndex) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pollRow = await client.query("SELECT id, closed FROM polls WHERE id = $1", [pollId]);
    if (pollRow.rows.length === 0) throw new Error("poll_not_found");
    if (pollRow.rows[0].closed) throw new Error("poll_closed");

    const prev = await client.query("SELECT option_index FROM poll_votes WHERE poll_id = $1 AND user_id = $2", [pollId, Number(userId)]);
    if (prev.rows.length > 0) {
      const prevIdx = prev.rows[0].option_index;
      await client.query("UPDATE poll_options SET count = GREATEST(0, count - 1) WHERE poll_id = $1 AND option_index = $2", [pollId, prevIdx]);
    }
    await client.query(
      "INSERT INTO poll_votes (poll_id, user_id, option_index) VALUES ($1, $2, $3) ON CONFLICT (poll_id, user_id) DO UPDATE SET option_index = EXCLUDED.option_index",
      [pollId, Number(userId), optionIndex]
    );
    await client.query("UPDATE poll_options SET count = count + 1 WHERE poll_id = $1 AND option_index = $2", [pollId, optionIndex]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  const list = await pool.query("SELECT chat_id FROM polls WHERE id = $1", [pollId]);
  const chatId = list.rows[0]?.chat_id;
  return chatId != null ? getPolls(chatId).then((l) => l.find((p) => p.id === pollId)) : null;
}

async function closePoll(pollId) {
  await pool.query("UPDATE polls SET closed = true WHERE id = $1", [pollId]);
  const r = await pool.query("SELECT chat_id FROM polls WHERE id = $1", [pollId]);
  const chatId = r.rows[0]?.chat_id;
  return chatId != null ? getPolls(chatId).then((l) => l.find((p) => p.id === pollId)) : null;
}

module.exports = {
  getPolls,
  createPoll,
  votePoll,
  closePoll,
};
