import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import DeleteRequest from '../models/DeleteRequest.js';
import Board from '../models/Board.js';
import Activity from '../models/Activity.js';

const router = express.Router();

router.get('/:boardId', verifyToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const member = board.members.find(m => m.userId === req.user.id);
    if (!member || (member.role !== 'admin' && board.createdBy !== req.user.id)) {
      return res.status(403).json({ error: 'Only admins can view delete requests' });
    }

    const requests = await DeleteRequest.find({ boardId: req.params.boardId, status: 'pending' }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { boardId, targetType, targetId, targetName } = req.body;
    const request = await DeleteRequest.create({
      boardId, targetType, targetId, targetName,
      requestedBy: { userId: req.user.id, name: req.user.name }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`board:${boardId}`).emit('delete-request-created', request);
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/approve', verifyToken, async (req, res) => {
  try {
    const request = await DeleteRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const board = await Board.findById(request.boardId);
    const member = board.members.find(m => m.userId === req.user.id);
    if (!member || (member.role !== 'admin' && board.createdBy !== req.user.id)) {
      return res.status(403).json({ error: 'Only admins can approve delete requests' });
    }

    request.status = 'approved';
    await request.save();

    const activity = await Activity.create({
      boardId: request.boardId,
      user: { userId: req.user.id, name: req.user.name },
      action: 'delete_board',
      description: `Approved deletion of ${request.targetType} "${request.targetName}"`,
      targetId: request.targetId,
      targetType: request.targetType
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`board:${request.boardId}`).emit('activity', activity);
      io.to(`board:${request.boardId}`).emit('delete-request-updated', request);
    }

    res.json({ message: 'Delete request approved', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/deny', verifyToken, async (req, res) => {
  try {
    const request = await DeleteRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const board = await Board.findById(request.boardId);
    const member = board.members.find(m => m.userId === req.user.id);
    if (!member || (member.role !== 'admin' && board.createdBy !== req.user.id)) {
      return res.status(403).json({ error: 'Only admins can deny delete requests' });
    }

    request.status = 'denied';
    await request.save();

    const activity = await Activity.create({
      boardId: request.boardId,
      user: { userId: req.user.id, name: req.user.name },
      action: 'delete_board',
      description: `Denied deletion of ${request.targetType} "${request.targetName}"`,
      targetId: request.targetId,
      targetType: request.targetType
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`board:${request.boardId}`).emit('activity', activity);
      io.to(`board:${request.boardId}`).emit('delete-request-updated', request);
    }

    res.json({ message: 'Delete request denied', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
