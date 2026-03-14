import { state } from "../core/state.js";

export function setupMainUi() {
  const headerTop = document.querySelector(".header-top");
  if (headerTop) {
    headerTop.innerHTML =
      '<div class="header-title-row">' +
      '<span class="header-theme-logo header-theme-logo-guap" id="headerThemeLogo" aria-hidden="true"><img src="assets/images/guap-icon.png" alt="ГУАП" width="28" height="28"></span>' +
      '<div class="header-title-block">' +
      '<div class="group-title" id="groupTitle" onclick="handleTitleTap()">3333</div>' +
      '<div class="header-meta-row">' +
      '<span class="custom-label custom-label-fan" id="fanLabel"></span>' +
      '<span class="role-badge" id="roleBadge"></span>' +
      '<span class="admin-badge" id="adminBadge" title="Режим администратора">Админ</span>' +
      "</div>" +
      "</div>" +
      '<div class="week-badge">' +
      '<button type="button" class="week-dot-btn" id="weekDotBtn" onclick="toggleWeekLabel()" title="Неделя" aria-label="Неделя">' +
      '<span class="week-dot" id="weekDot"></span>' +
      "</button>" +
      '<span class="week-label-popover" id="weekLabelPopover">Нечётная неделя</span>' +
      "</div>" +
      "</div>" +
      '<div class="header-actions">' +
      '<div class="view-switch" role="tablist" aria-label="Режим просмотра">' +
      '<button type="button" class="view-switch-btn" id="listViewBtn" onclick="setViewMode(\'list\')">Список</button>' +
      '<button type="button" class="view-switch-btn" id="calendarViewBtn" onclick="setViewMode(\'calendar\')">Календарь</button>' +
      "</div>" +
      '<button type="button" class="actions-btn actions-btn-more" onclick="openActionsModal()" title="Ещё" aria-label="Ещё">Ещё</button>' +
      "</div>";
  }

  const filterStrip = document.getElementById("scheduleFilterStrip");
  if (filterStrip) {
    if (!document.getElementById("scheduleOverview")) {
      const overview = document.createElement("section");
      overview.className = "schedule-overview";
      overview.id = "scheduleOverview";
      filterStrip.parentNode.insertBefore(overview, filterStrip);
    }
    filterStrip.innerHTML =
      '<button type="button" class="schedule-filter-btn" data-filter="today" onclick="setScheduleFilter(\'today\')">Сегодня</button>' +
      '<button type="button" class="schedule-filter-btn" data-filter="tomorrow" onclick="setScheduleFilter(\'tomorrow\')">Завтра</button>' +
      '<button type="button" class="schedule-filter-btn" data-filter="all" onclick="setScheduleFilter(\'all\')">Все</button>' +
      '<button type="button" class="schedule-filter-btn" data-filter="deadlines" onclick="setScheduleFilter(\'deadlines\')">Дедлайны</button>';
    filterStrip.querySelectorAll(".schedule-filter-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-filter") === state.scheduleFilter);
    });
  }

  const actionsHeader = document.querySelector(".actions-modal .modal-styled-header");
  if (actionsHeader) {
    actionsHeader.innerHTML =
      '<h2 class="modal-styled-title">Ещё возможностей</h2>' +
      '<p class="modal-section-desc">Основной экран сосредоточен на расписании, а дополнительные сценарии сгруппированы здесь.</p>';
  }

  const actionsBody = document.querySelector(".actions-modal-body");
  if (actionsBody) {
    actionsBody.classList.remove("modal-card");
    actionsBody.innerHTML =
      '<div class="modal-card action-group">' +
      '<div class="action-group-title">Учёба</div>' +
      '<div class="action-group-grid">' +
      '<button type="button" class="action-full-btn" data-action-id="deadlines" onclick="openDeadlinesFromActions()">📋 Дедлайны</button>' +
      '<button type="button" class="action-full-btn" data-action-id="reminders" onclick="openRemindersFromActions()">🔔 Напоминания о парах</button>' +
      '<button type="button" class="action-full-btn" data-action-id="progress" onclick="openProgressFromActions()">📊 Личный прогресс</button>' +
      '<button type="button" class="action-full-btn" data-action-id="polls" onclick="openPollsFromActions()">🗳️ Голосования</button>' +
      '<button type="button" class="action-full-btn" data-action-id="hiddenPairs" onclick="openHiddenPairsFromActions()">👁️ Скрытые пары</button>' +
      "</div>" +
      "</div>" +
      '<div class="modal-card action-group">' +
      '<div class="action-group-title">Коммуникация</div>' +
      '<div class="action-group-grid">' +
      '<button type="button" class="action-full-btn" data-action-id="starosta" onclick="openStarostaFromActions()">✉️ Написать старосте</button>' +
      '<div class="action-row" data-action-id="broadcast">' +
      '<span class="action-label" id="actionsBroadcastLabel">Рассылка группы</span>' +
      '<button type="button" class="btn-action" id="actionsBroadcastBtn" onclick="toggleBroadcastSubscriptionFromActions()">Подписаться</button>' +
      "</div>" +
      '<button type="button" class="action-full-btn action-starosta-only" id="actionWriteToParticipant" onclick="openWriteToParticipantFromActions()" style="display:none;">👤 Написать участнику</button>' +
      '<button type="button" class="action-full-btn action-starosta-only" id="actionBroadcastBtn" onclick="openBroadcastFromActions()" style="display:none;">📢 Рассылка</button>' +
      '<button type="button" class="action-full-btn" data-action-id="feedback" onclick="openFeedbackFromActions()">📩 Жалобы и предложения</button>' +
      "</div>" +
      "</div>" +
      '<div class="modal-card action-group">' +
      '<div class="action-group-title">Развлечения</div>' +
      '<div class="action-group-grid">' +
      '<button type="button" class="action-full-btn" data-action-id="roulette" onclick="openRouletteFromActions()">🎯 Рулетка</button>' +
      '<button type="button" class="action-full-btn" data-action-id="d20" onclick="openD20FromActions()">🎲 D20</button>' +
      '<button type="button" class="action-full-btn" data-action-id="monopoly" onclick="openMonopolyFromActions()">🏠 Монополия</button>' +
      '<button type="button" class="action-full-btn" data-action-id="achievements" onclick="openAchievementsFromActions()">🏆 Достижения группы</button>' +
      '<button type="button" class="action-full-btn" data-action-id="minigames" onclick="openMinigamesFromActions()">🎮 Мини-игры</button>' +
      "</div>" +
      "</div>" +
      '<div class="modal-card action-group">' +
      '<div class="action-group-title">Сервисы</div>' +
      '<div class="action-group-grid">' +
      '<button type="button" class="action-full-btn" data-action-id="settings" onclick="openSettingsFromActions()">⚙️ Настройки</button>' +
      '<button type="button" class="action-full-btn" data-action-id="likes" onclick="openLikesFromActions()">❤️ Лайки</button>' +
      '<button type="button" class="action-full-btn" data-action-id="guap-service" onclick="openGuapFromActions()">🏛 ЛК ГУАП</button>' +
      '<button type="button" class="action-full-btn" data-action-id="like-service" onclick="sendLikeFromActions()">❤️ Поставить лайк</button>' +
      "</div>" +
      "</div>";
  }
}
