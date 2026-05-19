import express from 'express';
import Activity from '../models/Activity.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/:boardId', verifyToken, async (req, res) => {
  try {
    const activities = await Activity.find({ boardId: req.params.boardId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
