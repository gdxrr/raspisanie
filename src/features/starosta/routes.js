const express = require("express");
const { telegramAuth } = require("../../shared/middleware/telegramAuth");
const config = require("../../shared/config");
const rolesService = require("../../shared/lib/roles");
const telegramService = require("../../shared/lib/telegramService");
const subscribersRepo = require("../../shared/repositories/subscribers");

const router = express.Router();

router.post("/contact-starosta", telegramAuth, async (req, res) => {
  const text = (req.body && req.body.text && String(req.body.text).trim()) || "";
  if (!text) {
    return res.status(400).json({ error: "text_required" });
  }
  const user = (req.telegram && req.telegram.user) || {};
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Без имени";
  const username = user.username ? `@${user.username}` : "";
  const headerLines = [
    `Сообщение от ${name}${username ? ` (${username})` : ""}`,
    "",
  ];
  const fullText = headerLines.join("\n") + text;

  const ok = await telegramService.sendTelegramMessage(config.STAROSTA_ID, fullText);
  if (!ok) {
    return res.status(500).json({ error: "send_failed" });
  }
  res.json({ status: "sent" });
});

router.post("/feedback", telegramAuth, async (req, res) => {
  const text = (req.body && req.body.text && String(req.body.text).trim()) || "";
  if (!text) {
    return res.status(400).json({ error: "text_required" });
  }
  const user = (req.telegram && req.telegram.user) || {};
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Без имени";
  const username = user.username ? `@${user.username}` : "";
  const headerLines = [
    "📩 Жалобы и предложения",
    "",
    `От: ${name}${username ? ` (${username})` : ""}`,
    "",
  ];
  const fullText = headerLines.join("\n") + text;

  const debugIds = [...config.DEBUG_IDS];
  if (debugIds.length === 0) {
    return res.status(500).json({ error: "no_debug_recipients" });
  }

  let sent = 0;
  for (const id of debugIds) {
    const ok = await telegramService.sendTelegramMessage(Number(id), fullText);
    if (ok) sent++;
  }
  if (sent === 0) {
    return res.status(500).json({ error: "send_failed" });
  }
  res.json({ status: "sent" });
});

router.get("/participants", telegramAuth, async (req, res, next) => {
  try {
    if (!rolesService.hasStarostaRights(req.telegram)) {
      return res.status(403).json({ error: "forbidden" });
    }
    const data = await subscribersRepo.getSubscribersData();
    const profiles = data.profiles || {};
    const starostaLikeIds = rolesService.getStarostaLikeIds();
    const list = (data.visitors || [])
      .filter((id) => !starostaLikeIds.includes(Number(id)))
      .map((id) => {
        const p = profiles[id] || {};
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
        const displayName = name
          ? (p.username ? `${name} (@${p.username})` : name)
          : (p.username ? `@${p.username}` : `ID ${id}`);
        return { id: Number(id), displayName };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post("/send-to-participant", telegramAuth, async (req, res) => {
  if (!rolesService.hasStarostaRights(req.telegram)) {
    return res.status(403).json({ error: "forbidden" });
  }
  const toChatId = req.body && req.body.toChatId != null ? Number(req.body.toChatId) : null;
  const text = (req.body && req.body.text && String(req.body.text).trim()) || "";
  if (!toChatId || !text) {
    return res.status(400).json({ error: "toChatId and text required" });
  }
  const header = rolesService.getStarostaSenderHeader(req.telegram);
  const fullText = header + "\n\n" + text;
  const ok = await telegramService.sendTelegramMessage(toChatId, fullText);
  if (!ok) {
    return res.status(500).json({ error: "send_failed" });
  }
  res.json({ status: "sent" });
});

module.exports = router;
