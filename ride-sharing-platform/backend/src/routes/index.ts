import { Router } from 'express';
import authRoutes from './auth.js';
import ridesRoutes from './rides.js';
import bookingsRoutes from './bookings.js';
import demandRoutes from './demand.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/rides', ridesRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/demand', demandRoutes);

export default router;
