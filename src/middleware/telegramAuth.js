const { verifyTelegramInitData } = require("../lib/telegram");
const config = require("../config");
const subscribersRepo = require("../repositories/subscribers");

function createAuthError(status, code) {
  const err = new Error(code);
  err.status = status;
  err.code = code;
  return err;
}

async function resolveTelegramAuth(initData, options) {
  const strict = !!(options && options.strict);
  if (!config.BOT_TOKEN) {
    if (strict) {
      throw createAuthError(503, "telegram_auth_unavailable");
    }
    return null;
  }

  const data = verifyTelegramInitData(initData);
  if (!data) {
    console.warn("telegramAuth: invalid or missing initData");
    throw createAuthError(401, "unauthorized");
  }

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
    return data;
  } catch (err) {
    if (strict || config.BOT_TOKEN) {
      throw err;
    }
    return null;
  }
}

function buildTelegramAuthMiddleware(options) {
  const optional = !!(options && options.optional);
  return async function telegramAuthMiddleware(req, res, next) {
    try {
      const initData = req.headers["x-telegram-init-data"];
      const data = await resolveTelegramAuth(initData, options);
      if (data) {
        req.telegram = data;
      }
      next();
    } catch (err) {
      if (optional) {
        req.telegram = null;
        return next();
      }
      if (err && err.status) {
        return res.status(err.status).json({ error: err.code || "unauthorized" });
      }
      next(err);
    }
  };
}

const telegramAuth = buildTelegramAuthMiddleware({ strict: false });
const strictTelegramAuth = buildTelegramAuthMiddleware({ strict: true });
/** GET-запросы (например, расписание) могут проходить без Telegram — для localhost/разработки отдаём те же данные из БД */
const optionalTelegramAuth = buildTelegramAuthMiddleware({ strict: false, optional: true });

module.exports = {
  resolveTelegramAuth,
  telegramAuth,
  strictTelegramAuth,
  optionalTelegramAuth,
};
