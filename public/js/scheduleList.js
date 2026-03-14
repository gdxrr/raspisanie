import { state } from "./state.js";
import {
  DAY_NAMES,
  TYPE_LABELS,
  TYPE_CLASS,
  defaultSchedule,
  pairNum,
  DEADLINES_LIST,
} from "./constants.js";
import { escapeHtml, getApiHeaders } from "./utils.js";
import {
  getWeekType,
  getAcademicWeekNum,
  formatDate,
  getBirthdaysOnDate,
  isHolidayDate,
} from "./dates.js";

export async function loadSchedule() {
  // #region agent log
  if (typeof console !== "undefined" && console.log) console.log("[schedule debug] loadSchedule entered");
  fetch('http://127.0.0.1:7625/ingest/f0416d0c-206c-4146-9cb3-e961c4db9051',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d8941a'},body:JSON.stringify({sessionId:'d8941a',location:'scheduleList.js:loadSchedule',message:'loadSchedule entered',data:{},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  let data = null;
  try {
    const res = await fetch("/api/schedule", { headers: getApiHeaders(false) });
    if (!res.ok) throw new Error("Failed to load: " + res.status);
    data = await res.json();
    if (!Array.isArray(data)) data = null;
  } catch (e) {
    console.error("Failed to load schedule from server, using fallback", e);
    try {
      const local = JSON.parse(localStorage.getItem("schedule_3333") || "null");
      if (Array.isArray(local) && local.length) {
        data = local;
      } else {
        data = defaultSchedule.slice();
      }
    } catch {
      data = defaultSchedule.slice();
    }
  }

  if (!data || !data.length) {
    data = defaultSchedule.slice();
  }

  // #region agent log
  const scheduleLen = (data && data.length) || 0;
  if (typeof console !== "undefined" && console.log) console.log("[schedule debug] state.schedule set", { scheduleLength: scheduleLen });
  fetch('http://127.0.0.1:7625/ingest/f0416d0c-206c-4146-9cb3-e961c4db9051',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d8941a'},body:JSON.stringify({sessionId:'d8941a',location:'scheduleList.js:loadSchedule',message:'state.schedule set',data:{scheduleLength:scheduleLen},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  state.schedule = data;
  state.nextId =
    (state.schedule && state.schedule.length)
      ? Math.max(...state.schedule.map((c) => c.id || 0)) + 1
      : 1;

  try {
    const res = await fetch("/api/hidden-pairs", { headers: getApiHeaders(false) });
    if (res.ok) {
      const hpData = await res.json();
      if (Array.isArray(hpData)) {
        state.hiddenPairIds = new Set(hpData);
        state.dimmedPairIds = new Set();
      } else {
        state.hiddenPairIds = new Set(hpData.hiddenIds || []);
        state.dimmedPairIds = new Set(hpData.dimmedIds || []);
      }
    }
  } catch (e) {
    console.error("Failed to load hidden pairs", e);
  }

  try {
    await loadSubjectBackgrounds();
    if (typeof window.loadBroadcastStatus === "function") window.loadBroadcastStatus();
    if (typeof window.loadSettings === "function") window.loadSettings();
    if (typeof window.loadBirthdays === "function") await window.loadBirthdays();
  } catch (e) {
    console.error("loadSchedule: non-critical error", e);
  } finally {
    init();
  }
}

export async function loadSubjectBackgrounds() {
  state.subjectBackgroundsBySubject = {};
  try {
    const res = await fetch("/api/subject-backgrounds", { headers: getApiHeaders(false) });
    if (!res.ok) throw new Error("Failed to load subject backgrounds: " + res.status);
    const data = await res.json();
    const bySubject = data && data.bySubject && typeof data.bySubject === "object" ? data.bySubject : {};
    Object.keys(bySubject).forEach((subject) => {
      const item = bySubject[subject];
      if (!item || typeof item.dataUrl !== "string" || !item.dataUrl) return;
      state.subjectBackgroundsBySubject[subject] = {
        dataUrl: item.dataUrl,
        updatedAt: item.updatedAt || null,
      };
    });
  } catch (e) {
    console.error("Failed to load subject backgrounds", e);
  }
}

export async function saveData() {
  const schedule = state.schedule || [];
  try {
    await fetch("/api/schedule", {
      method: "POST",
      headers: getApiHeaders(true),
      body: JSON.stringify(schedule),
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

export function setViewMode(nextMode) {
  const desiredMode = nextMode === "calendar" ? "calendar" : "list";
  if (state.viewMode === desiredMode) {
    syncViewToggleButtons();
    return;
  }
  if (typeof window.toggleCalendarView === "function") window.toggleCalendarView(desiredMode);
}

export function syncViewToggleButtons() {
  const listBtn = document.getElementById("listViewBtn");
  const calendarBtn = document.getElementById("calendarViewBtn");
  if (listBtn) listBtn.classList.toggle("active", state.viewMode === "list");
  if (calendarBtn) calendarBtn.classList.toggle("active", state.viewMode === "calendar");
}

export function init() {
  // #region agent log
  fetch('http://127.0.0.1:7625/ingest/f0416d0c-206c-4146-9cb3-e961c4db9051',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d8941a'},body:JSON.stringify({sessionId:'d8941a',location:'scheduleList.js:init',message:'init entered',data:{viewMode:state.viewMode},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  try {
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
    syncViewToggleButtons();
    if (state.viewMode === "calendar") {
      const cont = document.getElementById("scheduleContainer");
      const cal = document.getElementById("calendarView");
      const overview = document.getElementById("scheduleOverview");
      if (cont) cont.style.display = "none";
      if (cal) cal.style.display = "block";
      if (overview) overview.style.display = "none";
      if (typeof window.renderCalendar === "function") window.renderCalendar();
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7625/ingest/f0416d0c-206c-4146-9cb3-e961c4db9051',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d8941a'},body:JSON.stringify({sessionId:'d8941a',location:'scheduleList.js:init',message:'branch list, calling renderSchedule',data:{},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const scheduleCont = document.getElementById("scheduleContainer");
      if (scheduleCont) scheduleCont.style.display = "";
      renderSchedule();
    }
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/f0416d0c-206c-4146-9cb3-e961c4db9051',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d8941a'},body:JSON.stringify({sessionId:'d8941a',location:'scheduleList.js:init',message:'init threw',data:{err:String(e&&e.message||e)},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error("Schedule init error", e);
  }
}

export function getDayClassesForDate(dayName, weekType, scheduleArr) {
  const arr = Array.isArray(scheduleArr) ? scheduleArr : (state.schedule || []);
  const m = (t) => {
    const [h, mn] = t.split(":").map(Number);
    return h * 60 + mn;
  };
  return (arr || [])
    .filter((c) => c.day === dayName && (c.week === "both" || c.week === weekType))
    .sort((a, b) => m(a.start) - m(b.start));
}

function getEffectiveClassesForDate(date) {
  const dayIndex = date.getDay();
  const dayName = dayIndex === 0 ? "Воскресенье" : DAY_NAMES[dayIndex - 1];
  const classes = getDayClassesForDate(dayName, getWeekType(date), state.schedule).filter(
    (c) => !state.hiddenPairIds.has(c.id)
  );
  if (dayName === "Четверг" && !state.settingsVuc) return [];
  return classes;
}

function classTimeMinutes(item, edge) {
  const value = item && item[edge];
  if (!value) return 0;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function renderScheduleOverview() {
  const overview = document.getElementById("scheduleOverview");
  if (!overview || state.viewMode !== "list") return;
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todaysClasses = getEffectiveClassesForDate(today);
  const tomorrowClasses = getEffectiveClassesForDate(tomorrow);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let currentClass = null;
  let nextClass = null;
  todaysClasses.forEach((item) => {
    const startMinutes = classTimeMinutes(item, "start");
    const endMinutes = classTimeMinutes(item, "end");
    if (nowMinutes >= startMinutes && nowMinutes < endMinutes) currentClass = item;
    if (!nextClass && startMinutes > nowMinutes) nextClass = item;
  });
  let statusLabel = "Сегодня";
  let statusTitle = "Пар нет";
  let statusMeta = "Главное уже спокойно: можно переключиться на дедлайны или отдохнуть.";
  let ctaFilter = tomorrowClasses.length ? "tomorrow" : "all";
  let ctaText = tomorrowClasses.length ? "Показать завтра" : "Открыть неделю";
  if (currentClass) {
    statusLabel = "Сейчас";
    statusTitle = currentClass.subject;
    statusMeta = currentClass.start + " - " + currentClass.end + " - " + (currentClass.room || "Аудитория уточняется");
    ctaFilter = "today";
    ctaText = "К сегодняшним парам";
  } else if (nextClass) {
    statusLabel = "Дальше";
    statusTitle = nextClass.subject;
    statusMeta = nextClass.start + " - " + (nextClass.room || "Аудитория уточняется");
    ctaFilter = "today";
    ctaText = "Показать сегодня";
  } else if (tomorrowClasses.length) {
    const firstTomorrow = tomorrowClasses[0];
    statusLabel = "Завтра";
    statusTitle = firstTomorrow.subject;
    statusMeta = firstTomorrow.start + " - " + (firstTomorrow.room || "Аудитория уточняется");
  }
  const pills = [];
  if (todaysClasses.length) pills.push('<div class="schedule-overview-pill"><span>Сегодня</span><strong>' + String(todaysClasses.length) + "</strong></div>");
  if (tomorrowClasses.length) pills.push('<div class="schedule-overview-pill"><span>Завтра</span><strong>' + String(tomorrowClasses.length) + "</strong></div>");
  if (!pills.length) pills.push('<div class="schedule-overview-pill"><span>Режим</span><strong>Пауза</strong></div>');
  overview.innerHTML =
    '<div class="schedule-overview-card">' +
    '<div class="schedule-overview-main">' +
    '<span class="schedule-overview-label">' + escapeHtml(statusLabel) + "</span>" +
    '<h2 class="schedule-overview-title">' + escapeHtml(statusTitle) + "</h2>" +
    '<p class="schedule-overview-meta">' + escapeHtml(statusMeta) + "</p>" +
    "</div>" +
    '<div class="schedule-overview-side">' +
    pills.join("") +
    '<button type="button" class="schedule-overview-cta" onclick="setScheduleFilter(\'' + ctaFilter + '\')">' + escapeHtml(ctaText) + "</button>" +
    "</div>" +
    "</div>";
}

export function setScheduleFilter(filter) {
  state.scheduleFilter = filter;
  document.querySelectorAll(".schedule-filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-filter") === filter);
  });
  renderSchedule();
  renderScheduleOverview();
}

function getDeadlinesOnDateSafe(y, m, d) {
  return typeof window.getDeadlinesOnDate === "function" ? window.getDeadlinesOnDate(y, m, d) : [];
}
function isDeadlineVisibleSafe(d) {
  return typeof window.isDeadlineVisible === "function" ? window.isDeadlineVisible(d) : true;
}
function formatDeadlineDateSafe(dateStr) {
  return typeof window.formatDeadlineDate === "function" ? window.formatDeadlineDate(dateStr) : dateStr;
}
function shortDeadlineTaskSafe(task) {
  return typeof window.shortDeadlineTask === "function" ? window.shortDeadlineTask(task) : task;
}

export function renderSchedule() {
  const scheduleRef = Array.isArray(state.schedule) ? state.schedule : [];
  const cont = document.getElementById("scheduleContainer");
  // #region agent log
  const contNull = !cont;
  if (typeof console !== "undefined" && console.log) console.log("[schedule debug] renderSchedule", { contNull, scheduleLen: scheduleRef.length });
  fetch('http://127.0.0.1:7625/ingest/f0416d0c-206c-4146-9cb3-e961c4db9051',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d8941a'},body:JSON.stringify({sessionId:'d8941a',location:'scheduleList.js:renderSchedule',message:'renderSchedule cont check',data:{contNull:contNull,scheduleLen:scheduleRef.length},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  if (!cont) return;
  const filterStrip = document.getElementById("scheduleFilterStrip");
  const overview = document.getElementById("scheduleOverview");
  if (filterStrip) filterStrip.style.display = state.viewMode === "list" ? "" : "none";
  if (overview) overview.style.display = state.viewMode === "list" ? "" : "none";
  if (state.viewMode === "list") {
    try {
      renderScheduleOverview();
    } catch (e) {
      console.error("renderScheduleOverview error", e);
    }
  }

  let html = "";
  try {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowFull = new Date();
  const nowMinutes = nowFull.getHours() * 60 + nowFull.getMinutes();

  if (state.scheduleFilter === "deadlines") {
    const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    const list = DEADLINES_LIST.filter((d) => d.date >= todayStr && isDeadlineVisibleSafe(d)).sort((a, b) => a.date.localeCompare(b.date));
    let html = '<div class="schedule-filter-deadlines-intro">Ближайшие дедлайны</div>';
    if (!list.length) {
      html += '<div class="no-classes"><div class="emoji">✅</div><div class="title">Нет предстоящих дедлайнов</div></div>';
    } else {
      list.forEach((d) => {
        const strict = d.type === "strict" ? "🔒 " : "";
        const dateLabel = formatDeadlineDateSafe(d.date);
        html +=
          '<div class="schedule-filter-deadline-card">' +
          '<span class="schedule-filter-deadline-date">' + escapeHtml(dateLabel) + "</span>" +
          '<span class="schedule-filter-deadline-subject">' + escapeHtml(d.subject) + "</span>" +
          '<span class="schedule-filter-deadline-task">' + strict + escapeHtml(shortDeadlineTaskSafe(d.task)) + "</span>" +
          "</div>";
      });
    }
    cont.innerHTML = html;
    if (state.editMode) cont.classList.add("edit-mode");
    else cont.classList.remove("edit-mode");
    return;
  }

  const dayStart = state.scheduleFilter === "today" ? 0 : state.scheduleFilter === "tomorrow" ? 1 : 0;
  const dayEnd = state.scheduleFilter === "today" ? 1 : state.scheduleFilter === "tomorrow" ? 2 : 14;

  let lastWeek = null;

  for (let d = dayStart; d < dayEnd; d++) {
    if (state.scheduleFilter === "all" && d === 1) {
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
      html += '<div class="week-label-row"><div class="wlr-dot ' + dc + '"></div>' + wNum + "-я неделя — " + lbl + "</div>";
    }

    const isToday = d === 0;
    const classes = getDayClassesForDate(dn, wType, scheduleRef).filter((c) => !state.hiddenPairIds.has(c.id));
    const effectiveClasses = dn === "Четверг" && !state.settingsVuc ? [] : classes;
    const isHoliday = isHolidayDate(day);
    const ds = formatDate(day);

    html += '<div class="day-section"><div class="day-header' + (isToday ? " today-header" : "") + '"><span class="day-name-text">' + dn + '</span><span class="day-date">' + ds + "</span></div>";

    if (state.settingsShowBirthdays) {
      const dayBirthdays = getBirthdaysOnDate(day.getMonth() + 1, day.getDate());
      if (dayBirthdays.length) {
        html += '<div class="day-birthdays">🎂 День рождения: ' + dayBirthdays.map((n) => escapeHtml(n)).join(", ") + "</div>";
      }
    }

    const dayDeadlinesList = getDeadlinesOnDateSafe(day.getFullYear(), day.getMonth() + 1, day.getDate());
    if (dayDeadlinesList.length) {
      html += '<div class="day-deadlines">📋 Дедлайны: ' + dayDeadlinesList.map((dl) => escapeHtml((dl.type === "strict" ? "🔒 " : "") + shortDeadlineTaskSafe(dl.task) + " — " + dl.subject)).join("; ") + "</div>";
    }

    if (!effectiveClasses.length || isHoliday) {
      if (dn === "Воскресенье" || isHoliday) {
        if (isHoliday) {
          const holidayLabel = day.getDate() === 1 && day.getMonth() === 4 ? "1 мая" : "9 мая";
          html += '<div class="no-classes"><div class="emoji">🌴</div><div class="title">Выходной</div><div class="subtitle">' + holidayLabel + "</div></div>";
        } else {
          html += '<div class="no-classes"><div class="emoji">🌴</div><div class="title">Выходной</div><div class="subtitle">День отдыха</div></div>';
        }
      } else {
        html +=
          '<div class="no-classes"><div class="emoji">📅</div><div class="title">Пар нет</div><div class="subtitle">' +
          (dn === "Четверг" && !state.settingsVuc ? "Четверг — пар нет (нет ВУЦ)" : "Можно спать спокойно!") +
          "</div></div>";
      }
    } else {
      effectiveClasses.forEach((c, i) => {
        const tl = TYPE_LABELS[c.type] || c.type;
        const tc = TYPE_CLASS[c.type] || "";
        const pn = pairNum(c.start);
        const pairDisplay = c.day === "Четверг" && c.subject === "ВУЦ" ? "😢" : pn;
        const subjectBg = typeof window.getSubjectBackground === "function" ? window.getSubjectBackground(c.subject) : null;

        if (isToday) {
          const [sh, sm] = c.start.split(":").map(Number);
          const classStart = sh * 60 + sm;
          const currentTimeStr = String(nowFull.getHours()).padStart(2, "0") + ":" + String(nowFull.getMinutes()).padStart(2, "0");
          if (i === 0 && nowMinutes < classStart) {
            html += '<div class="current-time-marker"><div class="ctm-dot"></div><div class="ctm-time">' + currentTimeStr + '</div><div class="ctm-line"></div></div>';
          } else if (i > 0) {
            const [ph, pm] = effectiveClasses[i - 1].end.split(":").map(Number);
            if (nowMinutes >= ph * 60 + pm && nowMinutes < classStart) {
              html += '<div class="current-time-marker"><div class="ctm-dot"></div><div class="ctm-time">' + currentTimeStr + '</div><div class="ctm-line"></div></div>';
            }
          }
        }

        const startMinutes = classTimeMinutes(c, "start");
        const endMinutes = classTimeMinutes(c, "end");
        const isCurrentClass = isToday && nowMinutes >= startMinutes && nowMinutes < endMinutes;
        const isUpcomingClass = isToday && !isCurrentClass && startMinutes > nowMinutes && !effectiveClasses.slice(0, i).some((item) => classTimeMinutes(item, "start") > nowMinutes);
        const badge =
          c.week !== "both"
            ? '<span class="week-indicator ' + (c.week === "odd" ? "wi-odd" : "wi-even") + '">' + (c.week === "odd" ? "▲" : "▼") + "</span>"
            : "";
        const cardClick = !state.editMode ? ' onclick="openSubjectCard(' + c.id + ')" role="button" tabindex="0"' : "";
        let cardClass = "class-card" + (!state.editMode ? " class-card-clickable" : "");
        if (isCurrentClass) cardClass += " class-card-current";
        else if (isUpcomingClass) cardClass += " class-card-next";
        if (state.dimmedPairIds.has(c.id)) cardClass += " class-card-dimmed";
        if (subjectBg && subjectBg.dataUrl) cardClass += " class-card-has-bg";
        const cardStyle = subjectBg && subjectBg.dataUrl ? ' style="background-image:url(\'' + subjectBg.dataUrl + '\')"' : "";

        html +=
          '<div class="' + cardClass + '" data-id="' + c.id + '"' + cardStyle + cardClick + '><div class="time-col"><div class="time-start">' +
          escapeHtml(c.start) + '</div><div class="pair-num">' + escapeHtml(pairDisplay) + '</div><div class="time-end">' + escapeHtml(c.end) +
          '</div></div><div class="divider-v"></div><div class="info-col">' +
          (isCurrentClass ? '<span class="class-state-badge">Сейчас</span>' : isUpcomingClass ? '<span class="class-state-badge upcoming">Дальше</span>' : "") +
          '<div class="class-type ' + tc + '">' + escapeHtml(tl) + '</div><div class="class-name">' + escapeHtml(c.subject) +
          '</div><div class="class-meta-row"><span class="class-room">' + escapeHtml(c.room || "Аудитория уточняется") +
          '</span><span class="class-meta-dot">•</span><span class="class-teacher">' + escapeHtml(c.teacher || "Преподаватель уточняется") +
          "</div></div>" + badge +
          '<div class="card-actions"><button class="action-btn btn-edit" onclick="event.stopPropagation();openEditModal(' + c.id + ')">✏️</button><button class="action-btn btn-del" onclick="event.stopPropagation();deleteClass(' + c.id + ')">🗑️</button></div></div>';
      });
    }
    html += "</div>";
  }

  } catch (e) {
    console.error("renderSchedule error", e);
    html = '<div class="no-classes"><div class="title">Ошибка отображения расписания</div><div class="subtitle">Откройте консоль (F12)</div></div>';
  }
  // #region agent log
  const contDisplay = cont ? getComputedStyle(cont).display : "";
  if (typeof console !== "undefined" && console.log) console.log("[schedule debug] about to set innerHTML", { htmlLen: html.length, contDisplay });
  fetch('http://127.0.0.1:7625/ingest/f0416d0c-206c-4146-9cb3-e961c4db9051',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d8941a'},body:JSON.stringify({sessionId:'d8941a',location:'scheduleList.js:renderSchedule',message:'about to set innerHTML',data:{htmlLen:html.length,contDisplay:contDisplay},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  cont.innerHTML = html;
  if (state.editMode) cont.classList.add("edit-mode");
  else cont.classList.remove("edit-mode");
}
