const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Global state for matchmaking and quiz logic
const queue = [];
const matches = {};
const quizAnswers = {};
const quizQuestions = {};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e8,
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_queue', async (quizId) => {
      console.log(`Socket ${socket.id} joining queue for quiz ${quizId}`);
      if (!quizQuestions[quizId]) {
        try {
          // You may need to update this URL to match your actual API endpoint for questions
          const response = await fetch(`http://localhost:3001/api/quizzes/${quizId}/questions`);
          const questions = await response.json();
          quizQuestions[quizId] = questions;
        } catch (error) {
          console.error('Error fetching questions:', error);
          socket.emit('error', 'Failed to fetch quiz questions');
          return;
        }
      }

      if (queue.includes(socket.id)) {
        socket.emit('error', 'Already in queue');
        return;
      }

      queue.push(socket.id);
      socket.join(quizId);

      if (queue.length >= 2) {
        const player1 = queue.shift();
        const player2 = queue.shift();
        matches[player1] = player2;
        matches[player2] = player1;
        quizAnswers[quizId] = {};

        io.to(player1).emit('match_found', { opponent: player2 });
        io.to(player2).emit('match_found', { opponent: player1 });
        io.to(quizId).emit('quiz_start', {
          questions: quizQuestions[quizId],
        });
      } else {
        socket.emit('waiting_for_opponent');
      }
    });

    socket.on('submit_answer', (data) => {
      const { quizId, answer } = data;
      if (!quizAnswers[quizId]) {
        quizAnswers[quizId] = {};
      }
      if (!quizAnswers[quizId][socket.id]) {
        quizAnswers[quizId][socket.id] = [];
      }
      quizAnswers[quizId][socket.id].push(answer);

      const opponent = matches[socket.id];
      if (opponent) {
        io.to(opponent).emit('opponent_answered', {
          questionIndex: quizAnswers[quizId][socket.id].length - 1,
        });
      }
    });

    socket.on('quiz_complete', (quizId) => {
      const opponent = matches[socket.id];
      if (opponent) {
        io.to(opponent).emit('opponent_completed');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const index = queue.indexOf(socket.id);
      if (index > -1) {
        queue.splice(index, 1);
      }

      const opponent = matches[socket.id];
      if (opponent) {
        io.to(opponent).emit('opponent_disconnected');
        delete matches[socket.id];
        delete matches[opponent];
      }
    });
  });

  server.listen(3001, () => {
    console.log('> Ready on http://localhost:3001');
  });
}); 