import Note from '../models/Note.js';

// Fetch all notes for authenticated user
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create or Update a note with conflict resolution
export const upsertNote = async (req, res) => {
  try {
    const noteId = req.params.id || req.body.id;
    const noteData = { ...req.body, userId: req.user.id };

    // Conflict Resolution: Only update if server doc is older than app's doc
    // If document doesn't exist (upsert), it will be created
    const result = await Note.updateOne(
      {
        _id: noteId,
        userId: req.user.id,
        $or: [
          { updatedAt: { $lt: noteData.updatedAt } }, // Server is older
          { updatedAt: { $exists: false } } // Document doesn't exist yet
        ]
      },
      { $set: noteData },
      { upsert: true }
    );

    // Fetch the updated/created note to return
    const updatedNote = await Note.findOne({ _id: noteId, userId: req.user.id });

    res.status(200).json({
      success: true,
      note: updatedNote,
      result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Note.deleteOne({ _id: id, userId: req.user.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Optional: Bulk sync endpoint for multiple notes at once
export const bulkUpsertNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'Notes array is required' });
    }

    const results = [];
    const userId = req.user.id;

    for (const noteData of notes) {
      const noteWithUser = { ...noteData, userId };

      const result = await Note.updateOne(
        {
          _id: noteData._id,
          userId: userId,
          $or: [
            { updatedAt: { $lt: noteData.updatedAt } },
            { updatedAt: { $exists: false } }
          ]
        },
        { $set: noteWithUser },
        { upsert: true }
      );

      results.push({ id: noteData._id, result });
    }

    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
