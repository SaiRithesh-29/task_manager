import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  order: { type: Number, default: 0 },
  dueDate: Date,
  labels: [{
    name: String,
    color: String
  }],
  subtasks: [{
    title: String,
    completed: { type: Boolean, default: false }
  }],
  assignees: [{
    userId: String,
    name: String,
    email: String
  }],
  comments: [{
    userId: String,
    name: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number
  }],
  createdBy: String,
  archived: { type: Boolean, default: false },
  editedBy: { userId: String, name: String },
  editedAt: Date
}, { timestamps: true });

export default mongoose.model('Card', cardSchema);
