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
      CREATE TABLE IF NOT EXISTS deadline_reminders (
        chat_id BIGINT PRIMARY KEY,
        by_subject JSONB NOT NULL DEFAULT '{}'::jsonb
      );
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
