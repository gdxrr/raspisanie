export function escapeHtml(s) {
  if (s == null || s === "") return "";
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

export function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

export function getApiHeaders(withJson) {
  const headers = {};
  if (withJson) {
    headers["Content-Type"] = "application/json";
  }
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
    headers["X-Telegram-Init-Data"] = window.Telegram.WebApp.initData;
  }
  return headers;
}
