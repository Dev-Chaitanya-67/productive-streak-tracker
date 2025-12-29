import express from 'express';
import { getHabits, createHabit, toggleHabitDate, deleteHabit } from '../controllers/habitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getHabits)
  .post(protect, createHabit);

router.route('/:id/toggle')
  .put(protect, toggleHabitDate);

router.route('/:id')
  .delete(protect, deleteHabit);

export default router;