require("dotenv").config();
const http = require("http");
const db = require("./src/db");
const app = require("./src/app");
const { runRemindersTick } = require("./src/services/remindersCron");
const rouletteService = require("./src/services/rouletteService");
const RouletteWsHub = require("./src/services/rouletteWsHub");
const monopolyService = require("./src/services/monopolyService");
const MonopolyWsHub = require("./src/services/monopolyWsHub");
const achievementsService = require("./src/services/achievementsService");
const AchievementsWsHub = require("./src/services/achievementsWsHub");

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
