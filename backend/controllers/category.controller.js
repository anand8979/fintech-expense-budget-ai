import Category from '../models/Category.js';

// Default categories for new users
const defaultCategories = [
  // Expense categories
  { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#ef4444', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#f59e0b', isDefault: true },
  { name: 'Transportation', type: 'expense', icon: '🚗', color: '#3b82f6', isDefault: true },
  { name: 'Bills & Utilities', type: 'expense', icon: '💡', color: '#8b5cf6', isDefault: true },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#ec4899', isDefault: true },
  { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#10b981', isDefault: true },
  { name: 'Education', type: 'expense', icon: '📚', color: '#06b6d4', isDefault: true },
  { name: 'Travel', type: 'expense', icon: '✈️', color: '#6366f1', isDefault: true },
  // Income categories
  { name: 'Salary', type: 'income', icon: '💰', color: '#10b981', isDefault: true },
  { name: 'Freelance', type: 'income', icon: '💼', color: '#3b82f6', isDefault: true },
  { name: 'Investment', type: 'income', icon: '📈', color: '#8b5cf6', isDefault: true },
  { name: 'Other Income', type: 'income', icon: '💵', color: '#6366f1', isDefault: true },
];

export const initializeDefaultCategories = async (userId) => {
  const existingCategories = await Category.find({ userId });
  if (existingCategories.length === 0) {
    const categories = defaultCategories.map((cat) => ({
      ...cat,
      userId,
    }));
    await Category.insertMany(categories);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { userId: req.userId };
    if (type) query.type = type;

    const categories = await Category.find(query).sort({ isDefault: -1, name: 1 });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    const category = await Category.create({
      userId: req.userId,
      name,
      type,
      icon: icon || '💰',
      color: color || '#6366f1',
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, icon, color } = req.body;

    let category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Prevent updating default categories
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update default categories',
      });
    }

    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Prevent deleting default categories
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default categories',
      });
    }

    // Check if category is used in transactions
    const Transaction = (await import('../models/Transaction.js')).default;
    const transactionCount = await Transaction.countDocuments({
      userId: req.userId,
      category: category._id,
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing transactions',
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
