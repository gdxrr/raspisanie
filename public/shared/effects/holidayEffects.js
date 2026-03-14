import { escapeHtml, showToast } from "../core/utils.js";
import {
  HOLIDAY_EFFECTS,
  HOLIDAY_PARTICLE_LIBRARY,
  HOLIDAY_DENSITY_COUNTS,
  HOLIDAY_PREVIEW_STORAGE_KEY,
} from "../core/constants.js";
import { state } from "../core/state.js";

function holidayThemesApi() {
  return window.HolidayThemes || null;
}

function holidayEffectsLayerEl() {
  return document.getElementById("holidayEffectsLayer");
}

function holidayEffectsParticlesEl() {
  return document.getElementById("holidayEffectsParticles");
}

function holidayEffectsCanvasEl() {
  return document.getElementById("holidayEffectsCanvas");
}

function holidayEffectsDismissEl() {
  return document.getElementById("holidayEffectsDismiss");
}

function holidayEffectsToday() {
  return new Date();
}

function holidayEffectsGetDismissPayload() {
  const api = holidayThemesApi();
  if (!api) return null;
  try {
    return localStorage.getItem(api.DISMISS_STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function holidayEffectsSetDismissPayload(themeId, date) {
  const api = holidayThemesApi();
  if (!api) return;
  try {
    localStorage.setItem(api.DISMISS_STORAGE_KEY, JSON.stringify({
      holidayId: themeId,
      date: api.toIsoDay(date),
    }));
  } catch (e) {}
}

function holidayEffectsClearDismissIfExpired(date) {
  const api = holidayThemesApi();
  if (!api) return;
  try {
    const raw = localStorage.getItem(api.DISMISS_STORAGE_KEY);
    if (!raw) return;
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      localStorage.removeItem(api.DISMISS_STORAGE_KEY);
      return;
    }
    if (!parsed || parsed.date !== api.toIsoDay(date)) {
      localStorage.removeItem(api.DISMISS_STORAGE_KEY);
    }
  } catch (e) {}
}

function holidayEffectsIsDismissed(themeId, date) {
  const api = holidayThemesApi();
  if (!api) return false;
  return api.isHolidayThemeDismissed(themeId, date, holidayEffectsGetDismissPayload());
}

function holidayEffectsCountForTheme(theme) {
  return HOLIDAY_DENSITY_COUNTS[theme && theme.density] || HOLIDAY_DENSITY_COUNTS.medium;
}

function holidayEffectsRandomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function holidayEffectsParticleConfig(kind) {
  return HOLIDAY_PARTICLE_LIBRARY[kind] || HOLIDAY_PARTICLE_LIBRARY.spark;
}

function holidayEffectsCreateParticle(kind) {
  const config = holidayEffectsParticleConfig(kind);
  const particle = document.createElement("span");
  const size = Math.round(holidayEffectsRandomBetween(config.minSize, config.maxSize));
  const duration = holidayEffectsRandomBetween(config.duration[0], config.duration[1]);
  const delay = holidayEffectsRandomBetween(-duration, 0);
  const left = holidayEffectsRandomBetween(-5, 100);
  const driftStart = holidayEffectsRandomBetween(-10, 10).toFixed(2) + "vw";
  const driftEnd = holidayEffectsRandomBetween(-18, 18).toFixed(2) + "vw";
  const opacity = holidayEffectsRandomBetween(config.opacity[0], config.opacity[1]).toFixed(2);
  const rotation = Math.round(holidayEffectsRandomBetween(-24, 24)) + "deg";
  particle.className = "holiday-particle";
  if (config.shape) {
    particle.classList.add("shape-" + config.shape);
  }
  if (config.motion === "float") {
    particle.classList.add("motion-float");
  } else if (config.motion === "sway") {
    particle.classList.add("motion-sway");
  }
  if (config.symbol) {
    particle.setAttribute("data-symbol", config.symbol);
  }
  particle.style.left = left.toFixed(2) + "%";
  particle.style.animationDuration = duration.toFixed(2) + "s";
  particle.style.animationDelay = delay.toFixed(2) + "s";
  particle.style.setProperty("--particle-size", size + "px");
  particle.style.setProperty("--drift-start", driftStart);
  particle.style.setProperty("--drift-end", driftEnd);
  particle.style.setProperty("--particle-opacity", opacity);
  particle.style.setProperty("--particle-rotate", rotation);
  if (Array.isArray(config.colors) && config.colors.length) {
    particle.style.setProperty("--particle-color", config.colors[Math.floor(Math.random() * config.colors.length)]);
  }
  return particle;
}

function holidayEffectsRenderParticles(theme) {
  const container = holidayEffectsParticlesEl();
  if (!container) return;
  container.innerHTML = "";
  const kinds = Array.isArray(theme && theme.particles) ? theme.particles : [];
  if (!kinds.length) return;
  const count = holidayEffectsCountForTheme(theme);
  for (let i = 0; i < count; i++) {
    container.appendChild(holidayEffectsCreateParticle(kinds[i % kinds.length]));
  }
}

function holidayEffectsResizeCanvas() {
  const canvas = holidayEffectsCanvasEl();
  if (!canvas) return;
  const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const width = window.innerWidth || document.documentElement.clientWidth || 360;
  const height = window.innerHeight || document.documentElement.clientHeight || 640;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  HOLIDAY_EFFECTS.fireworksContext = canvas.getContext("2d");
  if (HOLIDAY_EFFECTS.fireworksContext) {
    HOLIDAY_EFFECTS.fireworksContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

function holidayEffectsSpawnBurst() {
  const width = window.innerWidth || 360;
  const height = window.innerHeight || 640;
  const colors = ["#f59e0b", "#ef4444", "#ffffff", "#60a5fa", "#fde68a"];
  HOLIDAY_EFFECTS.fireworksBursts.push({
    x: holidayEffectsRandomBetween(width * 0.15, width * 0.85),
    y: holidayEffectsRandomBetween(height * 0.1, height * 0.55),
    radius: 0,
    maxRadius: holidayEffectsRandomBetween(30, 78),
    lineWidth: holidayEffectsRandomBetween(1.5, 3.8),
    alpha: 1,
    color: colors[Math.floor(Math.random() * colors.length)],
  });
}

function holidayEffectsFireworksTick() {
  const ctx = HOLIDAY_EFFECTS.fireworksContext;
  if (!ctx || !HOLIDAY_EFFECTS.activeTheme || HOLIDAY_EFFECTS.activeTheme.canvas !== "fireworks" || !HOLIDAY_EFFECTS.isVisible || document.hidden) {
    HOLIDAY_EFFECTS.fireworksFrame = null;
    return;
  }
  const width = window.innerWidth || 360;
  const height = window.innerHeight || 640;
  ctx.clearRect(0, 0, width, height);
  if (HOLIDAY_EFFECTS.fireworksBursts.length < 4 && Math.random() < 0.08) {
    holidayEffectsSpawnBurst();
  }
  HOLIDAY_EFFECTS.fireworksBursts = HOLIDAY_EFFECTS.fireworksBursts.filter((burst) => burst.alpha > 0.05);
  HOLIDAY_EFFECTS.fireworksBursts.forEach((burst) => {
    burst.radius += 1.7;
    burst.alpha *= 0.972;
    ctx.strokeStyle = burst.color;
    ctx.lineWidth = burst.lineWidth;
    ctx.globalAlpha = burst.alpha;
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      ctx.beginPath();
      ctx.moveTo(burst.x, burst.y);
      ctx.lineTo(
        burst.x + Math.cos(angle) * Math.min(burst.radius, burst.maxRadius),
        burst.y + Math.sin(angle) * Math.min(burst.radius, burst.maxRadius)
      );
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, Math.min(burst.radius * 0.2, 3), 0, Math.PI * 2);
    ctx.fillStyle = burst.color;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  HOLIDAY_EFFECTS.fireworksFrame = requestAnimationFrame(holidayEffectsFireworksTick);
}

function holidayEffectsStartCanvas(theme) {
  const canvas = holidayEffectsCanvasEl();
  if (!canvas) return;
  if (theme && theme.canvas === "fireworks") {
    holidayEffectsResizeCanvas();
    HOLIDAY_EFFECTS.fireworksBursts = [];
    holidayEffectsSpawnBurst();
    if (!HOLIDAY_EFFECTS.fireworksFrame) {
      HOLIDAY_EFFECTS.fireworksFrame = requestAnimationFrame(holidayEffectsFireworksTick);
    }
    canvas.style.display = "block";
  } else {
    holidayEffectsStopCanvas();
  }
}

function holidayEffectsStopCanvas() {
  const canvas = holidayEffectsCanvasEl();
  if (HOLIDAY_EFFECTS.fireworksFrame) {
    cancelAnimationFrame(HOLIDAY_EFFECTS.fireworksFrame);
    HOLIDAY_EFFECTS.fireworksFrame = null;
  }
  HOLIDAY_EFFECTS.fireworksBursts = [];
  if (HOLIDAY_EFFECTS.fireworksContext) {
    HOLIDAY_EFFECTS.fireworksContext.clearRect(0, 0, window.innerWidth || 360, window.innerHeight || 640);
  }
  if (canvas) {
    canvas.style.display = "none";
  }
}

function holidayEffectsDeactivate() {
  const layer = holidayEffectsLayerEl();
  const container = holidayEffectsParticlesEl();
  if (!layer) return;
  HOLIDAY_EFFECTS.activeTheme = null;
  layer.classList.remove("active");
  layer.classList.add("fading-out");
  layer.setAttribute("aria-hidden", "true");
  if (HOLIDAY_EFFECTS.particlesTimer) {
    clearTimeout(HOLIDAY_EFFECTS.particlesTimer);
    HOLIDAY_EFFECTS.particlesTimer = null;
  }
  holidayEffectsStopCanvas();
  setTimeout(function () {
    if (!HOLIDAY_EFFECTS.activeTheme && container) {
      container.innerHTML = "";
      layer.classList.remove("fading-out");
    }
  }, 450);
}

function holidayEffectsActivate(theme) {
  const layer = holidayEffectsLayerEl();
  if (!layer || !theme) return;
  HOLIDAY_EFFECTS.activeTheme = theme;
  holidayEffectsRenderParticles(theme);
  holidayEffectsStartCanvas(theme);
  layer.classList.remove("fading-out");
  layer.classList.add("active");
  layer.setAttribute("aria-hidden", "false");
}

export function holidayEffectsRefresh(force) {
  const api = holidayThemesApi();
  if (!api) return;
  const now = holidayEffectsToday();
  holidayEffectsClearDismissIfExpired(now);
  const anim = window.settingsHolidayAnimations !== undefined ? window.settingsHolidayAnimations : state.settingsHolidayAnimations;
  if (!anim || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    holidayEffectsDeactivate();
    return;
  }
  const theme = api.getHolidayThemeForDate(now);
  if (!theme || holidayEffectsIsDismissed(theme.id, now)) {
    holidayEffectsDeactivate();
    return;
  }
  if (!force && HOLIDAY_EFFECTS.activeTheme && HOLIDAY_EFFECTS.activeTheme.id === theme.id) {
    return;
  }
  holidayEffectsActivate(theme);
}

function holidayEffectsScheduleMidnightRefresh() {
  if (HOLIDAY_EFFECTS.midnightTimer) {
    clearTimeout(HOLIDAY_EFFECTS.midnightTimer);
  }
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2, 0);
  HOLIDAY_EFFECTS.midnightTimer = setTimeout(function () {
    holidayEffectsRefresh(true);
    holidayEffectsScheduleMidnightRefresh();
  }, Math.max(1000, next - now));
}

function holidayEffectsDismissCurrent() {
  if (!HOLIDAY_EFFECTS.activeTheme) return;
  holidayEffectsSetDismissPayload(HOLIDAY_EFFECTS.activeTheme.id, new Date());
  holidayEffectsDeactivate();
  showToast("Праздничная анимация скрыта до конца дня");
}

export function holidayEffectsInit() {
  if (HOLIDAY_EFFECTS.initialized) {
    holidayEffectsRefresh(true);
    return;
  }
  HOLIDAY_EFFECTS.initialized = true;
  const dismissBtn = holidayEffectsDismissEl();
  if (dismissBtn) {
    dismissBtn.addEventListener("click", function () {
      holidayEffectsDismissCurrent();
    });
  }
  document.addEventListener("visibilitychange", function () {
    HOLIDAY_EFFECTS.isVisible = !document.hidden;
    if (document.hidden) {
      holidayEffectsStopCanvas();
    } else {
      holidayEffectsRefresh(true);
    }
  });
  window.addEventListener("resize", function () {
    if (HOLIDAY_EFFECTS.activeTheme && HOLIDAY_EFFECTS.activeTheme.canvas === "fireworks") {
      holidayEffectsResizeCanvas();
    }
  });
  holidayEffectsScheduleMidnightRefresh();
  holidayEffectsRefresh(true);
}

export function renderHolidayPreviewToggles() {
  const api = holidayThemesApi();
  const container = document.getElementById("settingsHolidayPreviewToggles");
  if (!container || !api || !Array.isArray(api.HOLIDAY_THEME_DEFINITIONS)) return;
  try {
    const hp = localStorage.getItem(HOLIDAY_PREVIEW_STORAGE_KEY);
    if (hp) state.settingsHolidayPreview = hp;
  } catch (e) {}
  const options = [{ id: "auto", label: "Авто" }].concat(api.HOLIDAY_THEME_DEFINITIONS.map(function (item) {
    return { id: item.id, label: item.label };
  }));
  const preview = window.settingsHolidayPreview !== undefined ? window.settingsHolidayPreview : state.settingsHolidayPreview;
  container.innerHTML = options.map(function (item) {
    const activeClass = preview === item.id ? " active" : "";
    return '<button type="button" class="settings-preview-toggle' + activeClass + '" data-preview-id="' + escapeHtml(item.id) + '" onclick="setHolidayPreviewMode(\'' + escapeHtml(item.id) + '\')">' + escapeHtml(item.label) + "</button>";
  }).join("");
}

export function setHolidayPreviewMode(previewId) {
  state.settingsHolidayPreview = previewId || "auto";
  try {
    localStorage.setItem(HOLIDAY_PREVIEW_STORAGE_KEY, state.settingsHolidayPreview);
  } catch (e) {}
  renderHolidayPreviewToggles();
  holidayEffectsRefresh(true);
}
