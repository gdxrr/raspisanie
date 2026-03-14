const express = require("express");
const { optionalTelegramAuth, telegramAuth } = require("../../shared/middleware/telegramAuth");
const scheduleRepo = require("./repository");
const { validateScheduleBody } = require("./lib/scheduleValidation");
const { buildIcal, buildText } = require("./lib/scheduleExport");

const router = express.Router();

function parseDate(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
  return date;
}

router.get("/schedule", optionalTelegramAuth, async (req, res, next) => {
  try {
    const data = await scheduleRepo.getSchedule();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/schedule/export", optionalTelegramAuth, async (req, res, next) => {
  try {
    const format = (req.query.format || "ics").toLowerCase();
    const fromStr = req.query.from;
    const toStr = req.query.to;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let fromDate = parseDate(fromStr) || today;
    let toDate = parseDate(toStr);
    if (!toDate) {
      toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 28);
    }
    if (fromDate > toDate) {
      const t = fromDate;
      fromDate = toDate;
      toDate = t;
    }
    const schedule = await scheduleRepo.getSchedule();
    if (format === "text") {
      res.type("text/plain").send(buildText(schedule, fromDate, toDate));
      return;
    }
    res.set("Content-Disposition", 'attachment; filename="raspisanie.ics"');
    res.type("text/calendar").send(buildIcal(schedule, fromDate, toDate));
  } catch (err) {
    next(err);
  }
});

router.post("/schedule", telegramAuth, async (req, res, next) => {
  try {
    const result = validateScheduleBody(req.body);
    if (result.error) {
      return next(result.error);
    }
    await scheduleRepo.setSchedule(req.body);
    res.send({ status: "saved" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
