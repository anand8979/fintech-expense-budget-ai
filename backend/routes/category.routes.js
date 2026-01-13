import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
// No rate limiting for categories

// Validation rules
const categoryValidation = [
  body('name').trim().notEmpty(),
  body('type').isIn(['expense', 'income']),
  body('icon').optional().trim(),
  body('color').optional().trim(),
];

// Category routes - users can read, admins can manage
router.get('/', getCategories); // Both user and admin can read
router.get('/:id', getCategory); // Both user and admin can read
router.post('/', authorize('admin'), categoryValidation, validate, createCategory); // Admin only
router.put('/:id', authorize('admin'), categoryValidation, validate, updateCategory); // Admin only
router.delete('/:id', authorize('admin'), deleteCategory); // Admin only

export default router;
