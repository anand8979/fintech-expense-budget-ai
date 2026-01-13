import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears, format } from 'date-fns';

/**
 * Intelligent Financial Insights Engine
 * Uses rule-based logic, statistical analysis, and pattern recognition
 * NO external paid APIs - all processing is local and free
 */

// Keyword mapping for smart categorization
const CATEGORY_KEYWORDS = {
  'Food & Dining': ['restaurant', 'food', 'dining', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'starbucks', 'mcdonald', 'kfc', 'subway'],
  'Shopping': ['amazon', 'walmart', 'target', 'mall', 'store', 'shop', 'purchase', 'buy', 'retail', 'clothing', 'apparel'],
  'Transportation': ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'subway', 'bus', 'train', 'airline', 'flight', 'car', 'vehicle'],
  'Bills & Utilities': ['electric', 'water', 'gas bill', 'internet', 'phone', 'utility', 'bill', 'payment', 'subscription', 'netflix', 'spotify'],
  'Entertainment': ['movie', 'cinema', 'theater', 'concert', 'game', 'sports', 'ticket', 'entertainment', 'fun'],
  'Healthcare': ['hospital', 'doctor', 'pharmacy', 'medicine', 'medical', 'health', 'clinic', 'dental', 'prescription'],
  'Education': ['school', 'university', 'course', 'tuition', 'book', 'education', 'learning', 'student'],
  'Travel': ['hotel', 'travel', 'vacation', 'trip', 'airbnb', 'booking', 'resort'],
};

/**
 * Smart Expense Categorization using Keyword Matching + Confidence Scoring
 */
export const categorizeTransaction = async (userId, description, amount) => {
  try {
    const categories = await Category.find({ userId, type: 'expense' });
    
    if (categories.length === 0) {
      return {
        suggestedCategory: null,
        confidence: 'low',
        explanation: 'No expense categories found',
      };
    }

    const descriptionLower = (description || '').toLowerCase();
    const categoryScores = [];

    // Score each category based on keyword matching
    categories.forEach((category) => {
      let score = 0;
      const keywords = CATEGORY_KEYWORDS[category.name] || [];
      
      // Exact keyword match
      keywords.forEach((keyword) => {
        if (descriptionLower.includes(keyword)) {
          score += 10;
        }
      });

      // Partial word match (fuzzy matching)
      const categoryWords = category.name.toLowerCase().split(' ');
      categoryWords.forEach((word) => {
        if (word.length > 3 && descriptionLower.includes(word)) {
          score += 5;
        }
      });

      // Amount-based heuristics
      if (category.name === 'Food & Dining' && amount < 100) {
        score += 3;
      }
      if (category.name === 'Shopping' && amount > 50) {
        score += 2;
      }
      if (category.name === 'Bills & Utilities' && amount > 20 && amount < 500) {
        score += 2;
      }

      categoryScores.push({
        category,
        score,
      });
    });

    // Sort by score and get top match
    categoryScores.sort((a, b) => b.score - a.score);
    const topMatch = categoryScores[0];

    // Determine confidence level
    let confidence = 'low';
    if (topMatch.score >= 10) {
      confidence = 'high';
    } else if (topMatch.score >= 5) {
      confidence = 'medium';
    }

    // If no good match, use most frequently used category
    if (topMatch.score === 0) {
      const mostUsedCategory = await getMostUsedCategory(userId);
      return {
        suggestedCategory: mostUsedCategory || categories[0],
        confidence: 'low',
        explanation: 'No keyword matches found. Using most frequently used category.',
      };
    }

    return {
      suggestedCategory: topMatch.category,
      confidence,
      explanation: confidence === 'high' 
        ? `Strong keyword match found for "${topMatch.category.name}"`
        : `Partial match found for "${topMatch.category.name}"`,
      alternatives: categoryScores.slice(1, 3).map((item) => ({
        category: item.category,
        score: item.score,
      })),
    };
  } catch (error) {
    console.error('Categorization error:', error);
    const categories = await Category.find({ userId, type: 'expense' });
    return {
      suggestedCategory: categories[0] || null,
      confidence: 'low',
      explanation: 'Error in categorization. Using default category.',
    };
  }
};

/**
 * Get most frequently used category for fallback
 */
const getMostUsedCategory = async (userId) => {
  const userIdObj = new mongoose.Types.ObjectId(userId);
  const result = await Transaction.aggregate([
    { $match: { userId: userIdObj, type: 'expense' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  if (result.length > 0) {
    return await Category.findById(result[0]._id);
  }
  return null;
};

/**
 * Generate Financial Insights using Statistical Analysis
 */
export const generateFinancialInsights = async (userId, period = 'month') => {
  try {
    // Convert userId to ObjectId for proper matching
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'month') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
    }

    // Get current period data
    const currentData = await Transaction.aggregate([
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
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    const currentIncome = currentData.find((d) => d._id === 'income')?.total || 0;
    const currentExpenses = currentData.find((d) => d._id === 'expense')?.total || 0;
    const currentBalance = currentIncome - currentExpenses;

    // Get previous period for comparison
    let prevStartDate, prevEndDate;
    if (period === 'month') {
      prevStartDate = startOfMonth(subMonths(now, 1));
      prevEndDate = endOfMonth(subMonths(now, 1));
    } else {
      prevStartDate = startOfYear(subYears(now, 1));
      prevEndDate = endOfYear(subYears(now, 1));
    }

    const prevData = await Transaction.aggregate([
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

    const prevIncome = prevData.find((d) => d._id === 'income')?.total || 0;
    const prevExpenses = prevData.find((d) => d._id === 'expense')?.total || 0;
    const prevBalance = prevIncome - prevExpenses;

    // Category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId: userIdObj,
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
    ]);

    const topCategories = categoryBreakdown.map((item) => ({
      name: item.category.name,
      amount: item.total,
      count: item.count,
      percentage: (item.total / currentExpenses) * 100,
    }));

    // Generate insights using rule-based logic
    const insights = [];

    // Balance insight
    if (currentBalance > 0) {
      insights.push({
        title: 'Positive Cash Flow',
        description: `Great job! You have a positive balance of $${currentBalance.toFixed(2)} this ${period}. Consider saving or investing the surplus.`,
        type: 'positive',
        priority: 'high',
      });
    } else if (currentBalance < 0) {
      insights.push({
        title: 'Negative Cash Flow',
        description: `Your expenses exceed income by $${Math.abs(currentBalance).toFixed(2)}. Review your spending and consider creating a budget.`,
        type: 'warning',
        priority: 'high',
      });
    }

    // Spending trend insight
    const expenseChange = prevExpenses > 0 
      ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 
      : 0;
    
    if (expenseChange > 20) {
      insights.push({
        title: 'Spending Increase Detected',
        description: `Your expenses increased by ${expenseChange.toFixed(1)}% compared to last ${period}. Review your top spending categories.`,
        type: 'warning',
        priority: 'medium',
      });
    } else if (expenseChange < -10) {
      insights.push({
        title: 'Spending Reduction',
        description: `Excellent! You reduced expenses by ${Math.abs(expenseChange).toFixed(1)}% compared to last ${period}. Keep up the good work!`,
        type: 'positive',
        priority: 'medium',
      });
    }

    // Top category insight
    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      if (topCategory.percentage > 40) {
        insights.push({
          title: 'High Concentration in One Category',
          description: `${topCategory.name} accounts for ${topCategory.percentage.toFixed(1)}% of your expenses. Consider diversifying or reviewing this category.`,
          type: 'info',
          priority: 'medium',
        });
      }
    }

    // Budget compliance check
    const budgets = await Budget.find({ userId: userIdObj, isActive: true });
    if (budgets.length > 0) {
      const budgetTracking = await Promise.all(
        budgets.map(async (budget) => {
          const budgetExpenses = await Transaction.aggregate([
            {
              $match: {
                userId: userIdObj,
                type: 'expense',
                category: budget.category,
                date: { $gte: budget.startDate, $lte: budget.endDate || endDate },
              },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]);
          const spent = budgetExpenses[0]?.total || 0;
          return { budget, spent, percentage: (spent / budget.amount) * 100 };
        })
      );

      const exceededBudgets = budgetTracking.filter((b) => b.percentage > 100);
      const warningBudgets = budgetTracking.filter((b) => b.percentage > 80 && b.percentage <= 100);

      if (exceededBudgets.length > 0) {
        insights.push({
          title: 'Budget Exceeded',
          description: `You've exceeded ${exceededBudgets.length} budget${exceededBudgets.length > 1 ? 's' : ''}. Review your spending in these categories.`,
          type: 'warning',
          priority: 'high',
        });
      } else if (warningBudgets.length > 0) {
        insights.push({
          title: 'Approaching Budget Limit',
          description: `${warningBudgets.length} budget${warningBudgets.length > 1 ? 's are' : ' is'} at ${warningBudgets[0].percentage.toFixed(0)}% capacity. Monitor closely.`,
          type: 'info',
          priority: 'medium',
        });
      }
    }

    // Savings rate insight
    if (currentIncome > 0) {
      const savingsRate = (currentBalance / currentIncome) * 100;
      if (savingsRate > 20) {
        insights.push({
          title: 'Excellent Savings Rate',
          description: `You're saving ${savingsRate.toFixed(1)}% of your income. This is above the recommended 20% savings rate!`,
          type: 'positive',
          priority: 'low',
        });
      } else if (savingsRate < 0) {
        insights.push({
          title: 'Negative Savings Rate',
          description: `You're spending more than you earn. Focus on reducing expenses or increasing income.`,
          type: 'warning',
          priority: 'high',
        });
      }
    }

    // Ensure we have at least 3 insights
    if (insights.length < 3) {
      insights.push({
        title: 'Financial Summary',
        description: `This ${period}, you earned $${currentIncome.toFixed(2)} and spent $${currentExpenses.toFixed(2)}, resulting in a ${currentBalance >= 0 ? 'surplus' : 'deficit'} of $${Math.abs(currentBalance).toFixed(2)}.`,
        type: 'info',
        priority: 'low',
      });
    }

    return {
      period,
      summary: {
        income: currentIncome,
        expenses: currentExpenses,
        balance: currentBalance,
      },
      comparison: {
        incomeChange: prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0,
        expenseChange,
        balanceChange: prevBalance !== 0 ? ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100 : 0,
      },
      topCategories,
      insights: insights.slice(0, 5), // Limit to top 5 insights
    };
  } catch (error) {
    console.error('Insights generation error:', error);
    throw error;
  }
};

/**
 * Budget Optimization Suggestions based on Historical Patterns
 */
export const getBudgetSuggestions = async (userId) => {
  try {
    // Convert userId to ObjectId for proper matching
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get historical spending by category
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          userId: userIdObj,
          type: 'expense',
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
    ]);

    const suggestions = categorySpending.map((item) => {
      const monthlyAverage = item.total / 6;
      const stdDev = calculateStdDev(item.avgAmount, item.maxAmount, item.minAmount);
      
      // Suggest budget with 20% buffer above average, but cap at 2x average
      const suggestedAmount = Math.min(
        monthlyAverage * 1.2,
        monthlyAverage * 2
      );

      // Calculate confidence based on transaction count and variance
      let confidence = 'medium';
      if (item.count >= 10 && stdDev < item.avgAmount) {
        confidence = 'high';
      } else if (item.count < 5) {
        confidence = 'low';
      }

      return {
        category: {
          id: item.category._id,
          name: item.category.name,
          icon: item.category.icon,
        },
        suggestedAmount: Math.round(suggestedAmount * 100) / 100,
        basedOn: {
          months: 6,
          transactions: item.count,
          averageMonthly: Math.round(monthlyAverage * 100) / 100,
          maxMonthly: Math.round((item.maxAmount || monthlyAverage) * 100) / 100,
        },
        confidence,
        reasoning: confidence === 'high' 
          ? 'Based on consistent spending patterns'
          : 'Based on limited historical data - consider reviewing after more transactions',
      };
    });

    // Sort by suggested amount (highest first)
    suggestions.sort((a, b) => b.suggestedAmount - a.suggestedAmount);

    return {
      suggestions: suggestions.slice(0, 10), // Top 10 suggestions
      methodology: 'Calculated using 6-month average with 20% buffer, capped at 2x average',
    };
  } catch (error) {
    console.error('Budget suggestions error:', error);
    throw error;
  }
};

/**
 * Calculate simple standard deviation estimate
 */
const calculateStdDev = (avg, max, min) => {
  // Simple estimate: range / 4 (rough approximation)
  return (max - min) / 4;
};

/**
 * Spending Prediction using Moving Averages and Trend Analysis
 */
export const predictSpending = async (userId, months = 3) => {
  try {
    // Convert userId to ObjectId for proper matching
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Get monthly spending data
    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId: userIdObj,
          type: 'expense',
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    if (monthlyData.length === 0) {
      return {
        basedOn: 'No historical data available',
        averageMonthlySpending: 0,
        trend: 0,
        predictions: [],
        confidence: 'low',
      };
    }

    const monthlyTotals = monthlyData.map((m) => m.total);
    const average = monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length;

    // Calculate trend using linear regression (simple slope)
    let trend = 0;
    if (monthlyTotals.length > 1) {
      const n = monthlyTotals.length;
      const sumX = (n * (n + 1)) / 2;
      const sumY = monthlyTotals.reduce((a, b) => a + b, 0);
      const sumXY = monthlyTotals.reduce((sum, val, idx) => sum + val * (idx + 1), 0);
      const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
      
      trend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    // Calculate moving average (last 3 months)
    const recentMonths = monthlyTotals.slice(-3);
    const movingAverage = recentMonths.reduce((a, b) => a + b, 0) / recentMonths.length;

    // Generate predictions
    const predictions = [];
    for (let i = 1; i <= months; i++) {
      // Use weighted average: 70% moving average + 30% trend projection
      const predicted = movingAverage * 0.7 + (average + trend * (monthlyTotals.length + i)) * 0.3;
      
      const now = new Date();
      predictions.push({
        month: i,
        monthName: format(new Date(now.getFullYear(), now.getMonth() + i, 1), 'MMM yyyy'),
        predictedAmount: Math.max(0, Math.round(predicted * 100) / 100),
        confidence: monthlyTotals.length >= 6 ? 'medium' : 'low',
      });
    }

    // Determine overall confidence
    let confidence = 'low';
    if (monthlyTotals.length >= 6) {
      const variance = calculateVariance(monthlyTotals);
      const coefficientOfVariation = Math.sqrt(variance) / average;
      confidence = coefficientOfVariation < 0.3 ? 'high' : 'medium';
    }

    return {
      basedOn: `${monthlyTotals.length} months of historical data`,
      averageMonthlySpending: Math.round(average * 100) / 100,
      movingAverage: Math.round(movingAverage * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      predictions,
      confidence,
      methodology: 'Uses moving average (70%) and trend analysis (30%) for predictions',
    };
  } catch (error) {
    console.error('Spending prediction error:', error);
    throw error;
  }
};

/**
 * Calculate variance
 */
const calculateVariance = (values) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
};

/**
 * Rule-Based Financial Advice Engine
 */
export const getFinancialAdvice = async (userId, question) => {
  try {
    // Convert userId to ObjectId for proper matching
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    const questionLower = (question || '').toLowerCase().trim();

    // Get user's financial context
    const recentTransactions = await Transaction.find({ userId: userIdObj })
      .sort({ date: -1 })
      .limit(20)
      .populate('category', 'name');

    const budgets = await Budget.find({ userId: userIdObj, isActive: true })
      .populate('category', 'name');

    const currentMonth = startOfMonth(new Date());
    const currentMonthExpenses = await Transaction.aggregate([
      {
        $match: {
          userId: userIdObj,
          type: 'expense',
          date: { $gte: currentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = currentMonthExpenses[0]?.total || 0;

    const currentMonthIncome = await Transaction.aggregate([
      {
        $match: {
          userId: userIdObj,
          type: 'income',
          date: { $gte: currentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalIncome = currentMonthIncome[0]?.total || 0;

    // Rule-based responses with improved question matching
    let response = null;
    let responseType = 'info';

    // Budget-related questions
    if (questionLower.includes('budget') || questionLower.includes('spending limit') || questionLower.includes('budgets doing')) {
      if (budgets.length === 0) {
        response = "You don't have any active budgets set up yet. Creating budgets can help you track and control your spending. I recommend setting budgets for your top spending categories like Food, Transport, or Shopping.";
        responseType = 'suggestion';
      } else {
        const budgetStatus = await Promise.all(
          budgets.map(async (budget) => {
            const spent = await Transaction.aggregate([
              {
                $match: {
                  userId: userIdObj,
                  type: 'expense',
                  category: budget.category,
                  date: { $gte: budget.startDate, $lte: budget.endDate || new Date() },
                },
              },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            return {
              name: budget.category.name,
              budget: budget.amount,
              spent: spent[0]?.total || 0,
              remaining: budget.amount - (spent[0]?.total || 0),
              percentage: ((spent[0]?.total || 0) / budget.amount) * 100,
            };
          })
        );

        const exceeded = budgetStatus.filter((b) => b.remaining < 0);
        const warning = budgetStatus.filter((b) => b.percentage >= 80 && b.remaining >= 0);
        
        if (exceeded.length > 0) {
          const exceededList = exceeded.map((b) => `${b.name} (exceeded by $${Math.abs(b.remaining).toFixed(2)})`).join(', ');
          response = `⚠️ You've exceeded your budget for ${exceededList}. Consider reviewing your spending in these categories and adjusting your budget if needed.`;
          responseType = 'warning';
        } else if (warning.length > 0) {
          const warningList = warning.map((b) => `${b.name} (${b.percentage.toFixed(0)}% used)`).join(', ');
          response = `You're approaching your budget limit for ${warningList}. Monitor your spending closely to avoid exceeding these budgets.`;
          responseType = 'warning';
        } else {
          const budgetSummary = budgetStatus.map((b) => `${b.name}: $${b.spent.toFixed(2)} / $${b.budget.toFixed(2)} (${b.percentage.toFixed(0)}% used)`).join('\n');
          response = `You have ${budgets.length} active budget${budgets.length > 1 ? 's' : ''} and you're currently within limits:\n\n${budgetSummary}\n\nKeep monitoring your spending to stay on track!`;
          responseType = 'info';
        }
      }
    }
    // Saving-related questions
    else if (questionLower.includes('save') || questionLower.includes('saving') || questionLower.includes('should i save')) {
      if (totalIncome > 0) {
        const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
        const savingsAmount = totalIncome - totalExpenses;
        
        if (savingsRate > 20) {
          response = `✅ Excellent! You're saving ${savingsRate.toFixed(1)}% of your income this month ($${savingsAmount.toFixed(2)}). This is above the recommended 20% savings rate. Keep up the great work!`;
          responseType = 'positive';
        } else if (savingsRate > 0) {
          const recommended = totalIncome * 0.2;
          const shortfall = recommended - savingsAmount;
          response = `You're currently saving ${savingsRate.toFixed(1)}% of your income this month ($${savingsAmount.toFixed(2)}). For better financial security, aim to save at least 20% ($${recommended.toFixed(2)}). You need to save $${shortfall.toFixed(2)} more to reach this goal.`;
          responseType = 'suggestion';
        } else {
          const overspend = Math.abs(savingsAmount);
          response = `⚠️ You're spending $${overspend.toFixed(2)} more than you earn this month. Your expenses ($${totalExpenses.toFixed(2)}) exceed your income ($${totalIncome.toFixed(2)}). Focus on reducing expenses or finding ways to increase income.`;
          responseType = 'warning';
        }
      } else {
        response = `I don't see any income recorded for this month yet. Once you add income transactions, I can help you calculate how much you should save. A good rule of thumb is to save at least 20% of your income.`;
        responseType = 'info';
      }
    }
    // Income growth questions
    else if (questionLower.includes('income') && (questionLower.includes('growth') || questionLower.includes('increase') || questionLower.includes('how much'))) {
      if (totalIncome > 0) {
        // Get last month income for comparison
        const lastMonth = startOfMonth(subMonths(new Date(), 1));
        const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
        const lastMonthIncome = await Transaction.aggregate([
          {
            $match: {
              userId: userIdObj,
              type: 'income',
              date: { $gte: lastMonth, $lte: lastMonthEnd },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const prevIncome = lastMonthIncome[0]?.total || 0;
        
        if (prevIncome > 0) {
          const growth = ((totalIncome - prevIncome) / prevIncome) * 100;
          response = `Your income this month is $${totalIncome.toFixed(2)}. Compared to last month ($${prevIncome.toFixed(2)}), that's a ${growth >= 0 ? 'growth' : 'decrease'} of ${Math.abs(growth).toFixed(1)}%.`;
          responseType = growth >= 0 ? 'positive' : 'warning';
        } else {
          response = `Your income this month is $${totalIncome.toFixed(2)}. This is your first month with recorded income. Keep tracking to see your income trends over time!`;
          responseType = 'info';
        }
      } else {
        response = `I don't see any income recorded for this month yet. Add your income transactions to track your income growth over time.`;
        responseType = 'info';
      }
    }
    // Category/spending questions
    else if (questionLower.includes('category') || questionLower.includes('spend') || questionLower.includes('where') || questionLower.includes('spending most')) {
      const categoryBreakdown = await Transaction.aggregate([
        {
          $match: {
            userId: userIdObj,
            type: 'expense',
            date: { $gte: currentMonth },
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
      ]);

      if (categoryBreakdown.length > 0) {
        const topCategory = categoryBreakdown[0];
        const percentage = totalExpenses > 0 ? (topCategory.total / totalExpenses) * 100 : 0;
        const top3 = categoryBreakdown.slice(0, 3).map((c, i) => 
          `${i + 1}. ${c.category.name}: $${c.total.toFixed(2)} (${c.count} transactions)`
        ).join('\n');
        
        response = `Your top spending category this month is **${topCategory.category.name}** with $${topCategory.total.toFixed(2)} (${percentage.toFixed(1)}% of total expenses).\n\nTop 3 spending categories:\n${top3}`;
        responseType = 'info';
      } else {
        response = `You haven't recorded any expenses this month yet. Start adding transactions to see where your money is going.`;
        responseType = 'info';
      }
    }
    // Reduce expenses questions
    else if (questionLower.includes('reduce') || questionLower.includes('cut') || questionLower.includes('decrease') || questionLower.includes('lower')) {
      if (totalExpenses > 0) {
        const categoryBreakdown = await Transaction.aggregate([
          {
            $match: {
              userId: userIdObj,
              type: 'expense',
              date: { $gte: currentMonth },
            },
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
            },
          },
          { $sort: { total: -1 } },
          { $limit: 3 },
          {
            $lookup: {
              from: 'categories',
              localField: '_id',
              foreignField: '_id',
              as: 'category',
            },
          },
          { $unwind: '$category' },
        ]);

        if (categoryBreakdown.length > 0) {
          const topCategory = categoryBreakdown[0];
          const suggestions = categoryBreakdown.map((c) => 
            `- ${c.category.name}: $${c.total.toFixed(2)}`
          ).join('\n');
          
          response = `To reduce expenses, focus on your top spending categories:\n\n${suggestions}\n\nConsider:\n1. Reviewing if these expenses are necessary\n2. Looking for cheaper alternatives\n3. Setting a budget for ${topCategory.category.name} (your highest category)\n4. Tracking daily spending to identify patterns`;
          responseType = 'suggestion';
        } else {
          response = `Your expenses this month are $${totalExpenses.toFixed(2)}. To reduce expenses, review your transactions and identify areas where you can cut back.`;
          responseType = 'suggestion';
        }
      } else {
        response = `You haven't recorded any expenses this month. Once you start tracking expenses, I can help identify areas to reduce spending.`;
        responseType = 'info';
      }
    }
    // Balance/overview questions
    else if (questionLower.includes('balance') || questionLower.includes('overview') || questionLower.includes('summary') || questionLower.includes('how am i doing')) {
      const balance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
      
      response = `📊 **Financial Summary for This Month:**\n\n💰 Income: $${totalIncome.toFixed(2)}\n💸 Expenses: $${totalExpenses.toFixed(2)}\n📈 Balance: $${balance.toFixed(2)} ${balance >= 0 ? '(Surplus)' : '(Deficit)'}\n\n${totalIncome > 0 ? `Savings Rate: ${savingsRate.toFixed(1)}%` : 'Add income to calculate savings rate'}\n\n${balance >= 0 ? '✅ You have a positive cash flow!' : '⚠️ You\'re spending more than you earn. Consider reducing expenses.'}`;
      responseType = balance >= 0 ? 'positive' : 'warning';
    }
    // Default response if no specific match
    else {
      response = "I can help you with budget planning, spending analysis, savings goals, and financial insights. Try asking:\n\n• 'How are my budgets doing?'\n• 'What should I save?'\n• 'Where am I spending the most?'\n• 'How can I reduce expenses?'\n• 'What's my financial summary?'";
      responseType = 'info';
    }

    return {
      response: response,
      type: responseType,
      suggestions: [
        'How are my budgets doing?',
        'What should I save?',
        'Where am I spending the most?',
        'How can I reduce expenses?',
      ],
    };
  } catch (error) {
    console.error('Financial advice error:', error);
    return {
      response: "I'm having trouble processing your request. Please try rephrasing your question or ask about budgets, spending, or savings.",
      type: 'error',
      suggestions: [],
    };
  }
};
