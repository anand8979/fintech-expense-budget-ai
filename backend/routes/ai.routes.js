import express from 'express';
import { body } from 'express-validator';
import {
  categorize,
  getInsights,
  getBudgetSuggestionsData,
  predictSpendingData,
  chat,
} from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// All routes require authentication and AI rate limiting
router.use(authenticate);
router.use(aiLimiter);

const categorizeValidation = [
  body('description').trim().notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
];

const chatValidation = [
  body('message').trim().notEmpty(),
];

router.post('/categorize', categorizeValidation, validate, categorize);
router.get('/insights', getInsights);
router.get('/budget-suggestions', getBudgetSuggestionsData);
router.get('/predict-spending', predictSpendingData);
router.post('/chat', chatValidation, validate, chat);

export default router;
