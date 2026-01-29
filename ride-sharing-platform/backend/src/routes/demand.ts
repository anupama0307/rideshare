import { Router } from 'express';
import { demandController } from '../controllers/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes (for displaying to all users)
router.get('/heatmap', demandController.getHeatmap);
router.get('/predict', demandController.predictDemand);
router.get('/surge', demandController.getSurge);

// Admin only
router.post('/zones/generate', authenticate, authorize('admin'), demandController.generateZones);

export default router;
