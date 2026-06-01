const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const providerRoutes = require("./routes/providerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userReviewRoutes = require("./routes/userReviewRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const adminRoutes = require("./routes/adminRoutes");
const serviceCategoryRoutes = require("./routes/serviceCategoryRoutes");

const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    })
    .then(() => {
      console.log("MongoDB Connected inside app.js");
    })
    .catch((err) => {
      console.error("DB Connection Error inside app.js:", err.message);
    });
} else {
  console.error("MONGO_URI is missing in environment variables");
}

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
  const envPath = path.join(__dirname, "..", ".env");
  const isEnvPresent = fs.existsSync(envPath);
  const dbState = mongoose.connection.readyState;
  let dbStatus = "Disconnected";
  
  if (dbState === 1) dbStatus = "Connected";
  else if (dbState === 2) dbStatus = "Connecting";
  else if (dbState === 3) dbStatus = "Disconnecting";
  
  // Return more detailed info as requested
  res.json({
    message: "GharGhar Sewa Backend is bro and its running good i guess",
    envFilePresent: isEnvPresent,
    databaseStatus: dbStatus,
    dbStateCode: dbState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    mongoUriConfigured: !!process.env.MONGO_URI, // Check if the environment variable is loaded
  });
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