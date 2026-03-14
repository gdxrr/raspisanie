"use strict";

const { pool } = require("../../shared/db");

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

async function getSubjectBackgrounds(chatId) {
  const res = await pool.query(
    `SELECT subject, mime_type, image_data, sha256, updated_at
       FROM subject_backgrounds
      WHERE chat_id = $1
      ORDER BY subject ASC`,
    [Number(chatId)]
  );
  return res.rows.map((row) => ({
    subject: row.subject || "",
    mimeType: row.mime_type,
    imageData: row.image_data,
    sha256: row.sha256,
    updatedAt: toIso(row.updated_at),
  }));
}

async function upsertSubjectBackground(chatId, options) {
  const res = await pool.query(
    `INSERT INTO subject_backgrounds (chat_id, subject, mime_type, image_data, sha256, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (chat_id, subject)
     DO UPDATE SET
       mime_type = EXCLUDED.mime_type,
       image_data = EXCLUDED.image_data,
       sha256 = EXCLUDED.sha256,
       updated_at = now()
     RETURNING subject, mime_type, image_data, sha256, updated_at`,
    [
      Number(chatId),
      String(options.subject || ""),
      String(options.mimeType || ""),
      options.imageData,
      String(options.sha256 || ""),
    ]
  );
  const row = res.rows[0];
  return {
    subject: row.subject || "",
    mimeType: row.mime_type,
    imageData: row.image_data,
    sha256: row.sha256,
    updatedAt: toIso(row.updated_at),
  };
}

async function deleteSubjectBackground(chatId, subject) {
  await pool.query(
    "DELETE FROM subject_backgrounds WHERE chat_id = $1 AND subject = $2",
    [Number(chatId), String(subject || "")]
  );
}

module.exports = {
  getSubjectBackgrounds,
  upsertSubjectBackground,
  deleteSubjectBackground,
};
