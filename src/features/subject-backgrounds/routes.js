"use strict";

const express = require("express");
const multer = require("multer");
const { telegramAuth, strictTelegramAuth } = require("../../shared/middleware/telegramAuth");
const rolesService = require("../../shared/lib/roles");
const scheduleRepo = require("../schedule/repository");
const subjectBackgroundsRepo = require("./repository");
const {
  SUBJECT_BACKGROUND_MAX_BYTES,
  SUBJECT_BACKGROUND_MIME_TYPES,
  normalizeSubjectBackgroundUpload,
  toDataUrl,
} = require("./lib/subjectBackgrounds");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: SUBJECT_BACKGROUND_MAX_BYTES,
  },
  fileFilter: (req, file, cb) => {
    if (!file || !SUBJECT_BACKGROUND_MIME_TYPES.has(file.mimetype)) {
      const err = new Error("unsupported_mime_type");
      err.code = "unsupported_mime_type";
      err.status = 415;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

async function getValidSubjects() {
  const schedule = await scheduleRepo.getSchedule();
  return new Set(
    schedule
      .map((item) => (item && item.subject ? String(item.subject).trim() : ""))
      .filter(Boolean)
  );
}

function isSubjectAllowed(validSubjects, subject) {
  if (!subject) return false;
  if (!(validSubjects instanceof Set)) return true;
  if (validSubjects.size === 0) return true;
  return validSubjects.has(subject);
}

router.get("/subject-backgrounds", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.json({ bySubject: {} });
    const rows = await subjectBackgroundsRepo.getSubjectBackgrounds(chatId);
    const bySubject = {};
    rows.forEach((row) => {
      if (!row.subject) return;
      bySubject[row.subject] = {
        dataUrl: toDataUrl(row.imageData, row.mimeType),
        updatedAt: row.updatedAt,
      };
    });
    res.json({ bySubject });
  } catch (err) {
    next(err);
  }
});

router.post("/subject-backgrounds", strictTelegramAuth, upload.single("background"), async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.status(400).json({ error: "no_chat_id" });
    const subject = req.body && req.body.subject ? String(req.body.subject).trim() : "";
    if (!subject) return res.status(400).json({ error: "invalid_subject" });

    const validSubjects = await getValidSubjects();
    if (!isSubjectAllowed(validSubjects, subject)) {
      return res.status(400).json({ error: "invalid_subject" });
    }

    const normalized = await normalizeSubjectBackgroundUpload(req.file);
    const saved = await subjectBackgroundsRepo.upsertSubjectBackground(chatId, {
      subject,
      mimeType: normalized.mimeType,
      imageData: normalized.buffer,
      sha256: normalized.sha256,
    });
    res.json({
      subject: saved.subject,
      background: {
        dataUrl: toDataUrl(saved.imageData, saved.mimeType),
        updatedAt: saved.updatedAt,
      },
    });
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.code || "subject_background_error" });
    }
    next(err);
  }
});

router.delete("/subject-backgrounds", strictTelegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.status(400).json({ error: "no_chat_id" });
    const subject = req.query && req.query.subject ? String(req.query.subject).trim() : "";
    if (!subject) return res.status(400).json({ error: "invalid_subject" });

    const validSubjects = await getValidSubjects();
    if (!isSubjectAllowed(validSubjects, subject)) {
      return res.status(400).json({ error: "invalid_subject" });
    }

    await subjectBackgroundsRepo.deleteSubjectBackground(chatId, subject);
    res.json({ subject, deleted: true });
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "background_too_large" });
  }
  if (err && err.code === "unsupported_mime_type") {
    return res.status(415).json({ error: "unsupported_mime_type" });
  }
  return next(err);
});

module.exports = router;
