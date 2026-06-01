const User = require("../models/User");
const Booking = require("../models/Booking");
const ServiceProvider = require("../models/ServiceProvider");
const UserReview = require("../models/UserReview");

// Provider reviews user after completed booking
const submitUserReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and rating are required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "User can be reviewed only after booking is completed",
      });
    }

    const providerProfile = await ServiceProvider.findOne({
      user: req.user._id,
    });

    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    if (booking.provider.toString() !== providerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can review only users from your own bookings",
      });
    }

    const existingReview = await UserReview.findOne({
      booking: bookingId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "User review already submitted for this booking",
      });
    }

    const userReview = await UserReview.create({
      provider: providerProfile._id,
      user: booking.user,
      booking: bookingId,
      rating,
      comment,
    });

    const reviews = await UserReview.find({
      user: booking.user,
    });

    const totalRating = reviews.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / reviews.length;

    await User.findByIdAndUpdate(booking.user, {
      rating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
    });

    res.status(201).json({
      success: true,
      message: "User review submitted successfully",
      userReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit user review",
      error: error.message,
    });
  }
};

// Get reviews of a user
const getUserReviews = async (req, res) => {
  try {
    const reviews = await UserReview.find({
      user: req.params.userId,
    })
      .populate("provider", "name services rating")
      .populate("booking", "serviceCategory bookingDate status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user reviews",
      error: error.message,
    });
  }
};

module.exports = {
  submitUserReview,
  getUserReviews,
};