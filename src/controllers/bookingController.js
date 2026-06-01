const Booking = require("../models/Booking");
const ServiceProvider = require("../models/ServiceProvider");
const User = require("../models/User");
const { sendNewBookingEmails } = require("../utils/emailService");

const getProviderForUser = async (userId) =>
  ServiceProvider.findOne({ user: userId });

const assertProviderOwnsBooking = async (booking, userId) => {
  const provider = await getProviderForUser(userId);
  if (!provider) {
    return { ok: false, status: 404, message: "Provider profile not found" };
  }
  if (booking.provider.toString() !== provider._id.toString()) {
    return { ok: false, status: 403, message: "Unauthorized" };
  }
  return { ok: true, provider };
};

// Create booking
const createBooking = async (req, res) => {
  try {
    const {
      provider,
      serviceCategory,
      serviceDescription,
      bookingDate,
      address,
      latitude,
      longitude,
      totalPrice,
    } = req.body;

    // check provider exists
    const providerExists = await ServiceProvider.findById(provider);

    if (!providerExists) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    if (!providerExists.isVerified) {
      return res.status(403).json({
        success: false,
        message: "This provider is not approved yet. Please choose another provider.",
      });
    }

    if (!providerExists.isAvailable) {
      return res.status(403).json({
        success: false,
        message: "This provider is currently unavailable.",
      });
    }

    const matchedService = providerExists.services.find(
      (service) =>
        service.category.toLowerCase() === String(serviceCategory).toLowerCase()
    );

    if (!matchedService) {
      return res.status(400).json({
        success: false,
        message: "Invalid service category for this provider.",
      });
    }

    if (Number(totalPrice) !== Number(matchedService.price)) {
      return res.status(400).json({
        success: false,
        message: "Price does not match the provider's listed rate.",
      });
    }

    const bookingDateObj = new Date(bookingDate);
    if (Number.isNaN(bookingDateObj.getTime()) || bookingDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Booking date and time must be in the future.",
      });
    }

    const lat = latitude != null ? Number(latitude) : null;
    const lng = longitude != null ? Number(longitude) : null;

    if (
      lat == null ||
      lng == null ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Please set your service location on the map.",
      });
    }

    // create booking
    const booking = await Booking.create({
      user: req.user._id,
      provider,
      serviceCategory: matchedService.category,
      serviceDescription,
      bookingDate: bookingDateObj,
      address: String(address).trim(),
      latitude: lat,
      longitude: lng,
      totalPrice: matchedService.price,
    });

    const [customer, providerUser] = await Promise.all([
      User.findById(req.user._id).select("name email"),
      User.findById(providerExists.user).select("name email"),
    ]);

    if (customer?.email && providerUser?.email) {
      sendNewBookingEmails({
        providerEmail: providerUser.email,
        providerName: providerExists.name,
        userEmail: customer.email,
        userName: customer.name,
        booking,
      }).catch((err) =>
        console.error("Booking notification emails failed:", err.message)
      );
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

// User booking history
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
    })
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

// Provider bookings
const getProviderBookings = async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const bookings = await Booking.find({
      provider: provider._id,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch provider bookings",
      error: error.message,
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const ownership = await assertProviderOwnsBooking(booking, req.user._id);
    if (!ownership.ok) {
      return res.status(ownership.status).json({
        success: false,
        message: ownership.message,
      });
    }

    booking.status = status;

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking status updated",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
      error: error.message,
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // only booking owner can cancel
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    booking.status = "cancelled";

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};

// Provider archives booking (hide from active list)
const archiveProviderBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const ownership = await assertProviderOwnsBooking(booking, req.user._id);
    if (!ownership.ok) {
      return res.status(ownership.status).json({
        success: false,
        message: ownership.message,
      });
    }

    booking.isArchivedByProvider = true;
    booking.archivedAt = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking archived",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to archive booking",
      error: error.message,
    });
  }
};

// Provider restores archived booking
const unarchiveProviderBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const ownership = await assertProviderOwnsBooking(booking, req.user._id);
    if (!ownership.ok) {
      return res.status(ownership.status).json({
        success: false,
        message: ownership.message,
      });
    }

    booking.isArchivedByProvider = false;
    booking.archivedAt = null;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking restored",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to restore booking",
      error: error.message,
    });
  }
};

// Get single booking
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("provider user");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus,
  archiveProviderBooking,
  unarchiveProviderBooking,
  cancelBooking,
  getBookingById,
};