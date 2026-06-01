const Review = require("../models/Review");
const Booking = require("../models/Booking");
const ServiceProvider = require("../models/ServiceProvider");
const User = require("../models/User");
const { sendNewReviewEmail } = require("../utils/emailService");

// Submit review
const submitReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Booking ID, rating and comment are required",
      });
    }

    const booking = await Booking.findById(bookingId).populate("provider");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own booking",
      });
    }

    // Check if the service provider is trying to review their own work
    if (booking.provider && booking.provider.user.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Service providers cannot review their own work",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "You can review only after booking is completed",
      });
    }

    const existingReview = await Review.findOne({ booking: bookingId });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Review already submitted for this booking",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      provider: booking.provider,
      booking: bookingId,
      rating,
      comment,
    });

    const reviews = await Review.find({ provider: booking.provider });

    const totalRating = reviews.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / reviews.length;

    const providerProfile = await ServiceProvider.findByIdAndUpdate(booking.provider, {
      rating: averageRating.toFixed(1),
      totalReviews: reviews.length,
    });

    // Also update the User model for general profile visibility
    await User.findByIdAndUpdate(providerProfile.user, {
      rating: averageRating.toFixed(1),
      totalReviews: reviews.length,
    });

    await Booking.findByIdAndUpdate(bookingId, {
      isReviewed: true,
    });

    const providerUser = await User.findById(providerProfile.user);
    if (providerUser?.email) {
      sendNewReviewEmail(
        providerUser.email,
        providerProfile.name || providerUser.name,
        rating,
        comment
      ).catch((err) =>
        console.error("Review notification email failed:", err.message)
      );
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
};

// Get provider reviews
const getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      provider: req.params.providerId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

module.exports = {
  submitReview,
  getProviderReviews,
};