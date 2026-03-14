"use strict";

const express = require("express");
const multer = require("multer");
const { strictTelegramAuth } = require("../../shared/middleware/telegramAuth");
const achievementsService = require("./service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file || (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg")) {
      const err = new Error("unsupported_mime_type");
      err.code = "unsupported_mime_type";
      err.status = 415;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

router.get("/achievements/bootstrap", strictTelegramAuth, async (req, res, next) => {
  try {
    const data = await achievementsService.getBootstrap(req.telegram);
    res.json(data);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.code || "achievements_error" });
    }
    next(err);
  }
});

router.post("/achievements", strictTelegramAuth, upload.single("image"), async (req, res, next) => {
  try {
    const data = await achievementsService.createAchievement(req.telegram, req.body || {}, req.file);
    res.json(data);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.code || "achievements_error" });
    }
    next(err);
  }
});

router.get("/achievements/images/:id", async (req, res, next) => {
  try {
    const image = await achievementsService.getImageById(req.params.id);
    res.setHeader("Content-Type", image.mimeType || "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(image.imageData);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.code || "achievements_error" });
    }
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "image_too_large" });
  }
  if (err && err.code === "unsupported_mime_type") {
    return res.status(415).json({ error: "unsupported_mime_type" });
  }
  return next(err);
});

module.exports = router;
