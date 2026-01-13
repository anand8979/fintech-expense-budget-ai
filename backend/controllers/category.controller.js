import Category from '../models/Category.js';

// Default global categories
const defaultCategories = [
  // Expense categories
  { name: 'Food', type: 'expense', icon: '🍔', color: '#ef4444', isDefault: true },
  { name: 'Transport', type: 'expense', icon: '🚗', color: '#3b82f6', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ec4899', isDefault: true },
  { name: 'Rent', type: 'expense', icon: '🏠', color: '#f59e0b', isDefault: true },
  { name: 'Utilities', type: 'expense', icon: '💡', color: '#8b5cf6', isDefault: true },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#f97316', isDefault: true },
  { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#10b981', isDefault: true },
  { name: 'Education', type: 'expense', icon: '📚', color: '#06b6d4', isDefault: true },
  // Income categories
  { name: 'Salary', type: 'income', icon: '💰', color: '#10b981', isDefault: true },
  { name: 'Freelance', type: 'income', icon: '💼', color: '#3b82f6', isDefault: true },
  { name: 'Business', type: 'income', icon: '🏢', color: '#8b5cf6', isDefault: true },
  { name: 'Investment', type: 'income', icon: '📈', color: '#6366f1', isDefault: true },
  { name: 'Other', type: 'income', icon: '💵', color: '#64748b', isDefault: true },
];

// Seed global categories on server start
export const seedGlobalCategories = async () => {
  try {
    const existingGlobalCategories = await Category.find({ userId: null });
    if (existingGlobalCategories.length === 0) {
      const globalCategories = defaultCategories.map((cat) => ({
        ...cat,
        userId: null, // Global categories
      }));
      await Category.insertMany(globalCategories);
      console.log('✅ Global categories seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding global categories:', error);
  }
};

// Initialize user-specific categories (for backward compatibility)
export const initializeDefaultCategories = async (userId) => {
  // Users now get global categories, but we keep this for backward compatibility
  // Check if user has any categories, if not, they'll use global ones
  const existingCategories = await Category.find({ userId });
  if (existingCategories.length === 0) {
    // User will use global categories (userId: null)
    // No need to create user-specific copies
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    
    // Get global categories (userId: null) and user-specific categories
    // MongoDB handles null comparison correctly
    const baseQuery = {
      $or: [
        { userId: null }, // Global categories
        { userId: req.userId }, // User-specific categories
      ],
    };
    
    // Add type filter if provided
    const finalQuery = type
      ? { ...baseQuery, type }
      : baseQuery;

    const categories = await Category.find(finalQuery).sort({ 
      userId: 1, // null first (global), then user-specific
      isDefault: -1, 
      name: 1 
    });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
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
