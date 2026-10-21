import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID string from Android app
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: ""
  },
  content: {
    type: String,
    default: ""
  },
  color: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  folder: {
    type: String,
    default: "Notes"
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Number, // Unix timestamp in milliseconds
    required: true
  },
  updatedAt: {
    type: Number, // Crucial for offline-first conflict resolution
    required: true
  }
}, {
  _id: false, // Disable auto ObjectId generation
  timestamps: false // We rely on the app's timestamps
});

// Transform _id to id when sending JSON response
noteSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Note = mongoose.model('Note', noteSchema);
export default Note;
