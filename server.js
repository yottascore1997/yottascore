const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const prisma = new PrismaClient();

// Global state for battle quiz
const waitingUsers = {}; // quizId -> [socket, userInfo, ...]
const activeMatches = {}; // roomId -> { sockets, state }
const socketToUser = new Map(); // socket.id -> userInfo

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket.IO server is running');
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

io.use((socket, next) => {
next();
});

io.on('connection', (socket) => {
// Get auth token from handshake
  const authToken = socket.handshake.auth?.token;
// Log query params and headers for debugging
// Authenticate user immediately if token is provided
  let authenticatedUser = null;
  
  if (authToken) {
    try {
      // Verify the token and get user info
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'your-secret-key');
// Get user details from database
      prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          wallet: true,
          image: true
        }
      }).then(user => {
        if (user) {
          authenticatedUser = user;
          socketToUser.set(socket.id, user);
          socket.connectedAt = Date.now();
          
// Emit authenticated event to client
          socket.emit('authenticated', { user });
        } else {
socket.emit('auth_error', 'User not found');
        }
      }).catch(error => {
socket.emit('auth_error', 'Authentication failed');
      });
      
    } catch (error) {
socket.emit('auth_error', 'Invalid token');
    }
  }
  
// Track connection time
  socket.connectedAt = Date.now();

  // Fallback authentication if token wasn't provided during connection
  socket.on('authenticate', async ({ token }) => {
if (authenticatedUser) {
socket.emit('authenticated', { user: authenticatedUser });
      return;
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          wallet: true,
          image: true
        }
      });
      
      if (user) {
        authenticatedUser = user;
        socketToUser.set(socket.id, user);
        
socket.emit('authenticated', { user });
      } else {
socket.emit('auth_error', 'User not found');
      }
    } catch (error) {
socket.emit('auth_error', 'Invalid token');
    }
  });

  socket.on('join_battle', async ({ quizId }) => {
const user = socketToUser.get(socket.id);
    if (!user) {
socket.emit('error', 'Please authenticate first');
      return;
    }

// Check if user has enough balance
    const quiz = await prisma.battleQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: {
            id: true
          }
        }
      }
    });

    if (!quiz) {
socket.emit('error', 'Quiz not found');
      return;
    }

if (quiz.questions.length === 0) {
socket.emit('error', 'This quiz has no questions. Please contact admin.');
      return;
    }

    // Only check wallet balance for paid quizzes (entryAmount > 0)
    if (quiz.entryAmount > 0 && user.wallet < quiz.entryAmount) {
socket.emit('error', `Insufficient balance. Required: ₹${quiz.entryAmount}, Available: ₹${user.wallet}`);
      return;
    }

    if (!waitingUsers[quizId]) {
      waitingUsers[quizId] = [];
}
    
    // Check if user is already in queue (by user ID, not socket ID)
    const existingUserIndex = waitingUsers[quizId].findIndex(w => w.user.id === user.id);
    if (existingUserIndex !== -1) {
waitingUsers[quizId].splice(existingUserIndex, 1);
    }
    
    // Check if user is already in an active match
    const isInActiveMatch = Object.values(activeMatches).some(match => 
      match.users.some(u => u.id === user.id)
    );
    
    if (isInActiveMatch) {
socket.emit('error', 'You are already in an active battle');
      return;
    }
    
    waitingUsers[quizId].push({ socket, user });

    // If two users are waiting, start a match
    if (waitingUsers[quizId].length >= 2) {
const [player1Data, player2Data] = waitingUsers[quizId].splice(0, 2);
      const roomId = `battle_${quizId}_${Date.now()}`;
      
// Check if same user
      if (player1Data.user.id === player2Data.user.id) {
// Put one player back in queue and continue
        waitingUsers[quizId].unshift(player2Data);
socket.emit('waiting');
        return;
      }
      
      player1Data.socket.join(roomId);
      player2Data.socket.join(roomId);

// Deduct entry fees from both players (only for paid quizzes)
      if (quiz.entryAmount > 0) {
        try {
          await prisma.user.update({
            where: { id: player1Data.user.id },
            data: { wallet: { decrement: quiz.entryAmount } }
          });
          await prisma.user.update({
            where: { id: player2Data.user.id },
            data: { wallet: { decrement: quiz.entryAmount } }
          });

          await prisma.transaction.createMany({
            data: [
              {
                userId: player1Data.user.id,
                amount: -quiz.entryAmount,
                type: 'BATTLE_QUIZ_ENTRY',
                status: 'COMPLETED'
              },
              {
                userId: player2Data.user.id,
                amount: -quiz.entryAmount,
                type: 'BATTLE_QUIZ_ENTRY',
                status: 'COMPLETED'
              }
            ]
          });
        } catch (error) {
          try {
            await prisma.user.update({
              where: { id: player1Data.user.id },
              data: { wallet: { increment: quiz.entryAmount } }
            });
            await prisma.user.update({
              where: { id: player2Data.user.id },
              data: { wallet: { increment: quiz.entryAmount } }
            });
          } catch {}
          socket.emit('error', 'Failed to process entry fee');
          return;
        }
      }

      // Fetch questions from DB
      const questions = await prisma.battleQuizQuestion.findMany({
        where: { quizId },
        orderBy: { createdAt: 'asc' }
      });

if (questions.length === 0) {
// Notify players about the issue
        player1Data.socket.emit('error', 'Quiz has no questions. Please contact admin.');
        player2Data.socket.emit('error', 'Quiz has no questions. Please contact admin.');
        return;
      }

      // Initialize match state
      activeMatches[roomId] = {
        sockets: [player1Data.socket, player2Data.socket],
        users: [player1Data.user, player2Data.user],
        quizId,
        quiz,
        questions,
        scores: [0, 0],
        answers: [[], []],
        currentQuestion: 0,
        entryFeesDeducted: true // Flag to ensure fees are only deducted once
      };

// Notify both players
      player1Data.socket.emit('opponent_joined', { 
        opponent: { 
          id: player2Data.user.id,
          name: player2Data.user.name, 
          image: player2Data.user.image 
        } 
      });
      player2Data.socket.emit('opponent_joined', { 
        opponent: { 
          id: player1Data.user.id,
          name: player1Data.user.name, 
          image: player1Data.user.image 
        } 
      });

// Start first question
      io.to(roomId).emit('question_start', { 
        questionIndex: 0, 
        timeLimit: 20,
        question: questions[0],
        totalQuestions: questions.length
      });
} else {
      // Waiting for opponent
socket.emit('waiting');
    }
  });

  socket.on('submit_answer', async ({ quizId, questionIndex, answer }) => {
// Find the match room
    const roomId = Object.keys(activeMatches).find(rid =>
      activeMatches[rid].quizId === quizId &&
      activeMatches[rid].sockets.some(s => s.id === socket.id)
    );
    
    if (!roomId) {
return;
    }

    const match = activeMatches[roomId];
const playerIdx = match.sockets.findIndex(s => s.id === socket.id);
// Ensure the answers array is long enough
    while (match.answers[playerIdx].length <= questionIndex) {
      match.answers[playerIdx].push(undefined);
    }
    match.answers[playerIdx][questionIndex] = answer;

// Clear auto-submit timeout for this question since player answered
    if (match.answerTimeouts && match.answerTimeouts[questionIndex]) {
      clearTimeout(match.answerTimeouts[questionIndex]);
      delete match.answerTimeouts[questionIndex];
}

// If both answered, score and move to next
    if (
      match.answers[0][questionIndex] !== undefined &&
      match.answers[1][questionIndex] !== undefined
    ) {
const correct = match.questions[questionIndex].correct;
      if (match.answers[0][questionIndex] === correct) match.scores[0]++;
      if (match.answers[1][questionIndex] === correct) match.scores[1]++;

// Send question result to both players individually with correct scores
      match.sockets.forEach((playerSocket, idx) => {
playerSocket.emit('question_result', {
          questionIndex,
          correctAnswer: correct,
          myScore: match.scores[idx],
          opponentScore: match.scores[1 - idx],
          totalQuestions: match.questions.length
        });
      });

// Next question or finish
      if (questionIndex + 1 < match.questions.length) {
        // Check if both players are still connected before proceeding
        const connectedSockets = match.sockets.filter(s => s.connected);
        if (connectedSockets.length < 2) {
// Notify the remaining connected player about the disconnect
          connectedSockets.forEach(socket => {
            socket.emit('opponent_disconnected');
});
          
          // Clean up the match
          delete activeMatches[roomId];
return;
        }
        
        setTimeout(() => {
          match.currentQuestion++;
          const connectedSockets = match.sockets.filter(s => s.connected);

          if (connectedSockets.length === 2) {
            const nextQuestion = match.questions[match.currentQuestion];

            io.to(roomId).emit('question_start', {
              questionIndex: match.currentQuestion,
              timeLimit: 20,
              question: nextQuestion,
              totalQuestions: match.questions.length
            });
} else {
// Notify the remaining connected player about the disconnect
            connectedSockets.forEach(socket => {
              socket.emit('opponent_disconnected');
});
            
            // Clean up the match
            delete activeMatches[roomId];
}
        }, 2000);
      } else {
// Game finished - handle wallet payout
        const winner =
          match.scores[0] > match.scores[1]
            ? 0
            : match.scores[1] > match.scores[0]
            ? 1
            : -1;

let prizeAmount = 0;
        let winnerUserId = null;

        if (winner !== -1) {
          // Calculate prize (85% of total entry fees)
          const totalEntryFees = match.quiz.entryAmount * 2;
          prizeAmount = totalEntryFees * 0.85;
          winnerUserId = match.users[winner].id;

// Add prize to winner's wallet
          await prisma.user.update({
            where: { id: winnerUserId },
            data: { wallet: { increment: prizeAmount } }
          });

          // Create transaction record for winner
          await prisma.transaction.create({
            data: {
              userId: winnerUserId,
              amount: prizeAmount,
              type: 'BATTLE_QUIZ_WIN',
              status: 'COMPLETED'
            }
          });

          // Create winner record
          await prisma.battleQuizWinner.create({
            data: {
              quizId: match.quizId,
              userId: winnerUserId,
              rank: 1,
              prizeAmount: prizeAmount,
              paid: true
            }
          });

}

        io.to(roomId).emit('game_finished', {
          winner: winner === -1 ? 'draw' : winner === playerIdx ? 'you' : 'opponent',
          myScore: match.scores[playerIdx],
          opponentScore: match.scores[1 - playerIdx],
          prizeAmount: winner === playerIdx ? prizeAmount : 0
        });
        
delete activeMatches[roomId];
}
    } else {
// Set a timeout to auto-submit for the player who hasn't answered
      const unansweredPlayerIdx = match.answers[0][questionIndex] === undefined ? 0 : 1;
      const answeredPlayerIdx = 1 - unansweredPlayerIdx;
      
// Clear any existing timeout for this question
      if (match.answerTimeouts && match.answerTimeouts[questionIndex]) {
        clearTimeout(match.answerTimeouts[questionIndex]);
      }
      
      // Initialize answerTimeouts if it doesn't exist
      if (!match.answerTimeouts) {
        match.answerTimeouts = {};
      }
      
      match.answerTimeouts[questionIndex] = setTimeout(() => {
// Auto-submit -1 (no answer) for the unanswered player
        match.answers[unansweredPlayerIdx][questionIndex] = -1;
        
// Now both players have answered, process the result
        const correct = match.questions[questionIndex].correct;
        if (match.answers[0][questionIndex] === correct) match.scores[0]++;
        if (match.answers[1][questionIndex] === correct) match.scores[1]++;

// Send question result to both players
        match.sockets.forEach((playerSocket, idx) => {
playerSocket.emit('question_result', {
            questionIndex,
            correctAnswer: correct,
            myScore: match.scores[idx],
            opponentScore: match.scores[1 - idx],
            totalQuestions: match.questions.length
          });
        });
        
        // Clean up timeout
        delete match.answerTimeouts[questionIndex];
      }, 25000); // 25 second timeout (5 seconds more than client timeout)
    }
  });

  socket.on('error', (message) => {
});

  // Keep connection alive with ping/pong
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', (reason) => {
const user = socketToUser.get(socket.id);
    if (user) {
}
    
    // Remove from waiting queue
    Object.keys(waitingUsers).forEach((quizId) => {
      const beforeCount = waitingUsers[quizId].length;
      waitingUsers[quizId] = waitingUsers[quizId].filter((data) => data.socket.id !== socket.id);
      const afterCount = waitingUsers[quizId].length;
      if (beforeCount !== afterCount) {
}
    });
    
    // Handle disconnect in active match
    Object.keys(activeMatches).forEach((roomId) => {
      const match = activeMatches[roomId];
      const playerIdx = match.sockets.findIndex(s => s.id === socket.id);
      if (playerIdx !== -1) {
// Notify opponent about disconnect
        const opponentSocket = match.sockets[1 - playerIdx];
        if (opponentSocket && opponentSocket.connected) {
          opponentSocket.emit('opponent_disconnected');
}
        
        // Refund entry fee to disconnected user
        const disconnectedUser = match.users[playerIdx];
        prisma.user.update({
          where: { id: disconnectedUser.id },
          data: { wallet: { increment: match.quiz.entryAmount } }
        });
        
delete activeMatches[roomId];
}
    });
    
    socketToUser.delete(socket.id);
});

  socket.on('question_result', (data) => {
// ...existing logic
  });

  socket.on('question_start', (data) => {
// ...existing logic
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
}); 