const rolesService = require("../../shared/lib/roles");
const subscribersRepo = require("../../shared/repositories/subscribers");
const telegramService = require("../../shared/lib/telegramService");

async function sendBroadcast(authData, text) {
  const header = rolesService.getStarostaSenderHeader(authData);
  const fullText = header + "\n\n" + text;

  const data = await subscribersRepo.getSubscribersData();
  const subscribers = data.broadcast;
  if (!subscribers.length) {
    return { sent: 0, total: 0 };
  }

  const results = await Promise.all(
    subscribers.map((id) => telegramService.sendTelegramMessage(id, fullText))
  );
  const sent = results.filter(Boolean).length;
  return { sent, total: subscribers.length };
}

module.exports = {
  sendBroadcast,
};
