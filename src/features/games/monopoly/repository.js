"use strict";

const { pool } = require("../../shared/db");

function createRepoError(code, status) {
  const err = new Error(code);
  err.code = code;
  err.status = status;
  return err;
}

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapRoomRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    chatId: Number(row.chat_id),
    roomCode: String(row.room_code),
    status: row.status,
    hostUserId: Number(row.host_user_id),
    turnCap: Number(row.turn_cap),
    currentTurn: Number(row.current_turn || 0),
    winnerUserId: row.winner_user_id == null ? null : Number(row.winner_user_id),
    createdAt: toIso(row.created_at),
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
  };
}

function mapPlayerRow(row) {
  if (!row) return null;
  return {
    roomId: Number(row.room_id),
    userId: Number(row.user_id),
    displayName: row.display_name || "",
    ready: !!row.is_ready,
    bankrupt: !!row.is_bankrupt,
    tokenId: row.active_token_id == null ? null : Number(row.active_token_id),
    tokenSha256: row.token_sha256 || null,
    joinedAt: toIso(row.joined_at),
  };
}

function mapStateRow(row) {
  if (!row) return null;
  return {
    roomId: Number(row.room_id),
    version: Number(row.version || 1),
    state: row.state_json && typeof row.state_json === "object" ? row.state_json : {},
    updatedAt: toIso(row.updated_at),
  };
}

function mapTokenRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    mimeType: row.mime_type,
    sha256: row.sha256,
    imageData: row.image_data || null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
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

async function getRoomPlayersTx(client, roomId) {
  const res = await client.query(
    `SELECT rp.room_id,
            rp.user_id,
            rp.display_name,
            rp.is_ready,
            rp.is_bankrupt,
            rp.active_token_id,
            rp.joined_at,
            t.sha256 AS token_sha256
       FROM monopoly_room_players rp
       LEFT JOIN monopoly_player_tokens t
         ON t.id = rp.active_token_id
      WHERE rp.room_id = $1
      ORDER BY rp.joined_at ASC, rp.user_id ASC`,
    [Number(roomId)]
  );
  return res.rows.map(mapPlayerRow);
}

async function resolveRoomTx(client, chatId, roomCode, options) {
  const normalizedRoomCode = String(roomCode).toUpperCase();
  const useForUpdate = !!(options && options.forUpdate);
  const suffix = useForUpdate ? "\n      FOR UPDATE" : "";
  const roomRes = await client.query(
    `SELECT id,
            chat_id,
            room_code,
            status,
            host_user_id,
            turn_cap,
            current_turn,
            winner_user_id,
            created_at,
            started_at,
            finished_at
       FROM monopoly_rooms
      WHERE room_code = $1
      ORDER BY CASE WHEN chat_id = $2 THEN 0 ELSE 1 END ASC, id ASC${suffix}`,
    [normalizedRoomCode, Number(chatId)]
  );
  if (!roomRes.rows.length) throw createRepoError("room_not_found", 404);

  const exactMatch = roomRes.rows.find((row) => Number(row.chat_id) === Number(chatId));
  if (exactMatch) return mapRoomRow(exactMatch);

  if (roomRes.rows.length > 1) {
    throw createRepoError("room_code_ambiguous", 409);
  }

  return mapRoomRow(roomRes.rows[0]);
}

async function getRoomLockTx(client, chatId, roomCode) {
  const room = await resolveRoomTx(client, chatId, roomCode, { forUpdate: true });

  const stateRes = await client.query(
    `SELECT room_id, state_json, version, updated_at
       FROM monopoly_game_states
      WHERE room_id = $1
      FOR UPDATE`,
    [room.id]
  );
  if (!stateRes.rows.length) throw createRepoError("room_state_not_found", 500);
  const stateRow = mapStateRow(stateRes.rows[0]);
  const players = await getRoomPlayersTx(client, room.id);
  return { room, stateRow, players };
}

async function createRoom(options) {
  return withTransaction(async (client) => {
    const now = options.now instanceof Date ? options.now : new Date();
    const insertRoom = await client.query(
      `INSERT INTO monopoly_rooms (
          chat_id,
          room_code,
          status,
          host_user_id,
          turn_cap,
          current_turn,
          winner_user_id,
          created_at,
          started_at,
          finished_at
       )
       VALUES ($1, $2, 'lobby', $3, $4, 0, NULL, $5, NULL, NULL)
       RETURNING id,
                 chat_id,
                 room_code,
                 status,
                 host_user_id,
                 turn_cap,
                 current_turn,
                 winner_user_id,
                 created_at,
                 started_at,
                 finished_at`,
      [Number(options.chatId), String(options.roomCode).toUpperCase(), Number(options.hostUserId), Number(options.turnCap), now]
    );
    const room = mapRoomRow(insertRoom.rows[0]);
    await client.query(
      `INSERT INTO monopoly_room_players (
          room_id, user_id, display_name, is_ready, is_bankrupt, active_token_id, joined_at
       )
       VALUES ($1, $2, $3, $4, false, NULL, $5)`,
      [room.id, Number(options.hostUserId), String(options.hostDisplayName || ""), !!options.hostReady, now]
    );
    await client.query(
      `INSERT INTO monopoly_game_states (room_id, state_json, version, updated_at)
       VALUES ($1, $2::jsonb, 1, $3)`,
      [room.id, JSON.stringify(options.state || {}), now]
    );
    const players = await getRoomPlayersTx(client, room.id);
    return {
      room,
      state: options.state || {},
      version: 1,
      players,
    };
  });
}

async function withRoomTransaction(chatId, roomCode, fn) {
  return withTransaction(async (client) => {
    const locked = await getRoomLockTx(client, chatId, roomCode);
    return fn({
      client,
      room: locked.room,
      players: locked.players,
      state: locked.stateRow.state,
      version: locked.stateRow.version,
    });
  });
}

async function insertRoomPlayerTx(client, roomId, userId, displayName, now) {
  await client.query(
    `INSERT INTO monopoly_room_players (
        room_id, user_id, display_name, is_ready, is_bankrupt, active_token_id, joined_at
     )
     VALUES ($1, $2, $3, false, false, NULL, $4)
     ON CONFLICT (room_id, user_id)
     DO UPDATE SET display_name = EXCLUDED.display_name`,
    [Number(roomId), Number(userId), String(displayName || ""), now]
  );
}

async function updatePlayerReadyTx(client, roomId, userId, ready) {
  await client.query(
    `UPDATE monopoly_room_players
        SET is_ready = $3
      WHERE room_id = $1 AND user_id = $2`,
    [Number(roomId), Number(userId), !!ready]
  );
}

async function updatePlayersBankruptTx(client, roomId, players) {
  for (const player of players) {
    await client.query(
      `UPDATE monopoly_room_players
          SET is_bankrupt = $3
        WHERE room_id = $1 AND user_id = $2`,
      [Number(roomId), Number(player.userId), !!player.bankrupt]
    );
  }
}

async function assignPlayerTokenTx(client, roomId, userId, tokenId) {
  await client.query(
    `UPDATE monopoly_room_players
        SET active_token_id = $3
      WHERE room_id = $1 AND user_id = $2`,
    [Number(roomId), Number(userId), Number(tokenId)]
  );
}

async function roomHasTokenHashTx(client, roomId, sha256, excludeUserId) {
  const res = await client.query(
    `SELECT 1
       FROM monopoly_room_players rp
       JOIN monopoly_player_tokens t
         ON t.id = rp.active_token_id
      WHERE rp.room_id = $1
        AND t.sha256 = $2
        AND rp.user_id <> $3
      LIMIT 1`,
    [Number(roomId), String(sha256), Number(excludeUserId)]
  );
  return !!res.rows.length;
}

async function createPlayerTokenTx(client, options) {
  const now = options.now instanceof Date ? options.now : new Date();
  const res = await client.query(
    `INSERT INTO monopoly_player_tokens (
        user_id,
        mime_type,
        image_data,
        sha256,
        created_at,
        updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $5)
     RETURNING id, user_id, mime_type, image_data, sha256, created_at, updated_at`,
    [
      Number(options.userId),
      String(options.mimeType),
      options.imageData,
      String(options.sha256),
      now,
    ]
  );
  return mapTokenRow(res.rows[0]);
}

async function saveStateTx(client, options) {
  const now = options.now instanceof Date ? options.now : new Date();
  await client.query(
    `UPDATE monopoly_game_states
        SET state_json = $2::jsonb,
            version = $3,
            updated_at = $4
      WHERE room_id = $1`,
    [Number(options.roomId), JSON.stringify(options.state || {}), Number(options.version), now]
  );
  await client.query(
    `UPDATE monopoly_rooms
        SET status = $2,
            current_turn = $3,
            winner_user_id = $4,
            started_at = $5,
            finished_at = $6
      WHERE id = $1`,
    [
      Number(options.roomId),
      String(options.status),
      Number(options.currentTurn || 0),
      options.winnerUserId == null ? null : Number(options.winnerUserId),
      options.startedAt || null,
      options.finishedAt || null,
    ]
  );
}

async function appendEventsTx(client, roomId, version, events, now) {
  if (!Array.isArray(events) || !events.length) return;
  const stamp = now instanceof Date ? now : new Date();
  for (const entry of events) {
    await client.query(
      `INSERT INTO monopoly_game_events (
          room_id,
          version,
          event_type,
          payload,
          created_at
       )
       VALUES ($1, $2, $3, $4::jsonb, $5)`,
      [
        Number(roomId),
        Number(version),
        String(entry.type || "state_patch"),
        JSON.stringify({
          message: entry.message || "",
          payload: entry.payload || {},
          createdAt: entry.createdAt || stamp.toISOString(),
        }),
        stamp,
      ]
    );
  }
}

async function getBootstrap(chatId, roomCode) {
  const room = await resolveRoomTx(pool, chatId, roomCode, { forUpdate: false });
  const stateRes = await pool.query(
    `SELECT room_id, state_json, version, updated_at
       FROM monopoly_game_states
      WHERE room_id = $1`,
    [room.id]
  );
  if (!stateRes.rows.length) throw createRepoError("room_state_not_found", 500);
  const state = mapStateRow(stateRes.rows[0]);
  const players = await getRoomPlayersTx(pool, room.id);
  const eventsRes = await pool.query(
    `SELECT id, room_id, version, event_type, payload, created_at
       FROM monopoly_game_events
      WHERE room_id = $1
      ORDER BY id DESC
      LIMIT 40`,
    [room.id]
  );
  const events = eventsRes.rows.map((row) => ({
    id: Number(row.id),
    type: row.event_type,
    version: Number(row.version),
    payload: row.payload && typeof row.payload === "object" ? row.payload : {},
    createdAt: toIso(row.created_at),
  }));
  return {
    room,
    state: state.state,
    version: state.version,
    players,
    events,
  };
}

async function listActiveRooms() {
  const res = await pool.query(
    `SELECT id,
            chat_id,
            room_code,
            status,
            host_user_id,
            turn_cap,
            current_turn,
            winner_user_id,
            created_at,
            started_at,
            finished_at
       FROM monopoly_rooms
      WHERE status = 'active'
      ORDER BY id ASC`
  );
  return res.rows.map(mapRoomRow);
}

async function getTokenById(tokenId) {
  const res = await pool.query(
    `SELECT id, user_id, mime_type, image_data, sha256, created_at, updated_at
       FROM monopoly_player_tokens
      WHERE id = $1`,
    [Number(tokenId)]
  );
  if (!res.rows.length) return null;
  return mapTokenRow(res.rows[0]);
}

module.exports = {
  createRepoError,
  createRoom,
  withRoomTransaction,
  insertRoomPlayerTx,
  updatePlayerReadyTx,
  updatePlayersBankruptTx,
  assignPlayerTokenTx,
  roomHasTokenHashTx,
  createPlayerTokenTx,
  saveStateTx,
  appendEventsTx,
  getBootstrap,
  listActiveRooms,
  getTokenById,
  getRoomPlayersTx,
};
