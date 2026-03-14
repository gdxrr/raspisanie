"use strict";

const achievementsRepo = require("./repository");
const rolesService = require("../../shared/lib/roles");
const { normalizeAchievementImage } = require("./lib/achievementImage");

function createServiceError(code, status) {
  const err = new Error(code);
  err.code = code;
  err.status = status;
  return err;
}

class AchievementsService {
  constructor(options) {
    this.repo = (options && options.repo) || achievementsRepo;
    this.maxItems = Number((options && options.maxItems) || 100);
    this.isConfiguredAdminUser =
      (options && options.isConfiguredAdminUser) || ((authData) => rolesService.isConfiguredAdminUser(authData));
    this.hub = null;
  }

  attachHub(hub) {
    this.hub = hub || null;
  }

  getContext(authData) {
    const userId = authData && authData.user && authData.user.id != null ? Number(authData.user.id) : null;
    if (!userId) {
      throw createServiceError("unauthorized", 401);
    }
    return { userId };
  }

  serializeItem(item) {
    if (!item) return null;
    return {
      id: Number(item.id),
      title: item.title || "",
      description: item.description || "",
      imageUrl: "/api/achievements/images/" + String(item.id),
      createdBy: item.createdBy == null ? null : Number(item.createdBy),
      createdAt: item.createdAt || null,
    };
  }

  async getBootstrap(authData) {
    this.getContext(authData);
    const [items, statuettesCount] = await Promise.all([
      this.repo.listLatest(this.maxItems),
      this.repo.countAll(),
    ]);
    return {
      items: items.map((item) => this.serializeItem(item)),
      statuettesCount: Number(statuettesCount || 0),
      canCreate: !!this.isConfiguredAdminUser(authData),
    };
  }

  async createAchievement(authData, payload, file) {
    const ctx = this.getContext(authData);
    if (!this.isConfiguredAdminUser(authData)) {
      throw createServiceError("forbidden", 403);
    }

    const title = payload && payload.title != null ? String(payload.title).trim() : "";
    const description = payload && payload.description != null ? String(payload.description).trim() : "";

    if (!title) throw createServiceError("title_required", 400);
    if (title.length > 80) throw createServiceError("title_too_long", 400);
    if (description.length > 500) throw createServiceError("description_too_long", 400);
    if (!file || !Buffer.isBuffer(file.buffer) || !file.buffer.length) {
      throw createServiceError("image_required", 400);
    }

    const normalized = await normalizeAchievementImage(file.buffer, String(file.mimetype || ""));
    const created = await this.repo.create({
      title,
      description,
      imageMimeType: normalized.mimeType,
      imageData: normalized.buffer,
      createdBy: ctx.userId,
    });
    const serializedItem = this.serializeItem(created);
    const statuettesCount = await this.repo.countAll();

    this.broadcastAll("achievement_created", {
      item: serializedItem,
      statuettesCount: Number(statuettesCount || 0),
    });

    return {
      item: serializedItem,
      statuettesCount: Number(statuettesCount || 0),
      canCreate: true,
    };
  }

  async getImageById(id) {
    const image = await this.repo.getImageById(id);
    if (!image || !image.imageData) {
      throw createServiceError("achievement_not_found", 404);
    }
    return image;
  }

  broadcastAll(event, payload) {
    if (!this.hub || typeof this.hub.broadcastAll !== "function") return;
    this.hub.broadcastAll(event, payload);
  }
}

module.exports = new AchievementsService({
  repo: achievementsRepo,
});

module.exports.AchievementsService = AchievementsService;
