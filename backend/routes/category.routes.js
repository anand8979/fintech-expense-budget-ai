import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiLimiter);

// Validation rules
const categoryValidation = [
  body('name').trim().notEmpty(),
  body('type').isIn(['expense', 'income']),
  body('icon').optional().trim(),
  body('color').optional().trim(),
];

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', categoryValidation, validate, createCategory);
router.put('/:id', categoryValidation, validate, updateCategory);
router.delete('/:id', deleteCategory);

export default router;
