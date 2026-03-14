const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString });

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'schedule' AND column_name = 'data') THEN
          CREATE TABLE schedule_new (
            id INT PRIMARY KEY,
            day TEXT NOT NULL,
            start TEXT NOT NULL,
            "end" TEXT,
            type TEXT,
            subject TEXT,
            room TEXT,
            teacher TEXT,
            week TEXT
          );
          INSERT INTO schedule_new (id, day, start, "end", type, subject, room, teacher, week)
          SELECT (e->>'id')::int, e->>'day', e->>'start', e->>'end', e->>'type', e->>'subject', e->>'room', e->>'teacher', e->>'week'
          FROM schedule, jsonb_array_elements(data) AS e;
          DROP TABLE schedule;
          ALTER TABLE schedule_new RENAME TO schedule;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedule') THEN
          CREATE TABLE schedule (
            id INT PRIMARY KEY,
            day TEXT NOT NULL,
            start TEXT NOT NULL,
            "end" TEXT,
            type TEXT,
            subject TEXT,
            room TEXT,
            teacher TEXT,
            week TEXT
          );
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        chat_id BIGINT PRIMARY KEY,
        in_broadcast BOOLEAN NOT NULL DEFAULT false,
        first_name TEXT,
        last_name TEXT,
        username TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        chat_id BIGINT NOT NULL,
        day TEXT NOT NULL,
        start TEXT NOT NULL,
        minutes_before INT NOT NULL DEFAULT 0,
        days_before INT NOT NULL DEFAULT 0,
        remind_at TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (chat_id, day, start)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hidden_pairs (
        chat_id BIGINT NOT NULL,
        pair_id INT NOT NULL,
        mode VARCHAR(10) NOT NULL CHECK (mode IN ('hidden', 'dimmed')),
        PRIMARY KEY (chat_id, pair_id, mode)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subject_backgrounds (
        chat_id BIGINT NOT NULL,
        subject TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        image_data BYTEA NOT NULL,
        sha256 TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (chat_id, subject)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT PRIMARY KEY DEFAULT 1,
        count INT NOT NULL DEFAULT 0,
        CONSTRAINT single_likes_row CHECK (id = 1)
      );
      INSERT INTO likes (id, count) VALUES (1, 0)
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS game2048_leaderboard (
        id SERIAL PRIMARY KEY,
        score INT NOT NULL,
        name TEXT NOT NULL,
        user_id BIGINT,
        date DATE NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS progress (
        user_id BIGINT NOT NULL,
        deadline_id TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT false,
        PRIMARY KEY (user_id, deadline_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        chat_id BIGINT NOT NULL,
        question TEXT NOT NULL,
        created_by BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        closed BOOLEAN NOT NULL DEFAULT false
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS poll_options (
        poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        option_index INT NOT NULL,
        text TEXT NOT NULL,
        count INT NOT NULL DEFAULT 0,
        PRIMARY KEY (poll_id, option_index)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS poll_votes (
        poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL,
        option_index INT NOT NULL,
        PRIMARY KEY (poll_id, user_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bets (
        schedule_id INT NOT NULL,
        chat_id BIGINT NOT NULL,
        count INT NOT NULL,
        PRIMARY KEY (schedule_id, chat_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS birthdays (
        chat_id BIGINT PRIMARY KEY,
        day INT NOT NULL,
        month INT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deadlines (
        id TEXT PRIMARY KEY,
        subject TEXT,
        task TEXT,
        date DATE NOT NULL
      );
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deadlines' AND column_name = 'type') THEN
          ALTER TABLE deadlines ADD COLUMN type TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deadlines' AND column_name = 'work_type') THEN
          ALTER TABLE deadlines ADD COLUMN work_type TEXT;
        END IF;
      END $$;
    `);

    const { DEFAULT_DEADLINES } = require("../lib/seedDeadlinesData");
    const countResult = await client.query("SELECT COUNT(*) AS n FROM deadlines");
    if (Number(countResult.rows[0].n) === 0 && DEFAULT_DEADLINES.length > 0) {
      for (const d of DEFAULT_DEADLINES) {
        await client.query(
          `INSERT INTO deadlines (id, subject, task, date, type, work_type) VALUES ($1, $2, $3, $4::date, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [d.id, d.subject ?? null, d.task ?? null, d.date, d.type ?? "soft", d.workType ?? null]
        );
      }
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS deadline_reminders (
        chat_id BIGINT PRIMARY KEY,
        by_subject JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS roulette_wallets (
        user_id BIGINT PRIMARY KEY,
        balance INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS roulette_wallet_ledger (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        reason TEXT NOT NULL,
        amount INT NOT NULL,
        balance_after INT NOT NULL,
        round_id BIGINT,
        meta JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS roulette_rounds (
        id BIGSERIAL PRIMARY KEY,
        room_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('open', 'spinning', 'settled')),
        winning_number INT,
        winning_color TEXT,
        opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        closes_at TIMESTAMPTZ NOT NULL,
        spun_at TIMESTAMPTZ,
        settled_at TIMESTAMPTZ
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS roulette_bets (
        round_id BIGINT NOT NULL REFERENCES roulette_rounds(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL,
        bet_type TEXT NOT NULL,
        bet_value TEXT NOT NULL,
        amount INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (round_id, user_id, bet_type, bet_value)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS roulette_rounds_room_status_idx
      ON roulette_rounds (room_id, status, opened_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS roulette_rounds_room_settled_idx
      ON roulette_rounds (room_id, settled_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS roulette_ledger_user_created_idx
      ON roulette_wallet_ledger (user_id, created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS monopoly_rooms (
        id BIGSERIAL PRIMARY KEY,
        chat_id BIGINT NOT NULL,
        room_code TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('lobby', 'active', 'finished')),
        host_user_id BIGINT NOT NULL,
        turn_cap INT NOT NULL DEFAULT 120,
        current_turn INT NOT NULL DEFAULT 0,
        winner_user_id BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        started_at TIMESTAMPTZ,
        finished_at TIMESTAMPTZ,
        UNIQUE (chat_id, room_code)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS monopoly_player_tokens (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        mime_type TEXT NOT NULL,
        image_data BYTEA NOT NULL,
        sha256 TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS monopoly_room_players (
        room_id BIGINT NOT NULL REFERENCES monopoly_rooms(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL,
        display_name TEXT NOT NULL DEFAULT '',
        is_ready BOOLEAN NOT NULL DEFAULT false,
        is_bankrupt BOOLEAN NOT NULL DEFAULT false,
        active_token_id BIGINT REFERENCES monopoly_player_tokens(id),
        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (room_id, user_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS monopoly_game_states (
        room_id BIGINT PRIMARY KEY REFERENCES monopoly_rooms(id) ON DELETE CASCADE,
        state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        version INT NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS monopoly_game_events (
        id BIGSERIAL PRIMARY KEY,
        room_id BIGINT NOT NULL REFERENCES monopoly_rooms(id) ON DELETE CASCADE,
        version INT NOT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS monopoly_rooms_status_idx
      ON monopoly_rooms (status, created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS monopoly_events_room_idx
      ON monopoly_game_events (room_id, id DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS monopoly_tokens_sha_idx
      ON monopoly_player_tokens (sha256);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS group_achievements (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_mime_type TEXT NOT NULL,
        image_data BYTEA NOT NULL,
        created_by BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS group_achievements_created_idx
      ON group_achievements (created_at DESC, id DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS message_log (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        chat_id BIGINT,
        text TEXT
      );
    `);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDb,
};
