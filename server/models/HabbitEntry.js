import mongoose from 'mongoose';

const habitEntrySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  habitId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Habit', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  }
}, { timestamps: true });

// Prevent duplicate entries for the same habit on the same day
habitEntrySchema.index({ habitId: 1, date: 1 }, { unique: true });

const HabitEntry = mongoose.model('HabitEntry', habitEntrySchema);
export default HabitEntry;