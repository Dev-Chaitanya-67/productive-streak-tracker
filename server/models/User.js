import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // We can add specific fields for your App later (e.g., focusStats)
  focusStats: {
    totalMinutes: { type: Number, default: 0 },
    sessionsCompleted: { type: Number, default: 0 },
    streak: { type: Number, default: 0 }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

export default mongoose.model('User', userSchema);