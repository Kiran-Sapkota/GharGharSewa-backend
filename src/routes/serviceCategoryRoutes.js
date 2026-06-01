const express = require("express");
const { getActiveCategories } = require("../controllers/serviceCategoryController");

const router = express.Router();

router.get("/", getActiveCategories);

module.exports = router;
