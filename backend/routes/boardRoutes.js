import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { requireEditAccess, requireDeleteAccess } from '../middlewares/boardAccess.js';
import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import DeleteRequest from '../models/DeleteRequest.js';

const DEFAULT_LISTS = ['1.ToDo', '2.Progress', '3.Done'];

const router = express.Router();

// Create board
router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: "Board name required" });
    }

    const user = await User.findById(req.user.id);

    const board = await Board.create({
      name: req.body.name,
      color: req.body.color || 'blue',
      createdBy: req.user.id,
      members: [{
        userId: req.user.id,
        email: user?.email || '',
        name: user?.name || '',
        role: 'admin',
        permissions: { canEdit: true, canDelete: true }
      }]
    });

    const createdLists = await List.insertMany(
      DEFAULT_LISTS.map((title, i) => ({
        title,
        boardId: board._id,
        createdBy: req.user.id,
        order: i + 1
      }))
    );

    const boardObj = board.toObject();
    boardObj.lists = createdLists;

    const activity = await Activity.create({
      boardId: board._id,
      user: { userId: req.user.id, name: user?.name },
      action: 'create_board',
      description: `Created board "${board.name}"`,
      targetId: board._id,
      targetType: 'board'
    });

    const io = req.app.get('io');
    if (io) io.to(`board:${board._id}`).emit('activity', activity);

    res.json(boardObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all boards
router.get('/', verifyToken, async (req, res) => {
  try {
    const boards = await Board.find({
      createdBy: req.user.id
    });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shared boards (boards where user is a member but not creator)
router.get('/shared', verifyToken, async (req, res) => {
  try {
    const boards = await Board.find({
      'members.userId': req.user.id,
      createdBy: { $ne: req.user.id }
    });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single board
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full board data (board + lists + cards)
router.get('/:boardId/full', verifyToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: "Board not found" });

    const lists = await List.find({ boardId: req.params.boardId }).sort({ order: 1 });

    const listData = await Promise.all(
      lists.map(async (list) => {
        const cards = await Card.find({ listId: list._id }).sort({ order: 1 });
        return { ...list.toObject(), cards };
      })
    );

    res.json({ ...board.toObject(), lists: listData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update board
router.put('/:id', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const updated = await Board.findByIdAndUpdate(req.params.id, {
      ...req.body,
      editedBy: { userId: req.user.id, name: req.user.name },
      editedAt: new Date()
    }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete board
router.delete('/:id', verifyToken, requireDeleteAccess, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });

    if (req.deleteRequested) {
      const request = await DeleteRequest.create({
        boardId: req.params.id,
        targetType: 'board',
        targetId: req.params.id,
        targetName: board.name,
        requestedBy: { userId: req.user.id, name: req.user.name }
      });
      const io = req.app.get('io');
      if (io) {
        io.to(`board:${req.params.id}`).emit('delete-request-created', request);
      }
      return res.json({ message: 'Delete request sent to admins', request });
    }

    const lists = await List.find({ boardId: req.params.id });
    const listIds = lists.map(l => l._id);
    await Card.deleteMany({ listId: { $in: listIds } });
    await List.deleteMany({ boardId: req.params.id });
    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: "Board deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member
router.post('/:id/members', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });

    const exists = board.members.some(m => m.userId === user._id.toString());
    if (exists) return res.status(400).json({ error: "User already a member" });

    board.members.push({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: 'member',
      permissions: { canEdit: true, canDelete: false }
    });

    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member
router.delete('/:id/members/:userId', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });

    board.members = board.members.filter(m => m.userId !== req.params.userId);
    await board.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`board:${req.params.id}`).emit('member-removed', { userId: req.params.userId });
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update member role
router.patch('/:id/members/:userId/role', verifyToken, requireEditAccess, async (req, res) => {
  try {
    const { role } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });

    const member = board.members.find(m => m.userId === req.params.userId);
    if (!member) return res.status(404).json({ error: "Member not found" });

    member.role = role;
    await board.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`board:${req.params.id}`).emit('member-updated', { userId: req.params.userId, role });
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update member permissions
router.patch('/:id/members/:userId/permissions', verifyToken, async (req, res) => {
  try {
    const { canEdit, canDelete } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });

    const requester = board.members.find(m => m.userId === req.user.id);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can change permissions" });
    }

    const member = board.members.find(m => m.userId === req.params.userId);
    if (!member) return res.status(404).json({ error: "Member not found" });

    if (member.role === 'admin') {
      return res.status(403).json({ error: "Cannot change admin permissions" });
    }

    if (canEdit !== undefined) member.permissions.canEdit = canEdit;
    if (canDelete !== undefined) member.permissions.canDelete = canDelete;

    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get board members
router.get('/:id/members', verifyToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });
    res.json(board.members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave board
router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });

    const member = board.members.find(m => m.userId === req.user.id);
    if (!member) return res.status(404).json({ error: "Not a member" });

    board.members = board.members.filter(m => m.userId !== req.user.id);
    await board.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`board:${req.params.id}`).emit('member-left', {
        userId: req.user.id,
        name: member.name
      });
    }

    res.json({ message: "Left board successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get online members
router.get('/:id/online', verifyToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });
    res.json(board.onlineMembers || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
