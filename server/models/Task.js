import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    
    // --- EXACT MATCH WITH FRONTEND ---
    date: { type: String }, // YYYY-MM-DD
    time: { type: String }, // HH:MM
    category: { type: String, default: 'work' }, // 'work', 'personal', 'code' (For Color)
    customList: { type: String, default: null }, // 'College', 'Startup' (For Tabs/Widgets)
    
    // LeetCode Specifics
    difficulty: { type: String }, // 'Easy', 'Medium', 'Hard'
    link: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Task', taskSchema);