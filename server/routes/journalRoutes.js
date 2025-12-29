import express from 'express';
import { 
  getJournals, 
  createJournal, 
  updateJournal, 
  deleteJournal,
  importJournals // <--- Import this
} from '../controllers/journalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getJournals)
  .post(protect, createJournal);

// Bulk Import Route (Must be before /:id)
router.post('/bulk', protect, importJournals);

router.route('/:id')
  .put(protect, updateJournal)
  .delete(protect, deleteJournal);

export default router;