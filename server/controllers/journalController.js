import Journal from '../models/Journal.js';

// @desc    Get all journal entries
// @route   GET /api/journals
export const getJournals = async (req, res) => {
  try {
    // Sort by date descending (newest first)
    const journals = await Journal.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
    res.status(200).json(journals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new entry
// @route   POST /api/journals
export const createJournal = async (req, res) => {
  if (!req.body.content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const journal = await Journal.create({
      user: req.user.id,
      date: req.body.date,
      type: req.body.type,
      title: req.body.title,
      content: req.body.content
    });

    res.status(200).json(journal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update entry
// @route   PUT /api/journals/:id
export const updateJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) return res.status(404).json({ message: 'Entry not found' });
    if (journal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const updatedJournal = await Journal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedJournal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete entry
// @route   DELETE /api/journals/:id
export const deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) return res.status(404).json({ message: 'Entry not found' });
    if (journal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    await journal.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Bulk Import Journals
// @route   POST /api/journals/bulk
export const importJournals = async (req, res) => {
  try {
    const entries = req.body; // Array of objects { date, content, title, type }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'No entries provided' });
    }

    // Add user ID to every entry
    const entriesWithUser = entries.map(entry => ({
      ...entry,
      user: req.user.id,
      type: 'daily', // Default to daily for this sheet
    }));

    // Insert all (ordered is false so one error doesn't stop the rest)
    const result = await Journal.insertMany(entriesWithUser, { ordered: false });

    res.status(201).json({ message: `Successfully imported ${result.length} entries` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
};