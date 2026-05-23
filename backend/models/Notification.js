import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
  cardTitle: { type: String },
  type: {
    type: String,
    enum: ['due_date_set', 'due_date_reminder', 'due_date_overdue', 'card_assigned'],
    default: 'due_date_set'
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdBy: { type: String }
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
