import express from 'express';
import { body } from 'express-validator';
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetTracking,
} from '../controllers/budget.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
// No rate limiting for budgets

// Validation rules
const budgetValidation = [
  body('category').isMongoId(),
  body('amount').isFloat({ min: 0.01 }),
  body('period').isIn(['monthly', 'yearly']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('isActive').optional().isBoolean(),
];

router.get('/', getBudgets);
router.get('/tracking', getBudgetTracking);
router.get('/:id', getBudget);
router.post('/', budgetValidation, validate, createBudget);
router.put('/:id', budgetValidation, validate, updateBudget);
router.delete('/:id', deleteBudget);

export default router;
