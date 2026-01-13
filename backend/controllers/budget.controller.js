import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

export const getBudgets = async (req, res, next) => {
  try {
    const { period, isActive } = req.query;
    const query = { userId: req.userId };
    if (period) query.period = period;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const budgets = await Budget.find(query)
      .populate('category', 'name type icon color')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { budgets },
    });
  } catch (error) {
    next(error);
  }
};

export const getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('category', 'name type icon color');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    res.json({
      success: true,
      data: { budget },
    });
  } catch (error) {
    next(error);
  }
};

export const createBudget = async (req, res, next) => {
  try {
    const { category, amount, period, startDate, endDate } = req.body;

    // Verify category belongs to user
    const categoryDoc = await Category.findOne({
      _id: category,
      userId: req.userId,
    });

    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Verify category is expense type (budgets are for expenses)
    if (categoryDoc.type !== 'expense') {
      return res.status(400).json({
        success: false,
        message: 'Budgets can only be created for expense categories',
      });
    }

    // Calculate endDate if not provided
    let calculatedEndDate = endDate;
    if (!calculatedEndDate && startDate) {
      if (period === 'monthly') {
        calculatedEndDate = endOfMonth(new Date(startDate));
      } else if (period === 'yearly') {
        calculatedEndDate = endOfYear(new Date(startDate));
      }
    }

    const budget = await Budget.create({
      userId: req.userId,
      category,
      amount,
      period,
      startDate: startDate || new Date(),
      endDate: calculatedEndDate,
      isActive: true,
    });

    await budget.populate('category', 'name type icon color');

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: { budget },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req, res, next) => {
  try {
    const { amount, period, startDate, endDate, isActive } = req.body;

    let budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    if (amount !== undefined) budget.amount = amount;
    if (period) budget.period = period;
    if (startDate) budget.startDate = startDate;
    if (endDate !== undefined) budget.endDate = endDate;
    if (isActive !== undefined) budget.isActive = isActive;

    // Recalculate endDate if period or startDate changed
    if ((period || startDate) && !endDate) {
      const dateToUse = startDate || budget.startDate;
      if (period === 'monthly' || budget.period === 'monthly') {
        budget.endDate = endOfMonth(new Date(dateToUse));
      } else if (period === 'yearly' || budget.period === 'yearly') {
        budget.endDate = endOfYear(new Date(dateToUse));
      }
    }

    await budget.save();
    await budget.populate('category', 'name type icon color');

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: { budget },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgetTracking = async (req, res, next) => {
  try {
    const budgets = await Budget.find({
      userId: req.userId,
      isActive: true,
    }).populate('category', 'name type icon color');

    const trackingData = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = budget.startDate;
        const endDate = budget.endDate || (budget.period === 'monthly' 
          ? endOfMonth(startDate) 
          : endOfYear(startDate));

        // Get expenses for this category in the budget period
        const expenses = await Transaction.aggregate([
          {
            $match: {
              userId: budget.userId,
              type: 'expense',
              category: budget.category._id,
              date: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        const spent = expenses.length > 0 ? expenses[0].total : 0;
        const remaining = budget.amount - spent;
        const percentage = (spent / budget.amount) * 100;

        return {
          budget: {
            id: budget._id,
            category: budget.category,
            amount: budget.amount,
            period: budget.period,
            startDate: budget.startDate,
            endDate: budget.endDate,
          },
          spent,
          remaining,
          percentage: Math.round(percentage * 100) / 100,
          status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good',
        };
      })
    );

    res.json({
      success: true,
      data: { tracking: trackingData },
    });
  } catch (error) {
    next(error);
  }
};
