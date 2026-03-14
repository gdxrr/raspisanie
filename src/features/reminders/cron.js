const config = require("../../shared/config");
const scheduleUtils = require("../schedule/lib/scheduleUtils");
const scheduleRepo = require("../schedule/repository");
const remindersRepo = require("./repository");
const deadlinesRepo = require("../deadlines/repository");
const telegramService = require("../../shared/lib/telegramService");

let reminderSentToday = {};

async function runRemindersTick() {
  if (!config.BOT_TOKEN) return;
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    Object.keys(reminderSentToday).forEach((k) => {
      if (reminderSentToday[k] !== todayStr) delete reminderSentToday[k];
    });
    const dayName = scheduleUtils.getTodayDayName();
    const weekType = scheduleUtils.getWeekType(now);
    const schedule = await scheduleRepo.getSchedule();
    const remindersByUser = await remindersRepo.getAllRemindersData();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const REMINDER_DAY_HOUR = config.REMINDER_DAY_HOUR;

    for (const [userId, reminders] of Object.entries(remindersByUser)) {
      if (!Array.isArray(reminders) || !reminders.length) continue;
      for (const r of reminders) {
        const cls = schedule.find(
          (c) => c.day === r.day && c.start === r.start && (c.week === "both" || c.week === weekType)
        );
        const subject = cls ? cls.subject : "Пара";
        const room = cls ? cls.room : "";

        if (r.minutesBefore >= 1 && r.day === dayName) {
          const [h, m] = r.start.split(":").map(Number);
          const classStartMinutes = h * 60 + m;
          const reminderAtMinutes = classStartMinutes - r.minutesBefore;
          if (currentMinutes >= reminderAtMinutes && currentMinutes <= reminderAtMinutes + 1) {
            const sentKey = `min-${userId}-${r.day}-${r.start}`;
            if (reminderSentToday[sentKey] !== todayStr) {
              const text = `🔔 Напоминание: через ${r.minutesBefore} мин — ${subject} (${r.start}${room ? ", " + room : ""})`;
              telegramService.sendTelegramMessage(Number(userId), text).then((ok) => {
                if (ok) reminderSentToday[sentKey] = todayStr;
              });
            }
          }
        }

        if (r.daysBefore >= 1) {
          const classDate = scheduleUtils.getNextOccurrenceOfDay(r.day);
          if (!classDate) continue;
          const reminderDate = new Date(classDate);
          reminderDate.setDate(classDate.getDate() - r.daysBefore);
          const reminderDateStr = `${reminderDate.getFullYear()}-${String(reminderDate.getMonth() + 1).padStart(2, "0")}-${String(reminderDate.getDate()).padStart(2, "0")}`;
          if (reminderDateStr !== todayStr) continue;
          const targetMinutes = REMINDER_DAY_HOUR * 60;
          if (currentMinutes < targetMinutes || currentMinutes > targetMinutes + 1) continue;
          const sentKey = `day-${userId}-${r.day}-${r.start}-${r.daysBefore}`;
          if (reminderSentToday[sentKey] === todayStr) continue;
          const dayLabel = r.daysBefore === 1 ? "1 день" : r.daysBefore < 5 ? `${r.daysBefore} дня` : `${r.daysBefore} дней`;
          const text = `🔔 Напоминание: через ${dayLabel} — ${subject} (${r.day}, ${r.start}${room ? ", " + room : ""})`;
          telegramService.sendTelegramMessage(Number(userId), text).then((ok) => {
            if (ok) reminderSentToday[sentKey] = todayStr;
          });
        }

        if (r.remindAt && r.day === dayName) {
          const [ah, am] = r.remindAt.split(":").map(Number);
          const targetMinutes = ah * 60 + am;
          if (currentMinutes < targetMinutes || currentMinutes > targetMinutes + 1) continue;
          const sentKey = `at-${userId}-${r.day}-${r.start}`;
          if (reminderSentToday[sentKey] === todayStr) continue;
          const text = `🔔 Напоминание: в ${r.remindAt} — ${subject} (${r.start}${room ? ", " + room : ""})`;
          telegramService.sendTelegramMessage(Number(userId), text).then((ok) => {
            if (ok) reminderSentToday[sentKey] = todayStr;
          });
        }
      }
    }

    const deadlineRemindersByUser = await deadlinesRepo.getAllDeadlineRemindersData();
    const deadlinesList = await deadlinesRepo.getDeadlinesList();
    if (currentMinutes >= REMINDER_DAY_HOUR * 60 && currentMinutes <= REMINDER_DAY_HOUR * 60 + 1 && deadlinesList.length > 0) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (const [userId, prefs] of Object.entries(deadlineRemindersByUser)) {
        const bySubject = prefs && typeof prefs.bySubject === "object" ? prefs.bySubject : {};
        if (Object.keys(bySubject).length === 0) continue;
        for (const d of deadlinesList) {
          const subject = d.subject || "";
          const daysBefore = Array.isArray(bySubject[subject]) ? bySubject[subject] : [];
          if (daysBefore.length === 0) continue;
          const [y, m, day] = (d.date || "").split("-").map(Number);
          if (!y || !m || !day) continue;
          const deadlineDate = new Date(y, m - 1, day);
          const diffMs = deadlineDate - today;
          const diffDays = Math.round(diffMs / 86400000);
          if (diffDays < 0) continue;
          if (!daysBefore.includes(diffDays)) continue;
          const sentKey = `dl-${userId}-${d.id}-${diffDays}`;
          if (reminderSentToday[sentKey] === todayStr) continue;
          const dayLabel =
            diffDays === 1 ? "1 день" : diffDays < 5 ? `${diffDays} дня` : diffDays === 7 ? "1 неделю" : diffDays === 14 ? "2 недели" : `${diffDays} дней`;
          const taskShort = (d.task || "").split(" – ")[0].split(" - ")[0].trim() || d.task;
          const text = `📋 Дедлайн: через ${dayLabel} — ${taskShort} (${subject || "Дедлайн"}), ${String(day).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
          telegramService.sendTelegramMessage(Number(userId), text).then((ok) => {
            if (ok) reminderSentToday[sentKey] = todayStr;
          });
        }
      }
    }

    if (Object.keys(reminderSentToday).length > 500) {
      reminderSentToday = {};
    }
  } catch (err) {
    console.error("runRemindersTick error", err);
  }
}

module.exports = {
  runRemindersTick,
};
