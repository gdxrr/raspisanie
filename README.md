# Расписание 3333

Telegram Mini App для группы 3333 ГУАП: расписание пар, дедлайны, напоминания в Telegram, голосования, рассылки старосты, мини-игры (2048, рулетка, монополия, D20 и др.).

## Стек

- **Backend:** Node.js, Express 5, PostgreSQL
- **Real-time:** WebSockets (рулетка, монополия, достижения)
- **Frontend:** один HTML-файл, ES-модули в `public/js/`, Telegram Web App SDK

## Запуск локально

### Требования

- Node.js 18+
- PostgreSQL (или Docker)

### 1. Переменные окружения

Скопируйте пример и задайте значения:

```bash
# Windows
copy .env-example .env

# Linux/macOS
cp .env-example .env
```

Отредактируйте `.env`:

- `DATABASE_URL` — строка подключения к PostgreSQL (например `postgresql://postgres:postgres@localhost:5432/tg`)
- `PORT` — порт приложения (по умолчанию 3000)
- `BOT_TOKEN` — токен Telegram-бота (для авторизации и напоминаний)
- `STAROSTA_ID`, `ADMIN_IDS` и др. — по необходимости (см. `.env-example`)

### 2. База данных

При первом запуске приложение само создаёт таблицы и при необходимости заполняет дедлайны (миграции в `src/db/index.js`).

Через Docker:

```bash
docker-compose up -d db
# Дождитесь старта PostgreSQL, затем запустите приложение
```

Без Docker — поднимите PostgreSQL и укажите `DATABASE_URL` в `.env`.

### 3. Запуск приложения

```bash
npm install
npm start
```

Сервер будет доступен по адресу `http://localhost:3000` (или по выбранному `PORT`).

## Тесты

```bash
npm test
```

Запускаются тесты из папки `test/` (Node.js `node:test`). Для тестов, требующих БД, задайте `DATABASE_URL` на тестовую базу.

## Основные переменные окружения

| Переменная        | Описание |
|-------------------|----------|
| `DATABASE_URL`    | Подключение к PostgreSQL |
| `PORT`            | Порт HTTP-сервера |
| `BOT_TOKEN`       | Токен Telegram-бота |
| `STAROSTA_ID`     | Telegram user id старосты |
| `ADMIN_IDS`       | Список id администраторов (через запятую) |
| `DEPUTY_STAROSTA_IDS` | Заместители старосты |
| `GROUP_SIZE`      | Размер группы (для ставок и т.п.) |

## Структура проекта

- `server.js` — точка входа, инициализация БД, WebSocket-хабы, cron напоминаний
- `src/app.js` — Express-приложение, маршруты `/api/*`
- `src/routes/` — маршруты API (schedule, deadlines, polls, broadcast и др.)
- `src/repositories/` — работа с БД
- `src/services/` — бизнес-логика и WebSocket (рулетка, монополия, напоминания)
- `src/lib/` — хелперы (валидация, экспорт в iCal, Telegram)
- `public/` — статика: `index.html`, `style.css`, `js/*.js`, `manifest.json`, `sw.js`
- `test/` — тесты
- `legacy/` — архив неиспользуемого кода (например старый монолит)

## API (кратко)

- `GET /api/schedule` — расписание (без авторизации для разработки)
- `POST /api/schedule` — сохранить расписание (требуется Telegram auth)
- `GET /api/schedule/export?format=ics&from=YYYY-MM-DD&to=YYYY-MM-DD` — экспорт в iCal или текст
- `GET /api/deadlines` — список дедлайнов
- Остальные маршруты — см. `src/routes/`
