"use strict";

const crypto = require("crypto");
const sharp = require("sharp");

const SUBJECT_BACKGROUND_MAX_BYTES = 1024 * 1024;
const SUBJECT_BACKGROUND_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

function createSubjectBackgroundError(code, status) {
  const err = new Error(code);
  err.code = code;
  err.status = status;
  return err;
}

async function normalizeSubjectBackgroundUpload(file) {
  if (!file || !file.buffer || !file.mimetype) {
    throw createSubjectBackgroundError("background_required", 400);
  }
  if (!SUBJECT_BACKGROUND_MIME_TYPES.has(file.mimetype)) {
    throw createSubjectBackgroundError("unsupported_mime_type", 415);
  }
  if (file.size != null && Number(file.size) > SUBJECT_BACKGROUND_MAX_BYTES) {
    throw createSubjectBackgroundError("background_too_large", 413);
  }

  try {
    await sharp(file.buffer).metadata();
  } catch (err) {
    throw createSubjectBackgroundError("invalid_image", 400);
  }

  return {
    mimeType: file.mimetype,
    buffer: file.buffer,
    sha256: crypto.createHash("sha256").update(file.buffer).digest("hex"),
  };
}

function toDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;
}

module.exports = {
  SUBJECT_BACKGROUND_MAX_BYTES,
  SUBJECT_BACKGROUND_MIME_TYPES,
  normalizeSubjectBackgroundUpload,
  toDataUrl,
};
