const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
    },

    serviceCategory: {
      type: String,
      required: true,
    },

    serviceDescription: {
      type: String,
    },

    address: {
      type: String,
      required: true,
    },

    latitude: {
      type: Number,
    },

    longitude: {
      type: Number,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },

    bookingDate: {
      type: Date,
      required: true,
    },

    isReviewed: {
      type: Boolean,
      default: false,
    },

    isArchivedByProvider: {
      type: Boolean,
      default: false,
    },

    archivedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);