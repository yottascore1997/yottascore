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

// Spy Game Data
const spyGames = new Map(); // gameId -> game data
const spyGamePlayers = new Map(); // socketId -> gameId

// Word Packs for Spy Game
const wordPacks = {
  default: [
    { word: "Pizza", spyWord: "Burger" },
    { word: "Beach", spyWord: "Mountain" },
    { word: "Coffee", spyWord: "Tea" },
    { word: "Movie", spyWord: "Book" },
    { word: "Summer", spyWord: "Winter" },
    { word: "Dog", spyWord: "Cat" },
    { word: "Car", spyWord: "Bike" },
    { word: "Phone", spyWord: "Computer" },
    { word: "Music", spyWord: "Dance" },
    { word: "Sleep", spyWord: "Wake" }
  ],
  funny: [
    { word: "Dancing", spyWord: "Singing" },
    { word: "Jokes", spyWord: "Stories" },
    { word: "Party", spyWord: "Meeting" },
    { word: "Laugh", spyWord: "Cry" },
    { word: "Fun", spyWord: "Work" }
  ],
  hard: [
    { word: "Philosophy", spyWord: "Psychology" },
    { word: "Quantum", spyWord: "Classical" },
    { word: "Algorithm", spyWord: "Formula" },
    { word: "Synthesis", spyWord: "Analysis" },
    { word: "Paradigm", spyWord: "Model" }
  ]
};

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

  socket.on('join_private_room', async (data) => {
    console.log('🎮 join_private_room event received on server');
    console.log('   - Full data:', data);
    console.log('   - Socket ID:', socket.id);
    console.log('   - Socket userId:', socket.userId);
    
    const { userId, roomCode, quizData } = data;
    console.log(`User ${userId} joining private room ${roomCode}`);
    
    // First check if room exists in memory
    let room = privateRooms.get(roomCode);
    
    // If not in memory, check database
    if (!room) {
      console.log(`Room ${roomCode} not found in memory, checking database...`);
      try {
        const dbRoom = await prisma.battleQuiz.findUnique({
          where: { roomCode, isPrivate: true },
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, profilePhoto: true }
                }
              }
            },
            category: true
          }
        });
        
        if (!dbRoom) {
          console.log(`Room ${roomCode} not found in database`);
          socket.emit('room_error', { message: 'Room not found' });
          return;
        }
        
        console.log(`Room ${roomCode} found in database, creating in memory`);
        
        console.log(`Database room participants:`, dbRoom.participants);
        console.log(`Room creator:`, dbRoom.createdById);
        console.log(`Room creator type:`, typeof dbRoom.createdById);
        console.log(`Database room data:`, {
          id: dbRoom.id,
          roomCode: dbRoom.roomCode,
          createdById: dbRoom.createdById,
          participants: dbRoom.participants.map(p => p.userId)
        });
        
        // Create room in memory from database
        room = {
          roomCode: dbRoom.roomCode,
          creator: dbRoom.createdById,
          players: dbRoom.participants.map(p => ({
            userId: p.userId,
            socketId: null, // Will be updated when they join
            quizData: {
              categoryId: dbRoom.categoryId,
              questionCount: dbRoom.questionCount,
              timePerQuestion: dbRoom.timePerQuestion
            }
          })),
          maxPlayers: dbRoom.maxPlayers,
          status: 'waiting',
          quizData: {
            categoryId: dbRoom.categoryId,
            questionCount: dbRoom.questionCount,
            timePerQuestion: dbRoom.timePerQuestion
          },
          dbRoomId: dbRoom.id
        };
        
        console.log(`Created room in memory:`, {
          roomCode: room.roomCode,
          creator: room.creator,
          players: room.players.map(p => p.userId),
          maxPlayers: room.maxPlayers
        });
        
        privateRooms.set(roomCode, room);
        
      } catch (error) {
        console.error('Error checking database for room:', error);
        socket.emit('room_error', { message: 'Error finding room' });
        return;
      }
    }
    
    // Check if user is already in the room
    const existingPlayer = room.players.find(p => p.userId === userId);
    if (existingPlayer) {
      // Update socket ID if reconnecting
      existingPlayer.socketId = socket.id;
      console.log(`User ${userId} reconnected to room ${roomCode}`);
    } else {
      // Add new player
      if (room.players.length >= room.maxPlayers) {
        socket.emit('room_error', { message: 'Room is full' });
        return;
      }
      
      // Add to database if room was created from database
      if (room.dbRoomId) {
        try {
          await prisma.battleQuizParticipant.create({
            data: {
              quizId: room.dbRoomId,
              userId: userId,
              status: 'WAITING',
              answers: []
            }
          });
          console.log(`User ${userId} added to database participants`);
        } catch (error) {
          console.error('Error adding user to database:', error);
          // Continue anyway, just log the error
        }
      }
      
      // Add to memory
      room.players.push({
        userId,
        socketId: socket.id,
        quizData: quizData || room.quizData
      });
      
      console.log(`User ${userId} joined room ${roomCode}`);
      console.log(`Room ${roomCode} now has ${room.players.length} players:`, room.players.map(p => p.userId));
    }
    
    socket.join(`room_${roomCode}`);
    
    console.log(`Sending room_joined event to user ${userId}:`);
    console.log(`   - Room players:`, room.players.map(p => p.userId));
    console.log(`   - Room creator:`, room.creator);
    console.log(`   - Current user ID:`, userId);
    console.log(`   - User is host:`, userId === room.creator);
    console.log(`   - Room creator type:`, typeof room.creator);
    console.log(`   - User ID type:`, typeof userId);
    
    const roomJoinedData = {
      room: {
        roomCode: room.roomCode,
        host: room.players.find(p => p.userId === room.creator) ? {
          id: room.creator,
          name: 'Host', // You might want to fetch this from database
          isHost: true
        } : null,
        players: room.players.map(p => ({
          id: p.userId,
          name: p.userId === room.creator ? 'Host' : 'Player',
          isHost: p.userId === room.creator
        })),
        maxPlayers: room.maxPlayers,
        status: room.status,
        countdown: 0,
        category: room.quizData.categoryId,
        timePerQuestion: room.quizData.timePerQuestion,
        questionCount: room.quizData.questionCount
      },
      user: {
        id: userId,
        name: 'User', // You might want to fetch this from database
        isHost: userId === room.creator
      },
      isHost: userId === room.creator
    };
    
    console.log(`   - Room joined data:`, roomJoinedData);
    
    // Send room joined event to the user
    socket.emit('room_joined', roomJoinedData);
    
    // Notify other players about the new player
    socket.to(`room_${roomCode}`).emit('player_joined', { 
      player: {
        id: userId,
        name: 'Player',
        isHost: userId === room.creator
      }
    });
    
    // Also notify about room state update
    socket.to(`room_${roomCode}`).emit('room_updated', { 
      room: {
        roomCode: room.roomCode,
        host: room.players.find(p => p.userId === room.creator) ? {
          id: room.creator,
          name: 'Host',
          isHost: true
        } : null,
        players: room.players.map(p => ({
          id: p.userId,
          name: p.userId === room.creator ? 'Host' : 'Player',
          isHost: p.userId === room.creator
        })),
        maxPlayers: room.maxPlayers,
        status: room.status,
        countdown: 0,
        category: room.quizData.categoryId,
        timePerQuestion: room.quizData.timePerQuestion,
        questionCount: room.quizData.questionCount
      }
    });
    
    // Start game if room is full
    if (room.players.length >= room.maxPlayers) {
      startPrivateRoomGame(roomCode).catch(error => {
        console.error('Error in startPrivateRoomGame:', error);
      });
    }
  });

  socket.on('start_private_game', async (data) => {
    console.log('🎮 start_private_game event received');
    console.log('   - Room code:', data.roomCode);
    console.log('   - Socket ID:', socket.id);
    
    const { roomCode } = data;
    const room = privateRooms.get(roomCode);
    
    if (!room) {
      console.log('❌ Room not found:', roomCode);
      socket.emit('room_error', { message: 'Room not found' });
      return;
    }
    
    // Check if user is the host
    if (room.creator !== socket.userId) {
      console.log('❌ User is not the host');
      socket.emit('room_error', { message: 'Only the host can start the game' });
      return;
    }
    
    // Check if enough players
    if (room.players.length < 2) {
      console.log('❌ Not enough players:', room.players.length);
      socket.emit('room_error', { message: 'Need at least 2 players to start' });
      return;
    }
    
    console.log('✅ Starting private game for room:', roomCode);
    console.log('   - Players:', room.players.map(p => p.userId));
    console.log('   - Question count:', room.quizData.questionCount);
    console.log('   - Time per question:', room.quizData.timePerQuestion);
    
    // Start the game
    try {
      await startPrivateRoomGame(roomCode);
    } catch (error) {
      console.error('❌ Error starting private game:', error);
      socket.emit('room_error', { message: 'Failed to start game' });
    }
  });

  socket.on('answer_question', (data) => {
    console.log('🎯 answer_question event received on server');
    console.log('   - Socket ID:', socket.id);
    console.log('   - Event data:', data);
    console.log('   - Full data object:', JSON.stringify(data, null, 2));
    
    const { matchId, userId, questionIndex, answer, timeSpent } = data;
    console.log(`User ${userId} answered question ${questionIndex} in match ${matchId}`);
    console.log('Answer data:', { answer, timeSpent });
    console.log('Answer type:', typeof answer);
    console.log('Answer value:', answer);
    
    const match = activeMatches.get(matchId);
    if (!match) {
      console.log('❌ Match not found:', matchId);
      console.log('Available matches:', Array.from(activeMatches.keys()));
      return;
    }
    
    console.log('✅ Match found, current status:', match.status);
    console.log('Current question index:', match.currentQuestion);
    console.log('Total questions:', match.totalQuestions);
    console.log('Match details:', {
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      player1SocketId: match.player1SocketId,
      player2SocketId: match.player2SocketId
    });
    
    // Get the question to verify the correct answer
    const question = match.questions[questionIndex];
    if (question) {
      console.log('Question details:');
      console.log('   - Question text:', question.text);
      console.log('   - Options:', question.options);
      console.log('   - Correct answer (index):', question.correct);
      console.log('   - Correct answer (text):', question.options[question.correct]);
    } else {
      console.log('❌ Question not found for index:', questionIndex);
      console.log('Available questions:', match.questions.length);
    }
    
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
      console.log('   - Answer type:', typeof answer);
      console.log('   - All player 1 answers now:', match.player1Answers);
    } else if (match.player2Id === userId) {
      match.player2Answers[questionIndex] = { answer, timeSpent, timestamp: Date.now() };
      console.log('✅ Player 2 answer recorded for question', questionIndex);
      console.log('   - Answer:', answer);
      console.log('   - Time spent:', timeSpent);
      console.log('   - Answer type:', typeof answer);
      console.log('   - All player 2 answers now:', match.player2Answers);
    } else {
      console.log('❌ User ID not found in match players');
      console.log('   - Available player IDs:', [match.player1Id, match.player2Id]);
      console.log('   - Current user ID:', userId);
    }
    
    // Notify opponent that this player answered
    const opponentSocketId = match.player1Id === userId ? match.player2SocketId : match.player1SocketId;
    console.log('Notifying opponent at socket:', opponentSocketId);
    
    const opponentSocket = io.sockets.sockets.get(opponentSocketId);
    if (opponentSocket && opponentSocket.connected) {
      opponentSocket.emit('opponent_answered', { 
        questionIndex,
        answer: answer // Send the specific answer
      });
      console.log('opponent_answered event sent to:', opponentSocketId, 'with answer:', answer);
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
      console.log('✅ Both players answered question', questionIndex);
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
          console.log('   - Final player 1 answers:', match.player1Answers);
          console.log('   - Final player 2 answers:', match.player2Answers);
          endMatch(matchId);
        }
      }, 1000); // 1 second delay between questions to ensure client is ready
    } else {
      console.log('⏳ Waiting for other player to answer...');
      console.log('   - Player 1 answered:', !!p1Answered);
      console.log('   - Player 2 answered:', !!p2Answered);
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

  // Test event to verify socket communication
  socket.on('test_answer', (data) => {
    console.log('🧪 Test answer event received:');
    console.log('   - Socket ID:', socket.id);
    console.log('   - User ID:', socket.userId);
    console.log('   - Data:', data);
    console.log('   - Data type:', typeof data);
    console.log('   - Data stringified:', JSON.stringify(data, null, 2));
    
    // Send back a test response
    socket.emit('test_answer_response', {
      received: data,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
      userId: socket.userId
    });
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

  // Spy Game Events
  socket.on('create_spy_game', async (data) => {
    console.log('🎮 create_spy_game event received:', data);
    const { userId, maxPlayers = 6, wordPack = 'default' } = data;
    
    try {
      // Generate room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log(`Generated room code: ${roomCode}`);
      
      // Create game in database
      const game = await prisma.spyGame.create({
        data: {
          roomCode,
          hostId: userId,
          maxPlayers,
          wordPack
        }
      });
      
      console.log(`✅ Game created in database: ${game.id}`);
      
      // Add host as player
      await prisma.spyGamePlayer.create({
        data: {
          gameId: game.id,
          userId,
          isHost: true
        }
      });
      
      console.log(`✅ Host added as player`);
      
      // Create game in memory
      const gameData = {
        id: game.id,
        roomCode,
        hostId: userId,
        maxPlayers,
        wordPack,
        players: [{
          userId,
          socketId: socket.id,
          isHost: true,
          name: 'Host'
        }],
        status: 'WAITING',
        currentPhase: 'LOBBY',
        currentTurn: 0
      };
      
      spyGames.set(game.id, gameData);
      spyGamePlayers.set(socket.id, game.id);
      
      socket.join(`spy_game_${game.id}`);
      
      console.log(`✅ Game data created in memory`);
      console.log(`✅ Game ID: ${game.id}`);
      console.log(`✅ Room Code: ${roomCode}`);
      console.log(`✅ Total games in memory now: ${spyGames.size}`);
      console.log(`✅ Game data:`, JSON.stringify(gameData, null, 2));
      
      socket.emit('spy_game_created', {
        gameId: game.id,
        roomCode,
        game: gameData
      });
      
      console.log(`🎮 Spy game created: ${roomCode} by user ${userId}`);
      
    } catch (error) {
      console.error('❌ Error creating spy game:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error code:', error.code);
      socket.emit('spy_game_error', { message: 'Failed to create game: ' + error.message });
    }
  });

  socket.on('join_spy_game', async (data) => {
    console.log('🎮 join_spy_game event received:', data);
    const { userId, roomCode } = data;
    console.log(`🔍 Looking for game with room code: ${roomCode}`);
    console.log(`🔍 Current user ID: ${userId}`);
    
    try {
      // First check in-memory games
      console.log(`🔍 Checking in-memory games...`);
      console.log(`🔍 Total games in memory:`, spyGames.size);
      for (const [gameId, data] of spyGames.entries()) {
        console.log(`🔍 Game ${gameId}: roomCode=${data.roomCode}, players=${data.players.length}`);
      }
      
      let memoryGameData = null;
      for (const [gameId, data] of spyGames.entries()) {
        if (data.roomCode === roomCode) {
          memoryGameData = data;
          console.log(`✅ Found game in memory: ${gameId}`);
          break;
        }
      }
      
      // Find game by room code in database
      const game = await prisma.spyGame.findUnique({
        where: { roomCode },
        include: { players: true }
      });
      
      if (!game && !memoryGameData) {
        console.log(`❌ Game not found with room code: ${roomCode}`);
        socket.emit('spy_game_error', { message: 'Game not found' });
        return;
      }
      
      // If game exists in memory but not in database, use memory data
      if (!game && memoryGameData) {
        console.log(`⚠️ Game found in memory but not in database: ${roomCode}`);
        // We'll use the memory data for now
      }
      
      // Use database game or memory game data
      const gameToUse = game || memoryGameData;
      const gameStatus = game?.status || memoryGameData?.status;
      const gamePlayers = game?.players || memoryGameData?.players || [];
      const gameMaxPlayers = game?.maxPlayers || memoryGameData?.maxPlayers;
      
      if (gameStatus !== 'WAITING') {
        console.log(`❌ Game already started: ${roomCode}`);
        socket.emit('spy_game_error', { message: 'Game already started' });
        return;
      }
      
      if (gamePlayers.length >= gameMaxPlayers) {
        console.log(`❌ Game is full: ${roomCode}`);
        socket.emit('spy_game_error', { message: 'Game is full' });
        return;
      }
      
      // Check if player already in game
      const existingPlayer = gamePlayers.find(p => p.userId === userId);
      if (existingPlayer) {
        console.log(`❌ Player already in game: ${userId}`);
        console.log(`🔍 Existing player data:`, existingPlayer);
        console.log(`🔍 All players in game:`, gamePlayers);
        console.log(`🔍 Game to use:`, gameToUse);
        console.log(`🔍 Game ID:`, gameToUse?.id);
        
        // Instead of blocking, let's try to rejoin the game
        console.log(`🔄 Attempting to rejoin game for player: ${userId}`);
        
        // Get the game data and send it to the player
        let gameData = spyGames.get(gameToUse.id);
        console.log(`🔍 Game data from memory:`, gameData);
        if (!gameData) {
          gameData = {
            id: gameToUse.id,
            roomCode: gameToUse.roomCode,
            hostId: gameToUse.hostId,
            maxPlayers: gameToUse.maxPlayers,
            wordPack: gameToUse.wordPack,
            players: gamePlayers,
            status: gameToUse.status,
            currentPhase: gameToUse.currentPhase,
            currentTurn: gameToUse.currentTurn
          };
          spyGames.set(gameToUse.id, gameData);
        }
        
        // Update the player's socket ID
        const playerIndex = gameData.players.findIndex(p => p.userId === userId);
        if (playerIndex !== -1) {
          gameData.players[playerIndex].socketId = socket.id;
          console.log(`🔄 Updated socket ID for player ${userId} (isHost: ${gameData.players[playerIndex].isHost})`);
        }
        
        spyGamePlayers.set(socket.id, gameToUse.id);
        socket.join(`spy_game_${gameToUse.id}`);
        
        // Send the game data to the player
        console.log(`📤 Sending spy_game_joined event to player ${userId}`);
        socket.emit('spy_game_joined', {
          gameId: gameToUse.id,
          game: gameData
        });
        
        console.log(`✅ Player ${userId} rejoined spy game ${roomCode}`);
        return;
      }
      
      // Add player to database if game exists in database
      if (game) {
        try {
          await prisma.spyGamePlayer.create({
            data: {
              gameId: game.id,
              userId
            }
          });
          console.log(`✅ Player added to database`);
        } catch (error) {
          if (error.code === 'P2002' && error.message.includes('spy_game_players_gameId_userId_key')) {
            console.log(`ℹ️ Player already exists in database: ${userId}`);
            // This is fine, the player already exists in the database
          } else {
            throw error; // Re-throw other errors
          }
        }
      }
      
      // Get or create game data in memory
      let gameData = spyGames.get(gameToUse.id);
      if (!gameData) {
        // Create new game data with all existing players
        const allPlayers = [];
        
        // Add database players
        if (gameToUse.players) {
          allPlayers.push(...gameToUse.players.map(p => ({
            userId: p.userId,
            socketId: null,
            isHost: p.isHost,
            name: p.name || 'Player'
          })));
        }
        
        gameData = {
          id: gameToUse.id,
          roomCode: gameToUse.roomCode,
          hostId: gameToUse.hostId,
          maxPlayers: gameToUse.maxPlayers,
          wordPack: gameToUse.wordPack,
          players: allPlayers,
          status: gameToUse.status,
          currentPhase: gameToUse.currentPhase,
          currentTurn: gameToUse.currentTurn
        };
        spyGames.set(gameToUse.id, gameData);
        console.log(`🆕 Created new game data in memory with ${allPlayers.length} players`);
      } else {
        console.log(`📋 Using existing game data in memory with ${gameData.players.length} players`);
      }
      
      // Add player to memory
      const isHost = gameData.hostId === userId;
      gameData.players.push({
        userId,
        socketId: socket.id,
        isHost: isHost,
        name: 'Player'
      });
      
      console.log(`👤 Added player ${userId} to game (isHost: ${isHost})`);
      console.log(`📊 Total players in game: ${gameData.players.length}`);
      
      spyGamePlayers.set(socket.id, gameToUse.id);
      socket.join(`spy_game_${gameToUse.id}`);
      
      // Debug: Check who's in the room
      const room = io.sockets.adapter.rooms.get(`spy_game_${gameToUse.id}`);
      console.log(`🏠 Players in room spy_game_${gameToUse.id}:`, room ? Array.from(room) : 'No room found');
      console.log(`🏠 Total sockets in room:`, room ? room.size : 0);
      
      // Notify all players
      console.log(`📢 Sending player_joined_spy_game to all players in room spy_game_${gameToUse.id}`);
      console.log(`📢 Game data being sent:`, JSON.stringify(gameData, null, 2));
      
      io.to(`spy_game_${gameToUse.id}`).emit('player_joined_spy_game', {
        player: { userId, name: 'Player', isHost: isHost },
        game: gameData
      });
      
      // Notify the joining player
      console.log(`📢 Sending spy_game_joined to player ${userId}`);
      socket.emit('spy_game_joined', {
        gameId: gameToUse.id,
        game: gameData
      });
      
      console.log(`📢 Notified all players about new player. Total players: ${gameData.players.length}`);
      
      console.log(`🎮 Player ${userId} joined spy game ${roomCode}`);
      
    } catch (error) {
      console.error('❌ Error joining spy game:', error);
      socket.emit('spy_game_error', { message: 'Failed to join game: ' + error.message });
    }
  });

  // Test event to check if players can communicate
  socket.on('test_spy_game', (data) => {
    const { gameId, message } = data;
    console.log(`🧪 Test event received from ${socket.id}: ${message}`);
    console.log(`🧪 Game ID: ${gameId}`);
    
    // Send test message to all players in the game
    io.to(`spy_game_${gameId}`).emit('test_spy_game_response', {
      message: `Test from ${socket.id}: ${message}`,
      timestamp: new Date().toISOString()
    });
    
    // Also test the broadcast event
    console.log(`🧪 Testing broadcast event for game ${gameId}`);
    const gameData = spyGames.get(gameId);
    if (gameData) {
      const testPlayerWords = gameData.players.map((player, index) => ({
        userId: player.userId,
        word: `Test Word ${index + 1}`,
        isSpy: index === 0
      }));
      
      io.to(`spy_game_${gameId}`).emit('spy_game_started_broadcast', {
        gameData: { ...gameData, currentPhase: 'WORD_ASSIGNMENT' },
        playerWords: testPlayerWords
      });
      console.log(`🧪 Sent test broadcast with ${testPlayerWords.length} player words`);
    } else {
      console.log(`❌ No game data found for game ${gameId}`);
    }
  });

  // Chat message handler
  socket.on('send_chat_message', (data) => {
    const { gameId, message } = data;
    const gameData = spyGames.get(gameId);
    
    if (!gameData) return;
    
    // Find the player who sent the message
    const player = gameData.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    // Broadcast the message to all players in the game
    io.to(`spy_game_${gameId}`).emit('chat_message_received', {
      id: Date.now().toString(),
      userId: player.userId,
      userName: player.name,
      message: message,
      timestamp: new Date(),
      type: 'chat'
    });
    
    console.log(`💬 Chat message from ${player.name}: ${message}`);
  });

  // Typing indicators
  socket.on('typing', (data) => {
    const { gameId, userName } = data;
    const gameData = spyGames.get(gameId);
    
    if (!gameData) return;
    
    // Broadcast typing indicator to all players except the sender
    socket.to(`spy_game_${gameId}`).emit('user_typing', {
      userId: socket.userId,
      userName: userName
    });
  });

  socket.on('stop_typing', (data) => {
    const { gameId, userName } = data;
    const gameData = spyGames.get(gameId);
    
    if (!gameData) return;
    
    // Broadcast stop typing indicator to all players except the sender
    socket.to(`spy_game_${gameId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      userName: userName
    });
  });

  // Description submission handler
  socket.on('submit_description', (data) => {
    const { gameId, description } = data;
    const gameData = spyGames.get(gameId);
    
    if (!gameData) return;
    
    // Find the player who sent the description
    const player = gameData.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    // Check if it's the player's turn
    if (gameData.currentTurn !== gameData.players.findIndex(p => p.userId === player.userId)) {
      console.log(`❌ Not ${player.name}'s turn to describe`);
      return;
    }
    
    // Store the description
    if (!gameData.descriptions) gameData.descriptions = {};
    gameData.descriptions[player.userId] = description;
    
    // Broadcast the description to all players
    io.to(`spy_game_${gameId}`).emit('description_submitted', {
      playerId: player.userId,
      description: description,
      currentTurn: gameData.currentTurn
    });
    
    console.log(`📝 Description from ${player.name}: ${description}`);
    
    // Move to next player
    const nextTurn = gameData.currentTurn + 1;
    if (nextTurn < gameData.players.length) {
      gameData.currentTurn = nextTurn;
      gameData.timeLeft = 20;
      
      // Start timer for next player
      setTimeout(() => {
        if (gameData.currentTurn === nextTurn) {
          io.to(`spy_game_${gameId}`).emit('turn_started', {
            gameId: gameId,
            currentTurn: nextTurn,
            timeLeft: 20
          });
          
          // Start countdown timer
          let timeLeft = 20;
          const timer = setInterval(() => {
            timeLeft--;
            gameData.timeLeft = timeLeft;
            
            io.to(`spy_game_${gameId}`).emit('turn_started', {
              gameId: gameId,
              currentTurn: nextTurn,
              timeLeft: timeLeft
            });
            
            if (timeLeft <= 0) {
              clearInterval(timer);
              io.to(`spy_game_${gameId}`).emit('turn_ended', {
                gameId: gameId,
                nextTurn: nextTurn + 1
              });
            }
          }, 1000);
        }
      }, 1000);
    } else {
      // All players have described, move to voting phase
      gameData.currentPhase = 'VOTING';
      io.to(`spy_game_${gameId}`).emit('voting_started', {
        players: gameData.players
      });
    }
  });

  // Get spy game data by room code
  socket.on('get_spy_game_data', async (data) => {
    const { roomCode, userId } = data;
    console.log(`🔍 get_spy_game_data event received for room code: ${roomCode}`);
    
    try {
      // Find game by room code
      const game = await prisma.spyGame.findUnique({
        where: { roomCode },
        include: { players: true }
      });
      
      if (!game) {
        console.log(`❌ Game not found with room code: ${roomCode}`);
        socket.emit('spy_game_error', { message: 'Game not found' });
        return;
      }
      
      // Get game data from memory
      let gameData = spyGames.get(game.id);
      if (!gameData) {
        // Create game data from database
        gameData = {
          id: game.id,
          roomCode: game.roomCode,
          hostId: game.hostId,
          maxPlayers: game.maxPlayers,
          wordPack: game.wordPack,
          players: game.players.map(p => ({
            userId: p.userId,
            socketId: null,
            isHost: p.isHost,
            name: p.name || 'Player'
          })),
          status: game.status,
          currentPhase: game.currentPhase,
          currentTurn: game.currentTurn
        };
        spyGames.set(game.id, gameData);
        console.log(`🆕 Created game data from database for room: ${roomCode}`);
      }
      
      // Check if user is already in the game
      const existingPlayer = gameData.players.find(p => p.userId === userId);
      if (!existingPlayer) {
        console.log(`❌ User ${userId} not found in game ${roomCode}`);
        socket.emit('spy_game_error', { message: 'You are not in this game' });
        return;
      }
      
      // Update player's socket ID
      const playerIndex = gameData.players.findIndex(p => p.userId === userId);
      if (playerIndex !== -1) {
        gameData.players[playerIndex].socketId = socket.id;
      }
      
      // Join the socket room
      spyGamePlayers.set(socket.id, game.id);
      socket.join(`spy_game_${game.id}`);
      
      // Send game data to the player
      socket.emit('spy_game_data_received', {
        gameId: game.id,
        game: gameData
      });
      
      console.log(`✅ Sent game data to user ${userId} for room ${roomCode}`);
      
    } catch (error) {
      console.error('❌ Error getting spy game data:', error);
      socket.emit('spy_game_error', { message: 'Failed to get game data: ' + error.message });
    }
  });

  socket.on('start_spy_game', async (data) => {
    const { gameId } = data;
    const gameData = spyGames.get(gameId);
    
    if (!gameData) {
      socket.emit('spy_game_error', { message: 'Game not found' });
      return;
    }
    
    if (gameData.hostId !== socket.userId) {
      socket.emit('spy_game_error', { message: 'Only host can start game' });
      return;
    }
    
    if (gameData.players.length < 2) {
      socket.emit('spy_game_error', { message: 'Need at least 2 players' });
      return;
    }
    
    try {
      // Select random word pair
      const wordPack = wordPacks[gameData.wordPack] || wordPacks.default;
      const wordPair = wordPack[Math.floor(Math.random() * wordPack.length)];
      
      // Select random spy
      const spyIndex = Math.floor(Math.random() * gameData.players.length);
      
      // Assign words to players
      const playerWords = gameData.players.map((player, index) => ({
        userId: player.userId,
        word: index === spyIndex ? wordPair.spyWord : wordPair.word,
        isSpy: index === spyIndex
      }));
      
      // Save words to database
      await prisma.spyGameWord.createMany({
        data: playerWords.map(pw => ({
          gameId,
          word: pw.word,
          isSpyWord: pw.isSpy
        }))
      });
      
      // Update game status
      await prisma.spyGame.update({
        where: { id: gameId },
        data: { 
          status: 'PLAYING',
          currentPhase: 'WORD_ASSIGNMENT'
        }
      });
      
      gameData.status = 'PLAYING';
      gameData.currentPhase = 'WORD_ASSIGNMENT';
      gameData.currentTurn = 0;
      
      // Send words to players
      console.log(`🎮 Sending words to ${gameData.players.length} players`);
      gameData.players.forEach((player, index) => {
        console.log(`🎮 Player ${player.userId} (socket: ${player.socketId}) - Word: ${playerWords[index].word}, IsSpy: ${playerWords[index].isSpy}`);
        
        if (player.socketId) {
          const playerSocket = io.sockets.sockets.get(player.socketId);
          if (playerSocket) {
            playerSocket.emit('spy_game_started', {
              word: playerWords[index].word,
              isSpy: playerWords[index].isSpy,
              gameData
            });
            console.log(`✅ Sent word to player ${player.userId}`);
          } else {
            console.log(`❌ Socket not found for player ${player.userId} (socketId: ${player.socketId})`);
          }
        } else {
          console.log(`❌ No socket ID for player ${player.userId}`);
        }
      });
      
      // Fallback: Send to all players in the room
      console.log(`🎮 Broadcasting game start to all players in room spy_game_${gameId}`);
      
      // Get all sockets in the room
      const roomSockets = io.sockets.adapter.rooms.get(`spy_game_${gameId}`);
      if (roomSockets) {
        console.log(`🎮 Found ${roomSockets.size} sockets in room spy_game_${gameId}`);
        roomSockets.forEach(socketId => {
          console.log(`🎮 Socket in room: ${socketId}`);
        });
      } else {
        console.log(`❌ No sockets found in room spy_game_${gameId}`);
      }
      
      io.to(`spy_game_${gameId}`).emit('spy_game_started_broadcast', {
        gameData,
        playerWords
      });
      
      console.log(`🎮 Spy game ${gameId} started`);
      
      // Start description phase after 5 seconds
      setTimeout(() => {
        gameData.currentPhase = 'DESCRIBING';
        gameData.currentTurn = 0;
        gameData.timeLeft = 20;
        gameData.descriptions = {};
        
        io.to(`spy_game_${gameId}`).emit('description_phase_started', {
          gameId: gameId,
          currentTurn: 0,
          timeLeft: 20
        });
        
        // Start timer for first player
        let timeLeft = 20;
        const timer = setInterval(() => {
          timeLeft--;
          gameData.timeLeft = timeLeft;
          
          // Only emit timer update (not system message) every second
          io.to(`spy_game_${gameId}`).emit('timer_update', {
            gameId: gameId,
            currentTurn: 0,
            timeLeft: timeLeft
          });
          
          if (timeLeft <= 0) {
            clearInterval(timer);
            // Move to next player when time runs out
            const nextTurn = 1;
            if (nextTurn < gameData.players.length) {
              gameData.currentTurn = nextTurn;
              gameData.timeLeft = 20;
              
              io.to(`spy_game_${gameId}`).emit('turn_ended', {
                gameId: gameId,
                nextTurn: nextTurn
              });
              
              // Start timer for next player
              setTimeout(() => {
                io.to(`spy_game_${gameId}`).emit('turn_started', {
                  gameId: gameId,
                  currentTurn: nextTurn,
                  timeLeft: 20
                });
                
                let nextTimeLeft = 20;
                const nextTimer = setInterval(() => {
                  nextTimeLeft--;
                  gameData.timeLeft = nextTimeLeft;
                  
                  io.to(`spy_game_${gameId}`).emit('timer_update', {
                    gameId: gameId,
                    currentTurn: nextTurn,
                    timeLeft: nextTimeLeft
                  });
                  
                  if (nextTimeLeft <= 0) {
                    clearInterval(nextTimer);
                    // Continue to next player or end game
                    if (nextTurn + 1 < gameData.players.length) {
                      gameData.currentTurn = nextTurn + 1;
                      io.to(`spy_game_${gameId}`).emit('turn_ended', {
                        gameId: gameId,
                        nextTurn: nextTurn + 1
                      });
                    } else {
                      // All players have described, move to voting
                      gameData.currentPhase = 'VOTING';
                      io.to(`spy_game_${gameId}`).emit('voting_started', {
                        players: gameData.players
                      });
                    }
                  }
                }, 1000);
              }, 1000);
            } else {
              // All players have described, move to voting
              gameData.currentPhase = 'VOTING';
              io.to(`spy_game_${gameId}`).emit('voting_started', {
                players: gameData.players
              });
            }
          }
        }, 1000);
      }, 5000);
      
    } catch (error) {
      console.error('Error starting spy game:', error);
      socket.emit('spy_game_error', { message: 'Failed to start game' });
    }
  });

  socket.on('submit_description', (data) => {
    const { gameId, description } = data;
    const gameData = spyGames.get(gameId);
    
    if (!gameData) return;
    
    // Find the player who sent the description
    const player = gameData.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    // Check if it's the player's turn
    if (gameData.currentTurn !== gameData.players.findIndex(p => p.userId === player.userId)) {
      console.log(`❌ Not ${player.name}'s turn to describe`);
      return;
    }
    
    // Store the description
    if (!gameData.descriptions) gameData.descriptions = {};
    gameData.descriptions[player.userId] = description;
    
    // Broadcast the description to all players
    io.to(`spy_game_${gameId}`).emit('description_submitted', {
      playerId: player.userId,
      description: description,
      currentTurn: gameData.currentTurn
    });
    
    console.log(`📝 Description from ${player.name}: ${description}`);
    
    // Move to next player
    const nextTurn = gameData.currentTurn + 1;
    if (nextTurn < gameData.players.length) {
      gameData.currentTurn = nextTurn;
      gameData.timeLeft = 20;
      
      // Start timer for next player
      setTimeout(() => {
        if (gameData.currentTurn === nextTurn) {
          io.to(`spy_game_${gameId}`).emit('turn_started', {
            gameId: gameId,
            currentTurn: nextTurn,
            timeLeft: 20
          });
          
          // Start countdown timer
          let timeLeft = 20;
          const timer = setInterval(() => {
            timeLeft--;
            gameData.timeLeft = timeLeft;
            
            io.to(`spy_game_${gameId}`).emit('turn_started', {
              gameId: gameId,
              currentTurn: nextTurn,
              timeLeft: timeLeft
            });
            
            if (timeLeft <= 0) {
              clearInterval(timer);
              io.to(`spy_game_${gameId}`).emit('turn_ended', {
                gameId: gameId,
                nextTurn: nextTurn + 1
              });
            }
          }, 1000);
        }
      }, 1000);
    } else {
      // All players have described, move to voting phase
      gameData.currentPhase = 'VOTING';
      io.to(`spy_game_${gameId}`).emit('voting_started', {
        players: gameData.players
      });
    }
  });

  socket.on('submit_vote', async (data) => {
    const { gameId, votedForId } = data;
    const gameData = spyGames.get(gameId);
    
    if (!gameData) return;
    
    try {
      // Save vote to database
      await prisma.spyGameVote.create({
        data: {
          gameId,
          voterId: socket.userId,
          votedForId
        }
      });
      
      // Notify all players about the vote
      io.to(`spy_game_${gameId}`).emit('vote_submitted', {
        voterId: socket.userId,
        votedForId
      });
      
      // Check if all players have voted
      const votes = await prisma.spyGameVote.findMany({
        where: { gameId }
      });
      
      if (votes.length >= gameData.players.length) {
        // End game and reveal results
        await endSpyGame(gameId);
      }
      
    } catch (error) {
      console.error('Error submitting vote:', error);
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
    
    // Check if same user is trying to match with themselves
    if (player1.userId === player2.userId) {
      console.log(`⚠️ WARNING: Same user ${player1.userId} matched with themselves!`);
      console.log(`   - Socket 1: ${player1.socketId}`);
      console.log(`   - Socket 2: ${player2.socketId}`);
      
      // Put player2 back in queue and continue with next player
      players.unshift(player2);
      console.log(`🔄 Put second player back in queue due to same user match`);
      continue;
    }
    
    // Check if either player is already in an active match
    const player1InMatch = activeMatches.has(player1.userId);
    const player2InMatch = activeMatches.has(player2.userId);
    
    if (player1InMatch || player2InMatch) {
      console.log(`⚠️ WARNING: Player already in active match!`);
      console.log(`   - Player 1 (${player1.userId}) in match: ${player1InMatch}`);
      console.log(`   - Player 2 (${player2.userId}) in match: ${player2InMatch}`);
      
      // Remove active match players from queue instead of putting them back
      if (player1InMatch) {
        await queueManager.removeFromQueue(quizId, player1);
        console.log(`🗑️ Removed player 1 (${player1.userId}) from queue - already in active match`);
      }
      if (player2InMatch) {
        await queueManager.removeFromQueue(quizId, player2);
        console.log(`🗑️ Removed player 2 (${player2.userId}) from queue - already in active match`);
      }
      
      // Only put non-active players back in queue
      if (!player1InMatch) {
        players.unshift(player1);
      }
      if (!player2InMatch) {
        players.unshift(player2);
      }
      
      console.log(`🔄 Processed active match conflict - continuing with next players`);
      continue;
    }
    
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
    console.log('Match object details:');
    console.log('   - Match ID:', match.id);
    console.log('   - Player 1 ID:', match.player1Id);
    console.log('   - Player 2 ID:', match.player2Id);
    console.log('   - Player 1 Socket ID:', match.player1SocketId);
    console.log('   - Player 2 Socket ID:', match.player2SocketId);
    console.log('   - Total Questions:', match.totalQuestions);
    console.log('   - Questions array length:', match.questions.length);
    console.log('   - First question sample:', match.questions[0] ? {
      text: match.questions[0].text.substring(0, 50) + '...',
      options: match.questions[0].options,
      correct: match.questions[0].correct
    } : 'No questions');
    
    activeMatches.set(matchId, match);
    
    // Track active players to prevent multiple matches
    activeMatches.set(player1.userId, matchId);
    activeMatches.set(player2.userId, matchId);
    
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
  io.to(`room_${roomCode}`).emit('game_started', {
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
  
  console.log('🔍 Detailed answer analysis:');
  console.log('   - Match questions:', match.questions);
  console.log('   - Player 1 answers:', match.player1Answers);
  console.log('   - Player 2 answers:', match.player2Answers);
  
  for (let i = 0; i < match.totalQuestions; i++) {
    const p1Answer = match.player1Answers[i];
    const p2Answer = match.player2Answers[i];
    const question = match.questions[i];
    
    console.log(`🔍 Question ${i} analysis:`);
    console.log(`   - Question: ${question.text}`);
    console.log(`   - Options: ${JSON.stringify(question.options)}`);
    console.log(`   - Correct answer (index): ${question.correct}`);
    console.log(`   - Correct answer (text): ${question.options[question.correct]}`);
    console.log(`   - Player 1 answer: ${JSON.stringify(p1Answer)}`);
    console.log(`   - Player 2 answer: ${JSON.stringify(p2Answer)}`);
    
    // Check player 1 answer
    if (p1Answer) {
      let p1Correct = false;
      
      // Handle different answer formats
      if (typeof p1Answer.answer === 'number') {
        // Answer is already an index
        p1Correct = p1Answer.answer === question.correct;
      } else if (typeof p1Answer.answer === 'string') {
        // Answer might be the text of the option
        const answerIndex = question.options.findIndex(option => 
          option.toLowerCase() === p1Answer.answer.toLowerCase()
        );
        p1Correct = answerIndex === question.correct;
      } else if (typeof p1Answer.answer === 'string' && !isNaN(parseInt(p1Answer.answer))) {
        // Answer might be a string number
        p1Correct = parseInt(p1Answer.answer) === question.correct;
      }
      
      if (p1Correct) {
        player1Score += 10;
        console.log(`✅ Player 1 correct! Score: ${player1Score}`);
      } else {
        console.log(`❌ Player 1 incorrect. Expected: ${question.correct}, Got: ${p1Answer.answer}`);
      }
    } else {
      console.log(`❌ Player 1 no answer for question ${i}`);
    }
    
    // Check player 2 answer
    if (p2Answer) {
      let p2Correct = false;
      
      // Handle different answer formats
      if (typeof p2Answer.answer === 'number') {
        // Answer is already an index
        p2Correct = p2Answer.answer === question.correct;
      } else if (typeof p2Answer.answer === 'string') {
        // Answer might be the text of the option
        const answerIndex = question.options.findIndex(option => 
          option.toLowerCase() === p2Answer.answer.toLowerCase()
        );
        p2Correct = answerIndex === question.correct;
      } else if (typeof p2Answer.answer === 'string' && !isNaN(parseInt(p2Answer.answer))) {
        // Answer might be a string number
        p2Correct = parseInt(p2Answer.answer) === question.correct;
      }
      
      if (p2Correct) {
        player2Score += 10;
        console.log(`✅ Player 2 correct! Score: ${player2Score}`);
      } else {
        console.log(`❌ Player 2 incorrect. Expected: ${question.correct}, Got: ${p2Answer.answer}`);
      }
    } else {
      console.log(`❌ Player 2 no answer for question ${i}`);
    }
  }
  
  console.log('🏆 Final score calculation:');
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
      });
      
      // Create battle quiz winner record - outside transaction to prevent rollback
      try {
        const winnerRecord = await prisma.battleQuizWinner.create({
          data: {
            quizId: match.quizId || 'general',
            userId: winner,
            rank: 1,
            prizeAmount: winnerPrize,
            paid: true
          }
        });
        console.log(`✅ Battle quiz winner record created:`, winnerRecord);
      } catch (quizError) {
        console.log(`⚠️ Could not create battle quiz winner record:`, quizError.message);
        console.log(`   - This is normal for category-based matches without specific quiz ID`);
        console.log(`   - Winner still gets the prize: ₹${winnerPrize}`);
      }
      
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
  
  // Remove players from active matches tracking
  activeMatches.delete(match.player1Id);
  activeMatches.delete(match.player2Id);
  
  console.log(`Match ${matchId} ended. Winner: ${winner}, Prize: ₹${winnerPrize}`);
  console.log(`Players ${match.player1Id} and ${match.player2Id} are now available for new matches`);
  console.log(`📊 Active matches after cleanup:`, Array.from(activeMatches.keys()));
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

// Helper function to end spy game
async function endSpyGame(gameId) {
  const gameData = spyGames.get(gameId);
  if (!gameData) return;
  
  try {
    // Get all votes
    const votes = await prisma.spyGameVote.findMany({
      where: { gameId },
      include: { voter: true, votedFor: true }
    });
    
    // Count votes
    const voteCounts = {};
    votes.forEach(vote => {
      voteCounts[vote.votedForId] = (voteCounts[vote.votedForId] || 0) + 1;
    });
    
    // Find most voted player
    const mostVotedId = Object.keys(voteCounts).reduce((a, b) => 
      voteCounts[a] > voteCounts[b] ? a : b
    );
    
    // Get spy player
    const spyPlayer = gameData.players.find(p => p.isSpy);
    
    // Determine winner
    const spyWasCaught = mostVotedId === spyPlayer.userId;
    const winner = spyWasCaught ? 'team' : 'spy';
    
    // Update game status
    await prisma.spyGame.update({
      where: { id: gameId },
      data: { 
        status: 'FINISHED',
        currentPhase: 'REVEAL'
      }
    });
    
    // Send results to all players
    io.to(`spy_game_${gameId}`).emit('spy_game_ended', {
      spyPlayer: spyPlayer,
      mostVotedPlayer: mostVotedId,
      voteCounts,
      winner,
      spyWasCaught
    });
    
    // Clean up
    spyGames.delete(gameId);
    gameData.players.forEach(player => {
      spyGamePlayers.delete(player.socketId);
    });
    
    console.log(`🎮 Spy game ${gameId} ended. Winner: ${winner}`);
    
  } catch (error) {
    console.error('Error ending spy game:', error);
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