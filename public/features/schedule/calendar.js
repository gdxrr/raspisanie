import { state } from "../../shared/core/state.js";
import {
  DAY_NAMES,
  DAY_NAMES_SHORT,
  MONTH_NOM,
  TYPE_LABELS,
  TYPE_CLASS,
  LAST_ACADEMIC_WEEK,
  PRE_HOLIDAY_END_TIME,
} from "../../shared/core/constants.js";
import { escapeHtml } from "../../shared/core/utils.js";
import {
  getAcademicWeekNum,
  getWeekType,
  getPeriodAfterTeaching,
  getHolidayLabel,
  getBirthdaysOnDate,
  isHolidayDate,
  isPreHolidayDate,
  isSaturdayEvenWeekend,
} from "../../shared/core/dates.js";

export function getDaysWithClasses() {
  const set = new Set();
  const schedule = state.schedule || [];
  schedule.forEach((c) => {
    if (c.day) set.add(c.day);
  });
  return set;
}

export function toggleCalendarView(nextMode) {
  if (nextMode === "calendar" || nextMode === "list") state.viewMode = nextMode;
  else state.viewMode = state.viewMode === "list" ? "calendar" : "list";
  const cont = document.getElementById("scheduleContainer");
  const cal = document.getElementById("calendarView");
  const filterStrip = document.getElementById("scheduleFilterStrip");
  const overview = document.getElementById("scheduleOverview");
  if (state.viewMode === "calendar") {
    if (cont) cont.style.display = "none";
    if (filterStrip) filterStrip.style.display = "none";
    if (overview) overview.style.display = "none";
    if (cal) cal.style.display = "block";
    const bottomBar = document.getElementById("bottomBar");
    if (bottomBar) bottomBar.classList.remove("admin-visible");
    state.calendarMonth = new Date();
    renderCalendar();
  } else {
    if (cont) cont.style.display = "";
    if (filterStrip) filterStrip.style.display = "";
    if (overview) overview.style.display = "";
    if (cal) cal.style.display = "none";
    if (state.isAdmin) {
      const bottomBar = document.getElementById("bottomBar");
      if (bottomBar) bottomBar.classList.add("admin-visible");
    }
    if (typeof window.renderSchedule === "function") window.renderSchedule();
  }
  if (typeof window.syncViewToggleButtons === "function") window.syncViewToggleButtons();
}

export function calendarPrevMonth() {
  state.calendarMonth.setMonth(state.calendarMonth.getMonth() - 1);
  renderCalendar();
}

export function calendarNextMonth() {
  state.calendarMonth.setMonth(state.calendarMonth.getMonth() + 1);
  renderCalendar();
}

function getDayClassesForDate(dayName, wType) {
  if (typeof window.getDayClassesForDate === "function") {
    return window.getDayClassesForDate(dayName, wType, state.schedule);
  }
  return [];
}

export function renderCalendar() {
  const titleEl = document.getElementById("calendarMonthTitle");
  const gridEl = document.getElementById("calendarGrid");
  if (!gridEl) return;
  const calMonth = state.calendarMonth || new Date();
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
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
  const getDeadlinesOnDate = window.getDeadlinesOnDate;
  const shortDeadlineTask = window.shortDeadlineTask;
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
    const dayClasses = !isHoliday && !isSatEvenWeekend && isTeaching && !(dayName === "Четверг" && !state.settingsVuc)
      ? getDayClassesForDate(dayName, getWeekType(d)).filter((c) => !state.hiddenPairIds.has(c.id))
      : [];
    const hasClass = dayClasses.some((c) => !state.dimmedPairIds.has(c.id));
    const hasDimmed = dayClasses.some((c) => state.dimmedPairIds.has(c.id));
    const isToday = d.getTime() === today.getTime();
    let cls = "calendar-cell calendar-day";
    if (!isTeaching && !period) cls += " calendar-day-nonteaching";
    if (isHoliday) cls += " calendar-day-holiday";
    if (isPreHoliday && isTeaching) cls += " calendar-day-preholiday";
    if (period) cls += " " + period.cls;
    if (isToday) cls += " calendar-day-today";
    if (hasDimmed) cls += " calendar-day-has-dimmed";
    const dayBirthdays = getBirthdaysOnDate(month + 1, dayCount);
    if (state.settingsShowBirthdays && dayBirthdays.length) cls += " calendar-day-birthday";
    const dayDeadlines = getDeadlinesOnDate ? getDeadlinesOnDate(year, month + 1, dayCount) : [];
    if (dayDeadlines.length) cls += " calendar-day-deadline";
    const weekLabel = isTeaching ? wNum + " нед" : "—";
    let daySubLabel = getHolidayLabel(d);
    if (!daySubLabel && isPreHoliday && isTeaching) daySubLabel = "до 14:30";
    if (!daySubLabel && period) daySubLabel = period.short;
    if (!daySubLabel) daySubLabel = weekLabel;
    let dotHtml = "";
    if (hasClass) dotHtml = '<span class="calendar-dot"></span>';
    else if (hasDimmed) dotHtml = '<span class="calendar-dot calendar-dot-dimmed"></span>';
    if (state.settingsShowBirthdays && dayBirthdays.length) dotHtml += '<span class="calendar-birthday-icon" title="День рождения: ' + escapeHtml(dayBirthdays.join(", ")) + '">🎂</span>';
    if (dayDeadlines.length && shortDeadlineTask) {
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

export function openCalendarDayModal(year, month, dayNum) {
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
  const getDeadlinesOnDate = window.getDeadlinesOnDate;
  const shortDeadlineTask = window.shortDeadlineTask;
  const dayDeadlinesList = getDeadlinesOnDate ? getDeadlinesOnDate(year, month, dayNum) : [];
  const deadlinesNote = dayDeadlinesList.length && shortDeadlineTask
    ? '<p class="calendar-day-deadline-note">📋 Дедлайны: ' + dayDeadlinesList.map((dl) => escapeHtml((dl.type === "strict" ? "🔒 " : "") + shortDeadlineTask(dl.task) + " — " + dl.subject)).join("; ") + "</p>"
    : "";
  if (isHoliday || dayName === "Воскресенье" || isSaturdayEvenWeekend(d)) {
    listEl.innerHTML = '<p class="calendar-day-empty">Выходной</p>' + deadlinesNote;
  } else if (dayName === "Четверг" && !state.settingsVuc) {
    listEl.innerHTML = '<p class="calendar-day-empty">Четверг — пар нет (нет ВУЦ)</p>' + deadlinesNote;
  } else {
    const birthdayNames = getBirthdaysOnDate(month, dayNum);
    const birthdayNote = state.settingsShowBirthdays && birthdayNames.length ? '<p class="calendar-day-birthday-note">🎂 Дни рождения: ' + birthdayNames.map((n) => escapeHtml(n)).join(", ") + "</p>" : "";
    let classes = getDayClassesForDate(dayName, wType).filter((c) => !state.hiddenPairIds.has(c.id));
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
            const dimmed = state.dimmedPairIds.has(c.id);
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
  const overlay = document.getElementById("calendarDayModalOverlay");
  if (overlay) overlay.classList.add("open");
}

export function closeCalendarDayModal() {
  const overlay = document.getElementById("calendarDayModalOverlay");
  if (overlay) overlay.classList.remove("open");
}
