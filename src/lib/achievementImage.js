"use strict";

const crypto = require("crypto");
const sharp = require("sharp");

function createAchievementImageError(code, status) {
  const err = new Error(code);
  err.code = code;
  err.status = status;
  return err;
}

function isSupportedAchievementMime(mimeType) {
  return mimeType === "image/png" || mimeType === "image/jpeg";
}

async function normalizeAchievementImage(inputBuffer, mimeType) {
  if (!Buffer.isBuffer(inputBuffer) || !inputBuffer.length) {
    throw createAchievementImageError("empty_image", 400);
  }
  if (!isSupportedAchievementMime(mimeType)) {
    throw createAchievementImageError("unsupported_mime_type", 415);
  }

  let image;
  try {
    image = sharp(inputBuffer, { failOn: "error" });
  } catch {
    throw createAchievementImageError("invalid_image", 400);
  }

  let metadata;
  try {
    metadata = await image.metadata();
  } catch {
    throw createAchievementImageError("invalid_image", 400);
  }
  if (!metadata || !metadata.width || !metadata.height) {
    throw createAchievementImageError("invalid_image", 400);
  }

  const side = Math.min(metadata.width, metadata.height);
  const left = Math.max(0, Math.floor((metadata.width - side) / 2));
  const top = Math.max(0, Math.floor((metadata.height - side) / 2));

  let normalized;
  try {
    normalized = await image
      .extract({ left, top, width: side, height: side })
      .resize(256, 256, {
        fit: "cover",
        position: "centre",
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
  } catch {
    throw createAchievementImageError("invalid_image", 400);
  }

  const sha256 = crypto.createHash("sha256").update(normalized).digest("hex");
  return {
    mimeType: "image/png",
    buffer: normalized,
    sha256,
    width: 256,
    height: 256,
  };
}

module.exports = {
  createAchievementImageError,
  isSupportedAchievementMime,
  normalizeAchievementImage,
};
