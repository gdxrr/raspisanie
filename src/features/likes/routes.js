const express = require("express");
const likesRepo = require("./repository");

const router = express.Router();

router.get("/likes", async (req, res, next) => {
  try {
    const count = await likesRepo.getLikesCount();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

router.post("/like", async (req, res, next) => {
  try {
    const count = await likesRepo.incrementLike();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
