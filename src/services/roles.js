const config = require("../config");

const {
  STAROSTA_ID,
  DEPUTY_STAROSTA_IDS,
  DEBUG_IDS,
  ADMIN_IDS,
} = config;

function isAdminUser(authData) {
  if (!ADMIN_IDS.length) {
    return true;
  }
  const userId = authData.user && authData.user.id;
  return userId && ADMIN_IDS.includes(Number(userId));
}

function isConfiguredAdminUser(authData) {
  const userId = authData && authData.user && authData.user.id;
  if (!userId || !ADMIN_IDS.length) return false;
  return ADMIN_IDS.includes(Number(userId));
}

function isStarostaUser(authData) {
  const userId = authData.user && authData.user.id;
  if (!userId) return false;
  const id = Number(userId);
  return id === STAROSTA_ID || ADMIN_IDS.includes(id);
}

function hasStarostaRights(authData) {
  const userId = authData.user && authData.user.id;
  if (userId == null) return false;
  const id = Number(userId);
  return (
    id === STAROSTA_ID ||
    DEPUTY_STAROSTA_IDS.includes(id) ||
    DEBUG_IDS.includes(id)
  );
}

function getStarostaLikeIds() {
  return [STAROSTA_ID, ...DEPUTY_STAROSTA_IDS, ...DEBUG_IDS];
}

function getCurrentUserRole(authData) {
  const userId = authData.user && authData.user.id;
  if (userId == null) return null;
  const id = Number(userId);
  if (id === STAROSTA_ID) return "starosta";
  if (DEPUTY_STAROSTA_IDS.includes(id)) return "deputy";
  if (DEBUG_IDS.includes(id)) return "debug";
  return null;
}

function getStarostaSenderHeader(authData) {
  const user = (authData && authData.user) || {};
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Без имени";
  const role = getCurrentUserRole(authData);
  const roleLabel = role === "starosta" ? "Староста" : role === "deputy" ? "Зам. старосты" : "";
  return "От: " + name + (roleLabel ? ` (${roleLabel})` : "");
}

function getCurrentChatId(authData) {
  return (
    (authData.chat && authData.chat.id) ||
    (authData.user && authData.user.id)
  );
}

module.exports = {
  isAdminUser,
  isConfiguredAdminUser,
  isStarostaUser,
  hasStarostaRights,
  getStarostaLikeIds,
  getCurrentUserRole,
  getStarostaSenderHeader,
  getCurrentChatId,
};
