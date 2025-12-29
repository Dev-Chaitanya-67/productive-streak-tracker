import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    color: { type: String, default: 'emerald' },
    completedDates: [{ type: String }] // YYYY-MM-DD
  },
  { timestamps: true }
);

export default mongoose.model('Habit', habitSchema);
