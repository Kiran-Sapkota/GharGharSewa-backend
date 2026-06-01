const express = require("express");

const {
  createBooking,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus,
  archiveProviderBooking,
  unarchiveProviderBooking,
  cancelBooking,
  getBookingById,
} = require("../controllers/bookingController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// user creates booking
router.post(
  "/",
  protect,
  authorizeRoles("user"),
  createBooking
);

// user booking history
router.get(
  "/my-bookings",
  protect,
  authorizeRoles("user"),
  getUserBookings
);

// provider bookings
router.get(
  "/provider-bookings",
  protect,
  authorizeRoles("provider"),
  getProviderBookings
);

// provider updates status
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("provider"),
  updateBookingStatus
);

router.patch(
  "/:id/archive",
  protect,
  authorizeRoles("provider"),
  archiveProviderBooking
);

router.patch(
  "/:id/unarchive",
  protect,
  authorizeRoles("provider"),
  unarchiveProviderBooking
);

router.get("/:id", protect, getBookingById);

// user cancels booking
router.patch(
  "/:id/cancel",
  protect,
  authorizeRoles("user"),
  cancelBooking
);

module.exports = router;