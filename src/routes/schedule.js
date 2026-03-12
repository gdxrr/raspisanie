const express = require("express");
const { telegramAuth } = require("../middleware/telegramAuth");
const scheduleRepo = require("../repositories/schedule");

const router = express.Router();

router.get("/schedule", telegramAuth, async (req, res, next) => {
  try {
    const data = await scheduleRepo.getSchedule();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/schedule", telegramAuth, async (req, res, next) => {
  try {
    await scheduleRepo.setSchedule(req.body);
    res.send({ status: "saved" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
