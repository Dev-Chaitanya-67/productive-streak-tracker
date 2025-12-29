import express from 'express';
import { 
  logSession, 
  getFocusStats, 
  addSound, 
  getSounds, 
  deleteSound 
} from '../controllers/focusController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Focus Logging & Stats
router.route('/')
  .post(protect, logSession)
  .get(protect, getFocusStats);

// Sound Management
router.route('/sounds')
  .get(protect, getSounds)
  .post(protect, addSound);

router.delete('/sounds/:id', protect, deleteSound);

export default router;