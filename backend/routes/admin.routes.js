import express from 'express';
import {
  getAllUsers,
  getAllTransactions,
  getAllBudgets,
  getGlobalAnalytics,
  updateUserRole,
  deleteUser,
  getUserStats,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId/stats', getUserStats);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Global data
router.get('/transactions', getAllTransactions);
router.get('/budgets', getAllBudgets);
router.get('/analytics', getGlobalAnalytics);

export default router;
