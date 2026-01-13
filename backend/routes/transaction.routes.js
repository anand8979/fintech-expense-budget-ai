import express from 'express';
import { body } from 'express-validator';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} from '../controllers/transaction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiLimiter);

// Validation rules
const transactionValidation = [
  body('type').isIn(['expense', 'income']),
  body('amount').isFloat({ min: 0.01 }),
  body('category').isMongoId(),
  body('description').optional().trim(),
  body('date').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'bank_transfer', 'digital_wallet', 'other']),
  body('location').optional().trim(),
];

router.get('/', getTransactions);
router.get('/summary', getTransactionSummary);
router.get('/:id', getTransaction);
router.post('/', transactionValidation, validate, createTransaction);
router.put('/:id', transactionValidation, validate, updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
