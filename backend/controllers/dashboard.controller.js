import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Convert userId to ObjectId for proper matching
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Get current month data using aggregation
    const currentMonthData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: currentMonthStart, $lte: currentMonthEnd },
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

    // Get last month data for comparison
    const lastMonthData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Process current month data
    const currentIncome = currentMonthData.find((d) => d._id === 'income')?.total || 0;
    const currentExpenses = currentMonthData.find((d) => d._id === 'expense')?.total || 0;
    const currentBalance = currentIncome - currentExpenses;
    const incomeCount = currentMonthData.find((d) => d._id === 'income')?.count || 0;
    const expenseCount = currentMonthData.find((d) => d._id === 'expense')?.count || 0;

    // Process last month data
    const lastIncome = lastMonthData.find((d) => d._id === 'income')?.total || 0;
    const lastExpenses = lastMonthData.find((d) => d._id === 'expense')?.total || 0;
    const lastBalance = lastIncome - lastExpenses;

    // Calculate percentage changes
    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;
    const balanceChange = lastBalance !== 0 ? ((currentBalance - lastBalance) / Math.abs(lastBalance)) * 100 : 0;

    res.json({
      success: true,
      data: {
        current: {
          income: currentIncome,
          expenses: currentExpenses,
          balance: currentBalance,
          incomeCount,
          expenseCount,
        },
        changes: {
          income: Math.round(incomeChange * 100) / 100,
          expenses: Math.round(expenseChange * 100) / 100,
          balance: Math.round(balanceChange * 100) / 100,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
