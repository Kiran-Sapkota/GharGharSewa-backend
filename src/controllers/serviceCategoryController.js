const ServiceCategory = require("../models/ServiceCategory");
const ServiceProvider = require("../models/ServiceProvider");

const getActiveCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ isActive: true }).sort({
      label: 1,
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch service categories",
      error: error.message,
    });
  }
};

const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await ServiceCategory.find().sort({ label: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch service categories",
      error: error.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, label, description, icon } = req.body;

    if (!name || !label) {
      return res.status(400).json({
        success: false,
        message: "Name and label are required",
      });
    }

    const normalizedName = name.trim().toLowerCase();

    const existing = await ServiceCategory.findOne({ name: normalizedName });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A service with this name already exists",
      });
    }

    const category = await ServiceCategory.create({
      name: normalizedName,
      label: label.trim(),
      description: description?.trim() || "",
      icon: icon?.trim() || "🔧",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Service category created successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create service category",
      error: error.message,
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Service category not found",
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch service category",
      error: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Service category not found",
      });
    }

    const { name, label, description, icon, isActive } = req.body;

    if (name !== undefined) {
      const normalizedName = name.trim().toLowerCase();
      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      const duplicate = await ServiceCategory.findOne({
        name: normalizedName,
        _id: { $ne: category._id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "A service with this name already exists",
        });
      }
      category.name = normalizedName;
    }

    if (label !== undefined) category.label = label.trim();
    if (description !== undefined) category.description = description.trim();
    if (icon !== undefined) category.icon = icon.trim() || "🔧";
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    if (!category.label) {
      return res.status(400).json({
        success: false,
        message: "Label is required",
      });
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Service category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update service category",
      error: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Service category not found",
      });
    }

    const providerCount = await ServiceProvider.countDocuments({
      "services.category": {
        $regex: `^${category.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (providerCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${providerCount} provider(s) still offer this service. Deactivate it instead.`,
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Service category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete service category",
      error: error.message,
    });
  }
};

module.exports = {
  getActiveCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
