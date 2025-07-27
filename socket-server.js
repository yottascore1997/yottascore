const { Server } = require('socket.io');
const { createServer } = require('http');
const { PrismaClient } = require('@prisma/client');
const Redis = require('redis');

const httpServer = createServer();
const prisma = new PrismaClient();

// Redis Configuration with fallback
let redis = null;
let redisConnected = false;

// Initialize Redis with fallback
async function initializeRedis() {
  try {
    redis = Redis.createClient({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
      redisConnected = true;
    });

    redis.on('error', (err) => {
      console.log('❌ Redis connection error:', err.message);
      redisConnected = false;
    });

    redis.on('end', () => {
      console.log('🔌 Redis connection ended');
      redisConnected = false;
    });

    await redis.connect();
  } catch (error) {
    console.log('❌ Failed to connect to Redis, using memory fallback:', error.message);
    redisConnected = false;
  }
}

// Initialize Redis on startup
initializeRedis();

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected successfully. Total users: ${userCount}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

// Test database on startup
testDatabaseConnection();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/api/socket',
  addTrailingSlash: false,
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

// Store user socket mappings
const userSockets = {};

// Battle Quiz Matchmaking - Keep existing memory system as fallback
const waitingPlayers = new Map(); // quizId -> array of waiting players
const activeMatches = new Map(); // matchId -> match data
const privateRooms = new Map(); // roomCode -> room data

// Redis Queue Management with fallback
class QueueManager {
  async addToQueue(userId, quizId, playerData) {
    try {
      if (redisConnected && redis) {
        // Use Redis
        await redis.lpush(`queue:${quizId}`, JSON.stringify(playerData));
        await redis.expire(`queue:${quizId}`, 300); // 5 minutes TTL
        console.log(`✅ Player ${userId} added to Redis queue for quiz ${quizId}`);
      } else {
        // Fallback to memory
        if (!waitingPlayers.has(quizId)) {
          waitingPlayers.set(quizId, []);
        }
        waitingPlayers.get(quizId).push(playerData);
        console.log(`✅ Player ${userId} added to memory queue for quiz ${quizId}`);
      }
    } catch (error) {
      console.log('❌ Redis error, using memory fallback:', error.message);
      // Fallback to memory
      if (!waitingPlayers.has(quizId)) {
        waitingPlayers.set(quizId, []);
      }
      waitingPlayers.get(quizId).push(playerData);
    }
  }

  async getQueue(quizId) {
    try {
      if (redisConnected && redis) {
        // Get from Redis
        const queueData = await redis.lrange(`queue:${quizId}`, 0, -1);
        return queueData.map(item => JSON.parse(item));
      } else {
        // Fallback to memory
        return waitingPlayers.get(quizId) || [];
      }
    } catch (error) {
      console.log('❌ Redis error, using memory fallback:', error.message);
      return waitingPlayers.get(quizId) || [];
    }
  }

  async removeFromQueue(quizId, playerData) {
    try {
      if (redisConnected && redis) {
        // Remove from Redis
        await redis.lrem(`queue:${quizId}`, 1, JSON.stringify(playerData));
      } else {
        // Fallback to memory
        const players = waitingPlayers.get(quizId);
        if (players) {
          const index = players.findIndex(p => p.socketId === playerData.socketId);
          if (index !== -1) {
            players.splice(index, 1);
          }
        }
      }
    } catch (error) {
      console.log('❌ Redis error, using memory fallback:', error.message);
      // Fallback to memory
      const players = waitingPlayers.get(quizId);
      if (players) {
        const index = players.findIndex(p => p.socketId === playerData.socketId);
        if (index !== -1) {
          players.splice(index, 1);
        }
      }
    }
  }

  async getQueueLength(quizId) {
    try {
      if (redisConnected && redis) {
        return await redis.llen(`queue:${quizId}`);
      } else {
        return (waitingPlayers.get(quizId) || []).length;
      }
    } catch (error) {
      console.log('❌ Redis error, using memory fallback:', error.message);
      return (waitingPlayers.get(quizId) || []).length;
    }
  }
}

const queueManager = new QueueManager();

// Memory cleanup function
function cleanupMemory() {
  setInterval(() => {
    try {
      // Clean up disconnected users
      Object.keys(userSockets).forEach(userId => {
        const socketId = userSockets[userId];
        const socket = io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          delete userSockets[userId];
          console.log(`🧹 Cleaned up disconnected user: ${userId}`);
        }
      });

      // Clean up old matches (older than 10 minutes)
      const now = Date.now();
      activeMatches.forEach((match, matchId) => {
        if (now - match.startTime > 600000) { // 10 minutes
          activeMatches.delete(matchId);
          console.log(`🧹 Cleaned up old match: ${matchId}`);
        }
      });

      // Clean up old private rooms (older than 30 minutes)
      privateRooms.forEach((room, roomCode) => {
        if (now - (room.createdAt || now) > 1800000) { // 30 minutes
          privateRooms.delete(roomCode);
          console.log(`🧹 Cleaned up old private room: ${roomCode}`);
        }
      });

      console.log(`🧹 Memory cleanup completed. Active matches: ${activeMatches.size}, Private rooms: ${privateRooms.size}`);
    } catch (error) {
      console.error('❌ Error during memory cleanup:', error);
    }
  }, 60000); // Every minute
}

// Start memory cleanup
cleanupMemory();

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  console.log('   - Time:', new Date().toISOString());
  console.log('   - Total connections:', io.engine.clientsCount);

  socket.on('register_user', (userId) => {
    if (userId) {
      userSockets[userId] = socket.id;
      socket.userId = userId; // Store userId in socket object
      console.log(`User ${userId} registered with socket ${socket.id}`);
      
      // Update socket IDs in active matches if this user is in a match
      activeMatches.forEach((match, matchId) => {
        if (match.player1Id === userId) {
          if (match.player1SocketId !== socket.id) {
            console.log(`Updating player 1 socket ID in match ${matchId}: ${match.player1SocketId} -> ${socket.id}`);
            match.player1SocketId = socket.id;
          }
        } else if (match.player2Id === userId) {
          if (match.player2SocketId !== socket.id) {
            console.log(`Updating player 2 socket ID in match ${matchId}: ${match.player2SocketId} -> ${socket.id}`);
            match.player2SocketId = socket.id;
          }
        }
      });
    }
  });

  // Battle Quiz Events
  socket.on('join_matchmaking', async (data) => {
    console.log('🎮 join_matchmaking event received');
    console.log('   - Socket ID:', socket.id);
    console.log('   - Event data:', data);
    
    const { categoryId, mode, quizId } = data;
    const userId = socket.userId; // We need to get userId from socket
    console.log(`User joining matchmaking for category ${categoryId}, mode: ${mode}, quizId: ${quizId}`);
    console.log('Socket userId:', userId);
    console.log('Socket id:', socket.id);
    
    if (!userId) {
      console.log('❌ No userId found, cannot proceed with wallet check');
      socket.emit('matchmaking_error', { message: 'User not authenticated' });
      return;
    }
    
    // Get battle quiz details from database
    let battleQuiz = null;
    let entryFee = 10; // Default fallback
    
    try {
      if (quizId) {
        // Get specific battle quiz
        battleQuiz = await prisma.battleQuiz.findUnique({
          where: { id: quizId },
          select: { 
            id: true, 
            title: true, 
            entryAmount: true, 
            questionCount: true, 
            timePerQuestion: true,
            isActive: true 
          }
        });
        
        if (!battleQuiz) {
          console.log('❌ Battle quiz not found:', quizId);
          socket.emit('matchmaking_error', { message: 'Battle quiz not found' });
          return;
        }
        
        if (!battleQuiz.isActive) {
          console.log('❌ Battle quiz is not active:', quizId);
          socket.emit('matchmaking_error', { message: 'This battle quiz is not active' });
          return;
        }
        
        entryFee = battleQuiz.entryAmount;
        console.log(`✅ Battle quiz found: ${battleQuiz.title}`);
        console.log(`   - Entry fee: ₹${entryFee}`);
        console.log(`   - Questions: ${battleQuiz.questionCount}`);
        console.log(`   - Time per question: ${battleQuiz.timePerQuestion}s`);
        
      } else if (categoryId) {
        // Get active battle quiz for this category
        battleQuiz = await prisma.battleQuiz.findFirst({
          where: { 
            categoryId: categoryId,
            isActive: true,
            isPrivate: false // Only public quizzes
          },
          select: { 
            id: true, 
            title: true, 
            entryAmount: true, 
            questionCount: true, 
            timePerQuestion: true 
          },
          orderBy: { createdAt: 'desc' }
        });
        
        if (battleQuiz) {
          entryFee = battleQuiz.entryAmount;
          console.log(`✅ Found active battle quiz for category: ${battleQuiz.title}`);
          console.log(`   - Entry fee: ₹${entryFee}`);
        } else {
          console.log(`⚠️ No active battle quiz found for category: ${categoryId}, using default`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching battle quiz:', error);
      socket.emit('matchmaking_error', { message: 'Error fetching battle quiz details' });
      return;
    }
    
    // Check user's wallet balance
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { wallet: true, name: true }
      });
      
      if (!user) {
        console.log('❌ User not found:', userId);
        socket.emit('matchmaking_error', { message: 'User not found' });
        return;
      }
      
      console.log(`💰 User wallet check: ${user.name} (${userId})`);
      console.log(`   - Current balance: ₹${user.wallet}`);
      console.log(`   - Required entry fee: ₹${entryFee}`);
      
      if (user.wallet < entryFee) {
        console.log('❌ Insufficient balance for user:', userId);
        socket.emit('matchmaking_error', { 
          message: `Insufficient balance. Required: ₹${entryFee}, Available: ₹${user.wallet}`,
          requiredAmount: entryFee,
          availableBalance: user.wallet
        });
        return;
      }
      
      console.log('✅ Sufficient balance confirmed');
      
    } catch (error) {
      console.error('❌ Error checking wallet balance:', error);
      socket.emit('matchmaking_error', { message: 'Error checking wallet balance' });
      return;
    }
    
    // Use quizId or categoryId for queue
    const queueId = quizId || categoryId || 'general';
    console.log('Using queueId:', queueId);
    
    const player = {
      userId: userId,
      socketId: socket.id,
      quizData: {
        quizId: battleQuiz?.id,
        categoryId,
        mode,
        questionCount: battleQuiz?.questionCount || 5,
        timePerQuestion: battleQuiz?.timePerQuestion || 10,
        entryFee: entryFee
      },
      joinedAt: Date.now()
    };
    
    // Use QueueManager to add player to queue
    await queueManager.addToQueue(userId, queueId, player);
    
    // Get queue length for logging
    const queueLength = await queueManager.getQueueLength(queueId);
    console.log(`Player added to queue. Queue size for ${queueId}:`, queueLength);
    
    socket.join(`quiz_${queueId}`);
    
    // Send matchmaking update
    socket.emit('matchmaking_update', {
      status: 'searching',
      estimatedWait: 30,
      message: 'Searching for opponent...',
      entryFee: entryFee,
      quizTitle: battleQuiz?.title
    });
    
    // Try to match players
    tryMatchPlayers(queueId).catch(error => {
      console.error('Error in tryMatchPlayers:', error);
    });
  });

  socket.on('cancel_matchmaking', async () => {
    console.log(`User ${socket.id} cancelled matchmaking`);
    
    // Remove from all waiting queues using QueueManager
    const allQueues = ['general']; // Add more quiz IDs as needed
    for (const quizId of allQueues) {
      const players = await queueManager.getQueue(quizId);
      const playerToRemove = players.find(p => p.socketId === socket.id);
      if (playerToRemove) {
        await queueManager.removeFromQueue(quizId, playerToRemove);
        console.log(`Removed player from quiz ${quizId}`);
      }
    }
    
    socket.emit('matchmaking_cancelled');
  });

  socket.on('create_private_room', (data) => {
    const { userId, quizData, roomCode } = data;
    console.log(`Creating private room ${roomCode} for user ${userId}`);
    
    const room = {
      roomCode,
      creator: userId,
      players: [{
        userId,
        socketId: socket.id,
        quizData
      }],
      maxPlayers: quizData.maxPlayers || 2,
      status: 'waiting',
      quizData
    };
    
    privateRooms.set(roomCode, room);
    socket.join(`room_${roomCode}`);
    
    socket.emit('private_room_created', { roomCode, room });
  });

  socket.on('join_private_room', (data) => {
    const { userId, roomCode, quizData } = data;
    console.log(`User ${userId} joining private room ${roomCode}`);
    
    const room = privateRooms.get(roomCode);
    if (!room) {
      socket.emit('room_error', { message: 'Room not found' });
      return;
    }
    
    if (room.players.length >= room.maxPlayers) {
      socket.emit('room_error', { message: 'Room is full' });
      return;
    }
    
    room.players.push({
      userId,
      socketId: socket.id,
      quizData
    });
    
    socket.join(`room_${roomCode}`);
    io.to(`room_${roomCode}`).emit('player_joined_room', { room });
    
    // Start game if room is full
    if (room.players.length >= room.maxPlayers) {
      startPrivateRoomGame(roomCode).catch(error => {
        console.error('Error in startPrivateRoomGame:', error);
      });
    }
  });

  socket.on('answer_question', (data) => {
    console.log('🎯 answer_question event received on server');
    console.log('   - Socket ID:', socket.id);
    console.log('   - Event data:', data);
    
    const { matchId, userId, questionIndex, answer, timeSpent } = data;
    console.log(`User ${userId} answered question ${questionIndex} in match ${matchId}`);
    console.log('Answer data:', { answer, timeSpent });
    
    const match = activeMatches.get(matchId);
    if (!match) {
      console.log('Match not found:', matchId);
      return;
    }
    
    console.log('Match found, current status:', match.status);
    console.log('Current question index:', match.currentQuestion);
    console.log('Total questions:', match.totalQuestions);
    
    // Record answer
    console.log('📝 Recording answer:');
    console.log('   - User ID:', userId);
    console.log('   - Player 1 ID:', match.player1Id);
    console.log('   - Player 2 ID:', match.player2Id);
    console.log('   - Is Player 1?', match.player1Id === userId);
    console.log('   - Is Player 2?', match.player2Id === userId);
    
    if (match.player1Id === userId) {
      match.player1Answers[questionIndex] = { answer, timeSpent, timestamp: Date.now() };
      console.log('✅ Player 1 answer recorded for question', questionIndex);
      console.log('   - Answer:', answer);
      console.log('   - Time spent:', timeSpent);
    } else if (match.player2Id === userId) {
      match.player2Answers[questionIndex] = { answer, timeSpent, timestamp: Date.now() };
      console.log('✅ Player 2 answer recorded for question', questionIndex);
      console.log('   - Answer:', answer);
      console.log('   - Time spent:', timeSpent);
    } else {
      console.log('❌ User ID not found in match players');
      console.log('   - Available player IDs:', [match.player1Id, match.player2Id]);
    }
    
    // Notify opponent that this player answered
    const opponentSocketId = match.player1Id === userId ? match.player2SocketId : match.player1SocketId;
    console.log('Notifying opponent at socket:', opponentSocketId);
    
    const opponentSocket = io.sockets.sockets.get(opponentSocketId);
    if (opponentSocket && opponentSocket.connected) {
      opponentSocket.emit('opponent_answered', { questionIndex });
      console.log('opponent_answered event sent to:', opponentSocketId);
    } else {
      console.log('Opponent socket not found or disconnected:', opponentSocketId);
    }
    
    // Check if both players answered
    const p1Answered = match.player1Answers[questionIndex];
    const p2Answered = match.player2Answers[questionIndex];
    console.log('📊 Answer status check:');
    console.log('   - Question index:', questionIndex);
    console.log('   - Player 1 ID:', match.player1Id);
    console.log('   - Player 2 ID:', match.player2Id);
    console.log('   - Player 1 socket ID:', match.player1SocketId);
    console.log('   - Player 2 socket ID:', match.player2SocketId);
    console.log('   - Current socket ID:', socket.id);
    console.log('   - Player 1 answered:', !!p1Answered, p1Answered);
    console.log('   - Player 2 answered:', !!p2Answered, p2Answered);
    console.log('   - All player 1 answers:', match.player1Answers);
    console.log('   - All player 2 answers:', match.player2Answers);
    
    if (p1Answered && p2Answered) {
      console.log('Both players answered question', questionIndex);
      console.log('📊 Question progression check:');
      console.log(`   - Current question index: ${questionIndex}`);
      console.log(`   - Total questions: ${match.totalQuestions}`);
      console.log(`   - Questions array length: ${match.questions.length}`);
      console.log(`   - Condition check: ${questionIndex} < ${match.totalQuestions - 1} = ${questionIndex < match.totalQuestions - 1}`);
      
      // Move to next question or end game
      setTimeout(() => {
        if (questionIndex < match.totalQuestions - 1) {
          match.currentQuestion = questionIndex + 1;
          const nextQuestion = match.questions[match.currentQuestion];
          console.log('🔄 Moving to next question:', match.currentQuestion);
          console.log('Next question:', nextQuestion);
          console.log('Question text:', nextQuestion.text.substring(0, 50) + '...');
          
          // Get the actual socket objects
          const player1Socket = io.sockets.sockets.get(match.player1SocketId);
          const player2Socket = io.sockets.sockets.get(match.player2SocketId);
          
          if (player1Socket && player1Socket.connected) {
            console.log('Sending next_question to player 1:', match.player1SocketId);
            player1Socket.emit('next_question', {
              questionIndex: match.currentQuestion,
              question: nextQuestion
            });
          } else {
            console.log('Player 1 socket not found or disconnected:', match.player1SocketId);
          }
          
          if (player2Socket && player2Socket.connected) {
            console.log('Sending next_question to player 2:', match.player2SocketId);
            player2Socket.emit('next_question', {
              questionIndex: match.currentQuestion,
              question: nextQuestion
            });
          } else {
            console.log('Player 2 socket not found or disconnected:', match.player2SocketId);
          }
        } else {
          console.log('🏁 All questions answered, ending match');
          console.log(`   - Final question index: ${questionIndex}`);
          console.log(`   - Total questions: ${match.totalQuestions}`);
          endMatch(matchId);
        }
      }, 3000); // 3 second delay between questions to ensure client is ready
    } else {
      console.log('⏳ Waiting for other player to answer...');
    }
  });

  socket.on('leave_battle_queue', async (quizId) => {
    const players = await queueManager.getQueue(quizId);
    const playerToRemove = players.find(p => p.socketId === socket.id);
    if (playerToRemove) {
      await queueManager.removeFromQueue(quizId, playerToRemove);
      console.log(`Player left battle queue for quiz ${quizId}`);
    }
    socket.leave(`quiz_${quizId}`);
  });

  // Chat Events
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on('private_message', (data) => {
    console.log('Received private_message event:', data);
    const { message } = data;
    const receiverId = message.receiver.id;
    const receiverSocketId = userSockets[receiverId];

    console.log(`Looking for receiver ${receiverId}, socket ID: ${receiverSocketId}`);
    console.log('All connected users:', Object.keys(userSockets));

    if (receiverSocketId) {
      // Send the message directly to the specific socket of the receiver
      io.to(receiverSocketId).emit('new_message', message);
      console.log(`Message sent to user ${receiverId} via socket ${receiverSocketId}`);
    } else {
      console.log(`User ${receiverId} is not connected, message will be delivered on next login.`);
    }
  });

  socket.on('start_typing', ({ chatId }) => {
    socket.to(chatId).emit('user_typing');
  });

  socket.on('stop_typing', ({ chatId }) => {
    socket.to(chatId).emit('user_stopped_typing');
  });

  socket.on('notify_messages_read', ({ readerId, otherUserId }) => {
    const otherUserSocketId = userSockets[otherUserId];
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit('messages_were_read', { readerId });
    }
  });

  socket.on('get_match_status', (data) => {
    const { matchId } = data;
    console.log(`User requesting match status for: ${matchId}`);
    console.log('Active matches:', Array.from(activeMatches.keys()));
    
    const match = activeMatches.get(matchId);
    if (!match) {
      console.log('Match not found, sending error');
      socket.emit('match_not_found', { matchId });
      return;
    }
    
    console.log('Match found, status:', match.status);
    console.log('Current question index:', match.currentQuestion);
    console.log('Total questions:', match.totalQuestions);
    
    // Update socket IDs if they have changed
    const user = socket.userId;
    if (user) {
      if (match.player1Id === user) {
        if (match.player1SocketId !== socket.id) {
          console.log(`Updating player 1 socket ID: ${match.player1SocketId} -> ${socket.id}`);
          match.player1SocketId = socket.id;
        }
      } else if (match.player2Id === user) {
        if (match.player2SocketId !== socket.id) {
          console.log(`Updating player 2 socket ID: ${match.player2SocketId} -> ${socket.id}`);
          match.player2SocketId = socket.id;
        }
      }
    }
    
    // Send current match status
    if (match.status === 'playing') {
      const currentQuestion = match.questions[match.currentQuestion];
      console.log('Sending current question:', currentQuestion);
      socket.emit('match_started', {
        matchId,
        questionIndex: match.currentQuestion,
        question: currentQuestion,
        timeLimit: 15
      });
    } else if (match.status === 'finished') {
      console.log('Match is finished, sending results');
      // Calculate final results
      let player1Score = 0;
      let player2Score = 0;
      
      for (let i = 0; i < match.totalQuestions; i++) {
        const p1Answer = match.player1Answers[i];
        const p2Answer = match.player2Answers[i];
        
        if (p1Answer && p1Answer.answer === match.questions[i].correct) {
          player1Score += 10;
        }
        if (p2Answer && p2Answer.answer === match.questions[i].correct) {
          player2Score += 10;
        }
      }
      
      const winner = player1Score > player2Score ? match.player1Id : 
                    player2Score > player1Score ? match.player2Id : null;
      
      socket.emit('match_ended', {
        matchId,
        player1Score,
        player2Score,
        winner,
        isDraw: player1Score === player2Score
      });
    } else {
      console.log('Match status is:', match.status, '- sending match_started anyway');
      // If match is in 'starting' status, send the first question
      const firstQuestion = match.questions[0];
      socket.emit('match_started', {
        matchId,
        questionIndex: 0,
        question: firstQuestion,
        timeLimit: 10
      });
    }
  });

  socket.on('ping', () => {
    console.log('🏓 Received ping from socket:', socket.id);
    socket.emit('pong');
    console.log('🏓 Sent pong to socket:', socket.id);
  });

  socket.on('disconnect', async () => {
    console.log('🔌 Client disconnected:', socket.id);
    console.log('   - Time:', new Date().toISOString());
    console.log('   - Total connections:', io.engine.clientsCount);
    
    // Remove user from mapping
    const userId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
    if (userId) {
      delete userSockets[userId];
      console.log(`User ${userId} disconnected`);
    }
    
    // Remove from waiting queues using QueueManager
    const allQueues = ['general']; // Add more quiz IDs as needed
    for (const quizId of allQueues) {
      const players = await queueManager.getQueue(quizId);
      const playerToRemove = players.find(p => p.socketId === socket.id);
      if (playerToRemove) {
        await queueManager.removeFromQueue(quizId, playerToRemove);
        console.log(`Removed disconnected player from quiz ${quizId}`);
      }
    }
  });

  // Test wallet update endpoint
  socket.on('test_wallet_update', async (data) => {
    const { userId, amount } = data;
    console.log(`🧪 Testing wallet update for user ${userId} with amount ${amount}`);
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, wallet: true }
      });
      
      console.log(`💰 Current wallet:`, user);
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { wallet: { increment: amount } }
      });
      
      console.log(`✅ Wallet updated: ${user?.wallet} → ${updatedUser.wallet}`);
      
      socket.emit('test_wallet_result', {
        success: true,
        oldBalance: user?.wallet,
        newBalance: updatedUser.wallet,
        increment: amount
      });
      
    } catch (error) {
      console.error('❌ Test wallet update failed:', error);
      socket.emit('test_wallet_result', {
        success: false,
        error: error.message
      });
    }
  });
});

// Helper Functions
async function tryMatchPlayers(quizId) {
  const players = await queueManager.getQueue(quizId);
  console.log(`Trying to match players for quizId: ${quizId}`);
  console.log('Players in queue:', players);
  
  if (!players || players.length < 2) {
    console.log(`Not enough players to match. Players: ${players?.length || 0}`);
    return;
  }
  
  // Sort by join time (FIFO)
  players.sort((a, b) => a.joinedAt - b.joinedAt);
  console.log('Sorted players:', players.map(p => ({ userId: p.userId, joinedAt: p.joinedAt })));
  
  while (players.length >= 2) {
    const player1 = players.shift();
    const player2 = players.shift();
    
    console.log(`Matching players ${player1.userId} and ${player2.userId} for quiz ${quizId}`);
    
    // Remove matched players from queue
    await queueManager.removeFromQueue(quizId, player1);
    await queueManager.removeFromQueue(quizId, player2);
    
    // Deduct entry fees from both players
    const entryFee = player1.quizData.entryFee || 10;
    console.log(`💰 Deducting entry fees: ₹${entryFee} from each player`);
    
    try {
      // Use transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Deduct from player 1
        await tx.user.update({
          where: { id: player1.userId },
          data: { wallet: { decrement: entryFee } }
        });
        
        // Deduct from player 2
        await tx.user.update({
          where: { id: player2.userId },
          data: { wallet: { decrement: entryFee } }
        });
        
        // Create transaction records
        await tx.transaction.createMany({
          data: [
            {
              userId: player1.userId,
              amount: -entryFee,
              type: 'BATTLE_QUIZ_ENTRY',
              status: 'COMPLETED'
            },
            {
              userId: player2.userId,
              amount: -entryFee,
              type: 'BATTLE_QUIZ_ENTRY',
              status: 'COMPLETED'
            }
          ]
        });
      });
      
      console.log('✅ Entry fees deducted successfully');
      
    } catch (error) {
      console.error('❌ Error deducting entry fees:', error);
      // Refund if there was an error
      try {
        await prisma.user.update({
          where: { id: player1.userId },
          data: { wallet: { increment: entryFee } }
        });
        await prisma.user.update({
          where: { id: player2.userId },
          data: { wallet: { increment: entryFee } }
        });
        console.log('💰 Entry fees refunded due to error');
      } catch (refundError) {
        console.error('❌ Error refunding entry fees:', refundError);
      }
      
      // Put players back in queue
      await queueManager.addToQueue(player1.userId, quizId, player1);
      await queueManager.addToQueue(player2.userId, quizId, player2);
      
      console.log('❌ Failed to process entry fees, players returned to queue');
      return;
    }
    
    // Create match
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Generating questions for match with quiz data:', player1.quizData);
    const questions = await generateQuestions(player1.quizData);
    console.log('Generated questions:', questions);
    
    console.log('📊 Creating match with details:');
    console.log(`   - Player 1 quiz data:`, player1.quizData);
    console.log(`   - Question count from quiz data: ${player1.quizData.questionCount}`);
    console.log(`   - Questions array length: ${questions.length}`);
    console.log(`   - Entry fee: ${entryFee}`);
    
    const match = {
      id: matchId,
      quizId,
      player1Id: player1.userId,
      player2Id: player2.userId,
      player1SocketId: player1.socketId,
      player2SocketId: player2.socketId,
      status: 'starting',
      currentQuestion: 0,
      totalQuestions: player1.quizData.questionCount || 5,
      questions: questions,
      player1Answers: {},
      player2Answers: {},
      player1Score: 0,
      player2Score: 0,
      startTime: Date.now(),
      entryFee: entryFee, // Store entry fee for winnings calculation
      totalPrizePool: entryFee * 2 // Total pool from both players
    };
    
    console.log(`✅ Match created with ${match.totalQuestions} total questions`);
    
    activeMatches.set(matchId, match);
    console.log('Match created:', matchId);
    console.log('Match details:', {
      id: match.id,
      status: match.status,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      totalQuestions: match.totalQuestions,
      questionsCount: match.questions.length
    });
    console.log('Active matches after creation:', Array.from(activeMatches.keys()));
    
    // Notify players with the events the frontend expects
    const player1Socket = io.sockets.sockets.get(player1.socketId);
    const player2Socket = io.sockets.sockets.get(player2.socketId);
    
    if (player1Socket && player1Socket.connected) {
      console.log('Sending opponent_found to player1:', player1.socketId);
      player1Socket.emit('opponent_found', { 
        opponent: { id: player2.userId, name: `Player ${player2.userId.slice(-4)}` },
        category: player1.quizData.categoryId
      });
    } else {
      console.log('Player 1 socket not found or disconnected:', player1.socketId);
    }
    
    if (player2Socket && player2Socket.connected) {
      console.log('Sending opponent_found to player2:', player2.socketId);
      player2Socket.emit('opponent_found', { 
        opponent: { id: player1.userId, name: `Player ${player1.userId.slice(-4)}` },
        category: player2.quizData.categoryId
      });
    } else {
      console.log('Player 2 socket not found or disconnected:', player2.socketId);
    }
    
    // Start match after 3 seconds
    setTimeout(() => {
      // Send match starting event
      console.log('Sending match_starting to both players');
      const player1Socket = io.sockets.sockets.get(player1.socketId);
      const player2Socket = io.sockets.sockets.get(player2.socketId);
      
      if (player1Socket && player1Socket.connected) {
        player1Socket.emit('match_starting', { countdown: 3 });
      }
      if (player2Socket && player2Socket.connected) {
        player2Socket.emit('match_starting', { countdown: 3 });
      }
      
      setTimeout(() => {
        // Send match ready event
        console.log('Sending match_ready to both players');
        if (player1Socket && player1Socket.connected) {
          player1Socket.emit('match_ready', { matchId });
        }
        if (player2Socket && player2Socket.connected) {
          player2Socket.emit('match_ready', { matchId });
        }
        
        // Start the actual match after a short delay
        setTimeout(() => {
          console.log('Starting actual match after countdown');
          startMatch(matchId);
        }, 1000);
      }, 3000);
    }, 2000);
  }
}

function startMatch(matchId) {
  const match = activeMatches.get(matchId);
  if (!match) return;
  
  match.status = 'playing';
  console.log(`Starting match ${matchId}`);
  
  // Join both players to match room
  io.sockets.sockets.get(match.player1SocketId)?.join(`match_${matchId}`);
  io.sockets.sockets.get(match.player2SocketId)?.join(`match_${matchId}`);
  
  // Send first question to both players
  const firstQuestion = match.questions[0];
  console.log('Sending first question to players:', firstQuestion);
  console.log('Question text:', firstQuestion.text);
  console.log('Question options:', firstQuestion.options);
  console.log('Correct answer:', firstQuestion.correct);
  
  const matchStartedData = {
    matchId,
    questionIndex: 0,
    question: firstQuestion,
    timeLimit: 15
  };
  
  console.log('Sending match_started event with data:', matchStartedData);
  
  // Get the actual socket objects and emit directly
  const player1Socket = io.sockets.sockets.get(match.player1SocketId);
  const player2Socket = io.sockets.sockets.get(match.player2SocketId);
  
  if (player1Socket && player1Socket.connected) {
    console.log('Sending match_started to player 1:', match.player1SocketId);
    player1Socket.emit('match_started', matchStartedData);
  } else {
    console.log('Player 1 socket not found or disconnected:', match.player1SocketId);
  }
  
  if (player2Socket && player2Socket.connected) {
    console.log('Sending match_started to player 2:', match.player2SocketId);
    player2Socket.emit('match_started', matchStartedData);
  } else {
    console.log('Player 2 socket not found or disconnected:', match.player2SocketId);
  }
  
  console.log(`Match ${matchId} started with first question`);
}

async function startPrivateRoomGame(roomCode) {
  const room = privateRooms.get(roomCode);
  if (!room) return;
  
  const matchId = `private_${roomCode}_${Date.now()}`;
  const match = {
    id: matchId,
    roomCode,
    players: room.players,
    status: 'playing',
    currentQuestion: 0,
    totalQuestions: room.quizData.questionCount || 5,
    questions: await generateQuestions(room.quizData),
    playerAnswers: {},
    scores: {},
    startTime: Date.now()
  };
  
  activeMatches.set(matchId, match);
  
  // Notify all players
  io.to(`room_${roomCode}`).emit('private_game_started', {
    matchId,
    questionIndex: 0,
    question: match.questions[0],
    timeLimit: room.quizData.timePerQuestion || 15
  });
  
  console.log(`Private room game started: ${roomCode}`);
}

async function endMatch(matchId) {
  const match = activeMatches.get(matchId);
  if (!match) return;
  
  console.log(`Ending match ${matchId}`);
  
  // Calculate scores
  let player1Score = 0;
  let player2Score = 0;
  
  for (let i = 0; i < match.totalQuestions; i++) {
    const p1Answer = match.player1Answers[i];
    const p2Answer = match.player2Answers[i];
    
    if (p1Answer && p1Answer.answer === match.questions[i].correct) {
      player1Score += 10;
    }
    if (p2Answer && p2Answer.answer === match.questions[i].correct) {
      player2Score += 10;
    }
  }
  
  console.log('🏆 Score calculation:');
  console.log(`   - Player 1 (${match.player1Id}): ${player1Score} points`);
  console.log(`   - Player 2 (${match.player2Id}): ${player2Score} points`);
  console.log(`   - Player 1 answers:`, match.player1Answers);
  console.log(`   - Player 2 answers:`, match.player2Answers);
  
  const winner = player1Score > player2Score ? match.player1Id : 
                player2Score > player1Score ? match.player2Id : null;
  
  console.log(`🏆 Winner determination: ${winner || 'DRAW'}`);
  
  // Calculate winnings (80% to winner, 20% admin commission)
  const totalPrizePool = match.totalPrizePool || (match.entryFee * 2) || 20;
  const winnerPrize = totalPrizePool * 0.8; // 80% to winner
  const adminCommission = totalPrizePool * 0.2; // 20% admin commission
  
  console.log('💰 Winnings calculation:');
  console.log(`   - Total prize pool: ₹${totalPrizePool}`);
  console.log(`   - Winner prize: ₹${winnerPrize}`);
  console.log(`   - Admin commission: ₹${adminCommission}`);
  console.log(`   - Winner: ${winner}`);
  console.log(`   - Entry fee: ₹${match.entryFee}`);
  console.log(`   - Match object:`, {
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    totalPrizePool: match.totalPrizePool,
    entryFee: match.entryFee
  });
  
  // Distribute winnings based on result
  if (winner) {
    // There's a winner - 80% to winner, 20% admin commission
    console.log(`🎯 Processing winner distribution for: ${winner}`);
    console.log(`   - Winner prize amount: ₹${winnerPrize}`);
    
    try {
      // First, let's check the winner's current wallet balance
      const winnerUser = await prisma.user.findUnique({
        where: { id: winner },
        select: { id: true, name: true, wallet: true }
      });
      
      console.log(`💰 Winner's current wallet:`, winnerUser);
      
      await prisma.$transaction(async (tx) => {
        console.log(`🔄 Starting database transaction...`);
        
        // Add winnings to winner's wallet
        const updatedUser = await tx.user.update({
          where: { id: winner },
          data: { wallet: { increment: winnerPrize } }
        });
        
        console.log(`✅ Wallet updated: ${winnerUser?.wallet} → ${updatedUser.wallet}`);
        
        // Create transaction record for winner
        const transactionRecord = await tx.transaction.create({
          data: {
            userId: winner,
            amount: winnerPrize,
            type: 'BATTLE_QUIZ_WIN',
            status: 'COMPLETED'
          }
        });
        
        console.log(`✅ Transaction record created:`, transactionRecord);
        
        // Create battle quiz winner record
        const winnerRecord = await tx.battleQuizWinner.create({
          data: {
            quizId: match.quizId || 'general',
            userId: winner,
            rank: 1,
            prizeAmount: winnerPrize,
            paid: true
          }
        });
        
        console.log(`✅ Battle quiz winner record created:`, winnerRecord);
      });
      
      console.log(`✅ Winnings distributed to winner: ${winner}`);
      console.log(`   - Winner received: ₹${winnerPrize}`);
      console.log(`   - Admin commission: ₹${adminCommission}`);
      
    } catch (error) {
      console.error('❌ Error distributing winnings:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta
      });
    }
  } else {
    // It's a draw - 90% back to each player, 10% admin commission from each
    const drawRefund = match.entryFee * 0.9; // 90% back to each player
    const drawCommission = match.entryFee * 0.1; // 10% admin commission from each
    
    console.log('🤝 Draw detected - distributing refunds:');
    console.log(`   - Each player gets back: ₹${drawRefund}`);
    console.log(`   - Admin commission from each: ₹${drawCommission}`);
    
    try {
      await prisma.$transaction(async (tx) => {
        // Refund 90% to player 1
        await tx.user.update({
          where: { id: match.player1Id },
          data: { wallet: { increment: drawRefund } }
        });
        
        // Refund 90% to player 2
        await tx.user.update({
          where: { id: match.player2Id },
          data: { wallet: { increment: drawRefund } }
        });
        
        // Create transaction records for refunds
        await tx.transaction.create({
          data: {
            userId: match.player1Id,
            amount: drawRefund,
            type: 'BATTLE_QUIZ_DRAW_REFUND',
            status: 'COMPLETED'
          }
        });
        
        await tx.transaction.create({
          data: {
            userId: match.player2Id,
            amount: drawRefund,
            type: 'BATTLE_QUIZ_DRAW_REFUND',
            status: 'COMPLETED'
          }
        });
      });
      
      console.log(`✅ Draw refunds distributed to both players`);
      console.log(`   - Player 1 (${match.player1Id}) received: ₹${drawRefund}`);
      console.log(`   - Player 2 (${match.player2Id}) received: ₹${drawRefund}`);
      
    } catch (error) {
      console.error('❌ Error distributing draw refunds:', error);
    }
  }
  
  const results = {
    matchId,
    player1Score,
    player2Score,
    winner,
    isDraw: player1Score === player2Score,
    winnerPrize: winner ? winnerPrize : 0,
    totalPrizePool,
    drawRefund: player1Score === player2Score ? match.entryFee * 0.9 : 0,
    adminCommission: winner ? adminCommission : match.entryFee * 0.2
  };
  
  console.log('Match results:', results);
  
  // Send results to both players with their perspective
  const player1Socket = io.sockets.sockets.get(match.player1SocketId);
  const player2Socket = io.sockets.sockets.get(match.player2SocketId);
  
  // Player 1's perspective
  const player1Results = {
    matchId,
    myScore: player1Score,
    opponentScore: player2Score,
    winner: winner === match.player1Id ? 'you' : winner === match.player2Id ? 'opponent' : 'draw',
    isDraw: player1Score === player2Score,
    winnerPrize: winner === match.player1Id ? winnerPrize : 0,
    totalPrizePool,
    drawRefund: player1Score === player2Score ? match.entryFee * 0.9 : 0,
    adminCommission: winner ? adminCommission : match.entryFee * 0.2
  };
  
  // Player 2's perspective
  const player2Results = {
    matchId,
    myScore: player2Score,
    opponentScore: player1Score,
    winner: winner === match.player2Id ? 'you' : winner === match.player1Id ? 'opponent' : 'draw',
    isDraw: player1Score === player2Score,
    winnerPrize: winner === match.player2Id ? winnerPrize : 0,
    totalPrizePool,
    drawRefund: player1Score === player2Score ? match.entryFee * 0.9 : 0,
    adminCommission: winner ? adminCommission : match.entryFee * 0.2
  };
  
  if (player1Socket && player1Socket.connected) {
    console.log('Sending match_ended to player 1:', match.player1SocketId);
    console.log('Player 1 results:', player1Results);
    player1Socket.emit('match_ended', player1Results);
  } else {
    console.log('Player 1 socket not found or disconnected:', match.player1SocketId);
  }
  
  if (player2Socket && player2Socket.connected) {
    console.log('Sending match_ended to player 2:', match.player2SocketId);
    console.log('Player 2 results:', player2Results);
    player2Socket.emit('match_ended', player2Results);
  } else {
    console.log('Player 2 socket not found or disconnected:', match.player2SocketId);
  }
  
  // Clean up
  activeMatches.delete(matchId);
  
  console.log(`Match ${matchId} ended. Winner: ${winner}, Prize: ₹${winnerPrize}`);
}

async function generateQuestions(quizData) {
  try {
    console.log('🎯 Generating questions for quiz data:', quizData);
    console.log('Category ID:', quizData.categoryId);
    console.log('Required question count:', quizData.questionCount);
    
    // Always try to fetch questions from database first
    if (quizData.categoryId) {
      console.log('📚 Fetching questions from category:', quizData.categoryId);
      
      const questions = await prisma.questionBankItem.findMany({
        where: {
          categoryId: quizData.categoryId,
          isActive: true
        },
        select: {
          id: true,
          text: true,
          options: true,
          correct: true,
          explanation: true
        }
      });
      
      console.log(`📊 Found ${questions.length} questions in category ${quizData.categoryId}`);
      
      if (questions.length > 0) {
        // Shuffle and pick random questions
        const shuffled = questions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, quizData.questionCount || 5);
        
        console.log(`✅ Selected ${selectedQuestions.length} questions from database`);
        console.log(`   - Required: ${quizData.questionCount || 5}`);
        console.log(`   - Available: ${questions.length}`);
        console.log(`   - Selected: ${selectedQuestions.length}`);
        
        return selectedQuestions.map((q, index) => ({
          id: index,
          text: q.text,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation
        }));
      } else {
        console.log('⚠️ No questions found in category, trying to fetch any active questions');
        
        // If no questions in specific category, try to get any active questions
        const allQuestions = await prisma.questionBankItem.findMany({
          where: {
            isActive: true
          },
          select: {
            id: true,
            text: true,
            options: true,
            correct: true,
            explanation: true
          }
        });
        
        console.log(`📊 Found ${allQuestions.length} total active questions`);
        
        if (allQuestions.length > 0) {
          const shuffled = allQuestions.sort(() => 0.5 - Math.random());
          const selectedQuestions = shuffled.slice(0, quizData.questionCount || 5);
          
          console.log(`✅ Selected ${selectedQuestions.length} questions from all categories`);
          
          return selectedQuestions.map((q, index) => ({
            id: index,
            text: q.text,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation
          }));
        }
      }
    }
    
    // Fallback to dummy questions if no database questions found
    console.log('🔄 No questions found in database, using dummy questions');
    const questions = [];
    for (let i = 0; i < (quizData.questionCount || 5); i++) {
      questions.push({
        id: i,
        text: `Test Question ${i + 1}: What is the capital of India?`,
        options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
        correct: 1, // Delhi
        explanation: 'Delhi is the capital of India.'
      });
    }
    console.log(`✅ Generated ${questions.length} dummy questions`);
    return questions;
  } catch (error) {
    console.error('❌ Error generating questions:', error);
    // Fallback to dummy questions
    const questions = [];
    for (let i = 0; i < (quizData.questionCount || 5); i++) {
      questions.push({
        id: i,
        text: `Fallback Question ${i + 1}: What is 2 + 2?`,
        options: ['3', '4', '5', '6'],
        correct: 1, // 4
        explanation: '2 + 2 = 4'
      });
    }
    console.log(`✅ Generated ${questions.length} fallback questions`);
    return questions;
  }
}

// Redis monitoring function
function monitorRedis() {
  setInterval(async () => {
    try {
      if (redisConnected && redis) {
        const info = await redis.info();
        const memory = await redis.info('memory');
        const keys = await redis.dbsize();
        
        console.log('📊 Redis Status:', {
          connected: redisConnected,
          keys: keys,
          memory: memory.split('\r\n')[1] || 'N/A'
        });
      } else {
        console.log('📊 Redis Status: Disconnected (using memory fallback)');
      }
    } catch (error) {
      console.log('❌ Redis monitoring error:', error.message);
    }
  }, 30000); // Every 30 seconds
}

// Start Redis monitoring
monitorRedis();

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🎮 Battle Quiz matchmaking enabled`);
  console.log(`📊 Redis integration: ${redisConnected ? '✅ Connected' : '❌ Disconnected (using memory fallback)'}`);
  console.log(`🧹 Memory cleanup: ✅ Enabled (every 60 seconds)`);
  console.log(`📈 Redis monitoring: ✅ Enabled (every 30 seconds)`);
}); 