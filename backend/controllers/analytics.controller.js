import {
  getOverview,
  getSpendingByCategory,
  getTrends,
  getDailySpendingTrend,
  getPeriodComparison,
} from '../services/analytics.service.js';

export const getOverviewData = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const data = await getOverview(req.userId, period);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getSpendingByCategoryData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getSpendingByCategory(req.userId, startDate, endDate);

    res.json({
      success: true,
      data: { spending: data },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendsData = async (req, res, next) => {
  try {
    const { type = 'expense', period = 'month', months = 6 } = req.query;
    const data = await getTrends(req.userId, type, period, parseInt(months));

    res.json({
      success: true,
      data: { trends: data },
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyTrendData = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const data = await getDailySpendingTrend(req.userId, parseInt(days));

    res.json({
      success: true,
      data: { dailyTrend: data },
    });
  } catch (error) {
    next(error);
  }
};

export const getComparisonData = async (req, res, next) => {
  try {
    const { period1Start, period1End, period2Start, period2End } = req.query;

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({
        success: false,
        message: 'All period dates are required',
      });
    }

    const data = await getPeriodComparison(
      req.userId,
      period1Start,
      period1End,
      period2Start,
      period2End
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
