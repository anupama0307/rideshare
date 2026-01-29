import { Router } from 'express';
import { authController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.patch('/profile', authenticate, authController.updateProfile);
router.get('/emergency-contacts', authenticate, authController.getEmergencyContacts);
router.post('/emergency-contacts', authenticate, authController.addEmergencyContact);

export default router;
