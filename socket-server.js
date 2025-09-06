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

// Timetable reminder intervals
const timetableReminderIntervals = new Map(); // userId -> interval

// Live exam auto-end intervals
const liveExamAutoEndIntervals = new Map(); // examId -> interval

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

// Debug function to clear all active matches
function clearAllActiveMatches() {
  console.log('🧪 DEBUG: Clearing all active matches...');
  console.log('   - Before clearing:', Array.from(activeMatches.keys()));
  
  const clearedCount = activeMatches.size;
  activeMatches.clear();
  
  console.log(`   - Cleared ${clearedCount} active matches`);
  console.log('   - After clearing:', Array.from(activeMatches.keys()));
  console.log('✅ All active matches cleared');
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
    console.log('   - Data:', JSON.stringify(data, null, 2));
    console.log('   - Socket userId:', socket.userId);
    console.log('   - UserSockets mapping:', Object.keys(userSockets));

    const { categoryId, mode, amount } = data;
    const userId = socket.userId;

    if (!userId) {
      console.log('❌ No user ID found for socket:', socket.id);
      console.log('   - Available userSockets:', userSockets);
      socket.emit('matchmaking_error', { message: 'User not authenticated' });
      return;
    }

    console.log('   - User ID:', userId);
    console.log('   - Category ID:', categoryId);
    console.log('   - Mode:', mode);
    console.log('   - Amount:', amount);

    // Get user details
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, wallet: true }
      });
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      socket.emit('matchmaking_error', { message: 'Error fetching user details' });
      return;
    }

    if (!user) {
      console.log('❌ User not found:', userId);
      socket.emit('matchmaking_error', { message: 'User not found' });
      return;
    }

    console.log('   - User:', user.name);
    console.log('   - Wallet balance:', user.wallet);

    // Find or create battle quiz
    let battleQuiz;
    let entryFee = 10; // Default entry fee

    try {
      if (mode === 'private') {
        // Private room logic (existing code)
        // ... existing private room code ...
      } else if (categoryId) {
        // Get active battle quiz for this category and amount
        battleQuiz = await prisma.battleQuiz.findFirst({
          where: { 
            categoryId: categoryId,
            isActive: true,
            isPrivate: false, // Only public quizzes
            entryAmount: amount || undefined // Match specific amount if provided
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
        } else if (amount) {
          // Create new battle quiz with specified amount
          console.log(`⚠️ No active battle quiz found for category: ${categoryId} with amount: ${amount}, creating new one`);
          
          // Get category details
          const category = await prisma.questionCategory.findUnique({
            where: { id: categoryId }
          });

          if (!category) {
            console.log('❌ Category not found:', categoryId);
            socket.emit('matchmaking_error', { message: 'Category not found' });
            return;
          }

          // Create new battle quiz
          battleQuiz = await prisma.battleQuiz.create({
            data: {
              title: `${category.name} Battle (₹${amount})`,
              description: `Quick battle quiz for ${category.name}`,
              entryAmount: amount,
              categoryId: categoryId,
              questionCount: 5,
              timePerQuestion: 10,
              isActive: true,
              isPrivate: false,
              status: 'WAITING',
              createdById: userId,
            },
            select: { 
              id: true, 
              title: true, 
              entryAmount: true, 
              questionCount: true, 
              timePerQuestion: true 
            }
          });

          entryFee = battleQuiz.entryAmount;
          console.log(`✅ Created new battle quiz: ${battleQuiz.title}`);
          console.log(`   - Entry fee: ₹${entryFee}`);

          // Add questions to the quiz
          await addQuestionsToQuiz(battleQuiz.id, categoryId, 5);
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
    const queueId = battleQuiz?.id || categoryId || 'general';
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
      
      // Clear the current question timer since both players answered
      if (match.questionTimer) {
        clearTimeout(match.questionTimer);
        console.log(`⏰ Cleared timer for question ${questionIndex}`);
      }
      
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
          
          // Start timer for next question
          startQuestionTimer(matchId, match.currentQuestion, 15);
          
        } else {
          console.log('🏁 All questions answered, ending match');
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

  // Enhanced Message Notifications
  socket.on('private_message', (data) => {
    console.log('📨 Received private_message event:', data);
    const { message } = data;
    const receiverId = message.receiver.id;
    const senderId = message.sender.id;
    
    // Create chat room ID for this conversation
    const chatId = [senderId, receiverId].sort().join('-');
    console.log(`🔗 Chat room ID: ${chatId}`);

    // Send message to the chat room (both sender and receiver will receive it if they are in this room)
    io.to(chatId).emit('new_message', message);
    console.log(`✅ Message sent to chat room: ${chatId}`);
    
    // Send notification to the receiver's individual socket if they are online and not in the chat room
    const receiverSocketId = userSockets[receiverId];
    if (receiverSocketId) {
      // Check if the receiver's socket is already in the chat room
      const receiverIsInChatRoom = io.sockets.adapter.rooms.get(chatId)?.has(receiverSocketId);
      
      if (!receiverIsInChatRoom) {
        io.to(receiverSocketId).emit('message_notification', {
          type: 'new_message',
          message: message,
          unreadCount: 1
        });
        console.log(`🔔 Notification sent to receiver ${receiverId} (not in chat room)`);
      } else {
        console.log(`ℹ️ Receiver ${receiverId} is in chat room, no separate notification needed.`);
      }
    } else {
      console.log(`⚠️ User ${receiverId} is not connected, message will be delivered on next login.`);
    }
  });

  // Message Read Status
  socket.on('mark_message_read', (data) => {
    const { messageId, readerId } = data;
    console.log(`Marking message ${messageId} as read by ${readerId}`);
    
    // Emit to sender that message was read
    const senderSocketId = userSockets[data.senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit('message_read_status', {
        messageId,
        readBy: readerId,
        readAt: new Date()
      });
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
        const question = match.questions[i];
        
        // Check player 1 answer
        if (p1Answer && !p1Answer.timedOut) {
          let p1Correct = false;
          
          // Handle different answer formats
          if (typeof p1Answer.answer === 'number') {
            p1Correct = p1Answer.answer === question.correct;
          } else if (typeof p1Answer.answer === 'string') {
            const answerIndex = question.options.findIndex(option => 
              option.toLowerCase() === p1Answer.answer.toLowerCase()
            );
            p1Correct = answerIndex === question.correct;
          } else if (typeof p1Answer.answer === 'string' && !isNaN(parseInt(p1Answer.answer))) {
            p1Correct = parseInt(p1Answer.answer) === question.correct;
          }
          
          if (p1Correct) {
            player1Score += 10;
          }
        }
        
        // Check player 2 answer
        if (p2Answer && !p2Answer.timedOut) {
          let p2Correct = false;
          
          // Handle different answer formats
          if (typeof p2Answer.answer === 'number') {
            p2Correct = p2Answer.answer === question.correct;
          } else if (typeof p2Answer.answer === 'string') {
            const answerIndex = question.options.findIndex(option => 
              option.toLowerCase() === p2Answer.answer.toLowerCase()
            );
            p2Correct = answerIndex === question.correct;
          } else if (typeof p2Answer.answer === 'string' && !isNaN(parseInt(p2Answer.answer))) {
            p2Correct = parseInt(p2Answer.answer) === question.correct;
          }
          
          if (p2Correct) {
            player2Score += 10;
          }
        }
      }
      
      const winner = player1Score > player2Score ? match.player1Id : 
                    player2Score > player1Score ? match.player2Id : null;
      
      // Send match results to both players
      const player1Socket = io.sockets.sockets.get(match.player1SocketId);
      const player2Socket = io.sockets.sockets.get(match.player2SocketId);
      
      const matchResult = {
        matchId,
        player1Score,
        player2Score,
        winner,
        isDraw: player1Score === player2Score
      };
      
      if (player1Socket && player1Socket.connected) {
        console.log('Sending match_ended to player 1:', match.player1SocketId);
        player1Socket.emit('match_ended', {
          ...matchResult,
          myScore: player1Score,
          opponentScore: player2Score,
          myPosition: 'player1'
        });
      } else {
        console.log('Player 1 socket not found or disconnected:', match.player1SocketId);
      }
      
      if (player2Socket && player2Socket.connected) {
        console.log('Sending match_ended to player 2:', match.player2SocketId);
        player2Socket.emit('match_ended', {
          ...matchResult,
          myScore: player2Score,
          opponentScore: player1Score,
          myPosition: 'player2'
        });
      } else {
        console.log('Player 2 socket not found or disconnected:', match.player2SocketId);
      }
      
      console.log('✅ Match ended successfully');
      console.log('   - Player 1 Score:', player1Score);
      console.log('   - Player 2 Score:', player2Score);
      console.log('   - Winner:', winner);
      console.log('   - Is Draw:', player1Score === player2Score);
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

  // Timetable reminder functionality
  socket.on('start_timetable_reminders', async (data) => {
    const { userId } = data;
    console.log(`⏰ Starting timetable reminders for user ${userId}`);
    
    // Clear existing interval if any
    if (timetableReminderIntervals.has(userId)) {
      clearInterval(timetableReminderIntervals.get(userId));
    }
    
    // Start new reminder interval (check every 5 minutes)
    const interval = setInterval(async () => {
      try {
        await checkTimetableReminders(userId);
      } catch (error) {
        console.error(`❌ Error checking timetable reminders for user ${userId}:`, error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    timetableReminderIntervals.set(userId, interval);
    
    // Also check immediately
    await checkTimetableReminders(userId);
    
    socket.emit('timetable_reminders_started', { success: true });
  });

  socket.on('stop_timetable_reminders', (data) => {
    const { userId } = data;
    console.log(`⏰ Stopping timetable reminders for user ${userId}`);
    
    if (timetableReminderIntervals.has(userId)) {
      clearInterval(timetableReminderIntervals.get(userId));
      timetableReminderIntervals.delete(userId);
    }
    
    socket.emit('timetable_reminders_stopped', { success: true });
  });

  // Live exam auto-end functionality
  socket.on('setup_exam_auto_end', async (data) => {
    const { examId, endTime } = data;
    console.log(`⏰ Setting up auto-end for exam ${examId} at ${endTime}`);
    
    try {
      // Clear any existing interval for this exam
      if (liveExamAutoEndIntervals.has(examId)) {
        clearInterval(liveExamAutoEndIntervals.get(examId));
        liveExamAutoEndIntervals.delete(examId);
      }
      
      const endTimeDate = new Date(endTime);
      const now = new Date();
      const timeUntilEnd = endTimeDate.getTime() - now.getTime();
      
      if (timeUntilEnd <= 0) {
        console.log(`   - Exam ${examId} has already ended, ending immediately`);
        await checkAndEndExpiredExams();
        return;
      }
      
      // Set up timer for this specific exam
      const timer = setTimeout(async () => {
        console.log(`⏰ Auto-ending exam ${examId}`);
        await checkAndEndExpiredExams();
        
        // Clear the interval reference
        if (liveExamAutoEndIntervals.has(examId)) {
          liveExamAutoEndIntervals.delete(examId);
        }
      }, timeUntilEnd);
      
      liveExamAutoEndIntervals.set(examId, timer);
      console.log(`   - Auto-end timer set for exam ${examId} in ${Math.floor(timeUntilEnd / 1000)} seconds`);
      
      socket.emit('exam_auto_end_setup', { 
        examId, 
        success: true, 
        timeUntilEnd: Math.floor(timeUntilEnd / 1000) 
      });
      
    } catch (error) {
      console.error(`❌ Error setting up auto-end for exam ${examId}:`, error);
      socket.emit('exam_auto_end_setup', { 
        examId, 
        success: false, 
        error: error.message 
      });
    }
  });

  socket.on('cancel_exam_auto_end', (data) => {
    const { examId } = data;
    console.log(`⏰ Cancelling auto-end for exam ${examId}`);
    
    if (liveExamAutoEndIntervals.has(examId)) {
      clearTimeout(liveExamAutoEndIntervals.get(examId));
      liveExamAutoEndIntervals.delete(examId);
      console.log(`   - Auto-end cancelled for exam ${examId}`);
    }
    
    socket.emit('exam_auto_end_cancelled', { examId, success: true });
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
      
      // Clean up timetable reminder interval
      if (timetableReminderIntervals.has(userId)) {
        clearInterval(timetableReminderIntervals.get(userId));
        timetableReminderIntervals.delete(userId);
        console.log(`🧹 Cleaned up timetable reminder interval for user ${userId}`);
      }
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

  // Debug events for active matches
  socket.on('debug_clear_matches', () => {
    console.log('🧪 DEBUG: Clearing all active matches via socket event');
    clearAllActiveMatches();
    socket.emit('debug_result', { 
      message: 'All active matches cleared',
      activeMatchesCount: activeMatches.size 
    });
  });

  socket.on('debug_show_matches', () => {
    console.log('🧪 DEBUG: Showing current active matches');
    const matches = Array.from(activeMatches.keys());
    console.log('   - Active matches:', matches);
    socket.emit('debug_result', { 
      message: 'Current active matches',
      activeMatches: matches,
      count: matches.length 
    });
  });

  // Debug events for questions and categories
  socket.on('debug_check_category', async (data) => {
    const { categoryId } = data;
    console.log('🧪 DEBUG: Checking category questions for:', categoryId);
    
    try {
      // Check category
      const category = await prisma.questionCategory.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true }
      });
      
      if (!category) {
        socket.emit('debug_result', { 
          message: 'Category not found',
          categoryId: categoryId,
          error: true
        });
        return;
      }
      
      // Check questions in category
      const questions = await prisma.questionBankItem.findMany({
        where: {
          categoryId: categoryId,
          isActive: true
        },
        select: {
          id: true,
          text: true,
          options: true,
          correctAnswer: true
        },
        take: 5
      });
      
      socket.emit('debug_result', { 
        message: 'Category questions found',
        category: category,
        questionsCount: questions.length,
        questions: questions.slice(0, 3), // Show first 3 questions
        error: false
      });
      
    } catch (error) {
      console.error('❌ Error checking category:', error);
      socket.emit('debug_result', { 
        message: 'Error checking category',
        error: error.message,
        errorType: 'category_check'
      });
    }
  });

  // Debug events for transactions
  socket.on('debug_check_transactions', async (data) => {
    const { userId } = data;
    console.log('🧪 DEBUG: Checking transactions for user:', userId);
    
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, wallet: true }
      });
      
      if (!user) {
        socket.emit('debug_result', { 
          message: 'User not found',
          userId: userId,
          error: true
        });
        return;
      }
      
      // Get user transactions
      const transactions = await prisma.transaction.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      socket.emit('debug_result', { 
        message: 'User transactions found',
        user: user,
        transactionsCount: transactions.length,
        transactions: transactions,
        error: false
      });
      
    } catch (error) {
      console.error('❌ Error checking transactions:', error);
      socket.emit('debug_result', { 
        message: 'Error checking transactions',
        error: error.message,
        errorType: 'transaction_check'
      });
    }
  });

  // Debug events for category questions
  socket.on('debug_check_category_questions', async (data) => {
    const { categoryId } = data;
    console.log('🧪 DEBUG: Checking questions in category:', categoryId);
    
    try {
      // Get category details
      const category = await prisma.questionCategory.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true }
      });
      
      if (!category) {
        socket.emit('debug_result', { 
          message: 'Category not found',
          categoryId: categoryId,
          error: true
        });
        return;
      }
      
      // Get total questions count from QuestionBankItem
      const totalQuestions = await prisma.questionBankItem.count({
        where: {
          categoryId: categoryId,
          isActive: true
        }
      });
      
      // Get sample questions from QuestionBankItem
      const sampleQuestions = await prisma.questionBankItem.findMany({
        where: {
          categoryId: categoryId,
          isActive: true
        },
        select: {
          id: true,
          text: true,
          options: true,
          correctAnswer: true,
          isActive: true
        },
        take: 5
      });
      
      // Also check Question table
      const questionTableCount = await prisma.question.count({
        where: {
          categoryId: categoryId
        }
      });
      
      socket.emit('debug_result', { 
        message: 'Category questions found',
        category: category,
        questionBankItemCount: totalQuestions,
        questionTableCount: questionTableCount,
        sampleQuestions: sampleQuestions,
        error: false
      });
      
    } catch (error) {
      console.error('❌ Error checking category questions:', error);
      socket.emit('debug_result', { 
        message: 'Error checking category questions',
        error: error.message,
        errorType: 'category_questions_check'
      });
    }
  });

  // Debug event to check all categories and their question counts
  socket.on('debug_check_all_categories', async () => {
    console.log('🧪 DEBUG: Checking all categories and their questions');
    
    try {
      // Get all categories with question counts
      const categories = await prisma.questionCategory.findMany({
        select: {
          id: true,
          name: true
        }
      });
      
      const categoryDetails = [];
      
      for (const category of categories) {
        // Count questions in QuestionBankItem
        const questionBankCount = await prisma.questionBankItem.count({
          where: {
            categoryId: category.id,
            isActive: true
          }
        });
        
        // Count all questions in QuestionBankItem
        const questionBankAllCount = await prisma.questionBankItem.count({
          where: {
            categoryId: category.id
          }
        });
        
        // Count questions in Question table
        const questionTableCount = await prisma.question.count({
          where: {
            categoryId: category.id
          }
        });
        
        categoryDetails.push({
          id: category.id,
          name: category.name,
          questionBankItemActiveCount: questionBankCount,
          questionBankItemAllCount: questionBankAllCount,
          questionTableCount: questionTableCount,
          totalQuestions: questionBankCount + questionTableCount
        });
      }
      
      socket.emit('debug_result', { 
        message: 'All categories checked',
        categories: categoryDetails,
        error: false
      });
      
    } catch (error) {
      console.error('❌ Error checking all categories:', error);
      socket.emit('debug_result', { 
        message: 'Error checking all categories',
        error: error.message,
        errorType: 'all_categories_check'
      });
    }
  });

  // Debug event to check questions in a specific category with isActive details
  socket.on('debug_check_category_details', async (data) => {
    const { categoryId } = data;
    console.log('🧪 DEBUG: Checking detailed questions in category:', categoryId);
    
    try {
      // Get category details
      const category = await prisma.questionCategory.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true }
      });
      
      if (!category) {
        socket.emit('debug_result', { 
          message: 'Category not found',
          categoryId: categoryId,
          error: true
        });
        return;
      }
      
      // Get questions with isActive status
      const allQuestions = await prisma.questionBankItem.findMany({
        where: {
          categoryId: categoryId
        },
        select: {
          id: true,
          text: true,
          options: true,
          correctAnswer: true,
          isActive: true
        }
      });
      
      const activeQuestions = allQuestions.filter(q => q.isActive === true);
      const inactiveQuestions = allQuestions.filter(q => q.isActive !== true);
      
      socket.emit('debug_result', { 
        message: 'Category questions detailed',
        category: category,
        totalQuestions: allQuestions.length,
        activeQuestions: activeQuestions.length,
        inactiveQuestions: inactiveQuestions.length,
        allQuestions: allQuestions.slice(0, 5), // Show first 5 questions
        error: false
      });
      
    } catch (error) {
      console.error('❌ Error checking category details:', error);
      socket.emit('debug_result', { 
        message: 'Error checking category details',
        error: error.message,
        errorType: 'category_details_check'
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
      const hostUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
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
          name: hostUser?.name || 'Host'
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
        // If the game is already in voting phase, ensure this rejoining client sees the voting UI
        if (gameData.currentPhase === 'VOTING') {
          try {
            socket.emit('voting_started', { players: gameData.players });
            console.log(`🗳️ Sent voting_started to rejoined player ${userId}`);
          } catch {}
        }
        
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
            
            io.to(`spy_game_${gameId}`).emit('timer_update', {
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
      if (gameData.currentPhase === 'VOTING') {
        try {
          socket.emit('voting_started', { players: gameData.players });
          console.log(`🗳️ Sent voting_started via get_spy_game_data to user ${userId}`);
        } catch {}
      }
      
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
      // Category voting pre-phase: start a quick vote if not selected yet
      if (!gameData.categorySelected) {
        if (!gameData.categoryVotingStarted) {
          gameData.categoryVotingStarted = true;
          gameData.categoryVotes = {};
          const categoryOptions = [
            { id: 'random', name: 'Random', description: 'Pick any random category' },
            { id: 'food', name: 'Food', description: 'Foods, dishes, and snacks' },
            { id: 'places', name: 'Places', description: 'Cities, countries, and spots' },
            { id: 'tech', name: 'Tech', description: 'Gadgets and technology' }
          ];
          io.to(`spy_game_${gameId}`).emit('category_vote_started', {
            categories: categoryOptions,
            timeoutSec: 12
          });

          setTimeout(async () => {
            try {
              const tally = {};
              for (const p of gameData.players) {
                const voted = gameData.categoryVotes[p.userId];
                if (voted) tally[voted] = (tally[voted] || 0) + 1;
              }
              // Determine winner
              let selectedCategoryId = 'random';
              let maxVotes = -1;
              Object.entries(tally).forEach(([catId, count]) => {
                if (count > maxVotes) { maxVotes = count; selectedCategoryId = catId; }
              });
              if (maxVotes <= 0) {
                const ids = ['random','food','places','tech'];
                selectedCategoryId = ids[Math.floor(Math.random() * ids.length)];
              }
              const categoryNameMap = { random: 'Random', food: 'Food', places: 'Places', tech: 'Tech' };
              io.to(`spy_game_${gameId}`).emit('category_vote_result', {
                categoryId: selectedCategoryId,
                categoryName: categoryNameMap[selectedCategoryId] || 'Random'
              });
              // Map category to word pack key
              let packKey = gameData.wordPack || 'default';
              if (selectedCategoryId === 'food') packKey = 'default';
              if (selectedCategoryId === 'places') packKey = 'hard';
              if (selectedCategoryId === 'tech') packKey = 'funny';
              if (selectedCategoryId === 'random') {
                const keys = Object.keys(wordPacks);
                packKey = keys[Math.floor(Math.random() * keys.length)];
              }
              gameData.wordPack = packKey;
              gameData.categorySelected = true;

              // Proceed to start game now (duplicate of start flow)
              const wordPack = wordPacks[gameData.wordPack] || wordPacks.default;
              const wordPair = wordPack[Math.floor(Math.random() * wordPack.length)];
              const spyIndex = Math.floor(Math.random() * gameData.players.length);
              const playerWords = gameData.players.map((player, index) => ({
                userId: player.userId,
                word: index === spyIndex ? wordPair.spyWord : wordPair.word,
                isSpy: index === spyIndex
              }));
              gameData.playerWords = playerWords;
              try {
                await prisma.spyGameWord.createMany({
                  data: playerWords.map(pw => ({ gameId, word: pw.word, isSpyWord: pw.isSpy }))
                });
              } catch {}
              try {
                await prisma.spyGameVote.deleteMany({ where: { gameId } });
              } catch {}
              try {
                await prisma.spyGame.update({
                  where: { id: gameId },
                  data: { status: 'PLAYING', currentPhase: 'WORD_ASSIGNMENT' }
                });
              } catch {}
              gameData.status = 'PLAYING';
              gameData.currentPhase = 'WORD_ASSIGNMENT';
              gameData.currentTurn = 0;

              gameData.players.forEach((player, index) => {
                let targetSocket = null;
                if (player.socketId) { targetSocket = io.sockets.sockets.get(player.socketId); }
                if (!targetSocket) {
                  const mappedId = userSockets[player.userId];
                  if (mappedId) {
                    const candidate = io.sockets.sockets.get(mappedId);
                    if (candidate) { targetSocket = candidate; gameData.players[index].socketId = mappedId; }
                  }
                }
                if (targetSocket) {
                  try { targetSocket.join(`spy_game_${gameId}`); } catch {}
                  targetSocket.emit('spy_game_started', {
                    word: playerWords[index].word,
                    isSpy: playerWords[index].isSpy,
                    gameData
                  });
                }
              });
              io.to(`spy_game_${gameId}`).emit('spy_game_started_broadcast', { gameData, playerWords });

              setTimeout(() => {
                gameData.currentPhase = 'DESCRIBING';
                gameData.currentTurn = 0;
                gameData.timeLeft = 20;
                gameData.descriptions = {};
                io.to(`spy_game_${gameId}`).emit('description_phase_started', { gameId: gameId, currentTurn: 0, timeLeft: 20 });
                let timeLeft = 20;
                const timer = setInterval(() => {
                  timeLeft--;
                  gameData.timeLeft = timeLeft;
                  io.to(`spy_game_${gameId}`).emit('timer_update', { gameId: gameId, currentTurn: 0, timeLeft: timeLeft });
                  if (timeLeft <= 0) {
                    clearInterval(timer);
                    const nextTurn = 1;
                    if (nextTurn < gameData.players.length) {
                      gameData.currentTurn = nextTurn;
                      gameData.timeLeft = 20;
                      io.to(`spy_game_${gameId}`).emit('turn_ended', { gameId: gameId, nextTurn: nextTurn });
                      setTimeout(() => {
                        io.to(`spy_game_${gameId}`).emit('turn_started', { gameId: gameId, currentTurn: nextTurn, timeLeft: 20 });
                        let nextTimeLeft = 20;
                        const nextTimer = setInterval(() => {
                          nextTimeLeft--;
                          gameData.timeLeft = nextTimeLeft;
                          io.to(`spy_game_${gameId}`).emit('timer_update', { gameId: gameId, currentTurn: nextTurn, timeLeft: nextTimeLeft });
                          if (nextTimeLeft <= 0) {
                            clearInterval(nextTimer);
                            if (nextTurn + 1 < gameData.players.length) {
                              gameData.currentTurn = nextTurn + 1;
                              io.to(`spy_game_${gameId}`).emit('turn_ended', { gameId: gameId, nextTurn: nextTurn + 1 });
                            } else {
                              gameData.currentPhase = 'VOTING';
                              io.to(`spy_game_${gameId}`).emit('voting_started', { players: gameData.players });
                            }
                          }
                        }, 1000);
                      }, 1000);
                    } else {
                      gameData.currentPhase = 'VOTING';
                      io.to(`spy_game_${gameId}`).emit('voting_started', { players: gameData.players });
                    }
                  }
                }, 1000);
              }, 5000);
            } catch (e) {}
          }, 12000);
        }
        // Wait for category vote to complete
        return;
      }

      // Select random word pair (uses possibly-updated gameData.wordPack)
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
      // Store mapping for later result evaluation
      gameData.playerWords = playerWords;
      
      // Save words to database
      await prisma.spyGameWord.createMany({
        data: playerWords.map(pw => ({
          gameId,
          word: pw.word,
          isSpyWord: pw.isSpy
        }))
      });
      // Clear any previous votes for this game (fresh round)
      try {
        await prisma.spyGameVote.deleteMany({ where: { gameId } });
        console.log(`🧹 Cleared previous votes for game ${gameId}`);
      } catch (e) {
        console.log('⚠️ Could not clear previous votes (may be none):', e?.message || e);
      }
      
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
        
        // Resolve the most up-to-date socket for this player
        let targetSocket = null;
        if (player.socketId) {
          targetSocket = io.sockets.sockets.get(player.socketId);
        }
        if (!targetSocket) {
          const mappedId = userSockets[player.userId];
          if (mappedId) {
            const candidate = io.sockets.sockets.get(mappedId);
            if (candidate) {
              targetSocket = candidate;
              // Update in-memory socketId so future emits use the current one
              gameData.players[index].socketId = mappedId;
            }
          }
        }
        
        if (targetSocket) {
          // Ensure this socket is in the game room
          try { targetSocket.join(`spy_game_${gameId}`); } catch {}
          targetSocket.emit('spy_game_started', {
              word: playerWords[index].word,
              isSpy: playerWords[index].isSpy,
              gameData
            });
            console.log(`✅ Sent word to player ${player.userId}`);
          } else {
            console.log(`❌ Socket not found for player ${player.userId} (socketId: ${player.socketId})`);
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
      if (!socket.userId) {
        console.log('❌ submit_vote: Missing socket.userId; vote ignored');
        return;
      }
      console.log(`🗳️ submit_vote received - voter: ${socket.userId}, votedFor: ${votedForId}, gameId: ${gameId}`);
      
      // Save vote to database
      const existing = await prisma.spyGameVote.findFirst({
        where: { gameId, voterId: socket.userId }
      });
      if (existing) {
        await prisma.spyGameVote.update({
          where: { id: existing.id },
          data: { votedForId }
        });
        console.log(`🔁 Updated vote for voter ${socket.userId} -> ${votedForId}`);
      } else {
        await prisma.spyGameVote.create({
          data: { gameId, voterId: socket.userId, votedForId }
        });
        console.log(`✅ Created vote for voter ${socket.userId} -> ${votedForId}`);
      }
      
      // Notify all players about the vote
      io.to(`spy_game_${gameId}`).emit('vote_submitted', {
        voterId: socket.userId,
        votedForId
      });
      
      // Check if all players have voted
      const votes = await prisma.spyGameVote.findMany({
        where: { gameId }
      });
      const uniqueVoters = new Set(votes.map(v => v.voterId)).size;
      const expectedVoters = gameData.players.length;
      console.log(`🧮 Votes tally - uniqueVoters: ${uniqueVoters}/${expectedVoters}, totalRows: ${votes.length}`);
      if (uniqueVoters >= expectedVoters) {
        // End game and reveal results
        await endSpyGame(gameId);
      }
      
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  });

  socket.on('webrtc_join', (data) => {
    const { gameId } = data || {};
    if (!gameId) return;
    try {
      const room = `spy_game_${gameId}`;
      // Ensure the socket is in the spy game room
      try { socket.join(room); } catch {}

      // Send back current peers in room (socket ids)
      const roomSockets = io.sockets.adapter.rooms.get(room) || new Set();
      const peers = Array.from(roomSockets).filter((id) => id !== socket.id);
      socket.emit('webrtc_peers', { peers });

      // Notify others that this user joined
      socket.to(room).emit('webrtc_user_joined', { socketId: socket.id });
    } catch (e) {}
  });

  socket.on('webrtc_offer', (data) => {
    const { targetSocketId, sdp } = data || {};
    if (!targetSocketId || !sdp) return;
    io.to(targetSocketId).emit('webrtc_offer', { from: socket.id, sdp });
  });

  socket.on('webrtc_answer', (data) => {
    const { targetSocketId, sdp } = data || {};
    if (!targetSocketId || !sdp) return;
    io.to(targetSocketId).emit('webrtc_answer', { from: socket.id, sdp });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    const { targetSocketId, candidate } = data || {};
    if (!targetSocketId || !candidate) return;
    io.to(targetSocketId).emit('webrtc_ice_candidate', { from: socket.id, candidate });
  });

  socket.on('webrtc_leave', (data) => {
    const { gameId } = data || {};
    if (gameId) {
      const room = `spy_game_${gameId}`;
      socket.to(room).emit('webrtc_user_left', { socketId: socket.id });
      try { socket.leave(room); } catch {}
    }
  });
});

// Helper Functions
async function endSpyGame(gameId) {
  try {
    console.log(`🏁 endSpyGame called for gameId=${gameId}`);
    const gameData = spyGames.get(gameId);
    if (!gameData) return;

    // Fetch all votes for this game
    const votes = await prisma.spyGameVote.findMany({ where: { gameId } });

    // Tally votes
    const tally = new Map();
    for (const v of votes) {
      const count = tally.get(v.votedForId) || 0;
      tally.set(v.votedForId, count + 1);
    }

    // Determine voted out user (highest votes)
    let votedOutUserId = null;
    let maxVotes = -1;
    let topCandidates = [];
    for (const [userId, count] of tally.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        topCandidates = [userId];
      } else if (count === maxVotes) {
        topCandidates.push(userId);
      }
    }
    if (topCandidates.length === 1) {
      votedOutUserId = topCandidates[0];
    }

    // Determine spy from assigned words mapping
    const spyMapping = (gameData.playerWords || []).find((p) => p.isSpy);
    const spyUserId = spyMapping ? spyMapping.userId : null;

    // Decide winner
    let winner = 'UNDECIDED';
    if (votedOutUserId && spyUserId) {
      winner = votedOutUserId === spyUserId ? 'VILLAGERS' : 'SPY';
    }

    // Update game state
    gameData.currentPhase = 'REVEAL';
    try {
      await prisma.spyGame.update({
        where: { id: gameId },
        data: { status: 'ENDED', currentPhase: 'REVEAL' }
      });
    } catch {}

    const payload = {
      gameId,
      winner,
      votedOutUserId,
      spyUserId,
      votes: votes.map((v) => ({ voterId: v.voterId, votedForId: v.votedForId })),
      tally: Object.fromEntries(tally),
      players: gameData.players.map((p) => ({ userId: p.userId, name: p.name })),
    };

    // Broadcast results to room and directly to each player socket as a fallback
    console.log(`📣 Emitting spy_game_ended to room spy_game_${gameId} with winner=${winner}, votedOut=${votedOutUserId}, spy=${spyUserId}`);
    io.to(`spy_game_${gameId}`).emit('spy_game_ended', payload);
    for (const player of gameData.players) {
      if (player.socketId) {
        try { io.to(player.socketId).emit('spy_game_ended', payload); } catch {}
      }
    }

    // Schedule cleanup after reveal so clients can see results
    scheduleSpyGameCleanup(gameId, 12000);
  } catch (error) {
    console.error('❌ Error ending spy game:', error);
  }
}

function scheduleSpyGameCleanup(gameId, delayMs = 10000) {
  try {
    console.log(`🧹 Scheduling cleanup for game ${gameId} in ${delayMs}ms`);
    setTimeout(() => {
      try {
        const gameData = spyGames.get(gameId);
        const room = `spy_game_${gameId}`;
        // Ask sockets to leave room (best-effort)
        try { io.in(room).socketsLeave(room); } catch {}

        // Remove socket -> game mappings
        if (gameData && Array.isArray(gameData.players)) {
          for (const p of gameData.players) {
            if (p.socketId) {
              try { spyGamePlayers.delete(p.socketId); } catch {}
            }
          }
        }

        // Remove game from memory
        spyGames.delete(gameId);
        console.log(`🧼 Cleaned up game ${gameId}. Active games in memory: ${spyGames.size}`);
      } catch (e) {
        console.log('⚠️ Cleanup error:', e?.message || e);
      }
    }, delayMs);
  } catch (e) {
    console.log('⚠️ Failed to schedule cleanup:', e?.message || e);
  }
}
async function generateQuestions(quizData) {
  console.log('🔍 Generating questions for quiz data:', quizData);
  
  try {
    const { categoryId, questionCount = 5 } = quizData;
    
    console.log(`🔍 Looking for questions in category: ${categoryId}`);
    console.log(`🔍 Question count needed: ${questionCount}`);
    
    // First check if category exists
    const category = await prisma.questionCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true }
    });
    
    if (!category) {
      console.log(`❌ Category not found: ${categoryId}`);
      throw new Error(`Category ${categoryId} not found`);
    }
    
    console.log(`✅ Category found: ${category.name} (${category.id})`);
    
    // Try QuestionBankItem first
    console.log(`🔍 Checking QuestionBankItem table...`);
    let totalQuestions = await prisma.questionBankItem.count({
      where: {
        categoryId: categoryId,
        isActive: true
      }
    });
    
    console.log(`📊 Total questions in QuestionBankItem (isActive=true): ${totalQuestions}`);
    
    // If no active questions found, check all questions regardless of isActive status
    if (totalQuestions === 0) {
      console.log(`🔍 No active questions found, checking all questions in QuestionBankItem...`);
      totalQuestions = await prisma.questionBankItem.count({
        where: {
          categoryId: categoryId
        }
      });
      console.log(`📊 Total questions in QuestionBankItem (all): ${totalQuestions}`);
    }
    
    let questions = [];
    let sourceTable = 'QuestionBankItem';
    
    if (totalQuestions === 0) {
      // Try Question table as fallback
      console.log(`🔍 No questions in QuestionBankItem, checking Question table...`);
      totalQuestions = await prisma.question.count({
        where: {
          categoryId: categoryId
        }
      });
      
      console.log(`📊 Total questions in Question table: ${totalQuestions}`);
      sourceTable = 'Question';
    }
    
    if (totalQuestions === 0) {
      console.log(`❌ No questions found in either table for category ${category.name}`);
      throw new Error(`No questions found for category ${category.name}`);
    }
    
    // Fetch questions from the appropriate table
    if (sourceTable === 'QuestionBankItem') {
      if (totalQuestions <= questionCount) {
        // If we have fewer questions than needed, take all
        console.log(`📝 Taking all ${totalQuestions} questions from QuestionBankItem`);
        
        // First try to get active questions
        questions = await prisma.questionBankItem.findMany({
          where: {
            categoryId: categoryId,
            isActive: true
          },
          select: {
            id: true,
            text: true,
            options: true,
            correct: true,
            isActive: true
          }
        });
        
        // If no active questions, get all questions
        if (questions.length === 0) {
          console.log(`📝 No active questions, taking all questions from QuestionBankItem`);
          questions = await prisma.questionBankItem.findMany({
            where: {
              categoryId: categoryId
            },
            select: {
              id: true,
              text: true,
              options: true,
              correct: true,
              isActive: true
            }
          });
        }
      } else {
        // Use random selection for variety
        console.log(`📝 Selecting ${questionCount} random questions from ${totalQuestions} available in QuestionBankItem`);
        
        // First try to get random active questions
        questions = await prisma.$queryRaw`
          SELECT id, text, options, correct, isActive
          FROM QuestionBankItem 
          WHERE categoryId = ${categoryId} AND isActive = true 
          ORDER BY RAND() 
          LIMIT ${questionCount}
        `;
        
        // If no active questions found, get random questions regardless of isActive
        if (questions.length === 0) {
          console.log(`📝 No active questions found, selecting random questions regardless of isActive status`);
          questions = await prisma.$queryRaw`
            SELECT id, text, options, correct, isActive
            FROM QuestionBankItem 
            WHERE categoryId = ${categoryId} 
            ORDER BY RAND() 
            LIMIT ${questionCount}
          `;
        }
      }
    } else {
      // Use Question table
      if (totalQuestions <= questionCount) {
        // If we have fewer questions than needed, take all
        console.log(`📝 Taking all ${totalQuestions} questions from Question table`);
        questions = await prisma.question.findMany({
          where: {
            categoryId: categoryId
          },
          select: {
            id: true,
            text: true,
            options: true,
            correctAnswer: true
          }
        });
      } else {
        // Use random selection for variety
        console.log(`📝 Selecting ${questionCount} random questions from ${totalQuestions} available in Question table`);
        
        // Get random questions using raw SQL for better randomization
        questions = await prisma.$queryRaw`
          SELECT id, text, options, correctAnswer 
          FROM Question 
          WHERE categoryId = ${categoryId} 
          ORDER BY RAND() 
          LIMIT ${questionCount}
        `;
      }
    }
    
    console.log(`✅ Found ${questions.length} questions from ${sourceTable} for category ${category.name}`);
    
    // Log first few questions for debugging
    questions.slice(0, 3).forEach((q, index) => {
      console.log(`📝 Question ${index + 1} (from ${sourceTable}):`);
      console.log(`   - Text: ${q.text.substring(0, 100)}...`);
      console.log(`   - Options: ${JSON.stringify(q.options)}`);
      console.log(`   - Correct Answer: ${sourceTable === 'QuestionBankItem' ? q.correct : q.correctAnswer}`);
    });
    
    // Transform questions to match expected format
    const transformedQuestions = questions.map((q, index) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correct: sourceTable === 'QuestionBankItem' ? q.correct : q.correctAnswer, // Use correct field name based on table
      questionIndex: index
    }));
    
    console.log('📝 Transformed questions:', transformedQuestions.map(q => ({
      text: q.text.substring(0, 50) + '...',
      options: q.options,
      correct: q.correct
    })));
    
    return transformedQuestions;
    
  } catch (error) {
    console.error('❌ Error generating questions:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Fallback: Return sample questions
    const fallbackQuestions = [
      {
        id: 'fallback_1',
        text: 'What is the capital of India?',
        options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
        correct: 1, // Delhi
        questionIndex: 0
      },
      {
        id: 'fallback_2',
        text: 'Which planet is closest to the Sun?',
        options: ['Venus', 'Mercury', 'Earth', 'Mars'],
        correct: 1, // Mercury
        questionIndex: 1
      },
      {
        id: 'fallback_3',
        text: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correct: 1, // 4
        questionIndex: 2
      },
      {
        id: 'fallback_4',
        text: 'Which color is the sky?',
        options: ['Red', 'Green', 'Blue', 'Yellow'],
        correct: 2, // Blue
        questionIndex: 3
      },
      {
        id: 'fallback_5',
        text: 'How many days in a week?',
        options: ['5', '6', '7', '8'],
        correct: 2, // 7
        questionIndex: 4
      }
    ];
    
    console.log('⚠️ Using fallback questions due to error');
    console.log('⚠️ Fallback questions:', fallbackQuestions);
    return fallbackQuestions;
  }
}

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
  
  // Start timeout for first question
  startQuestionTimer(matchId, 0, 15);
  
  console.log(`Match ${matchId} started with first question`);
}

// New function to handle question timers
function startQuestionTimer(matchId, questionIndex, timeLimit) {
  const match = activeMatches.get(matchId);
  if (!match) return;
  
  console.log(`⏰ Starting timer for question ${questionIndex} in match ${matchId}`);
  console.log(`   - Time limit: ${timeLimit} seconds`);
  console.log(`   - Player 1: ${match.player1Id}`);
  console.log(`   - Player 2: ${match.player2Id}`);
  
  // Set timeout for this question
  match.questionTimer = setTimeout(() => {
    console.log(`⏰ Time's up for question ${questionIndex} in match ${matchId}`);
    
    // Check if both players have answered
    const p1Answered = match.player1Answers[questionIndex];
    const p2Answered = match.player2Answers[questionIndex];
    
    console.log(`📊 Timeout check for question ${questionIndex}:`);
    console.log(`   - Player 1 answered: ${!!p1Answered}`);
    console.log(`   - Player 2 answered: ${!!p2Answered}`);
    
    // If player 1 hasn't answered, mark as timeout
    if (!p1Answered) {
      console.log(`⏰ Player 1 (${match.player1Id}) timed out on question ${questionIndex}`);
      match.player1Answers[questionIndex] = { 
        answer: null, 
        timeSpent: timeLimit, 
        timestamp: Date.now(),
        timedOut: true 
      };
      
      // Notify player 2 that opponent timed out
      const player2Socket = io.sockets.sockets.get(match.player2SocketId);
      if (player2Socket && player2Socket.connected) {
        player2Socket.emit('opponent_answered', { 
          questionIndex,
          answer: null,
          timedOut: true
        });
        console.log(`📤 Sent timeout notification to player 2`);
      }
    }
    
    // If player 2 hasn't answered, mark as timeout
    if (!p2Answered) {
      console.log(`⏰ Player 2 (${match.player2Id}) timed out on question ${questionIndex}`);
      match.player2Answers[questionIndex] = { 
        answer: null, 
        timeSpent: timeLimit, 
        timestamp: Date.now(),
        timedOut: true 
      };
      
      // Notify player 1 that opponent timed out
      const player1Socket = io.sockets.sockets.get(match.player1SocketId);
      if (player1Socket && player1Socket.connected) {
        player1Socket.emit('opponent_answered', { 
          questionIndex,
          answer: null,
          timedOut: true
        });
        console.log(`📤 Sent timeout notification to player 1`);
      }
    }
    
    // Move to next question or end game
    setTimeout(() => {
      if (questionIndex < match.totalQuestions - 1) {
        match.currentQuestion = questionIndex + 1;
        const nextQuestion = match.questions[match.currentQuestion];
        console.log('🔄 Moving to next question after timeout:', match.currentQuestion);
        console.log('Next question:', nextQuestion);
        
        // Get the actual socket objects
        const player1Socket = io.sockets.sockets.get(match.player1SocketId);
        const player2Socket = io.sockets.sockets.get(match.player2SocketId);
        
        if (player1Socket && player1Socket.connected) {
          console.log('Sending next_question to player 1 after timeout');
          player1Socket.emit('next_question', {
            questionIndex: match.currentQuestion,
            question: nextQuestion
          });
        } else {
          console.log('Player 1 socket not found or disconnected after timeout');
        }
        
        if (player2Socket && player2Socket.connected) {
          console.log('Sending next_question to player 2 after timeout');
          player2Socket.emit('next_question', {
            questionIndex: match.currentQuestion,
            question: nextQuestion
          });
        } else {
          console.log('Player 2 socket not found or disconnected after timeout');
        }
        
        // Start timer for next question
        startQuestionTimer(matchId, match.currentQuestion, 15);
        
      } else {
        console.log('🏁 All questions completed after timeout, ending match');
        endMatch(matchId);
      }
    }, 1000); // 1 second delay after timeout
    
  }, timeLimit * 1000); // Convert seconds to milliseconds
  
  console.log(`⏰ Timer set for question ${questionIndex} - ${timeLimit} seconds`);
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
    
  }}

// Start HTTP server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
  console.log(`🔗 WebSocket URL: ws://localhost:${PORT}/api/socket`);
  console.log(`🌐 HTTP URL: http://localhost:${PORT}`);
});