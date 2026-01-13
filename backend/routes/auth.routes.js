import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refresh,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { authLimiter, apiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/refresh', apiLimiter, refresh);
router.get('/me', authenticate, getMe);

export default router;
