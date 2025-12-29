import mongoose from 'mongoose';

const focusLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    mode: {
      type: String, // 'focus' or 'break'
      default: 'focus',
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('FocusLog', focusLogSchema);