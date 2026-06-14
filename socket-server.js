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
    // REDIS_URL = internal (Railway same project), REDIS_PUBLIC_URL = external (local→cloud)
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL;
    const redisConfig = redisUrl
      ? { url: redisUrl }
      : {
          socket: { host: 'localhost', port: 6379 },
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: null
        };
    redis = Redis.createClient(redisConfig);

    redis.on('connect', () => {
redisConnected = true;
    });

    redis.on('error', (err) => {
redisConnected = false;
    });

    redis.on('end', () => {
redisConnected = false;
    });

    await redis.connect();
  } catch (error) {
redisConnected = false;
  }
}

// Initialize Redis on startup
initializeRedis();

// Test database connection
async function testDatabaseConnection() {
  try {
const userCount = await prisma.user.count();
} catch {}
}

// Test database on startup
testDatabaseConnection();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/api/socket',
  addTrailingSlash: false,
  allowEIO3: true,
  transports: ['websocket', 'polling'], // Prefer websocket for better performance
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  maxHttpBufferSize: 1e6, // 1MB
  // Connection limits
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
});

// Store user socket mappings
const userSockets = {};

// Spy game state (used by typing/stop_typing handlers – empty if feature unused)
const spyGames = new Map();

// Timetable reminder intervals
const timetableReminderIntervals = new Map(); // userId -> interval

// Live exam auto-end intervals
const liveExamAutoEndIntervals = new Map(); // examId -> interval

// Battle Quiz Matchmaking - Keep existing memory system as fallback
const waitingPlayers = new Map(); // quizId -> array of waiting players
const activeMatches = new Map(); // matchId -> match object only
const playerToMatchId = new Map(); // userId -> matchId (clean separation)
const privateRooms = new Map(); // roomCode -> room data

// Matchmaking lock per queue - prevents race when 100+ users join at once
const matchmakingLocks = new Map(); // quizId -> boolean (true = locked)

// ---------------- Live Quiz (Always-on, join anytime) ----------------
const LIVE_QUIZ_DEFAULT_QUESTION_COUNT = 10;
/** Max questions per round; 0 = use all questions in category. */
const LIVE_QUIZ_MAX_QUESTIONS_PER_ROUND = 0;
const LIVE_QUIZ_ACTIVE_WINDOW_MS = 45_000;
const LIVE_QUIZ_TOP_LEADERBOARD_COUNT = 6;
const LIVE_QUIZ_REFRESH_DEBOUNCE_MS = 1500;
const liveQuizCategoryLoops = new Map(); // categoryId -> { timeout, sessionId }
const liveQuizRefreshDebounce = new Map(); // sessionId -> { timeoutId, categoryId }

async function pickLiveQuizQuestionIds(categoryId, questionCount) {
  const items = await prisma.questionBankItem.findMany({
    where: { categoryId, isActive: true },
    select: { id: true },
    take: questionCount * 3
  });
  const shuffled = items.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, questionCount).map((q) => q.id);
}

async function getOrCreatePlayingLiveQuizSession(categoryId) {
  let session = await prisma.liveQuizSession.findFirst({
    where: { categoryId, status: 'PLAYING' },
    orderBy: { startedAt: 'desc' }
  });
  if (session) return session;

  const category = await prisma.questionCategory.findFirst({
    where: { id: categoryId, isActive: true },
    select: { id: true, name: true }
  });
  if (!category) throw new Error(`Category not found: ${categoryId}`);

  // Use actual QuestionBankItem count (same source as pickLiveQuizQuestionIds) so round length matches available questions
  const availableCount = await prisma.questionBankItem.count({
    where: { categoryId, isActive: true }
  });
  const questionCount =
    LIVE_QUIZ_MAX_QUESTIONS_PER_ROUND > 0
      ? Math.min(LIVE_QUIZ_MAX_QUESTIONS_PER_ROUND, availableCount || LIVE_QUIZ_DEFAULT_QUESTION_COUNT)
      : (availableCount || LIVE_QUIZ_DEFAULT_QUESTION_COUNT);
  const questionIds = await pickLiveQuizQuestionIds(categoryId, questionCount);
  if (!questionIds.length) throw new Error(`No questions available for category: ${categoryId}`);

  session = await prisma.liveQuizSession.create({
    data: {
      categoryId,
      title: category.name,
      status: 'PLAYING',
      currentQuestionIndex: 0,
      totalQuestions: questionIds.length,
      timePerQuestion: 10,
      questionIds: questionIds,
      startedAt: new Date()
    }
  });
  return session;
}

async function getLiveQuizQuestion(session, questionIndex) {
  const questionIds = (session.questionIds || []);
  const qid = questionIds?.[questionIndex];
  if (!qid) return null;
  const q = await prisma.questionBankItem.findUnique({ where: { id: qid } });
  if (!q) return null;
  return {
    id: q.id,
    text: q.text,
    options: q.options || [],
    correct: q.correct ?? 0,
    questionIndex
  };
}

async function getLiveQuizLeaderboard(sessionId) {
  const activeSince = new Date(Date.now() - LIVE_QUIZ_ACTIVE_WINDOW_MS);
  const participants = await prisma.liveQuizSessionParticipant.findMany({
    where: { sessionId, status: 'PLAYING', lastSeenAt: { gte: activeSince } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ score: 'desc' }, { correctCount: 'desc' }, { totalTimeMs: 'asc' }]
  });
  return participants.map((p, i) => ({
    rank: i + 1,
    userId: p.userId,
    name: p.user?.name || 'Unknown',
    correctCount: p.correctCount,
    wrongCount: p.wrongCount,
    score: p.score,
    totalTimeMs: p.totalTimeMs
  }));
}

function computeLiveQuizQuestionEndsAt(session) {
  const startedAtMs = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
  const t = (session.timePerQuestion || 10) * 1000;
  return startedAtMs + (session.currentQuestionIndex + 1) * t;
}

async function ensureLiveQuizCategoryLoop(categoryId, io) {
  if (liveQuizCategoryLoops.has(categoryId)) return;
  liveQuizCategoryLoops.set(categoryId, { timeout: null, sessionId: null });
  scheduleLiveQuizTick(categoryId, io).catch(() => {});
}

async function scheduleLiveQuizTick(categoryId, io) {
  const state = liveQuizCategoryLoops.get(categoryId);
  if (!state) return;

  const room = `live_quiz_cat_${categoryId}`;
  const roomSet = io.sockets.adapter.rooms.get(room);
  const playingCount = roomSet ? roomSet.size : 0;

  // Stop loop when nobody is in the room
  if (!playingCount) {
    if (state.timeout) clearTimeout(state.timeout);
    liveQuizCategoryLoops.delete(categoryId);
    return;
  }

  let session;
  try {
    session = await getOrCreatePlayingLiveQuizSession(categoryId);
  } catch (e) {
// try again later
    state.timeout = setTimeout(() => scheduleLiveQuizTick(categoryId, io), 5000);
    return;
  }

  state.sessionId = session.id;
  const now = Date.now();
  const endsAt = computeLiveQuizQuestionEndsAt(session);
  const delayMs = Math.max(500, endsAt - now);

  state.timeout = setTimeout(async () => {
    try {
      await advanceLiveQuiz(categoryId, io);
    } catch {} finally {
      scheduleLiveQuizTick(categoryId, io).catch(() => {});
    }
  }, delayMs);
}

async function advanceLiveQuiz(categoryId, io) {
  const room = `live_quiz_cat_${categoryId}`;
  const session = await prisma.liveQuizSession.findFirst({
    where: { categoryId, status: 'PLAYING' },
    orderBy: { startedAt: 'desc' }
  });
  if (!session) return;

  const nextIndex = session.currentQuestionIndex + 1;
  if (nextIndex >= session.totalQuestions) {
    // Finish current session
    await prisma.liveQuizSession.update({
      where: { id: session.id },
      data: { status: 'FINISHED', currentQuestionIndex: nextIndex }
    });

    // Start a new round/session
    const category = await prisma.questionCategory.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true, name: true }
    });
    if (!category) return;
    const availableCount = await prisma.questionBankItem.count({
      where: { categoryId, isActive: true }
    });
    const questionCount =
      LIVE_QUIZ_MAX_QUESTIONS_PER_ROUND > 0
        ? Math.min(LIVE_QUIZ_MAX_QUESTIONS_PER_ROUND, availableCount || LIVE_QUIZ_DEFAULT_QUESTION_COUNT)
        : (availableCount || LIVE_QUIZ_DEFAULT_QUESTION_COUNT);
    const questionIds = await pickLiveQuizQuestionIds(categoryId, questionCount);
    if (!questionIds.length) return;

    const newSession = await prisma.liveQuizSession.create({
      data: {
        categoryId,
        title: category.name,
        status: 'PLAYING',
        currentQuestionIndex: 0,
        totalQuestions: questionIds.length,
        timePerQuestion: session.timePerQuestion || 10,
        questionIds,
        startedAt: new Date()
      }
    });

    // Auto-join all currently connected sockets (so they appear in leaderboard)
    try {
      const sockets = await io.in(room).fetchSockets();
      await Promise.all(
        sockets
          .filter((s) => s.userId)
          .map((s) =>
            prisma.liveQuizSessionParticipant.upsert({
              where: { sessionId_userId: { sessionId: newSession.id, userId: s.userId } },
              create: { sessionId: newSession.id, userId: s.userId, status: 'PLAYING', lastSeenAt: new Date() },
              update: { status: 'PLAYING', lastSeenAt: new Date() }
            }).then(() => {
              s.liveQuizSessionId = newSession.id;
            })
          )
      );
    } catch {}

    const question = await getLiveQuizQuestion(newSession, 0);
    const fullLeaderboard = await getLiveQuizLeaderboard(newSession.id);
    const playingCount = fullLeaderboard.length;
    const topLeaderboard = fullLeaderboard.slice(0, LIVE_QUIZ_TOP_LEADERBOARD_COUNT);
    const allRanks = Object.fromEntries(fullLeaderboard.map((e, i) => [e.userId, i + 1]));
    io.to(room).emit('live_quiz_round_started', {
      categoryId,
      session: {
        id: newSession.id,
        title: newSession.title,
        categoryId: newSession.categoryId,
        status: newSession.status,
        currentQuestionIndex: newSession.currentQuestionIndex,
        totalQuestions: newSession.totalQuestions,
        timePerQuestion: newSession.timePerQuestion,
        startedAt: newSession.startedAt
      },
      currentQuestion: question,
      questionEndsAt: computeLiveQuizQuestionEndsAt(newSession),
      leaderboard: topLeaderboard,
      playingCount,
      allRanks
    });
    return;
  }

  const updated = await prisma.liveQuizSession.update({
    where: { id: session.id },
    data: { currentQuestionIndex: nextIndex }
  });
  const question = await getLiveQuizQuestion(updated, nextIndex);
  const leaderboard = await getLiveQuizLeaderboard(updated.id);
  const playingCount = leaderboard.length;
  io.to(room).emit('live_quiz_next_question', {
    categoryId,
    session: {
      id: updated.id,
      title: updated.title,
      categoryId: updated.categoryId,
      status: updated.status,
      currentQuestionIndex: updated.currentQuestionIndex,
      totalQuestions: updated.totalQuestions,
      timePerQuestion: updated.timePerQuestion,
      startedAt: updated.startedAt
    },
    currentQuestion: question,
    questionEndsAt: computeLiveQuizQuestionEndsAt(updated),
    playingCount
  });
}


// Redis Queue Management with fallback
class QueueManager {
  async addToQueue(userId, quizId, playerData) {
    try {
      if (redisConnected && redis) {
        // Use Redis
        await redis.lPush(`queue:${quizId}`, JSON.stringify(playerData));
        await redis.expire(`queue:${quizId}`, 300); // 5 minutes TTL
} else {
        // Fallback to memory
        if (!waitingPlayers.has(quizId)) {
          waitingPlayers.set(quizId, []);
        }
        waitingPlayers.get(quizId).push(playerData);
}
    } catch (error) {
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
        const queueData = await redis.lRange(`queue:${quizId}`, 0, -1);
        return queueData.map(item => JSON.parse(item));
      } else {
        // Fallback to memory
        return waitingPlayers.get(quizId) || [];
      }
    } catch (error) {
return waitingPlayers.get(quizId) || [];
    }
  }

  async removeFromQueue(quizId, playerData) {
    try {
      if (redisConnected && redis) {
        // Remove by socketId - use exact Redis string for reliable LREM
        const queueKey = `queue:${quizId}`;
        const allItems = await redis.lRange(queueKey, 0, -1);
        const targetSocketId = playerData.socketId;
        for (let i = 0; i < allItems.length; i++) {
          try {
            const parsed = JSON.parse(allItems[i]);
            if (parsed.socketId === targetSocketId) {
              await redis.lRem(queueKey, 1, allItems[i]);
              break;
            }
          } catch (e) { /* skip invalid JSON */ }
        }
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
        return await redis.lLen(`queue:${quizId}`);
      } else {
        return (waitingPlayers.get(quizId) || []).length;
      }
    } catch (error) {
return (waitingPlayers.get(quizId) || []).length;
    }
  }
}

const queueManager = new QueueManager();

// Helper function to check if a player is in any active match
function isPlayerInActiveMatch(userId) {
  return playerToMatchId.has(userId);
}

// Helper function to get active match for a player
function getActiveMatchForPlayer(userId) {
  const matchId = playerToMatchId.get(userId);
  return matchId ? activeMatches.get(matchId) : null;
}

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
}
      });

      // Clean up old matches (older than 10 minutes) and stuck matches
      const now = Date.now();
      const matchesToDelete = [];
      activeMatches.forEach((match, matchId) => {
        if (typeof match !== 'object' || !match.player1Id) return;
        const matchStartTime = match.startTime || match.createdAt || now;
        const matchAge = now - matchStartTime;
        const isOld = matchAge > 600000; // 10 minutes
        const isStuck = match.status === 'PLAYING' && matchAge > 300000; // 5 minutes for stuck
        
        if (isOld || isStuck) {
          matchesToDelete.push({ matchId, match, reason: isOld ? 'old' : 'stuck', age: Math.round(matchAge/1000) });
        }
      });
      
      matchesToDelete.forEach(({ matchId, match, reason, age }) => {
playerToMatchId.delete(match.player1Id);
        playerToMatchId.delete(match.player2Id);
        activeMatches.delete(matchId);
      });

      // Clean up old private rooms (older than 30 minutes)
      privateRooms.forEach((room, roomCode) => {
        if (now - (room.createdAt || now) > 1800000) { // 30 minutes
          privateRooms.delete(roomCode);
}
      });

// Log active matches for debugging
      if (activeMatches.size > 0) {
activeMatches.forEach((match, matchId) => {
          const matchStartTime = match.startTime || match.createdAt || Date.now();
          const age = Math.round((Date.now() - matchStartTime) / 1000);
});
      }
      
      // Memory usage warning
      const totalConnections = io.engine.clientsCount;
      if (totalConnections > 1500) {
}
      
    } catch {}
  }, 30000); // Every 30 seconds for high load
}

// Debug function to clear all active matches
function clearAllActiveMatches() {
const clearedCount = activeMatches.size;
  activeMatches.clear();
  playerToMatchId.clear();
  
}

// Start memory cleanup
cleanupMemory();

io.on('connection', (socket) => {
socket.on('register_user', (userId) => {
    if (userId) {
      userSockets[userId] = socket.id;
      socket.userId = userId; // Store userId in socket object
// Update socket IDs in active matches if this user is in a match
      activeMatches.forEach((match, matchId) => {
        if (match.player1Id === userId) {
          if (match.player1SocketId !== socket.id) {
match.player1SocketId = socket.id;
          }
        } else if (match.player2Id === userId) {
          if (match.player2SocketId !== socket.id) {
match.player2SocketId = socket.id;
          }
        }
      });
    }
  });

  // Battle Quiz Events
  socket.on('join_matchmaking', async (data) => {
const { categoryId, mode, amount } = data;
    const userId = socket.userId;

    if (!userId) {
socket.emit('matchmaking_error', { message: 'User not authenticated' });
      return;
    }

// Get user details
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, wallet: true }
      });
    } catch (error) {
socket.emit('matchmaking_error', { message: 'Error fetching user details' });
      return;
    }

    if (!user) {
socket.emit('matchmaking_error', { message: 'User not found' });
      return;
    }

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
} else if (amount) {
          // Create new battle quiz with specified amount
// Get category details
          const category = await prisma.questionCategory.findUnique({
            where: { id: categoryId }
          });

          if (!category) {
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
}
      }
      
    } catch (error) {
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
socket.emit('matchmaking_error', { message: 'User not found' });
        return;
      }
      
if (user.wallet < entryFee) {
socket.emit('matchmaking_error', { 
          message: `Insufficient balance. Required: ₹${entryFee}, Available: ₹${user.wallet}`,
          requiredAmount: entryFee,
          availableBalance: user.wallet
        });
        return;
      }
      
} catch (error) {
socket.emit('matchmaking_error', { message: 'Error checking wallet balance' });
      return;
    }
    
    // Use quizId or categoryId for queue
    const queueId = battleQuiz?.id || categoryId || 'general';
// Remove from previous queue if user joined different category earlier (prevents ghost entries)
    const prevQueueId = socket.joinedQueueId;
    if (prevQueueId && prevQueueId !== queueId) {
      const prevPlayers = await queueManager.getQueue(prevQueueId);
      const prevPlayer = prevPlayers.find(p => p.socketId === socket.id);
      if (prevPlayer) {
        await queueManager.removeFromQueue(prevQueueId, prevPlayer);
}
    }
    
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
socket.join(`quiz_${queueId}`);
    socket.joinedQueueId = queueId; // Store for correct cleanup on cancel/disconnect
    
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
});
  });

  socket.on('cancel_matchmaking', async () => {
// Remove from the correct queue (stored when joining)
    const queueId = socket.joinedQueueId || 'general';
    const players = await queueManager.getQueue(queueId);
    const playerToRemove = players.find(p => p.socketId === socket.id);
    if (playerToRemove) {
      await queueManager.removeFromQueue(queueId, playerToRemove);
}
    socket.joinedQueueId = null;
    
    socket.emit('matchmaking_cancelled');
  });

  socket.on('create_private_room', (data) => {
    const { userId, quizData, roomCode } = data;
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
const { userId, roomCode, quizData } = data;
// First check if room exists in memory
    let room = privateRooms.get(roomCode);
    
    // If not in memory, check database
    if (!room) {
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
socket.emit('room_error', { message: 'Room not found' });
          return;
        }
        
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
        
privateRooms.set(roomCode, room);
        
      } catch (error) {
socket.emit('room_error', { message: 'Error finding room' });
        return;
      }
    }
    
    // Check if user is already in the room
    const existingPlayer = room.players.find(p => p.userId === userId);
    if (existingPlayer) {
      // Update socket ID if reconnecting
      existingPlayer.socketId = socket.id;
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
} catch (error) {
// Continue anyway, just log the error
        }
      }
      
      // Add to memory
      room.players.push({
        userId,
        socketId: socket.id,
        quizData: quizData || room.quizData
      });
      
}
    
    socket.join(`room_${roomCode}`);
    
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
});
    }
  });

  socket.on('start_private_game', async (data) => {
const { roomCode } = data;
    const room = privateRooms.get(roomCode);
    
    if (!room) {
socket.emit('room_error', { message: 'Room not found' });
      return;
    }
    
    // Check if user is the host
    if (room.creator !== socket.userId) {
socket.emit('room_error', { message: 'Only the host can start the game' });
      return;
    }
    
    // Check if enough players
    if (room.players.length < 2) {
socket.emit('room_error', { message: 'Need at least 2 players to start' });
      return;
    }
    
// Start the game
    try {
      await startPrivateRoomGame(roomCode);
    } catch (error) {
socket.emit('room_error', { message: 'Failed to start game' });
    }
  });

  socket.on('answer_question', (data) => {
// SECURITY: Use socket.userId - never trust userId from client
    const userId = socket.userId;
    const { matchId, questionIndex, answer, timeSpent } = data;
    if (!userId) {
return;
    }
const match = activeMatches.get(matchId);
    if (!match) {
return;
    }
    
// Get the question to verify the correct answer
    const question = match.questions[questionIndex];
    if (question) {
}
    
    // Record answer
if (match.player1Id === userId) {
      if (match.player1Answers[questionIndex]) {
return;
      }
      match.player1Answers[questionIndex] = { answer, timeSpent, timestamp: Date.now() };
} else if (match.player2Id === userId) {
      if (match.player2Answers[questionIndex]) {
return;
      }
      match.player2Answers[questionIndex] = { answer, timeSpent, timestamp: Date.now() };
}
    
    // Notify opponent that this player answered
    const opponentSocketId = match.player1Id === userId ? match.player2SocketId : match.player1SocketId;
const opponentSocket = io.sockets.sockets.get(opponentSocketId);
    if (opponentSocket && opponentSocket.connected) {
      opponentSocket.emit('opponent_answered', { 
        questionIndex,
        answer: answer // Send the specific answer
      });
}
    
    // Check if both players answered
    const p1Answered = match.player1Answers[questionIndex];
    const p2Answered = match.player2Answers[questionIndex];
if (p1Answered && p2Answered) {
// Clear the current question timer since both players answered
      if (match.questionTimer) {
        clearTimeout(match.questionTimer);
}
      
// Move to next question or end game
      setTimeout(() => {
        if (questionIndex < match.totalQuestions - 1) {
          match.currentQuestion = questionIndex + 1;
          const nextQuestion = match.questions[match.currentQuestion];
// Get the actual socket objects
          const player1Socket = io.sockets.sockets.get(match.player1SocketId);
          const player2Socket = io.sockets.sockets.get(match.player2SocketId);
          
          const { player1Score, player2Score } = calculateScoresUpTo(match, questionIndex);
          const timeLimit = (match.timePerQuestion ?? 15);
          if (player1Socket && player1Socket.connected) {
player1Socket.emit('next_question', {
              questionIndex: match.currentQuestion,
              question: nextQuestion,
              player1Score,
              player2Score,
              myScore: player1Score,
              opponentScore: player2Score,
              myPosition: 'player1',
              timeLimit
            });
          }
          
          if (player2Socket && player2Socket.connected) {
player2Socket.emit('next_question', {
              questionIndex: match.currentQuestion,
              question: nextQuestion,
              player1Score,
              player2Score,
              myScore: player2Score,
              opponentScore: player1Score,
              myPosition: 'player2',
              timeLimit
            });
          }
          
          // Start timer for next question
          startQuestionTimer(matchId, match.currentQuestion, timeLimit);
          
        } else {
endMatch(matchId);
        }
      }, 1000); // 1 second delay between questions to ensure client is ready
    }
  });

  socket.on('leave_battle_queue', async (quizId) => {
    const players = await queueManager.getQueue(quizId);
    const playerToRemove = players.find(p => p.socketId === socket.id);
    if (playerToRemove) {
      await queueManager.removeFromQueue(quizId, playerToRemove);
}
    socket.leave(`quiz_${quizId}`);
  });

  // ----- Live Quiz (separate from Battle Quiz - all events live_quiz_*) -----
  // Backwards compatible session-room prefix (old flow)
  const LIVE_QUIZ_PREFIX = 'live_quiz_';
  // Always-on category room prefix (new flow)
  const LIVE_QUIZ_CAT_PREFIX = 'live_quiz_cat_';
  socket.on('live_quiz_join', (data) => {
    const { sessionId } = data || {};
    if (!sessionId) return;
    const room = LIVE_QUIZ_PREFIX + sessionId;
    socket.join(room);
    socket.liveQuizSessionId = sessionId;
    const roomSet = io.sockets.adapter.rooms.get(room);
    const playingCount = roomSet ? roomSet.size : 0;
    io.to(room).emit('live_quiz_playing_count', { sessionId, playingCount });
});
  socket.on('live_quiz_leave', (data) => {
    const sessionId = data?.sessionId || socket.liveQuizSessionId;
    if (sessionId) {
      const room = LIVE_QUIZ_PREFIX + sessionId;
      socket.leave(room);
      socket.liveQuizSessionId = null;
      const roomSet = io.sockets.adapter.rooms.get(room);
      const playingCount = roomSet ? roomSet.size : 0;
      io.to(room).emit('live_quiz_playing_count', { sessionId, playingCount });
}
  });
  socket.on('live_quiz_broadcast_leaderboard', (data) => {
    const { sessionId, leaderboard, playingCount } = data || {};
    if (!sessionId) return;
    const room = LIVE_QUIZ_PREFIX + sessionId;
    io.to(room).emit('live_quiz_leaderboard', { sessionId, leaderboard, playingCount });
});
  socket.on('live_quiz_broadcast_next_question', (data) => {
    const { sessionId, currentQuestion, session } = data || {};
    if (!sessionId) return;
    const room = LIVE_QUIZ_PREFIX + sessionId;
    io.to(room).emit('live_quiz_next_question', { sessionId, currentQuestion, session });
});

  // Always-on: join category room, server pushes questions/timer
  socket.on('live_quiz_join_category', async (data) => {
    const { categoryId } = data || {};
    if (!categoryId) return;
    const room = LIVE_QUIZ_CAT_PREFIX + categoryId;
    socket.join(room);
    socket.liveQuizCategoryId = categoryId;
try {
      const session = await getOrCreatePlayingLiveQuizSession(categoryId);
      socket.liveQuizSessionId = session.id;

      if (socket.userId) {
        await prisma.liveQuizSessionParticipant.upsert({
          where: { sessionId_userId: { sessionId: session.id, userId: socket.userId } },
          create: { sessionId: session.id, userId: socket.userId, status: 'PLAYING', lastSeenAt: new Date() },
          update: { status: 'PLAYING', lastSeenAt: new Date() }
        });
      }

      const currentQuestion = await getLiveQuizQuestion(session, session.currentQuestionIndex);
      const fullLeaderboard = await getLiveQuizLeaderboard(session.id);
      const playingCount = fullLeaderboard.length;
      const topLeaderboard = fullLeaderboard.slice(0, LIVE_QUIZ_TOP_LEADERBOARD_COUNT);
      const allRanks = Object.fromEntries(fullLeaderboard.map((e, i) => [e.userId, i + 1]));

      socket.emit('live_quiz_state', {
        categoryId,
        session: {
          id: session.id,
          title: session.title,
          categoryId: session.categoryId,
          status: session.status,
          currentQuestionIndex: session.currentQuestionIndex,
          totalQuestions: session.totalQuestions,
          timePerQuestion: session.timePerQuestion,
          startedAt: session.startedAt
        },
        currentQuestion,
        questionEndsAt: computeLiveQuizQuestionEndsAt(session),
        leaderboard: topLeaderboard,
        playingCount,
        allRanks
      });

      io.to(room).emit('live_quiz_playing_count', { categoryId, playingCount });
      await ensureLiveQuizCategoryLoop(categoryId, io);
    } catch (e) {
socket.emit('room_error', { message: 'Failed to join live quiz' });
    }
  });

  socket.on('live_quiz_leave_category', async (data) => {
    const categoryId = data?.categoryId || socket.liveQuizCategoryId;
    if (!categoryId) return;
    const room = LIVE_QUIZ_CAT_PREFIX + categoryId;
    socket.leave(room);
    socket.liveQuizCategoryId = null;

    // Mark participant inactive quickly (so they drop from leaderboard)
    try {
      if (socket.userId && socket.liveQuizSessionId) {
        await prisma.liveQuizSessionParticipant.update({
          where: { sessionId_userId: { sessionId: socket.liveQuizSessionId, userId: socket.userId } },
          data: { lastSeenAt: new Date(0) }
        });
      }
    } catch {}

    const leaderboard = await getLiveQuizLeaderboard(socket.liveQuizSessionId).catch(() => []);
    const playingCount = leaderboard.length;
    io.to(room).emit('live_quiz_playing_count', { categoryId, playingCount });
});

  socket.on('live_quiz_refresh_leaderboard', async (data) => {
    const { categoryId, sessionId } = data || {};
    const cid = categoryId || socket.liveQuizCategoryId;
    const sid = sessionId || socket.liveQuizSessionId;
    if (!cid || !sid) return;
    const room = LIVE_QUIZ_CAT_PREFIX + cid;

    const debounceKey = sid;
    const existing = liveQuizRefreshDebounce.get(debounceKey);
    if (existing && existing.timeoutId) clearTimeout(existing.timeoutId);

    const timeoutId = setTimeout(async () => {
      liveQuizRefreshDebounce.delete(debounceKey);
      try {
        const fullLeaderboard = await getLiveQuizLeaderboard(sid);
        const topLeaderboard = fullLeaderboard.slice(0, LIVE_QUIZ_TOP_LEADERBOARD_COUNT);
        const playingCount = fullLeaderboard.length;
        const allRanks = Object.fromEntries(fullLeaderboard.map((e, i) => [e.userId, i + 1]));
        io.to(room).emit('live_quiz_leaderboard', {
          sessionId: sid,
          leaderboard: topLeaderboard,
          playingCount,
          categoryId: cid,
          allRanks
        });
      } catch {}
    }, LIVE_QUIZ_REFRESH_DEBOUNCE_MS);

    liveQuizRefreshDebounce.set(debounceKey, { timeoutId, categoryId: cid });
  });

  // Chat Events
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
});

  // Enhanced Message Notifications
  socket.on('private_message', async (data) => {
const { message } = data;
    
    // Handle both object and string formats for sender/receiver
    const receiverId = message.receiver?.id || message.receiverId;
    const senderId = message.sender?.id || message.senderId;
    
    // Handle image messages
    if (message.type === 'image') {
      try {
        // Validate image data
        if (!message.imageData) {
          socket.emit('message_error', { error: 'No image data provided' });
          return;
        }

        // Validate image format
        if (!message.imageData.startsWith('data:image/')) {
          socket.emit('message_error', { error: 'Invalid image format. Only images are allowed.' });
          return;
        }
        
        // Extract image format and base64 data
        const [header, base64Data] = message.imageData.split(',');
        const imageFormat = header.split('/')[1].split(';')[0].toLowerCase();
        
        // Check allowed formats
        const allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
        if (!allowedFormats.includes(imageFormat)) {
          socket.emit('message_error', { error: `Unsupported image format. Allowed formats: ${allowedFormats.join(', ')}` });
          return;
        }
        
        // Check image size (max 5MB)
        const imageSize = Buffer.from(base64Data, 'base64').length;
        if (imageSize > 5 * 1024 * 1024) { // 5MB limit
          socket.emit('message_error', { 
            error: `Image size too large. Maximum size is 5MB. Current size: ${(imageSize / (1024 * 1024)).toFixed(2)}MB` 
          });
          return;
        }

        // Add image metadata
        message.imageMetadata = {
          format: imageFormat,
          size: imageSize,
          timestamp: new Date().toISOString()
        };
        
        // Keep the image data as URL for frontend
        message.imageUrl = message.imageData;
        delete message.imageData; // Remove raw data to save bandwidth

} catch (error) {
socket.emit('message_error', { 
          error: 'Failed to process image. Please try again with a different image.',
          details: error.message
        });
        return;
      }
    }
    
    // Validate that we have both IDs
    if (!receiverId || !senderId) {
return;
    }
    
    // Create chat room ID for this conversation
    const chatId = [senderId, receiverId].sort().join('-');
// Send message to the chat room (both sender and receiver will receive it if they are in this room)
    io.to(chatId).emit('new_message', message);
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
}
    }
  });

  // Message Read Status
  socket.on('mark_message_read', (data) => {
    const { messageId, readerId } = data;
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
const match = activeMatches.get(matchId);
    if (!match) {
socket.emit('match_not_found', { matchId });
      return;
    }
    
// Update socket IDs if they have changed
    const user = socket.userId;
    if (user) {
      if (match.player1Id === user) {
        if (match.player1SocketId !== socket.id) {
match.player1SocketId = socket.id;
        }
      } else if (match.player2Id === user) {
        if (match.player2SocketId !== socket.id) {
match.player2SocketId = socket.id;
        }
      }
    }
    
    // Send current match status
    if (match.status === 'playing') {
      const currentQuestion = match.questions[match.currentQuestion];
socket.emit('match_started', {
        matchId,
        questionIndex: match.currentQuestion,
        question: currentQuestion,
        timeLimit: 15
      });
    } else if (match.status === 'finished') {
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
player1Socket.emit('match_ended', {
          ...matchResult,
          myScore: player1Score,
          opponentScore: player2Score,
          myPosition: 'player1'
        });
      }
      
      if (player2Socket && player2Socket.connected) {
player2Socket.emit('match_ended', {
          ...matchResult,
          myScore: player2Score,
          opponentScore: player1Score,
          myPosition: 'player2'
        });
      }
      
} else {
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
socket.emit('pong');
});

  // Timetable reminder functionality
  socket.on('start_timetable_reminders', async (data) => {
    const { userId } = data;
// Clear existing interval if any
    if (timetableReminderIntervals.has(userId)) {
      clearInterval(timetableReminderIntervals.get(userId));
    }
    
    // Start new reminder interval (check every 5 minutes)
    const interval = setInterval(async () => {
      try {
        await checkTimetableReminders(userId);
      } catch {}
    }, 5 * 60 * 1000); // 5 minutes
    
    timetableReminderIntervals.set(userId, interval);
    
    // Also check immediately
    await checkTimetableReminders(userId);
    
    socket.emit('timetable_reminders_started', { success: true });
  });

  socket.on('stop_timetable_reminders', (data) => {
    const { userId } = data;
if (timetableReminderIntervals.has(userId)) {
      clearInterval(timetableReminderIntervals.get(userId));
      timetableReminderIntervals.delete(userId);
    }
    
    socket.emit('timetable_reminders_stopped', { success: true });
  });

  // Live exam auto-end functionality
  socket.on('setup_exam_auto_end', async (data) => {
    const { examId, endTime } = data;
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
await checkAndEndExpiredExams();
        return;
      }
      
      // Set up timer for this specific exam
      const timer = setTimeout(async () => {
await checkAndEndExpiredExams();
        
        // Clear the interval reference
        if (liveExamAutoEndIntervals.has(examId)) {
          liveExamAutoEndIntervals.delete(examId);
        }
      }, timeUntilEnd);
      
      liveExamAutoEndIntervals.set(examId, timer);
socket.emit('exam_auto_end_setup', { 
        examId, 
        success: true, 
        timeUntilEnd: Math.floor(timeUntilEnd / 1000) 
      });
      
    } catch (error) {
socket.emit('exam_auto_end_setup', { 
        examId, 
        success: false, 
        error: error.message 
      });
    }
  });

  socket.on('cancel_exam_auto_end', (data) => {
    const { examId } = data;
if (liveExamAutoEndIntervals.has(examId)) {
      clearTimeout(liveExamAutoEndIntervals.get(examId));
      liveExamAutoEndIntervals.delete(examId);
}
    
    socket.emit('exam_auto_end_cancelled', { examId, success: true });
  });

  // Test event to verify socket communication
  socket.on('test_answer', (data) => {
// Send back a test response
    socket.emit('test_answer_response', {
      received: data,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
      userId: socket.userId
    });
  });

  socket.on('disconnect', async () => {
// Live Quiz: leave rooms and update playing count
    if (socket.liveQuizSessionId) {
      const room = LIVE_QUIZ_PREFIX + socket.liveQuizSessionId;
      socket.leave(room);
      const roomSet = io.sockets.adapter.rooms.get(room);
      const playingCount = roomSet ? roomSet.size : 0;
      io.to(room).emit('live_quiz_playing_count', { sessionId: socket.liveQuizSessionId, playingCount });
}
    if (socket.liveQuizCategoryId) {
      const catRoom = LIVE_QUIZ_CAT_PREFIX + socket.liveQuizCategoryId;
      socket.leave(catRoom);
      const roomSet = io.sockets.adapter.rooms.get(catRoom);
      const playingCount = roomSet ? roomSet.size : 0;
      io.to(catRoom).emit('live_quiz_playing_count', { categoryId: socket.liveQuizCategoryId, playingCount });
}
    // Mark inactive quickly for leaderboard purposes
    try {
      if (socket.userId && socket.liveQuizSessionId) {
        await prisma.liveQuizSessionParticipant.update({
          where: { sessionId_userId: { sessionId: socket.liveQuizSessionId, userId: socket.userId } },
          data: { lastSeenAt: new Date(0) }
        });
      }
    } catch {}
    
    // Get userId - from mapping or socket (socket.userId set by register_user)
    let userId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
    if (!userId && socket.userId) userId = socket.userId;
    
    // FORFEIT: If user was in an active match, opponent wins
    if (userId) {
      const match = getActiveMatchForPlayer(userId);
      if (match && typeof match === 'object') {
        const matchId = match.id;
        const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
endMatch(matchId, { forfeitWinner: opponentId });
      }
    }
    
    if (userId) {
      delete userSockets[userId];
// Clean up timetable reminder interval
      if (timetableReminderIntervals.has(userId)) {
        clearInterval(timetableReminderIntervals.get(userId));
        timetableReminderIntervals.delete(userId);
}
    }
    
    // Remove from correct queue (stored when joining)
    const queueId = socket.joinedQueueId || 'general';
    const players = await queueManager.getQueue(queueId);
    const playerToRemove = players.find(p => p.socketId === socket.id);
    if (playerToRemove) {
      await queueManager.removeFromQueue(queueId, playerToRemove);
}
  });

  // Debug: Clear stuck matches for a user
  socket.on('debug_clear_user_matches', async (data) => {
    const { userId } = data || {};
    if (!userId) {
      socket.emit('debug_result', { success: false, message: 'userId required' });
      return;
    }
    
const matchesToDelete = [];
    activeMatches.forEach((match, matchId) => {
      if (typeof match === 'object' && (match.player1Id === userId || match.player2Id === userId)) {
        matchesToDelete.push({ matchId, match });
      }
    });
    
    matchesToDelete.forEach(({ matchId, match }) => {
      playerToMatchId.delete(match.player1Id);
      playerToMatchId.delete(match.player2Id);
      activeMatches.delete(matchId);
});
    
    socket.emit('debug_result', {
      success: true,
      message: `Cleared ${matchesToDelete.length} matches for user ${userId}`,
      deletedMatches: matchesToDelete,
      remainingMatches: activeMatches.size
    });
  });

  // Debug: Get active matches info
  socket.on('debug_get_active_matches', () => {
    const matchesInfo = Array.from(activeMatches.entries()).map(([matchId, match]) => ({
      matchId,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      status: match.status || 'unknown',
      age: Math.round((Date.now() - (match.startTime || match.createdAt || Date.now())) / 1000),
      startTime: match.startTime || match.createdAt
    }));
    
    socket.emit('debug_active_matches', {
      total: activeMatches.size,
      matches: matchesInfo
    });
    
});

  // Test wallet update endpoint
  socket.on('test_wallet_update', async (data) => {
    const { userId, amount } = data;
try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, wallet: true }
      });
      
const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { wallet: { increment: amount } }
      });
      
socket.emit('test_wallet_result', {
        success: true,
        oldBalance: user?.wallet,
        newBalance: updatedUser.wallet,
        increment: amount
      });
      
    } catch (error) {
socket.emit('test_wallet_result', {
        success: false,
        error: error.message
      });
    }
  });

  // Debug events for active matches
  socket.on('debug_clear_matches', () => {
clearAllActiveMatches();
    socket.emit('debug_result', { 
      message: 'All active matches cleared',
      activeMatchesCount: activeMatches.size 
    });
  });

  socket.on('debug_show_matches', () => {
const matches = Array.from(activeMatches.keys());
socket.emit('debug_result', { 
      message: 'Current active matches',
      activeMatches: matches,
      count: matches.length 
    });
  });

  // Debug events for questions and categories
  socket.on('debug_check_category', async (data) => {
    const { categoryId } = data;
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
socket.emit('debug_result', { 
        message: 'Error checking category questions',
        error: error.message,
        errorType: 'category_questions_check'
      });
    }
  });

  // Debug event to check all categories and their question counts
  socket.on('debug_check_all_categories', async () => {
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
socket.emit('debug_result', { 
        message: 'Error checking category details',
        error: error.message,
        errorType: 'category_details_check'
      });
    }
  });

  // Spy Game Events - REMOVED (Feature removed as requested)

  // WebRTC Events
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
    } catch {}
  });

  // Chat message handler (for other features, not spy game)
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
    
// Move to next player
    const nextTurn = gameData.currentTurn + 1;
    if (nextTurn < gameData.players.length) {
      gameData.currentTurn = nextTurn;
      gameData.timeLeft = 10;
      
      // Start timer for next player
      setTimeout(() => {
        if (gameData.currentTurn === nextTurn) {
          io.to(`spy_game_${gameId}`).emit('turn_started', {
            gameId: gameId,
            currentTurn: nextTurn,
            timeLeft: 10
          });
          
          // Start countdown timer
          let timeLeft = 10;
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
try {
      // Find game by room code
      const game = await prisma.spyGame.findUnique({
        where: { roomCode },
        include: { players: true }
      });
      
      if (!game) {
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
}
      
      // Check if user is already in the game
      const existingPlayer = gameData.players.find(p => p.userId === userId);
      if (!existingPlayer) {
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
} catch {}
      }
      
} catch (error) {
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
                gameData.timeLeft = 10;
                gameData.descriptions = {};
                io.to(`spy_game_${gameId}`).emit('description_phase_started', { gameId: gameId, currentTurn: 0, timeLeft: 10 });
                let timeLeft = 10;
                const timer = setInterval(() => {
                  timeLeft--;
                  gameData.timeLeft = timeLeft;
                  io.to(`spy_game_${gameId}`).emit('timer_update', { gameId: gameId, currentTurn: 0, timeLeft: timeLeft });
                  if (timeLeft <= 0) {
                    clearInterval(timer);
                    const nextTurn = 1;
                    if (nextTurn < gameData.players.length) {
                      gameData.currentTurn = nextTurn;
                      gameData.timeLeft = 10;
                      io.to(`spy_game_${gameId}`).emit('turn_ended', { gameId: gameId, nextTurn: nextTurn });
                      setTimeout(() => {
                        io.to(`spy_game_${gameId}`).emit('turn_started', { gameId: gameId, currentTurn: nextTurn, timeLeft: 10 });
                        let nextTimeLeft = 10;
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
            } catch {}
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
} catch {}
      
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
gameData.players.forEach((player, index) => {
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
}
      });
      
      // Fallback: Send to all players in the room
// Get all sockets in the room
      const roomSockets = io.sockets.adapter.rooms.get(`spy_game_${gameId}`);
      if (roomSockets) {
roomSockets.forEach(socketId => {
});
      }
      
      io.to(`spy_game_${gameId}`).emit('spy_game_started_broadcast', {
        gameData,
        playerWords
      });
      
// Start description phase after 5 seconds
      setTimeout(() => {
        gameData.currentPhase = 'DESCRIBING';
        gameData.currentTurn = 0;
        gameData.timeLeft = 10;
        gameData.descriptions = {};
        
        io.to(`spy_game_${gameId}`).emit('description_phase_started', {
          gameId: gameId,
          currentTurn: 0,
          timeLeft: 10
        });

        // Generic turn runner to avoid getting stuck with 3+ players
        const runTurnFrom = (turnIndex) => {
          if (turnIndex >= gameData.players.length) {
            gameData.currentPhase = 'VOTING';
            // Reset helper state for safety
            gameData.timeLeft = 0;
            // Clear watchdog if present
            try { if (gameData.votingWatchdog) { clearTimeout(gameData.votingWatchdog); gameData.votingWatchdog = null; } } catch {}
            io.to(`spy_game_${gameId}`).emit('voting_started', { players: gameData.players });
            return;
          }
          // Refresh current sockets in room for debugging
          try {
            const room = io.sockets.adapter.rooms.get(`spy_game_${gameId}`) || new Set();
} catch {}
          gameData.currentTurn = turnIndex;
          gameData.timeLeft = 10;
          io.to(`spy_game_${gameId}`).emit('turn_started', { gameId: gameId, currentTurn: turnIndex, timeLeft: 10 });
          let left = 10;
          const interval = setInterval(() => {
            left--;
            gameData.timeLeft = left;
            io.to(`spy_game_${gameId}`).emit('timer_update', { gameId: gameId, currentTurn: turnIndex, timeLeft: left });
            if (left <= 0) {
              clearInterval(interval);
              io.to(`spy_game_${gameId}`).emit('turn_ended', { gameId: gameId, nextTurn: turnIndex + 1 });
              setTimeout(() => runTurnFrom(turnIndex + 1), 800);
            }
          }, 1000);
        };

        // Kick off from player 0
        runTurnFrom(0);

        // Safety watchdog: force voting if something gets stuck
        try {
          if (gameData.votingWatchdog) { clearTimeout(gameData.votingWatchdog); }
          const bufferMs = 3000; // small buffer
          const perPlayerMs = 11000; // 10s turn + buffer
          gameData.votingWatchdog = setTimeout(() => {
            if (gameData.currentPhase !== 'VOTING') {
gameData.currentPhase = 'VOTING';
              io.to(`spy_game_${gameId}`).emit('voting_started', { players: gameData.players });
            }
          }, gameData.players.length * perPlayerMs + bufferMs);
        } catch {}
      }, 5000);
      
    } catch (error) {
socket.emit('spy_game_error', { message: 'Failed to start game' });
    }
  });

  // Allow all players to submit category votes during the voting window
  socket.on('submit_category_vote', (payload) => {
    try {
      const { gameId, categoryId } = payload || {};
      if (!gameId || !categoryId) return;
      const gameData = spyGames.get(gameId);
      if (!gameData) return;
      if (!socket.userId) return;
      // Ensure this user is part of the game
      const isInGame = Array.isArray(gameData.players) && gameData.players.some(p => p.userId === socket.userId);
      if (!isInGame) return;
      if (!gameData.categoryVotes) gameData.categoryVotes = {};
      gameData.categoryVotes[socket.userId] = categoryId;
      // Acknowledge to the voter only
      io.to(socket.id).emit('category_vote_submitted', { userId: socket.userId, categoryId });
    } catch {}
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
    
// Do not auto-advance here; the generic turn runner controls progression
  });

  socket.on('submit_vote', async (data) => {
    const { gameId, votedForId } = data;
    const gameData = spyGames.get(gameId);
    
    if (!gameData) return;
    
    try {
      if (!socket.userId) {
return;
      }
// Save vote to database
      const existing = await prisma.spyGameVote.findFirst({
        where: { gameId, voterId: socket.userId }
      });
      if (existing) {
        await prisma.spyGameVote.update({
          where: { id: existing.id },
          data: { votedForId }
        });
} else {
        await prisma.spyGameVote.create({
          data: { gameId, voterId: socket.userId, votedForId }
        });
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
if (uniqueVoters >= expectedVoters) {
        // End game and reveal results
        await endSpyGame(gameId);
      }
      
    } catch {}
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
    } catch {}
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
io.to(`spy_game_${gameId}`).emit('spy_game_ended', payload);
    for (const player of gameData.players) {
      if (player.socketId) {
        try { io.to(player.socketId).emit('spy_game_ended', payload); } catch {}
      }
    }

    // Schedule cleanup after reveal so clients can see results
    scheduleSpyGameCleanup(gameId, 12000);
  } catch {}
}

function scheduleSpyGameCleanup(gameId, delayMs = 10000) {
  try {
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
} catch {}
    }, delayMs);
  } catch {}
}
async function generateQuestions(quizData) {
try {
    const { categoryId, questionCount = 5 } = quizData;
    
// First check if category exists
    const category = await prisma.questionCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true }
    });
    
    if (!category) {
throw new Error(`Category ${categoryId} not found`);
    }
    
// Try QuestionBankItem first
let totalQuestions = await prisma.questionBankItem.count({
      where: {
        categoryId: categoryId,
        isActive: true
      }
    });
    
// If no active questions found, check all questions regardless of isActive status
    if (totalQuestions === 0) {
totalQuestions = await prisma.questionBankItem.count({
        where: {
          categoryId: categoryId
        }
      });
}
    
    let questions = [];
    let sourceTable = 'QuestionBankItem';
    
    if (totalQuestions === 0) {
      // Try Question table as fallback
totalQuestions = await prisma.question.count({
        where: {
          categoryId: categoryId
        }
      });
      
sourceTable = 'Question';
    }
    
    if (totalQuestions === 0) {
throw new Error(`No questions found for category ${category.name}`);
    }
    
    // Fetch questions from the appropriate table
    if (sourceTable === 'QuestionBankItem') {
      if (totalQuestions <= questionCount) {
        // If we have fewer questions than needed, take all
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
    
    // Transform questions to match expected format
    const transformedQuestions = questions.map((q, index) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correct: sourceTable === 'QuestionBankItem' ? q.correct : q.correctAnswer, // Use correct field name based on table
      questionIndex: index
    }));
    
return transformedQuestions;
    
  } catch (error) {
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
    
return fallbackQuestions;
  }
}

async function tryMatchPlayers(quizId) {
  // Lock to prevent race when 100+ users join at once
  if (matchmakingLocks.get(quizId)) {
    return; // Another tryMatchPlayers is running for this queue
  }
  matchmakingLocks.set(quizId, true);
  
  try {
    const players = await queueManager.getQueue(quizId);
if (!players || players.length < 2) {
return;
    }
    
    // Sort by join time (FIFO)
  players.sort((a, b) => a.joinedAt - b.joinedAt);
while (players.length >= 2) {
    const player1 = players.shift();
    const player2 = players.shift();
    
// Check if same user is trying to match with themselves
    if (player1.userId === player2.userId) {
// Put player2 back in queue and continue with next player
      players.unshift(player2);
continue;
    }
    
    // Check if either player is already in an active match
    const player1InMatch = isPlayerInActiveMatch(player1.userId);
    const player2InMatch = isPlayerInActiveMatch(player2.userId);
    
    if (player1InMatch || player2InMatch) {
if (player1InMatch) {
}
      if (player2InMatch) {
}
      
      // Remove active match players from queue instead of putting them back
      if (player1InMatch) {
        await queueManager.removeFromQueue(quizId, player1);
}
      if (player2InMatch) {
        await queueManager.removeFromQueue(quizId, player2);
}
      
      // Only put non-active players back in queue
      if (!player1InMatch) {
        players.unshift(player1);
      }
      if (!player2InMatch) {
        players.unshift(player2);
      }
      
continue;
    }
    
    const entryFee = player1.quizData.entryFee || 10;
    
    // Re-check wallet balance before deducting (may have changed since join)
    let p1Wallet, p2Wallet;
    try {
      const [u1, u2] = await Promise.all([
        prisma.user.findUnique({ where: { id: player1.userId }, select: { wallet: true } }),
        prisma.user.findUnique({ where: { id: player2.userId }, select: { wallet: true } })
      ]);
      p1Wallet = u1?.wallet ?? 0;
      p2Wallet = u2?.wallet ?? 0;
    } catch (e) {
continue; // Keep both in queue, try next pair
    }
    if (p1Wallet < entryFee || p2Wallet < entryFee) {
const player1Socket = io.sockets.sockets.get(player1.socketId);
      const player2Socket = io.sockets.sockets.get(player2.socketId);
      if (player1Socket?.connected) player1Socket.emit('matchmaking_error', { message: 'Insufficient balance. Please recharge and try again.' });
      if (player2Socket?.connected) player2Socket.emit('matchmaking_error', { message: 'Insufficient balance. Please recharge and try again.' });
      // Remove from queue so they can re-join after recharge (otherwise same pair would keep matching)
      await queueManager.removeFromQueue(quizId, player1);
      await queueManager.removeFromQueue(quizId, player2);
      continue;
    }
    
    // Remove matched players from queue
    await queueManager.removeFromQueue(quizId, player1);
    await queueManager.removeFromQueue(quizId, player2);
    
    // Deduct entry fees from both players
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
      
} catch (error) {
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
} catch {}
      
      // Put players back in queue
      await queueManager.addToQueue(player1.userId, quizId, player1);
      await queueManager.addToQueue(player2.userId, quizId, player2);
      
return;
    }
    
    // Create match
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
const questions = await generateQuestions(player1.quizData);
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
    
activeMatches.set(matchId, match);
    playerToMatchId.set(player1.userId, matchId);
    playerToMatchId.set(player2.userId, matchId);
    
// Notify players with the events the frontend expects
    const player1Socket = io.sockets.sockets.get(player1.socketId);
    const player2Socket = io.sockets.sockets.get(player2.socketId);
    
    if (player1Socket && player1Socket.connected) {
player1Socket.emit('opponent_found', { 
        opponent: { id: player2.userId, name: `Player ${player2.userId.slice(-4)}` },
        category: player1.quizData.categoryId
      });
    }
    
    if (player2Socket && player2Socket.connected) {
player2Socket.emit('opponent_found', { 
        opponent: { id: player1.userId, name: `Player ${player1.userId.slice(-4)}` },
        category: player2.quizData.categoryId
      });
    }
    
    // Start match after 3 seconds
    setTimeout(() => {
      // Send match starting event
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
if (player1Socket && player1Socket.connected) {
          player1Socket.emit('match_ready', { matchId });
        }
        if (player2Socket && player2Socket.connected) {
          player2Socket.emit('match_ready', { matchId });
        }
        
        // Start the actual match after a short delay
        setTimeout(() => {
startMatch(matchId);
        }, 1000);
      }, 3000);
    }, 2000);
  }
  } finally {
    matchmakingLocks.set(quizId, false);
  }
}

function startMatch(matchId) {
  const match = activeMatches.get(matchId);
  if (!match) return;
  
  match.status = 'playing';
// Join both players to match room
  io.sockets.sockets.get(match.player1SocketId)?.join(`match_${matchId}`);
  io.sockets.sockets.get(match.player2SocketId)?.join(`match_${matchId}`);
  
  // Send first question to both players
  const firstQuestion = match.questions[0];
const matchStartedData = {
    matchId,
    questionIndex: 0,
    question: firstQuestion,
    timeLimit: 15,
    player1Score: 0,
    player2Score: 0,
    myScore: 0,
    opponentScore: 0
  };
  
// Get the actual socket objects and emit directly
  const player1Socket = io.sockets.sockets.get(match.player1SocketId);
  const player2Socket = io.sockets.sockets.get(match.player2SocketId);
  
  if (player1Socket && player1Socket.connected) {
player1Socket.emit('match_started', matchStartedData);
  }
  
  if (player2Socket && player2Socket.connected) {
player2Socket.emit('match_started', matchStartedData);
  }
  
  // Start timeout for first question
  startQuestionTimer(matchId, 0, 15);
  
}

// New function to handle question timers
function startQuestionTimer(matchId, questionIndex, timeLimit) {
  const match = activeMatches.get(matchId);
  if (!match) return;
  
// Set timeout for this question
  match.questionTimer = setTimeout(() => {
    // Clear timer ref immediately - callback is running
    match.questionTimer = null;
    
// Re-validate match still exists (could have ended via disconnect/forfeit)
    if (!activeMatches.has(matchId)) {
return;
    }
    
    // Check if both players have answered
    const p1Answered = match.player1Answers[questionIndex];
    const p2Answered = match.player2Answers[questionIndex];
    
// If player 1 hasn't answered, mark as timeout
    if (!p1Answered) {
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
}
    }
    
    // If player 2 hasn't answered, mark as timeout
    if (!p2Answered) {
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
}
    }
    
    // Move to next question or end game (shorter delay so frontend gets next question sooner)
    setTimeout(() => {
      if (!activeMatches.has(matchId)) return;
      
      if (questionIndex < match.totalQuestions - 1) {
        match.currentQuestion = questionIndex + 1;
        const nextQuestion = match.questions?.[match.currentQuestion];
        if (!nextQuestion) {
endMatch(matchId);
          return;
        }
        
const { player1Score, player2Score } = calculateScoresUpTo(match, questionIndex);
        const nextTimeLimit = match.timePerQuestion ?? 15;
        const player1Socket = io.sockets.sockets.get(match.player1SocketId);
        const player2Socket = io.sockets.sockets.get(match.player2SocketId);
        
        const nextQuestionPayload = {
          questionIndex: match.currentQuestion,
          question: nextQuestion,
          player1Score,
          player2Score,
          timeLimit: nextTimeLimit,
          fromTimeout: true
        };
        
        if (player1Socket && player1Socket.connected) {
player1Socket.emit('next_question', {
            ...nextQuestionPayload,
            myScore: player1Score,
            opponentScore: player2Score,
            myPosition: 'player1'
          });
        }
        
        if (player2Socket && player2Socket.connected) {
player2Socket.emit('next_question', {
            ...nextQuestionPayload,
            myScore: player2Score,
            opponentScore: player1Score,
            myPosition: 'player2'
          });
        }
        
        startQuestionTimer(matchId, match.currentQuestion, nextTimeLimit);
        
      } else {
endMatch(matchId);
      }
    }, 500); // 500ms delay - faster transition to next question
    
  }, timeLimit * 1000); // Convert seconds to milliseconds
  
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
  
}

// Helper: calculate scores from answers up to (and including) questionIndex
function calculateScoresUpTo(match, upToIndex) {
  let player1Score = 0;
  let player2Score = 0;
  for (let i = 0; i <= upToIndex && i < match.totalQuestions; i++) {
    const p1Answer = match.player1Answers?.[i];
    const p2Answer = match.player2Answers?.[i];
    const question = match.questions?.[i];
    if (!question) continue;
    if (p1Answer && !p1Answer.timedOut) {
      let p1Correct = false;
      if (typeof p1Answer.answer === 'number') p1Correct = p1Answer.answer === question.correct;
      else if (typeof p1Answer.answer === 'string') {
        const idx = question.options?.findIndex(opt => opt?.toLowerCase() === String(p1Answer.answer).toLowerCase());
        p1Correct = idx === question.correct;
      } else if (typeof p1Answer.answer === 'string' && !isNaN(parseInt(p1Answer.answer))) {
        p1Correct = parseInt(p1Answer.answer) === question.correct;
      }
      if (p1Correct) player1Score += 10;
    }
    if (p2Answer && !p2Answer.timedOut) {
      let p2Correct = false;
      if (typeof p2Answer.answer === 'number') p2Correct = p2Answer.answer === question.correct;
      else if (typeof p2Answer.answer === 'string') {
        const idx = question.options?.findIndex(opt => opt?.toLowerCase() === String(p2Answer.answer).toLowerCase());
        p2Correct = idx === question.correct;
      } else if (typeof p2Answer.answer === 'string' && !isNaN(parseInt(p2Answer.answer))) {
        p2Correct = parseInt(p2Answer.answer) === question.correct;
      }
      if (p2Correct) player2Score += 10;
    }
  }
  return { player1Score, player2Score };
}

// Function to end a match and calculate results
// options: { forfeitWinner: userId } - when set, that player wins (e.g. opponent disconnected)
async function endMatch(matchId, options = {}) {
  const match = activeMatches.get(matchId);
  if (!match) {
return;
  }
  
  const { forfeitWinner } = options;
// Calculate scores
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
  
// Forfeit overrides: disconnected player's opponent wins
  const winner = forfeitWinner || (player1Score > player2Score ? match.player1Id : 
                player2Score > player1Score ? match.player2Id : null);
  
// Update wallet for winner (if not a draw, or forfeit)
  if (winner && (player1Score !== player2Score || forfeitWinner)) {
    const totalPrizePool = (match.entryFee || 10) * 2; // Both players' entry fees
    const winnerPrize = Math.floor(totalPrizePool * 0.8); // Winner gets 80%
    const appCommission = totalPrizePool - winnerPrize; // App gets 20%
    
try {
      await prisma.$transaction(async (tx) => {
        // Add 80% prize to winner's wallet
        await tx.user.update({
          where: { id: winner },
          data: { wallet: { increment: winnerPrize } }
        });
        
        // Create transaction record for winner (80%)
        await tx.transaction.create({
          data: {
            userId: winner,
            amount: winnerPrize,
            type: 'BATTLE_QUIZ_WIN',
            status: 'COMPLETED'
          }
        });
        
        // App commission is automatically calculated (20% of total pool)
        // No need to create separate transaction record for commission
        // The difference between total pool and winner prize is the app commission
      });
      
} catch {}
  } else if (player1Score === player2Score && !forfeitWinner) {
try {
      const refundAmount = match.entryFee || 10;
      await prisma.$transaction(async (tx) => {
        // Refund to player 1
        await tx.user.update({
          where: { id: match.player1Id },
          data: { wallet: { increment: refundAmount } }
        });
        
        // Refund to player 2
        await tx.user.update({
          where: { id: match.player2Id },
          data: { wallet: { increment: refundAmount } }
        });
        
        // Create transaction records for refunds
        await tx.transaction.createMany({
          data: [
            {
              userId: match.player1Id,
              amount: refundAmount,
              type: 'BATTLE_QUIZ_REFUND',
              status: 'COMPLETED'
            },
            {
              userId: match.player2Id,
              amount: refundAmount,
              type: 'BATTLE_QUIZ_REFUND',
              status: 'COMPLETED'
            }
          ]
        });
      });
      
} catch {}
  }
  
  // Send match results to both players
  const player1Socket = io.sockets.sockets.get(match.player1SocketId);
  const player2Socket = io.sockets.sockets.get(match.player2SocketId);
  
  const matchResult = {
    matchId,
    player1Score,
    player2Score,
    winner,
    isDraw: player1Score === player2Score && !forfeitWinner,
    isForfeit: !!forfeitWinner
  };
  
  if (player1Socket && player1Socket.connected) {
player1Socket.emit('match_ended', {
      ...matchResult,
      myScore: player1Score,
      opponentScore: player2Score,
      myPosition: 'player1'
    });
  }
  
  if (player2Socket && player2Socket.connected) {
player2Socket.emit('match_ended', {
      ...matchResult,
      myScore: player2Score,
      opponentScore: player1Score,
      myPosition: 'player2'
    });
  }
  
  // Full cleanup: clear timer, leave room, remove from tracking
  if (match.questionTimer) {
    clearTimeout(match.questionTimer);
    match.questionTimer = null;
  }
  try {
    io.in(`match_${matchId}`).socketsLeave(`match_${matchId}`);
  } catch {}
  playerToMatchId.delete(match.player1Id);
  playerToMatchId.delete(match.player2Id);
  const deleted = activeMatches.delete(matchId);
}

// Start HTTP server
// Use SOCKET_PORT if provided (for Railway), otherwise use default 3001
// Note: Don't use PORT env variable as it conflicts with Next.js on Railway
const SOCKET_PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(SOCKET_PORT, () => {
});