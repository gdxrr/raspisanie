"use strict";

const crypto = require("crypto");
const sharp = require("sharp");

function createTokenError(code, status) {
  const err = new Error(code);
  err.code = code;
  err.status = status;
  return err;
}

function isSupportedMime(mimeType) {
  return mimeType === "image/png" || mimeType === "image/jpeg";
}

async function normalizeMonopolyToken(inputBuffer, mimeType) {
  if (!Buffer.isBuffer(inputBuffer) || !inputBuffer.length) {
    throw createTokenError("empty_token", 400);
  }
  if (!isSupportedMime(mimeType)) {
    throw createTokenError("unsupported_mime_type", 415);
  }

  let image;
  try {
    image = sharp(inputBuffer, { failOn: "error" });
  } catch {
    throw createTokenError("invalid_image", 400);
  }

  const metadata = await image.metadata();
  if (!metadata || !metadata.width || !metadata.height) {
    throw createTokenError("invalid_image", 400);
  }

  const side = Math.min(metadata.width, metadata.height);
  const left = Math.max(0, Math.floor((metadata.width - side) / 2));
  const top = Math.max(0, Math.floor((metadata.height - side) / 2));

  const normalized = await image
    .extract({ left, top, width: side, height: side })
    .resize(96, 96, {
      fit: "cover",
      position: "centre",
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const sha256 = crypto.createHash("sha256").update(normalized).digest("hex");
  return {
    mimeType: "image/png",
    buffer: normalized,
    sha256,
    width: 96,
    height: 96,
  };
}

module.exports = {
  createTokenError,
  isSupportedMime,
  normalizeMonopolyToken,
};
