import express from 'express';
import {
  getOverviewData,
  getSpendingByCategoryData,
  getTrendsData,
  getDailyTrendData,
  getComparisonData,
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
// No rate limiting for analytics

router.get('/overview', getOverviewData);
router.get('/spending-by-category', getSpendingByCategoryData);
router.get('/trends', getTrendsData);
router.get('/daily-trend', getDailyTrendData);
router.get('/comparison', getComparisonData);

export default router;
