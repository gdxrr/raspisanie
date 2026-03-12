const crypto = require("crypto");

function verifyTelegramInitData(initData) {
  const { BOT_TOKEN } = require("../config");
  if (!BOT_TOKEN || !initData) {
    console.warn("verifyTelegramInitData: no BOT_TOKEN or initData is empty");
    return null;
  }

  const urlSearchParams = new URLSearchParams(initData);
  const hash = urlSearchParams.get("hash");
  if (!hash) {
    console.warn("verifyTelegramInitData: no hash in initData");
    return null;
  }

  urlSearchParams.delete("hash");
  const dataCheckArr = [];
  for (const [key, value] of urlSearchParams.entries()) {
    dataCheckArr.push(`${key}=${value}`);
  }
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (hmac !== hash) {
    console.warn("verifyTelegramInitData: hash mismatch, expected", hmac, "got", hash);
    return null;
  }

  const authData = {};
  for (const [key, value] of urlSearchParams.entries()) {
    if (key === "user" || key === "chat") {
      try {
        authData[key] = JSON.parse(value);
      } catch {
        authData[key] = null;
      }
    } else {
      authData[key] = value;
    }
  }
  return authData;
}

module.exports = {
  verifyTelegramInitData,
};
