const DAY_NAMES_RU = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const DAY_NAME_TO_NUM = { Понедельник: 1, Вторник: 2, Среда: 3, Четверг: 4, Пятница: 5, Суббота: 6, Воскресенье: 0 };

function getAcademicWeekNum(date) {
  const y = date.getFullYear();
  const sep1 = new Date(y, 8, 1);
  const d1 = sep1.getDay() || 7;
  const mon = new Date(sep1);
  mon.setDate(sep1.getDate() - (d1 - 1));
  return Math.floor((date - mon) / 86400000 / 7) + 1;
}

function getWeekType(date) {
  return getAcademicWeekNum(date) % 2 === 1 ? "odd" : "even";
}

/** Ближайшая дата в будущем (или сегодня), когда день недели = dayName (1=Пн..6=Сб). */
function getNextOccurrenceOfDay(dayName) {
  const target = DAY_NAME_TO_NUM[dayName];
  if (target == null) return null;
  const now = new Date();
  const d = now.getDay();
  let diff = d === target ? 7 : d < target ? target - d : 7 - d + target;
  const date = new Date(now);
  date.setDate(now.getDate() + diff);
  return date;
}

function getTodayDayName() {
  return DAY_NAMES_RU[new Date().getDay()];
}

module.exports = {
  DAY_NAMES_RU,
  DAY_NAME_TO_NUM,
  getAcademicWeekNum,
  getWeekType,
  getNextOccurrenceOfDay,
  getTodayDayName,
};
