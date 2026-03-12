const { pool } = require("../db");

async function getSchedule() {
  const r = await pool.query(
    'SELECT id, day, start, "end", type, subject, room, teacher, week FROM schedule ORDER BY id'
  );
  return r.rows.map((row) => ({
    id: row.id,
    day: row.day,
    start: row.start,
    end: row.end,
    type: row.type,
    subject: row.subject,
    room: row.room,
    teacher: row.teacher,
    week: row.week,
  }));
}

async function setSchedule(data) {
  const list = Array.isArray(data) ? data : [];
  await pool.query("DELETE FROM schedule");
  for (const item of list) {
    const id = item?.id != null ? Number(item.id) : null;
    if (id == null || !Number.isInteger(id)) continue;
    await pool.query(
      `INSERT INTO schedule (id, day, start, "end", type, subject, room, teacher, week)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET day = EXCLUDED.day, start = EXCLUDED.start, "end" = EXCLUDED."end",
         type = EXCLUDED.type, subject = EXCLUDED.subject, room = EXCLUDED.room, teacher = EXCLUDED.teacher, week = EXCLUDED.week`,
      [
        id,
        item.day ?? "",
        item.start ?? "",
        item.end ?? null,
        item.type ?? null,
        item.subject ?? null,
        item.room ?? null,
        item.teacher ?? null,
        item.week ?? null,
      ]
    );
  }
}

module.exports = {
  getSchedule,
  setSchedule,
};
