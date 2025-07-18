import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma'; // Use the correctly initialized prisma client
import { verifyToken } from './auth';

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

// Global variable to store the socket server instance
let globalIo: SocketIOServer | null = null;

export const setSocketServer = (io: SocketIOServer) => {
  globalIo = io;
};

export const getSocketServer = (): SocketIOServer | null => {
  return globalIo;
};

export const initSocket = (res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', async (data: { token: string }) => {
        try {
          const decoded = await verifyToken(data.token);
          if (!decoded) {
            socket.emit('auth_error', { message: 'Invalid token' });
            return;
          }

          // Get user details
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true, level: true }
          });

          if (!user) {
            socket.emit('auth_error', { message: 'User not found' });
            return;
          }

          const userSocket: UserSocket = {
            userId: user.id,
            socketId: socket.id,
            name: user.name,
            level: user.level || 1
          };

          this.userSockets.set(user.id, userSocket);
          socket.data.user = userSocket;

          socket.emit('authenticated', { user: userSocket });
          console.log('User authenticated:', user.name);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle joining rooms
      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
      });

      // Handle leaving rooms
      socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room: ${roomId}`);
      });

      // Handle battle quiz events
      socket.on('join-battle', (data) => {
        console.log('Join battle request:', data);
        // Handle battle joining logic here
      });

      socket.on('submit-answer', (data) => {
        console.log('Answer submitted:', data);
        // Handle answer submission logic here
      });

      // Handle live exam events
      socket.on('join-live-exam', (examId) => {
        socket.join(`exam-${examId}`);
        console.log(`User ${socket.id} joined live exam: ${examId}`);
      });

      // Handle chat messages
      socket.on('send-message', (data) => {
        console.log('Message received:', data);
        // Broadcast message to room
        socket.to(data.roomId).emit('new-message', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
    setSocketServer(io); // Store the instance globally
    console.log('Socket.IO server initialized successfully');
  }
  return res.socket.server.io;
};

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
        
        // Check if message and receiver exist before accessing properties
        if (!message || !message.receiver) {
          console.warn('Received private_message with missing receiver:', message);
          return;
        }
        
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

interface UserSocket {
  userId: string;
  socketId: string;
  name: string;
  level: number;
}

interface MatchmakingQueue {
  userId: string;
  categoryId?: string;
  mode: string;
  timestamp: number;
}

interface PrivateRoom {
  roomCode: string;
  hostId: string;
  players: UserSocket[];
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'playing';
  categoryId?: string;
  timePerQuestion: number;
  questionCount: number;
}

interface BattleGame {
  matchId: string;
  players: UserSocket[];
  questions: any[];
  currentQuestionIndex: number;
  scores: { [userId: string]: number };
  answers: { [userId: string]: number[] };
  responseTimes: { [userId: string]: number[] };
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  timePerQuestion: number;
  categoryId?: string;
}

class BattleQuizSocketServer {
  private io: SocketIOServer;
  private userSockets: Map<string, UserSocket> = new Map();
  private matchmakingQueue: MatchmakingQueue[] = [];
  private privateRooms: Map<string, PrivateRoom> = new Map();
  private battleGames: Map<string, BattleGame> = new Map();

  constructor(server: NetServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Authenticate user
      socket.on('authenticate', async (data: { token: string }) => {
        try {
          const decoded = await verifyToken(data.token);
          if (!decoded) {
            socket.emit('auth_error', { message: 'Invalid token' });
            return;
          }

          // Get user details
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true, level: true }
          });

          if (!user) {
            socket.emit('auth_error', { message: 'User not found' });
            return;
          }

          const userSocket: UserSocket = {
            userId: user.id,
            socketId: socket.id,
            name: user.name,
            level: user.level || 1
          };

          this.userSockets.set(user.id, userSocket);
          socket.data.user = userSocket;

          socket.emit('authenticated', { user: userSocket });
          console.log('User authenticated:', user.name);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Matchmaking
      socket.on('join_matchmaking', (data: { categoryId?: string; mode: string }) => {
        const user = socket.data.user;
        if (!user) {
          socket.emit('matchmaking_error', { message: 'Not authenticated' });
          return;
        }

        // Remove from any existing queue
        this.matchmakingQueue = this.matchmakingQueue.filter(q => q.userId !== user.userId);

        // Add to queue
        const queueEntry: MatchmakingQueue = {
          userId: user.userId,
          categoryId: data.categoryId,
          mode: data.mode,
          timestamp: Date.now()
        };

        this.matchmakingQueue.push(queueEntry);
        socket.emit('matchmaking_update', { 
          status: 'searching', 
          estimatedWait: 30,
          message: 'Searching for opponent...'
        });

        // Try to find a match
        this.findMatch(user.userId);
      });

      socket.on('cancel_matchmaking', () => {
        const user = socket.data.user;
        if (!user) return;

        this.matchmakingQueue = this.matchmakingQueue.filter(q => q.userId !== user.userId);
        socket.emit('matchmaking_cancelled');
      });

      // Private Rooms
      socket.on('join_private_room', (data: { roomCode: string }) => {
        const user = socket.data.user;
        if (!user) {
          socket.emit('room_error', { message: 'Not authenticated' });
          return;
        }

        const room = this.privateRooms.get(data.roomCode);
        if (!room) {
          socket.emit('room_not_found');
          return;
        }

        if (room.players.length >= room.maxPlayers) {
          socket.emit('room_full');
          return;
        }

        // Check if user is already in the room
        const existingPlayer = room.players.find(p => p.userId === user.userId);
        if (existingPlayer) {
          socket.emit('room_joined', { 
            room: this.getRoomData(room), 
            user: user, 
            isHost: room.hostId === user.userId 
          });
          return;
        }

        // Add player to room
        room.players.push(user);
        socket.join(data.roomCode);

        // Notify all players in the room
        this.io.to(data.roomCode).emit('player_joined', { player: user });

        socket.emit('room_joined', { 
          room: this.getRoomData(room), 
          user: user, 
          isHost: room.hostId === user.userId 
        });

        console.log(`User ${user.name} joined room ${data.roomCode}`);
      });

      socket.on('leave_private_room', (data: { roomCode: string }) => {
        const user = socket.data.user;
        if (!user) return;

        const room = this.privateRooms.get(data.roomCode);
        if (!room) return;

        room.players = room.players.filter(p => p.userId !== user.userId);
        socket.leave(data.roomCode);

        if (room.players.length === 0) {
          // Delete empty room
          this.privateRooms.delete(data.roomCode);
        } else {
          // Notify remaining players
          this.io.to(data.roomCode).emit('player_left', { playerId: user.userId });
        }

        console.log(`User ${user.name} left room ${data.roomCode}`);
      });

      socket.on('start_private_game', (data: { roomCode: string }) => {
        const user = socket.data.user;
        if (!user) return;

        const room = this.privateRooms.get(data.roomCode);
        if (!room || room.hostId !== user.userId) {
          socket.emit('room_error', { message: 'Not the host' });
          return;
        }

        if (room.players.length < 2) {
          socket.emit('room_error', { message: 'Need at least 2 players' });
          return;
        }

        // Start countdown
        room.status = 'starting';
        this.io.to(data.roomCode).emit('room_starting', { countdown: 3 });

        // After countdown, start the game
        setTimeout(() => {
          this.startPrivateGame(room);
        }, 3000);
      });

      // Battle Game
      socket.on('join_battle', (data: { matchId: string }) => {
        const user = socket.data.user;
        if (!user) return;

        const game = this.battleGames.get(data.matchId);
        if (!game) {
          socket.emit('game_error', { message: 'Game not found' });
          return;
        }

        // Check if user is part of this game
        const player = game.players.find(p => p.userId === user.userId);
        if (!player) {
          socket.emit('game_error', { message: 'Not part of this game' });
          return;
        }

        socket.join(data.matchId);
        socket.emit('game_ready', {
          players: game.players,
          totalQuestions: game.questions.length,
          timePerQuestion: game.timePerQuestion
        });

        // If all players are ready, start the game
        if (this.io.sockets.adapter.rooms.get(data.matchId)?.size === game.players.length) {
          this.startBattleGame(data.matchId);
        }
      });

      socket.on('submit_answer', (data: { 
        matchId: string; 
        questionIndex: number; 
        answer: number; 
        responseTime: number 
      }) => {
        const user = socket.data.user;
        if (!user) return;

        const game = this.battleGames.get(data.matchId);
        if (!game || game.status !== 'playing') return;

        // Record answer
        if (!game.answers[user.userId]) {
          game.answers[user.userId] = [];
        }
        if (!game.responseTimes[user.userId]) {
          game.responseTimes[user.userId] = [];
        }

        game.answers[user.userId][data.questionIndex] = data.answer;
        game.responseTimes[user.userId][data.questionIndex] = data.responseTime;

        // Notify other players
        socket.to(data.matchId).emit('opponent_progress', {
          playerId: user.userId,
          questionIndex: data.questionIndex,
          isAnswered: true,
          responseTime: data.responseTime
        });

        // Check if all players have answered
        const allAnswered = game.players.every(player => 
          game.answers[player.userId] && 
          game.answers[player.userId][data.questionIndex] !== undefined
        );

        if (allAnswered) {
          this.processQuestionResult(data.matchId, data.questionIndex);
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        const user = socket.data.user;
        if (!user) return;

        console.log('User disconnected:', user.name);

        // Remove from matchmaking queue
        this.matchmakingQueue = this.matchmakingQueue.filter(q => q.userId !== user.userId);

        // Remove from private rooms
        this.privateRooms.forEach((room, roomCode) => {
          const playerIndex = room.players.findIndex(p => p.userId === user.userId);
          if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            this.io.to(roomCode).emit('player_left', { playerId: user.userId });

            if (room.players.length === 0) {
              this.privateRooms.delete(roomCode);
            }
          }
        });

        // Handle battle game disconnection
        this.battleGames.forEach((game, matchId) => {
          const player = game.players.find(p => p.userId === user.userId);
          if (player) {
            this.io.to(matchId).emit('opponent_disconnected');
            this.endBattleGame(matchId, 'opponent_disconnected');
          }
        });

        this.userSockets.delete(user.userId);
      });
    });
  }

  private async findMatch(userId: string) {
    const userQueue = this.matchmakingQueue.find(q => q.userId === userId);
    if (!userQueue) return;

    // Find compatible opponent
    const opponent = this.matchmakingQueue.find(q => 
      q.userId !== userId && 
      (q.categoryId === userQueue.categoryId || (!q.categoryId && !userQueue.categoryId)) &&
      q.mode === userQueue.mode
    );

    if (opponent) {
      // Remove both from queue
      this.matchmakingQueue = this.matchmakingQueue.filter(q => 
        q.userId !== userId && q.userId !== opponent.userId
      );

      // Create battle game
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user1 = this.userSockets.get(userId);
      const user2 = this.userSockets.get(opponent.userId);

      if (user1 && user2) {
        const game: BattleGame = {
          matchId,
          players: [user1, user2],
          questions: [],
          currentQuestionIndex: 0,
          scores: { [userId]: 0, [opponent.userId]: 0 },
          answers: {},
          responseTimes: {},
          status: 'waiting',
          timePerQuestion: 15,
          categoryId: userQueue.categoryId
        };

        this.battleGames.set(matchId, game);

        // Notify both players
        this.io.to(user1.socketId).emit('opponent_found', { 
          opponent: user2,
          category: userQueue.categoryId
        });
        this.io.to(user2.socketId).emit('opponent_found', { 
          opponent: user1,
          category: userQueue.categoryId
        });

        // Start countdown
        setTimeout(() => {
          this.io.to(user1.socketId).emit('match_starting', { countdown: 3 });
          this.io.to(user2.socketId).emit('match_starting', { countdown: 3 });
        }, 2000);

        setTimeout(() => {
          this.io.to(user1.socketId).emit('match_ready', { matchId });
          this.io.to(user2.socketId).emit('match_ready', { matchId });
        }, 5000);
      }
    }
  }

  private async startPrivateGame(room: PrivateRoom) {
    const matchId = `private_${room.roomCode}_${Date.now()}`;
    
    const game: BattleGame = {
      matchId,
      players: room.players,
      questions: [],
      currentQuestionIndex: 0,
      scores: {},
      answers: {},
      responseTimes: {},
      status: 'waiting',
      timePerQuestion: room.timePerQuestion,
      categoryId: room.categoryId
    };

    // Initialize scores
    room.players.forEach(player => {
      game.scores[player.userId] = 0;
    });

    this.battleGames.set(matchId, game);

    // Notify all players
    this.io.to(room.roomCode).emit('game_started', { matchId });
  }

  private async startBattleGame(matchId: string) {
    const game = this.battleGames.get(matchId);
    if (!game) return;

    // Fetch questions
    const questions = await this.fetchQuestions(game.categoryId, 10);
    game.questions = questions;
    game.status = 'playing';

    // Start with first question
    this.startQuestion(matchId, 0);
  }

  private async fetchQuestions(categoryId?: string, count: number = 10) {
    const whereClause = categoryId ? { categoryId } : {};
    
    const questions = await prisma.question.findMany({
      where: whereClause,
      select: {
        id: true,
        text: true,
        options: true,
        correct: true,
        marks: true,
        difficulty: true
      },
      take: count
    });

    // Shuffle questions
    return questions.sort(() => Math.random() - 0.5);
  }

  private startQuestion(matchId: string, questionIndex: number) {
    const game = this.battleGames.get(matchId);
    if (!game || questionIndex >= game.questions.length) {
      this.endBattleGame(matchId, 'completed');
      return;
    }

    game.currentQuestionIndex = questionIndex;
    const question = game.questions[questionIndex];

    this.io.to(matchId).emit('question_start', {
      questionIndex,
      question,
      timeLimit: game.timePerQuestion
    });

    // Auto-advance after time limit
    setTimeout(() => {
      if (game.currentQuestionIndex === questionIndex) {
        this.processQuestionResult(matchId, questionIndex);
      }
    }, game.timePerQuestion * 1000);
  }

  private processQuestionResult(matchId: string, questionIndex: number) {
    const game = this.battleGames.get(matchId);
    if (!game) return;

    const question = game.questions[questionIndex];
    if (!question) return;

    // Calculate scores
    game.players.forEach(player => {
      const answer = game.answers[player.userId]?.[questionIndex];
      const responseTime = game.responseTimes[player.userId]?.[questionIndex] || 0;

      if (answer === question.correct) {
        // Base score + time bonus
        const timeBonus = Math.max(0, game.timePerQuestion * 1000 - responseTime) / 100;
        const score = question.marks + timeBonus;
        game.scores[player.userId] += score;
      }
    });

    // Notify players of result
    game.players.forEach(player => {
      const answer = game.answers[player.userId]?.[questionIndex];
      const isCorrect = answer === question.correct;
      
      this.io.to(player.socketId).emit('question_result', {
        questionIndex,
        correctAnswer: question.correct,
        myScore: game.scores[player.userId],
        opponentScore: game.scores[game.players.find(p => p.userId !== player.userId)?.userId || ''],
        myResponseTime: game.responseTimes[player.userId]?.[questionIndex] || 0,
        isCorrect
      });
    });

    // Move to next question after delay
    setTimeout(() => {
      this.startQuestion(matchId, questionIndex + 1);
    }, 3000);
  }

  private async endBattleGame(matchId: string, reason: string) {
    const game = this.battleGames.get(matchId);
    if (!game) return;

    // Determine winner
    const player1 = game.players[0];
    const player2 = game.players[1];
    const score1 = game.scores[player1.userId];
    const score2 = game.scores[player2.userId];

    let winner: 'player1' | 'player2' | 'draw' = 'draw';
    if (score1 > score2) winner = 'player1';
    else if (score2 > score1) winner = 'player2';

    // Update database
    try {
      const match = await prisma.battleQuizMatch.create({
        data: {
          battleQuizId: 'temp', // You might want to create a proper battle quiz record
          player1Id: player1.userId,
          player2Id: player2.userId,
          player1Score: score1,
          player2Score: score2,
          winnerId: winner === 'draw' ? null : (winner === 'player1' ? player1.userId : player2.userId),
          totalQuestions: game.questions.length,
          timePerQuestion: game.timePerQuestion,
          categoryId: game.categoryId
        }
      });

      // Update user stats
      await this.updateUserStats(player1.userId, winner === 'player1', score1);
      await this.updateUserStats(player2.userId, winner === 'player2', score2);

      // Notify players of game result
      const result = {
        winner: winner === 'player1' ? 'you' : winner === 'player2' ? 'opponent' : 'draw',
        myScore: score1,
        opponentScore: score2,
        prizeAmount: winner === 'player1' ? 10 : 0, // You can implement proper prize logic
        experienceGained: winner === 'player1' ? 50 : 10,
        levelUp: false,
        stats: {
          correctAnswers: game.answers[player1.userId]?.filter((ans, idx) => 
            ans === game.questions[idx]?.correct
          ).length || 0,
          averageResponseTime: this.calculateAverageResponseTime(game.responseTimes[player1.userId]),
          fastestAnswer: Math.min(...(game.responseTimes[player1.userId] || [0])),
          streak: 0
        }
      };

      this.io.to(player1.socketId).emit('game_finished', result);
      this.io.to(player2.socketId).emit('game_finished', {
        ...result,
        winner: winner === 'player2' ? 'you' : winner === 'player1' ? 'opponent' : 'draw',
        myScore: score2,
        opponentScore: score1,
        stats: {
          correctAnswers: game.answers[player2.userId]?.filter((ans, idx) => 
            ans === game.questions[idx]?.correct
          ).length || 0,
          averageResponseTime: this.calculateAverageResponseTime(game.responseTimes[player2.userId]),
          fastestAnswer: Math.min(...(game.responseTimes[player2.userId] || [0])),
          streak: 0
        }
      });

    } catch (error) {
      console.error('Error saving game result:', error);
    }

    // Clean up
    this.battleGames.delete(matchId);
  }

  private async updateUserStats(userId: string, won: boolean, score: number) {
    try {
      await prisma.userBattleStats.upsert({
        where: { userId },
        update: {
          totalMatches: { increment: 1 },
          wins: { increment: won ? 1 : 0 },
          losses: { increment: won ? 0 : 1 },
          winRate: { increment: 0 }, // This will be calculated
          experience: { increment: won ? 50 : 10 },
          totalPrizeMoney: { increment: won ? 10 : 0 },
          currentStreak: won ? { increment: 1 } : { set: 0 },
          longestStreak: won ? { increment: 0 } : { increment: 0 } // This needs proper logic
        },
        create: {
          userId,
          totalMatches: 1,
          wins: won ? 1 : 0,
          losses: won ? 0 : 1,
          winRate: won ? 1 : 0,
          level: 1,
          experience: won ? 50 : 10,
          currentStreak: won ? 1 : 0,
          longestStreak: won ? 1 : 0,
          totalPrizeMoney: won ? 10 : 0,
          averageResponseTime: 0,
          fastestAnswer: 0,
          totalCorrectAnswers: 0
        }
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  private calculateAverageResponseTime(responseTimes: number[]): number {
    if (!responseTimes || responseTimes.length === 0) return 0;
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private getRoomData(room: PrivateRoom) {
    return {
      roomCode: room.roomCode,
      host: room.players.find(p => p.userId === room.hostId),
      players: room.players,
      maxPlayers: room.maxPlayers,
      status: room.status,
      categoryId: room.categoryId,
      timePerQuestion: room.timePerQuestion,
      questionCount: room.questionCount
    };
  }

  // Public method to create private room
  public createPrivateRoom(roomCode: string, hostId: string, options: {
    categoryId?: string;
    timePerQuestion: number;
    questionCount: number;
  }): PrivateRoom {
    const room: PrivateRoom = {
      roomCode,
      hostId,
      players: [],
      maxPlayers: 2,
      status: 'waiting',
      categoryId: options.categoryId,
      timePerQuestion: options.timePerQuestion,
      questionCount: options.questionCount
    };

    this.privateRooms.set(roomCode, room);
    return room;
  }
}

export default BattleQuizSocketServer; 