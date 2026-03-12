const express = require("express");
const { telegramAuth } = require("../middleware/telegramAuth");
const rolesService = require("../services/roles");
const remindersRepo = require("../repositories/reminders");

const router = express.Router();

router.get("/reminders", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.json([]);
    const list = await remindersRepo.getReminders(chatId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post("/reminders", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.status(400).json({ error: "no_chat_id" });
    const list = req.body && Array.isArray(req.body.reminders) ? req.body.reminders : [];
    const valid = list.filter((r) => {
      if (!r || typeof r.day !== "string" || typeof r.start !== "string") return false;
      const min = typeof r.minutesBefore === "number" ? r.minutesBefore : 0;
      const days = typeof r.daysBefore === "number" ? r.daysBefore : 0;
      const at = typeof r.remindAt === "string" ? r.remindAt.trim() : "";
      const hasMin = min >= 1 && min <= 120;
      const hasDays = days >= 1 && days <= 7;
      const hasAt = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(at);
      return hasMin || hasDays || hasAt;
    }).map((r) => {
      const at = typeof r.remindAt === "string" ? r.remindAt.trim() : "";
      const remindAt = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(at) ? at : "";
      return {
        day: r.day,
        start: r.start,
        minutesBefore: (r.minutesBefore >= 1 && r.minutesBefore <= 120) ? r.minutesBefore : 0,
        daysBefore: (r.daysBefore >= 1 && r.daysBefore <= 7) ? r.daysBefore : 0,
        remindAt,
      };
    });
    await remindersRepo.setReminders(chatId, valid);
    res.json({ reminders: valid });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
