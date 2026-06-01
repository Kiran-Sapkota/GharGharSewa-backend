require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const ServiceCategory = require("../models/ServiceCategory");
const { SERVICE_CATEGORIES } = require("./servicesCatalog");

async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });
  console.log("Connected to MongoDB");

  // Seed service categories (idempotent)
  for (const cat of SERVICE_CATEGORIES) {
    await ServiceCategory.updateOne({ name: cat.name }, cat, { upsert: true });
  }
  console.log(`${SERVICE_CATEGORIES.length} service categories upserted`);

  // Seed admin (idempotent)
  const adminEmail = process.env.ADMIN_EMAIL || "admin@gharsewa.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  const exists = await User.findOne({ email: adminEmail });
  if (exists) {
    console.log(`Admin already exists: ${adminEmail}`);
  } else {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: "GharSewa Admin",
      email: adminEmail,
      password: hashed,
      role: "admin",
      isActive: true,
      isEmailVerified: true,
    });
    console.log(`Admin created: ${adminEmail}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
