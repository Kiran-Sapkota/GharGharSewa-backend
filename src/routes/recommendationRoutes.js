const express = require("express");

const {
  getRecommendations,
} = require("../controllers/recommendationController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("user"),
  getRecommendations
);

module.exports = router;