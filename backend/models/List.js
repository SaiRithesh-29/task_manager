import mongoose from 'mongoose';

const listSchema = new mongoose.Schema({
  title: String,
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board'
  },
  createdBy: String,
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('List', listSchema);