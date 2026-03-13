"use strict";

const express = require("express");
const multer = require("multer");
const { strictTelegramAuth } = require("../middleware/telegramAuth");
const monopolyService = require("../services/monopolyService");

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

router.post("/monopoly/rooms", strictTelegramAuth, async (req, res, next) => {
  try {
    const snapshot = await monopolyService.createRoom(req.telegram, req.body || {});
    res.json(snapshot);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.code || "monopoly_error" });
    next(err);
  }
});

router.post("/monopoly/rooms/join", strictTelegramAuth, async (req, res, next) => {
  try {
    const roomCode = req.body && req.body.roomCode ? String(req.body.roomCode) : "";
    const snapshot = await monopolyService.joinRoom(req.telegram, roomCode);
    res.json(snapshot);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.code || "monopoly_error" });
    next(err);
  }
});

router.post("/monopoly/rooms/:roomCode/ready", strictTelegramAuth, async (req, res, next) => {
  try {
    const ready = req.body && req.body.ready != null ? !!req.body.ready : true;
    const snapshot = await monopolyService.setReady(req.telegram, req.params.roomCode, ready);
    res.json(snapshot);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.code || "monopoly_error" });
    next(err);
  }
});

router.get("/monopoly/rooms/:roomCode/bootstrap", strictTelegramAuth, async (req, res, next) => {
  try {
    const snapshot = await monopolyService.getBootstrap(req.telegram, req.params.roomCode);
    res.json(snapshot);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.code || "monopoly_error" });
    next(err);
  }
});

router.post("/monopoly/rooms/:roomCode/action", strictTelegramAuth, async (req, res, next) => {
  try {
    const action = req.body || {};
    const snapshot = await monopolyService.action(req.telegram, req.params.roomCode, action);
    res.json(snapshot);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.code || "monopoly_error" });
    next(err);
  }
});

router.post("/monopoly/rooms/:roomCode/token", strictTelegramAuth, upload.single("token"), async (req, res, next) => {
  try {
    const result = await monopolyService.uploadToken(req.telegram, req.params.roomCode, req.file);
    res.json(result);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.code || "monopoly_error" });
    next(err);
  }
});

router.get("/monopoly/tokens/:tokenId", async (req, res, next) => {
  try {
    const token = await monopolyService.getToken(req.params.tokenId);
    res.setHeader("Content-Type", token.mimeType || "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(token.imageData);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.code || "monopoly_error" });
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "token_too_large" });
  }
  if (err && err.code === "unsupported_mime_type") {
    return res.status(415).json({ error: "unsupported_mime_type" });
  }
  return next(err);
});

module.exports = router;
