import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    type: {
      type: String, // 'daily', 'code', or custom like 'Project X'
      required: true,
      default: 'daily'
    },
    title: {
      type: String,
      default: 'Untitled Entry'
    },
    content: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Journal', journalSchema);