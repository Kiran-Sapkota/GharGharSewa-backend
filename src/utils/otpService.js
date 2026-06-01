const bcrypt = require("bcryptjs");
const Otp = require("../models/Otp");

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const generateOtpCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const createAndSendOtp = async (email, purpose, sendFn) => {
  const normalizedEmail = email.trim().toLowerCase();
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);

  await Otp.deleteMany({ email: normalizedEmail, purpose });

  await Otp.create({
    email: normalizedEmail,
    codeHash,
    purpose,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
  });

  await sendFn(normalizedEmail, code, purpose);

  return { expiresInMinutes: 10 };
};

const verifyOtp = async (email, purpose, code) => {
  const normalizedEmail = email.trim().toLowerCase();
  const record = await Otp.findOne({ email: normalizedEmail, purpose }).sort({
    createdAt: -1,
  });

  if (!record) {
    return { valid: false, message: "No verification code found. Request a new one." };
  }

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: "Code expired. Request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: "Too many attempts. Request a new code." };
  }

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    return { valid: false, message: "Invalid verification code." };
  }

  await Otp.deleteOne({ _id: record._id });
  return { valid: true };
};

module.exports = {
  createAndSendOtp,
  verifyOtp,
};
