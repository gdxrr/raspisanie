"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const { normalizeMonopolyToken } = require("../src/lib/monopolyTokens");

test("normalizes png token to 96x96 and stable hash", async () => {
  const input = await sharp({
    create: {
      width: 200,
      height: 120,
      channels: 3,
      background: { r: 255, g: 40, b: 40 },
    },
  })
    .png()
    .toBuffer();

  const normalizedA = await normalizeMonopolyToken(input, "image/png");
  const normalizedB = await normalizeMonopolyToken(input, "image/png");
  const metadata = await sharp(normalizedA.buffer).metadata();

  assert.equal(normalizedA.mimeType, "image/png");
  assert.equal(metadata.width, 96);
  assert.equal(metadata.height, 96);
  assert.equal(normalizedA.sha256, normalizedB.sha256);
});

test("normalizes jpeg to png", async () => {
  const jpeg = await sharp({
    create: {
      width: 96,
      height: 96,
      channels: 3,
      background: { r: 10, g: 40, b: 220 },
    },
  })
    .jpeg()
    .toBuffer();

  const normalized = await normalizeMonopolyToken(jpeg, "image/jpeg");
  const metadata = await sharp(normalized.buffer).metadata();
  assert.equal(normalized.mimeType, "image/png");
  assert.equal(metadata.width, 96);
  assert.equal(metadata.height, 96);
});

test("rejects unsupported mime type", async () => {
  await assert.rejects(
    normalizeMonopolyToken(Buffer.from("abcd"), "image/gif"),
    function (err) {
      assert.equal(err.code, "unsupported_mime_type");
      return true;
    }
  );
});
