const { pool } = require("../../shared/db");

async function getDeadlinesList() {
  const r = await pool.query(
    'SELECT id, subject, task, date, type, work_type FROM deadlines ORDER BY date'
  );
  return r.rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    task: row.task,
    date: row.date ? row.date.toISOString().slice(0, 10) : null,
    type: row.type || "soft",
    workType: row.work_type || null,
  }));
}

async function setDeadlinesList(list) {
  await pool.query("DELETE FROM deadlines");
  if (Array.isArray(list) && list.length > 0) {
    for (const d of list) {
      await pool.query(
        "INSERT INTO deadlines (id, subject, task, date) VALUES ($1, $2, $3, $4::date)",
        [d.id, d.subject ?? null, d.task ?? null, d.date]
      );
    }
  }
}

async function getDeadlineReminders(chatId) {
  const r = await pool.query("SELECT by_subject FROM deadline_reminders WHERE chat_id = $1", [Number(chatId)]);
  if (r.rows.length === 0) return { bySubject: {} };
  const raw = r.rows[0].by_subject;
  return { bySubject: raw && typeof raw === "object" ? raw : {} };
}

async function setDeadlineReminders(chatId, bySubject) {
  const cid = Number(chatId);
  await pool.query(
    `INSERT INTO deadline_reminders (chat_id, by_subject) VALUES ($1, $2::jsonb)
     ON CONFLICT (chat_id) DO UPDATE SET by_subject = EXCLUDED.by_subject`,
    [cid, JSON.stringify(bySubject && typeof bySubject === "object" ? bySubject : {})]
  );
}

async function getAllDeadlineRemindersData() {
  const r = await pool.query("SELECT chat_id, by_subject FROM deadline_reminders");
  const out = {};
  for (const row of r.rows) {
    out[String(row.chat_id)] = { bySubject: row.by_subject && typeof row.by_subject === "object" ? row.by_subject : {} };
  }
  return out;
}

async function getDeadlinesSubjectList() {
  const list = await getDeadlinesList();
  const set = new Set();
  list.forEach((d) => {
    if (d.subject) set.add(d.subject);
  });
  return [...set].sort();
}

module.exports = {
  getDeadlinesList,
  setDeadlinesList,
  getDeadlineReminders,
  setDeadlineReminders,
  getAllDeadlineRemindersData,
  getDeadlinesSubjectList,
};
