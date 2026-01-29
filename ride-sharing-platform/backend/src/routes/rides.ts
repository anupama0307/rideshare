import { Router, type Router as IRouter } from 'express';
import { rideController } from '../controllers/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router: IRouter = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// RIDE REQUESTS (Rider routes)
// ============================================
router.post('/requests', rideController.createRideRequest);
router.get('/requests', rideController.getMyRideRequests);
router.get('/requests/:id', rideController.getRideRequest);
router.post('/requests/:id/cancel', rideController.cancelRideRequest);
router.get('/requests/:id/matches', rideController.getMatchesForRequest);
router.get('/requests/:id/pools', rideController.getPotentialPools);

// ============================================
// RIDE SEARCH & MATCHING
// ============================================
router.post('/search', rideController.searchRides);
router.get('/clusters', rideController.getClusters);

// ============================================
// RIDES (Driver routes)
// ============================================
router.post('/', authorize('driver', 'admin'), rideController.createRide);
router.get('/', authorize('driver', 'admin'), rideController.getMyRides);
router.patch('/:id/status', authorize('driver', 'admin'), rideController.updateRideStatus);

// ============================================
// CARBON ESTIMATES
// ============================================
router.get('/carbon/estimate', rideController.getCarbonEstimate);

export default router;
