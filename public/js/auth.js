import { showToast } from "./utils.js";
import { state } from "./state.js";

const ADMIN_PASSWORD = "3333suai";

export function handleTitleTap() {
  state.tapCount++;
  const title = document.getElementById("groupTitle");
  const dots = document.getElementById("tapDots");

  if (title) {
    title.classList.remove("tapped");
    void title.offsetWidth;
    title.classList.add("tapped");
  }

  if (state.tapCount === 1 && dots) dots.style.display = "flex";
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById("td" + i);
    if (el) el.className = "tap-dot" + (i <= state.tapCount ? " lit" : "");
  }

  clearTimeout(state.tapTimer);

  if (state.tapCount >= 5) {
    state.tapCount = 0;
    setTimeout(() => {
      if (dots) dots.style.display = "none";
      for (let i = 1; i <= 5; i++) {
        const el = document.getElementById("td" + i);
        if (el) el.className = "tap-dot";
      }
    }, 300);
    if (state.isAdmin) {
      if (confirm("Выйти из режима администратора?")) {
        logoutAdmin();
      }
    } else {
      openAuthPopup();
    }
  } else {
    state.tapTimer = setTimeout(() => {
      state.tapCount = 0;
      if (dots) dots.style.display = "none";
      for (let i = 1; i <= 5; i++) {
        const el = document.getElementById("td" + i);
        if (el) el.className = "tap-dot";
      }
    }, 2000);
  }
}

export function openAuthPopup() {
  const input = document.getElementById("authInput");
  const err = document.getElementById("authError");
  if (input) input.value = "";
  if (err) err.textContent = "";
  if (input) input.className = "auth-input";
  const popup = document.getElementById("authPopup");
  if (popup) popup.classList.add("open");
  if (input) setTimeout(() => input.focus(), 300);
}

export function closeAuthPopup() {
  const popup = document.getElementById("authPopup");
  if (popup) popup.classList.remove("open");
}

export function toggleAuthEye() {
  const input = document.getElementById("authInput");
  const eye = document.getElementById("authEye");
  if (!input || !eye) return;
  input.type = input.type === "password" ? "text" : "password";
  eye.textContent = input.type === "password" ? "👁" : "🙈";
}

export function tryAuth() {
  const input = document.getElementById("authInput");
  const err = document.getElementById("authError");
  if (!input || !err) return;
  if (input.value === ADMIN_PASSWORD) {
    state.isAdmin = true;
    state.editMode = false;
    closeAuthPopup();
    const adminBadge = document.getElementById("adminBadge");
    if (adminBadge) adminBadge.classList.add("visible");
    const bottomBar = document.getElementById("bottomBar");
    if (bottomBar) bottomBar.classList.add("admin-visible");
    document.body.classList.add("admin-bar-visible");
    showToast("🔓 Режим администратора");
  } else {
    input.classList.add("error");
    err.textContent = "Неверный пароль";
    setTimeout(() => input.classList.remove("error"), 400);
    input.value = "";
  }
}

export function logoutAdmin() {
  state.isAdmin = false;
  state.editMode = false;
  const adminBadge = document.getElementById("adminBadge");
  if (adminBadge) adminBadge.classList.remove("visible");
  const bottomBar = document.getElementById("bottomBar");
  if (bottomBar) bottomBar.classList.remove("admin-visible");
  document.body.classList.remove("admin-bar-visible");
  const editBtn = document.getElementById("editToggleBtn");
  if (editBtn) editBtn.textContent = "✏️ Редактировать";
  const scheduleContainer = document.getElementById("scheduleContainer");
  if (scheduleContainer) scheduleContainer.classList.remove("edit-mode");
  showToast("🔒 Вышли из режима администратора");
}

export function initAuth() {
  const authPopup = document.getElementById("authPopup");
  if (authPopup) {
    authPopup.addEventListener("click", function (e) {
      if (e.target === this) closeAuthPopup();
    });
  }
}
