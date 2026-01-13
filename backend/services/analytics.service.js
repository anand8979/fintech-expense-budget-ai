import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';

export const getOverview = async (userId, period = 'month') => {
  const now = new Date();
  let startDate, endDate;

  if (period === 'month') {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  } else if (period === 'year') {
    startDate = startOfYear(now);
    endDate = endOfYear(now);
  }

  // Convert userId to ObjectId for proper matching
  const userIdObj = new mongoose.Types.ObjectId(userId);

  // Get income and expenses
  const transactions = await Transaction.aggregate([
    {
      $match: {
        userId: userIdObj,
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
    prevStartDate = startOfYear(subYears(now, 1));
    prevEndDate = endOfYear(subYears(now, 1));
  }

  const prevTransactions = await Transaction.aggregate([
    {
      $match: {
        userId: userIdObj,
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

  return {
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
      balance: (prevIncome - prevExpenses) !== 0 
        ? ((balance - (prevIncome - prevExpenses)) / Math.abs(prevIncome - prevExpenses)) * 100 
        : 0,
    },
  };
};

export const getSpendingByCategory = async (userId, startDate, endDate) => {
  // Convert userId to ObjectId for proper matching
  const userIdObj = new mongoose.Types.ObjectId(userId);
  
  const matchQuery = {
    userId: userIdObj,
    type: 'expense',
  };

  if (startDate || endDate) {
    matchQuery.date = {};
    if (startDate) matchQuery.date.$gte = new Date(startDate);
    if (endDate) matchQuery.date.$lte = new Date(endDate);
  }

  const spending = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
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

  return spending;
};

export const getTrends = async (userId, type = 'expense', period = 'month', months = 6) => {
  // Convert userId to ObjectId for proper matching
  const userIdObj = new mongoose.Types.ObjectId(userId);
  
  const trends = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    let start, end;
    if (period === 'month') {
      start = startOfMonth(subMonths(now, i));
      end = endOfMonth(subMonths(now, i));
    } else {
      start = startOfYear(subYears(now, i));
      end = endOfYear(subYears(now, i));
    }

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: userIdObj,
          type: type,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    trends.push({
      period: period === 'month' 
        ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
        : `${start.getFullYear()}`,
      startDate: start,
      endDate: end,
      total: result.length > 0 ? result[0].total : 0,
      count: result.length > 0 ? result[0].count : 0,
    });
  }

  return trends;
};

export const getDailySpendingTrend = async (userId, days = 30) => {
  // Convert userId to ObjectId for proper matching
  const userIdObj = new mongoose.Types.ObjectId(userId);
  
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const dailyData = await Transaction.aggregate([
    {
      $match: {
        userId: userIdObj,
        type: 'expense',
        date: { $gte: startDate, $lte: now },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        total: 1,
        count: 1,
        _id: 0,
      },
    },
  ]);

  return dailyData;
};

export const getPeriodComparison = async (userId, period1Start, period1End, period2Start, period2End) => {
  // Convert userId to ObjectId for proper matching
  const userIdObj = new mongoose.Types.ObjectId(userId);
  
  const period1 = await Transaction.aggregate([
    {
      $match: {
        userId: userIdObj,
        date: { $gte: new Date(period1Start), $lte: new Date(period1End) },
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

  const period2 = await Transaction.aggregate([
    {
      $match: {
        userId: userIdObj,
        date: { $gte: new Date(period2Start), $lte: new Date(period2End) },
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

  const period1Income = period1.find((p) => p._id === 'income')?.total || 0;
  const period1Expenses = period1.find((p) => p._id === 'expense')?.total || 0;
  const period2Income = period2.find((p) => p._id === 'income')?.total || 0;
  const period2Expenses = period2.find((p) => p._id === 'expense')?.total || 0;

  return {
    period1: {
      income: period1Income,
      expenses: period1Expenses,
      balance: period1Income - period1Expenses,
    },
    period2: {
      income: period2Income,
      expenses: period2Expenses,
      balance: period2Income - period2Expenses,
    },
    change: {
      income: period1Income > 0 ? ((period2Income - period1Income) / period1Income) * 100 : 0,
      expenses: period1Expenses > 0 ? ((period2Expenses - period1Expenses) / period1Expenses) * 100 : 0,
      balance: (period1Income - period1Expenses) !== 0
        ? (((period2Income - period2Expenses) - (period1Income - period1Expenses)) / Math.abs(period1Income - period1Expenses)) * 100
        : 0,
    },
  };
};
