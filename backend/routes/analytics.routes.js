import express from 'express';
import {
  getOverviewData,
  getSpendingByCategoryData,
  getTrendsData,
  getComparisonData,
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiLimiter);

router.get('/overview', getOverviewData);
router.get('/spending-by-category', getSpendingByCategoryData);
router.get('/trends', getTrendsData);
router.get('/comparison', getComparisonData);

export default router;
