import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma'; // Use the correctly initialized prisma client
import { setSocketServer } from '@/lib/socket';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

const queue: string[] = []; // Store socket IDs of waiting users
const matches: Record<string, string> = {}; // Store matched pairs
const quizAnswers: Record<string, { [socketId: string]: number[] }> = {}; // quizId -> { socketId: answers[] }
const quizQuestions: Record<string, any[]> = {}; // quizId -> questions[]
const userSockets: Record<string, string> = {}; // { userId: socketId }

export function initSocketServer(res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      },
      allowEIO3: true,
      transports: ['polling', 'websocket']
    });

    // Store the socket server instance globally for API access
    setSocketServer(io);

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('register_user', (userId) => {
        if (userId) {
          userSockets[userId] = socket.id;
          console.log(`User ${userId} registered with socket ${socket.id}`);
        }
      });

      socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat ${chatId}`);
      });

      socket.on('private_message', (data) => {
        const { message } = data;
        const receiverId = message.receiver.id;
        const receiverSocketId = userSockets[receiverId];

        if (receiverSocketId) {
          // Send the message directly to the specific socket of the receiver
          io.to(receiverSocketId).emit('new_message', message);
        } else {
          // This can be used later to implement push notifications for offline users
          console.log(`User ${receiverId} is not connected, message will be delivered on next login.`);
        }
      });

      socket.on('start_typing', ({ chatId }) => {
        socket.to(chatId).emit('user_typing');
      });

      socket.on('stop_typing', ({ chatId }) => {
        socket.to(chatId).emit('user_stopped_typing');
      });

      // This event's only job is to notify the other user in real-time
      socket.on('notify_messages_read', ({ readerId, otherUserId }) => {
        const otherUserSocketId = userSockets[otherUserId];
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('messages_were_read', { readerId });
        }
      });

      // Post notification events
      socket.on('post_liked', ({ postId, postAuthorId, likerId, likerName }) => {
        // Notify the post author about the like
        const authorSocketId = userSockets[postAuthorId];
        if (authorSocketId && authorSocketId !== socket.id) {
          io.to(authorSocketId).emit('post_liked_notification', {
            postId,
            likerId,
            likerName,
            type: 'like'
          });
        }
      });

      socket.on('post_commented', ({ postId, postAuthorId, commenterId, commenterName, commentContent }) => {
        // Notify the post author about the comment
        const authorSocketId = userSockets[postAuthorId];
        if (authorSocketId && authorSocketId !== socket.id) {
          io.to(authorSocketId).emit('post_commented_notification', {
            postId,
            commenterId,
            commenterName,
            commentContent,
            type: 'comment'
          });
        }
      });

      socket.on('join_matchmaking', ({ quizId }) => {
        console.log('Join matchmaking request:', { quizId, socketId: socket.id });
        socket.data.quizId = quizId;
        
        if (queue.length > 0) {
          const opponentId = queue.shift()!;
          matches[socket.id] = opponentId;
          matches[opponentId] = socket.id;
          
          io.to(socket.id).emit('matched', { opponentId });
          io.to(opponentId).emit('matched', { opponentId: socket.id });
        } else {
          queue.push(socket.id);
          io.to(socket.id).emit('waiting');
        }
      });

      socket.on('answer', ({ quizId, questionIdx }) => {
        const opponentId = matches[socket.id];
        if (opponentId) {
          io.to(opponentId).emit('opponent_answer', { questionIdx });
        }
      });

      socket.on('quiz_complete', async ({ quizId, answers }) => {
        if (!quizAnswers[quizId]) quizAnswers[quizId] = {};
        quizAnswers[quizId][socket.id] = answers;

        if (!quizQuestions[quizId]) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/admin/battle-quiz/${quizId}/questions`);
            if (response.ok) {
              quizQuestions[quizId] = await response.json();
            }
          } catch (error) {
            console.error('Error fetching quiz questions:', error);
          }
        }

        const opponentId = matches[socket.id];
        if (opponentId && quizAnswers[quizId][opponentId]) {
          const qList = quizQuestions[quizId] || [];
          const correctAnswers = qList.map((q: any) => q.correctAnswer);
          const yourAnswers = quizAnswers[quizId][socket.id];
          const oppAnswers = quizAnswers[quizId][opponentId];

          const yourScore = yourAnswers.reduce((acc, ans, idx) => acc + (ans === correctAnswers[idx] ? 1 : 0), 0);
          const opponentScore = oppAnswers.reduce((acc, ans, idx) => acc + (ans === correctAnswers[idx] ? 1 : 0), 0);

          let winner: 'you' | 'opponent' | 'draw' = 'draw';
          if (yourScore > opponentScore) winner = 'you';
          else if (yourScore < opponentScore) winner = 'opponent';

          io.to(socket.id).emit('quiz_result', { yourScore, opponentScore, winner, correctAnswers });
          io.to(opponentId).emit('quiz_result', {
            yourScore: opponentScore,
            opponentScore: yourScore,
            winner: winner === 'you' ? 'opponent' : winner === 'opponent' ? 'you' : 'draw',
            correctAnswers
          });

          delete quizAnswers[quizId][socket.id];
          delete quizAnswers[quizId][opponentId];
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Find the user and remove them from the mapping
        const userId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
        if (userId) {
          delete userSockets[userId];
          console.log(`User ${userId} unregistered.`);
        }
        
        const idx = queue.indexOf(socket.id);
        if (idx !== -1) queue.splice(idx, 1);
        
        if (matches[socket.id]) {
          const opponentId = matches[socket.id];
          delete matches[opponentId];
          delete matches[socket.id];
          io.to(opponentId).emit('opponent_disconnected');
        }
      });
    });

    res.socket.server.io = io;
  }
  return res.socket.server.io;
} 