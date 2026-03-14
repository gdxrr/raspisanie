require("dotenv").config();
const http = require("http");
const db = require("./src/shared/db");
const app = require("./src/app");
const { runRemindersTick } = require("./src/features/reminders/cron");
const rouletteService = require("./src/features/games/roulette/service");
const RouletteWsHub = require("./src/features/games/roulette/wsHub");
const monopolyService = require("./src/features/games/monopoly/service");
const MonopolyWsHub = require("./src/features/games/monopoly/wsHub");
const achievementsService = require("./src/features/achievements/service");
const AchievementsWsHub = require("./src/features/achievements/wsHub");

const PORT = Number(process.env.PORT || 3000);

async function start() {
  await db.initDb();
  const server = http.createServer(app);
  const rouletteWsHub = new RouletteWsHub({
    rouletteService,
  });
  const monopolyWsHub = new MonopolyWsHub({
    monopolyService,
  });
  const achievementsWsHub = new AchievementsWsHub({
    achievementsService,
  });
  rouletteWsHub.attachToServer(server);
  monopolyWsHub.attachToServer(server);
  achievementsWsHub.attachToServer(server);
  rouletteService.attachHub(rouletteWsHub);
  monopolyService.attachHub(monopolyWsHub);
  achievementsService.attachHub(achievementsWsHub);
  rouletteService.start();
  monopolyService.start();

  server.listen(PORT, () => {
    console.log("Server started http://localhost:" + PORT);
  });
  setInterval(runRemindersTick, 60000);
  runRemindersTick();
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
