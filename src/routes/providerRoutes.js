const express = require("express");

const {
  createProviderProfile,
  getAllProviders,
  getProviderById,
  updateProviderProfile,
  toggleAvailability,
  deleteProviderProfile,
  getProviderMe,
} = require("../controllers/providerController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllProviders);
router.get(
  "/me",
  protect,
  authorizeRoles("provider"),
  getProviderMe
);
router.get("/:id", getProviderById);

router.post(
  "/",
  protect,
  authorizeRoles("provider"),
  createProviderProfile
);

router.put(
  "/me",
  protect,
  authorizeRoles("provider"),
  updateProviderProfile
);

router.patch(
  "/availability",
  protect,
  authorizeRoles("provider"),
  toggleAvailability
);

router.delete(
  "/me",
  protect,
  authorizeRoles("provider"),
  deleteProviderProfile
);

module.exports = router;