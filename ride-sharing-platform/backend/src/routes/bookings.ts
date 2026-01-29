import { Router } from 'express';
import { bookingController } from '../controllers/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Rider routes
router.post('/', bookingController.createBooking);
router.get('/', bookingController.getMyBookings);
router.get('/:id', bookingController.getBooking);
router.post('/:id/cancel', bookingController.cancelBooking);
router.post('/:id/rate', bookingController.rateBooking);

// Status updates (both riders and drivers)
router.patch('/:id/status', bookingController.updateBookingStatus);

// Driver route - get bookings for a specific ride
router.get('/ride/:id', authorize('driver', 'admin'), bookingController.getRideBookings);

export default router;
