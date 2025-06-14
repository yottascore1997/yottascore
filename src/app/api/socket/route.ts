import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';

// Initialize global variables if they don't exist
if (!global.queue) global.queue = [];
if (!global.matches) global.matches = {};
if (!global.quizAnswers) global.quizAnswers = {};
if (!global.quizQuestions) global.quizQuestions = {};

const ioHandler = (req: Request) => {
  if (!global.io) {
    console.log('Initializing Socket.IO server...');
    global.io = new SocketIOServer({
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      maxHttpBufferSize: 1e8
    });

    global.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join_queue', async (quizId: string) => {
        console.log(`Socket ${socket.id} joining queue for quiz ${quizId}`);
        if (!global.quizQuestions[quizId]) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/quizzes/${quizId}/questions`);
            const questions = await response.json();
            global.quizQuestions[quizId] = questions;
          } catch (error) {
            console.error('Error fetching questions:', error);
            socket.emit('error', 'Failed to fetch quiz questions');
            return;
          }
        }

        if (global.queue.includes(socket.id)) {
          socket.emit('error', 'Already in queue');
          return;
        }

        global.queue.push(socket.id);
        socket.join(quizId);

        if (global.queue.length >= 2) {
          const player1 = global.queue.shift()!;
          const player2 = global.queue.shift()!;
          global.matches[player1] = player2;
          global.matches[player2] = player1;
          global.quizAnswers[quizId] = {};

          global.io?.to(player1).emit('match_found', { opponent: player2 });
          global.io?.to(player2).emit('match_found', { opponent: player1 });
          global.io?.to(quizId).emit('quiz_start', {
            questions: global.quizQuestions[quizId]
          });
        } else {
          socket.emit('waiting_for_opponent');
        }
      });

      socket.on('submit_answer', (data: { quizId: string; answer: number }) => {
        const { quizId, answer } = data;
        if (!global.quizAnswers[quizId]) {
          global.quizAnswers[quizId] = {};
        }
        if (!global.quizAnswers[quizId][socket.id]) {
          global.quizAnswers[quizId][socket.id] = [];
        }
        global.quizAnswers[quizId][socket.id].push(answer);

        const opponent = global.matches[socket.id];
        if (opponent) {
          global.io?.to(opponent).emit('opponent_answered', {
            questionIndex: global.quizAnswers[quizId][socket.id].length - 1
          });
        }
      });

      socket.on('quiz_complete', (quizId: string) => {
        const opponent = global.matches[socket.id];
        if (opponent) {
          global.io?.to(opponent).emit('opponent_completed');
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        const index = global.queue.indexOf(socket.id);
        if (index > -1) {
          global.queue.splice(index, 1);
        }

        const opponent = global.matches[socket.id];
        if (opponent) {
          global.io?.to(opponent).emit('opponent_disconnected');
          delete global.matches[socket.id];
          delete global.matches[opponent];
        }
      });
    });
  }

  return new NextResponse('Socket.IO server is running', {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
};

export const GET = ioHandler;
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}; 