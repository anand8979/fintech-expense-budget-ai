import {
  categorizeTransaction,
  generateFinancialInsights,
  getBudgetSuggestions,
  predictSpending,
  getFinancialAdvice,
} from '../services/intelligence.service.js';

export const categorize = async (req, res, next) => {
  try {
    const { description, amount } = req.body;

    if (!description || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Description and amount are required',
      });
    }

    const result = await categorizeTransaction(req.userId, description, amount);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const result = await generateFinancialInsights(req.userId, period);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgetSuggestionsData = async (req, res, next) => {
  try {
    const result = await getBudgetSuggestions(req.userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const predictSpendingData = async (req, res, next) => {
  try {
    const { months = 3 } = req.query;
    const result = await predictSpending(req.userId, parseInt(months));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const result = await getFinancialAdvice(req.userId, message);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
