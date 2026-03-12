const express = require("express");
const { telegramAuth } = require("../middleware/telegramAuth");
const rolesService = require("../services/roles");
const birthdaysRepo = require("../repositories/birthdays");
const subscribersRepo = require("../repositories/subscribers");

const router = express.Router();

router.get("/birthday", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.json({ day: null, month: null });
    const b = await birthdaysRepo.getBirthday(chatId);
    res.json(b);
  } catch (err) {
    next(err);
  }
});

router.post("/birthday", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.status(400).json({ error: "no_chat_id" });
    let day = req.body && req.body.day != null ? Number(req.body.day) : null;
    let month = req.body && req.body.month != null ? Number(req.body.month) : null;
    if (day != null && month != null) {
      day = Math.max(1, Math.min(31, Math.floor(day)));
      month = Math.max(1, Math.min(12, Math.floor(month)));
    } else {
      day = null;
      month = null;
    }
    const result = await birthdaysRepo.setBirthday(chatId, day, month);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/birthdays", telegramAuth, async (req, res, next) => {
  try {
    const data = await birthdaysRepo.getAllBirthdays();
    const subs = await subscribersRepo.getSubscribersData();
    const profiles = subs.profiles || {};
    const list = data.map((b) => {
      const p = profiles[b.chatId];
      const name = p ? [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.username || ("ID " + b.chatId) : null;
      return { chatId: b.chatId, day: b.day, month: b.month, name: name || "Участник" };
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
