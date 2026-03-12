const express = require("express");
const { telegramAuth } = require("../middleware/telegramAuth");
const rolesService = require("../services/roles");
const scheduleRepo = require("../repositories/schedule");
const hiddenPairsRepo = require("../repositories/hiddenPairs");

const router = express.Router();

router.get("/hidden-pairs", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.json({ hiddenIds: [], dimmedIds: [] });
    const result = await hiddenPairsRepo.getHiddenPairs(chatId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/hidden-pairs", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.status(400).json({ error: "no_chat_id" });
    const schedule = await scheduleRepo.getSchedule();
    const validIds = schedule.map((c) => c.id);
    const parseIds = (raw) =>
      Array.isArray(raw)
        ? [...new Set(raw.map((x) => Number(x)).filter((n) => Number.isInteger(n) && n >= 0 && validIds.includes(n)))]
        : [];
    const hiddenIds = parseIds(req.body && req.body.hiddenIds);
    const dimmedIds = parseIds(req.body && req.body.dimmedIds);
    await hiddenPairsRepo.setHiddenPairs(chatId, hiddenIds, dimmedIds);
    res.json({ hiddenIds, dimmedIds });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
