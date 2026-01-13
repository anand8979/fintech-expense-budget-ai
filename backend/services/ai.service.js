import openai from '../config/openai.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';

export const categorizeTransaction = async (userId, description, amount) => {
  try {
    // Get user's categories
    const categories = await Category.find({ userId, type: 'expense' });
    const categoryList = categories.map((cat) => `- ${cat.name}`).join('\n');

    const prompt = `Given the following transaction description and amount, categorize it into one of these expense categories:

${categoryList}

Transaction: "${description}"
Amount: $${amount}

Respond with ONLY the category name that best matches this transaction. If none match well, respond with the closest one.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 50,
    });

    const suggestedCategory = completion.choices[0].message.content.trim();
    
    // Find matching category
    const matchedCategory = categories.find(
      (cat) => cat.name.toLowerCase() === suggestedCategory.toLowerCase()
    );

    return {
      suggestedCategory: matchedCategory || categories[0],
      confidence: matchedCategory ? 'high' : 'medium',
    };
  } catch (error) {
    console.error('AI categorization error:', error);
    // Fallback: return first category
    const categories = await Category.find({ userId, type: 'expense' });
    return {
      suggestedCategory: categories[0] || null,
      confidence: 'low',
    };
  }
};

export const generateFinancialInsights = async (userId, period = 'month') => {
  try {
    // Get transaction data
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).populate('category', 'name type');

    const expenses = transactions.filter((t) => t.type === 'expense');
    const income = transactions.filter((t) => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, t) => {
      const catName = t.category.name;
      acc[catName] = (acc[catName] || 0) + t.amount;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    const prompt = `Analyze the following financial data and provide 3-5 key insights and recommendations:

Period: ${period}
Total Income: $${totalIncome.toFixed(2)}
Total Expenses: $${totalExpenses.toFixed(2)}
Balance: $${balance.toFixed(2)}

Top Spending Categories:
${topCategories.map((c, i) => `${i + 1}. ${c.name}: $${c.amount.toFixed(2)}`).join('\n')}

Provide concise, actionable financial insights and recommendations. Format as a JSON object with an "insights" array, where each insight has "title" and "description" fields.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    let insights;
    try {
      insights = JSON.parse(completion.choices[0].message.content);
    } catch {
      // Fallback if JSON parsing fails
      insights = {
        insights: [
          {
            title: 'Financial Summary',
            description: `Your ${period} balance is $${balance.toFixed(2)}. ${balance > 0 ? 'Great job staying within budget!' : 'Consider reviewing your expenses.'}`,
          },
        ],
      };
    }

    return {
      period,
      summary: {
        income: totalIncome,
        expenses: totalExpenses,
        balance,
      },
      topCategories,
      insights: insights.insights || insights,
    };
  } catch (error) {
    console.error('AI insights error:', error);
    throw error;
  }
};

export const getBudgetSuggestions = async (userId) => {
  try {
    // Get historical spending data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: sixMonthsAgo },
    }).populate('category', 'name');

    // Calculate average spending per category
    const categoryAverages = transactions.reduce((acc, t) => {
      const catName = t.category.name;
      if (!acc[catName]) {
        acc[catName] = { total: 0, count: 0 };
      }
      acc[catName].total += t.amount;
      acc[catName].count += 1;
      return acc;
    }, {});

    const suggestions = Object.entries(categoryAverages).map(([name, data]) => {
      const monthlyAverage = (data.total / 6) * 1.1; // 10% buffer
      return {
        category: name,
        suggestedAmount: Math.round(monthlyAverage * 100) / 100,
        basedOn: `${data.count} transactions over 6 months`,
      };
    });

    return { suggestions };
  } catch (error) {
    console.error('Budget suggestions error:', error);
    throw error;
  }
};

export const predictSpending = async (userId, months = 3) => {
  try {
    // Get historical data
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: twelveMonthsAgo },
    }).sort({ date: 1 });

    // Group by month
    const monthlySpending = {};
    transactions.forEach((t) => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + t.amount;
    });

    const values = Object.values(monthlySpending);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values.length > 1 
      ? (values[values.length - 1] - values[0]) / values.length 
      : 0;

    // Simple linear prediction
    const predictions = [];
    for (let i = 1; i <= months; i++) {
      const predicted = average + (trend * i);
      predictions.push({
        month: i,
        predictedAmount: Math.max(0, Math.round(predicted * 100) / 100),
      });
    }

    return {
      basedOn: '12 months of historical data',
      averageMonthlySpending: Math.round(average * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      predictions,
    };
  } catch (error) {
    console.error('Spending prediction error:', error);
    throw error;
  }
};

export const chatWithAI = async (userId, message, conversationHistory = []) => {
  try {
    // Get user's financial context
    const recentTransactions = await Transaction.find({
      userId,
    })
      .sort({ date: -1 })
      .limit(10)
      .populate('category', 'name');

    const budgets = await Budget.find({
      userId,
      isActive: true,
    }).populate('category', 'name');

    const context = `User's recent financial activity:
- Recent transactions: ${recentTransactions.length} transactions
- Active budgets: ${budgets.length} budgets

You are a helpful financial assistant. Provide advice based on the user's financial data when relevant.`;

    const messages = [
      { role: 'system', content: context },
      ...conversationHistory.slice(-5), // Last 5 messages for context
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    return {
      response: completion.choices[0].message.content,
    };
  } catch (error) {
    console.error('AI chat error:', error);
    throw error;
  }
};
