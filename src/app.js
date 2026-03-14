const express = require("express");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use("/api", require("./features/schedule/routes"));
app.use("/api", require("./features/likes/routes"));
app.use("/api", require("./features/games/game2048/routes"));
app.use("/api", require("./features/progress/routes"));
app.use("/api", require("./features/polls/routes"));
app.use("/api", require("./features/broadcast/routes"));
app.use("/api", require("./features/starosta/routes"));
app.use("/api", require("./features/reminders/routes"));
app.use("/api", require("./features/schedule/hiddenPairs.routes"));
app.use("/api", require("./features/subject-backgrounds/routes"));
app.use("/api", require("./features/birthdays/routes"));
app.use("/api", require("./features/bets/routes"));
app.use("/api", require("./features/games/roulette/routes"));
app.use("/api", require("./features/games/monopoly/routes"));
app.use("/api", require("./features/achievements/routes"));
app.use("/api", require("./features/deadlines/routes"));

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || "internal_error";
  if (status >= 500) {
    console.error("Unhandled error", err);
  }
  const body = { error: code };
  if (err.message && status < 500) {
    body.message = err.message;
  }
  if (err.details && typeof err.details === "object") {
    body.details = err.details;
  }
  res.status(status).json(body);
});

module.exports = app;
