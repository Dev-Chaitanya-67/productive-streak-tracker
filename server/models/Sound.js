import mongoose from 'mongoose';

const soundSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    label: {
      type: String, // e.g. "Binaural Alpha"
      required: true,
    },
    url: {
      type: String, // e.g. "https://youtube.com/watch?v=..."
      required: true,
    },
    type: {
      type: String,
      default: 'youtube'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Sound', soundSchema);