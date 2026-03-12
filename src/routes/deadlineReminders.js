const express = require("express");
const { telegramAuth } = require("../middleware/telegramAuth");
const config = require("../config");
const rolesService = require("../services/roles");
const deadlinesRepo = require("../repositories/deadlines");

const router = express.Router();

const validDays = (arr) =>
  Array.isArray(arr) ? arr.filter((d) => typeof d === "number" && d >= 1 && config.DEADLINE_REMINDER_OPTIONS.includes(d)) : [];

router.get("/deadline-reminders", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.json({ bySubject: {} });
    const raw = await deadlinesRepo.getDeadlineReminders(chatId);
    const subjectList = await deadlinesRepo.getDeadlinesSubjectList();
    let bySubject = raw && typeof raw.bySubject === "object" ? raw.bySubject : {};
    if (raw && Array.isArray(raw.daysBefore) && raw.daysBefore.length > 0 && (!bySubject || Object.keys(bySubject).length === 0)) {
      const days = validDays(raw.daysBefore);
      if (days.length > 0) {
        bySubject = {};
        subjectList.forEach((s) => {
          bySubject[s] = [...days];
        });
      }
    }
    const out = {};
    Object.keys(bySubject).forEach((s) => {
      if (!subjectList.includes(s)) return;
      const days = validDays(bySubject[s]);
      if (days.length > 0) out[s] = [...new Set(days)];
    });
    res.json({ bySubject: out });
  } catch (err) {
    next(err);
  }
});

router.post("/deadline-reminders", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.status(400).json({ error: "no_chat_id" });
    const subjectList = await deadlinesRepo.getDeadlinesSubjectList();
    const raw = req.body && req.body.bySubject;
    const bySubject = {};
    if (raw && typeof raw === "object") {
      Object.keys(raw).forEach((subject) => {
        if (!subjectList.includes(subject)) return;
        const days = Array.isArray(raw[subject])
          ? [...new Set(raw[subject].map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 1 && config.DEADLINE_REMINDER_OPTIONS.includes(d)))]
          : [];
        if (days.length > 0) bySubject[subject] = days;
      });
    }
    await deadlinesRepo.setDeadlineReminders(chatId, bySubject);
    res.json({ bySubject });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
