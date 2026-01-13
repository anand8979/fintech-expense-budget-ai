import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';

export const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = { userId: req.userId };

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

export const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('category', 'name type icon color');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date, tags, paymentMethod, location } =
      req.body;

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

    // Verify category type matches transaction type
    if (categoryDoc.type !== type) {
      return res.status(400).json({
        success: false,
        message: 'Category type does not match transaction type',
      });
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      amount,
      category,
      description,
      date: date || new Date(),
      tags,
      paymentMethod,
      location,
    });

    await transaction.populate('category', 'name type icon color');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date, tags, paymentMethod, location } =
      req.body;

    let transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // If category is being updated, verify it
    if (category) {
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

      // Verify category type matches transaction type
      const transactionType = type || transaction.type;
      if (categoryDoc.type !== transactionType) {
        return res.status(400).json({
          success: false,
          message: 'Category type does not match transaction type',
        });
      }
    }

    // Update transaction
    transaction.type = type || transaction.type;
    if (amount !== undefined) transaction.amount = amount;
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = date;
    if (tags !== undefined) transaction.tags = tags;
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;
    if (location !== undefined) transaction.location = location;

    await transaction.save();
    await transaction.populate('category', 'name type icon color');

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { userId: req.userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const expenseSummary = summary.find((s) => s._id === 'expense') || {
      total: 0,
      count: 0,
    };
    const incomeSummary = summary.find((s) => s._id === 'income') || {
      total: 0,
      count: 0,
    };

    res.json({
      success: true,
      data: {
        expenses: {
          total: expenseSummary.total,
          count: expenseSummary.count,
        },
        income: {
          total: incomeSummary.total,
          count: incomeSummary.count,
        },
        balance: incomeSummary.total - expenseSummary.total,
      },
    });
  } catch (error) {
    next(error);
  }
};
