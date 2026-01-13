import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all transactions across all users
export const getAllTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const transactions = await Transaction.find(query)
      .populate('category', 'name type icon color')
      .populate('userId', 'email firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all budgets across all users
export const getAllBudgets = async (req, res, next) => {
  try {
    const { userId, period, isActive, page = 1, limit = 50 } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (period) query.period = period;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const budgets = await Budget.find(query)
      .populate('category', 'name type icon color')
      .populate('userId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Budget.countDocuments(query);

    res.json({
      success: true,
      data: {
        budgets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get global analytics (across all users)
export const getGlobalAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate, endDate;

    if (period === 'month') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    // Get total income and expenses across all users
    const transactions = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = transactions.find((t) => t._id === 'income')?.total || 0;
    const expenses = transactions.find((t) => t._id === 'expense')?.total || 0;
    const balance = income - expenses;

    // Get previous period for comparison
    let prevStartDate, prevEndDate;
    if (period === 'month') {
      prevStartDate = startOfMonth(subMonths(now, 1));
      prevEndDate = endOfMonth(subMonths(now, 1));
    } else {
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
    }

    const prevTransactions = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: prevStartDate, $lte: prevEndDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const prevIncome = prevTransactions.find((t) => t._id === 'income')?.total || 0;
    const prevExpenses = prevTransactions.find((t) => t._id === 'expense')?.total || 0;

    // Get user count
    const totalUsers = await User.countDocuments();
    const activeUsers = await Transaction.distinct('userId', {
      date: { $gte: startDate, $lte: endDate },
    });

    // Get top spending categories
    const topCategories = await Transaction.aggregate([
      {
        $match: {
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          category: {
            id: '$category._id',
            name: '$category.name',
            icon: '$category.icon',
            color: '$category.color',
          },
          total: 1,
          count: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        period,
        current: {
          income,
          expenses,
          balance,
        },
        previous: {
          income: prevIncome,
          expenses: prevExpenses,
          balance: prevIncome - prevExpenses,
        },
        change: {
          income: prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0,
          expenses: prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0,
          balance:
            prevIncome - prevExpenses !== 0
              ? ((balance - (prevIncome - prevExpenses)) / Math.abs(prevIncome - prevExpenses)) *
                100
              : 0,
        },
        users: {
          total: totalUsers,
          active: activeUsers.length,
        },
        topCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user role
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent deleting yourself
    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete user's transactions and budgets
    await Transaction.deleteMany({ userId });
    await Budget.deleteMany({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
export const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const transactionCount = await Transaction.countDocuments({ userId });
    const budgetCount = await Budget.countDocuments({ userId });

    const totalIncome = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalExpenses = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          transactions: transactionCount,
          budgets: budgetCount,
          totalIncome: totalIncome[0]?.total || 0,
          totalExpenses: totalExpenses[0]?.total || 0,
          balance: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
