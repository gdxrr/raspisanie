"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const {
  normalizeSubjectBackgroundUpload,
  toDataUrl,
} = require("../src/lib/subjectBackgrounds");

test("normalizes valid png background and produces stable hash", async () => {
  const input = await sharp({
    create: {
      width: 320,
      height: 180,
      channels: 3,
      background: { r: 20, g: 80, b: 180 },
    },
  })
    .png()
    .toBuffer();

  const normalizedA = await normalizeSubjectBackgroundUpload({
    buffer: input,
    mimetype: "image/png",
    size: input.length,
  });
  const normalizedB = await normalizeSubjectBackgroundUpload({
    buffer: input,
    mimetype: "image/png",
    size: input.length,
  });

  assert.equal(normalizedA.mimeType, "image/png");
  assert.equal(normalizedA.sha256, normalizedB.sha256);
  assert.ok(toDataUrl(normalizedA.buffer, normalizedA.mimeType).startsWith("data:image/png;base64,"));
});

test("rejects unsupported mime type for subject background", async () => {
  await assert.rejects(
    normalizeSubjectBackgroundUpload({
      buffer: Buffer.from("abcd"),
      mimetype: "image/gif",
      size: 4,
    }),
    function (err) {
      assert.equal(err.code, "unsupported_mime_type");
      return true;
    }
  );
});

test("rejects invalid image buffer for subject background", async () => {
  await assert.rejects(
    normalizeSubjectBackgroundUpload({
      buffer: Buffer.from("not-an-image"),
      mimetype: "image/png",
      size: 12,
    }),
    function (err) {
      assert.equal(err.code, "invalid_image");
      return true;
    }
  );
});
