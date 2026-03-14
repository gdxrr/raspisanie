const express = require("express");
const { telegramAuth } = require("../../shared/middleware/telegramAuth");
const hiddenPairsRepo = require("./hiddenPairs.repository");

const router = express.Router();

router.get("/hidden-pairs", telegramAuth, async (req, res, next) => {
  try {
    const chatId = req.telegram && req.telegram.user && req.telegram.user.id;
    if (chatId == null) return res.json({ hiddenIds: [], dimmedIds: [] });
    const data = await hiddenPairsRepo.getHiddenPairs(chatId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/hidden-pairs", telegramAuth, async (req, res, next) => {
  try {
    const chatId = req.telegram && req.telegram.user && req.telegram.user.id;
    if (chatId == null) return res.status(400).json({ error: "no_chat_id" });
    const hiddenIds = Array.isArray(req.body.hiddenIds) ? req.body.hiddenIds.map(Number).filter(Number.isInteger) : [];
    const dimmedIds = Array.isArray(req.body.dimmedIds) ? req.body.dimmedIds.map(Number).filter(Number.isInteger) : [];
    await hiddenPairsRepo.setHiddenPairs(chatId, hiddenIds, dimmedIds);
    res.json({ hiddenIds, dimmedIds });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

