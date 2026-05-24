import express from 'express';
import Card from '../models/Card.js';
import List from '../models/List.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireBoardMember, requireEditAccess } from '../middlewares/boardAccess.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

const createActivity = async (boardId, userId, userName, action, description, targetId, targetType, extra = {}) => {
  try {
    const activity = await Activity.create({
      boardId,
      user: { userId, name: userName },
      action,
      description,
      targetId,
      targetType,
      ...extra
    });
    return activity;
  } catch (err) {
    console.error('Error creating activity:', err);
  }
};

const getBoardId = async (cardId) => {
  const card = await Card.findById(cardId);
  if (!card) return null;
  const list = await List.findById(card.listId);
  return list?.boardId;
};

const emitEvent = (req, boardId, event, data) => {
  const io = req.app.get('io');
  if (io && boardId) io.to(`board:${boardId}`).emit(event, data);
};

const emitToUser = (req, userId, event, data) => {
  const io = req.app.get('io');
  if (io && userId) io.to(`user:${userId}`).emit(event, data);
};

// Create Card
router.post('/', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const { title, listId } = req.body;
    if (!title || !listId) {
      return res.status(400).json({ error: 'Title and listId required' });
    }

    const lastCard = await Card.findOne({ listId }).sort({ order: -1 });
    const newOrder = lastCard ? lastCard.order + 1 : 1;

    const card = await Card.create({ title, listId, order: newOrder, createdBy: req.user.id });

    const list = await List.findById(listId);
    const boardId = list?.boardId;

    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'create_card', `Added card "${title}"`, card._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-created', card);
    }

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Cards by List
router.get('/:listId', verifyToken, async (req, res) => {
  const cards = await Card.find({ listId: req.params.listId, archived: false }).sort({ order: 1 });
  res.json(cards);
});

// Update Card (title, description, dueDate, listId, order)
router.put('/:id', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const oldCard = await Card.findById(req.params.id);
    if (!oldCard) return res.status(404).json({ error: 'Card not found' });

    const updated = await Card.findByIdAndUpdate(req.params.id, req.body, { new: true });

    const list = await List.findById(updated.listId || oldCard.listId);
    const boardId = list?.boardId;

    if (boardId) {
      if (req.body.listId && oldCard.listId.toString() !== req.body.listId) {
        const activity = await createActivity(boardId, req.user.id, req.user.name, 'move_card', `Moved card "${updated.title}"`, updated._id, 'card');
        emitEvent(req, boardId, 'activity', activity);
        emitEvent(req, boardId, 'card-moved', updated);
      } else if (req.body.title && oldCard.title !== req.body.title) {
        const activity = await createActivity(boardId, req.user.id, req.user.name, 'update_card', `Renamed card to "${updated.title}"`, updated._id, 'card');
        emitEvent(req, boardId, 'activity', activity);
      } else if (req.body.dueDate !== undefined && oldCard.dueDate?.toString() !== new Date(req.body.dueDate).toString()) {
        const activity = await createActivity(boardId, req.user.id, req.user.name, 'set_due_date', `Set due date for "${updated.title}"`, updated._id, 'card');
        emitEvent(req, boardId, 'activity', activity);
        if (req.body.dueDate) {
          const usersToNotify = new Set();
          if (oldCard.createdBy && oldCard.createdBy !== req.user.id) usersToNotify.add(oldCard.createdBy);
          oldCard.assignees.forEach(a => { if (a.userId !== req.user.id) usersToNotify.add(a.userId); });
          const formattedDate = new Date(req.body.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          for (const userId of usersToNotify) {
            const notification = await Notification.create({
              userId,
              boardId,
              cardId: updated._id,
              cardTitle: updated.title,
              type: 'due_date_set',
              message: `"${updated.title}" is due on ${formattedDate}`,
              createdBy: req.user.id
            });
            emitToUser(req, userId, 'notification', notification);
          }
        }
      } else if (req.body.description !== undefined && oldCard.description !== req.body.description) {
        const activity = await createActivity(boardId, req.user.id, req.user.name, 'update_card', `Updated description for "${updated.title}"`, updated._id, 'card');
        emitEvent(req, boardId, 'activity', activity);
      }
      emitEvent(req, boardId, 'card-updated', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Labels
router.put('/:id/labels', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.id, { labels: req.body.labels }, { new: true });
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'add_label', `Updated labels on "${card.title}"`, card._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-updated', card);
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Subtask
router.post('/:id/subtasks', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    card.subtasks.push({ title: req.body.title, completed: false });
    await card.save();
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'add_subtask', `Added subtask "${req.body.title}" to "${card.title}"`, card._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-updated', card);
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Subtask
router.patch('/:id/subtasks/:subtaskId/toggle', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const subtask = card.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });
    subtask.completed = !subtask.completed;
    await card.save();
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'toggle_subtask', `${subtask.completed ? 'Completed' : 'Uncompleted'} subtask "${subtask.title}" on "${card.title}"`, card._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-updated', card);
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove Subtask
router.delete('/:id/subtasks/:subtaskId', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const subtask = card.subtasks.id(req.params.subtaskId);
    card.subtasks.pull(req.params.subtaskId);
    await card.save();
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'remove_subtask', `Removed subtask "${subtask?.title}" from "${card.title}"`, card._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-updated', card);
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Comment
router.post('/:id/comments', verifyToken, requireBoardMember, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    card.comments.push({
      userId: req.user.id,
      name: req.body.name || req.user.name || 'Unknown',
      text: req.body.text
    });
    await card.save();
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'add_comment', `Commented on "${card.title}"`, card._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-updated', card);
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Comment
router.delete('/:id/comments/:commentId', verifyToken, requireBoardMember, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    card.comments.pull(req.params.commentId);
    await card.save();
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      emitEvent(req, boardId, 'card-updated', card);
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Assignees
router.put('/:id/assignees', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.id, { assignees: req.body.assignees }, { new: true });
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'assign_user', `Updated assignees on "${card.title}"`, card._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-updated', card);
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archive / Unarchive Card
router.patch('/:id/archive', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const { archived } = req.body;
    const card = await Card.findByIdAndUpdate(req.params.id, { archived }, { new: true });
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const action = archived ? 'archive_card' : 'update_card';
      const desc = archived ? `Archived card "${card.title}"` : `Unarchived card "${card.title}"`;
      const activity = await createActivity(boardId, req.user.id, req.user.name, action, desc, card._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, archived ? 'card-archived' : 'card-unarchived', card);
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Attachment
router.delete('/:id/attachments/:attachmentIdx', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const idx = parseInt(req.params.attachmentIdx);
    if (idx < 0 || idx >= card.attachments.length) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    const removed = card.attachments.splice(idx, 1);
    await card.save();
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'delete_attachment', `Removed attachment "${removed[0]?.fileName}" from "${card.title}"`, card._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-updated', card);
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload files
router.post('/:id/upload', verifyToken, requireEditAccess, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File not received' });
    }

    const updatedCard = await Card.findByIdAndUpdate(
      req.params.id,
      { $push: { attachments: { fileName: req.file.originalname, fileUrl: `/uploads/${req.file.filename}`, fileSize: req.file.size } } },
      { new: true }
    );

    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'upload_file', `Uploaded "${req.file.originalname}" to card "${updatedCard?.title}"`, updatedCard._id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-updated', updatedCard);
    }

    res.json(updatedCard);
  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Card
router.delete('/:id', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    await Card.findByIdAndDelete(req.params.id);
    const boardId = await getBoardId(req.params.id);
    if (boardId) {
      const activity = await createActivity(boardId, req.user.id, req.user.name, 'delete_card', `Deleted card "${card?.title}"`, req.params.id, 'card');
      emitEvent(req, boardId, 'activity', activity);
      emitEvent(req, boardId, 'card-deleted', req.params.id);
    }
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
