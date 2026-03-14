export const PAIR_TIMES = {
  1: { start: "9:30", end: "11:00" },
  2: { start: "11:10", end: "12:40" },
  3: { start: "13:00", end: "14:30" },
  4: { start: "15:10", end: "16:40" },
  5: { start: "17:00", end: "18:30" },
  6: { start: "18:40", end: "20:10" }
};

export function pairNum(start) {
  for (const [n, t] of Object.entries(PAIR_TIMES)) {
    if (t.start === start) return n;
  }
  return "?";
}

export const defaultSchedule = [
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

export const DAY_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
export const DAY_NAMES_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const MONTH_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
export const MONTH_NOM = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
export const LAST_ACADEMIC_WEEK = 39;
export const FIXED_HOLIDAYS = [[4, 1], [4, 9], [5, 12]];
export const FIXED_HOLIDAY_LABELS = { "4,1": "1 мая", "4,9": "9 мая", "5,12": "12 июня" };
export const PRE_HOLIDAYS = [[3, 30], [4, 8], [5, 11]];
export const PRE_HOLIDAY_END_TIME = "14:30";

export const TYPE_LABELS = {
  lab: "Лабораторная работа",
  lec: "Лекция",
  prac: "Практическая работа",
  kurs: "Курсовая работа"
};

export const TYPE_CLASS = {
  lab: "type-lab",
  lec: "type-lec",
  prac: "type-prac",
  kurs: "type-kurs"
};

export const HOLIDAY_ANIMATIONS_STORAGE_KEY = "schedule_holiday_animations";
export const HOLIDAY_PREVIEW_STORAGE_KEY = "schedule_holiday_preview";
export const HOLIDAY_EFFECTS = {
  initialized: false,
  activeTheme: null,
  particlesTimer: null,
  midnightTimer: null,
  fireworksFrame: null,
  fireworksContext: null,
  fireworksBursts: [],
  isVisible: true,
};
export const HOLIDAY_PARTICLE_LIBRARY = {
  snowflake: { symbol: "❄️", minSize: 14, maxSize: 28, motion: "fall", opacity: [0.5, 0.95], duration: [9, 16] },
  confetti: { shape: "confetti", minSize: 8, maxSize: 15, motion: "fall", opacity: [0.55, 0.95], duration: [6, 10], colors: ["#f59e0b", "#10b981", "#60a5fa", "#f472b6", "#ffffff"] },
  gift: { symbol: "🎁", minSize: 18, maxSize: 28, motion: "fall", opacity: [0.7, 0.95], duration: [9, 13] },
  star: { symbol: "⭐", minSize: 14, maxSize: 26, motion: "fall", opacity: [0.55, 0.9], duration: [8, 14] },
  candle: { symbol: "🕯️", minSize: 16, maxSize: 26, motion: "float", opacity: [0.45, 0.75], duration: [12, 18] },
  heart: { symbol: "💕", minSize: 16, maxSize: 28, motion: "float", opacity: [0.5, 0.88], duration: [8, 13] },
  "flag-confetti": { shape: "flag-confetti", minSize: 8, maxSize: 14, motion: "fall", opacity: [0.6, 0.95], duration: [6, 10] },
  petal: { symbol: "🌸", minSize: 16, maxSize: 28, motion: "sway", opacity: [0.5, 0.82], duration: [11, 18] },
  blin: { symbol: "🥞", minSize: 18, maxSize: 28, motion: "fall", opacity: [0.72, 0.95], duration: [10, 15] },
  "jester-hat": { symbol: "🃏", minSize: 16, maxSize: 26, motion: "fall", opacity: [0.55, 0.85], duration: [8, 12] },
  spark: { symbol: "✦", minSize: 14, maxSize: 24, motion: "fall", opacity: [0.45, 0.8], duration: [7, 11] },
  rocket: { symbol: "🚀", minSize: 16, maxSize: 28, motion: "float", opacity: [0.55, 0.9], duration: [8, 13] },
  planet: { symbol: "🪐", minSize: 18, maxSize: 30, motion: "fall", opacity: [0.5, 0.88], duration: [10, 15] },
  tulip: { symbol: "🌷", minSize: 16, maxSize: 26, motion: "sway", opacity: [0.5, 0.82], duration: [10, 16] },
  ribbon: { shape: "ribbon", minSize: 10, maxSize: 14, motion: "fall", opacity: [0.55, 0.9], duration: [8, 12] },
  pumpkin: { symbol: "🎃", minSize: 18, maxSize: 28, motion: "fall", opacity: [0.65, 0.95], duration: [8, 13] },
  bat: { symbol: "🦇", minSize: 16, maxSize: 26, motion: "float", opacity: [0.45, 0.75], duration: [9, 14] },
};
export const HOLIDAY_DENSITY_COUNTS = {
  medium: 18,
  high: 26,
  ultra: 34,
};

export const ACTION_MENU_ITEMS = [
  { id: "broadcast", label: "Рассылка группы" },
  { id: "starosta", label: "Написать старосте" },
  { id: "reminders", label: "Напоминания о парах" },
  { id: "deadlines", label: "Дедлайны" },
  { id: "progress", label: "Личный прогресс" },
  { id: "polls", label: "Голосования" },
  { id: "hiddenPairs", label: "Скрытые пары" },
  { id: "roulette", label: "Рулетка" },
  { id: "d20", label: "D20" },
  { id: "monopoly", label: "Монополия" },
  { id: "achievements", label: "Достижения группы" },
  { id: "settings", label: "Настройки" },
  { id: "likes", label: "Количество лайков" },
  { id: "minigames", label: "Мини-игры" },
  { id: "feedback", label: "Жалобы и предложения" }
];

export const ROULETTE_WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
export const ROULETTE_RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const ROULETTE_SPECIAL_BETS = [
  { kind: "color", value: "red", label: "Красное", accent: "red" },
  { kind: "color", value: "black", label: "Чёрное", accent: "black" },
  { kind: "parity", value: "even", label: "Чётное", accent: "even" },
  { kind: "parity", value: "odd", label: "Нечётное", accent: "odd" }
];

export const D20_STORAGE_KEYS = {
  modifiers: "d20_modifiers",
  texture: "d20_skin_texture",
  palette: "d20_skin_palette",
  dc: "d20_dc",
};
export const D20_DEFAULT_PALETTE = {
  bg: "#262633",
  edge: "#f5a524",
  text: "#ffffff",
};
export const D20_MIN_DC = 5;
export const D20_MAX_DC = 30;
export const D20_DEFAULT_DC = 15;
export const D20_MIN_MODIFIER = -20;
export const D20_MAX_MODIFIER = 20;
export const D20_MAX_MODIFIERS = 20;
export const D20_ROLL_MS = 1350;

export const GUAP_SSO_URL = "https://sso.guap.ru/realms/master/protocol/openid-connect/auth?state=1a30769364889a2601992596d5162efe&scope=profile%20email&response_type=code&approval_prompt=auto&redirect_uri=https%3A%2F%2Fpro.guap.ru%2Foauth%2Fcallback&client_id=prosuai";
export const OIS_SUBJECT = "Открытые информационные системы";
export const DEADLINES_LIST = [
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
