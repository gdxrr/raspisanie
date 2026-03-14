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

const DEFAULT_MESSAGES = {
  400: "Неверный запрос",
  401: "Требуется авторизация",
  403: "Доступ запрещён",
  404: "Не найдено",
  500: "Ошибка сервера",
};

/**
 * Fetch wrapper: merges getApiHeaders, on !res.ok reads JSON error body, shows toast, throws.
 * @param {string} url
 * @param {{ method?: string, headers?: Record<string,string>, body?: string | FormData, json?: boolean }} options - json: true sets Content-Type and merges getApiHeaders(true)
 * @returns {Promise<Response>} - response (caller can await res.json() or res.text())
 */
export async function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const withJson = options.json === true || (method !== "GET" && method !== "HEAD" && !(options.body instanceof FormData));
  const headers = { ...getApiHeaders(withJson), ...options.headers };
  const fetchOpts = { method: options.method || "GET", headers };
  if (options.body !== undefined) fetchOpts.body = options.body;
  const res = await fetch(url, fetchOpts);
  if (!res.ok) {
    let message = DEFAULT_MESSAGES[res.status] || "Ошибка " + res.status;
    try {
      const data = await res.json();
      if (data && typeof data.message === "string" && data.message) message = data.message;
    } catch (_) {}
    showToast(message);
    const err = new Error(message);
    err.status = res.status;
    err.code = res.status;
    throw err;
  }
  return res;
}
