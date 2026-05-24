import express from 'express';
import List from '../models/List.js';
import Activity from '../models/Activity.js';
import {verifyToken} from '../middlewares/auth.js';
import { requireEditAccess } from '../middlewares/boardAccess.js';

const router = express.Router();

// Create List
router.post('/', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const list = await List.create({ ...req.body, createdBy: req.user.id });

    const activity = await Activity.create({
      boardId: list.boardId,
      user: { userId: req.user.id },
      action: 'create_list',
      description: `Added list "${list.title}"`,
      targetId: list._id,
      targetType: 'list'
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`board:${list.boardId}`).emit('activity', activity);
      io.to(`board:${list.boardId}`).emit('list-created', list);
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Lists by Board
router.get('/:boardId', verifyToken, async (req, res) => {
  const lists = await List.find({ boardId: req.params.boardId }).sort({ order: 1 });
  res.json(lists);
});

// Update List
router.put('/:id', verifyToken, requireEditAccess, async (req, res) => {
  const updated = await List.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete List
router.delete('/:id', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    await List.findByIdAndDelete(req.params.id);

    const activity = await Activity.create({
      boardId: list.boardId,
      user: { userId: req.user.id },
      action: 'delete_list',
      description: `Deleted list "${list?.title}"`,
      targetId: req.params.id,
      targetType: 'list'
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`board:${list.boardId}`).emit('activity', activity);
      io.to(`board:${list.boardId}`).emit('list-deleted', req.params.id);
    }

    res.json({ message: "List deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
