const express = require("express");

const {
  submitReview,
  getProviderReviews,
} = require("../controllers/reviewController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("user"),
  submitReview
);

router.get(
  "/provider/:providerId",
  getProviderReviews
);

module.exports = router;