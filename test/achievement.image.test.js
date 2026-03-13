"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const { normalizeAchievementImage } = require("../src/lib/achievementImage");

test("normalizes achievement image to 256x256 png", async () => {
  const input = await sharp({
    create: {
      width: 420,
      height: 200,
      channels: 3,
      background: { r: 20, g: 150, b: 220 },
    },
  })
    .jpeg()
    .toBuffer();

  const normalizedA = await normalizeAchievementImage(input, "image/jpeg");
  const normalizedB = await normalizeAchievementImage(input, "image/jpeg");
  const metadata = await sharp(normalizedA.buffer).metadata();

  assert.equal(normalizedA.mimeType, "image/png");
  assert.equal(metadata.width, 256);
  assert.equal(metadata.height, 256);
  assert.equal(normalizedA.sha256, normalizedB.sha256);
});

test("rejects unsupported mime type", async () => {
  await assert.rejects(
    normalizeAchievementImage(Buffer.from("abcd"), "image/gif"),
    function (err) {
      assert.equal(err.code, "unsupported_mime_type");
      return true;
    }
  );
});

test("rejects invalid image content", async () => {
  await assert.rejects(
    normalizeAchievementImage(Buffer.from("not-an-image"), "image/png"),
    function (err) {
      assert.equal(err.code, "invalid_image");
      return true;
    }
  );
});
