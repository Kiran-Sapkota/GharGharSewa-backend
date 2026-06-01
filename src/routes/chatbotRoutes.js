const express = require("express");

const {
  sendMessageToBot,
} = require("../controllers/chatbotController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, sendMessageToBot);

module.exports = router;