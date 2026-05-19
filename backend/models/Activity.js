import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  user: {
    userId: String,
    name: String,
    email: String
  },
  action: {
    type: String,
    enum: ['create_list', 'delete_list', 'create_card', 'delete_card', 'move_card', 'upload_file', 'create_board', 'delete_board', 'update_card', 'add_comment', 'delete_comment', 'assign_user', 'unassign_user', 'set_due_date', 'archive_card', 'add_subtask', 'toggle_subtask', 'remove_subtask', 'add_label', 'remove_label'],
    required: true
  },
  description: String,
  targetId: String,
  targetType: {
    type: String,
    enum: ['card', 'list', 'board'],
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

activitySchema.index({ boardId: 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
