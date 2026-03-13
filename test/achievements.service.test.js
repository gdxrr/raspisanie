"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";

const { AchievementsService } = require("../src/services/achievementsService");

function createAuth(userId) {
  return {
    user: {
      id: Number(userId),
      first_name: "User",
    },
  };
}

function createHubStub() {
  return {
    events: [],
    broadcastAll(event, payload) {
      this.events.push({ event, payload });
    },
  };
}

class MemoryAchievementsRepo {
  constructor() {
    this.items = [];
    this.images = new Map();
    this.nextId = 1;
    this.nextTime = Date.parse("2026-03-13T00:00:00.000Z");
  }

  async listLatest(limit) {
    const safeLimit = Math.max(1, Number(limit) || 100);
    return this.items
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || Number(b.id) - Number(a.id))
      .slice(0, safeLimit)
      .map((item) => ({ ...item }));
  }

  async countAll() {
    return this.items.length;
  }

  async create(options) {
    const id = this.nextId++;
    const createdAt = new Date(this.nextTime).toISOString();
    this.nextTime += 1000;
    const item = {
      id,
      title: String(options.title || ""),
      description: String(options.description || ""),
      createdBy: options.createdBy == null ? null : Number(options.createdBy),
      createdAt,
    };
    this.items.push(item);
    this.images.set(id, {
      id,
      mimeType: String(options.imageMimeType || "image/png"),
      imageData: options.imageData,
    });
    return { ...item };
  }

  async getImageById(id) {
    return this.images.get(Number(id)) || null;
  }
}

async function createPngBuffer() {
  return sharp({
    create: {
      width: 80,
      height: 120,
      channels: 3,
      background: { r: 240, g: 90, b: 90 },
    },
  })
    .png()
    .toBuffer();
}

test("forbids create achievement for non-admin users", async () => {
  const repo = new MemoryAchievementsRepo();
  const service = new AchievementsService({
    repo,
    isConfiguredAdminUser: () => false,
  });

  const file = { buffer: await createPngBuffer(), mimetype: "image/png" };
  await assert.rejects(
    service.createAchievement(createAuth(101), { title: "A" }, file),
    function (err) {
      assert.equal(err.code, "forbidden");
      return true;
    }
  );
});

test("creates achievement, increases statuettes and returns sorted bootstrap", async () => {
  const repo = new MemoryAchievementsRepo();
  const service = new AchievementsService({
    repo,
    isConfiguredAdminUser: () => true,
  });
  const file = { buffer: await createPngBuffer(), mimetype: "image/png" };

  const first = await service.createAchievement(createAuth(301), { title: "First", description: "One" }, file);
  const second = await service.createAchievement(createAuth(301), { title: "Second", description: "Two" }, file);
  const bootstrap = await service.getBootstrap(createAuth(999));

  assert.equal(first.statuettesCount, 1);
  assert.equal(second.statuettesCount, 2);
  assert.equal(bootstrap.statuettesCount, 2);
  assert.equal(bootstrap.items.length, 2);
  assert.equal(bootstrap.items[0].title, "Second");
  assert.equal(bootstrap.items[1].title, "First");
});

test("broadcasts achievement_created event to websocket hub", async () => {
  const repo = new MemoryAchievementsRepo();
  const hub = createHubStub();
  const service = new AchievementsService({
    repo,
    isConfiguredAdminUser: () => true,
  });
  service.attachHub(hub);

  const file = { buffer: await createPngBuffer(), mimetype: "image/png" };
  const result = await service.createAchievement(createAuth(777), { title: "Realtime" }, file);

  assert.equal(result.statuettesCount, 1);
  assert.equal(hub.events.length, 1);
  assert.equal(hub.events[0].event, "achievement_created");
  assert.equal(hub.events[0].payload.item.title, "Realtime");
  assert.equal(hub.events[0].payload.statuettesCount, 1);
});
