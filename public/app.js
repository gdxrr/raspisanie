const PAIR_TIMES = {
  1: { start: "9:30", end: "11:00" },
  2: { start: "11:10", end: "12:40" },
  3: { start: "13:00", end: "14:30" },
  4: { start: "15:10", end: "16:40" },
  5: { start: "17:00", end: "18:30" },
  6: { start: "18:40", end: "20:10" }
};

function pairNum(start) {
  for (const [n, t] of Object.entries(PAIR_TIMES)) {
    if (t.start === start) return n;
  }
  return "?";
}

function escapeHtml(s) {
  if (s == null || s === "") return "";
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

const defaultSchedule = [
  { id: 1, day: "Понедельник", start: "9:30", end: "11:00", type: "lec", subject: "Безопасность вычислительных сетей", room: "13-16 (Б. Морская 67)", teacher: "Фаткиева Р.Р., доцент, канд. техн. наук", week: "both" },
  { id: 2, day: "Понедельник", start: "11:10", end: "12:40", type: "lab", subject: "Организация ЭВМ и вычислительных систем", room: "52-37 (Б. Морская 67)", teacher: "Криволапчук И.Г., старший преподаватель", week: "both" },
  { id: 3, day: "Понедельник", start: "13:00", end: "14:30", type: "lab", subject: "Организация ЭВМ и вычислительных систем", room: "52-37 (Б. Морская 67)", teacher: "Криволапчук И.Г., старший преподаватель", week: "both" },
  { id: 4, day: "Понедельник", start: "15:10", end: "16:40", type: "lec", subject: "Безопасность систем баз данных", room: "32-03 (Б. Морская 67)", teacher: "Елина Т.Н., доцент, канд. экон. наук", week: "both" },
  { id: 5, day: "Вторник", start: "11:10", end: "12:40", type: "kurs", subject: "Методы и средства криптографической защиты информации", room: "13-15 (Б. Морская 67)", teacher: "Беззатеев С.В., завкафедрой, д-р техн. наук", week: "odd" },
  { id: 6, day: "Вторник", start: "13:00", end: "14:30", type: "lab", subject: "Методы и средства криптографической защиты информации", room: "13-16 (Б. Морская 67)", teacher: "Дакуо Ж.-М.Н., ассистент", week: "odd" },
  { id: 7, day: "Вторник", start: "15:10", end: "16:40", type: "lab", subject: "Методы и средства криптографической защиты информации", room: "52-48 (Б. Морская 67)", teacher: "Дакуо Ж.-М.Н., ассистент", week: "odd" },
  { id: 8, day: "Среда", start: "9:30", end: "11:00", type: "lec", subject: "Методы и средства криптографической защиты информации", room: "53-07 (Б. Морская 67)", teacher: "Давыдов В.В., доцент, канд. техн. наук", week: "both" },
  { id: 9, day: "Среда", start: "11:10", end: "12:40", type: "lec", subject: "Безопасность операционных систем", room: "53-04 (Б. Морская 67)", teacher: "Федоров И.Р., доцент, канд. техн. наук", week: "both" },
  { id: 10, day: "Среда", start: "13:00", end: "14:30", type: "lab", subject: "Безопасность вычислительных сетей", room: "52-48 (Б. Морская 67)", teacher: "Фаткиева Р.Р., доцент, канд. техн. наук", week: "both" },
  { id: 11, day: "Среда", start: "15:10", end: "16:40", type: "lab", subject: "Программно-аппаратные средства защиты информации", room: "52-44 (Б. Морская 67)", teacher: "Букреев Б.А., ассистент", week: "both" },
  { id: 12, day: "Пятница", start: "13:00", end: "14:30", type: "lab", subject: "Безопасность систем баз данных", room: "52-24 (Б. Морская 67)", teacher: "Елина Т.Н., доцент, канд. экон. наук", week: "both" },
  { id: 13, day: "Пятница", start: "17:00", end: "18:30", type: "prac", subject: "Прикладная физическая культура", room: "спортзал (Б. Морская 67)", teacher: "Антипина Ю.В., старший преподаватель", week: "both" },
  { id: 14, day: "Пятница", start: "18:40", end: "20:10", type: "lec", subject: "Открытые информационные системы", room: "52-48 (Б. Морская 67)", teacher: "Фомичева С.Г., профессор, канд. техн. наук", week: "odd" },
  { id: 15, day: "Пятница", start: "18:40", end: "20:10", type: "lec", subject: "Организация ЭВМ и вычислительных систем", room: "21-07 (Б. Морская 67)", teacher: "Криволапчук И.Г., старший преподаватель", week: "even" },
  { id: 16, day: "Суббота", start: "11:10", end: "12:40", type: "lab", subject: "Безопасность операционных систем", room: "52-44 (Б. Морская 67)", teacher: "Федоров И.Р., доцент, канд. техн. наук", week: "both" },
  { id: 17, day: "Суббота", start: "13:00", end: "14:30", type: "lec", subject: "Сети и системы передачи информации", room: "13-15 (Б. Морская 67)", teacher: "Билятдинов К.З., профессор, д-р техн. наук", week: "even" },
  { id: 18, day: "Суббота", start: "15:10", end: "16:40", type: "lab", subject: "Открытые информационные системы", room: "52-44 (Б. Морская 67)", teacher: "Насибов А.Э., ассистент", week: "both" },
  { id: 19, day: "Суббота", start: "17:00", end: "18:30", type: "lec", subject: "Программно-аппаратные средства защиты информации", room: "52-18 (Б. Морская 67)", teacher: "Коломойцев В.С., доцент, канд. техн. наук", week: "both" },
  { id: 20, day: "Суббота", start: "18:40", end: "20:10", type: "lab", subject: "Сети и системы передачи информации", room: "14-28 (Б. Морская 67)", teacher: "Билятдинов К.З., профессор, д-р техн. наук", week: "both" }
];

let schedule = [];
let hiddenPairIds = new Set();
let dimmedPairIds = new Set();
let viewMode = "list";
let scheduleFilter = "all";
let settingsTheme = "dark";
let settingsVuc = true;
let myBirthday = null;
let birthdaysList = [];
let settingsShowBirthdays = true;
let hiddenActionIds = new Set();

const ACTION_MENU_ITEMS = [
  { id: "broadcast", label: "Рассылка группы" },
  { id: "starosta", label: "Написать старосте" },
  { id: "reminders", label: "Напоминания о парах" },
  { id: "deadlines", label: "Дедлайны" },
  { id: "progress", label: "Личный прогресс" },
  { id: "polls", label: "Голосования" },
  { id: "hiddenPairs", label: "Скрытые пары" },
  { id: "settings", label: "Настройки" },
  { id: "likes", label: "Количество лайков" },
  { id: "minigames", label: "Мини-игры" },
  { id: "feedback", label: "Жалобы и предложения" }
];
const GUAP_SSO_URL = "https://sso.guap.ru/realms/master/protocol/openid-connect/auth?state=1a30769364889a2601992596d5162efe&scope=profile%20email&response_type=code&approval_prompt=auto&redirect_uri=https%3A%2F%2Fpro.guap.ru%2Foauth%2Fcallback&client_id=prosuai";
const OIS_SUBJECT = "Открытые информационные системы";
const DEADLINES_LIST = [
  { id: "ois-lr1", subject: OIS_SUBJECT, task: "ЛР1", type: "soft", date: "2026-03-21", workType: "Лабораторная работа" },
  { id: "ois-lr2", subject: OIS_SUBJECT, task: "ЛР2", type: "soft", date: "2026-03-28", workType: "Лабораторная работа" },
  { id: "ois-lr3", subject: OIS_SUBJECT, task: "ЛР3", type: "soft", date: "2026-04-18", workType: "Лабораторная работа" },
  { id: "ois-lr4", subject: OIS_SUBJECT, task: "ЛР4", type: "soft", date: "2026-05-16", workType: "Лабораторная работа" },
  { id: "bos-lr1", subject: "Безопасность операционных систем", task: "ЛР 1 – Механизмы разграничения прав доступа в Linux", type: "soft", date: "2026-03-08", workType: "Лабораторная работа" },
  { id: "bos-lr2", subject: "Безопасность операционных систем", task: "ЛР 2 – SELinux: основы и настройка", type: "soft", date: "2026-03-22", workType: "Лабораторная работа" },
  { id: "bos-lr3", subject: "Безопасность операционных систем", task: "ЛР 3 – Механизмы аутентификации и управления привилегиями в Linux", type: "soft", date: "2026-04-05", workType: "Лабораторная работа" },
  { id: "bos-lr4", subject: "Безопасность операционных систем", task: "ЛР 4 – Сетевой каталог LDAP и Kerberos", type: "soft", date: "2026-04-19", workType: "Лабораторная работа" },
  { id: "bos-lr5", subject: "Безопасность операционных систем", task: "ЛР 5 – Мониторинг событий безопасности с помощью Zabbix", type: "soft", date: "2026-05-10", workType: "Лабораторная работа" },
  { id: "bos-lr6", subject: "Безопасность операционных систем", task: "ЛР 6 – Резервное копирование с использованием BorgBackup", type: "soft", date: "2026-05-24", workType: "Лабораторная работа" },
  { id: "seti-iz1", subject: "Сети и системы передачи информации", task: "Индивидуальное задание № 1", type: "strict", date: "2026-03-30", workType: "Индивидуальное задание" },
  { id: "seti-iz2", subject: "Сети и системы передачи информации", task: "Индивидуальное задание № 2", type: "strict", date: "2026-04-28", workType: "Индивидуальное задание" },
  { id: "crypto-kr", subject: "Методы и средства криптографической защиты информации", task: "Задание к КР", type: "strict", date: "2026-04-14", workType: "Задание к КР" },
  { id: "bvs-lr", subject: "Безопасность вычислительных сетей", task: "Лабораторные работы", type: "soft", date: "2026-04-30", workType: "Лабораторная работа" },
  { id: "pa-lr1", subject: "Программно-аппаратные средства защиты информации", task: "Построение системы антивирусной защиты информации", type: "soft", date: "2026-05-24", workType: "Лабораторная работа" },
  { id: "pa-lr2", subject: "Программно-аппаратные средства защиты информации", task: "Построение системы межсетевого экранирования предприятия", type: "soft", date: "2026-05-24", workType: "Лабораторная работа" },
  { id: "pa-lr3", subject: "Программно-аппаратные средства защиты информации", task: "Построение системы разграничения доступа оконечного узла", type: "soft", date: "2026-05-24", workType: "Лабораторная работа" },
  { id: "pa-lr4", subject: "Программно-аппаратные средства защиты информации", task: "Работа с программными системами криптографической защиты информации", type: "soft", date: "2026-05-24", workType: "Лабораторная работа" }
];
let deadlinesVisibleBySubject = {};
let deadlinesSort = "subject";
let calendarMonth = new Date();

function isDeadlineVisible(d) {
  return deadlinesVisibleBySubject[d.subject] !== false;
}

function getDeadlinesOnDate(year, month1Based, dayOfMonth) {
  const dateStr =
    String(year) +
    "-" +
    String(month1Based).padStart(2, "0") +
    "-" +
    String(dayOfMonth).padStart(2, "0");
  return DEADLINES_LIST.filter((d) => d.date === dateStr && isDeadlineVisible(d));
}

function formatDeadlineDate(dateStr) {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return (d || "") + "." + (m || "") + "." + (y || "");
}

function shortDeadlineTask(task) {
  if (!task || typeof task !== "string") return task;
  const i = task.indexOf(" – ");
  if (i !== -1) return task.slice(0, i).trim();
  const j = task.indexOf(" - ");
  if (j !== -1) return task.slice(0, j).trim();
  return task;
}
let editMode = false;
let editingId = null;
let nextId = 1;

function getApiHeaders(withJson) {
  const headers = {};
  if (withJson) {
    headers["Content-Type"] = "application/json";
  }
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
    headers["X-Telegram-Init-Data"] = window.Telegram.WebApp.initData;
  }
  return headers;
}

async function loadSchedule() {
  try {
    const res = await fetch("/api/schedule", { headers: getApiHeaders(false) });
    if (!res.ok) throw new Error("Failed to load: " + res.status);
    const data = await res.json();
    if (Array.isArray(data)) {
      schedule = data;
    }
  } catch (e) {
    console.error("Failed to load schedule from server, using fallback", e);
    try {
      const local = JSON.parse(localStorage.getItem("schedule_3333") || "null");
      if (Array.isArray(local) && local.length) {
        schedule = local;
      } else {
        schedule = defaultSchedule.slice();
      }
    } catch {
      schedule = defaultSchedule.slice();
    }
  }

  if (!schedule.length) {
    schedule = defaultSchedule.slice();
  }

  nextId = schedule.length ? Math.max(...schedule.map(c => c.id || 0)) + 1 : 1;

  try {
    const res = await fetch("/api/hidden-pairs", { headers: getApiHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        hiddenPairIds = new Set(data);
        dimmedPairIds = new Set();
      } else {
        hiddenPairIds = new Set(data.hiddenIds || []);
        dimmedPairIds = new Set(data.dimmedIds || []);
      }
    }
  } catch (e) {
    console.error("Failed to load hidden pairs", e);
  }

  loadBroadcastStatus();
  loadSettings();
  await loadBirthdays();
  init();
}

async function saveData() {
  try {
    await fetch("/api/schedule", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify(schedule)
    });
  } catch (e) {
    console.error("Failed to save schedule to server", e);
  }

  try {
    localStorage.setItem("schedule_3333", JSON.stringify(schedule));
  } catch (e) {
    console.error("Failed to save schedule to localStorage", e);
  }
}

function getAcademicWeekNum(date) {
  let y = date.getFullYear();
  if (date.getMonth() < 8) y--;
  const sep1 = new Date(y, 8, 1);
  const d1 = sep1.getDay() || 7;
  const mon = new Date(sep1);
  mon.setDate(sep1.getDate() - (d1 - 1));
  return Math.floor((date - mon) / 86400000 / 7) + 1;
}

function getWeekType(date) {
  return getAcademicWeekNum(date) % 2 === 1 ? "odd" : "even";
}

const DAY_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const DAY_NAMES_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const MONTH_NOM = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const LAST_ACADEMIC_WEEK = 39;
/** Фиксированные выходные: [месяц (0–11), день]. 1 мая, 9 мая, 12 июня. */
const FIXED_HOLIDAYS = [[4, 1], [4, 9], [5, 12]];
/** Подписи к праздникам для календаря */
const FIXED_HOLIDAY_LABELS = { "4,1": "1 мая", "4,9": "9 мая", "5,12": "12 июня" };
/** Предпраздничные (сокращённые) дни — пары до 14:30: 30 апреля, 8 мая, 11 июня. */
const PRE_HOLIDAYS = [[3, 30], [4, 8], [5, 11]];
const PRE_HOLIDAY_END_TIME = "14:30";

/** Периоды после учёбы: зачётная неделя, сессия, практика, каникулы. */
function getPeriodAfterTeaching(date) {
  const m = date.getMonth();
  const day = date.getDate();
  if (m === 5 && day >= 1 && day <= 7) return { short: "Зач. нед", cls: "calendar-day-credit-week" };
  if (m === 5 && day >= 8) return { short: "Сессия", cls: "calendar-day-session" };
  if (m === 6 && day <= 5) return { short: "Сессия", cls: "calendar-day-session" };
  if (m === 6 && day >= 6 && day <= 19) return { short: "Практика", cls: "calendar-day-practice" };
  if (m === 6 && day >= 20) return { short: "Каникулы", cls: "calendar-day-vacation" };
  if (m === 7) return { short: "Каникулы", cls: "calendar-day-vacation" };
  return null;
}

function getHolidayLabel(date) {
  const m = date.getMonth();
  const d = date.getDate();
  const key = m + "," + d;
  return FIXED_HOLIDAY_LABELS[key] || "";
}

function getBirthdaysOnDate(month1Based, dayOfMonth) {
  if (!settingsShowBirthdays || !birthdaysList.length) return [];
  return birthdaysList.filter((b) => b.month === month1Based && b.day === dayOfMonth).map((b) => b.name);
}

function isHolidayDate(date) {
  const m = date.getMonth();
  const d = date.getDate();
  return FIXED_HOLIDAYS.some(([mm, dd]) => mm === m && dd === d);
}

function isPreHolidayDate(date) {
  const m = date.getMonth();
  const d = date.getDate();
  return PRE_HOLIDAYS.some(([mm, dd]) => mm === m && dd === d);
}

/** Суббота чётной недели в учебном периоде — выходной (без пар, без точки в календаре). */
function isSaturdayEvenWeekend(date) {
  const dayName = date.getDay() === 0 ? "Воскресенье" : DAY_NAMES[date.getDay() - 1];
  if (dayName !== "Суббота") return false;
  const wNum = getAcademicWeekNum(date);
  if (wNum < 1 || wNum > LAST_ACADEMIC_WEEK) return false;
  return getWeekType(date) === "even";
}

function formatDate(d) {
  return d.getDate() + " " + MONTH_NOM[d.getMonth()];
}

const TYPE_LABELS = {
  lab: "Лабораторная работа",
  lec: "Лекция",
  prac: "Практическая работа",
  kurs: "Курсовая работа"
};

const TYPE_CLASS = {
  lab: "type-lab",
  lec: "type-lec",
  prac: "type-prac",
  kurs: "type-kurs"
};

function init() {
  const now = new Date();
  const wType = getWeekType(now);

  const weekDot = document.getElementById("weekDot");
  const weekLabelPopover = document.getElementById("weekLabelPopover");

  if (weekDot) {
    weekDot.className = "week-dot" + (wType === "even" ? " even" : "");
  }
  if (weekLabelPopover) {
    weekLabelPopover.textContent = (wType === "odd" ? "Нечётная" : "Чётная") + " неделя";
  }

  if (viewMode === "calendar") {
    const cont = document.getElementById("scheduleContainer");
    const cal = document.getElementById("calendarView");
    if (cont) cont.style.display = "none";
    if (cal) cal.style.display = "block";
    renderCalendar();
  } else {
    renderSchedule();
  }
}

function getDayClassesForDate(dayName, weekType) {
  const m = t => {
    const [h, mn] = t.split(":").map(Number);
    return h * 60 + mn;
  };
  return schedule
    .filter(c => c.day === dayName && (c.week === "both" || c.week === weekType))
    .sort((a, b) => m(a.start) - m(b.start));
}

function setScheduleFilter(filter) {
  scheduleFilter = filter;
  document.querySelectorAll(".schedule-filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-filter") === filter);
  });
  renderSchedule();
}

function renderSchedule() {
  const cont = document.getElementById("scheduleContainer");
  const filterStrip = document.getElementById("scheduleFilterStrip");
  if (filterStrip) filterStrip.style.display = viewMode === "list" ? "" : "none";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nowFull = new Date();
  const nowMinutes = nowFull.getHours() * 60 + nowFull.getMinutes();

  if (scheduleFilter === "deadlines") {
    const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    const list = DEADLINES_LIST.filter((d) => d.date >= todayStr && isDeadlineVisible(d)).sort((a, b) => a.date.localeCompare(b.date));
    let html = '<div class="schedule-filter-deadlines-intro">Ближайшие дедлайны</div>';
    if (!list.length) {
      html += '<div class="no-classes"><div class="emoji">✅</div><div class="title">Нет предстоящих дедлайнов</div></div>';
    } else {
      list.forEach((d) => {
        const strict = d.type === "strict" ? "🔒 " : "";
        const dateLabel = formatDeadlineDate(d.date);
        html +=
          '<div class="schedule-filter-deadline-card">' +
          '<span class="schedule-filter-deadline-date">' + escapeHtml(dateLabel) + "</span>" +
          '<span class="schedule-filter-deadline-subject">' + escapeHtml(d.subject) + "</span>" +
          '<span class="schedule-filter-deadline-task">' + strict + escapeHtml(shortDeadlineTask(d.task)) + "</span>" +
          "</div>";
      });
    }
    cont.innerHTML = html;
    if (editMode) cont.classList.add("edit-mode");
    else cont.classList.remove("edit-mode");
    return;
  }

  const dayStart = scheduleFilter === "today" ? 0 : scheduleFilter === "tomorrow" ? 1 : 0;
  const dayEnd = scheduleFilter === "today" ? 1 : scheduleFilter === "tomorrow" ? 2 : 14;

  let html = "";
  let lastWeek = null;

  for (let d = dayStart; d < dayEnd; d++) {
    if (scheduleFilter === "all" && d === 1) {
      html += '<div class="schedule-ad-place"><a href="https://guap.ru" target="_blank" rel="noopener"><img src="/guap-banner.png" alt="Учи Давыдова — ГУАП" class="schedule-ad-banner"></a></div>';
    }
    const day = new Date(today);
    day.setDate(today.getDate() + d);
    const jd = day.getDay();
    const dn = jd === 0 ? "Воскресенье" : DAY_NAMES[jd - 1];
    const wType = getWeekType(day);
    const wNum = getAcademicWeekNum(day);

    if (wNum !== lastWeek) {
      lastWeek = wNum;
      const lbl = wType === "odd" ? "Нечётная" : "Чётная";
      const dc = wType === "odd" ? "wlr-odd" : "wlr-even";
      html +=
        '<div class="week-label-row"><div class="wlr-dot ' +
        dc +
        '"></div>' +
        wNum +
        "-я неделя — " +
        lbl +
        "</div>";
    }

    const isToday = d === 0;
    const classes = getDayClassesForDate(dn, wType).filter(c => !hiddenPairIds.has(c.id));
    const effectiveClasses = dn === "Четверг" && !settingsVuc ? [] : classes;
    const isHoliday = isHolidayDate(day);
    const ds = formatDate(day);

    html +=
      '<div class="day-section"><div class="day-header' +
      (isToday ? " today-header" : "") +
      '"><span class="day-name-text">' +
      dn +
      '</span><span class="day-date">' +
      ds +
      "</span></div>";

    if (settingsShowBirthdays) {
      const dayBirthdays = getBirthdaysOnDate(day.getMonth() + 1, day.getDate());
      if (dayBirthdays.length) {
        html += '<div class="day-birthdays">🎂 День рождения: ' + dayBirthdays.map((n) => escapeHtml(n)).join(", ") + "</div>";
      }
    }

    const dayDeadlinesList = getDeadlinesOnDate(day.getFullYear(), day.getMonth() + 1, day.getDate());
    if (dayDeadlinesList.length) {
      html += '<div class="day-deadlines">📋 Дедлайны: ' + dayDeadlinesList.map((dl) => escapeHtml((dl.type === "strict" ? "🔒 " : "") + shortDeadlineTask(dl.task) + " — " + dl.subject)).join("; ") + "</div>";
    }

    if (!effectiveClasses.length || isHoliday) {
      if (dn === "Воскресенье" || isHoliday) {
        if (isHoliday) {
          const holidayLabel = day.getDate() === 1 && day.getMonth() === 4 ? "1 мая" : "9 мая";
          html +=
            '<div class="no-classes"><div class="emoji">🌴</div><div class="title">Выходной</div><div class="subtitle">' +
            holidayLabel +
            "</div></div>";
        } else {
          html +=
            '<div class="no-classes"><div class="emoji">🌴</div><div class="title">Выходной</div><div class="subtitle">День отдыха</div></div>';
        }
      } else {
        html +=
          '<div class="no-classes"><div class="emoji">📅</div><div class="title">Пар нет</div><div class="subtitle">' +
          (dn === "Четверг" && !settingsVuc ? "Четверг — пар нет (нет ВУЦ)" : "Можно спать спокойно!") +
          "</div></div>";
      }
    } else {
      effectiveClasses.forEach((c, i) => {
        const tl = TYPE_LABELS[c.type] || c.type;
        const tc = TYPE_CLASS[c.type] || "";
        const pn = pairNum(c.start);
        const pairDisplay = (c.day === "Четверг" && c.subject === "ВУЦ") ? "😢" : pn;

        if (isToday) {
          const [sh, sm] = c.start.split(":").map(Number);
          const classStart = sh * 60 + sm;
          const currentTimeStr =
            String(nowFull.getHours()).padStart(2, "0") +
            ":" +
            String(nowFull.getMinutes()).padStart(2, "0");

          if (i === 0 && nowMinutes < classStart) {
            html +=
              '<div class="current-time-marker"><div class="ctm-dot"></div><div class="ctm-time">' +
              currentTimeStr +
              '</div><div class="ctm-line"></div></div>';
          } else if (i > 0) {
            const [ph, pm] = effectiveClasses[i - 1].end.split(":").map(Number);
            if (nowMinutes >= ph * 60 + pm && nowMinutes < classStart) {
              html +=
                '<div class="current-time-marker"><div class="ctm-dot"></div><div class="ctm-time">' +
                currentTimeStr +
                '</div><div class="ctm-line"></div></div>';
            }
          }
        }

        const badge =
          c.week !== "both"
            ? '<span class="week-indicator ' +
              (c.week === "odd" ? "wi-odd" : "wi-even") +
              '">' +
              (c.week === "odd" ? "▲" : "▼") +
              "</span>"
            : "";
        const isDavydov = c.teacher && String(c.teacher).indexOf("Давыдов В.В.") !== -1;
        const cardClick = isDavydov
          ? ' onclick="openSubjectCard(' + c.id + ')" role="button" tabindex="0"'
          : "";
        let cardClass = "class-card" + (isDavydov ? " class-card-clickable" : "");
        if (dimmedPairIds.has(c.id)) cardClass += " class-card-dimmed";

        html +=
          '<div class="' +
          cardClass +
          '" data-id="' +
          c.id +
          '"' +
          cardClick +
          '><div class="time-col"><div class="time-start">' +
          c.start +
          '</div><div class="pair-num">' +
          pairDisplay +
          '</div><div class="time-end">' +
          c.end +
          '</div></div><div class="divider-v"></div><div class="info-col"><div class="class-type ' +
          tc +
          '">' +
          tl +
          '</div><div class="class-name">' +
          c.subject +
          '</div><div class="class-tags"><span class="tag">' +
          c.room +
          '</span><span class="tag">3333</span></div><div class="class-teacher">' +
          c.teacher +
          "</div></div>" +
          badge +
          '<div class="card-actions"><button class="action-btn btn-edit" onclick="event.stopPropagation();openEditModal(' +
          c.id +
          ')">✏️</button><button class="action-btn btn-del" onclick="event.stopPropagation();deleteClass(' +
          c.id +
          ')">🗑️</button></div></div>';
      });
    }

    html += "</div>";
  }

  cont.innerHTML = html;
  if (editMode) {
    cont.classList.add("edit-mode");
  } else {
    cont.classList.remove("edit-mode");
  }
}

function getDaysWithClasses() {
  const set = new Set();
  schedule.forEach((c) => {
    if (c.day) set.add(c.day);
  });
  return set;
}

function toggleCalendarView() {
  viewMode = viewMode === "list" ? "calendar" : "list";
  const cont = document.getElementById("scheduleContainer");
  const cal = document.getElementById("calendarView");
  const btn = document.getElementById("calendarViewBtn");
  const filterStrip = document.getElementById("scheduleFilterStrip");
  if (viewMode === "calendar") {
    if (cont) cont.style.display = "none";
    if (filterStrip) filterStrip.style.display = "none";
    if (cal) cal.style.display = "block";
    if (btn) btn.setAttribute("title", "К списку");
    const bottomBar = document.getElementById("bottomBar");
    if (bottomBar) bottomBar.classList.remove("admin-visible");
    calendarMonth = new Date();
    renderCalendar();
  } else {
    if (cont) cont.style.display = "";
    if (filterStrip) filterStrip.style.display = "";
    if (cal) cal.style.display = "none";
    if (btn) btn.setAttribute("title", "Календарь");
    if (isAdmin) {
      const bottomBar = document.getElementById("bottomBar");
      if (bottomBar) bottomBar.classList.add("admin-visible");
    }
    renderSchedule();
  }
}

function calendarPrevMonth() {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderCalendar();
}

function calendarNextMonth() {
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderCalendar();
}

function renderCalendar() {
  const titleEl = document.getElementById("calendarMonthTitle");
  const gridEl = document.getElementById("calendarGrid");
  if (!gridEl) return;
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  if (titleEl) {
    titleEl.textContent = MONTH_NOM[month] + " " + year;
  }
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDow = first.getDay();
  const monFirst = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = last.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let html = "";
  for (let i = 0; i < 7; i++) {
    html += '<div class="calendar-cell calendar-header">' + DAY_NAMES_SHORT[i] + "</div>";
  }
  let dayCount = 0;
  const totalCells = Math.ceil((monFirst + daysInMonth) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    if (i < monFirst) {
      html += '<div class="calendar-cell calendar-day calendar-day-other"></div>';
      continue;
    }
    dayCount++;
    if (dayCount > daysInMonth) {
      html += '<div class="calendar-cell calendar-day calendar-day-other"></div>';
      continue;
    }
    const d = new Date(year, month, dayCount);
    const wNum = getAcademicWeekNum(d);
    const isTeaching = wNum >= 1 && wNum <= LAST_ACADEMIC_WEEK;
    const isHoliday = isHolidayDate(d);
    const isSatEvenWeekend = isSaturdayEvenWeekend(d);
    const isPreHoliday = isPreHolidayDate(d);
    const period = getPeriodAfterTeaching(d);
    const dayName = d.getDay() === 0 ? "Воскресенье" : DAY_NAMES[d.getDay() - 1];
    const dayClasses = !isHoliday && !isSatEvenWeekend && isTeaching && !(dayName === "Четверг" && !settingsVuc)
      ? getDayClassesForDate(dayName, getWeekType(d)).filter(c => !hiddenPairIds.has(c.id))
      : [];
    const hasClass = dayClasses.some(c => !dimmedPairIds.has(c.id));
    const hasDimmed = dayClasses.some(c => dimmedPairIds.has(c.id));
    const isToday = d.getTime() === today.getTime();
    let cls = "calendar-cell calendar-day";
    if (!isTeaching && !period) cls += " calendar-day-nonteaching";
    if (isHoliday) cls += " calendar-day-holiday";
    if (isPreHoliday && isTeaching) cls += " calendar-day-preholiday";
    if (period) cls += " " + period.cls;
    if (isToday) cls += " calendar-day-today";
    if (hasDimmed) cls += " calendar-day-has-dimmed";
    const dayBirthdays = getBirthdaysOnDate(month + 1, dayCount);
    if (settingsShowBirthdays && dayBirthdays.length) cls += " calendar-day-birthday";
    const dayDeadlines = getDeadlinesOnDate(year, month + 1, dayCount);
    if (dayDeadlines.length) cls += " calendar-day-deadline";
    const weekLabel = isTeaching ? wNum + " нед" : "—";
    let daySubLabel = getHolidayLabel(d);
    if (!daySubLabel && isPreHoliday && isTeaching) daySubLabel = "до 14:30";
    if (!daySubLabel && period) daySubLabel = period.short;
    if (!daySubLabel) daySubLabel = weekLabel;
    let dotHtml = "";
    if (hasClass) dotHtml = '<span class="calendar-dot"></span>';
    else if (hasDimmed) dotHtml = '<span class="calendar-dot calendar-dot-dimmed"></span>';
    if (settingsShowBirthdays && dayBirthdays.length) dotHtml += '<span class="calendar-birthday-icon" title="День рождения: ' + escapeHtml(dayBirthdays.join(", ")) + '">🎂</span>';
    if (dayDeadlines.length) {
      const dlTitle = dayDeadlines.map((dl) => (dl.type === "strict" ? "🔒 " : "") + shortDeadlineTask(dl.task) + " — " + dl.subject).join("\n");
      dotHtml += '<span class="calendar-deadline-icon" title="' + escapeHtml(dlTitle.replace(/\n/g, " | ")) + '">📋</span>';
    }
    html +=
      '<div class="' +
      cls +
      '" data-year="' +
      year +
      '" data-month="' +
      (month + 1) +
      '" data-day="' +
      dayCount +
      '" role="button" tabindex="0" onclick="openCalendarDayModal(' +
      year +
      "," +
      (month + 1) +
      "," +
      dayCount +
      ')">' +
      '<span class="calendar-day-num">' +
      dayCount +
      "</span>" +
      '<span class="calendar-week">' + daySubLabel + "</span>" +
      dotHtml +
      "</div>";
  }
  gridEl.innerHTML = html;
}

function openCalendarDayModal(year, month, dayNum) {
  const d = new Date(year, month - 1, dayNum);
  const dayName = d.getDay() === 0 ? "Воскресенье" : DAY_NAMES[d.getDay() - 1];
  const wType = getWeekType(d);
  const isHoliday = isHolidayDate(d);
  const dayEl = document.getElementById("calendarDayModalDay");
  const dateEl = document.getElementById("calendarDayModalDate");
  const listEl = document.getElementById("calendarDayModalList");
  if (!dayEl || !dateEl || !listEl) return;
  dayEl.textContent = dayName;
  dateEl.textContent = dayNum + " " + MONTH_NOM[month - 1];
  const dayDeadlinesList = getDeadlinesOnDate(year, month, dayNum);
  const deadlinesNote = dayDeadlinesList.length ? '<p class="calendar-day-deadline-note">📋 Дедлайны: ' + dayDeadlinesList.map((dl) => escapeHtml((dl.type === "strict" ? "🔒 " : "") + shortDeadlineTask(dl.task) + " — " + dl.subject)).join("; ") + "</p>" : "";
  if (isHoliday || dayName === "Воскресенье" || isSaturdayEvenWeekend(d)) {
    listEl.innerHTML = '<p class="calendar-day-empty">Выходной</p>' + deadlinesNote;
  } else if (dayName === "Четверг" && !settingsVuc) {
    listEl.innerHTML = '<p class="calendar-day-empty">Четверг — пар нет (нет ВУЦ)</p>' + deadlinesNote;
  } else {
    const birthdayNames = getBirthdaysOnDate(month, dayNum);
    const birthdayNote = settingsShowBirthdays && birthdayNames.length ? '<p class="calendar-day-birthday-note">🎂 Дни рождения: ' + birthdayNames.map((n) => escapeHtml(n)).join(", ") + "</p>" : "";
    let classes = getDayClassesForDate(dayName, wType).filter(c => !hiddenPairIds.has(c.id));
    const isPreHoliday = isPreHolidayDate(d);
    if (isPreHoliday) {
      classes = classes.filter((c) => c.end && String(c.end).localeCompare(PRE_HOLIDAY_END_TIME) <= 0);
    }
    const groupName = (document.getElementById("groupTitle") && document.getElementById("groupTitle").textContent) || "";
    if (!classes.length) {
      listEl.innerHTML =
        birthdayNote +
        deadlinesNote +
        (isPreHoliday
          ? '<p class="calendar-day-preholiday-note">Сокращённый день — пары до 14:30</p><p class="calendar-day-empty">Пар до 14:30 нет</p>'
          : '<p class="calendar-day-empty">Пар нет</p>');
    } else {
      listEl.innerHTML =
        birthdayNote +
        deadlinesNote +
        (isPreHoliday ? '<p class="calendar-day-preholiday-note">Сокращённый день — пары до 14:30</p>' : "") +
        classes
          .map((c, idx) => {
            const pairNum = idx + 1;
            const dimmed = dimmedPairIds.has(c.id);
            const typeLabel = (TYPE_LABELS[c.type] || c.type || "").toUpperCase();
            const typeClass = TYPE_CLASS[c.type] || "";
            const subject = (c.subject || "Пара").trim();
            const room = (c.room || "").trim();
            const teacher = (c.teacher || "").trim();
            return (
              '<div class="calendar-day-card' +
              (dimmed ? " calendar-day-card-dimmed" : "") +
              '">' +
              '<div class="calendar-day-card-time">' +
              '<span class="calendar-day-card-start">' +
              (c.start || "") +
              "</span>" +
              '<span class="calendar-day-card-num">' +
              pairNum +
              "</span>" +
              '<span class="calendar-day-card-end">' +
              (c.end || "") +
              "</span>" +
              "</div>" +
              '<div class="calendar-day-card-body">' +
              '<span class="calendar-day-card-type ' +
              typeClass +
              '">' +
              escapeHtml(typeLabel) +
              "</span>" +
              '<div class="calendar-day-card-subject" title="' +
              escapeHtml(subject) +
              '">' +
              escapeHtml(subject) +
              "</div>" +
              (room || groupName
                ? '<div class="calendar-day-card-tags">' +
                  (room ? '<span class="calendar-day-card-tag">' + escapeHtml(room) + "</span>" : "") +
                  (groupName ? '<span class="calendar-day-card-tag">' + escapeHtml(groupName) + "</span>" : "") +
                  "</div>"
                : "") +
              (teacher
                ? '<div class="calendar-day-card-teacher" title="' +
                  escapeHtml(teacher) +
                  '">' +
                  escapeHtml(teacher) +
                  "</div>"
                : "") +
              "</div></div>"
            );
          })
          .join("");
    }
  }
  document.getElementById("calendarDayModalOverlay").classList.add("open");
}

function closeCalendarDayModal() {
  document.getElementById("calendarDayModalOverlay").classList.remove("open");
}

function openSubjectCard(classId) {
  if (editMode) return;
  const c = schedule.find((x) => x.id === classId);
  if (!c || !c.teacher || String(c.teacher).indexOf("Давыдов В.В.") === -1) return;
  const titleEl = document.getElementById("subjectCardTitle");
  const metaEl = document.getElementById("subjectCardMeta");
  const imgEl = document.getElementById("subjectCardImage");
  if (titleEl) titleEl.textContent = c.subject || "Предмет";
  if (metaEl) metaEl.textContent = c.day + ", " + c.start + " · " + c.teacher;
  if (imgEl) {
    imgEl.src = "davydov-card.png";
    imgEl.alt = c.subject || "";
  }
  document.getElementById("subjectCardOverlay").classList.add("open");
}

function closeSubjectCard() {
  document.getElementById("subjectCardOverlay").classList.remove("open");
}

const ADMIN_PASSWORD = "";
let isAdmin = false;
let tapCount = 0;
let tapTimer = null;

function handleTitleTap() {
  tapCount++;
  const title = document.getElementById("groupTitle");
  const dots = document.getElementById("tapDots");

  title.classList.remove("tapped");
  // force reflow for animation restart
  void title.offsetWidth;
  title.classList.add("tapped");

  if (tapCount === 1) dots.style.display = "flex";
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById("td" + i);
    el.className = "tap-dot" + (i <= tapCount ? " lit" : "");
  }

  clearTimeout(tapTimer);

  if (tapCount >= 5) {
    tapCount = 0;
    setTimeout(() => {
      dots.style.display = "none";
      for (let i = 1; i <= 5; i++) {
        document.getElementById("td" + i).className = "tap-dot";
      }
    }, 300);
    if (isAdmin) {
      if (confirm("Выйти из режима администратора?")) {
        logoutAdmin();
      }
    } else {
      openAuthPopup();
    }
  } else {
    tapTimer = setTimeout(() => {
      tapCount = 0;
      dots.style.display = "none";
      for (let i = 1; i <= 5; i++) {
        document.getElementById("td" + i).className = "tap-dot";
      }
    }, 2000);
  }
}

function openAuthPopup() {
  const input = document.getElementById("authInput");
  const err = document.getElementById("authError");
  input.value = "";
  err.textContent = "";
  input.className = "auth-input";
  document.getElementById("authPopup").classList.add("open");
  setTimeout(() => input.focus(), 300);
}

function closeAuthPopup() {
  document.getElementById("authPopup").classList.remove("open");
}

function toggleAuthEye() {
  const input = document.getElementById("authInput");
  const eye = document.getElementById("authEye");
  input.type = input.type === "password" ? "text" : "password";
  eye.textContent = input.type === "password" ? "👁" : "🙈";
}

function tryAuth() {
  const input = document.getElementById("authInput");
  const err = document.getElementById("authError");
  if (input.value === ADMIN_PASSWORD) {
    isAdmin = true;
    closeAuthPopup();
    document.getElementById("adminBadge").classList.add("visible");
    document.getElementById("bottomBar").classList.add("admin-visible");
    document.body.classList.add("admin-bar-visible");
    showToast("🔓 Режим администратора");
  } else {
    input.classList.add("error");
    err.textContent = "Неверный пароль";
    setTimeout(() => input.classList.remove("error"), 400);
    input.value = "";
  }
}

function logoutAdmin() {
  isAdmin = false;
  editMode = false;
  document.getElementById("adminBadge").classList.remove("visible");
  document.getElementById("bottomBar").classList.remove("admin-visible");
  document.body.classList.remove("admin-bar-visible");
  document.getElementById("editToggleBtn").textContent = "✏️ Редактировать";
  document.getElementById("scheduleContainer").classList.remove("edit-mode");
  showToast("🔒 Вышли из режима администратора");
}

document.getElementById("authPopup").addEventListener("click", function (e) {
  if (e.target === this) closeAuthPopup();
});

function toggleEditMode() {
  if (!isAdmin) return;
  editMode = !editMode;
  document.getElementById("editToggleBtn").textContent = editMode ? "✅ Готово" : "✏️ Редактировать";
  document.getElementById("scheduleContainer").classList.toggle("edit-mode", editMode);
}

function deleteClass(id) {
  if (!isAdmin) return;
  schedule = schedule.filter(c => c.id !== id);
  saveData();
  renderSchedule();
  showToast("Пара удалена 🗑️");
}

let isEditing = false;

function updatePairTime() {
  const t = PAIR_TIMES[document.getElementById("fPair").value];
  document.getElementById("fTimeDisplay").textContent = t.start + " — " + t.end;
}

function openAddModal() {
  if (!isAdmin) return;
  isEditing = false;
  editingId = null;
  document.getElementById("modalTitle").textContent = "Добавить пару";
  document.getElementById("fSubject").value = "";
  document.getElementById("fType").value = "lab";
  document.getElementById("fDay").value = "Понедельник";
  document.getElementById("fPair").value = "1";
  document.getElementById("fRoom").value = "";
  document.getElementById("fTeacher").value = "";
  document.getElementById("fWeek").value = "both";
  updatePairTime();
  document.getElementById("modalOverlay").classList.add("open");
}

function openEditModal(id) {
  if (!isAdmin) return;
  const c = schedule.find(x => x.id === id);
  if (!c) return;
  isEditing = true;
  editingId = id;
  const pn =
    Object.entries(PAIR_TIMES).find(([n, t]) => t.start === c.start)?.[0] || "1";
  document.getElementById("modalTitle").textContent = "Редактировать пару";
  document.getElementById("fSubject").value = c.subject;
  document.getElementById("fType").value = c.type;
  document.getElementById("fDay").value = c.day;
  document.getElementById("fPair").value = pn;
  document.getElementById("fRoom").value = c.room;
  document.getElementById("fTeacher").value = c.teacher;
  document.getElementById("fWeek").value = c.week;
  updatePairTime();
  document.getElementById("modalOverlay").classList.add("open");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

function saveClass() {
  const subj = document.getElementById("fSubject").value.trim();
  if (!subj) {
    alert("Введите название предмета");
    return;
  }
  const times = PAIR_TIMES[document.getElementById("fPair").value];
  const data = {
    subject: subj,
    type: document.getElementById("fType").value,
    day: document.getElementById("fDay").value,
    start: times.start,
    end: times.end,
    room: document.getElementById("fRoom").value.trim() || "Б. Морская 67",
    teacher: document.getElementById("fTeacher").value.trim(),
    week: document.getElementById("fWeek").value
  };

  if (isEditing) {
    const idx = schedule.findIndex(c => c.id === editingId);
    if (idx !== -1) {
      schedule[idx] = { ...schedule[idx], ...data };
    }
    showToast("Пара обновлена ✅");
  } else {
    schedule.push({ id: nextId++, ...data });
    showToast("Пара добавлена ✅");
  }

  saveData();
  closeModal();
  renderSchedule();
}

document.getElementById("modalOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

function openBroadcastModal() {
  if (!isAdmin && !isStarosta) return;
  const textarea = document.getElementById("broadcastText");
  textarea.value = "";
  document.getElementById("broadcastOverlay").classList.add("open");
}

function closeBroadcastModal() {
  document.getElementById("broadcastOverlay").classList.remove("open");
}

async function sendBroadcast() {
  if (!isAdmin && !isStarosta) return;
  const textarea = document.getElementById("broadcastText");
  const text = textarea.value.trim();
  if (!text) {
    alert("Введите текст сообщения");
    return;
  }
  try {
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      showToast("Ошибка рассылки");
    } else {
      const info = await res.json();
      showToast("Отправлено: " + info.sent + "/" + info.total);
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети при рассылке");
  }
  closeBroadcastModal();
}

document.getElementById("broadcastOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeBroadcastModal();
});

let broadcastSubscribed = false;
let isStarosta = false;
let userRole = null;

async function loadBroadcastStatus() {
  try {
    const res = await fetch("/api/broadcast-status", { headers: getApiHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      broadcastSubscribed = !!data.subscribed;
      isStarosta = !!data.isStarosta;
      userRole = data.role || null;
      updateBroadcastSubUI();
      updateStarostaOnlyUI();
      updateRoleBadge();
      showBroadcastOfferIfNeeded();
    }
  } catch (e) {
    console.error("Failed to load broadcast status", e);
  }
}

function updateRoleBadge() {
  const el = document.getElementById("roleBadge");
  if (!el) return;
  const labels = { starosta: "Староста", deputy: "Зам. старосты", debug: "Отладка" };
  if (userRole && labels[userRole]) {
    el.textContent = labels[userRole];
    el.classList.add("visible");
  } else {
    el.textContent = "";
    el.classList.remove("visible");
  }
  const fanEl = document.getElementById("fanLabel");
  if (fanEl) {
    const userId = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user && window.Telegram.WebApp.initDataUnsafe.user.id;
    if (userId === 1948578286 || userId == 1948578286) {
      fanEl.textContent = "Фанат Елиной";
      fanEl.classList.add("visible");
    } else {
      fanEl.textContent = "";
      fanEl.classList.remove("visible");
    }
  }
}

function showBroadcastOfferIfNeeded() {
  if (broadcastSubscribed || isStarosta) return;
  if (sessionStorage.getItem("broadcast_offer_shown")) return;
  const overlay = document.getElementById("broadcastOfferOverlay");
  if (overlay) overlay.classList.add("open");
}

function closeBroadcastOfferModal() {
  sessionStorage.setItem("broadcast_offer_shown", "1");
  document.getElementById("broadcastOfferOverlay").classList.remove("open");
}

async function acceptBroadcastOffer() {
  try {
    const res = await fetch("/api/broadcast-subscribe", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      showToast("Ошибка подписки");
      return;
    }
    broadcastSubscribed = true;
    updateBroadcastSubUI();
    document.getElementById("broadcastOfferOverlay").classList.remove("open");
    showToast("Вы подписаны на рассылку от старосты ✅");
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

function updateStarostaOnlyUI() {
  const writeBtn = document.getElementById("actionWriteToParticipant");
  const broadcastBtn = document.getElementById("actionBroadcastBtn");
  const pollsCreateBtn = document.getElementById("pollsCreateBtn");
  if (writeBtn) writeBtn.style.display = isStarosta ? "" : "none";
  if (broadcastBtn) broadcastBtn.style.display = isStarosta ? "" : "none";
  if (pollsCreateBtn) pollsCreateBtn.style.display = isStarosta ? "" : "none";
}

function updateBroadcastSubUI() {
  const label = document.getElementById("actionsBroadcastLabel");
  const btn = document.getElementById("actionsBroadcastBtn");
  if (!label || !btn) return;
  if (broadcastSubscribed) {
    label.textContent = "Вы подписаны на рассылку";
    btn.textContent = "Отписаться";
    btn.classList.remove("unsub");
  } else {
    label.textContent = "Рассылка группы";
    btn.textContent = "Подписаться";
    btn.classList.add("unsub");
  }
}

function loadSettings() {
  try {
    const t = localStorage.getItem("schedule_theme");
    if (t === "light" || t === "dark" || t === "auto" || t === "guap" || t === "vesna") settingsTheme = t;
    const v = localStorage.getItem("schedule_vuc");
    if (v === "0" || v === "1") settingsVuc = v === "1";
    const sb = localStorage.getItem("schedule_show_birthdays");
    if (sb === "0" || sb === "1") settingsShowBirthdays = sb === "1";
    const ha = JSON.parse(localStorage.getItem("schedule_hidden_actions") || "[]");
    hiddenActionIds = new Set(Array.isArray(ha) ? ha : []);
  } catch (e) {}
  try {
    const dv = JSON.parse(localStorage.getItem("schedule_deadlines_visible") || "{}");
    if (dv && typeof dv === "object") deadlinesVisibleBySubject = dv;
    const ds = localStorage.getItem("schedule_deadlines_sort");
    if (ds === "date" || ds === "subject") deadlinesSort = ds;
  } catch (e) {}
  applyTheme(settingsTheme);
  setupThemeAutoListener();
}

async function loadBirthdays() {
  try {
    const [myRes, listRes] = await Promise.all([
      fetch("/api/birthday", { headers: getApiHeaders(false) }),
      fetch("/api/birthdays", { headers: getApiHeaders(false) })
    ]);
    if (myRes.ok) {
      const b = await myRes.json();
      myBirthday = b.day != null && b.month != null ? { day: b.day, month: b.month } : null;
    }
    if (listRes.ok) {
      birthdaysList = await listRes.json();
      if (!Array.isArray(birthdaysList)) birthdaysList = [];
    }
  } catch (e) {
    console.error("Failed to load birthdays", e);
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "auto") {
    const dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", dark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", theme || "dark");
  }
  const logoEl = document.getElementById("headerThemeLogo");
  if (logoEl) logoEl.classList.toggle("visible", theme === "guap");
}

function setupThemeAutoListener() {
  if (!window.matchMedia) return;
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (settingsTheme === "auto") applyTheme("auto");
  });
}

function openSettingsFromActions() {
  closeActionsModal();
  document.getElementById("settingsTheme").value = settingsTheme;
  document.getElementById("settingsVuc").value = settingsVuc ? "1" : "0";
  document.getElementById("settingsShowBirthdays").value = settingsShowBirthdays ? "1" : "0";
  const dayEl = document.getElementById("settingsBirthdayDay");
  if (dayEl) {
    dayEl.innerHTML = '<option value="">День</option>';
    for (let i = 1; i <= 31; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = String(i);
      if (myBirthday && myBirthday.day === i) opt.selected = true;
      dayEl.appendChild(opt);
    }
  }
  const monthEl = document.getElementById("settingsBirthdayMonth");
  if (monthEl && myBirthday) monthEl.value = String(myBirthday.month);
  else if (monthEl) monthEl.value = "";
  const hiddenActionsEl = document.getElementById("settingsHiddenActions");
  if (hiddenActionsEl) {
    hiddenActionsEl.innerHTML = ACTION_MENU_ITEMS.map(
      (item) =>
        '<label class="settings-action-check"><input type="checkbox" class="settings-action-cb" data-action-id="' +
        item.id +
        '"' +
        (hiddenActionIds.has(item.id) ? " checked" : "") +
        ">" +
        escapeHtml(item.label) +
        "</label>"
    ).join("");
  }
  document.getElementById("settingsOverlay").classList.add("open");
}

function closeSettingsModal() {
  document.getElementById("settingsOverlay").classList.remove("open");
}

function saveSettings() {
  const themeEl = document.getElementById("settingsTheme");
  const vucEl = document.getElementById("settingsVuc");
  const showEl = document.getElementById("settingsShowBirthdays");
  const dayEl = document.getElementById("settingsBirthdayDay");
  const monthEl = document.getElementById("settingsBirthdayMonth");
  if (themeEl) {
    settingsTheme = themeEl.value;
    try { localStorage.setItem("schedule_theme", settingsTheme); } catch (e) {}
    applyTheme(settingsTheme);
  }
  if (vucEl) {
    settingsVuc = vucEl.value === "1";
    try { localStorage.setItem("schedule_vuc", vucEl.value); } catch (e) {}
  }
  if (showEl) {
    settingsShowBirthdays = showEl.value === "1";
    try { localStorage.setItem("schedule_show_birthdays", showEl.value); } catch (e) {}
  }
  const newHidden = [];
  document.querySelectorAll(".settings-action-cb:checked").forEach((cb) => {
    const id = cb.getAttribute("data-action-id");
    if (id) newHidden.push(id);
  });
  hiddenActionIds = new Set(newHidden);
  try { localStorage.setItem("schedule_hidden_actions", JSON.stringify(newHidden)); } catch (e) {}
  const day = dayEl && dayEl.value ? parseInt(dayEl.value, 10) : null;
  const month = monthEl && monthEl.value ? parseInt(monthEl.value, 10) : null;
  const hasBirthday = day != null && month != null && day >= 1 && day <= 31 && month >= 1 && month <= 12;
  (async () => {
    try {
      await fetch("/api/birthday", {
        method: "POST",
        headers: getApiHeaders(true),
        body: JSON.stringify(hasBirthday ? { day, month } : { day: null, month: null })
      });
      myBirthday = hasBirthday ? { day, month } : null;
      await loadBirthdays();
    } catch (e) {
      console.error("Failed to save birthday", e);
    }
    closeSettingsModal();
    renderSchedule();
    if (viewMode === "calendar") renderCalendar();
    showToast("Настройки сохранены");
  })();
}

function openActionsModal() {
  updateBroadcastSubUI();
  updateStarostaOnlyUI();
  document.querySelectorAll(".actions-modal-body [data-action-id]").forEach((el) => {
    const id = el.getAttribute("data-action-id");
    el.style.display = hiddenActionIds.has(id) ? "none" : "";
  });
  document.getElementById("actionsOverlay").classList.add("open");
}

function closeActionsModal() {
  document.getElementById("actionsOverlay").classList.remove("open");
}

function toggleBroadcastSubscriptionFromActions() {
  toggleBroadcastSubscription();
  updateBroadcastSubUI();
}

function openStarostaFromActions() {
  closeActionsModal();
  openStarostaModal();
}

async function openWriteToParticipantFromActions() {
  closeActionsModal();
  await openWriteToParticipantModal();
}

function openBroadcastFromActions() {
  closeActionsModal();
  openBroadcastModal();
}

function openRemindersFromActions() {
  closeActionsModal();
  openRemindersModal();
}

function openDeadlinesFromActions() {
  closeActionsModal();
  openDeadlinesModal();
}

function openProgressFromActions() {
  closeActionsModal();
  openProgressModal();
}

function openPollsFromActions() {
  closeActionsModal();
  openPollsModal();
}

function openGuapLk() {
  if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.openLink === "function") {
    window.Telegram.WebApp.openLink(GUAP_SSO_URL);
  } else {
    window.open(GUAP_SSO_URL, "_blank", "noopener,noreferrer");
  }
}

function toggleWeekLabel() {
  const popover = document.getElementById("weekLabelPopover");
  if (popover) popover.classList.toggle("visible");
}

function openGuapFromActions() {
  closeActionsModal();
  openGuapLk();
}

function openDeadlinesModal() {
  const listEl = document.getElementById("deadlinesList");
  const sortEl = document.getElementById("deadlinesSortSelect");
  if (!listEl) return;
  if (sortEl) sortEl.value = deadlinesSort;
  const typeIcon = (t) => (t === "strict" ? "🔒 " : "");
  const typeLabel = (t) => (t === "strict" ? "Строгий" : "Нестрогий");
  const renderItem = (d, showSubject) => {
    const vis = isDeadlineVisible(d) ? "" : " (скрыт)";
    const taskShort = shortDeadlineTask(d.task);
    return (
      '<div class="deadlines-item' +
      (d.type === "strict" ? " deadline-strict" : "") +
      '">' +
      '<span class="deadlines-item-type" title="' +
      typeLabel(d.type) +
      '">' +
      typeIcon(d.type) +
      "</span>" +
      '<span class="deadlines-item-task">' +
      escapeHtml(taskShort) +
      "</span>" +
      (showSubject ? '<span class="deadlines-item-subject">' + escapeHtml(d.subject) + "</span>" : "") +
      '<span class="deadlines-item-date">' +
      formatDeadlineDate(d.date) +
      "</span>" +
      (vis ? '<span class="deadlines-item-hidden">' + vis + "</span>" : "") +
      "</div>"
    );
  };
  let html = "";
  if (deadlinesSort === "date") {
    const byDate = {};
    DEADLINES_LIST.forEach((d) => {
      if (!byDate[d.date]) byDate[d.date] = [];
      byDate[d.date].push(d);
    });
    Object.keys(byDate)
      .sort()
      .forEach((dateStr) => {
        html += '<div class="deadlines-group"><div class="deadlines-group-title">' + formatDeadlineDate(dateStr) + "</div>";
        byDate[dateStr].sort((a, b) => (a.subject || "").localeCompare(b.subject || ""));
        byDate[dateStr].forEach((d) => (html += renderItem(d, true)));
        html += "</div>";
      });
  } else {
    const grouped = {};
    DEADLINES_LIST.forEach((d) => {
      if (!grouped[d.subject]) grouped[d.subject] = [];
      grouped[d.subject].push(d);
    });
    Object.keys(grouped)
      .sort()
      .forEach((subject) => {
        html += '<div class="deadlines-group"><div class="deadlines-group-title">' + escapeHtml(subject) + "</div>";
        grouped[subject].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        grouped[subject].forEach((d) => (html += renderItem(d, false)));
        html += "</div>";
      });
  }
  listEl.innerHTML = html;
  const subjEl = document.getElementById("deadlinesSubjectToggles");
  if (subjEl) {
    const subjects = [...new Set(DEADLINES_LIST.map((d) => d.subject))];
    subjEl.innerHTML =
      '<span class="deadlines-visibility-label">В календаре и расписании:</span>' +
      subjects
        .map(
          (s) =>
            '<label class="settings-action-check">' +
            '<input type="checkbox" class="deadline-subject-cb" data-subject="' +
            escapeHtml(s).replace(/"/g, "&quot;") +
            '"' +
            (deadlinesVisibleBySubject[s] !== false ? " checked" : "") +
            "> " +
            escapeHtml(s) +
            "</label>"
        )
        .join("");
  }
  document.getElementById("deadlinesOverlay").classList.add("open");
  buildDeadlinesRemindersGrid();
  loadDeadlineRemindersIntoModal();
}

const DEADLINE_REMINDER_OPTIONS = [
  { days: 1, label: "за 1 день" },
  { days: 3, label: "за 3 дня" },
  { days: 7, label: "за 1 неделю" },
  { days: 14, label: "за 2 недели" },
];

function buildDeadlinesRemindersGrid() {
  const container = document.getElementById("deadlinesRemindersOptions");
  if (!container) return;
  const subjects = [...new Set(DEADLINES_LIST.map((d) => d.subject).filter(Boolean))].sort();
  if (subjects.length === 0) {
    container.innerHTML = "<p class=\"deadlines-reminders-empty\">Нет предметов с дедлайнами</p>";
    return;
  }
  let html = "";
  DEADLINE_REMINDER_OPTIONS.forEach((opt) => {
    html += '<div class="deadlines-reminders-row">';
    html += '<span class="deadlines-reminders-row-label">' + escapeHtml(opt.label) + "</span>";
    html += '<div class="deadlines-reminders-row-checks">';
    subjects.forEach((subj) => {
      html +=
        '<label class="settings-action-check">' +
        '<input type="checkbox" class="deadline-reminder-cb" data-days="' +
        opt.days +
        '" data-subject="' +
        escapeHtml(subj).replace(/"/g, "&quot;") +
        '"> ' +
        escapeHtml(subj) +
        "</label>";
    });
    html += "</div></div>";
  });
  container.innerHTML = html;
}

async function loadDeadlineRemindersIntoModal() {
  try {
    const res = await fetch("/api/deadline-reminders", { headers: getApiHeaders(false) });
    const data = await res.json();
    const bySubject = (data.bySubject && typeof data.bySubject === "object") ? data.bySubject : {};
    document.querySelectorAll(".deadline-reminder-cb").forEach((cb) => {
      const days = Number(cb.getAttribute("data-days"));
      const subject = cb.getAttribute("data-subject");
      const arr = bySubject[subject];
      cb.checked = Array.isArray(arr) && Number.isInteger(days) && arr.includes(days);
    });
  } catch (e) {}
}

function closeDeadlinesModal() {
  document.getElementById("deadlinesOverlay").classList.remove("open");
}

let progressData = {};

async function openProgressModal() {
  document.getElementById("progressOverlay").classList.add("open");
  try {
    const res = await fetch("/api/progress", { headers: getApiHeaders(false) });
    progressData = res.ok ? await res.json() : {};
    if (typeof progressData !== "object") progressData = {};
  } catch (e) {
    progressData = {};
  }
  renderProgress();
}

function renderProgress() {
  const summaryEl = document.getElementById("progressSummary");
  const bodyEl = document.getElementById("progressBySubject");
  if (!bodyEl) return;
  const visible = DEADLINES_LIST.filter((d) => isDeadlineVisible(d));
  const bySubject = {};
  visible.forEach((d) => {
    if (!bySubject[d.subject]) bySubject[d.subject] = [];
    bySubject[d.subject].push(d);
  });
  let totalDone = 0;
  let totalAll = 0;
  let html = "";
  const subjects = Object.keys(bySubject).sort();
  subjects.forEach((subject) => {
    const items = bySubject[subject];
    let done = 0;
    items.forEach((d) => {
      totalAll++;
      if (progressData[d.id]) done++;
    });
    totalDone += done;
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    html += '<div class="progress-subject-block">';
    html += '<div class="progress-subject-header">';
    html += '<span class="progress-subject-name">' + escapeHtml(subject) + "</span>";
    html += '<span class="progress-subject-pct">' + done + "/" + items.length + " · " + pct + "%</span>";
    html += "</div>";
    html += '<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="progress-tasks">';
    items.forEach((d) => {
      const checked = progressData[d.id] ? " checked" : "";
      const strict = d.type === "strict" ? "🔒 " : "";
      html +=
        '<label class="progress-task-row">' +
        '<input type="checkbox" class="progress-task-cb" data-id="' +
        escapeHtml(d.id) +
        '"' +
        checked +
        " onchange=\"toggleProgressItem('" +
        escapeHtml(d.id) +
        "')\">" +
        "<span>" +
        strict +
        escapeHtml(shortDeadlineTask(d.task)) +
        " — " +
        formatDeadlineDate(d.date) +
        "</span></label>";
    });
    html += "</div></div>";
  });
  bodyEl.innerHTML = html || "<p class=\"progress-empty\">Нет дедлайнов из раздела «Дедлайны».</p>";
  if (summaryEl) {
    const totalPct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;
    summaryEl.textContent = "Всего: " + totalDone + " из " + totalAll + " (" + totalPct + "%)";
    summaryEl.style.display = totalAll ? "" : "none";
  }
}

async function toggleProgressItem(deadlineId) {
  const cb = document.querySelector('.progress-task-cb[data-id="' + deadlineId + '"]');
  const done = cb ? cb.checked : false;
  progressData[deadlineId] = done;
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ deadlineId, done })
    });
  } catch (e) {
    if (cb) cb.checked = !done;
    progressData[deadlineId] = !done;
    showToast("Не удалось сохранить");
  }
}

function closeProgressModal() {
  document.getElementById("progressOverlay").classList.remove("open");
}

let pollsListData = [];

async function openPollsModal() {
  document.getElementById("pollsOverlay").classList.add("open");
  await loadPolls();
}

async function loadPolls() {
  try {
    const res = await fetch("/api/polls", { headers: getApiHeaders(false) });
    pollsListData = res.ok ? await res.json() : [];
    if (!Array.isArray(pollsListData)) pollsListData = [];
  } catch (e) {
    pollsListData = [];
  }
  renderPolls();
}

function renderPolls() {
  const listEl = document.getElementById("pollsList");
  if (!listEl) return;
  const userId = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user && window.Telegram.WebApp.initDataUnsafe.user.id;
  const uid = userId != null ? String(userId) : "";
  if (pollsListData.length === 0) {
    listEl.innerHTML = "<p class=\"polls-empty\">Пока нет голосований.</p>";
    return;
  }
  listEl.innerHTML = pollsListData
    .map((poll) => {
      const total = poll.options.reduce((s, o) => s + (o.count || 0), 0);
      const myVote = poll.voted && uid && poll.voted[uid] !== undefined ? poll.voted[uid] : -1;
      let optsHtml;
      if (poll.closed) {
        optsHtml = poll.options
          .map(
            (o) =>
              '<div class="polls-option-result">' +
              escapeHtml(o.text) +
              " — <strong>" +
              (o.count || 0) +
              "</strong></div>"
          )
          .join("");
      } else {
        optsHtml = poll.options
          .map(
            (o, i) =>
              '<button type="button" class="polls-option-btn' +
              (myVote === i ? " polls-option-voted" : "") +
              '" onclick="votePoll(\'' +
              poll.id +
              "', " +
              i +
              ')">' +
              escapeHtml(o.text) +
              (total > 0 ? " <span class=\"polls-option-count\">" + (o.count || 0) + "</span>" : "") +
              "</button>"
          )
          .join("");
      }
      return (
        '<div class="polls-card' +
        (poll.closed ? " polls-card-closed" : "") +
        '">' +
        '<div class="polls-question">' +
        escapeHtml(poll.question) +
        "</div>" +
        '<div class="polls-options">' +
        optsHtml +
        "</div>" +
        (isStarosta && !poll.closed
          ? '<button type="button" class="btn-secondary btn-small polls-close-btn" onclick="closePoll(\'' + poll.id + '\')">Закрыть голосование</button>'
          : "") +
        "</div>"
      );
    })
    .join("");
}

async function votePoll(pollId, optionIndex) {
  try {
    const res = await fetch("/api/polls/" + encodeURIComponent(pollId) + "/vote", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ optionIndex })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error === "poll_closed" ? "Голосование закрыто" : "Ошибка");
      return;
    }
    const updated = await res.json();
    const idx = pollsListData.findIndex((p) => p.id === pollId);
    if (idx >= 0) pollsListData[idx] = updated;
    renderPolls();
  } catch (e) {
    showToast("Ошибка сети");
  }
}

async function closePoll(pollId) {
  try {
    await fetch("/api/polls/" + encodeURIComponent(pollId) + "/close", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({})
    });
    const idx = pollsListData.findIndex((p) => p.id === pollId);
    if (idx >= 0) pollsListData[idx].closed = true;
    renderPolls();
  } catch (e) {
    showToast("Ошибка");
  }
}

function closePollsModal() {
  document.getElementById("pollsOverlay").classList.remove("open");
}

function openCreatePollModal() {
  document.getElementById("createPollQuestion").value = "";
  document.getElementById("createPollOptions").value = "";
  document.getElementById("createPollOverlay").classList.add("open");
}

function closeCreatePollModal() {
  document.getElementById("createPollOverlay").classList.remove("open");
}

async function submitCreatePoll() {
  const question = (document.getElementById("createPollQuestion").value || "").trim();
  const raw = document.getElementById("createPollOptions").value || "";
  const options = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!question || options.length < 2) {
    showToast("Введите вопрос и минимум 2 варианта ответа");
    return;
  }
  try {
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ question, options })
    });
    if (!res.ok) {
      showToast("Ошибка создания");
      return;
    }
    closeCreatePollModal();
    await loadPolls();
    showToast("Голосование создано");
  } catch (e) {
    showToast("Ошибка сети");
  }
}

function changeDeadlinesSort() {
  const sortEl = document.getElementById("deadlinesSortSelect");
  if (!sortEl) return;
  deadlinesSort = sortEl.value === "date" ? "date" : "subject";
  try {
    localStorage.setItem("schedule_deadlines_sort", deadlinesSort);
  } catch (e) {}
  const listEl = document.getElementById("deadlinesList");
  if (!listEl) return;
  const typeIcon = (t) => (t === "strict" ? "🔒 " : "");
  const typeLabel = (t) => (t === "strict" ? "Строгий" : "Нестрогий");
  const renderItem = (d, showSubject) => {
    const vis = isDeadlineVisible(d) ? "" : " (скрыт)";
    const taskShort = shortDeadlineTask(d.task);
    return (
      '<div class="deadlines-item' +
      (d.type === "strict" ? " deadline-strict" : "") +
      '">' +
      '<span class="deadlines-item-type" title="' +
      typeLabel(d.type) +
      '">' +
      typeIcon(d.type) +
      "</span>" +
      '<span class="deadlines-item-task">' +
      escapeHtml(taskShort) +
      "</span>" +
      (showSubject ? '<span class="deadlines-item-subject">' + escapeHtml(d.subject) + "</span>" : "") +
      '<span class="deadlines-item-date">' +
      formatDeadlineDate(d.date) +
      "</span>" +
      (vis ? '<span class="deadlines-item-hidden">' + vis + "</span>" : "") +
      "</div>"
    );
  };
  let html = "";
  if (deadlinesSort === "date") {
    const byDate = {};
    DEADLINES_LIST.forEach((d) => {
      if (!byDate[d.date]) byDate[d.date] = [];
      byDate[d.date].push(d);
    });
    Object.keys(byDate)
      .sort()
      .forEach((dateStr) => {
        html += '<div class="deadlines-group"><div class="deadlines-group-title">' + formatDeadlineDate(dateStr) + "</div>";
        byDate[dateStr].sort((a, b) => (a.subject || "").localeCompare(b.subject || ""));
        byDate[dateStr].forEach((d) => (html += renderItem(d, true)));
        html += "</div>";
      });
  } else {
    const grouped = {};
    DEADLINES_LIST.forEach((d) => {
      if (!grouped[d.subject]) grouped[d.subject] = [];
      grouped[d.subject].push(d);
    });
    Object.keys(grouped)
      .sort()
      .forEach((subject) => {
        html += '<div class="deadlines-group"><div class="deadlines-group-title">' + escapeHtml(subject) + "</div>";
        grouped[subject].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        grouped[subject].forEach((d) => (html += renderItem(d, false)));
        html += "</div>";
      });
  }
  listEl.innerHTML = html;
}

function toggleDeadlinesVisibilitySection() {
  const body = document.getElementById("deadlinesVisibilityBody");
  const btn = document.getElementById("deadlinesToggleVisibility");
  if (body) body.style.display = body.style.display === "none" ? "block" : "none";
  if (btn) btn.setAttribute("aria-pressed", body && body.style.display !== "none" ? "true" : "false");
}

function toggleDeadlinesRemindersSection() {
  const body = document.getElementById("deadlinesRemindersBody");
  const btn = document.getElementById("deadlinesToggleReminders");
  if (body) body.style.display = body.style.display === "none" ? "block" : "none";
  if (btn) btn.setAttribute("aria-pressed", body && body.style.display !== "none" ? "true" : "false");
}

function saveDeadlinesVisibility() {
  const bySubject = {};
  document.querySelectorAll(".deadline-subject-cb").forEach((cb) => {
    bySubject[cb.getAttribute("data-subject")] = cb.checked;
  });
  deadlinesVisibleBySubject = bySubject;
  try {
    localStorage.setItem("schedule_deadlines_visible", JSON.stringify(bySubject));
  } catch (e) {}
  renderSchedule();
  if (viewMode === "calendar") renderCalendar();
  showToast("Настройки дедлайнов сохранены");
}

async function saveDeadlineReminders() {
  const subjects = [...new Set(DEADLINES_LIST.map((d) => d.subject).filter(Boolean))];
  const bySubject = {};
  subjects.forEach((s) => (bySubject[s] = []));
  document.querySelectorAll(".deadline-reminder-cb:checked").forEach((cb) => {
    const subject = cb.getAttribute("data-subject");
    const d = Number(cb.getAttribute("data-days"));
    if (subject && bySubject[subject] && Number.isInteger(d)) bySubject[subject].push(d);
  });
  Object.keys(bySubject).forEach((s) => {
    bySubject[s] = [...new Set(bySubject[s])];
    if (bySubject[s].length === 0) delete bySubject[s];
  });
  try {
    const res = await fetch("/api/deadline-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders(false) },
      body: JSON.stringify({ bySubject }),
    });
    if (res.ok) showToast("Напоминания о дедлайнах сохранены");
  } catch (e) {
    showToast("Ошибка сохранения");
  }
}

function openFeedbackFromActions() {
  closeActionsModal();
  openFeedbackModal();
}

function openLikesFromActions() {
  closeActionsModal();
  openLikesModal();
}

function openCasinoFromActions() {
  closeActionsModal();
  openCasinoModal();
}

function openMinigamesFromActions() {
  closeActionsModal();
  document.getElementById("minigamesOverlay").classList.add("open");
}

function closeMinigamesModal() {
  document.getElementById("minigamesOverlay").classList.remove("open");
}

function openBlockBlastFromMinigames() {
  closeMinigamesModal();
  blockBlastRestart();
  document.getElementById("blockBlastOverlay").classList.add("open");
}

function closeBlockBlastModal() {
  document.getElementById("blockBlastOverlay").classList.remove("open");
}

function openCasinoFromMinigames() {
  closeMinigamesModal();
  openCasinoModal();
}

function openBetsFromMinigames() {
  closeMinigamesModal();
  openBetsModal();
}

const QUIZ_QUESTIONS = [
  { q: "Что такое SQL-инъекция?", options: ["Внедрение кода через запросы к БД", "Вид вируса", "Протокол шифрования", "Тип индекса"], correct: 0 },
  { q: "Какой порт по умолчанию у HTTPS?", options: ["80", "443", "8080", "22"], correct: 1 },
  { q: "Что означает ACL в контексте безопасности?", options: ["Access Control List", "Advanced Crypto Logic", "Application Check Layer", "Auto Certificate Loader"], correct: 0 },
  { q: "Что такое SELinux?", options: ["Модуль ядра Linux для разграничения доступа", "Антивирус", "Файловая система", "Сетевой протокол"], correct: 0 },
  { q: "Какой алгоритм симметричного шифрования часто используется в TLS?", options: ["RSA", "AES", "SHA-256", "ECDHE"], correct: 1 },
  { q: "Что такое LDAP?", options: ["Протокол каталогов для аутентификации", "Язык разметки", "СУБД", "Сетевой драйвер"], correct: 0 },
  { q: "Что проверяет целостность данных?", options: ["Шифрование", "Хеш-функция", "Сертификат", "Пароль"], correct: 1 },
  { q: "Что такое межсетевой экран (firewall)?", options: ["Устройство/ПО для фильтрации сетевого трафика", "Сервер БД", "Система резервного копирования", "Монитор"], correct: 0 },
  { q: "Какой протокол используется для безопасной передачи файлов?", options: ["FTP", "SFTP", "HTTP", "Telnet"], correct: 1 },
  { q: "Что такое Kerberos?", options: ["Протокол аутентификации по билетам", "Антивирус", "Файловая система", "Язык программирования"], correct: 0 },
  { q: "Что такое ОС в контексте «безопасность ОС»?", options: ["Операционная система", "Открытый стандарт", "Общая среда", "Онлайн-сервис"], correct: 0 },
  { q: "Какой тип атаки основан на переборе паролей?", options: ["Фишинг", "Brute force", "XSS", "DDoS"], correct: 1 }
];
let quizCurrentIndex = 0;
let quizScore = 0;
let quizOrder = [];
let quizAnswered = false;

function openQuizFromMinigames() {
  closeMinigamesModal();
  quizStart();
  document.getElementById("quizOverlay").classList.add("open");
}

function closeQuizModal() {
  document.getElementById("quizOverlay").classList.remove("open");
}

function quizStart() {
  quizOrder = QUIZ_QUESTIONS.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 5);
  quizCurrentIndex = 0;
  quizScore = 0;
  quizAnswered = false;
  document.getElementById("quizResult").style.display = "none";
  document.getElementById("quizBody").style.display = "block";
  quizRender();
}

function quizRender() {
  const progressEl = document.getElementById("quizProgress");
  const scoreEl = document.getElementById("quizScore");
  const questionEl = document.getElementById("quizQuestion");
  const optionsEl = document.getElementById("quizOptions");
  if (!optionsEl || quizCurrentIndex >= quizOrder.length) {
    quizShowResult();
    return;
  }
  const idx = quizOrder[quizCurrentIndex];
  const item = QUIZ_QUESTIONS[idx];
  if (progressEl) progressEl.textContent = "Вопрос " + (quizCurrentIndex + 1) + " из " + quizOrder.length;
  if (scoreEl) scoreEl.textContent = "Очки: " + quizScore;
  if (questionEl) questionEl.textContent = item.q;
  optionsEl.innerHTML = "";
  item.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option-btn";
    btn.textContent = opt;
    btn.onclick = () => quizAnswer(i);
    optionsEl.appendChild(btn);
  });
}

function quizAnswer(choiceIndex) {
  if (quizAnswered) return;
  quizAnswered = true;
  const idx = quizOrder[quizCurrentIndex];
  const item = QUIZ_QUESTIONS[idx];
  const btns = document.querySelectorAll(".quiz-option-btn");
  const correct = item.correct === choiceIndex;
  if (correct) quizScore += 1;
  btns.forEach((b, i) => {
    b.disabled = true;
    if (i === item.correct) b.classList.add("quiz-option-correct");
    else if (i === choiceIndex && !correct) b.classList.add("quiz-option-wrong");
  });
  setTimeout(() => {
    quizCurrentIndex += 1;
    quizAnswered = false;
    quizRender();
  }, 1200);
}

function quizShowResult() {
  document.getElementById("quizBody").style.display = "none";
  const resultEl = document.getElementById("quizResult");
  resultEl.style.display = "block";
  const total = quizOrder.length;
  const bestKey = "quiz_best_score";
  let best = parseInt(localStorage.getItem(bestKey) || "0", 10);
  if (quizScore > best) {
    best = quizScore;
    localStorage.setItem(bestKey, String(best));
  }
  const titleEl = document.getElementById("quizResultTitle");
  const scoreEl = document.getElementById("quizResultScore");
  const bestEl = document.getElementById("quizResultBest");
  if (titleEl) titleEl.textContent = quizScore === total ? "Отлично! Все верно!" : "Викторина завершена";
  if (scoreEl) scoreEl.textContent = "Правильно: " + quizScore + " из " + total;
  if (bestEl) bestEl.textContent = "Лучший результат: " + best + " из " + total;
}

// --- 2048 ---
const GAME2048_SIZE = 4;
const GAME2048_BEST_KEY = "game2048_best";
let game2048Grid = [];
let game2048Score = 0;
let game2048Over = false;
let game2048FromGrid = null;

function openGame2048FromMinigames() {
  closeMinigamesModal();
  game2048NewGame();
  game2048SetupInput();
  game2048LoadLeaderboard();
  document.getElementById("game2048Overlay").classList.add("open");
  document.body.classList.add("game2048-open");
}

function closeGame2048Modal() {
  document.getElementById("game2048Overlay").classList.remove("open");
  document.body.classList.remove("game2048-open");
}

function game2048Init() {
  game2048Grid = [];
  for (let r = 0; r < GAME2048_SIZE; r++) {
    game2048Grid[r] = [];
    for (let c = 0; c < GAME2048_SIZE; c++) game2048Grid[r][c] = 0;
  }
  game2048Score = 0;
  game2048Over = false;
}

function game2048EmptyCells() {
  const out = [];
  for (let r = 0; r < GAME2048_SIZE; r++)
    for (let c = 0; c < GAME2048_SIZE; c++)
      if (game2048Grid[r][c] === 0) out.push({ r, c });
  return out;
}

function game2048AddRandomTile() {
  const empty = game2048EmptyCells();
  if (empty.length === 0) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  game2048Grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function game2048MergeLine(line) {
  const indices = [];
  const values = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== 0) {
      indices.push(i);
      values.push(line[i]);
    }
  }
  const merged = [];
  const fromIndices = [];
  let i = 0;
  while (i < values.length) {
    if (i + 1 < values.length && values[i] === values[i + 1]) {
      merged.push(values[i] * 2);
      fromIndices.push(indices[i + 1]);
      game2048Score += values[i] * 2;
      i += 2;
    } else {
      merged.push(values[i]);
      fromIndices.push(indices[i]);
      i += 1;
    }
  }
  while (merged.length < GAME2048_SIZE) {
    merged.push(0);
    fromIndices.push(-1);
  }
  return { values: merged, fromIndices };
}

function game2048Move(dir) {
  if (game2048Over) return;
  const prevGrid = game2048Grid.map((row) => row.slice());
  let changed = false;
  game2048FromGrid = [];
  for (let r = 0; r < GAME2048_SIZE; r++) {
    game2048FromGrid[r] = [];
    for (let c = 0; c < GAME2048_SIZE; c++) game2048FromGrid[r][c] = { r, c };
  }
  if (dir === "left") {
    for (let r = 0; r < GAME2048_SIZE; r++) {
      const line = prevGrid[r].slice();
      const { values: merged, fromIndices } = game2048MergeLine(line);
      if (merged.some((v, i) => v !== game2048Grid[r][i])) changed = true;
      game2048Grid[r] = merged;
      for (let c = 0; c < GAME2048_SIZE; c++)
        game2048FromGrid[r][c] = fromIndices[c] >= 0 ? { r, c: fromIndices[c] } : null;
    }
  } else if (dir === "right") {
    for (let r = 0; r < GAME2048_SIZE; r++) {
      const line = prevGrid[r].slice().reverse();
      const { values: merged, fromIndices } = game2048MergeLine(line);
      const revMerged = merged.reverse();
      if (revMerged.some((v, i) => v !== game2048Grid[r][i])) changed = true;
      game2048Grid[r] = revMerged;
      for (let c = 0; c < GAME2048_SIZE; c++) {
        const revPos = GAME2048_SIZE - 1 - c;
        const fi = fromIndices[revPos];
        game2048FromGrid[r][c] = fi >= 0 ? { r, c: GAME2048_SIZE - 1 - fi } : null;
      }
    }
  } else if (dir === "up") {
    for (let c = 0; c < GAME2048_SIZE; c++) {
      const line = [];
      for (let r = 0; r < GAME2048_SIZE; r++) line.push(prevGrid[r][c]);
      const { values: merged, fromIndices } = game2048MergeLine(line);
      for (let r = 0; r < GAME2048_SIZE; r++) {
        if (game2048Grid[r][c] !== merged[r]) changed = true;
        game2048Grid[r][c] = merged[r];
        game2048FromGrid[r][c] = fromIndices[r] >= 0 ? { r: fromIndices[r], c } : null;
      }
    }
  } else if (dir === "down") {
    for (let c = 0; c < GAME2048_SIZE; c++) {
      const line = [];
      for (let r = GAME2048_SIZE - 1; r >= 0; r--) line.push(prevGrid[r][c]);
      const { values: merged, fromIndices } = game2048MergeLine(line);
      const revMerged = merged.reverse();
      const revFrom = fromIndices.reverse().map((fi) => (fi >= 0 ? GAME2048_SIZE - 1 - fi : -1));
      for (let r = 0; r < GAME2048_SIZE; r++) {
        if (game2048Grid[r][c] !== revMerged[r]) changed = true;
        game2048Grid[r][c] = revMerged[r];
        game2048FromGrid[r][c] = revFrom[r] >= 0 ? { r: revFrom[r], c } : null;
      }
    }
  }
  if (changed) {
    game2048AddRandomTile();
    const best = Math.max(game2048Score, parseInt(localStorage.getItem(GAME2048_BEST_KEY) || "0", 10));
    localStorage.setItem(GAME2048_BEST_KEY, String(best));
  } else {
    game2048FromGrid = null;
  }
  game2048CheckOver();
  game2048Render();
}

function game2048CanMove() {
  for (let r = 0; r < GAME2048_SIZE; r++) {
    for (let c = 0; c < GAME2048_SIZE; c++) {
      if (game2048Grid[r][c] === 0) return true;
      if (c + 1 < GAME2048_SIZE && game2048Grid[r][c] === game2048Grid[r][c + 1]) return true;
      if (r + 1 < GAME2048_SIZE && game2048Grid[r][c] === game2048Grid[r + 1][c]) return true;
    }
  }
  return false;
}

function game2048CheckOver() {
  if (game2048EmptyCells().length > 0) return;
  if (!game2048CanMove()) {
    game2048Over = true;
    game2048SubmitScore();
  }
}

function game2048Render() {
  const gridEl = document.getElementById("game2048Grid");
  const scoreEl = document.getElementById("game2048Score");
  const bestEl = document.getElementById("game2048Best");
  const overEl = document.getElementById("game2048Over");
  if (!gridEl) return;
  if (scoreEl) scoreEl.textContent = game2048Score;
  if (bestEl) bestEl.textContent = localStorage.getItem(GAME2048_BEST_KEY) || "0";
  if (overEl) overEl.style.display = game2048Over ? "block" : "none";
  gridEl.innerHTML = "";
  for (let r = 0; r < GAME2048_SIZE; r++) {
    for (let c = 0; c < GAME2048_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "game2048-cell";
      const val = game2048Grid[r][c];
      if (val > 0) {
        const tile = document.createElement("div");
        tile.className = "game2048-tile game2048-tile-" + Math.min(val, 2048);
        tile.textContent = val;
        cell.appendChild(tile);
      }
      gridEl.appendChild(cell);
    }
  }
}

function game2048NewGame() {
  game2048Init();
  game2048AddRandomTile();
  game2048AddRandomTile();
  game2048Render();
}

let game2048Leaderboard = [];

async function game2048LoadLeaderboard() {
  try {
    const res = await fetch("/api/game2048-leaderboard");
    game2048Leaderboard = res.ok ? await res.json() : [];
    if (!Array.isArray(game2048Leaderboard)) game2048Leaderboard = [];
    game2048RenderLeaderboard();
  } catch (e) {
    game2048Leaderboard = [];
    game2048RenderLeaderboard();
  }
}

function game2048RenderLeaderboard() {
  const listEl = document.getElementById("game2048LeaderboardList");
  if (!listEl) return;
  if (game2048Leaderboard.length === 0) {
    listEl.innerHTML = "<p class=\"game2048-leaderboard-empty\">Пока никого нет. Сыграйте и попадите в топ!</p>";
    return;
  }
  listEl.innerHTML =
    "<ol class=\"game2048-leaderboard-ol\">" +
    game2048Leaderboard
      .map(
        (e, i) =>
          "<li class=\"game2048-leaderboard-li\"><span class=\"game2048-lb-rank\">" +
          (i + 1) +
          "</span><span class=\"game2048-lb-name\">" +
          escapeHtml(e.name || "Игрок") +
          "</span><span class=\"game2048-lb-score\">" +
          e.score +
          "</span></li>"
      )
      .join("") +
    "</ol>";
}

function game2048ToggleLeaderboard() {
  const listEl = document.getElementById("game2048LeaderboardList");
  if (!listEl) return;
  const visible = listEl.style.display !== "none";
  listEl.style.display = visible ? "none" : "block";
  if (!visible) game2048LoadLeaderboard();
}

async function game2048SubmitScore() {
  if (game2048Score <= 0) return;
  try {
    const name =
      (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user && window.Telegram.WebApp.initDataUnsafe.user.first_name) ||
      "Игрок";
    await fetch("/api/game2048-leaderboard", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ score: game2048Score, name })
    });
    game2048LoadLeaderboard();
  } catch (e) {
    console.error(e);
  }
}

function game2048SetupInput() {
  const overlay = document.getElementById("game2048Overlay");
  if (!overlay || overlay._game2048Input) return;
  overlay._game2048Input = true;
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) === -1) return;
    e.preventDefault();
    const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
    game2048Move(map[e.key]);
  });
  let touchStartX = 0, touchStartY = 0;
  overlay.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  overlay.addEventListener("touchmove", (e) => {
    if (overlay.classList.contains("open")) e.preventDefault();
  }, { passive: false });
  overlay.addEventListener("touchend", (e) => {
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const min = 30;
    if (Math.abs(dx) >= min || Math.abs(dy) >= min) {
      if (Math.abs(dx) > Math.abs(dy)) game2048Move(dx > 0 ? "right" : "left");
      else game2048Move(dy > 0 ? "down" : "up");
    }
  }, { passive: true });
}

function openBetsFromActions() {
  closeActionsModal();
  openBetsModal();
}

async function sendLike() {
  const btn = document.getElementById("likeBtn");
  if (btn) {
    btn.classList.add("just-liked");
    setTimeout(() => btn.classList.remove("just-liked"), 200);
  }
  try {
    await fetch("/api/like", { method: "POST" });
  } catch (e) {
    console.error(e);
  }
}

async function openLikesModal() {
  const el = document.getElementById("likesCountDisplay");
  if (el) el.textContent = "…";
  document.getElementById("likesOverlay").classList.add("open");
  try {
    const res = await fetch("/api/likes");
    const data = res.ok ? await res.json() : {};
    if (el) el.textContent = String(data.count != null ? data.count : "—");
  } catch (e) {
    console.error(e);
    if (el) el.textContent = "—";
  }
}

function closeLikesModal() {
  document.getElementById("likesOverlay").classList.remove("open");
}

document.getElementById("likesOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeLikesModal();
});

const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "💎", "7️⃣", "🎰"];
const SLOT_SYMBOL_HEIGHT = 72;
const SLOT_SPIN_SYMBOLS_COUNT = 22;

function buildReelStrip(finalSymbol) {
  const arr = [];
  for (let i = 0; i < SLOT_SPIN_SYMBOLS_COUNT - 1; i++) {
    arr.push(pickRandomSymbol());
  }
  arr.push(finalSymbol);
  return arr;
}

function openCasinoModal() {
  const strip1 = document.getElementById("slotStrip1");
  const strip2 = document.getElementById("slotStrip2");
  const strip3 = document.getElementById("slotStrip3");
  const resultEl = document.getElementById("casinoResult");
  const spinBtn = document.getElementById("casinoSpinBtn");
  [strip1, strip2, strip3].forEach((s) => {
    if (!s) return;
    s.style.transition = "none";
    s.style.transform = "translateY(0)";
    s.innerHTML = '<div class="slot-symbol">' + SLOT_SYMBOLS[0] + "</div>";
  });
  if (resultEl) { resultEl.textContent = ""; resultEl.className = "casino-result"; }
  if (spinBtn) spinBtn.disabled = false;
  document.getElementById("casinoOverlay").classList.add("open");
}

function closeCasinoModal() {
  document.getElementById("casinoOverlay").classList.remove("open");
}

function pickRandomSymbol() {
  return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
}

function setReelStrip(stripEl, symbols) {
  if (!stripEl) return;
  stripEl.innerHTML = symbols.map((sym) => '<div class="slot-symbol">' + sym + "</div>").join("");
}

function spinSlots() {
  const strip1 = document.getElementById("slotStrip1");
  const strip2 = document.getElementById("slotStrip2");
  const strip3 = document.getElementById("slotStrip3");
  const resultEl = document.getElementById("casinoResult");
  const spinBtn = document.getElementById("casinoSpinBtn");
  if (!strip1 || !strip2 || !strip3 || !resultEl || !spinBtn || spinBtn.disabled) return;
  spinBtn.disabled = true;
  if (resultEl) { resultEl.textContent = ""; resultEl.className = "casino-result"; }

  const s1 = pickRandomSymbol();
  const s2 = pickRandomSymbol();
  const s3 = pickRandomSymbol();
  setReelStrip(strip1, buildReelStrip(s1));
  setReelStrip(strip2, buildReelStrip(s2));
  setReelStrip(strip3, buildReelStrip(s3));

  const endY = -(SLOT_SPIN_SYMBOLS_COUNT - 1) * SLOT_SYMBOL_HEIGHT;
  [strip1, strip2, strip3].forEach((s) => {
    s.classList.remove("spin");
    s.style.transition = "none";
    s.style.transform = "translateY(0)";
  });
  strip1.offsetHeight;
  strip2.offsetHeight;
  strip3.offsetHeight;
  [strip1, strip2, strip3].forEach((s, i) => {
    s.classList.add("spin");
    const delay = i * 120;
    s.style.transition = `transform 1.4s cubic-bezier(.2,.8,.2,1) ${delay}ms`;
    requestAnimationFrame(() => {
      s.style.transform = "translateY(" + endY + "px)";
    });
  });

  const totalDuration = 1400 + 240;
  setTimeout(() => {
    [strip1, strip2, strip3].forEach((s) => {
      s.classList.remove("spin");
      s.style.transition = "none";
      s.style.transform = "translateY(" + endY + "px)";
    });
    spinBtn.disabled = false;
    if (s1 === s2 && s2 === s3) {
      resultEl.textContent = s1 === "🎰" ? "🎉 ДЖЕКПОТ! 🎉" : "Три одинаковых!";
      resultEl.classList.add(s1 === "🎰" ? "jackpot" : "win");
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      resultEl.textContent = "Два одинаковых!";
      resultEl.classList.add("win");
    } else {
      resultEl.textContent = "Повезёт в следующий раз!";
    }
  }, totalDuration);
}

document.getElementById("casinoOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeCasinoModal();
});

// --- Block Blast (аналог) ---
const BLOCK_BLAST_SIZE = 9;
const BLOCK_BLAST_PIECES = [
  [[1]],
  [[1, 1]],
  [[1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1], [1, 0]],
  [[1, 1], [0, 1]],
  [[1, 0], [1], [1]],
  [[0, 1], [1], [1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1], [1, 1], [1, 0]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1], [1], [1], [1]],
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1], [1, 0], [1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1], [1, 1], [1, 1]]
];
let blockBlastGrid = [];
let blockBlastPieces = [];
let blockBlastScore = 0;
let blockBlastSelectedPieceIndex = -1;
let blockBlastGameOver = false;
let blockBlastDraggedPieceIndex = -1;
let blockBlastTouchPlaced = false;

function blockBlastInitGrid() {
  blockBlastGrid = [];
  for (let r = 0; r < BLOCK_BLAST_SIZE; r++) {
    blockBlastGrid[r] = [];
    for (let c = 0; c < BLOCK_BLAST_SIZE; c++) blockBlastGrid[r][c] = 0;
  }
}

function blockBlastGetRandomPieces(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(BLOCK_BLAST_PIECES[Math.floor(Math.random() * BLOCK_BLAST_PIECES.length)]);
  }
  return out;
}

function blockBlastCanPlace(piece, row, col) {
  const h = piece.length;
  const w = piece[0].length;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!piece[r][c]) continue;
      const nr = row + r;
      const nc = col + c;
      if (nr < 0 || nr >= BLOCK_BLAST_SIZE || nc < 0 || nc >= BLOCK_BLAST_SIZE) return false;
      if (blockBlastGrid[nr][nc]) return false;
    }
  }
  return true;
}

function blockBlastPlace(piece, row, col) {
  const h = piece.length;
  const w = piece[0].length;
  let cells = 0;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (piece[r][c]) {
        blockBlastGrid[row + r][col + c] = 1;
        cells++;
      }
    }
  }
  blockBlastScore += cells;
  blockBlastClearLines();
  blockBlastPieces.splice(blockBlastSelectedPieceIndex, 1);
  blockBlastSelectedPieceIndex = -1;
  if (blockBlastPieces.length === 0) blockBlastPieces = blockBlastGetRandomPieces(3);
  blockBlastRender();
}

function blockBlastClearLines() {
  let cleared = 0;
  for (let r = 0; r < BLOCK_BLAST_SIZE; r++) {
    if (blockBlastGrid[r].every((v) => v === 1)) {
      blockBlastGrid[r].fill(0);
      cleared++;
    }
  }
  for (let c = 0; c < BLOCK_BLAST_SIZE; c++) {
    let full = true;
    for (let r = 0; r < BLOCK_BLAST_SIZE; r++) if (!blockBlastGrid[r][c]) full = false;
    if (full) {
      for (let r = 0; r < BLOCK_BLAST_SIZE; r++) blockBlastGrid[r][c] = 0;
      cleared++;
    }
  }
  if (cleared > 0) blockBlastScore += cleared * BLOCK_BLAST_SIZE * 2;
}

function blockBlastCanPlaceAny() {
  for (let i = 0; i < blockBlastPieces.length; i++) {
    const piece = blockBlastPieces[i];
    for (let r = 0; r <= BLOCK_BLAST_SIZE - piece.length; r++) {
      for (let c = 0; c <= BLOCK_BLAST_SIZE - piece[0].length; c++) {
        if (blockBlastCanPlace(piece, r, c)) return true;
      }
    }
  }
  return false;
}

function blockBlastRender() {
  const gridEl = document.getElementById("blockBlastGrid");
  const piecesEl = document.getElementById("blockBlastPieces");
  const scoreEl = document.getElementById("blockBlastScore");
  const statusEl = document.getElementById("blockBlastStatus");
  const restartBtn = document.getElementById("blockBlastRestartBtn");
  if (!gridEl || !piecesEl) return;
  if (scoreEl) scoreEl.textContent = blockBlastScore;
  gridEl.innerHTML = "";
  gridEl.style.pointerEvents = blockBlastGameOver ? "none" : "";
  for (let r = 0; r < BLOCK_BLAST_SIZE; r++) {
    for (let c = 0; c < BLOCK_BLAST_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "blockblast-cell" + (blockBlastGrid[r][c] ? " filled" : "");
      cell.dataset.row = r;
      cell.dataset.col = c;
      gridEl.appendChild(cell);
    }
  }
  if (!gridEl._blockBlastDelegate) {
    gridEl._blockBlastDelegate = true;
    gridEl.addEventListener("click", (e) => {
      const cell = e.target.closest(".blockblast-cell");
      if (cell && cell.dataset.row != null) blockBlastOnCellClick({ currentTarget: cell });
    });
    gridEl.addEventListener("dragenter", (e) => {
      e.preventDefault();
      if (blockBlastGameOver) return;
      if (e.target.closest(".blockblast-cell")) gridEl.classList.add("blockblast-grid-drag-over");
    });
    gridEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (blockBlastGameOver) return;
      e.dataTransfer.dropEffect = "copy";
    });
    gridEl.addEventListener("dragleave", (e) => {
      if (!gridEl.contains(e.relatedTarget)) gridEl.classList.remove("blockblast-grid-drag-over");
    });
    gridEl.addEventListener("drop", (e) => {
      e.preventDefault();
      if (blockBlastGameOver) return;
      const cell = e.target.closest(".blockblast-cell");
      if (!cell || cell.classList.contains("filled")) return;
      const row = parseInt(cell.dataset.row, 10);
      const col = parseInt(cell.dataset.col, 10);
      const idx = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (isNaN(idx) || idx < 0 || idx >= blockBlastPieces.length) return;
      const piece = blockBlastPieces[idx];
      if (!blockBlastCanPlace(piece, row, col)) return;
      blockBlastSelectedPieceIndex = idx;
      blockBlastPlace(piece, row, col);
      if (!blockBlastCanPlaceAny()) {
        blockBlastGameOver = true;
      }
      blockBlastDraggedPieceIndex = -1;
      gridEl.classList.remove("blockblast-grid-drag-over");
      blockBlastRender();
    });
  }
  piecesEl.innerHTML = "";
  blockBlastPieces.forEach((piece, idx) => {
    const wrap = document.createElement("div");
    wrap.role = "button";
    wrap.tabIndex = 0;
    wrap.className = "blockblast-piece-wrap" + (blockBlastSelectedPieceIndex === idx ? " selected" : "");
    wrap.innerHTML = blockBlastPieceToHtml(piece);
    wrap.dataset.pieceIndex = String(idx);
    let pointerMoved = false;
    wrap.addEventListener("click", (e) => {
      if (blockBlastGameOver) return;
      if (blockBlastTouchPlaced || pointerMoved) {
        blockBlastTouchPlaced = false;
        pointerMoved = false;
        return;
      }
      e.preventDefault();
      blockBlastSelectedPieceIndex = blockBlastSelectedPieceIndex === idx ? -1 : idx;
      blockBlastRender();
    });
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        wrap.click();
      }
    });
    wrap.addEventListener("pointerdown", (e) => {
      if (blockBlastGameOver || (e.pointerType === "mouse" && e.button !== 0)) return;
      e.preventDefault();
      pointerMoved = false;
      const ghost = blockBlastCreateGhost(piece);
      document.body.appendChild(ghost);
      ghost.style.left = e.clientX + "px";
      ghost.style.top = e.clientY + "px";
      wrap.classList.add("blockblast-dragging");
      if (wrap.setPointerCapture) wrap.setPointerCapture(e.pointerId);
      const onMove = (e2) => {
        pointerMoved = true;
        ghost.style.left = e2.clientX + "px";
        ghost.style.top = e2.clientY + "px";
        const el = document.elementFromPoint(e2.clientX, e2.clientY);
        if (gridEl && el && gridEl.contains(el)) gridEl.classList.add("blockblast-grid-drag-over");
        else gridEl.classList.remove("blockblast-grid-drag-over");
      };
      const onUp = (e2) => {
        wrap.classList.remove("blockblast-dragging");
        gridEl.classList.remove("blockblast-grid-drag-over");
        if (wrap.releasePointerCapture) wrap.releasePointerCapture(e2.pointerId);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        ghost.remove();
        const el = document.elementFromPoint(e2.clientX, e2.clientY);
        const cell = el && el.closest(".blockblast-cell");
        if (cell && !cell.classList.contains("filled")) {
          const row = parseInt(cell.dataset.row, 10);
          const col = parseInt(cell.dataset.col, 10);
          if (blockBlastCanPlace(piece, row, col)) {
            blockBlastSelectedPieceIndex = idx;
            blockBlastPlace(piece, row, col);
            if (!blockBlastCanPlaceAny()) blockBlastGameOver = true;
            blockBlastTouchPlaced = true;
            blockBlastRender();
            return;
          }
        }
        if (pointerMoved) blockBlastTouchPlaced = true;
        blockBlastRender();
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    });
    piecesEl.appendChild(wrap);
  });
  if (blockBlastGameOver) {
    if (statusEl) {
      statusEl.textContent = "Игра окончена! Очки: " + blockBlastScore;
      statusEl.classList.add("game-over");
    }
    if (restartBtn) restartBtn.style.display = "";
  } else {
    if (statusEl) {
      statusEl.textContent = "Перетащите фигуру на сетку или выберите и нажмите на клетку";
      statusEl.classList.remove("game-over");
    }
    if (restartBtn) restartBtn.style.display = "none";
  }
}

function blockBlastCreateGhost(piece) {
  const ghost = document.createElement("div");
  ghost.className = "blockblast-ghost";
  ghost.innerHTML = blockBlastPieceToHtml(piece);
  ghost.style.left = "0";
  ghost.style.top = "0";
  return ghost;
}

function blockBlastPieceToHtml(piece) {
  const h = piece.length;
  const w = piece[0].length;
  let html = '<div class="blockblast-piece-preview" style="grid-template-rows:repeat(' + h + ',1fr);grid-template-columns:repeat(' + w + ',1fr);">';
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      html += '<span class="' + (piece[r][c] ? "on" : "off") + '"></span>';
        }
  }
  html += "</div>";
  return html;
}

function blockBlastOnCellClick(e) {
  if (blockBlastSelectedPieceIndex < 0 || blockBlastGameOver) return;
  const row = parseInt(e.currentTarget.dataset.row, 10);
  const col = parseInt(e.currentTarget.dataset.col, 10);
  const piece = blockBlastPieces[blockBlastSelectedPieceIndex];
  if (!blockBlastCanPlace(piece, row, col)) return;
  blockBlastPlace(piece, row, col);
  if (!blockBlastCanPlaceAny()) {
    blockBlastGameOver = true;
    blockBlastRender();
  }
}

function blockBlastRestart() {
  blockBlastInitGrid();
  blockBlastPieces = blockBlastGetRandomPieces(3);
  blockBlastScore = 0;
  blockBlastSelectedPieceIndex = -1;
  blockBlastGameOver = false;
  blockBlastTouchPlaced = false;
  blockBlastRender();
}

const GROUP_SIZE_BETS = 28;

async function openBetsModal() {
  const listEl = document.getElementById("betsList");
  if (!listEl) return;
  listEl.innerHTML = "<p class=\"reminders-loading\">Загрузка...</p>";
  document.getElementById("betsOverlay").classList.add("open");
  let myBets = {};
  let aggregates = {};
  try {
    const res = await fetch("/api/bets", { headers: getApiHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      myBets = data.myBets || {};
      aggregates = data.aggregates || {};
    }
  } catch (e) {
    console.error(e);
  }
  const dayOrder = { Понедельник: 1, Вторник: 2, Среда: 3, Четверг: 4, Пятница: 5, Суббота: 6, Воскресенье: 7 };
  const sorted = schedule.slice().sort((a, b) => {
    const d = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
    if (d !== 0) return d;
    return (a.start || "").localeCompare(b.start || "");
  });
  listEl.innerHTML = sorted
    .map(
      (c) => {
        const id = c.id;
        const key = String(id);
        const myVal = myBets[key];
        const agg = aggregates[key];
        const aggText = agg ? `Средний прогноз: ${agg.avg}, ставок: ${agg.count}` : "Ставок пока нет";
        return (
          '<div class="bet-row" data-id="' +
          id +
          '">' +
          '<div class="bet-row-info">' +
          '<div class="bet-row-title">' +
          (c.subject || "Пара") +
          "</div>" +
          '<div class="bet-row-meta">' +
          c.day +
          ", " +
          c.start +
          (c.week !== "both" ? " (" + (c.week === "odd" ? "нечёт" : "чёт") + ")" : "") +
          "</div>" +
          '<div class="bet-row-stats">' +
          aggText +
          "</div></div>" +
          '<div class="bet-row-input">' +
          '<input type="number" min="0" max="' +
          GROUP_SIZE_BETS +
          '" value="' +
          (myVal !== undefined ? myVal : "") +
          '" placeholder="0–' +
          GROUP_SIZE_BETS +
          '" id="betInput' +
          id +
          '">' +
          '<button type="button" class="bet-save" onclick="saveBet(' +
          id +
          ')">Сохранить</button></div></div>'
        );
      }
    )
    .join("");
}

function closeBetsModal() {
  document.getElementById("betsOverlay").classList.remove("open");
}

async function saveBet(scheduleId) {
  const input = document.getElementById("betInput" + scheduleId);
  if (!input) return;
  let count = input.value.trim() === "" ? null : parseInt(input.value, 10);
  if (count != null && (isNaN(count) || count < 0 || count > GROUP_SIZE_BETS)) {
    showToast("Введите число от 0 до " + GROUP_SIZE_BETS);
    return;
  }
  if (count != null) count = Math.max(0, Math.min(GROUP_SIZE_BETS, count));
  try {
    const res = await fetch("/api/bet", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ scheduleId, count }),
    });
    if (!res.ok) {
      showToast("Ошибка сохранения");
      return;
    }
    showToast("Ставка сохранена");
    const row = document.querySelector('.bet-row[data-id="' + scheduleId + '"]');
    if (row) {
      const statsEl = row.querySelector(".bet-row-stats");
      const data = await res.json();
      if (statsEl && data.aggregate) {
        statsEl.textContent = `Средний прогноз: ${data.aggregate.avg}, ставок: ${data.aggregate.count}`;
      }
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

document.getElementById("betsOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeBetsModal();
});

document.getElementById("subjectCardOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeSubjectCard();
});

document.getElementById("calendarDayModalOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeCalendarDayModal();
});

document.getElementById("deadlinesOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeDeadlinesModal();
});

function openHiddenPairsFromActions() {
  closeActionsModal();
  openHiddenPairsModal();
}

function openHiddenPairsModal() {
  const listEl = document.getElementById("hiddenPairsList");
  if (!listEl) return;
  const dayOrder = { Понедельник: 1, Вторник: 2, Среда: 3, Четверг: 4, Пятница: 5, Суббота: 6, Воскресенье: 7 };
  const sorted = schedule.slice().sort((a, b) => {
    const d = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
    if (d !== 0) return d;
    return (a.start || "").localeCompare(b.start || "");
  });
  listEl.innerHTML = sorted
    .map(
      (c) => {
        let mode = "show";
        if (hiddenPairIds.has(c.id)) mode = "hidden";
        else if (dimmedPairIds.has(c.id)) mode = "dimmed";
        return (
          '<div class="hidden-pair-row">' +
          '<span class="hidden-pair-label">' +
          c.day +
          ", " +
          c.start +
          " — " +
          (c.subject || "") +
          "</span>" +
          '<select class="hidden-pair-mode" data-id="' +
          c.id +
          '" id="pairMode' +
          c.id +
          '">' +
          '<option value="show"' +
          (mode === "show" ? " selected" : "") +
          ">Показывать</option>" +
          '<option value="hidden"' +
          (mode === "hidden" ? " selected" : "") +
          ">Скрыть</option>" +
          '<option value="dimmed"' +
          (mode === "dimmed" ? " selected" : "") +
          ">Бледно</option>" +
          "</select></div>"
        );
      }
    )
    .join("");
  document.getElementById("hiddenPairsOverlay").classList.add("open");
}

function closeHiddenPairsModal() {
  document.getElementById("hiddenPairsOverlay").classList.remove("open");
}

async function saveHiddenPairs() {
  const listEl = document.getElementById("hiddenPairsList");
  if (!listEl) return;
  const hiddenIds = [];
  const dimmedIds = [];
  listEl.querySelectorAll(".hidden-pair-mode").forEach((sel) => {
    const id = Number(sel.dataset.id);
    if (!id) return;
    const val = sel.value;
    if (val === "hidden") hiddenIds.push(id);
    else if (val === "dimmed") dimmedIds.push(id);
  });
  try {
    const res = await fetch("/api/hidden-pairs", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ hiddenIds, dimmedIds }),
    });
    if (!res.ok) throw new Error("Save failed");
    const data = await res.json();
    hiddenPairIds = new Set(data.hiddenIds || []);
    dimmedPairIds = new Set(data.dimmedIds || []);
    renderSchedule();
    showToast("Список сохранён");
  } catch (e) {
    console.error(e);
    showToast("Ошибка сохранения");
  }
  closeHiddenPairsModal();
}

document.getElementById("hiddenPairsOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeHiddenPairsModal();
});

async function openRemindersModal() {
  const listEl = document.getElementById("remindersList");
  const minutesEl = document.getElementById("reminderMinutesSelect");
  const daysEl = document.getElementById("reminderDaysSelect");
  if (!listEl || !minutesEl) return;
  if (!daysEl) return;
  listEl.innerHTML = "<p class=\"reminders-loading\">Загрузка...</p>";
  document.getElementById("remindersOverlay").classList.add("open");

  let savedReminders = [];
  try {
    const res = await fetch("/api/reminders", { headers: getApiHeaders(false) });
    if (res.ok) savedReminders = await res.json();
  } catch (e) {
    console.error(e);
  }

  const seen = new Set();
  const items = [];
  for (const c of schedule) {
    const key = c.day + "|" + c.start;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ day: c.day, start: c.start, subject: c.subject });
  }
  items.sort((a, b) => {
    const dayOrder = { Понедельник: 1, Вторник: 2, Среда: 3, Четверг: 4, Пятница: 5, Суббота: 6 };
    const d = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
    if (d !== 0) return d;
    return a.start.localeCompare(b.start);
  });

  const savedSet = new Set(savedReminders.map((r) => r.day + "|" + r.start));
  const savedMinutes = savedReminders.length ? (savedReminders[0].minutesBefore || 0) : 15;
  const savedDays = savedReminders.length ? (savedReminders[0].daysBefore || 0) : 0;
  const savedAt = savedReminders.length && savedReminders[0].remindAt ? savedReminders[0].remindAt : "";
  if ([0, 5, 10, 15, 30, 60].includes(savedMinutes)) {
    minutesEl.value = String(savedMinutes);
  }
  if ([0, 1, 2, 3].includes(savedDays)) {
    daysEl.value = String(savedDays);
  }
  const atEl = document.getElementById("reminderAtInput");
  if (atEl) atEl.value = savedAt;

  listEl.innerHTML = "";
  items.forEach((item) => {
    const key = item.day + "|" + item.start;
    const label = document.createElement("label");
    label.className = "reminder-item";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.day = item.day;
    cb.dataset.start = item.start;
    cb.checked = savedSet.has(key);
    label.appendChild(cb);
    const span = document.createElement("span");
    span.className = "reminder-item-text";
    span.textContent = `${item.day}, ${item.start} — ${item.subject}`;
    label.appendChild(span);
    listEl.appendChild(label);
  });
}

function closeRemindersModal() {
  document.getElementById("remindersOverlay").classList.remove("open");
}

async function saveReminders() {
  const listEl = document.getElementById("remindersList");
  const minutesEl = document.getElementById("reminderMinutesSelect");
  const daysEl = document.getElementById("reminderDaysSelect");
  const atEl = document.getElementById("reminderAtInput");
  if (!listEl || !minutesEl) return;
  const minutesBefore = parseInt(minutesEl.value, 10) || 0;
  const daysBefore = (daysEl && parseInt(daysEl.value, 10)) || 0;
  const remindAt = (atEl && atEl.value && atEl.value.trim()) ? atEl.value.trim() : "";
  const reminders = [];
  listEl.querySelectorAll("input[type=checkbox]:checked").forEach((cb) => {
    reminders.push({
      day: cb.dataset.day,
      start: cb.dataset.start,
      minutesBefore: minutesBefore >= 1 && minutesBefore <= 120 ? minutesBefore : 0,
      daysBefore: daysBefore >= 1 && daysBefore <= 7 ? daysBefore : 0,
      remindAt: remindAt,
    });
  });
  const hasAt = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(remindAt);
  if (reminders.length > 0 && minutesBefore === 0 && daysBefore === 0 && !hasAt) {
    showToast("Укажите минуты, дни или время для напоминания");
    return;
  }
  try {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ reminders }),
    });
    if (!res.ok) {
      showToast("Ошибка сохранения");
      return;
    }
    showToast(reminders.length ? `Напоминания сохранены (${reminders.length}) ✅` : "Напоминания отключены");
    closeRemindersModal();
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

document.getElementById("remindersOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeRemindersModal();
});

async function openWriteToParticipantModal() {
  const select = document.getElementById("participantSelect");
  const textarea = document.getElementById("participantMessageText");
  if (!select || !textarea) return;
  select.innerHTML = "<option value=''>Загрузка...</option>";
  select.disabled = true;
  textarea.value = "";
  document.getElementById("writeToParticipantOverlay").classList.add("open");
  try {
    const res = await fetch("/api/participants", { headers: getApiHeaders(false) });
    if (!res.ok) {
      select.innerHTML = "<option value=''>Ошибка загрузки</option>";
      return;
    }
    const list = await res.json();
    select.innerHTML = "<option value=''>Выберите участника</option>";
    list.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.displayName;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
    select.innerHTML = "<option value=''>Ошибка сети</option>";
  } finally {
    select.disabled = false;
  }
}

function closeWriteToParticipantModal() {
  document.getElementById("writeToParticipantOverlay").classList.remove("open");
}

async function sendToParticipant() {
  const select = document.getElementById("participantSelect");
  const textarea = document.getElementById("participantMessageText");
  const toChatId = select && select.value ? Number(select.value) : 0;
  const text = textarea && textarea.value ? textarea.value.trim() : "";
  if (!toChatId || !text) {
    alert("Выберите участника и введите сообщение");
    return;
  }
  try {
    const res = await fetch("/api/send-to-participant", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ toChatId, text }),
    });
    if (!res.ok) {
      showToast("Ошибка отправки");
    } else {
      showToast("Сообщение отправлено ✅");
      closeWriteToParticipantModal();
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

document.getElementById("writeToParticipantOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeWriteToParticipantModal();
});

async function toggleBroadcastSubscription() {
  const endpoint = broadcastSubscribed ? "/api/broadcast-unsubscribe" : "/api/broadcast-subscribe";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      showToast("Ошибка");
      return;
    }
    const data = await res.json();
    broadcastSubscribed = !!data.subscribed;
    updateBroadcastSubUI();
    showToast(broadcastSubscribed ? "Вы подписаны на рассылку ✅" : "Вы отписались от рассылки");
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети");
  }
}

document.getElementById("actionsOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeActionsModal();
});

document.getElementById("broadcastOfferOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeBroadcastOfferModal();
});

function openStarostaModal() {
  const textarea = document.getElementById("starostaText");
  textarea.value = "";
  document.getElementById("starostaOverlay").classList.add("open");
}

function closeStarostaModal() {
  document.getElementById("starostaOverlay").classList.remove("open");
}

async function sendStarostaMessage() {
  const textarea = document.getElementById("starostaText");
  const text = textarea.value.trim();
  if (!text) {
    alert("Введите текст сообщения");
    return;
  }
  try {
    const res = await fetch("/api/contact-starosta", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      showToast("Ошибка отправки старосте");
    } else {
      showToast("Сообщение отправлено старосте ✅");
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети при отправке");
  }
  closeStarostaModal();
}

document.getElementById("starostaOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeStarostaModal();
});

function openFeedbackModal() {
  const textarea = document.getElementById("feedbackText");
  if (textarea) textarea.value = "";
  document.getElementById("feedbackOverlay").classList.add("open");
}

function closeFeedbackModal() {
  document.getElementById("feedbackOverlay").classList.remove("open");
}

async function sendFeedback() {
  const textarea = document.getElementById("feedbackText");
  const text = textarea ? textarea.value.trim() : "";
  if (!text) {
    alert("Введите сообщение");
    return;
  }
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      showToast("Ошибка отправки");
    } else {
      showToast("Отправлено в Отладку ✅");
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка сети при отправке");
  }
  closeFeedbackModal();
}

document.getElementById("feedbackOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeFeedbackModal();
});

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#1c1c1e");
  tg.setBackgroundColor("#1c1c1e");
}

loadSchedule();