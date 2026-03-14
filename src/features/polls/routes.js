const express = require("express");
const { telegramAuth } = require("../../shared/middleware/telegramAuth");
const rolesService = require("../../shared/lib/roles");
const pollsRepo = require("./repository");

const router = express.Router();

router.get("/polls", telegramAuth, async (req, res, next) => {
  try {
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.json([]);
    const list = await pollsRepo.getPolls(chatId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post("/polls", telegramAuth, async (req, res, next) => {
  try {
    if (!rolesService.hasStarostaRights(req.telegram)) return res.status(403).json({ error: "forbidden" });
    const chatId = rolesService.getCurrentChatId(req.telegram);
    if (chatId == null) return res.status(400).json({ error: "no_chat" });
    const question = req.body && req.body.question && String(req.body.question).trim();
    const options = req.body && req.body.options;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "question and options (array, min 2) required" });
    }
    const opts = options.slice(0, 6).map((o) => ({ text: String(o).trim(), count: 0 }));
    if (opts.some((o) => !o.text)) return res.status(400).json({ error: "empty_option" });
    const poll = {
      id: String(Date.now()),
      question,
      options: opts,
      voted: {},
      createdBy: req.telegram.user && req.telegram.user.id,
      createdAt: new Date().toISOString(),
      closed: false
    };
    const created = await pollsRepo.createPoll(chatId, poll);
    res.json(created);
  } catch (err) {
    next(err);
  }
});

router.post("/polls/:id/vote", telegramAuth, async (req, res, next) => {
  try {
    const userId = req.telegram && req.telegram.user && req.telegram.user.id;
    if (userId == null) return res.status(400).json({ error: "unauthorized" });
    const optionIndex = parseInt(req.body && req.body.optionIndex, 10);
    if (isNaN(optionIndex) || optionIndex < 0) return res.status(400).json({ error: "invalid_optionIndex" });
    const poll = await pollsRepo.votePoll(req.params.id, userId, optionIndex);
    if (!poll) return res.status(404).json({ error: "poll_not_found" });
    res.json(poll);
  } catch (err) {
    if (err.message === "poll_not_found") return res.status(404).json({ error: "poll_not_found" });
    if (err.message === "poll_closed") return res.status(400).json({ error: "poll_closed" });
    next(err);
  }
});

router.post("/polls/:id/close", telegramAuth, async (req, res, next) => {
  try {
    if (!rolesService.hasStarostaRights(req.telegram)) return res.status(403).json({ error: "forbidden" });
    const poll = await pollsRepo.closePoll(req.params.id);
    if (!poll) return res.status(404).json({ error: "poll_not_found" });
    res.json(poll);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
