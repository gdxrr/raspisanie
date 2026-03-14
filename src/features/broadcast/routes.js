const express = require("express");
const { telegramAuth } = require("../../shared/middleware/telegramAuth");
const rolesService = require("../../shared/lib/roles");
const broadcastService = require("./service");
const subscribersRepo = require("../../shared/repositories/subscribers");

const router = express.Router();

router.post("/broadcast", telegramAuth, async (req, res, next) => {
  try {
    if (!rolesService.isAdminUser(req.telegram) && !rolesService.hasStarostaRights(req.telegram)) {
      return res.status(403).json({ error: "forbidden" });
    }
    const text = (req.body && req.body.text && String(req.body.text).trim()) || "";
    if (!text) {
      return res.status(400).json({ error: "text_required" });
    }
    const result = await broadcastService.sendBroadcast(req.telegram, text);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/broadcast-status", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) {
      return res.json({ subscribed: false, isStarosta: false });
    }
    const data = await subscribersRepo.getSubscribersData();
    const subscribed = data.broadcast.includes(Number(chatId));
    res.json({
      subscribed,
      isStarosta: rolesService.hasStarostaRights(req.telegram),
      role: rolesService.getCurrentUserRole(req.telegram),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/broadcast-subscribe", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) {
      return res.status(400).json({ error: "no_chat_id" });
    }
    await subscribersRepo.addToBroadcast(chatId);
    res.json({ subscribed: true });
  } catch (err) {
    next(err);
  }
});

router.post("/broadcast-unsubscribe", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) {
      return res.status(400).json({ error: "no_chat_id" });
    }
    await subscribersRepo.removeFromBroadcast(chatId);
    res.json({ subscribed: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
