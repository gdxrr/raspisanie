import { state } from "./state.js";
import { HOLIDAY_ANIMATIONS_STORAGE_KEY, HOLIDAY_PREVIEW_STORAGE_KEY, ACTION_MENU_ITEMS } from "./constants.js";
import { showToast, getApiHeaders, escapeHtml } from "./utils.js";
import { holidayEffectsInit, holidayEffectsRefresh } from "./holidayEffects.js";

export function applyTheme(theme) {
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

export function setupThemeAutoListener() {
  if (!window.matchMedia) return;
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (state.settingsTheme === "auto") applyTheme("auto");
  });
}

export function loadSettings() {
  try {
    try {
      localStorage.removeItem(HOLIDAY_PREVIEW_STORAGE_KEY);
    } catch (e) {}
    const t = localStorage.getItem("schedule_theme");
    if (t === "light" || t === "dark" || t === "auto" || t === "guap" || t === "vesna") state.settingsTheme = t;
    const v = localStorage.getItem("schedule_vuc");
    if (v === "0" || v === "1") state.settingsVuc = v === "1";
    const sb = localStorage.getItem("schedule_show_birthdays");
    if (sb === "0" || sb === "1") state.settingsShowBirthdays = sb === "1";
    const sha = localStorage.getItem(HOLIDAY_ANIMATIONS_STORAGE_KEY);
    if (sha === "0" || sha === "1") state.settingsHolidayAnimations = sha === "1";
    const ha = JSON.parse(localStorage.getItem("schedule_hidden_actions") || "[]");
    state.hiddenActionIds = new Set(Array.isArray(ha) ? ha : []);
  } catch (e) {}
  if (typeof window.d20LoadState === "function") window.d20LoadState();
  try {
    const dv = JSON.parse(localStorage.getItem("schedule_deadlines_visible") || "{}");
    if (dv && typeof dv === "object") state.deadlinesVisibleBySubject = dv;
    const ds = localStorage.getItem("schedule_deadlines_sort");
    if (ds === "date" || ds === "subject") state.deadlinesSort = ds;
  } catch (e) {}
  applyTheme(state.settingsTheme);
  setupThemeAutoListener();
  holidayEffectsInit();
}

export function openSettingsFromActions() {
  if (typeof window.closeActionsModal === "function") window.closeActionsModal();
  const themeEl = document.getElementById("settingsTheme");
  const vucEl = document.getElementById("settingsVuc");
  const showEl = document.getElementById("settingsShowBirthdays");
  const holidayAnimationsEl = document.getElementById("settingsHolidayAnimations");
  if (themeEl) themeEl.value = state.settingsTheme;
  if (vucEl) vucEl.value = state.settingsVuc ? "1" : "0";
  if (showEl) showEl.value = state.settingsShowBirthdays ? "1" : "0";
  if (holidayAnimationsEl) holidayAnimationsEl.value = state.settingsHolidayAnimations ? "1" : "0";
  const dayEl = document.getElementById("settingsBirthdayDay");
  if (dayEl) {
    dayEl.innerHTML = '<option value="">День</option>';
    for (let i = 1; i <= 31; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = String(i);
      if (state.myBirthday && state.myBirthday.day === i) opt.selected = true;
      dayEl.appendChild(opt);
    }
  }
  const monthEl = document.getElementById("settingsBirthdayMonth");
  if (monthEl && state.myBirthday) monthEl.value = String(state.myBirthday.month);
  else if (monthEl) monthEl.value = "";
  const hiddenActionsEl = document.getElementById("settingsHiddenActions");
  if (hiddenActionsEl) {
    hiddenActionsEl.innerHTML = ACTION_MENU_ITEMS.map(
      (item) =>
        '<label class="settings-action-check"><input type="checkbox" class="settings-action-cb" data-action-id="' +
        item.id +
        '"' +
        (state.hiddenActionIds.has(item.id) ? " checked" : "") +
        ">" +
        escapeHtml(item.label) +
        "</label>"
    ).join("");
  }
  const overlay = document.getElementById("settingsOverlay");
  if (overlay) overlay.classList.add("open");
}

export function closeSettingsModal() {
  const overlay = document.getElementById("settingsOverlay");
  if (overlay) overlay.classList.remove("open");
}

export function saveSettings() {
  const themeEl = document.getElementById("settingsTheme");
  const vucEl = document.getElementById("settingsVuc");
  const showEl = document.getElementById("settingsShowBirthdays");
  const holidayAnimationsEl = document.getElementById("settingsHolidayAnimations");
  const dayEl = document.getElementById("settingsBirthdayDay");
  const monthEl = document.getElementById("settingsBirthdayMonth");
  if (themeEl) {
    state.settingsTheme = themeEl.value;
    try {
      localStorage.setItem("schedule_theme", state.settingsTheme);
    } catch (e) {}
    applyTheme(state.settingsTheme);
  }
  if (vucEl) {
    state.settingsVuc = vucEl.value === "1";
    try {
      localStorage.setItem("schedule_vuc", vucEl.value);
    } catch (e) {}
  }
  if (showEl) {
    state.settingsShowBirthdays = showEl.value === "1";
    try {
      localStorage.setItem("schedule_show_birthdays", showEl.value);
    } catch (e) {}
  }
  if (holidayAnimationsEl) {
    state.settingsHolidayAnimations = holidayAnimationsEl.value === "1";
    try {
      localStorage.setItem(HOLIDAY_ANIMATIONS_STORAGE_KEY, holidayAnimationsEl.value);
    } catch (e) {}
    holidayEffectsRefresh(true);
  }
  const newHidden = [];
  document.querySelectorAll(".settings-action-cb:checked").forEach((cb) => {
    const id = cb.getAttribute("data-action-id");
    if (id) newHidden.push(id);
  });
  state.hiddenActionIds = new Set(newHidden);
  try {
    localStorage.setItem("schedule_hidden_actions", JSON.stringify(newHidden));
  } catch (e) {}
  const day = dayEl && dayEl.value ? parseInt(dayEl.value, 10) : null;
  const month = monthEl && monthEl.value ? parseInt(monthEl.value, 10) : null;
  const hasBirthday = day != null && month != null && day >= 1 && day <= 31 && month >= 1 && month <= 12;
  (async () => {
    try {
      await fetch("/api/birthday", {
        method: "POST",
        headers: getApiHeaders(true),
        body: JSON.stringify(hasBirthday ? { day, month } : { day: null, month: null }),
      });
      state.myBirthday = hasBirthday ? { day, month } : null;
      if (typeof window.loadBirthdays === "function") await window.loadBirthdays();
    } catch (e) {
      console.error("Failed to save birthday", e);
    }
    closeSettingsModal();
    if (typeof window.renderSchedule === "function") window.renderSchedule();
    if (state.viewMode === "calendar" && typeof window.renderCalendar === "function") window.renderCalendar();
    showToast("Настройки сохранены");
  })();
}
