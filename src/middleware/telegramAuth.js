const { verifyTelegramInitData } = require("../lib/telegram");
const config = require("../config");
const subscribersRepo = require("../repositories/subscribers");

async function telegramAuth(req, res, next) {
  if (!config.BOT_TOKEN) {
    return next();
  }
  const initData = req.headers["x-telegram-init-data"];
  const data = verifyTelegramInitData(initData);
  if (!data) {
    console.warn("telegramAuth: invalid or missing initData");
    return res.status(401).json({ error: "unauthorized" });
  }
  req.telegram = data;
  try {
    const chatId =
      (data.chat && data.chat.id) ||
      (data.user && data.user.id);
    if (chatId) {
      const user = data.user;
      const profile = user ? {
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
      } : null;
      await subscribersRepo.ensureVisitor(Number(chatId), profile);
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  telegramAuth,
};
