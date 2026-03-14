import { state } from "./state.js";

const QUIZ_QUESTIONS = [
  { q: "Что такое SQL-инъекция?", options: ["Внедрение кода через запросы к БД", "Вид вируса", "Протокол шифрования", "Тип индекса"], correct: 0 },
  { q: "Какой порт по умолчанию у HTTPS?", options: ["80", "443", "8080", "22"], correct: 1 },
  { q: "Что означает ACL в контексте безопасности?", options: ["Access Control List", "Advanced Crypto Logic", "Application Check Layer", "Auto Certificate Loader"], correct: 0 },
  { q: "Что такое SELinux?", options: ["Модуль ядра Linux для разграничения доступа", "Антивирус", "Файловая система", "Сетевой протокол"], correct: 0 },
  { q: "Какой алгоритм симметричного шифрования часто используется в TLS?", options: ["RSA", "AES", "SHA-256", "ECDHE"], correct: 1 },
  { q: "Что такое LDAP?", options: ["Протокол каталогов для аутентификации", "Язык разметки", "СУБД", "Сетевой драйвер"], correct: 0 },
  { q: "Что проверяет целостность данных?", options: ["Шифрование", "Хеш-функция", "Сертификат", "Пароль"], correct: 1 },
  { q: "Что такое межсетевой экран (firewall)?", options: ["Устройство/ПО для фильтрации сетевого трафика", "Сервер БД", "Система резервного копирования", "Монитор"], correct: 0 },
  { q: "Какой протокол используется для безопасной передачи файлов?", options: ["FTP", "SFTP", "HTTP", "Telnet"], correct: 1 },
  { q: "Что такое Kerberos?", options: ["Протокол аутентификации по билетам", "Антивирус", "Файловая система", "Язык программирования"], correct: 0 },
  { q: "Что такое ОС в контексте «безопасность ОС»?", options: ["Операционная система", "Открытый стандарт", "Общая среда", "Онлайн-сервис"], correct: 0 },
  { q: "Какой тип атаки основан на переборе паролей?", options: ["Фишинг", "Brute force", "XSS", "DDoS"], correct: 1 },
];

export function openQuizFromMinigames() {
  if (typeof window.closeMinigamesModal === "function") window.closeMinigamesModal();
  quizStart();
  const overlay = document.getElementById("quizOverlay");
  if (overlay) overlay.classList.add("open");
}

export function closeQuizModal() {
  const overlay = document.getElementById("quizOverlay");
  if (overlay) overlay.classList.remove("open");
}

export function quizStart() {
  state.quizOrder = QUIZ_QUESTIONS.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 5);
  state.quizCurrentIndex = 0;
  state.quizScore = 0;
  state.quizAnswered = false;
  const resultEl = document.getElementById("quizResult");
  const bodyEl = document.getElementById("quizBody");
  if (resultEl) resultEl.style.display = "none";
  if (bodyEl) bodyEl.style.display = "block";
  quizRender();
}

export function quizRender() {
  const progressEl = document.getElementById("quizProgress");
  const scoreEl = document.getElementById("quizScore");
  const questionEl = document.getElementById("quizQuestion");
  const optionsEl = document.getElementById("quizOptions");
  if (!optionsEl || state.quizCurrentIndex >= (state.quizOrder || []).length) {
    quizShowResult();
    return;
  }
  const idx = state.quizOrder[state.quizCurrentIndex];
  const item = QUIZ_QUESTIONS[idx];
  if (progressEl) progressEl.textContent = "Вопрос " + (state.quizCurrentIndex + 1) + " из " + state.quizOrder.length;
  if (scoreEl) scoreEl.textContent = "Очки: " + state.quizScore;
  if (questionEl) questionEl.textContent = item.q;
  optionsEl.innerHTML = "";
  item.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option-btn";
    btn.textContent = opt;
    btn.onclick = () => quizAnswer(i);
    optionsEl.appendChild(btn);
  });
}

export function quizAnswer(choiceIndex) {
  if (state.quizAnswered) return;
  state.quizAnswered = true;
  const idx = state.quizOrder[state.quizCurrentIndex];
  const item = QUIZ_QUESTIONS[idx];
  const btns = document.querySelectorAll(".quiz-option-btn");
  const correct = item.correct === choiceIndex;
  if (correct) state.quizScore += 1;
  btns.forEach((b, i) => {
    b.disabled = true;
    if (i === item.correct) b.classList.add("quiz-option-correct");
    else if (i === choiceIndex && !correct) b.classList.add("quiz-option-wrong");
  });
  setTimeout(() => {
    state.quizCurrentIndex += 1;
    state.quizAnswered = false;
    quizRender();
  }, 1200);
}

export function quizShowResult() {
  const bodyEl = document.getElementById("quizBody");
  const resultEl = document.getElementById("quizResult");
  if (bodyEl) bodyEl.style.display = "none";
  if (resultEl) resultEl.style.display = "block";
  const order = state.quizOrder || [];
  const total = order.length;
  const bestKey = "quiz_best_score";
  let best = parseInt(localStorage.getItem(bestKey) || "0", 10);
  if (state.quizScore > best) {
    best = state.quizScore;
    localStorage.setItem(bestKey, String(best));
  }
  const titleEl = document.getElementById("quizResultTitle");
  const scoreEl = document.getElementById("quizResultScore");
  const bestEl = document.getElementById("quizResultBest");
  if (titleEl) titleEl.textContent = state.quizScore === total ? "Отлично! Все верно!" : "Викторина завершена";
  if (scoreEl) scoreEl.textContent = "Правильно: " + state.quizScore + " из " + total;
  if (bestEl) bestEl.textContent = "Лучший результат: " + best + " из " + total;
}
