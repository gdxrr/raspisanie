const express = require("express");
const { telegramAuth } = require("../middleware/telegramAuth");
const game2048Repo = require("../repositories/game2048");

const router = express.Router();

router.get("/game2048-leaderboard", async (req, res, next) => {
  try {
    const list = await game2048Repo.getGame2048Leaderboard();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post("/game2048-leaderboard", telegramAuth, async (req, res, next) => {
  try {
    const score = typeof req.body.score === "number" ? req.body.score : parseInt(req.body.score, 10);
    if (isNaN(score) || score < 0) return res.status(400).json({ error: "invalid_score" });
    const name = (req.body.name && String(req.body.name).trim()) || (req.telegram && req.telegram.user && req.telegram.user.first_name) || "Игрок";
    const userId = req.telegram && req.telegram.user && req.telegram.user.id;
    const entry = { score, name, userId: userId || null, date: new Date().toISOString().slice(0, 10) };
    const top = await game2048Repo.addGame2048Score(entry);
    res.json(top);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
