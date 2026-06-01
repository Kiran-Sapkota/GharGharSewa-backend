const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ServiceProvider = require("../models/ServiceProvider");
const generateToken = require("../utils/generateToken");
const { createAndSendOtp, verifyOtp } = require("../utils/otpService");
const { sendOtpEmail, sendProviderPendingEmail, notifyAdminNewProvider } = require("../utils/emailService");

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  location: user.location,
  isEmailVerified: user.isEmailVerified,
});

// REGISTER — creates account, sends OTP (no token until verified)
const register = async (req, res) => {
  try {
    const { name, email, password, role, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        await createAndSendOtp(normalizedEmail, "signup", sendOtpEmail);
        return res.status(200).json({
          success: true,
          requiresVerification: true,
          email: normalizedEmail,
          message: "Account exists but is not verified. A new code has been sent.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "user",
      location,
      isEmailVerified: false,
    });

    await createAndSendOtp(normalizedEmail, "signup", sendOtpEmail);

    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: normalizedEmail,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// VERIFY EMAIL after signup
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const result = await verifyOtp(email, "signup", String(code).trim());
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register again.",
      });
    }

    user.isEmailVerified = true;
    await user.save();

    // Auto-create pending provider profile so admin can see and approve it
    if (user.role === "provider") {
      const existing = await ServiceProvider.findOne({ user: user._id });
      if (!existing) {
        await ServiceProvider.create({
          user: user._id,
          name: user.name,
          services: [],
          location: user.location || {},
          isVerified: false,
        });
        sendProviderPendingEmail(user.email, user.name).catch((err) =>
          console.error("Provider pending email failed:", err.message)
        );
        notifyAdminNewProvider(user.name, user.email).catch((err) =>
          console.error("Admin notify email failed:", err.message)
        );
      }
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message:
        user.role === "provider"
          ? "Email verified! Your registration request has been submitted. Please contact admin to get your account approved."
          : "Email verified successfully",
      token,
      user: formatUser(user),
      pendingApproval: user.role === "provider",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
    });
  }
};

// RESEND signup OTP
const resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. You can log in.",
      });
    }

    await createAndSendOtp(user.email, "signup", sendOtpEmail);

    res.status(200).json({
      success: true,
      message: "Verification code sent",
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to resend code",
      error: error.message,
    });
  }
};

// FORGOT PASSWORD — send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always return success to avoid email enumeration
    if (user && user.isEmailVerified) {
      await createAndSendOtp(user.email, "password_reset", sendOtpEmail);
    }

    res.status(200).json({
      success: true,
      message: "If an account exists, a reset code has been sent to your email",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: error.message,
    });
  }
};

// RESET PASSWORD with OTP
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, code and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const result = await verifyOtp(email, "password_reset", String(code).trim());
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can log in now.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isEmailVerified === false) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
        requiresVerification: true,
        email: user.email,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
  login,
};
