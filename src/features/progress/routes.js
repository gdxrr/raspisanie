const express = require("express");
const { telegramAuth } = require("../../shared/middleware/telegramAuth");
const progressRepo = require("./repository");

const router = express.Router();

router.get("/progress", telegramAuth, async (req, res, next) => {
  try {
    const userId = req.telegram && req.telegram.user && req.telegram.user.id;
    if (!userId) return res.json({});
    const userProgress = await progressRepo.getProgress(userId);
    res.json(userProgress);
  } catch (err) {
    next(err);
  }
});

router.post("/progress", telegramAuth, async (req, res, next) => {
  try {
    const userId = req.telegram && req.telegram.user && req.telegram.user.id;
    if (!userId) return res.status(401).json({ error: "unauthorized" });
    const deadlineId = req.body && req.body.deadlineId && String(req.body.deadlineId).trim();
    const done = !!req.body.done;
    if (!deadlineId) return res.status(400).json({ error: "deadlineId_required" });
    const userProgress = await progressRepo.setProgressItem(userId, deadlineId, done);
    res.json(userProgress);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
