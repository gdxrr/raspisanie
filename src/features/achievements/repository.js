"use strict";

const { pool } = require("../../shared/db");

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value || null;
}

function mapAchievementRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title || "",
    description: row.description || "",
    createdBy: row.created_by == null ? null : Number(row.created_by),
    createdAt: toIso(row.created_at),
  };
}

async function listLatest(limit) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 100));
  const res = await pool.query(
    `SELECT id, title, description, created_by, created_at
       FROM group_achievements
      ORDER BY created_at DESC, id DESC
      LIMIT $1`,
    [safeLimit]
  );
  return res.rows.map(mapAchievementRow);
}

async function countAll() {
  const res = await pool.query("SELECT COUNT(*)::int AS total FROM group_achievements");
  return Number((res.rows[0] && res.rows[0].total) || 0);
}

async function create(options) {
  const title = options && options.title ? String(options.title) : "";
  const description = options && options.description != null ? String(options.description) : "";
  const imageMimeType = options && options.imageMimeType ? String(options.imageMimeType) : "image/png";
  const imageData = options && options.imageData ? options.imageData : null;
  const createdBy = options && options.createdBy != null ? Number(options.createdBy) : null;

  const res = await pool.query(
    `INSERT INTO group_achievements (
       title,
       description,
       image_mime_type,
       image_data,
       created_by
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, description, created_by, created_at`,
    [title, description, imageMimeType, imageData, createdBy]
  );
  return mapAchievementRow(res.rows[0]);
}

async function getImageById(id) {
  const res = await pool.query(
    `SELECT id, image_mime_type, image_data
       FROM group_achievements
      WHERE id = $1`,
    [Number(id)]
  );
  if (!res.rows.length) return null;
  return {
    id: Number(res.rows[0].id),
    mimeType: res.rows[0].image_mime_type || "image/png",
    imageData: res.rows[0].image_data || null,
  };
}

module.exports = {
  listLatest,
  countAll,
  create,
  getImageById,
};
