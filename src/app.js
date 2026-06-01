const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const providerRoutes = require("./routes/providerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userReviewRoutes = require("./routes/userReviewRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const adminRoutes = require("./routes/adminRoutes");
const serviceCategoryRoutes = require("./routes/serviceCategoryRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://ghar-ghar-sewa-frontend.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("GharGhar Sewa Backend is running");
});

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(204).send();
});

app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user-reviews", userReviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceCategoryRoutes);

module.exports = app;