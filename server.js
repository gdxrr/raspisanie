require("dotenv").config();
const db = require("./src/db");
const app = require("./src/app");
const { runRemindersTick } = require("./src/services/remindersCron");

async function start() {
  await db.initDb();
  app.listen(3000, () => {
    console.log("Server started http://localhost:3000");
  });
  setInterval(runRemindersTick, 60000);
  runRemindersTick();
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
