const User = require("../models/User");
const ServiceProvider = require("../models/ServiceProvider");
const Booking = require("../models/Booking");
const { sendProviderApprovedEmail } = require("../utils/emailService");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Get all providers (includes users with role=provider who have no profile yet)
const getAllProvidersAdmin = async (req, res) => {
  try {
    const providers = await ServiceProvider.find()
      .populate("user", "name email role isActive")
      .sort({ createdAt: -1 });

    // Find provider-role users with no ServiceProvider document and auto-create one
    const providerUserIds = providers.map((p) => p.user?._id?.toString()).filter(Boolean);
    const orphanUsers = await User.find({
      role: "provider",
      isEmailVerified: true,
      _id: { $nin: providerUserIds },
    });

    if (orphanUsers.length > 0) {
      const created = await ServiceProvider.insertMany(
        orphanUsers.map((u) => ({
          user: u._id,
          name: u.name,
          services: [],
          location: u.location || {},
          isVerified: false,
        }))
      );
      // Re-fetch so populated data is correct
      const updatedProviders = await ServiceProvider.find()
        .populate("user", "name email role isActive")
        .sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: updatedProviders.length,
        providers: updatedProviders,
      });
    }

    res.status(200).json({
      success: true,
      count: providers.length,
      providers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch providers",
      error: error.message,
    });
  }
};

// Get all bookings
const getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email role")
      .populate("provider")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// Verify provider
const verifyProvider = async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.providerId);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    provider.isVerified = true;
    await provider.save();

    const providerUser = await User.findById(provider.user);
    if (providerUser?.email) {
      sendProviderApprovedEmail(
        providerUser.email,
        provider.name || providerUser.name
      ).catch((err) =>
        console.error("Provider approved email failed:", err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: "Provider verified successfully",
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify provider",
      error: error.message,
    });
  }
};

// Unverify provider
const unverifyProvider = async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.providerId);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    provider.isVerified = false;
    await provider.save();

    res.status(200).json({
      success: true,
      message: "Provider unverified successfully",
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to unverify provider",
      error: error.message,
    });
  }
};

// Deactivate account
const deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deactivate account",
      error: error.message,
    });
  }
};

// Reactivate account
const reactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account reactivated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reactivate account",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getAllProvidersAdmin,
  getAllBookingsAdmin,
  verifyProvider,
  unverifyProvider,
  deactivateAccount,
  reactivateAccount,
};