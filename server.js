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
  console.log('🔌 Socket connection attempt - Socket ID:', socket.id);
  console.log('🔌 Auth token from handshake:', socket.handshake.auth.token ? 'Present' : 'Missing');
  console.log('🔌 Query params:', socket.handshake.query);
  console.log('🔌 Headers:', Object.keys(socket.handshake.headers));
  next();
});

io.on('connection', (socket) => {
  console.log('🔌 Socket connection attempt - Socket ID:', socket.id);
  
  // Get auth token from handshake
  const authToken = socket.handshake.auth?.token;
  console.log('🔌 Auth token from handshake:', authToken ? 'Present' : 'Missing');
  
  // Log query params and headers for debugging
  console.log('🔌 Query params:', socket.handshake.query);
  console.log('🔌 Headers:', Object.keys(socket.handshake.headers));
  
  // Authenticate user immediately if token is provided
  let authenticatedUser = null;
  
  if (authToken) {
    try {
      // Verify the token and get user info
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'your-secret-key');
      console.log('🔐 Token verified for user:', decoded.userId);
      
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
          
          console.log('✅ User authenticated on connection:');
          console.log('   - Socket ID:', socket.id);
          console.log('   - User ID:', user.id);
          console.log('   - User Name:', user.name);
          console.log('   - User Wallet:', user.wallet);
          console.log('   - Connection time:', new Date().toISOString());
          
          // Emit authenticated event to client
          socket.emit('authenticated', { user });
        } else {
          console.log('❌ User not found in database:', decoded.userId);
          socket.emit('auth_error', 'User not found');
        }
      }).catch(error => {
        console.error('❌ Database error during authentication:', error);
        socket.emit('auth_error', 'Authentication failed');
      });
      
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      socket.emit('auth_error', 'Invalid token');
    }
  } else {
    console.log('⚠️ No auth token provided - user will need to authenticate later');
  }
  
  console.log('✅ Client connected - Socket ID:', socket.id);
  console.log('✅ Socket auth token:', authToken ? 'Present' : 'Missing');
  console.log('✅ Connection time:', new Date().toISOString());

  // Track connection time
  socket.connectedAt = Date.now();

  // Fallback authentication if token wasn't provided during connection
  socket.on('authenticate', async ({ token }) => {
    console.log('🔐 Fallback authentication attempt - Socket ID:', socket.id);
    
    if (authenticatedUser) {
      console.log('✅ User already authenticated, skipping fallback auth');
      socket.emit('authenticated', { user: authenticatedUser });
      return;
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('🔐 Token verified for user:', decoded.userId);
      
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
        
        console.log('✅ User authenticated via fallback:');
        console.log('   - Socket ID:', socket.id);
        console.log('   - User ID:', user.id);
        console.log('   - User Name:', user.name);
        
        socket.emit('authenticated', { user });
      } else {
        console.log('❌ User not found in database:', decoded.userId);
        socket.emit('auth_error', 'User not found');
      }
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      socket.emit('auth_error', 'Invalid token');
    }
  });

  socket.on('join_battle', async ({ quizId }) => {
    console.log('🎮 Join battle request:');
    console.log('   - Socket ID:', socket.id);
    console.log('   - Quiz ID:', quizId);
    
    const user = socketToUser.get(socket.id);
    if (!user) {
      console.log('❌ Socket not authenticated - Socket ID:', socket.id);
      socket.emit('error', 'Please authenticate first');
      return;
    }

    console.log('✅ User authenticated for battle:');
    console.log('   - Socket ID:', socket.id);
    console.log('   - User ID:', user.id);
    console.log('   - User Name:', user.name);
    console.log('   - User Wallet:', user.wallet);
    console.log('   - Quiz ID:', quizId);

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
      console.log('❌ Quiz not found - Quiz ID:', quizId);
      socket.emit('error', 'Quiz not found');
      return;
    }

    console.log('✅ Quiz found:');
    console.log('   - Quiz ID:', quiz.id);
    console.log('   - Entry Amount:', quiz.entryAmount);
    console.log('   - Questions Count:', quiz.questions.length);
    console.log('   - User Wallet:', user.wallet);

    if (quiz.questions.length === 0) {
      console.log('❌ Quiz has no questions - Quiz ID:', quizId);
      socket.emit('error', 'This quiz has no questions. Please contact admin.');
      return;
    }

    // Only check wallet balance for paid quizzes (entryAmount > 0)
    if (quiz.entryAmount > 0 && user.wallet < quiz.entryAmount) {
      console.log('❌ Insufficient balance:');
      console.log('   - Required:', quiz.entryAmount);
      console.log('   - Available:', user.wallet);
      socket.emit('error', `Insufficient balance. Required: ₹${quiz.entryAmount}, Available: ₹${user.wallet}`);
      return;
    }

    if (!waitingUsers[quizId]) {
      waitingUsers[quizId] = [];
      console.log('🆕 Created new waiting queue for quiz:', quizId);
    }
    
    // Check if user is already in queue (by user ID, not socket ID)
    const existingUserIndex = waitingUsers[quizId].findIndex(w => w.user.id === user.id);
    if (existingUserIndex !== -1) {
      console.log('⚠️ User already in queue - removing old entry');
      console.log('   - Old socket ID:', waitingUsers[quizId][existingUserIndex].socket.id);
      console.log('   - New socket ID:', socket.id);
      waitingUsers[quizId].splice(existingUserIndex, 1);
    }
    
    // Check if user is already in an active match
    const isInActiveMatch = Object.values(activeMatches).some(match => 
      match.users.some(u => u.id === user.id)
    );
    
    if (isInActiveMatch) {
      console.log('❌ User already in active match - cannot join new battle');
      socket.emit('error', 'You are already in an active battle');
      return;
    }
    
    waitingUsers[quizId].push({ socket, user });
    console.log('✅ Added user to waiting queue:');
    console.log('   - Socket ID:', socket.id);
    console.log('   - User ID:', user.id);
    console.log('   - User Name:', user.name);
    console.log('   - Queue size:', waitingUsers[quizId].length);

    console.log('📋 Current waiting queue for quiz', quizId, ':');
    waitingUsers[quizId].forEach((entry, index) => {
      console.log(`   ${index + 1}. Socket: ${entry.socket.id}, User: ${entry.user.name} (ID: ${entry.user.id})`);
    });

    // If two users are waiting, start a match
    if (waitingUsers[quizId].length >= 2) {
      console.log('🎯 Starting match - 2+ players in queue');
      
      const [player1Data, player2Data] = waitingUsers[quizId].splice(0, 2);
      const roomId = `battle_${quizId}_${Date.now()}`;
      
      console.log('🏆 Match created:');
      console.log('   - Room ID:', roomId);
      console.log('   - Player 1:', player1Data.user.name, '(ID:', player1Data.user.id, ', Socket:', player1Data.socket.id, ')');
      console.log('   - Player 2:', player2Data.user.name, '(ID:', player2Data.user.id, ', Socket:', player2Data.socket.id, ')');
      
      // Check if same user
      if (player1Data.user.id === player2Data.user.id) {
        console.log('⚠️ WARNING: Same user matched with themselves!');
        console.log('   - User ID:', player1Data.user.id);
        console.log('   - Socket 1:', player1Data.socket.id);
        console.log('   - Socket 2:', player2Data.socket.id);
        
        // Put one player back in queue and continue
        waitingUsers[quizId].unshift(player2Data);
        console.log('🔄 Put second player back in queue due to same user match');
        socket.emit('waiting');
        return;
      }
      
      player1Data.socket.join(roomId);
      player2Data.socket.join(roomId);

      console.log('🏠 Players joined room:', roomId);
      console.log('   - Player 1 socket:', player1Data.socket.id, '- In room:', player1Data.socket.rooms.has(roomId));
      console.log('   - Player 2 socket:', player2Data.socket.id, '- In room:', player2Data.socket.rooms.has(roomId));

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

          console.log('💰 Entry fees deducted from both players');
          console.log('   - Player 1 deducted:', quiz.entryAmount);
          console.log('   - Player 2 deducted:', quiz.entryAmount);
        } catch (error) {
          console.error('❌ Error deducting entry fees:', error);
        }
      } else {
        console.log('🆓 Free quiz - no entry fees deducted');
      }

        // Create transaction records (only for paid quizzes)
        if (quiz.entryAmount > 0) {
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
        }

        console.log('📝 Transaction records created for entry fees');
      } catch (error) {
        console.error('❌ Error deducting entry fees:', error);
        // Refund if there was an error
        try {
          await prisma.user.update({
            where: { id: player1Data.user.id },
            data: { wallet: { increment: quiz.entryAmount } }
          });
          await prisma.user.update({
            where: { id: player2Data.user.id },
            data: { wallet: { increment: quiz.entryAmount } }
          });
          console.log('💰 Entry fees refunded due to error');
        } catch (refundError) {
          console.error('❌ Error refunding entry fees:', refundError);
        }
        socket.emit('error', 'Failed to process entry fee');
        return;
      }

      // Fetch questions from DB
      const questions = await prisma.battleQuizQuestion.findMany({
        where: { quizId },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`📝 Fetched ${questions.length} questions for quiz ${quizId}`);
      
      if (questions.length === 0) {
        console.log('❌ No questions found for quiz:', quizId);
        console.log('   - This will cause the game to not work properly');
        console.log('   - Please ensure the quiz has questions added');
        
        // Notify players about the issue
        player1Data.socket.emit('error', 'Quiz has no questions. Please contact admin.');
        player2Data.socket.emit('error', 'Quiz has no questions. Please contact admin.');
        return;
      }
      
      console.log('📋 Sample questions:');
      questions.slice(0, 2).forEach((q, index) => {
        console.log(`   Question ${index + 1}: ${q.text.substring(0, 50)}...`);
        console.log(`   Options: ${JSON.stringify(q.options)}`);
        console.log(`   Correct: ${q.correct}`);
      });

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

      console.log('🎮 Match state initialized:');
      console.log('   - Room ID:', roomId);
      console.log('   - Player 1 Socket:', player1Data.socket.id);
      console.log('   - Player 2 Socket:', player2Data.socket.id);
      console.log('   - Player 1 User ID:', player1Data.user.id);
      console.log('   - Player 2 User ID:', player2Data.user.id);
      console.log('   - Entry fees deducted:', activeMatches[roomId].entryFeesDeducted);

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

      console.log('📢 Notified both players about opponent joined');

      console.log('🔍 Final match details:');
      console.log('   - User IDs:', player1Data.user.id, 'vs', player2Data.user.id);
      console.log('   - Socket IDs:', player1Data.socket.id, 'vs', player2Data.socket.id);
      console.log('   - Same user?', player1Data.user.id === player2Data.user.id ? 'YES ⚠️' : 'NO ✅');

      // Start first question
      io.to(roomId).emit('question_start', { 
        questionIndex: 0, 
        timeLimit: 20,
        question: questions[0],
        totalQuestions: questions.length
      });
      console.log(`🎯 Started first question for room ${roomId}`);
      console.log(`📊 Total questions in quiz: ${questions.length}`);
    } else {
      // Waiting for opponent
      console.log('⏳ User waiting for opponent:');
      console.log('   - User:', user.name, '(ID:', user.id, ')');
      console.log('   - Socket:', socket.id);
      console.log('   - Queue size:', waitingUsers[quizId].length);
      socket.emit('waiting');
    }
  });

  socket.on('submit_answer', async ({ quizId, questionIndex, answer }) => {
    console.log('📝 Answer submission:');
    console.log('   - Socket ID:', socket.id);
    console.log('   - Quiz ID:', quizId);
    console.log('   - Question Index:', questionIndex);
    console.log('   - Answer:', answer);
    
    // Find the match room
    const roomId = Object.keys(activeMatches).find(rid =>
      activeMatches[rid].quizId === quizId &&
      activeMatches[rid].sockets.some(s => s.id === socket.id)
    );
    
    if (!roomId) {
      console.log('❌ No active match found for this socket');
      return;
    }

    const match = activeMatches[roomId];
    console.log('🎮 Match found:');
    console.log('   - Room ID:', roomId);
    console.log('   - Match sockets:', match.sockets.map(s => s.id));
    console.log('   - Current socket:', socket.id);
    
    const playerIdx = match.sockets.findIndex(s => s.id === socket.id);
    console.log('   - Player index:', playerIdx);
    console.log('   - Player user ID:', match.users[playerIdx]?.id);

    // Ensure the answers array is long enough
    while (match.answers[playerIdx].length <= questionIndex) {
      match.answers[playerIdx].push(undefined);
    }
    match.answers[playerIdx][questionIndex] = answer;

    console.log('📝 Answer stored:');
    console.log('   - Player index:', playerIdx);
    console.log('   - Player user ID:', match.users[playerIdx]?.id);
    console.log('   - Question index:', questionIndex);
    console.log('   - Answer:', answer);
    console.log('   - Current answers array length:', match.answers[playerIdx].length);

    // Clear auto-submit timeout for this question since player answered
    if (match.answerTimeouts && match.answerTimeouts[questionIndex]) {
      clearTimeout(match.answerTimeouts[questionIndex]);
      delete match.answerTimeouts[questionIndex];
      console.log(`⏰ Cleared auto-submit timeout for question ${questionIndex}`);
    }

    console.log('📊 Current answers state:');
    console.log('   - Player 0 answers:', match.answers[0]);
    console.log('   - Player 1 answers:', match.answers[1]);
    console.log('   - Question', questionIndex, 'answers:', match.answers[0][questionIndex], 'vs', match.answers[1][questionIndex]);

    // If both answered, score and move to next
    if (
      match.answers[0][questionIndex] !== undefined &&
      match.answers[1][questionIndex] !== undefined
    ) {
      console.log('✅ Both players answered question', questionIndex);
      console.log('   - Player 0 answer:', match.answers[0][questionIndex]);
      console.log('   - Player 1 answer:', match.answers[1][questionIndex]);
      console.log('   - Player 0 user ID:', match.users[0].id);
      console.log('   - Player 1 user ID:', match.users[1].id);
      
      const correct = match.questions[questionIndex].correct;
      if (match.answers[0][questionIndex] === correct) match.scores[0]++;
      if (match.answers[1][questionIndex] === correct) match.scores[1]++;

      console.log('📊 Updated scores:');
      console.log('   - Player 0:', match.scores[0]);
      console.log('   - Player 1:', match.scores[1]);
      console.log('   - Correct answer:', correct);

      // Send question result to both players individually with correct scores
      match.sockets.forEach((playerSocket, idx) => {
        console.log(`📤 Sending question_result to socket ${idx}: ${playerSocket.id}`);
        playerSocket.emit('question_result', {
          questionIndex,
          correctAnswer: correct,
          myScore: match.scores[idx],
          opponentScore: match.scores[1 - idx],
          totalQuestions: match.questions.length
        });
      });

      console.log('📊 Question result sent to both players:');
      console.log('   - Player 0 score:', match.scores[0]);
      console.log('   - Player 1 score:', match.scores[1]);

      // Next question or finish
      if (questionIndex + 1 < match.questions.length) {
        console.log('⏭️ Moving to next question:', questionIndex + 1);
        console.log('   - Total questions:', match.questions.length);
        console.log('   - Current question index:', questionIndex);
        console.log('   - Next question index:', questionIndex + 1);
        console.log('   - Room ID:', roomId);
        console.log('   - Active sockets in room:', match.sockets.map(s => s.id));
        console.log('   - Socket connection status:');
        match.sockets.forEach((socket, index) => {
          console.log(`     Socket ${index}: ${socket.id} - Connected: ${socket.connected}`);
        });
        
        // Check if both players are still connected before proceeding
        const connectedSockets = match.sockets.filter(s => s.connected);
        if (connectedSockets.length < 2) {
          console.log('❌ One or more players disconnected during question result phase');
          console.log('   - Connected sockets:', connectedSockets.map(s => s.id));
          console.log('   - Disconnected sockets:', match.sockets.filter(s => !s.connected).map(s => s.id));
          
          // Notify the remaining connected player about the disconnect
          connectedSockets.forEach(socket => {
            socket.emit('opponent_disconnected');
            console.log('📢 Notified remaining player about opponent disconnect');
          });
          
          // Clean up the match
          delete activeMatches[roomId];
          console.log('🗑️ Match cleaned up due to disconnect during question result');
          return;
        }
        
        setTimeout(() => {
          match.currentQuestion++;
          console.log('🎯 Sending question_start event to room:', roomId);
          console.log('   - Question index:', match.currentQuestion);
          console.log('   - Time limit: 20');
          console.log('   - Total questions in quiz:', match.questions.length);
          console.log('   - Active sockets count:', match.sockets.length);
          console.log('   - Socket IDs:', match.sockets.map(s => s.id));
          
          // Check if both sockets are still connected
          const connectedSockets = match.sockets.filter(s => s.connected);
          console.log('   - Connected sockets count:', connectedSockets.length);
          console.log('   - Socket connection status before sending:');
          match.sockets.forEach((socket, index) => {
            console.log(`     Socket ${index}: ${socket.id} - Connected: ${socket.connected}`);
          });
          
          if (connectedSockets.length === 2) {
            const nextQuestion = match.questions[match.currentQuestion];
            console.log('📋 Next question details:');
            console.log('   - Question text:', nextQuestion.text.substring(0, 50) + '...');
            console.log('   - Options:', JSON.stringify(nextQuestion.options));
            console.log('   - Correct answer:', nextQuestion.correct);
            
            console.log('📡 Sending question_start to room:', roomId);
            console.log('   - Room members:', match.sockets.map(s => s.id));
            console.log('   - Socket connection status:');
            match.sockets.forEach((socket, index) => {
              console.log(`     Socket ${index}: ${socket.id} - Connected: ${socket.connected} - In room: ${socket.rooms.has(roomId)}`);
            });
            
            io.to(roomId).emit('question_start', {
              questionIndex: match.currentQuestion,
              timeLimit: 20,
              question: nextQuestion,
              totalQuestions: match.questions.length
            });
            console.log('✅ question_start event sent successfully to room:', roomId);
            console.log('   - Event data:', {
              questionIndex: match.currentQuestion,
              timeLimit: 20,
              totalQuestions: match.questions.length
            });
          } else {
            console.log('❌ Not all sockets connected, cannot send next question');
            console.log('   - Connected sockets:', connectedSockets.map(s => s.id));
            console.log('   - Disconnected sockets:', match.sockets.filter(s => !s.connected).map(s => s.id));
            
            // Notify the remaining connected player about the disconnect
            connectedSockets.forEach(socket => {
              socket.emit('opponent_disconnected');
              console.log('📢 Notified remaining player about opponent disconnect');
            });
            
            // Clean up the match
            delete activeMatches[roomId];
            console.log('🗑️ Match cleaned up due to disconnect');
          }
        }, 2000);
      } else {
        console.log('🏁 Game finished - calculating results');
        console.log('   - Current question index:', questionIndex);
        console.log('   - Total questions:', match.questions.length);
        console.log('   - No more questions available');
        // Game finished - handle wallet payout
        const winner =
          match.scores[0] > match.scores[1]
            ? 0
            : match.scores[1] > match.scores[0]
            ? 1
            : -1;

        console.log('🏆 Winner determination:');
        console.log('   - Player 0 score:', match.scores[0]);
        console.log('   - Player 1 score:', match.scores[1]);
        console.log('   - Winner index:', winner);

        let prizeAmount = 0;
        let winnerUserId = null;

        if (winner !== -1) {
          // Calculate prize (85% of total entry fees)
          const totalEntryFees = match.quiz.entryAmount * 2;
          prizeAmount = totalEntryFees * 0.85;
          winnerUserId = match.users[winner].id;

          console.log('💰 Prize calculation:');
          console.log('   - Total entry fees:', totalEntryFees);
          console.log('   - Prize amount:', prizeAmount);
          console.log('   - Winner user ID:', winnerUserId);

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

          console.log('✅ Prize distributed to winner');
        }

        io.to(roomId).emit('game_finished', {
          winner: winner === -1 ? 'draw' : winner === playerIdx ? 'you' : 'opponent',
          myScore: match.scores[playerIdx],
          opponentScore: match.scores[1 - playerIdx],
          prizeAmount: winner === playerIdx ? prizeAmount : 0
        });
        
        console.log('🏁 Game finished event sent to players');
        console.log('   - Winner:', winner === -1 ? 'draw' : winner === 0 ? 'player1' : 'player2');
        console.log('   - Final scores:', match.scores[0], 'vs', match.scores[1]);
        console.log('   - Prize amount:', prizeAmount);
        delete activeMatches[roomId];
        console.log('🗑️ Match state cleaned up');
      }
    } else {
      console.log('⏳ Waiting for other player to answer...');
      console.log('   - Player 0 answered:', match.answers[0][questionIndex] !== undefined);
      console.log('   - Player 1 answered:', match.answers[1][questionIndex] !== undefined);
      console.log('   - Player 0 answer:', match.answers[0][questionIndex]);
      console.log('   - Player 1 answer:', match.answers[1][questionIndex]);
      
      // Set a timeout to auto-submit for the player who hasn't answered
      const unansweredPlayerIdx = match.answers[0][questionIndex] === undefined ? 0 : 1;
      const answeredPlayerIdx = 1 - unansweredPlayerIdx;
      
      console.log(`⏰ Setting timeout for player ${unansweredPlayerIdx} to auto-submit in 25 seconds`);
      
      // Clear any existing timeout for this question
      if (match.answerTimeouts && match.answerTimeouts[questionIndex]) {
        clearTimeout(match.answerTimeouts[questionIndex]);
      }
      
      // Initialize answerTimeouts if it doesn't exist
      if (!match.answerTimeouts) {
        match.answerTimeouts = {};
      }
      
      match.answerTimeouts[questionIndex] = setTimeout(() => {
        console.log(`⏰ Timeout reached for question ${questionIndex}, auto-submitting for player ${unansweredPlayerIdx}`);
        
        // Auto-submit -1 (no answer) for the unanswered player
        match.answers[unansweredPlayerIdx][questionIndex] = -1;
        
        console.log('📝 Auto-submitted answer stored:');
        console.log('   - Player index:', unansweredPlayerIdx);
        console.log('   - Player user ID:', match.users[unansweredPlayerIdx]?.id);
        console.log('   - Question index:', questionIndex);
        console.log('   - Auto-submitted answer: -1');
        
        // Now both players have answered, process the result
        const correct = match.questions[questionIndex].correct;
        if (match.answers[0][questionIndex] === correct) match.scores[0]++;
        if (match.answers[1][questionIndex] === correct) match.scores[1]++;

        console.log('📊 Updated scores after auto-submit:');
        console.log('   - Player 0:', match.scores[0]);
        console.log('   - Player 1:', match.scores[1]);
        console.log('   - Correct answer:', correct);

        // Send question result to both players
        match.sockets.forEach((playerSocket, idx) => {
          console.log(`📤 Sending question_result (auto-submit) to socket ${idx}: ${playerSocket.id}`);
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
    console.error('Socket error:', message);
  });

  // Keep connection alive with ping/pong
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected - Socket ID:', socket.id);
    console.log('❌ Disconnect reason:', reason);
    console.log('❌ Disconnect time:', new Date().toISOString());
    
    const user = socketToUser.get(socket.id);
    if (user) {
      console.log('   - User ID:', user.id);
      console.log('   - User Name:', user.name);
      console.log('   - Connection duration:', Date.now() - socket.connectedAt, 'ms');
    }
    
    // Remove from waiting queue
    Object.keys(waitingUsers).forEach((quizId) => {
      const beforeCount = waitingUsers[quizId].length;
      waitingUsers[quizId] = waitingUsers[quizId].filter((data) => data.socket.id !== socket.id);
      const afterCount = waitingUsers[quizId].length;
      if (beforeCount !== afterCount) {
        console.log(`🗑️ Removed user from waiting queue - Quiz: ${quizId}, Queue size: ${beforeCount} → ${afterCount}`);
      }
    });
    
    // Handle disconnect in active match
    Object.keys(activeMatches).forEach((roomId) => {
      const match = activeMatches[roomId];
      const playerIdx = match.sockets.findIndex(s => s.id === socket.id);
      if (playerIdx !== -1) {
        console.log('🎮 Player disconnected from active match:');
        console.log('   - Room ID:', roomId);
        console.log('   - Player index:', playerIdx);
        console.log('   - User ID:', match.users[playerIdx]?.id);
        console.log('   - Current question:', match.currentQuestion);
        console.log('   - Total questions:', match.questions.length);
        console.log('   - Match duration:', Date.now() - socket.connectedAt, 'ms');
        
        // Notify opponent about disconnect
        const opponentSocket = match.sockets[1 - playerIdx];
        if (opponentSocket && opponentSocket.connected) {
          opponentSocket.emit('opponent_disconnected');
          console.log('📢 Notified opponent about disconnect');
        } else {
          console.log('⚠️ Opponent socket not available for notification');
        }
        
        // Refund entry fee to disconnected user
        const disconnectedUser = match.users[playerIdx];
        prisma.user.update({
          where: { id: disconnectedUser.id },
          data: { wallet: { increment: match.quiz.entryAmount } }
        });
        
        console.log('💰 Entry fee refunded to disconnected user');
        delete activeMatches[roomId];
        console.log('🗑️ Active match cleaned up');
      }
    });
    
    socketToUser.delete(socket.id);
    console.log('🗑️ Socket-to-user mapping cleaned up');
  });

  socket.on('question_result', (data) => {
    console.log('🟢 [SOCKET] question_result', data);
    // ...existing logic
  });

  socket.on('question_start', (data) => {
    console.log('🟢 [SOCKET] question_start', data);
    // ...existing logic
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server ready on http://localhost:${PORT}`);
  console.log('📊 Server initialized with enhanced logging');
}); 