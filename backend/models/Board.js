import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
  name: String,
  color: { type: String, default: 'blue' },
  createdBy: {
    type: String,
    required: true
  },
  members: [{
    userId: String,
    email: String,
    name: String,
    role: {
      type: String,
      enum: ['admin', 'member', 'observer'],
      default: 'member'
    },
    permissions: {
      canEdit: { type: Boolean, default: true },
      canDelete: { type: Boolean, default: false }
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  onlineMembers: [{
    userId: String,
    userName: String,
    profilePhoto: String,
    socketId: String,
    lastActive: { type: Date, default: Date.now }
  }],
  editedBy: { userId: String, name: String },
  editedAt: Date
}, { timestamps: true });

export default mongoose.model('Board', boardSchema);
