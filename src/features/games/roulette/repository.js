"use strict";

const { pool } = require("../../shared/db");
const {
  ROULETTE_STARTING_BALANCE,
  getRouletteBetGrossPayout,
} = require("./lib/roulette");

function createRepoError(code, status) {
  const err = new Error(code);
  err.code = code;
  err.status = status;
  return err;
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value || null;
}

function mapWalletRow(row) {
  if (!row) return null;
  return {
    userId: Number(row.user_id),
    balance: Number(row.balance),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapRoundRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    roomId: String(row.room_id),
    status: row.status,
    winningNumber: row.winning_number == null ? null : Number(row.winning_number),
    winningColor: row.winning_color || null,
    openedAt: toIso(row.opened_at),
    closesAt: toIso(row.closes_at),
    spunAt: toIso(row.spun_at),
    settledAt: toIso(row.settled_at),
  };
}

function mapBetRow(row) {
  if (!row) return null;
  return {
    roundId: Number(row.round_id),
    userId: Number(row.user_id),
    kind: row.bet_type,
    value: row.bet_value,
    amount: Number(row.amount),
    createdAt: toIso(row.created_at),
  };
}

function mapLedgerRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    reason: row.reason,
    amount: Number(row.amount),
    balanceAfter: Number(row.balance_after),
    roundId: row.round_id == null ? null : Number(row.round_id),
    meta: row.meta && typeof row.meta === "object" ? row.meta : {},
    createdAt: toIso(row.created_at),
  };
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function ensureWalletTx(client, userId, options) {
  const now = options && options.now instanceof Date ? options.now : new Date();
  const startingBalance = Number(
    options && options.startingBalance != null ? options.startingBalance : ROULETTE_STARTING_BALANCE
  );
  const existing = await client.query(
    "SELECT user_id, balance, created_at, updated_at FROM roulette_wallets WHERE user_id = $1 FOR UPDATE",
    [Number(userId)]
  );
  if (existing.rows.length > 0) {
    return { wallet: mapWalletRow(existing.rows[0]), created: false };
  }

  const inserted = await client.query(
    `INSERT INTO roulette_wallets (user_id, balance, created_at, updated_at)
     VALUES ($1, $2, $3, $3)
     RETURNING user_id, balance, created_at, updated_at`,
    [Number(userId), startingBalance, now]
  );
  await client.query(
    `INSERT INTO roulette_wallet_ledger (user_id, reason, amount, balance_after, round_id, meta, created_at)
     VALUES ($1, 'welcome_bonus', $2, $2, NULL, $3::jsonb, $4)`,
    [Number(userId), startingBalance, JSON.stringify({ source: "system" }), now]
  );
  return { wallet: mapWalletRow(inserted.rows[0]), created: true };
}

async function ensureWallet(userId, options) {
  return withTransaction(async (client) => {
    const result = await ensureWalletTx(client, userId, options);
    return result.wallet;
  });
}

async function getWallet(userId) {
  const res = await pool.query(
    "SELECT user_id, balance, created_at, updated_at FROM roulette_wallets WHERE user_id = $1",
    [Number(userId)]
  );
  return res.rows.length ? mapWalletRow(res.rows[0]) : null;
}

async function getCurrentRound(roomId) {
  const res = await pool.query(
    `SELECT id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at
     FROM roulette_rounds
     WHERE room_id = $1 AND status IN ('open', 'spinning')
     ORDER BY opened_at DESC
     LIMIT 1`,
    [String(roomId)]
  );
  return res.rows.length ? mapRoundRow(res.rows[0]) : null;
}

async function getRoundById(roundId) {
  const res = await pool.query(
    `SELECT id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at
     FROM roulette_rounds
     WHERE id = $1`,
    [Number(roundId)]
  );
  return res.rows.length ? mapRoundRow(res.rows[0]) : null;
}

async function ensureOpenRound(roomId, options) {
  return withTransaction(async (client) => {
    const current = await client.query(
      `SELECT id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at
       FROM roulette_rounds
       WHERE room_id = $1 AND status IN ('open', 'spinning')
       ORDER BY opened_at DESC
       LIMIT 1
       FOR UPDATE`,
      [String(roomId)]
    );
    if (current.rows.length > 0) {
      return mapRoundRow(current.rows[0]);
    }

    const now = options && options.now instanceof Date ? options.now : new Date();
    const betWindowMs = Number(options && options.betWindowMs) || 15000;
    const closesAt = new Date(now.getTime() + betWindowMs);
    const inserted = await client.query(
      `INSERT INTO roulette_rounds (room_id, status, opened_at, closes_at)
       VALUES ($1, 'open', $2, $3)
       RETURNING id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at`,
      [String(roomId), now, closesAt]
    );
    return mapRoundRow(inserted.rows[0]);
  });
}

async function getRoundSummary(roundId) {
  const res = await pool.query(
    `SELECT
       COUNT(*)::int AS bet_count,
       COUNT(DISTINCT user_id)::int AS participant_count,
       COALESCE(SUM(amount), 0)::int AS total_amount
     FROM roulette_bets
     WHERE round_id = $1`,
    [Number(roundId)]
  );
  const row = res.rows[0] || {};
  return {
    betCount: Number(row.bet_count || 0),
    participantCount: Number(row.participant_count || 0),
    totalAmount: Number(row.total_amount || 0),
  };
}

async function getUserBetsForRound(roundId, userId) {
  const res = await pool.query(
    `SELECT round_id, user_id, bet_type, bet_value, amount, created_at
     FROM roulette_bets
     WHERE round_id = $1 AND user_id = $2
     ORDER BY bet_type, bet_value`,
    [Number(roundId), Number(userId)]
  );
  return res.rows.map(mapBetRow);
}

async function getRoomHistory(roomId, limit) {
  const res = await pool.query(
    `SELECT id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at
     FROM roulette_rounds
     WHERE room_id = $1 AND status = 'settled'
     ORDER BY settled_at DESC
     LIMIT $2`,
    [String(roomId), Number(limit)]
  );
  return res.rows.map(mapRoundRow);
}

async function listActiveRounds() {
  const res = await pool.query(
    `SELECT id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at
     FROM roulette_rounds
     WHERE status IN ('open', 'spinning')
     ORDER BY room_id ASC, opened_at ASC`
  );
  return res.rows.map(mapRoundRow);
}

async function placeBets(options) {
  return withTransaction(async (client) => {
    const userId = Number(options.userId);
    const roomId = String(options.roomId);
    const roundId = Number(options.roundId);
    const now = options.now instanceof Date ? options.now : new Date();
    const bets = Array.isArray(options.bets) ? options.bets : [];
    const totalAmount = bets.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
      throw createRepoError("invalid_bets", 400);
    }

    const roundRes = await client.query(
      `SELECT id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at
       FROM roulette_rounds
       WHERE id = $1 AND room_id = $2
       FOR UPDATE`,
      [roundId, roomId]
    );
    if (roundRes.rows.length === 0) {
      throw createRepoError("round_not_found", 404);
    }
    const round = mapRoundRow(roundRes.rows[0]);
    if (round.status !== "open" || Date.parse(round.closesAt) <= now.getTime()) {
      throw createRepoError("round_closed", 409);
    }

    const ensured = await ensureWalletTx(client, userId, {
      now,
      startingBalance: options.startingBalance,
    });
    if (ensured.wallet.balance < totalAmount) {
      throw createRepoError("insufficient_balance", 400);
    }

    for (const bet of bets) {
      await client.query(
        `INSERT INTO roulette_bets (round_id, user_id, bet_type, bet_value, amount, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (round_id, user_id, bet_type, bet_value)
         DO UPDATE SET amount = roulette_bets.amount + EXCLUDED.amount`,
        [roundId, userId, bet.kind, bet.value, Number(bet.amount), now]
      );
    }

    const updatedWallet = await client.query(
      `UPDATE roulette_wallets
       SET balance = balance - $2, updated_at = $3
       WHERE user_id = $1
       RETURNING user_id, balance, created_at, updated_at`,
      [userId, totalAmount, now]
    );
    const wallet = mapWalletRow(updatedWallet.rows[0]);
    await client.query(
      `INSERT INTO roulette_wallet_ledger (user_id, reason, amount, balance_after, round_id, meta, created_at)
       VALUES ($1, 'bet', $2, $3, $4, $5::jsonb, $6)`,
      [userId, -totalAmount, wallet.balance, roundId, JSON.stringify({ bets }), now]
    );

    const myBetsRes = await client.query(
      `SELECT round_id, user_id, bet_type, bet_value, amount, created_at
       FROM roulette_bets
       WHERE round_id = $1 AND user_id = $2
       ORDER BY bet_type, bet_value`,
      [roundId, userId]
    );

    return {
      round,
      wallet,
      myBets: myBetsRes.rows.map(mapBetRow),
    };
  });
}

async function startRoundSpin(roundId, options) {
  const spunAt = options && options.spunAt instanceof Date ? options.spunAt : new Date();
  const res = await pool.query(
    `UPDATE roulette_rounds
     SET status = 'spinning',
         winning_number = $2,
         winning_color = $3,
         spun_at = $4
     WHERE id = $1 AND status = 'open'
     RETURNING id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at`,
    [Number(roundId), Number(options.winningNumber), options.winningColor, spunAt]
  );
  return res.rows.length ? mapRoundRow(res.rows[0]) : null;
}

async function settleRound(roundId, options) {
  return withTransaction(async (client) => {
    const settledAt = options && options.settledAt instanceof Date ? options.settledAt : new Date();
    const roundRes = await client.query(
      `SELECT id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at
       FROM roulette_rounds
       WHERE id = $1
       FOR UPDATE`,
      [Number(roundId)]
    );
    if (roundRes.rows.length === 0) return null;

    const round = mapRoundRow(roundRes.rows[0]);
    if (round.status !== "spinning" || round.settledAt) {
      return null;
    }

    const betsRes = await client.query(
      `SELECT round_id, user_id, bet_type, bet_value, amount, created_at
       FROM roulette_bets
       WHERE round_id = $1
       ORDER BY user_id ASC, bet_type ASC, bet_value ASC`,
      [Number(roundId)]
    );
    const bets = betsRes.rows.map(mapBetRow);
    const payoutsByUser = new Map();

    for (const bet of bets) {
      const gross = getRouletteBetGrossPayout(bet, round.winningNumber);
      if (gross <= 0) continue;
      const prev = payoutsByUser.get(bet.userId) || 0;
      payoutsByUser.set(bet.userId, prev + gross);
    }

    const payouts = [];
    for (const [userId, amount] of payoutsByUser.entries()) {
      const walletRes = await client.query(
        `UPDATE roulette_wallets
         SET balance = balance + $2, updated_at = $3
         WHERE user_id = $1
         RETURNING user_id, balance, created_at, updated_at`,
        [Number(userId), Number(amount), settledAt]
      );
      if (!walletRes.rows.length) continue;
      const wallet = mapWalletRow(walletRes.rows[0]);
      await client.query(
        `INSERT INTO roulette_wallet_ledger (user_id, reason, amount, balance_after, round_id, meta, created_at)
         VALUES ($1, 'payout', $2, $3, $4, $5::jsonb, $6)`,
        [
          Number(userId),
          Number(amount),
          wallet.balance,
          Number(roundId),
          JSON.stringify({ winningNumber: round.winningNumber, winningColor: round.winningColor }),
          settledAt,
        ]
      );
      payouts.push({ userId: Number(userId), amount: Number(amount), wallet });
    }

    const updatedRound = await client.query(
      `UPDATE roulette_rounds
       SET status = 'settled', settled_at = $2
       WHERE id = $1
       RETURNING id, room_id, status, winning_number, winning_color, opened_at, closes_at, spun_at, settled_at`,
      [Number(roundId), settledAt]
    );

    return {
      round: mapRoundRow(updatedRound.rows[0]),
      payouts,
    };
  });
}

async function applyAdminGrant(options) {
  return withTransaction(async (client) => {
    const actorUserId = Number(options.actorUserId);
    const targetUserId = Number(options.targetUserId);
    const amount = Number(options.amount);
    const now = options.now instanceof Date ? options.now : new Date();

    const ensured = await ensureWalletTx(client, targetUserId, {
      now,
      startingBalance: options.startingBalance,
    });
    const walletRes = await client.query(
      `UPDATE roulette_wallets
       SET balance = balance + $2, updated_at = $3
       WHERE user_id = $1
       RETURNING user_id, balance, created_at, updated_at`,
      [targetUserId, amount, now]
    );
    const wallet = mapWalletRow(walletRes.rows[0]);
    const meta = {
      actorUserId,
      note: options.note ? String(options.note) : "",
      welcomeWalletCreated: ensured.created,
    };
    const ledgerRes = await client.query(
      `INSERT INTO roulette_wallet_ledger (user_id, reason, amount, balance_after, round_id, meta, created_at)
       VALUES ($1, 'admin_grant', $2, $3, NULL, $4::jsonb, $5)
       RETURNING id, user_id, reason, amount, balance_after, round_id, meta, created_at`,
      [targetUserId, amount, wallet.balance, JSON.stringify(meta), now]
    );
    return {
      wallet,
      entry: mapLedgerRow(ledgerRes.rows[0]),
    };
  });
}

async function getRecentAdminGrants(limit) {
  const res = await pool.query(
    `SELECT id, user_id, reason, amount, balance_after, round_id, meta, created_at
     FROM roulette_wallet_ledger
     WHERE reason = 'admin_grant'
     ORDER BY created_at DESC
     LIMIT $1`,
    [Number(limit)]
  );
  return res.rows.map(mapLedgerRow);
}

async function listWalletUsers() {
  const res = await pool.query(
    `SELECT user_id, balance, created_at, updated_at
     FROM roulette_wallets
     ORDER BY updated_at DESC, user_id ASC`
  );
  return res.rows.map(mapWalletRow);
}

module.exports = {
  applyAdminGrant,
  ensureOpenRound,
  ensureWallet,
  getCurrentRound,
  getRecentAdminGrants,
  getRoomHistory,
  getRoundById,
  getRoundSummary,
  getUserBetsForRound,
  getWallet,
  listActiveRounds,
  listWalletUsers,
  placeBets,
  settleRound,
  startRoundSpin,
};
