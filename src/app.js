const express = require("express");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use("/api", require("./routes/schedule"));
app.use("/api", require("./routes/likes"));
app.use("/api", require("./routes/game2048"));
app.use("/api", require("./routes/progress"));
app.use("/api", require("./routes/polls"));
app.use("/api", require("./routes/broadcast"));
app.use("/api", require("./routes/starosta"));
app.use("/api", require("./routes/reminders"));
app.use("/api", require("./routes/hiddenPairs"));
app.use("/api", require("./routes/subjectBackgrounds"));
app.use("/api", require("./routes/birthdays"));
app.use("/api", require("./routes/bets"));
app.use("/api", require("./routes/roulette"));
app.use("/api", require("./routes/monopoly"));
app.use("/api", require("./routes/achievements"));
app.use("/api", require("./routes/deadlineReminders"));

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
