import mongoose from 'mongoose';

const deleteRequestSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  targetType: { type: String, enum: ['card', 'list', 'board'], required: true },
  targetId: { type: String, required: true },
  targetName: String,
  requestedBy: { userId: String, name: String },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('DeleteRequest', deleteRequestSchema);
