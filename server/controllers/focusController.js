import FocusLog from '../models/FocusLog.js';
import Sound from '../models/Sound.js';

// --- LOGGING ---
export const logSession = async (req, res) => {
  try {
    const { duration, mode, date } = req.body;
    const log = await FocusLog.create({
      user: req.user.id,
      duration,
      mode,
      date
    });
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- REPORTING (Smart Aggregation) ---
export const getFocusStats = async (req, res) => {
  try {
    const stats = await FocusLog.aggregate([
      { $match: { user: req.user._id } }, // Filter by user
      { 
        $group: {
          _id: "$date", // Group by Date
          totalMinutes: { $sum: "$duration" }, 
          sessions: { $sum: 1 } 
        }
      },
      { $sort: { _id: -1 } } // Sort newest first
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- SOUNDS ---
export const addSound = async (req, res) => {
  try {
    const { label, url } = req.body;
    const sound = await Sound.create({
      user: req.user.id,
      label,
      url
    });
    res.status(200).json(sound);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSounds = async (req, res) => {
  try {
    const sounds = await Sound.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(sounds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSound = async (req, res) => {
  try {
    const sound = await Sound.findById(req.params.id);
    if (!sound) return res.status(404).json({ message: "Sound not found" });
    if (sound.user.toString() !== req.user.id) return res.status(401).json({ msg: "Not authorized" });
    
    await sound.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};