const https = require("https");
const config = require("../config");
const messageLogRepo = require("../repositories/messageLog");

function sendTelegramMessage(chatId, text) {
  return new Promise((resolve) => {
    if (!config.BOT_TOKEN) return resolve(false);
    messageLogRepo.appendMessageLog(chatId, text).catch((e) => {
      console.error("Failed to append message log", e);
    });
    const payload = JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    });

    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${config.BOT_TOKEN}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            console.error("Telegram send error", res.statusCode, body);
            resolve(false);
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error("Telegram send request error", err);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  sendTelegramMessage,
};
