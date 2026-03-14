# Как ещё разнести app.js

В `app.js` сейчас ~4800 строк и ~100 функций. Ниже — логичные блоки, которые можно выносить в отдельные модули по одному.

---

## 1. Константы и хелперы в начале (строки ~1–67)

- **PAIR_TIMES**, **pairNum**, **defaultSchedule** — уже есть в `public/js/constants.js`, в app.js остались дубликаты. Можно удалить из app.js и везде использовать глобалы из main (уже проброшены).
- **Дедлайны-хелперы**: `isDeadlineVisible`, `getDeadlinesOnDate`, `formatDeadlineDate`, `shortDeadlineTask` — перенести в модуль **deadlines.js** (см. блок 4).

---

## 2. Загрузка расписания и ядро списка (~68–530)

| Что | Куда | Примечание |
|-----|------|------------|
| `loadSchedule`, `loadSubjectBackgrounds`, `saveData` | **scheduleLoad.js** или оставить в app | Загрузка/сохранение расписания и фонов предметов |
| `setViewMode`, `syncViewToggleButtons`, `init` | **viewMode.js** или оставить | Переключение список/календарь и init |
| `getDayClassesForDate`, `getEffectiveClassesForDate`, `classTimeMinutes` | **schedule.js** (уже есть в плане) | Хелперы для отображения пар |
| `renderScheduleOverview`, `setScheduleFilter`, `renderSchedule` | Оставить в app или **schedule.js** | Большая функция `renderSchedule` — ядро списка |

Имеет смысл вынести в один модуль **scheduleList.js**: загрузку (`loadSchedule`, `loadSubjectBackgrounds`, `saveData`), хелперы (`getDayClassesForDate`, `getEffectiveClassesForDate`, `classTimeMinutes`), отрисовку списка и overview (`renderSchedule`, `renderScheduleOverview`, `setScheduleFilter`), плюс `init` и переключение вида (`setViewMode`, `syncViewToggleButtons`). Тогда app.js остаётся точкой входа, которая только вызывает `setupMainUi()` и `loadSchedule()`.

---

## 3. Календарь (~530–772)

Функции: `getDaysWithClasses`, `toggleCalendarView`, `calendarPrevMonth`, `calendarNextMonth`, `renderCalendar`, `openCalendarDayModal`, `closeCalendarDayModal`.

Вынести в **calendar.js** (модуль уже есть в `public/js/` — проверить, что там, и при необходимости перенести сюда весь этот блок).

---

## 4. Дедлайны (~40–52, 860–951, 1247–1366)

- Хелперы: `isDeadlineVisible`, `getDeadlinesOnDate`, `formatDeadlineDate`, `shortDeadlineTask`.
- Модалка и логика: `openDeadlinesModal`, `buildDeadlinesRemindersGrid`, `loadDeadlineRemindersIntoModal`, `closeDeadlinesModal`, `changeDeadlinesSort`, `toggleDeadlinesVisibilitySection`, `toggleDeadlinesRemindersSection`, `saveDeadlinesVisibility`, `saveDeadlineReminders`.

Один модуль **deadlines.js**: хелперы + всё по модалке дедлайнов и напоминаниям.

---

## 5. Модалка «Ещё» и точки входа (~793–860, 1367–1401)

- **actionsModal.js**: `openActionsModal`, `closeActionsModal` + все `open*FromActions()` (openStarostaFromActions, openWriteToParticipantFromActions, openBroadcastFromActions, openRemindersFromActions, openDeadlinesFromActions, openProgressFromActions, openPollsFromActions, openGuapFromActions, openGuapLk, openFeedbackFromActions, openLikesFromActions, openCasinoFromActions, openMinigamesFromActions, openMonopolyFromActions, openAchievementsFromActions, openD20FromActions, openBetsFromActions, sendLikeFromActions), плюс `toggleWeekLabel`.

Либо оставить в app.js только эти «тонкие» обёртки, которые закрывают модалку и открывают нужный экран — тогда они остаются в одном месте.

---

## 6. День рождения и напоминания

- `loadBirthdays` — уже используется из app.js и settings; можно вынести в **birthdays.js** и вызывать из app/settings через `window.loadBirthdays`.
- Напоминания о парах — если есть отдельный блок (reminders), вынести в **reminders.js**.

---

## 7. Прогресс (личный прогресс) (~999–1090)

`openProgressModal`, `renderProgress`, `toggleProgressItem`, `closeProgressModal` → **progress.js**.

---

## 8. Голосования (polls) (~1091–1246)

`openPollsModal`, `loadPolls`, `renderPolls`, `votePoll`, `closePoll`, `closePollsModal`, `openCreatePollModal`, `closeCreatePollModal`, `submitCreatePoll` → **polls.js**.

---

## 9. Староста и «написать участнику»

- Староста: модалка и отправка сообщения старосте.
- Написать участнику: `openWriteToParticipantModal` и связанное.

Один модуль **starosta.js** (или два: starosta.js + writeToParticipant.js).

---

## 10. Обратная связь и лайки

- Feedback: открытие модалки, отправка.
- Лайки: `sendLike`, `sendLikeFromActions`, `openLikesModal`, `closeLikesModal` → **feedback.js** и **likes.js** (или один **feedbackLikes.js**).

---

## 11. Мини-игры (~1402–1818 и дальше)

- Общая модалка: `openMinigamesFromActions`, `closeMinigamesModal`, все `open*FromMinigames()`.
- **2048**: все `game2048*` → **game2048.js**.
- **Block Blast**: `openBlockBlastFromMinigames`, `closeBlockBlastModal` + логика блоков → **blockBlast.js**.
- **Quiz**: `openQuizFromMinigames`, `closeQuizModal`, `quizStart`, `quizRender`, `quizAnswer`, `quizShowResult` → **quiz.js**.

Либо один **minigames.js** с подвызовами, либо отдельные файлы под каждую игру.

---

## 12. Рулетка, D20, Монополия, Достижения

Большие блоки с сокетами/API:

- Рулетка → **roulette.js**
- D20 → **d20.js**
- Монополия → **monopoly.js**
- Достижения → **achievements.js**

В каждом — своя модалка, состояние (уже в state), отрисовка и запросы.

---

## 13. Скрытые пары

Если в app.js есть блок «скрытые пары» (скрытие/показ пар в расписании), вынести в **hiddenPairs.js**.

---

## Рекомендуемый порядок выноса

1. **Удалить дубликаты** в начале app.js: PAIR_TIMES, pairNum, defaultSchedule (использовать из constants / window).
2. **deadlines.js** — хелперы + модалка дедлайнов и напоминания (логически цельный блок).
3. **scheduleList.js** (или расширить существующий schedule) — loadSchedule, saveData, loadSubjectBackgrounds, renderSchedule, renderScheduleOverview, setScheduleFilter, init, setViewMode.
4. **calendar.js** — весь блок календаря (если ещё не вынесен).
5. **polls.js** — голосования.
6. **progress.js** — личный прогресс.
7. **game2048.js** — игра 2048.
8. Остальные по желанию: starosta, feedback, likes, reminders, quiz, blockBlast, roulette, d20, monopoly, achievements.

После каждого выноса: в **main.js** импортировать модуль и повесить нужные функции на `window` для `onclick` и вызовов из app.js; из app.js удалить перенесённый код и заменить вызовы на `window.*` при необходимости.
