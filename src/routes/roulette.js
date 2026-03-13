"use strict";

const express = require("express");
const { strictTelegramAuth } = require("../middleware/telegramAuth");
const rouletteService = require("../services/rouletteService");

const router = express.Router();

router.get("/roulette/bootstrap", strictTelegramAuth, async (req, res, next) => {
  try {
    const data = await rouletteService.getBootstrap(req.telegram);
    res.json(data);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.code || "roulette_error" });
    }
    next(err);
  }
});

router.post("/roulette/bets", strictTelegramAuth, async (req, res, next) => {
  try {
    const bets = req.body && Array.isArray(req.body.bets) ? req.body.bets : [];
    const data = await rouletteService.placeBets(req.telegram, bets);
    res.json(data);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.code || "roulette_error" });
    }
    next(err);
  }
});

router.post("/roulette/admin/grants", strictTelegramAuth, async (req, res, next) => {
  try {
    const data = await rouletteService.grantAdmin(req.telegram, req.body || {});
    res.json(data);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.code || "roulette_error" });
    }
    next(err);
  }
});

module.exports = router;
