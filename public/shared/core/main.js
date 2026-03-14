import { escapeHtml, showToast, getApiHeaders } from "./utils.js";
import * as constants from "./constants.js";
import { state } from "./state.js";
import {
  holidayEffectsInit,
  holidayEffectsRefresh,
  renderHolidayPreviewToggles,
  setHolidayPreviewMode,
} from "../effects/holidayEffects.js";
import {
  getAcademicWeekNum,
  getWeekType,
  getPeriodAfterTeaching,
  getHolidayLabel,
  getBirthdaysOnDate,
  isHolidayDate,
  isPreHolidayDate,
  isSaturdayEvenWeekend,
  formatDate,
} from "./dates.js";
import {
  handleTitleTap,
  openAuthPopup,
  closeAuthPopup,
  toggleAuthEye,
  tryAuth,
  logoutAdmin,
  initAuth,
} from "../auth/auth.js";
import {
  openSubjectCard,
  closeSubjectCard,
  handleSubjectBackgroundSelected,
  saveSubjectBackground,
  resetSubjectBackground,
} from "../features/schedule/subjectCard.js";
import {
  toggleEditMode,
  deleteClass,
  updatePairTime,
  openAddModal,
  openEditModal,
  closeModal,
  saveClass,
  initEditSchedule,
} from "../features/schedule/editSchedule.js";
import {
  openBroadcastModal,
  closeBroadcastModal,
  sendBroadcast,
  loadBroadcastStatus,
  updateRoleBadge,
  closeBroadcastOfferModal,
  acceptBroadcastOffer,
  updateBroadcastSubUI,
  updateStarostaOnlyUI,
  toggleBroadcastSubscription,
  toggleBroadcastSubscriptionFromActions,
  initBroadcast,
} from "../features/broadcast/broadcast.js";
import {
  loadSettings,
  applyTheme,
  setupThemeAutoListener,
  openSettingsFromActions,
  closeSettingsModal,
  saveSettings,
} from "../ui/settings.js";
import { setupMainUi } from "../ui/setupMainUi.js";
import {
  isDeadlineVisible,
  getDeadlinesOnDate,
  formatDeadlineDate,
  shortDeadlineTask,
  openDeadlinesModal,
  buildDeadlinesRemindersGrid,
  loadDeadlineRemindersIntoModal,
  closeDeadlinesModal,
  changeDeadlinesSort,
  toggleDeadlinesVisibilitySection,
  toggleDeadlinesRemindersSection,
  saveDeadlinesVisibility,
  saveDeadlineReminders,
} from "../features/deadlines/deadlines.js";
import {
  getDaysWithClasses,
  toggleCalendarView,
  calendarPrevMonth,
  calendarNextMonth,
  renderCalendar,
  openCalendarDayModal,
  closeCalendarDayModal,
} from "../features/schedule/calendar.js";
import {
  openProgressModal,
  renderProgress,
  toggleProgressItem,
  closeProgressModal,
} from "../features/progress/progress.js";
import {
  openPollsModal,
  loadPolls,
  renderPolls,
  votePoll,
  closePoll,
  closePollsModal,
  openCreatePollModal,
  closeCreatePollModal,
  submitCreatePoll,
} from "../features/polls/polls.js";
import { loadBirthdays } from "../features/birthdays/birthdays.js";
import {
  openGame2048FromMinigames,
  closeGame2048Modal,
  game2048NewGame,
  game2048LoadLeaderboard,
  game2048ToggleLeaderboard,
  game2048SetupInput,
} from "../features/games/game2048/game2048.js";
import {
  openQuizFromMinigames,
  closeQuizModal,
  quizStart,
  quizRender,
  quizAnswer,
  quizShowResult,
} from "../games/quiz.js";
import {
  closeMinigamesModal,
  openBlockBlastFromMinigames,
  closeBlockBlastModal,
  openCasinoFromMinigames,
  openBetsFromMinigames,
  openMonopolyFromMinigames,
  openD20FromMinigames,
} from "../games/minigames.js";
import {
  loadSchedule,
  loadSubjectBackgrounds,
  saveData,
  setViewMode,
  syncViewToggleButtons,
  init,
  getDayClassesForDate,
  setScheduleFilter,
  renderSchedule,
  renderScheduleOverview,
} from "../features/schedule/scheduleList.js";
import {
  openActionsModal,
  closeActionsModal,
  openStarostaFromActions,
  openWriteToParticipantFromActions,
  openBroadcastFromActions,
  openRemindersFromActions,
  openDeadlinesFromActions,
  openProgressFromActions,
  openPollsFromActions,
  openGuapLk,
  toggleWeekLabel,
  openGuapFromActions,
  openFeedbackFromActions,
  exportScheduleFromActions,
  openLikesFromActions,
  openCasinoFromActions,
  openMinigamesFromActions,
  openMonopolyFromActions,
  openAchievementsFromActions,
  openD20FromActions,
  openBetsFromActions,
  sendLikeFromActions,
} from "../ui/actionsModal.js";
import {
  openAchievementsModal,
  closeAchievementsModal,
  achievementsSubmitCreate,
  initAchievements,
} from "../features/achievements/achievements.js";
import {
  openRouletteModal,
  closeRouletteModal,
  rouletteAddDraftBet,
  rouletteRemoveDraftBet,
  rouletteClearDraft,
  rouletteSelectChip,
  rouletteSyncChipInput,
  rouletteSubmitDraft,
  rouletteSubmitGrant,
  initRoulette,
} from "../features/games/roulette/roulette.js";
import {
  openMonopolyModal,
  closeMonopolyModal,
  monopolyCreateRoom,
  monopolyJoinRoom,
  monopolySetReady,
  monopolyStartGame,
  monopolyBid,
  monopolyOfferTrade,
  monopolyRespondTrade,
  monopolyRequestLeave,
  monopolyVoteLeave,
  monopolyUploadToken,
  initMonopoly,
} from "../features/games/monopoly/monopoly.js";
import {
  openD20Modal,
  closeD20Modal,
  d20SetDc,
  d20AddModifier,
  d20ToggleModifier,
  d20RemoveModifier,
  d20ChangePalette,
  d20UploadTexture,
  d20ResetSkin,
  d20Roll,
  d20LoadState,
  initD20,
} from "../features/games/d20/d20.js";
import {
  openCasinoModal,
  closeCasinoModal,
  spinSlots,
  initCasino,
} from "../games/casino.js";
import {
  sendLike,
  openLikesModal,
  closeLikesModal,
  initLikes,
} from "../features/likes/likes.js";
import {
  openBetsModal,
  closeBetsModal,
  saveBet,
  initBets,
} from "../features/bets/bets.js";
import {
  blockBlastRestart,
  initBlockBlast,
} from "../games/blockBlast.js";
import {
  openHiddenPairsFromActions,
  openHiddenPairsModal,
  closeHiddenPairsModal,
  saveHiddenPairs,
  openRemindersModal,
  closeRemindersModal,
  saveReminders,
  openWriteToParticipantModal,
  closeWriteToParticipantModal,
  sendToParticipant,
  openStarostaModal,
  closeStarostaModal,
  sendStarostaMessage,
  openFeedbackModal,
  closeFeedbackModal,
  sendFeedback,
  initParticipantModals,
} from "../ui/participantModals.js";

function registerAppGlobals() {
  window.escapeHtml = escapeHtml;
  window.showToast = showToast;
  window.getApiHeaders = getApiHeaders;
  window.state = state;
  window.getSubjectBackground = (subject) => {
    const key = subject == null ? "" : String(subject).trim();
    if (!key) return null;
    return state.subjectBackgroundsBySubject[key] || null;
  };
  const stateKeys = [
    "schedule", "hiddenPairIds", "dimmedPairIds", "subjectBackgroundsBySubject",
    "viewMode", "scheduleFilter", "settingsTheme", "settingsVuc", "myBirthday", "birthdaysList",
    "settingsShowBirthdays", "settingsHolidayAnimations", "hiddenActionIds",
    "editMode", "editingId", "nextId", "isAdmin", "tapCount", "tapTimer",
    "deadlinesVisibleBySubject", "deadlinesSort", "calendarMonth", "subjectCardClassId",
    "rouletteState", "rouletteSelectedChip", "d20State", "monopolyState", "achievementsState",
    "isEditing", "broadcastSubscribed", "isStarosta", "userRole", "progressData", "pollsListData",
    "quizCurrentIndex", "quizScore", "quizOrder", "quizAnswered",
    "game2048Grid", "game2048Score", "game2048Over", "game2048FromGrid", "game2048Leaderboard",
    "blockBlastGrid", "blockBlastPieces", "blockBlastScore", "blockBlastSelectedPieceIndex",
    "blockBlastGameOver", "blockBlastDraggedPieceIndex", "blockBlastTouchPlaced",
  ];
  for (const key of stateKeys) {
    if (!(key in state)) continue;
    Object.defineProperty(window, key, {
      get() { return state[key]; },
      set(v) { state[key] = v; },
      configurable: true,
    });
  }
  Object.assign(window, constants);
  window.holidayEffectsInit = holidayEffectsInit;
  window.holidayEffectsRefresh = holidayEffectsRefresh;
  window.renderHolidayPreviewToggles = renderHolidayPreviewToggles;
  window.setHolidayPreviewMode = setHolidayPreviewMode;
  window.getAcademicWeekNum = getAcademicWeekNum;
  window.getWeekType = getWeekType;
  window.getPeriodAfterTeaching = getPeriodAfterTeaching;
  window.getHolidayLabel = getHolidayLabel;
  window.getBirthdaysOnDate = getBirthdaysOnDate;
  window.isHolidayDate = isHolidayDate;
  window.isPreHolidayDate = isPreHolidayDate;
  window.isSaturdayEvenWeekend = isSaturdayEvenWeekend;
  window.formatDate = formatDate;
  window.handleTitleTap = handleTitleTap;
  window.openAuthPopup = openAuthPopup;
  window.closeAuthPopup = closeAuthPopup;
  window.toggleAuthEye = toggleAuthEye;
  window.tryAuth = tryAuth;
  window.logoutAdmin = logoutAdmin;
  window.openSubjectCard = openSubjectCard;
  window.closeSubjectCard = closeSubjectCard;
  window.handleSubjectBackgroundSelected = handleSubjectBackgroundSelected;
  window.saveSubjectBackground = saveSubjectBackground;
  window.resetSubjectBackground = resetSubjectBackground;
  window.toggleEditMode = toggleEditMode;
  window.deleteClass = deleteClass;
  window.updatePairTime = updatePairTime;
  window.openAddModal = openAddModal;
  window.openEditModal = openEditModal;
  window.closeModal = closeModal;
  window.saveClass = saveClass;
  window.openBroadcastModal = openBroadcastModal;
  window.closeBroadcastModal = closeBroadcastModal;
  window.sendBroadcast = sendBroadcast;
  window.loadBroadcastStatus = loadBroadcastStatus;
  window.updateRoleBadge = updateRoleBadge;
  window.closeBroadcastOfferModal = closeBroadcastOfferModal;
  window.acceptBroadcastOffer = acceptBroadcastOffer;
  window.updateBroadcastSubUI = updateBroadcastSubUI;
  window.updateStarostaOnlyUI = updateStarostaOnlyUI;
  window.toggleBroadcastSubscription = toggleBroadcastSubscription;
  window.toggleBroadcastSubscriptionFromActions = toggleBroadcastSubscriptionFromActions;
  window.loadSettings = loadSettings;
  window.applyTheme = applyTheme;
  window.openSettingsFromActions = openSettingsFromActions;
  window.closeSettingsModal = closeSettingsModal;
  window.saveSettings = saveSettings;
  window.setupMainUi = setupMainUi;
  window.isDeadlineVisible = isDeadlineVisible;
  window.getDeadlinesOnDate = getDeadlinesOnDate;
  window.formatDeadlineDate = formatDeadlineDate;
  window.shortDeadlineTask = shortDeadlineTask;
  window.openDeadlinesModal = openDeadlinesModal;
  window.buildDeadlinesRemindersGrid = buildDeadlinesRemindersGrid;
  window.loadDeadlineRemindersIntoModal = loadDeadlineRemindersIntoModal;
  window.closeDeadlinesModal = closeDeadlinesModal;
  window.changeDeadlinesSort = changeDeadlinesSort;
  window.toggleDeadlinesVisibilitySection = toggleDeadlinesVisibilitySection;
  window.toggleDeadlinesRemindersSection = toggleDeadlinesRemindersSection;
  window.saveDeadlinesVisibility = saveDeadlinesVisibility;
  window.saveDeadlineReminders = saveDeadlineReminders;
  window.getDaysWithClasses = getDaysWithClasses;
  window.toggleCalendarView = toggleCalendarView;
  window.calendarPrevMonth = calendarPrevMonth;
  window.calendarNextMonth = calendarNextMonth;
  window.renderCalendar = renderCalendar;
  window.openCalendarDayModal = openCalendarDayModal;
  window.closeCalendarDayModal = closeCalendarDayModal;
  window.openProgressModal = openProgressModal;
  window.renderProgress = renderProgress;
  window.toggleProgressItem = toggleProgressItem;
  window.closeProgressModal = closeProgressModal;
  window.openPollsModal = openPollsModal;
  window.loadPolls = loadPolls;
  window.renderPolls = renderPolls;
  window.votePoll = votePoll;
  window.closePoll = closePoll;
  window.closePollsModal = closePollsModal;
  window.openCreatePollModal = openCreatePollModal;
  window.closeCreatePollModal = closeCreatePollModal;
  window.submitCreatePoll = submitCreatePoll;
  window.loadBirthdays = loadBirthdays;
  window.openGame2048FromMinigames = openGame2048FromMinigames;
  window.closeGame2048Modal = closeGame2048Modal;
  window.game2048NewGame = game2048NewGame;
  window.game2048LoadLeaderboard = game2048LoadLeaderboard;
  window.game2048ToggleLeaderboard = game2048ToggleLeaderboard;
  window.game2048SetupInput = game2048SetupInput;
  window.openQuizFromMinigames = openQuizFromMinigames;
  window.closeQuizModal = closeQuizModal;
  window.quizStart = quizStart;
  window.quizRender = quizRender;
  window.quizAnswer = quizAnswer;
  window.quizShowResult = quizShowResult;
  window.closeMinigamesModal = closeMinigamesModal;
  window.openBlockBlastFromMinigames = openBlockBlastFromMinigames;
  window.closeBlockBlastModal = closeBlockBlastModal;
  window.openCasinoFromMinigames = openCasinoFromMinigames;
  window.openBetsFromMinigames = openBetsFromMinigames;
  window.openMonopolyFromMinigames = openMonopolyFromMinigames;
  window.openD20FromMinigames = openD20FromMinigames;
  window.loadSchedule = loadSchedule;
  window.loadSubjectBackgrounds = loadSubjectBackgrounds;
  window.saveData = saveData;
  window.setViewMode = setViewMode;
  window.syncViewToggleButtons = syncViewToggleButtons;
  window.init = init;
  window.getDayClassesForDate = getDayClassesForDate;
  window.setScheduleFilter = setScheduleFilter;
  window.renderSchedule = renderSchedule;
  window.renderScheduleOverview = renderScheduleOverview;
  window.openActionsModal = openActionsModal;
  window.closeActionsModal = closeActionsModal;
  window.openStarostaFromActions = openStarostaFromActions;
  window.openWriteToParticipantFromActions = openWriteToParticipantFromActions;
  window.openBroadcastFromActions = openBroadcastFromActions;
  window.openRemindersFromActions = openRemindersFromActions;
  window.openDeadlinesFromActions = openDeadlinesFromActions;
  window.openProgressFromActions = openProgressFromActions;
  window.openPollsFromActions = openPollsFromActions;
  window.openGuapLk = openGuapLk;
  window.toggleWeekLabel = toggleWeekLabel;
  window.openGuapFromActions = openGuapFromActions;
  window.openFeedbackFromActions = openFeedbackFromActions;
  window.exportScheduleFromActions = exportScheduleFromActions;
  window.openLikesFromActions = openLikesFromActions;
  window.openCasinoFromActions = openCasinoFromActions;
  window.openMinigamesFromActions = openMinigamesFromActions;
  window.openMonopolyFromActions = openMonopolyFromActions;
  window.openAchievementsFromActions = openAchievementsFromActions;
  window.openAchievementsModal = openAchievementsModal;
  window.closeAchievementsModal = closeAchievementsModal;
  window.achievementsSubmitCreate = achievementsSubmitCreate;
  window.openRouletteModal = openRouletteModal;
  window.closeRouletteModal = closeRouletteModal;
  window.rouletteAddDraftBet = rouletteAddDraftBet;
  window.rouletteRemoveDraftBet = rouletteRemoveDraftBet;
  window.rouletteClearDraft = rouletteClearDraft;
  window.rouletteSelectChip = rouletteSelectChip;
  window.rouletteSyncChipInput = rouletteSyncChipInput;
  window.rouletteSubmitDraft = rouletteSubmitDraft;
  window.rouletteSubmitGrant = rouletteSubmitGrant;
  window.openD20FromActions = openD20FromActions;
  window.openMonopolyModal = openMonopolyModal;
  window.closeMonopolyModal = closeMonopolyModal;
  window.monopolyCreateRoom = monopolyCreateRoom;
  window.monopolyJoinRoom = monopolyJoinRoom;
  window.monopolySetReady = monopolySetReady;
  window.monopolyStartGame = monopolyStartGame;
  window.monopolyBid = monopolyBid;
  window.monopolyOfferTrade = monopolyOfferTrade;
  window.monopolyRespondTrade = monopolyRespondTrade;
  window.monopolyRequestLeave = monopolyRequestLeave;
  window.monopolyVoteLeave = monopolyVoteLeave;
  window.monopolyUploadToken = monopolyUploadToken;
  window.openD20Modal = openD20Modal;
  window.closeD20Modal = closeD20Modal;
  window.d20SetDc = d20SetDc;
  window.d20AddModifier = d20AddModifier;
  window.d20ToggleModifier = d20ToggleModifier;
  window.d20RemoveModifier = d20RemoveModifier;
  window.d20ChangePalette = d20ChangePalette;
  window.d20UploadTexture = d20UploadTexture;
  window.d20ResetSkin = d20ResetSkin;
  window.d20Roll = d20Roll;
  window.d20LoadState = d20LoadState;
  window.openD20FromActions = openD20FromActions;
  window.sendLike = sendLike;
  window.openLikesModal = openLikesModal;
  window.closeLikesModal = closeLikesModal;
  window.openCasinoModal = openCasinoModal;
  window.closeCasinoModal = closeCasinoModal;
  window.spinSlots = spinSlots;
  window.openBetsModal = openBetsModal;
  window.closeBetsModal = closeBetsModal;
  window.saveBet = saveBet;
  window.blockBlastRestart = blockBlastRestart;
  window.openHiddenPairsFromActions = openHiddenPairsFromActions;
  window.openHiddenPairsModal = openHiddenPairsModal;
  window.closeHiddenPairsModal = closeHiddenPairsModal;
  window.saveHiddenPairs = saveHiddenPairs;
  window.openRemindersModal = openRemindersModal;
  window.closeRemindersModal = closeRemindersModal;
  window.saveReminders = saveReminders;
  window.openWriteToParticipantModal = openWriteToParticipantModal;
  window.closeWriteToParticipantModal = closeWriteToParticipantModal;
  window.sendToParticipant = sendToParticipant;
  window.openStarostaModal = openStarostaModal;
  window.closeStarostaModal = closeStarostaModal;
  window.sendStarostaMessage = sendStarostaMessage;
  window.openFeedbackModal = openFeedbackModal;
  window.closeFeedbackModal = closeFeedbackModal;
  window.sendFeedback = sendFeedback;
  window.openBetsFromActions = openBetsFromActions;
  window.sendLikeFromActions = sendLikeFromActions;

  initBroadcast();
  initEditSchedule();
  initAuth();
  initAchievements();
  initRoulette();
  initMonopoly();
  initD20();
  initCasino();
  initLikes();
  initBets();
  initBlockBlast();
  initParticipantModals();
}

function setupOverlayCloseListeners() {
  const subjectCardOverlay = document.getElementById("subjectCardOverlay");
  if (subjectCardOverlay) subjectCardOverlay.addEventListener("click", function (e) { if (e.target === this) closeSubjectCard(); });
  const calendarDayOverlay = document.getElementById("calendarDayModalOverlay");
  if (calendarDayOverlay) calendarDayOverlay.addEventListener("click", function (e) { if (e.target === this) closeCalendarDayModal(); });
  const deadlinesOverlay = document.getElementById("deadlinesOverlay");
  if (deadlinesOverlay) deadlinesOverlay.addEventListener("click", function (e) { if (e.target === this) closeDeadlinesModal(); });
  const actionsOverlay = document.getElementById("actionsOverlay");
  if (actionsOverlay) actionsOverlay.addEventListener("click", function (e) { if (e.target === this) closeActionsModal(); });
}

registerAppGlobals();
setupOverlayCloseListeners();

// Telegram WebApp init
if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#1c1c1e");
  tg.setBackgroundColor("#1c1c1e");
}

function updateOfflineBanner() {
  const el = document.getElementById("offlineBanner");
  if (!el) return;
  const show = !navigator.onLine && state.schedule && state.schedule.length > 0;
  el.style.display = show ? "block" : "none";
}

// Bootstrap: run after DOM is ready so scheduleContainer exists
function runBootstrap() {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
  window.addEventListener("online", updateOfflineBanner);
  window.addEventListener("offline", updateOfflineBanner);
  setupMainUi();
  loadSchedule().then(updateOfflineBanner).catch(function (err) {
    console.error("loadSchedule failed", err);
  });
}
function scheduleBootstrap() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(runBootstrap, 0);
    });
  } else {
    setTimeout(runBootstrap, 0);
  }
}
scheduleBootstrap();
