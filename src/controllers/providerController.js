const ServiceProvider = require("../models/ServiceProvider");
const User = require("../models/User");
const {
  sendProviderPendingEmail,
  notifyAdminNewProvider,
} = require("../utils/emailService");

// Create provider profile
const createProviderProfile = async (req, res) => {
  try {
    const { name, services, location } = req.body;

    const existingProfile = await ServiceProvider.findOne({
      user: req.user._id,
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Provider profile already exists",
      });
    }

    const provider = await ServiceProvider.create({
      user: req.user._id,
      name,
      services,
      location,
    });

    const user = await User.findById(req.user._id);
    if (user?.email) {
      sendProviderPendingEmail(user.email, name).catch((err) =>
        console.error("Provider pending email failed:", err.message)
      );
      notifyAdminNewProvider(name, user.email).catch((err) =>
        console.error("Admin notify email failed:", err.message)
      );
    }

    res.status(201).json({
      success: true,
      message: "Provider profile created successfully",
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create provider profile",
      error: error.message,
    });
  }
};

// Get all verified providers
const getAllProviders = async (req, res) => {
  try {
    const providers = await ServiceProvider.find({ isVerified: true })
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

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

// Get provider by ID
const getProviderById = async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id).populate(
      "user",
      "name email role"
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    res.status(200).json({
      success: true,
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch provider",
      error: error.message,
    });
  }
};

// Update services and pricing
const updateProviderProfile = async (req, res) => {
  try {
    const { name, services, location } = req.body;

    const provider = await ServiceProvider.findOne({ user: req.user._id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    if (name) provider.name = name;
    if (services) provider.services = services;
    if (location) provider.location = location;

    await provider.save();

    res.status(200).json({
      success: true,
      message: "Provider profile updated successfully",
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update provider profile",
      error: error.message,
    });
  }
};

// Toggle availability
const toggleAvailability = async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ user: req.user._id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    provider.isAvailable = !provider.isAvailable;
    await provider.save();

    res.status(200).json({
      success: true,
      message: `Availability updated to ${provider.isAvailable}`,
      isAvailable: provider.isAvailable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update availability",
      error: error.message,
    });
  }
};

// Delete own provider profile
const deleteProviderProfile = async (req, res) => {
  try {
    const provider = await ServiceProvider.findOneAndDelete({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Provider profile deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete provider profile",
      error: error.message,
    });
  }
};

// Get current logged-in provider profile
const getProviderMe = async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ user: req.user._id }).populate(
      "user",
      "name email role"
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    res.status(200).json({
      success: true,
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

module.exports = {
  createProviderProfile,
  getAllProviders,
  getProviderById,
  updateProviderProfile,
  toggleAvailability,
  deleteProviderProfile,
  getProviderMe,
};