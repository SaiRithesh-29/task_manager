import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';

const getBoardId = async (req) => {
  if (req.params.boardId) return req.params.boardId;
  if (req.params.id && req.body.boardId) return req.body.boardId;

  if (req.params.id) {
    const list = await List.findById(req.params.id);
    if (list) return list.boardId;
    const card = await Card.findById(req.params.id);
    if (card) {
      const cardList = await List.findById(card.listId);
      return cardList?.boardId;
    }
  }
  return null;
};

export const requireBoardMember = async (req, res, next) => {
  try {
    const boardId = await getBoardId(req);
    if (!boardId) return next();

    const board = await Board.findById(boardId);
    if (!board) return next();

    const member = board.members.find(m => m.userId === req.user.id);
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this board' });
    }

    req.board = board;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const requireEditAccess = async (req, res, next) => {
  try {
    const boardId = await getBoardId(req);
    if (!boardId) return next();

    const board = await Board.findById(boardId);
    if (!board) return next();

    const member = board.members.find(m => m.userId === req.user.id);
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this board' });
    }

    if (member.role === 'observer') {
      return res.status(403).json({ error: 'You have read-only access to this board' });
    }

    if (!member.permissions?.canEdit) {
      return res.status(403).json({ error: 'Edit access not granted' });
    }

    req.board = board;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const requireDeleteAccess = async (req, res, next) => {
  try {
    const boardId = await getBoardId(req);
    if (!boardId) return next();

    const board = await Board.findById(boardId);
    if (!board) return next();

    const member = board.members.find(m => m.userId === req.user.id);
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this board' });
    }

    if (member.role === 'admin' || member.permissions?.canDelete) {
      req.board = board;
      return next();
    }

    req.board = board;
    req.deleteRequested = true;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
