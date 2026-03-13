"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createInitialState,
  applyAction,
  applyTimeouts,
} = require("../src/lib/monopolyEngine");

function createState(userIds) {
  return createInitialState({
    now: Date.parse("2026-03-12T12:00:00.000Z"),
    turnCap: 120,
    players: userIds.map((userId, idx) => ({
      userId,
      displayName: "Player " + String(idx + 1),
      ready: true,
      tokenId: null,
    })),
  });
}

function queueRandom(values) {
  const queue = values.slice();
  return function () {
    return queue.length ? queue.shift() : 0.1;
  };
}

test("player can buy unowned property after dice roll", () => {
  let state = createState([101, 202]);
  const started = applyAction(state, { type: "start_game", payload: {} }, {
    userId: 101,
    now: Date.parse("2026-03-12T12:00:01.000Z"),
    random: () => 0.5,
  });
  state = started.state;
  const activePlayerId = Number(state.activePlayerId);
  const rolled = applyAction(state, { type: "roll_dice", payload: {} }, {
    userId: activePlayerId,
    now: Date.parse("2026-03-12T12:00:05.000Z"),
    random: queueRandom([0, 0.2]),
  });
  state = rolled.state;
  assert.equal(state.phase, "await_buy");
  assert.equal(state.pending.kind, "buy_offer");

  const cashBefore = state.players.find((player) => Number(player.userId) === activePlayerId).cash;
  const bought = applyAction(state, { type: "buy_property", payload: {} }, {
    userId: activePlayerId,
    now: Date.parse("2026-03-12T12:00:08.000Z"),
    random: Math.random,
  });
  state = bought.state;
  assert.equal(state.ownership[String(3)], activePlayerId);
  const cashAfter = state.players.find((player) => Number(player.userId) === activePlayerId).cash;
  assert.equal(cashBefore - cashAfter, 60);
});

test("timeout moves pending buy to auction", () => {
  const state = createState([1, 2]);
  state.phase = "await_buy";
  state.activePlayerId = 1;
  state.turnCount = 3;
  state.pending = {
    kind: "buy_offer",
    propertyIndex: 1,
    playerId: 1,
    price: 60,
  };
  state.phaseDeadlineAt = "2026-03-12T12:00:00.000Z";
  const timedOut = applyTimeouts(state, {
    now: Date.parse("2026-03-12T12:01:00.000Z"),
  });
  assert.equal(timedOut.state.phase, "auction");
  assert.equal(timedOut.state.pending.kind, "auction");
});

test("trade transfers cash and ownership between players", () => {
  const state = createState([10, 20]);
  state.phase = "turn";
  state.activePlayerId = 10;
  state.turnCount = 1;
  state.turnDeadlineAt = "2026-03-12T12:02:00.000Z";
  state.ownership["1"] = 10;
  state.ownership["3"] = 20;

  const offered = applyAction(state, {
    type: "offer_trade",
    payload: {
      targetUserId: 20,
      offerCash: 100,
      requestCash: 50,
      offerProperties: [1],
      requestProperties: [3],
    },
  }, {
    userId: 10,
    now: Date.parse("2026-03-12T12:00:20.000Z"),
    random: Math.random,
  });

  const accepted = applyAction(offered.state, {
    type: "respond_trade",
    payload: { accept: true },
  }, {
    userId: 20,
    now: Date.parse("2026-03-12T12:00:30.000Z"),
    random: Math.random,
  });

  const player10 = accepted.state.players.find((player) => Number(player.userId) === 10);
  const player20 = accepted.state.players.find((player) => Number(player.userId) === 20);
  assert.equal(accepted.state.ownership["1"], 20);
  assert.equal(accepted.state.ownership["3"], 10);
  assert.equal(player10.cash, 1450);
  assert.equal(player20.cash, 1550);
});

test("leave vote eliminates target on majority yes", () => {
  const state = createState([11, 22, 33]);
  state.phase = "turn";
  state.activePlayerId = 11;
  state.turnCount = 4;
  state.turnDeadlineAt = "2026-03-12T12:02:00.000Z";

  const requested = applyAction(state, {
    type: "leave_request",
    payload: { targetUserId: 33 },
  }, {
    userId: 22,
    now: Date.parse("2026-03-12T12:00:10.000Z"),
    random: Math.random,
  });
  const voted = applyAction(requested.state, {
    type: "vote_leave",
    payload: { approve: true },
  }, {
    userId: 11,
    now: Date.parse("2026-03-12T12:00:12.000Z"),
    random: Math.random,
  });
  const eliminated = voted.state.players.find((player) => Number(player.userId) === 33);
  assert.ok(eliminated.bankrupt);
});
