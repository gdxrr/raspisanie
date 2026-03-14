import { state } from "./state.js";
import { getApiHeaders } from "./utils.js";

export async function loadBirthdays() {
  try {
    const [myRes, listRes] = await Promise.all([
      fetch("/api/birthday", { headers: getApiHeaders(false) }),
      fetch("/api/birthdays", { headers: getApiHeaders(false) }),
    ]);
    if (myRes.ok) {
      const b = await myRes.json();
      state.myBirthday = b.day != null && b.month != null ? { day: b.day, month: b.month } : null;
    }
    if (listRes.ok) {
      state.birthdaysList = await listRes.json();
      if (!Array.isArray(state.birthdaysList)) state.birthdaysList = [];
    }
  } catch (e) {
    console.error("Failed to load birthdays", e);
  }
}
