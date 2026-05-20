import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Board from './models/Board.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import boardRoutes from './routes/boardRoutes.js';
import cardRoutes from './routes/cardRoutes.js';
import listRoutes from './routes/listRoutes.js';
import authRoutes from './routes/authRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

const app = express();
const server = createServer(app);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://task-manager-puce-xi.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes('*') || 
                      allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      origin.startsWith('http://localhost:');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/uploads', express.static(join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);

mongoose.connect(process.env.DB_URL)
.then(() => console.log("DB Connected Successfully"))
.catch(err => console.log(err));

app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/activity', activityRoutes);
app.use('/uploads', express.static('uploads'));

const onlineUsers = new Map();
const userBoards = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-board', async ({ boardId, userId, userName }) => {
    socket.join(`board:${boardId}`);
    onlineUsers.set(socket.id, { userId, userName, boardId });
    if (!userBoards.has(userId)) userBoards.set(userId, new Set());
    userBoards.get(userId).add(boardId);

    try {
      const User = (await import('./models/User.js')).default;
      const user = await User.findById(userId);
      const profilePhoto = user?.profilePhoto || null;

      const board = await Board.findById(boardId);
      if (board) {
        const existingOnline = board.onlineMembers?.find(m => m.userId === userId) || null;
        if (!existingOnline) {
          board.onlineMembers = board.onlineMembers || [];
          board.onlineMembers.push({ userId, userName, profilePhoto, socketId: socket.id, lastActive: new Date() });
          await board.save();
        } else {
          existingOnline.socketId = socket.id;
          existingOnline.lastActive = new Date();
          existingOnline.userName = userName;
          existingOnline.profilePhoto = profilePhoto;
          await board.save();
        }

        io.to(`board:${boardId}`).emit('user-online', {
          userId,
          userName,
          profilePhoto,
          onlineMembers: board.onlineMembers
        });
      }
    } catch (err) {
      console.error('Error updating online status:', err);
    }

    console.log(`User ${userName || userId} joined board:${boardId}`);
  });

  socket.on('leave-board', async ({ boardId, userId }) => {
    socket.leave(`board:${boardId}`);

    try {
      const board = await Board.findById(boardId);
      if (board && board.onlineMembers) {
        board.onlineMembers = board.onlineMembers.filter(m => m.userId !== userId);
        await board.save();

        io.to(`board:${boardId}`).emit('user-offline', {
          userId,
          onlineMembers: board.onlineMembers
        });
      }
    } catch (err) {
      console.error('Error updating offline status:', err);
    }

    const userData = onlineUsers.get(socket.id);
    if (userData) {
      const boards = userBoards.get(userData.userId);
      if (boards) {
        boards.delete(boardId);
        if (boards.size === 0) userBoards.delete(userData.userId);
      }
    }
    onlineUsers.delete(socket.id);
  });

  socket.on('cursor-move', ({ boardId, userId, userName, position }) => {
    socket.to(`board:${boardId}`).emit('cursor-update', {
      userId,
      userName,
      position,
      timestamp: Date.now()
    });
  });

  socket.on('card-editing', ({ boardId, cardId, userId, userName }) => {
    socket.to(`board:${boardId}`).emit('card-being-edited', {
      cardId,
      userId,
      userName
    });
  });

  socket.on('card-edit-cancel', ({ boardId, cardId }) => {
    socket.to(`board:${boardId}`).emit('card-edit-cancelled', { cardId });
  });

  socket.on('typing-start', ({ boardId, userId, userName, target }) => {
    socket.to(`board:${boardId}`).emit('user-typing', {
      userId,
      userName,
      target,
      type: 'start'
    });
  });

  socket.on('typing-stop', ({ boardId, userId, target }) => {
    socket.to(`board:${boardId}`).emit('user-typing', {
      userId,
      target,
      type: 'stop'
    });
  });

  socket.on('disconnect', async () => {
    const userData = onlineUsers.get(socket.id);
    if (userData) {
      const { userId, boardId } = userData;

      try {
        const board = await Board.findById(boardId);
        if (board && board.onlineMembers) {
          board.onlineMembers = board.onlineMembers.filter(m => m.socketId !== socket.id);
          await board.save();

          const stillOnline = board.onlineMembers.filter(m => m.userId === userId);
          if (stillOnline.length === 0) {
            io.to(`board:${boardId}`).emit('user-offline', {
              userId,
              onlineMembers: board.onlineMembers
            });
          }
        }
      } catch (err) {
        console.error('Error on disconnect:', err);
      }

      const boards = userBoards.get(userId);
      if (boards) {
        boards.forEach(async (bId) => {
          try {
            const board = await Board.findById(bId);
            if (board && board.onlineMembers) {
              board.onlineMembers = board.onlineMembers.filter(m => m.userId !== userId);
              await board.save();
            }
          } catch (e) {}
        });
        userBoards.delete(userId);
      }

      onlineUsers.delete(socket.id);
    }
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});