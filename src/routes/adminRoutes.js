const express = require("express");

const {
  getAllUsers,
  getAllProvidersAdmin,
  getAllBookingsAdmin,
  verifyProvider,
  unverifyProvider,
  deactivateAccount,
  reactivateAccount,
} = require("../controllers/adminController");

const {
  getAllCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/serviceCategoryController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/users", getAllUsers);
router.get("/providers", getAllProvidersAdmin);
router.get("/bookings", getAllBookingsAdmin);

router.patch("/providers/:providerId/verify", verifyProvider);
router.patch("/providers/:providerId/unverify", unverifyProvider);

router.patch("/users/:userId/deactivate", deactivateAccount);
router.patch("/users/:userId/reactivate", reactivateAccount);

router.get("/services", getAllCategoriesAdmin);
router.post("/services", createCategory);
router.get("/services/:id", getCategoryById);
router.put("/services/:id", updateCategory);
router.delete("/services/:id", deleteCategory);

module.exports = router;