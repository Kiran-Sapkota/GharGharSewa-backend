const axios = require("axios");

const sendMessageToBot = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const rasaResponse = await axios.post(process.env.RASA_URL, {
      sender: req.user ? req.user._id.toString() : "guest_user",
      message,
    });

    const botReplies = rasaResponse.data.map((reply) => reply.text);

    res.status(200).json({
      success: true,
      userMessage: message,
      botReplies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Chatbot server error",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessageToBot,
};