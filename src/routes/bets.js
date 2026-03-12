const express = require("express");
const { telegramAuth } = require("../middleware/telegramAuth");
const config = require("../config");
const rolesService = require("../services/roles");
const scheduleRepo = require("../repositories/schedule");
const betsRepo = require("../repositories/bets");

const router = express.Router();

router.get("/bets", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    const data = await betsRepo.getBetsData();
    const schedule = await scheduleRepo.getSchedule();
    const validIds = schedule.map((c) => c.id);
    const myBets = {};
    const aggregates = {};
    validIds.forEach((id) => {
      const key = String(id);
      const pairBets = data[key];
      if (pairBets && typeof pairBets === "object") {
        const values = Object.values(pairBets).filter((v) => typeof v === "number" && v >= 0 && v <= config.GROUP_SIZE);
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          aggregates[key] = { count: values.length, avg: Math.round((sum / values.length) * 10) / 10 };
        }
        if (chatId != null && typeof pairBets[String(chatId)] === "number") {
          myBets[key] = pairBets[String(chatId)];
        }
      }
    });
    res.json({ myBets, aggregates });
  } catch (err) {
    next(err);
  }
});

router.post("/bet", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.status(400).json({ error: "no_chat_id" });
    const scheduleId = req.body && req.body.scheduleId != null ? Number(req.body.scheduleId) : null;
    let count = req.body && req.body.count != null ? Number(req.body.count) : null;
    if (!Number.isInteger(scheduleId) || scheduleId < 0) {
      return res.status(400).json({ error: "invalid_schedule_id" });
    }
    const schedule = await scheduleRepo.getSchedule();
    if (!schedule.some((c) => c.id === scheduleId)) {
      return res.status(400).json({ error: "schedule_not_found" });
    }
    if (count != null) {
      count = Math.max(0, Math.min(config.GROUP_SIZE, Math.round(count)));
    }
    const { myBet, aggregate } = await betsRepo.setBet(scheduleId, chatId, count);
    res.json({ myBet, aggregate });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
