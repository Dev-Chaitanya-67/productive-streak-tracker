import express from 'express';
import { check } from 'express-validator';
import { registerUser, loginUser, getProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('username', 'Username must be at least 3 characters').isLength({ min: 3 }),
    check('password', 'Password must be 8 or more characters').isLength({ min: 8 }),
  ],
  registerUser
);

router.post(
  '/login',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password is required').exists(),
  ],
  loginUser
);

// Profile routes
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;