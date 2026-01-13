import express from 'express';
import { exportPDF, exportCSV } from '../controllers/export.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiLimiter);

router.get('/pdf', exportPDF);
router.get('/csv', exportCSV);

export default router;
