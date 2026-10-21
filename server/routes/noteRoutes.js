import express from 'express';
import {
  getNotes,
  upsertNote,
  deleteNote,
  bulkUpsertNotes
} from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All note routes require authentication
router.use(protect);

// GET all notes for authenticated user
router.get('/', getNotes);

// POST create new note
router.post('/', upsertNote);

// PUT update existing note
router.put('/:id', upsertNote);

// DELETE a note
router.delete('/:id', deleteNote);

// Optional: Bulk sync endpoint
router.post('/bulk', bulkUpsertNotes);

export default router;
