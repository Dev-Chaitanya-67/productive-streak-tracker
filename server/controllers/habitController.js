import Habit from '../models/Habit.js';

// Get all habits
export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id });
    res.status(200).json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new habit
export const createHabit = async (req, res) => {
  try {
    const { name, color } = req.body;
    const habit = await Habit.create({ user: req.user.id, name, color });
    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle "Done" for today (or specific date)
export const toggleHabitDate = async (req, res) => {
  try {
    const { date } = req.body; // Expect "YYYY-MM-DD"
    const habit = await Habit.findById(req.params.id);
    
    if (habit.user.toString() !== req.user.id) return res.status(401).json({ msg: "Not authorized" });

    const index = habit.completedDates.indexOf(date);
    if (index === -1) {
      habit.completedDates.push(date); // Mark done
    } else {
      habit.completedDates.splice(index, 1); // Unmark
    }
    
    await habit.save();
    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    await Habit.findByIdAndDelete(req.params.id);
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};