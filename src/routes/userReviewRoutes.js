const express = require("express");

const {
  submitUserReview,
  getUserReviews,
} = require("../controllers/userReviewController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/user/:userId",
  protect,
  getUserReviews
);

module.exports = router;