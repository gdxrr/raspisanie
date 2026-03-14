import { state } from "../../shared/core/state.js";
import { PAIR_TIMES } from "../../shared/core/constants.js";
import { showToast } from "../../shared/core/utils.js";

export function toggleEditMode() {
  if (!state.isAdmin) return;
  state.editMode = !state.editMode;
  const btn = document.getElementById("editToggleBtn");
  const cont = document.getElementById("scheduleContainer");
  if (btn) btn.textContent = state.editMode ? "✅ Готово" : "✏️ Редактировать";
  if (cont) cont.classList.toggle("edit-mode", state.editMode);
}

export function deleteClass(id) {
  if (!state.isAdmin) return;
  state.schedule = state.schedule.filter((c) => c.id !== id);
  if (typeof window.saveData === "function") window.saveData();
  if (typeof window.renderSchedule === "function") window.renderSchedule();
  showToast("Пара удалена 🗑️");
}

export function updatePairTime() {
  const pairEl = document.getElementById("fPair");
  const displayEl = document.getElementById("fTimeDisplay");
  if (!pairEl || !displayEl) return;
  const t = PAIR_TIMES[pairEl.value];
  if (t) displayEl.textContent = t.start + " — " + t.end;
}

export function openAddModal() {
  if (!state.isAdmin) return;
  state.isEditing = false;
  state.editingId = null;
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

export function openEditModal(id) {
  if (!state.isAdmin) return;
  const schedule = state.schedule || [];
  const c = schedule.find((x) => x.id === id);
  if (!c) return;
  state.isEditing = true;
  state.editingId = id;
  const pn = Object.entries(PAIR_TIMES).find(([n, t]) => t.start === c.start)?.[0] || "1";
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

export function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

export function saveClass() {
  const subjEl = document.getElementById("fSubject");
  const subj = subjEl ? subjEl.value.trim() : "";
  if (!subj) {
    alert("Введите название предмета");
    return;
  }
  const pairEl = document.getElementById("fPair");
  const times = pairEl ? PAIR_TIMES[pairEl.value] : null;
  if (!times) return;
  const data = {
    subject: subj,
    type: (document.getElementById("fType") && document.getElementById("fType").value) || "lab",
    day: (document.getElementById("fDay") && document.getElementById("fDay").value) || "Понедельник",
    start: times.start,
    end: times.end,
    room: (document.getElementById("fRoom") && document.getElementById("fRoom").value.trim()) || "Б. Морская 67",
    teacher: (document.getElementById("fTeacher") && document.getElementById("fTeacher").value.trim()) || "",
    week: (document.getElementById("fWeek") && document.getElementById("fWeek").value) || "both",
  };

  const schedule = state.schedule || [];
  if (state.isEditing && state.editingId != null) {
    const idx = schedule.findIndex((c) => c.id === state.editingId);
    if (idx !== -1) {
      state.schedule = schedule.slice();
      state.schedule[idx] = { ...state.schedule[idx], ...data };
    }
    showToast("Пара обновлена ✅");
  } else {
    state.schedule = schedule.concat([{ id: state.nextId, ...data }]);
    state.nextId = state.nextId + 1;
    showToast("Пара добавлена ✅");
  }

  if (typeof window.saveData === "function") window.saveData();
  closeModal();
  if (typeof window.renderSchedule === "function") window.renderSchedule();
}

export function initEditSchedule() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this) closeModal();
    });
  }
}
