"use strict";

const TURN_TIMEOUT_MS = 60000;
const PHASE_TIMEOUT_MS = 30000;
const STARTING_CASH = 1500;
const PASS_GO_CASH = 200;
const DEFAULT_TURN_CAP = 120;
const MIN_TURN_CAP = 60;
const MAX_TURN_CAP = 200;

const BOARD = [
  { index: 0, type: "go", name: "GO" },
  { index: 1, type: "property", name: "Mediterranean Avenue", price: 60, rent: 2 },
  { index: 2, type: "community", name: "Community Chest" },
  { index: 3, type: "property", name: "Baltic Avenue", price: 60, rent: 4 },
  { index: 4, type: "tax", name: "Income Tax", amount: 200 },
  { index: 5, type: "property", name: "Reading Railroad", price: 200, rent: 25 },
  { index: 6, type: "property", name: "Oriental Avenue", price: 100, rent: 6 },
  { index: 7, type: "chance", name: "Chance" },
  { index: 8, type: "property", name: "Vermont Avenue", price: 100, rent: 6 },
  { index: 9, type: "property", name: "Connecticut Avenue", price: 120, rent: 8 },
  { index: 10, type: "jail", name: "Jail / Just Visiting" },
  { index: 11, type: "property", name: "St. Charles Place", price: 140, rent: 10 },
  { index: 12, type: "property", name: "Electric Company", price: 150, rent: 12 },
  { index: 13, type: "property", name: "States Avenue", price: 140, rent: 10 },
  { index: 14, type: "property", name: "Virginia Avenue", price: 160, rent: 12 },
  { index: 15, type: "property", name: "Pennsylvania Railroad", price: 200, rent: 25 },
  { index: 16, type: "property", name: "St. James Place", price: 180, rent: 14 },
  { index: 17, type: "community", name: "Community Chest" },
  { index: 18, type: "property", name: "Tennessee Avenue", price: 180, rent: 14 },
  { index: 19, type: "property", name: "New York Avenue", price: 200, rent: 16 },
  { index: 20, type: "free", name: "Free Parking" },
  { index: 21, type: "property", name: "Kentucky Avenue", price: 220, rent: 18 },
  { index: 22, type: "chance", name: "Chance" },
  { index: 23, type: "property", name: "Indiana Avenue", price: 220, rent: 18 },
  { index: 24, type: "property", name: "Illinois Avenue", price: 240, rent: 20 },
  { index: 25, type: "property", name: "B. & O. Railroad", price: 200, rent: 25 },
  { index: 26, type: "property", name: "Atlantic Avenue", price: 260, rent: 22 },
  { index: 27, type: "property", name: "Ventnor Avenue", price: 260, rent: 22 },
  { index: 28, type: "property", name: "Water Works", price: 150, rent: 12 },
  { index: 29, type: "property", name: "Marvin Gardens", price: 280, rent: 24 },
  { index: 30, type: "go_to_jail", name: "Go To Jail" },
  { index: 31, type: "property", name: "Pacific Avenue", price: 300, rent: 26 },
  { index: 32, type: "property", name: "North Carolina Avenue", price: 300, rent: 26 },
  { index: 33, type: "community", name: "Community Chest" },
  { index: 34, type: "property", name: "Pennsylvania Avenue", price: 320, rent: 28 },
  { index: 35, type: "property", name: "Short Line", price: 200, rent: 25 },
  { index: 36, type: "chance", name: "Chance" },
  { index: 37, type: "property", name: "Park Place", price: 350, rent: 35 },
  { index: 38, type: "tax", name: "Luxury Tax", amount: 100 },
  { index: 39, type: "property", name: "Boardwalk", price: 400, rent: 50 },
];

const CHANCE_CARDS = [
  { id: "chance_collect_50", kind: "collect", amount: 50, title: "Bank pays you dividend of $50" },
  { id: "chance_pay_50", kind: "pay", amount: 50, title: "Pay poor tax of $50" },
  { id: "chance_move_go", kind: "move_to", target: 0, collectGo: true, title: "Advance to GO" },
  { id: "chance_move_illinois", kind: "move_to", target: 24, collectGo: true, title: "Advance to Illinois Avenue" },
  { id: "chance_move_back_3", kind: "move_steps", steps: -3, title: "Go back 3 spaces" },
  { id: "chance_jail", kind: "go_to_jail", title: "Go directly to Jail" },
  { id: "chance_collect_each_10", kind: "collect_from_each", amount: 10, title: "Collect $10 from each player" },
];

const COMMUNITY_CARDS = [
  { id: "community_collect_200", kind: "collect", amount: 200, title: "Bank error in your favor. Collect $200" },
  { id: "community_collect_100", kind: "collect", amount: 100, title: "Life insurance matures. Collect $100" },
  { id: "community_pay_50", kind: "pay", amount: 50, title: "Doctor's fee. Pay $50" },
  { id: "community_collect_25", kind: "collect", amount: 25, title: "Receive $25 consultancy fee" },
  { id: "community_jail", kind: "go_to_jail", title: "Go to Jail" },
  { id: "community_pay_each_25", kind: "pay_each", amount: 25, title: "You are assessed for street repairs. Pay each player $25" },
  { id: "community_move_go", kind: "move_to", target: 0, collectGo: true, title: "Advance to GO" },
];

function createEngineError(code, status) {
  const err = new Error(code);
  err.code = code;
  err.status = status;
  return err;
}

function clampTurnCap(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TURN_CAP;
  return Math.max(MIN_TURN_CAP, Math.min(MAX_TURN_CAP, Math.floor(parsed)));
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso(now) {
  if (typeof now === "string") return now;
  if (now instanceof Date) return now.toISOString();
  return new Date(Number(now) || Date.now()).toISOString();
}

function nowMs(now) {
  if (now instanceof Date) return now.getTime();
  if (typeof now === "string") return Date.parse(now);
  return Number(now);
}

function createEvent(type, message, payload) {
  return {
    type,
    message,
    payload: payload || {},
    createdAt: new Date().toISOString(),
  };
}

function pushHistory(state, event) {
  state.history = Array.isArray(state.history) ? state.history : [];
  state.history.unshift({
    type: event.type,
    message: event.message,
    payload: event.payload || {},
    createdAt: new Date().toISOString(),
  });
  if (state.history.length > 80) {
    state.history = state.history.slice(0, 80);
  }
}

function pickRandomInt(rng, minInclusive, maxInclusive) {
  const random = typeof rng === "function" ? rng : Math.random;
  return Math.floor(random() * (maxInclusive - minInclusive + 1)) + minInclusive;
}

function shuffle(values, rng) {
  const random = typeof rng === "function" ? rng : Math.random;
  const arr = values.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function getPlayerIndex(state, userId) {
  return state.players.findIndex((player) => Number(player.userId) === Number(userId));
}

function getPlayer(state, userId) {
  return state.players[getPlayerIndex(state, userId)] || null;
}

function activePlayers(state) {
  return state.players.filter((player) => !player.bankrupt);
}

function majorityCount(state) {
  const count = activePlayers(state).length;
  return Math.floor(count / 2) + 1;
}

function getCell(index) {
  return BOARD[index] || null;
}

function playerCapital(state, userId) {
  const player = getPlayer(state, userId);
  if (!player) return 0;
  let total = Number(player.cash || 0);
  Object.keys(state.ownership || {}).forEach((key) => {
    if (Number(state.ownership[key]) !== Number(userId)) return;
    const cell = getCell(Number(key));
    if (cell && cell.type === "property") total += Number(cell.price || 0);
  });
  return total;
}

function markPlayerBankrupt(state, userId, events, reason, creditorUserId) {
  const player = getPlayer(state, userId);
  if (!player || player.bankrupt) return;
  player.cash = 0;
  player.bankrupt = true;
  player.inJail = false;
  player.jailTurns = 0;

  Object.keys(state.ownership || {}).forEach((cellIndex) => {
    if (Number(state.ownership[cellIndex]) === Number(userId)) {
      delete state.ownership[cellIndex];
    }
  });

  const event = createEvent("player_eliminated", "Player is bankrupt", {
    userId: Number(userId),
    reason: reason || "bankrupt",
    creditorUserId: creditorUserId == null ? null : Number(creditorUserId),
  });
  events.push(event);
  pushHistory(state, event);
}

function finishBySurvivor(state, now, events) {
  const survivors = activePlayers(state);
  const winner = survivors.length === 1 ? survivors[0] : null;
  state.phase = "finished";
  state.pending = null;
  state.turnDeadlineAt = null;
  state.phaseDeadlineAt = null;
  state.activePlayerId = null;
  state.turnHasRolled = false;
  state.meta.winnerUserId = winner ? Number(winner.userId) : null;
  state.meta.finishedAt = nowIso(now);
  const event = createEvent("game_finished", "Game finished", {
    winnerUserId: state.meta.winnerUserId,
    reason: "survivor",
  });
  events.push(event);
  pushHistory(state, event);
}

function finishByCapital(state, now, events) {
  const contenders = activePlayers(state);
  let winnerUserId = null;
  let bestCapital = -Infinity;
  contenders.forEach((player) => {
    const capital = playerCapital(state, player.userId);
    if (capital > bestCapital) {
      bestCapital = capital;
      winnerUserId = Number(player.userId);
    }
  });
  state.phase = "finished";
  state.pending = null;
  state.turnDeadlineAt = null;
  state.phaseDeadlineAt = null;
  state.activePlayerId = null;
  state.turnHasRolled = false;
  state.meta.winnerUserId = winnerUserId;
  state.meta.finishedAt = nowIso(now);
  const event = createEvent("game_finished", "Game finished by turn cap", {
    winnerUserId,
    reason: "turn_cap",
  });
  events.push(event);
  pushHistory(state, event);
}

function maybeFinishGame(state, now, events) {
  if (state.phase === "finished") return true;
  if (activePlayers(state).length <= 1) {
    finishBySurvivor(state, now, events);
    return true;
  }
  return false;
}

function transferMoney(state, fromUserId, toUserId, amount, events, reason) {
  const amountInt = Math.max(0, Number(amount) || 0);
  if (!amountInt) return;
  const from = getPlayer(state, fromUserId);
  if (!from || from.bankrupt) return;
  const to = toUserId == null ? null : getPlayer(state, toUserId);
  const affordable = Math.min(amountInt, Number(from.cash || 0));
  from.cash -= affordable;
  if (to && !to.bankrupt) {
    to.cash += affordable;
  }

  const event = createEvent("state_patch", "Money transferred", {
    fromUserId: Number(fromUserId),
    toUserId: to ? Number(to.userId) : null,
    amount: affordable,
    expectedAmount: amountInt,
    reason: reason || "transfer",
  });
  events.push(event);
  pushHistory(state, event);

  if (affordable < amountInt) {
    markPlayerBankrupt(state, fromUserId, events, reason || "cannot_pay", toUserId);
  }
}

function movePlayerTo(state, player, targetIndex, collectGo) {
  const current = Number(player.position || 0);
  const target = ((Number(targetIndex) % BOARD.length) + BOARD.length) % BOARD.length;
  if (collectGo && target < current) {
    player.cash += PASS_GO_CASH;
  }
  player.position = target;
}

function movePlayerBy(state, player, steps) {
  const current = Number(player.position || 0);
  const distance = Number(steps) || 0;
  let next = current + distance;
  while (next >= BOARD.length) {
    next -= BOARD.length;
    player.cash += PASS_GO_CASH;
  }
  while (next < 0) {
    next += BOARD.length;
  }
  player.position = next;
}

function getNextActivePlayerId(state, currentUserId) {
  if (!Array.isArray(state.players) || !state.players.length) return null;
  const currentIndex = state.players.findIndex((p) => Number(p.userId) === Number(currentUserId));
  if (currentIndex < 0) return null;
  for (let offset = 1; offset <= state.players.length; offset += 1) {
    const idx = (currentIndex + offset) % state.players.length;
    const player = state.players[idx];
    if (player && !player.bankrupt) return Number(player.userId);
  }
  return null;
}

function beginTurn(state, userId, now, events, reason) {
  state.phase = "turn";
  state.activePlayerId = Number(userId);
  state.turnDeadlineAt = new Date(nowMs(now) + TURN_TIMEOUT_MS).toISOString();
  state.phaseDeadlineAt = null;
  state.pending = null;
  state.turnHasRolled = false;
  state.dice = null;
  const event = createEvent("turn_changed", "Turn changed", {
    activePlayerId: Number(userId),
    reason: reason || "next_turn",
    turnCount: Number(state.turnCount || 0),
  });
  events.push(event);
  pushHistory(state, event);
}

function advanceTurn(state, now, events, reason) {
  if (maybeFinishGame(state, now, events)) return;
  if (Number(state.turnCount || 0) >= Number(state.meta.turnCap || DEFAULT_TURN_CAP)) {
    finishByCapital(state, now, events);
    return;
  }

  const current = Number(state.activePlayerId);
  const next = getNextActivePlayerId(state, current);
  if (!next) {
    finishByCapital(state, now, events);
    return;
  }
  state.turnCount = Number(state.turnCount || 0) + 1;
  beginTurn(state, next, now, events, reason || "next_turn");
}

function drawCard(state, deckName) {
  if (deckName === "chance") {
    const list = Array.isArray(state.deck && state.deck.chance) ? state.deck.chance : [];
    if (!list.length) return null;
    const index = Number(state.deck.chanceIndex || 0) % list.length;
    state.deck.chanceIndex = (index + 1) % list.length;
    return CHANCE_CARDS.find((card) => card.id === list[index]) || null;
  }
  const list = Array.isArray(state.deck && state.deck.community) ? state.deck.community : [];
  if (!list.length) return null;
  const index = Number(state.deck.communityIndex || 0) % list.length;
  state.deck.communityIndex = (index + 1) % list.length;
  return COMMUNITY_CARDS.find((card) => card.id === list[index]) || null;
}

function startAuction(state, propertyIndex, now, events) {
  const property = getCell(Number(propertyIndex));
  if (!property || property.type !== "property") {
    throw createEngineError("invalid_property", 400);
  }
  state.phase = "auction";
  state.pending = {
    kind: "auction",
    propertyIndex: Number(propertyIndex),
    highestBid: 0,
    highestBidUserId: null,
    bids: [],
  };
  state.phaseDeadlineAt = new Date(nowMs(now) + PHASE_TIMEOUT_MS).toISOString();
  const event = createEvent("auction_updated", "Auction started", {
    propertyIndex: Number(propertyIndex),
    propertyName: property.name,
  });
  events.push(event);
  pushHistory(state, event);
}

function finalizeAuction(state, now, events) {
  if (!state.pending || state.pending.kind !== "auction") return;
  const propertyIndex = Number(state.pending.propertyIndex);
  const cell = getCell(propertyIndex);
  const highestBid = Number(state.pending.highestBid || 0);
  const winnerId = state.pending.highestBidUserId == null ? null : Number(state.pending.highestBidUserId);
  if (winnerId != null && highestBid > 0 && !state.ownership[String(propertyIndex)]) {
    const winner = getPlayer(state, winnerId);
    if (winner && !winner.bankrupt && winner.cash >= highestBid) {
      winner.cash -= highestBid;
      state.ownership[String(propertyIndex)] = winnerId;
      const soldEvent = createEvent("auction_updated", "Auction finished with winner", {
        propertyIndex,
        propertyName: cell ? cell.name : "Property",
        winnerUserId: winnerId,
        price: highestBid,
      });
      events.push(soldEvent);
      pushHistory(state, soldEvent);
    }
  } else {
    const noSale = createEvent("auction_updated", "Auction finished without winner", {
      propertyIndex,
    });
    events.push(noSale);
    pushHistory(state, noSale);
  }
  state.pending = null;
  state.phaseDeadlineAt = null;
  advanceTurn(state, now, events, "auction_finished");
}

function sendToJail(player) {
  player.position = 10;
  player.inJail = true;
  player.jailTurns = 2;
}

function resolveLanding(state, player, now, events, depth) {
  const recursionDepth = Number(depth || 0);
  if (recursionDepth > 3 || state.phase === "finished") return;
  const cell = getCell(Number(player.position));
  if (!cell) {
    advanceTurn(state, now, events, "landed_invalid");
    return;
  }

  if (cell.type === "property") {
    const ownerId = state.ownership[String(cell.index)] == null ? null : Number(state.ownership[String(cell.index)]);
    if (ownerId == null) {
      state.phase = "await_buy";
      state.pending = {
        kind: "buy_offer",
        propertyIndex: Number(cell.index),
        playerId: Number(player.userId),
        price: Number(cell.price),
      };
      state.phaseDeadlineAt = new Date(nowMs(now) + PHASE_TIMEOUT_MS).toISOString();
      const offerEvent = createEvent("state_patch", "Property can be purchased", {
        playerId: Number(player.userId),
        propertyIndex: Number(cell.index),
        price: Number(cell.price),
      });
      events.push(offerEvent);
      pushHistory(state, offerEvent);
      return;
    }
    if (ownerId !== Number(player.userId)) {
      transferMoney(state, player.userId, ownerId, Number(cell.rent), events, "rent");
      if (maybeFinishGame(state, now, events)) return;
    }
    advanceTurn(state, now, events, "landed_property");
    return;
  }

  if (cell.type === "tax") {
    transferMoney(state, player.userId, null, Number(cell.amount || 0), events, "tax");
    if (maybeFinishGame(state, now, events)) return;
    advanceTurn(state, now, events, "landed_tax");
    return;
  }

  if (cell.type === "chance" || cell.type === "community") {
    const card = drawCard(state, cell.type === "chance" ? "chance" : "community");
    if (!card) {
      advanceTurn(state, now, events, "empty_card");
      return;
    }
    const cardEvent = createEvent("state_patch", "Card drawn", {
      playerId: Number(player.userId),
      deck: cell.type,
      cardId: card.id,
      title: card.title,
    });
    events.push(cardEvent);
    pushHistory(state, cardEvent);

    if (card.kind === "collect") {
      player.cash += Number(card.amount || 0);
      advanceTurn(state, now, events, "card_collect");
      return;
    }
    if (card.kind === "pay") {
      transferMoney(state, player.userId, null, Number(card.amount || 0), events, "card_pay");
      if (!maybeFinishGame(state, now, events)) {
        advanceTurn(state, now, events, "card_pay_done");
      }
      return;
    }
    if (card.kind === "go_to_jail") {
      sendToJail(player);
      advanceTurn(state, now, events, "card_jail");
      return;
    }
    if (card.kind === "move_to") {
      movePlayerTo(state, player, Number(card.target), !!card.collectGo);
      resolveLanding(state, player, now, events, recursionDepth + 1);
      return;
    }
    if (card.kind === "move_steps") {
      movePlayerBy(state, player, Number(card.steps || 0));
      resolveLanding(state, player, now, events, recursionDepth + 1);
      return;
    }
    if (card.kind === "collect_from_each") {
      activePlayers(state).forEach((other) => {
        if (Number(other.userId) === Number(player.userId)) return;
        transferMoney(state, other.userId, player.userId, Number(card.amount || 0), events, "card_collect_each");
      });
      if (!maybeFinishGame(state, now, events)) {
        advanceTurn(state, now, events, "card_collect_each_done");
      }
      return;
    }
    if (card.kind === "pay_each") {
      activePlayers(state).forEach((other) => {
        if (Number(other.userId) === Number(player.userId)) return;
        transferMoney(state, player.userId, other.userId, Number(card.amount || 0), events, "card_pay_each");
      });
      if (!maybeFinishGame(state, now, events)) {
        advanceTurn(state, now, events, "card_pay_each_done");
      }
      return;
    }
    advanceTurn(state, now, events, "card_unknown");
    return;
  }

  if (cell.type === "go_to_jail") {
    sendToJail(player);
    advanceTurn(state, now, events, "go_to_jail");
    return;
  }

  advanceTurn(state, now, events, "landed_neutral");
}

function ensureActiveTurn(state, userId) {
  if (state.phase !== "turn") {
    throw createEngineError("invalid_phase", 409);
  }
  if (Number(state.activePlayerId) !== Number(userId)) {
    throw createEngineError("not_your_turn", 409);
  }
}

function ensurePlayerInGame(state, userId) {
  const player = getPlayer(state, userId);
  if (!player) throw createEngineError("player_not_in_room", 404);
  if (player.bankrupt) throw createEngineError("player_bankrupt", 409);
  return player;
}

function setTradeCancelled(state, events, reason) {
  state.phase = "turn";
  state.phaseDeadlineAt = null;
  state.pending = null;
  const event = createEvent("trade_updated", "Trade cancelled", { reason: reason || "cancelled" });
  events.push(event);
  pushHistory(state, event);
}

function applyAction(rawState, action, context) {
  const state = cloneState(rawState);
  const events = [];
  const type = action && action.type ? String(action.type) : "";
  const payload = action && action.payload ? action.payload : {};
  const now = context && context.now ? context.now : Date.now();
  const userId = context && context.userId != null ? Number(context.userId) : null;
  const random = context && typeof context.random === "function" ? context.random : Math.random;

  if (!userId) throw createEngineError("unauthorized", 401);
  if (state.phase === "finished" && type !== "noop") {
    throw createEngineError("game_finished", 409);
  }

  if (type === "start_game") {
    if (state.phase !== "lobby") throw createEngineError("invalid_phase", 409);
    const readyPlayers = state.players.filter((playerItem) => !playerItem.bankrupt && playerItem.ready);
    if (readyPlayers.length < 2 || readyPlayers.length > 4) {
      throw createEngineError("invalid_player_count", 400);
    }
    if (readyPlayers.length !== state.players.filter((playerItem) => !playerItem.bankrupt).length) {
      throw createEngineError("all_players_must_be_ready", 409);
    }
    state.meta.startedAt = nowIso(now);
    state.phase = "turn";
    state.turnCount = 1;
    const shuffled = shuffle(readyPlayers.map((playerItem) => Number(playerItem.userId)), random);
    beginTurn(state, shuffled[0], now, events, "game_started");
    const startEvent = createEvent("state_patch", "Game started", { activePlayerId: shuffled[0] });
    events.push(startEvent);
    pushHistory(state, startEvent);
    return { state, events };
  }

  const player = ensurePlayerInGame(state, userId);

  if (type === "roll_dice") {
    ensureActiveTurn(state, userId);
    if (state.turnHasRolled) throw createEngineError("already_rolled", 409);

    if (player.inJail) {
      player.jailTurns = Math.max(0, Number(player.jailTurns || 0) - 1);
      if (player.jailTurns > 0) {
        const jailEvent = createEvent("state_patch", "Turn skipped due to jail", {
          userId,
          remainingTurns: player.jailTurns,
        });
        events.push(jailEvent);
        pushHistory(state, jailEvent);
        advanceTurn(state, now, events, "jail_skip");
        return { state, events };
      }
      player.inJail = false;
    }

    const diceA = pickRandomInt(random, 1, 6);
    const diceB = pickRandomInt(random, 1, 6);
    const total = diceA + diceB;
    state.dice = { diceA, diceB, total };
    state.turnHasRolled = true;
    movePlayerBy(state, player, total);
    const rollEvent = createEvent("state_patch", "Dice rolled", {
      userId,
      diceA,
      diceB,
      total,
      position: player.position,
    });
    events.push(rollEvent);
    pushHistory(state, rollEvent);
    resolveLanding(state, player, now, events, 0);
    return { state, events };
  }

  if (type === "buy_property") {
    if (state.phase !== "await_buy" || !state.pending || state.pending.kind !== "buy_offer") {
      throw createEngineError("invalid_phase", 409);
    }
    if (Number(state.pending.playerId) !== Number(userId)) throw createEngineError("not_your_turn", 409);
    const propertyIndex = Number(state.pending.propertyIndex);
    const price = Number(state.pending.price || 0);
    const cell = getCell(propertyIndex);
    if (!cell || cell.type !== "property") throw createEngineError("invalid_property", 400);
    if (state.ownership[String(propertyIndex)] != null) throw createEngineError("already_owned", 409);
    if (player.cash < price) throw createEngineError("insufficient_cash", 400);
    player.cash -= price;
    state.ownership[String(propertyIndex)] = Number(userId);
    state.pending = null;
    state.phaseDeadlineAt = null;
    const buyEvent = createEvent("state_patch", "Property purchased", {
      userId,
      propertyIndex,
      price,
    });
    events.push(buyEvent);
    pushHistory(state, buyEvent);
    advanceTurn(state, now, events, "property_bought");
    return { state, events };
  }

  if (type === "decline_property") {
    if (state.phase !== "await_buy" || !state.pending || state.pending.kind !== "buy_offer") {
      throw createEngineError("invalid_phase", 409);
    }
    if (Number(state.pending.playerId) !== Number(userId)) throw createEngineError("not_your_turn", 409);
    startAuction(state, Number(state.pending.propertyIndex), now, events);
    return { state, events };
  }

  if (type === "auction_bid") {
    if (state.phase !== "auction" || !state.pending || state.pending.kind !== "auction") {
      throw createEngineError("invalid_phase", 409);
    }
    const bidAmount = Number(payload.amount);
    if (!Number.isInteger(bidAmount) || bidAmount <= Number(state.pending.highestBid || 0)) {
      throw createEngineError("bid_too_low", 400);
    }
    if (player.cash < bidAmount) throw createEngineError("insufficient_cash", 400);
    state.pending.highestBid = bidAmount;
    state.pending.highestBidUserId = Number(userId);
    state.pending.bids = Array.isArray(state.pending.bids) ? state.pending.bids : [];
    state.pending.bids.push({
      userId: Number(userId),
      amount: bidAmount,
      createdAt: nowIso(now),
    });
    const bidEvent = createEvent("auction_updated", "Auction bid placed", {
      userId: Number(userId),
      amount: bidAmount,
      propertyIndex: Number(state.pending.propertyIndex),
    });
    events.push(bidEvent);
    pushHistory(state, bidEvent);
    return { state, events };
  }

  if (type === "offer_trade") {
    ensureActiveTurn(state, userId);
    const targetUserId = Number(payload.targetUserId);
    const target = ensurePlayerInGame(state, targetUserId);
    if (Number(target.userId) === Number(userId)) throw createEngineError("invalid_target", 400);
    const offerCash = Math.max(0, Number(payload.offerCash || 0));
    const requestCash = Math.max(0, Number(payload.requestCash || 0));
    const offerProperties = Array.isArray(payload.offerProperties) ? [...new Set(payload.offerProperties.map(Number))] : [];
    const requestProperties = Array.isArray(payload.requestProperties) ? [...new Set(payload.requestProperties.map(Number))] : [];

    if (offerCash > player.cash) throw createEngineError("insufficient_cash", 400);
    if (requestCash > target.cash) throw createEngineError("target_insufficient_cash", 400);
    offerProperties.forEach((propertyIndex) => {
      if (Number(state.ownership[String(propertyIndex)]) !== Number(userId)) {
        throw createEngineError("offer_property_not_owned", 400);
      }
    });
    requestProperties.forEach((propertyIndex) => {
      if (Number(state.ownership[String(propertyIndex)]) !== Number(targetUserId)) {
        throw createEngineError("request_property_not_owned", 400);
      }
    });
    state.phase = "trade";
    state.pending = {
      kind: "trade",
      fromUserId: Number(userId),
      toUserId: Number(targetUserId),
      offerCash,
      requestCash,
      offerProperties,
      requestProperties,
    };
    state.phaseDeadlineAt = new Date(nowMs(now) + PHASE_TIMEOUT_MS).toISOString();
    const tradeEvent = createEvent("trade_updated", "Trade offered", {
      fromUserId: Number(userId),
      toUserId: Number(targetUserId),
    });
    events.push(tradeEvent);
    pushHistory(state, tradeEvent);
    return { state, events };
  }

  if (type === "respond_trade") {
    if (state.phase !== "trade" || !state.pending || state.pending.kind !== "trade") {
      throw createEngineError("invalid_phase", 409);
    }
    if (Number(state.pending.toUserId) !== Number(userId)) throw createEngineError("forbidden", 403);
    const accept = !!payload.accept;
    if (!accept) {
      setTradeCancelled(state, events, "declined");
      return { state, events };
    }
    const from = ensurePlayerInGame(state, Number(state.pending.fromUserId));
    const to = ensurePlayerInGame(state, Number(state.pending.toUserId));
    if (Number(from.cash) < Number(state.pending.offerCash || 0) || Number(to.cash) < Number(state.pending.requestCash || 0)) {
      setTradeCancelled(state, events, "insufficient_cash");
      return { state, events };
    }
    for (const propertyIndex of state.pending.offerProperties || []) {
      if (Number(state.ownership[String(propertyIndex)]) !== Number(from.userId)) {
        setTradeCancelled(state, events, "ownership_changed");
        return { state, events };
      }
    }
    for (const propertyIndex of state.pending.requestProperties || []) {
      if (Number(state.ownership[String(propertyIndex)]) !== Number(to.userId)) {
        setTradeCancelled(state, events, "ownership_changed");
        return { state, events };
      }
    }

    from.cash -= Number(state.pending.offerCash || 0);
    to.cash += Number(state.pending.offerCash || 0);
    to.cash -= Number(state.pending.requestCash || 0);
    from.cash += Number(state.pending.requestCash || 0);
    for (const propertyIndex of state.pending.offerProperties || []) {
      state.ownership[String(propertyIndex)] = Number(to.userId);
    }
    for (const propertyIndex of state.pending.requestProperties || []) {
      state.ownership[String(propertyIndex)] = Number(from.userId);
    }
    state.phase = "turn";
    state.phaseDeadlineAt = null;
    state.pending = null;
    const accepted = createEvent("trade_updated", "Trade accepted", {
      fromUserId: Number(from.userId),
      toUserId: Number(to.userId),
    });
    events.push(accepted);
    pushHistory(state, accepted);
    return { state, events };
  }

  if (type === "leave_request") {
    const targetUserId = payload && payload.targetUserId != null ? Number(payload.targetUserId) : Number(userId);
    ensurePlayerInGame(state, targetUserId);
    state.phase = "vote_leave";
    state.pending = {
      kind: "vote_leave",
      targetUserId,
      votes: {
        [String(userId)]: true,
      },
      requestedByUserId: Number(userId),
    };
    state.phaseDeadlineAt = new Date(nowMs(now) + PHASE_TIMEOUT_MS).toISOString();
    const voteEvent = createEvent("vote_updated", "Leave vote started", {
      targetUserId,
      requestedByUserId: Number(userId),
    });
    events.push(voteEvent);
    pushHistory(state, voteEvent);
    return { state, events };
  }

  if (type === "vote_leave") {
    if (state.phase !== "vote_leave" || !state.pending || state.pending.kind !== "vote_leave") {
      throw createEngineError("invalid_phase", 409);
    }
    const boolVote = !!payload.approve;
    state.pending.votes[String(userId)] = boolVote;
    const yesVotes = Object.values(state.pending.votes).filter(Boolean).length;
    const required = majorityCount(state);
    const votedUsers = Object.keys(state.pending.votes).map(Number);
    const activeUserIds = activePlayers(state).map((playerItem) => Number(playerItem.userId));
    const allVoted = activeUserIds.every((id) => votedUsers.includes(id));

    const voteUpdate = createEvent("vote_updated", "Leave vote updated", {
      targetUserId: Number(state.pending.targetUserId),
      yesVotes,
      required,
      allVoted,
    });
    events.push(voteUpdate);
    pushHistory(state, voteUpdate);

    if (yesVotes >= required) {
      const targetUserId = Number(state.pending.targetUserId);
      markPlayerBankrupt(state, targetUserId, events, "vote_leave", null);
      state.pending = null;
      state.phaseDeadlineAt = null;
      if (!maybeFinishGame(state, now, events)) {
        if (Number(state.activePlayerId) === targetUserId) {
          advanceTurn(state, now, events, "leave_vote");
        } else {
          state.phase = "turn";
        }
      }
      return { state, events };
    }

    if (allVoted) {
      const rejectedTargetUserId = Number(state.pending.targetUserId);
      state.pending = null;
      state.phaseDeadlineAt = null;
      state.phase = "turn";
      const closed = createEvent("vote_updated", "Leave vote rejected", {
        targetUserId: rejectedTargetUserId,
      });
      events.push(closed);
      pushHistory(state, closed);
    }
    return { state, events };
  }

  if (type === "end_turn") {
    ensureActiveTurn(state, userId);
    advanceTurn(state, now, events, "manual_end");
    return { state, events };
  }

  if (type === "noop") {
    return { state, events };
  }

  throw createEngineError("unknown_action", 400);
}

function applyTimeouts(rawState, context) {
  const state = cloneState(rawState);
  const events = [];
  const now = context && context.now ? context.now : Date.now();
  const nowValue = nowMs(now);

  for (let i = 0; i < 5; i += 1) {
    if (state.phase === "finished") break;
    let changed = false;
    const phaseDeadline = state.phaseDeadlineAt ? Date.parse(state.phaseDeadlineAt) : null;
    const turnDeadline = state.turnDeadlineAt ? Date.parse(state.turnDeadlineAt) : null;

    if (state.phase === "turn" && turnDeadline != null && turnDeadline <= nowValue) {
      const timeout = createEvent("turn_changed", "Turn timeout, skipped", {
        activePlayerId: Number(state.activePlayerId),
      });
      events.push(timeout);
      pushHistory(state, timeout);
      advanceTurn(state, now, events, "timeout");
      changed = true;
    } else if (state.phase === "await_buy" && phaseDeadline != null && phaseDeadline <= nowValue && state.pending) {
      startAuction(state, Number(state.pending.propertyIndex), now, events);
      changed = true;
    } else if (state.phase === "auction" && phaseDeadline != null && phaseDeadline <= nowValue) {
      finalizeAuction(state, now, events);
      changed = true;
    } else if (state.phase === "trade" && phaseDeadline != null && phaseDeadline <= nowValue) {
      setTradeCancelled(state, events, "timeout");
      changed = true;
    } else if (state.phase === "vote_leave" && phaseDeadline != null && phaseDeadline <= nowValue && state.pending) {
      const pending = state.pending;
      const yesVotes = Object.values(pending.votes || {}).filter(Boolean).length;
      if (yesVotes >= majorityCount(state)) {
        markPlayerBankrupt(state, Number(pending.targetUserId), events, "vote_timeout", null);
      } else {
        const rejected = createEvent("vote_updated", "Leave vote rejected by timeout", {
          targetUserId: Number(pending.targetUserId),
        });
        events.push(rejected);
        pushHistory(state, rejected);
      }
      state.pending = null;
      state.phaseDeadlineAt = null;
      if (!maybeFinishGame(state, now, events)) {
        state.phase = "turn";
      }
      changed = true;
    }

    if (!changed) break;
  }

  return { state, events };
}

function createInitialState(options) {
  const now = options && options.now ? options.now : Date.now();
  const playersInput = options && Array.isArray(options.players) ? options.players : [];
  const turnCap = clampTurnCap(options && options.turnCap);
  const players = playersInput.map((entry, idx) => ({
    userId: Number(entry.userId),
    displayName: entry.displayName || "Player " + String(idx + 1),
    ready: !!entry.ready,
    tokenId: entry.tokenId == null ? null : Number(entry.tokenId),
    position: 0,
    cash: STARTING_CASH,
    inJail: false,
    jailTurns: 0,
    bankrupt: false,
    joinedAt: entry.joinedAt || nowIso(now),
  }));

  return {
    version: 1,
    board: BOARD,
    phase: "lobby",
    activePlayerId: null,
    turnCount: 0,
    turnHasRolled: false,
    turnDeadlineAt: null,
    phaseDeadlineAt: null,
    dice: null,
    ownership: {},
    pending: null,
    history: [],
    players,
    deck: {
      chance: CHANCE_CARDS.map((item) => item.id),
      chanceIndex: 0,
      community: COMMUNITY_CARDS.map((item) => item.id),
      communityIndex: 0,
    },
    meta: {
      createdAt: nowIso(now),
      startedAt: null,
      finishedAt: null,
      winnerUserId: null,
      turnCap,
      startingCash: STARTING_CASH,
      passGoCash: PASS_GO_CASH,
    },
  };
}

function syncPlayers(state, rows) {
  const byUserId = new Map(state.players.map((player) => [Number(player.userId), player]));
  const synced = [];
  rows.forEach((row) => {
    const userId = Number(row.userId);
    const current = byUserId.get(userId) || {
      userId,
      displayName: row.displayName || "Player",
      position: 0,
      cash: STARTING_CASH,
      inJail: false,
      jailTurns: 0,
      bankrupt: false,
      joinedAt: row.joinedAt || new Date().toISOString(),
    };
    current.displayName = row.displayName || current.displayName;
    current.ready = !!row.ready;
    current.tokenId = row.tokenId == null ? null : Number(row.tokenId);
    if (row.bankrupt != null) current.bankrupt = !!row.bankrupt;
    synced.push(current);
  });
  state.players = synced;
  return state;
}

module.exports = {
  BOARD,
  TURN_TIMEOUT_MS,
  PHASE_TIMEOUT_MS,
  STARTING_CASH,
  PASS_GO_CASH,
  DEFAULT_TURN_CAP,
  MIN_TURN_CAP,
  MAX_TURN_CAP,
  clampTurnCap,
  createInitialState,
  syncPlayers,
  applyAction,
  applyTimeouts,
  createEngineError,
  playerCapital,
};
