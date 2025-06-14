import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

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

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

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