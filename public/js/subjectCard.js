import { state } from "./state.js";
import { showToast, getApiHeaders } from "./utils.js";

function getSubjectBackground(subject) {
  const key = subject == null ? "" : String(subject).trim();
  if (!key) return null;
  return state.subjectBackgroundsBySubject[key] || null;
}

export function openSubjectCard(classId) {
  if (state.editMode) return;
  ensureSubjectCardControls();
  const schedule = state.schedule || [];
  const c = schedule.find((x) => x.id === classId);
  if (!c) return;
  state.subjectCardClassId = classId;
  const titleEl = document.getElementById("subjectCardTitle");
  const metaEl = document.getElementById("subjectCardMeta");
  const imgEl = document.getElementById("subjectCardImage");
  const emptyEl = document.getElementById("subjectCardEmpty");
  const bgInfoEl = document.getElementById("subjectCardBackgroundInfo");
  const fileEl = document.getElementById("subjectBackgroundInput");
  if (titleEl) titleEl.textContent = c.subject || "Предмет";
  if (metaEl) {
    const metaParts = [c.day, c.start && c.end ? `${c.start} - ${c.end}` : c.start, c.teacher].filter(Boolean);
    metaEl.textContent = metaParts.join(" · ");
  }
  const subjectBg = getSubjectBackground(c.subject);
  const isDavydov = c.teacher && String(c.teacher).indexOf("Давыдов В.В.") !== -1;
  const previewSrc = subjectBg && subjectBg.dataUrl ? subjectBg.dataUrl : (isDavydov ? "davydov-card.png" : "");
  if (imgEl) {
    if (previewSrc) imgEl.src = previewSrc;
    else imgEl.removeAttribute("src");
    imgEl.alt = c.subject || "";
    imgEl.style.display = previewSrc ? "block" : "none";
  }
  if (emptyEl) {
    emptyEl.style.display = previewSrc ? "none" : "flex";
    emptyEl.textContent = subjectBg && subjectBg.dataUrl
      ? ""
      : isDavydov
        ? "Спецкарточка предмета"
        : "Фон для предмета пока не задан";
  }
  if (bgInfoEl) {
    bgInfoEl.textContent = subjectBg && subjectBg.updatedAt
      ? "Пользовательский фон сохранен"
      : "Можно загрузить PNG или JPG до 1 МБ";
  }
  if (fileEl) fileEl.value = "";
  document.getElementById("subjectCardOverlay").classList.add("open");
}

export function closeSubjectCard() {
  state.subjectCardClassId = null;
  const fileEl = document.getElementById("subjectBackgroundInput");
  if (fileEl) fileEl.value = "";
  document.getElementById("subjectCardOverlay").classList.remove("open");
}

function ensureSubjectCardControls() {
  const modal = document.querySelector("#subjectCardOverlay .subject-card-modal");
  const actions = modal ? modal.querySelector(".modal-actions") : null;
  const imageWrap = modal ? modal.querySelector(".subject-card-image-wrap") : null;
  if (!modal || !actions || !imageWrap) return;

  if (!document.getElementById("subjectCardEmpty")) {
    const emptyEl = document.createElement("div");
    emptyEl.id = "subjectCardEmpty";
    emptyEl.className = "subject-card-empty";
    emptyEl.textContent = "Фон для предмета пока не задан";
    imageWrap.appendChild(emptyEl);
  }

  if (!document.getElementById("subjectCardBackgroundInfo")) {
    const infoEl = document.createElement("div");
    infoEl.id = "subjectCardBackgroundInfo";
    infoEl.className = "subject-card-background-info";
    infoEl.textContent = "Можно загрузить PNG или JPG до 1 МБ";
    actions.parentNode.insertBefore(infoEl, actions);
  }

  if (!document.getElementById("subjectBackgroundInput")) {
    const groupEl = document.createElement("div");
    groupEl.className = "form-group";
    groupEl.innerHTML =
      '<label class="form-label" for="subjectBackgroundInput">Фон предмета</label>' +
      '<input class="form-input" id="subjectBackgroundInput" type="file" accept="image/png,image/jpeg" onchange="handleSubjectBackgroundSelected(this)">';
    actions.parentNode.insertBefore(groupEl, actions);
  }

  if (!document.getElementById("subjectCardResetBtn")) {
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.id = "subjectCardResetBtn";
    resetBtn.className = "btn-secondary";
    resetBtn.textContent = "Сбросить фон";
    resetBtn.setAttribute("onclick", "resetSubjectBackground()");
    actions.insertBefore(resetBtn, actions.firstChild);
  }

  if (!document.getElementById("subjectCardSaveBtn")) {
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.id = "subjectCardSaveBtn";
    saveBtn.className = "btn-secondary";
    saveBtn.textContent = "Сохранить фон";
    saveBtn.setAttribute("onclick", "saveSubjectBackground()");
    const closeBtn = actions.querySelector(".btn-primary");
    if (closeBtn) actions.insertBefore(saveBtn, closeBtn);
    else actions.appendChild(saveBtn);
  }
}

export function handleSubjectBackgroundSelected(inputEl) {
  if (!inputEl || !inputEl.files || !inputEl.files.length) return;
  const file = inputEl.files[0];
  if (!file || (file.type !== "image/png" && file.type !== "image/jpeg")) {
    showToast("Нужен PNG или JPG");
    inputEl.value = "";
    return;
  }
  if (file.size > 1024 * 1024) {
    showToast("Файл должен быть не больше 1 МБ");
    inputEl.value = "";
    return;
  }
  const bgInfoEl = document.getElementById("subjectCardBackgroundInfo");
  if (bgInfoEl) bgInfoEl.textContent = "Выбран файл: " + file.name;
}

export async function saveSubjectBackground() {
  const schedule = state.schedule || [];
  const classId = state.subjectCardClassId;
  const c = schedule.find((item) => item.id === classId);
  const inputEl = document.getElementById("subjectBackgroundInput");
  if (!c || !inputEl || !inputEl.files || !inputEl.files.length) {
    showToast("Сначала выберите изображение");
    return;
  }

  const file = inputEl.files[0];
  if (!file || (file.type !== "image/png" && file.type !== "image/jpeg")) {
    showToast("Нужен PNG или JPG");
    inputEl.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("subject", c.subject || "");
  formData.append("background", file);

  try {
    const res = await fetch("/api/subject-backgrounds", {
      method: "POST",
      headers: getApiHeaders(false),
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data && data.error === "background_too_large") showToast("Файл должен быть не больше 1 МБ");
      else if (data && data.error === "unsupported_mime_type") showToast("Нужен PNG или JPG");
      else if (data && data.error === "invalid_subject") showToast("Предмет не найден");
      else showToast("Не удалось сохранить фон");
      return;
    }
    if (data && data.subject && data.background && data.background.dataUrl) {
      state.subjectBackgroundsBySubject[data.subject] = {
        dataUrl: data.background.dataUrl,
        updatedAt: data.background.updatedAt || null,
      };
    }
    inputEl.value = "";
    openSubjectCard(c.id);
    if (typeof window.renderSchedule === "function") window.renderSchedule();
    showToast("Фон сохранен");
  } catch (e) {
    console.error("Failed to save subject background", e);
    showToast("Ошибка сети");
  }
}

export async function resetSubjectBackground() {
  const schedule = state.schedule || [];
  const classId = state.subjectCardClassId;
  const c = schedule.find((item) => item.id === classId);
  if (!c || !c.subject) return;
  try {
    const res = await fetch("/api/subject-backgrounds?subject=" + encodeURIComponent(c.subject), {
      method: "DELETE",
      headers: getApiHeaders(false),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data && data.error === "invalid_subject") showToast("Предмет не найден");
      else showToast("Не удалось сбросить фон");
      return;
    }
    delete state.subjectBackgroundsBySubject[c.subject];
    openSubjectCard(c.id);
    if (typeof window.renderSchedule === "function") window.renderSchedule();
    showToast("Фон сброшен");
  } catch (e) {
    console.error("Failed to reset subject background", e);
    showToast("Ошибка сети");
  }
}
