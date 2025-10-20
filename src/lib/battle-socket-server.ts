import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './auth';
import { prisma } from './prisma';

interface BattleSocket extends Socket {
  userId?: string;
  roomId?: string;
}

interface BattleRoom {
  id: string;
  name: string;
  status: 'waiting' | 'starting' | 'active' | 'finished';
  players: BattlePlayer[];
  currentQuestion?: number;
  questions?: BattleQuestion[];
  timer?: NodeJS.Timeout;
  categoryId?: string;
}

interface BattlePlayer {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  isReady: boolean;
  isOnline: boolean;
  socketId?: string;
}

interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

class BattleSocketServer {
  private io: SocketIOServer;
  private rooms: Map<string, BattleRoom> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: BattleSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
          return next(new Error('Authentication error'));
        }

        socket.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: BattleSocket) => {
      console.log(`🔌 Battle socket connected: ${socket.id}, User: ${socket.userId}`);
      this.userSockets.set(socket.userId!, socket.id);

      // Handle battle room creation
      socket.on('create_battle_room', async (data: { name: string; categoryId?: string }) => {
        await this.handleCreateRoom(socket, data);
      });

      // Handle joining battle room
      socket.on('join_battle_room', async (data: { roomId: string }) => {
        await this.handleJoinRoom(socket, data);
      });

      // Handle leaving battle room
      socket.on('leave_battle_room', async (data: { roomId: string }) => {
        await this.handleLeaveRoom(socket, data);
      });

      // Handle player ready
      socket.on('player_ready', async (data: { roomId: string }) => {
        await this.handlePlayerReady(socket, data);
      });

      // Handle answer submission
      socket.on('submit_answer', async (data: { roomId: string; questionIndex: number; answerIndex: number }) => {
        await this.handleSubmitAnswer(socket, data);
      });

      // Handle ping for connection testing
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleCreateRoom(socket: BattleSocket, data: { name: string; categoryId?: string }) {
    try {
      console.log(`🏠 Creating battle room: ${data.name} by user ${socket.userId}`);

      // Create room in database
      const room = await prisma.battleRoom.create({
        data: {
          name: data.name,
          categoryId: data.categoryId || null,
          maxPlayers: 2,
          status: 'waiting',
          createdById: socket.userId!
        },
        include: {
          category: true
        }
      });

      // Add creator as first player
      await prisma.battlePlayer.create({
        data: {
          roomId: room.id,
          userId: socket.userId!,
          score: 0,
          isReady: false,
          isOnline: true
        }
      });

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: socket.userId! },
        select: {
          id: true,
          name: true,
          profilePhoto: true
        }
      });

      // Create room in memory
      const battleRoom: BattleRoom = {
        id: room.id,
        name: room.name,
        status: 'waiting',
        players: [{
          id: user!.id,
          name: user!.name,
          avatar: user!.profilePhoto,
          score: 0,
          isReady: false,
          isOnline: true,
          socketId: socket.id
        }]
      };

      this.rooms.set(room.id, battleRoom);
      socket.roomId = room.id;
      socket.join(room.id);

      // Emit room created event
      socket.emit('battle_room_created', {
        room: {
          id: room.id,
          name: room.name,
          players: battleRoom.players,
          maxPlayers: 2,
          status: room.status,
          category: room.category
        }
      });

      console.log(`✅ Battle room created: ${room.id}`);

    } catch (error) {
      console.error('Error creating battle room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  }

  private async handleJoinRoom(socket: BattleSocket, data: { roomId: string }) {
    try {
      console.log(`🚪 User ${socket.userId} joining room ${data.roomId}`);

      const room = this.rooms.get(data.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      if (room.status !== 'waiting') {
        socket.emit('error', { message: 'Battle already in progress' });
        return;
      }

      // Check if user is already in the room
      const existingPlayer = room.players.find(p => p.id === socket.userId);
      if (existingPlayer) {
        socket.emit('error', { message: 'Already in this room' });
        return;
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: socket.userId! },
        select: {
          id: true,
          name: true,
          profilePhoto: true
        }
      });

      // Add player to database
      await prisma.battlePlayer.create({
        data: {
          roomId: data.roomId,
          userId: socket.userId!,
          score: 0,
          isReady: false,
          isOnline: true
        }
      });

      // Add player to room in memory
      const newPlayer: BattlePlayer = {
        id: user!.id,
        name: user!.name,
        avatar: user!.profilePhoto,
        score: 0,
        isReady: false,
        isOnline: true,
        socketId: socket.id
      };

      room.players.push(newPlayer);
      socket.roomId = data.roomId;
      socket.join(data.roomId);

      // Emit events to all players in room
      this.io.to(data.roomId).emit('player_joined', {
        player: newPlayer,
        room: {
          id: room.id,
          name: room.name,
          players: room.players,
          maxPlayers: 2,
          status: room.status
        }
      });

      console.log(`✅ User ${socket.userId} joined room ${data.roomId}`);

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private async handleLeaveRoom(socket: BattleSocket, data: { roomId: string }) {
    try {
      console.log(`🚪 User ${socket.userId} leaving room ${data.roomId}`);

      const room = this.rooms.get(data.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Remove player from room
      const playerIndex = room.players.findIndex(p => p.id === socket.userId);
      if (playerIndex === -1) {
        socket.emit('error', { message: 'Not in this room' });
        return;
      }

      const player = room.players[playerIndex];
      room.players.splice(playerIndex, 1);

      // Remove from database
      await prisma.battlePlayer.deleteMany({
        where: {
          roomId: data.roomId,
          userId: socket.userId!
        }
      });

      socket.leave(data.roomId);
      socket.roomId = undefined;

      // If no players left, delete room
      if (room.players.length === 0) {
        await prisma.battleRoom.delete({
          where: { id: data.roomId }
        });
        this.rooms.delete(data.roomId);
        console.log(`🗑️ Room ${data.roomId} deleted (no players left)`);
      } else {
        // Notify remaining players
        this.io.to(data.roomId).emit('player_left', {
          playerId: socket.userId,
          room: {
            id: room.id,
            name: room.name,
            players: room.players,
            maxPlayers: 2,
            status: room.status
          }
        });
      }

      console.log(`✅ User ${socket.userId} left room ${data.roomId}`);

    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  }

  private async handlePlayerReady(socket: BattleSocket, data: { roomId: string }) {
    try {
      console.log(`✅ User ${socket.userId} ready in room ${data.roomId}`);

      const room = this.rooms.get(data.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const player = room.players.find(p => p.id === socket.userId);
      if (!player) {
        socket.emit('error', { message: 'Not in this room' });
        return;
      }

      // Toggle ready status
      player.isReady = !player.isReady;

      // Update database
      await prisma.battlePlayer.updateMany({
        where: {
          roomId: data.roomId,
          userId: socket.userId!
        },
        data: {
          isReady: player.isReady
        }
      });

      // Check if all players are ready
      const allReady = room.players.length === 2 && room.players.every(p => p.isReady);

      // Emit to all players in room
      this.io.to(data.roomId).emit('player_ready', {
        playerId: socket.userId,
        isReady: player.isReady,
        allPlayersReady: allReady
      });

      // If all players ready, start battle after 3 seconds
      if (allReady) {
        setTimeout(() => {
          this.startBattle(data.roomId);
        }, 3000);
      }

      console.log(`✅ Player ready status updated: ${player.isReady}`);

    } catch (error) {
      console.error('Error updating ready status:', error);
      socket.emit('error', { message: 'Failed to update ready status' });
    }
  }

  private async startBattle(roomId: string) {
    try {
      console.log(`🎮 Starting battle in room ${roomId}`);

      const room = this.rooms.get(roomId);
      if (!room || room.players.length !== 2) {
        return;
      }

      // Get 5 random questions
      const questions = await prisma.question.findMany({
        where: {
          categoryId: room.categoryId || undefined
        },
        take: 5,
        orderBy: {
          _count: {
            select: { battleAnswers: true }
          }
        }
      });

      if (questions.length < 5) {
        // If not enough questions in category, get random questions
        const randomQuestions = await prisma.question.findMany({
          take: 5,
          orderBy: {
            _count: {
              select: { battleAnswers: true }
            }
          }
        });
        questions.push(...randomQuestions.slice(0, 5 - questions.length));
      }

      // Update room status
      room.status = 'active';
      room.currentQuestion = 0;
      room.questions = questions.map(q => ({
        id: q.id,
        question: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        timeLimit: 10
      }));

      // Update database
      await prisma.battleRoom.update({
        where: { id: roomId },
        data: { status: 'active' }
      });

      // Create battle questions in database
      for (let i = 0; i < questions.length; i++) {
        await prisma.battleQuestion.create({
          data: {
            roomId,
            questionId: questions[i].id,
            questionIndex: i,
            startedAt: new Date()
          }
        });
      }

      // Emit battle started event
      this.io.to(roomId).emit('battle_started', {
        questions: room.questions,
        totalQuestions: 5
      });

      // Start first question
      setTimeout(() => {
        this.startQuestion(roomId, 0);
      }, 2000);

      console.log(`✅ Battle started in room ${roomId}`);

    } catch (error) {
      console.error('Error starting battle:', error);
    }
  }

  private async startQuestion(roomId: string, questionIndex: number) {
    try {
      console.log(`❓ Starting question ${questionIndex + 1} in room ${roomId}`);

      const room = this.rooms.get(roomId);
      if (!room || !room.questions || questionIndex >= room.questions.length) {
        return;
      }

      room.currentQuestion = questionIndex;
      const question = room.questions[questionIndex];

      // Update database
      await prisma.battleQuestion.updateMany({
        where: {
          roomId,
          questionIndex
        },
        data: {
          startedAt: new Date()
        }
      });

      // Emit question started event
      this.io.to(roomId).emit('question_started', {
        questionIndex,
        question: {
          id: question.id,
          text: question.question,
          options: question.options
        },
        timeLimit: question.timeLimit
      });

      // Start timer
      let timeRemaining = question.timeLimit;
      room.timer = setInterval(() => {
        timeRemaining--;
        
        // Emit time update
        this.io.to(roomId).emit('time_update', {
          timeRemaining,
          questionIndex
        });

        if (timeRemaining <= 0) {
          // Time's up, end question
          clearInterval(room.timer);
          this.endQuestion(roomId, questionIndex);
        }
      }, 1000);

      console.log(`✅ Question ${questionIndex + 1} started in room ${roomId}`);

    } catch (error) {
      console.error('Error starting question:', error);
    }
  }

  private async endQuestion(roomId: string, questionIndex: number) {
    try {
      console.log(`⏰ Question ${questionIndex + 1} ended in room ${roomId}`);

      const room = this.rooms.get(roomId);
      if (!room || !room.questions || questionIndex >= room.questions.length) {
        return;
      }

      const question = room.questions[questionIndex];

      // Get all answers for this question
      const answers = await prisma.battleAnswer.findMany({
        where: {
          roomId,
          questionIndex
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Emit question ended event
      this.io.to(roomId).emit('question_ended', {
        questionIndex,
        correctAnswer: question.correctAnswer,
        answers: answers.map(a => ({
          userId: a.userId,
          userName: a.user.name,
          answerIndex: a.answerIndex,
          isCorrect: a.isCorrect,
          score: a.score,
          timeSpent: a.timeSpent
        }))
      });

      // Wait 3 seconds before next question or end battle
      setTimeout(() => {
        if (questionIndex + 1 < room.questions.length) {
          this.startQuestion(roomId, questionIndex + 1);
        } else {
          this.endBattle(roomId);
        }
      }, 3000);

      console.log(`✅ Question ${questionIndex + 1} ended in room ${roomId}`);

    } catch (error) {
      console.error('Error ending question:', error);
    }
  }

  private async endBattle(roomId: string) {
    try {
      console.log(`🏁 Ending battle in room ${roomId}`);

      const room = this.rooms.get(roomId);
      if (!room) {
        return;
      }

      // Get final scores
      const players = await prisma.battlePlayer.findMany({
        where: { roomId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePhoto: true
            }
          }
        },
        orderBy: { score: 'desc' }
      });

      // Determine winner
      const winner = players[0];
      const isDraw = players.length > 1 && players[0].score === players[1].score;

      // Update room status
      room.status = 'finished';
      await prisma.battleRoom.update({
        where: { id: roomId },
        data: { status: 'finished' }
      });

      // Emit battle ended event
      this.io.to(roomId).emit('battle_ended', {
        results: {
          players: players.map(p => ({
            id: p.user.id,
            name: p.user.name,
            avatar: p.user.profilePhoto,
            score: p.score,
            isWinner: !isDraw && p.id === winner.id
          })),
          winner: isDraw ? null : winner.user.name,
          isDraw
        }
      });

      // Clean up room after 10 seconds
      setTimeout(() => {
        this.rooms.delete(roomId);
        console.log(`🗑️ Room ${roomId} cleaned up`);
      }, 10000);

      console.log(`✅ Battle ended in room ${roomId}`);

    } catch (error) {
      console.error('Error ending battle:', error);
    }
  }

  private async handleSubmitAnswer(socket: BattleSocket, data: { roomId: string; questionIndex: number; answerIndex: number }) {
    try {
      console.log(`📝 User ${socket.userId} submitting answer in room ${data.roomId}`);

      const room = this.rooms.get(data.roomId);
      if (!room || room.status !== 'active') {
        socket.emit('error', { message: 'Battle not active' });
        return;
      }

      // Check if user is in the room
      const player = room.players.find(p => p.id === socket.userId);
      if (!player) {
        socket.emit('error', { message: 'Not in this room' });
        return;
      }

      // Check if already answered
      const existingAnswer = await prisma.battleAnswer.findFirst({
        where: {
          roomId: data.roomId,
          userId: socket.userId!,
          questionIndex: data.questionIndex
        }
      });

      if (existingAnswer) {
        socket.emit('error', { message: 'Already answered this question' });
        return;
      }

      // Process answer (this will be handled by the API endpoint)
      // For now, just notify other players
      socket.to(data.roomId).emit('opponent_answered', {
        questionIndex: data.questionIndex
      });

      console.log(`✅ Answer submitted by user ${socket.userId}`);

    } catch (error) {
      console.error('Error submitting answer:', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  }

  private handleDisconnect(socket: BattleSocket) {
    console.log(`🔌 Battle socket disconnected: ${socket.id}, User: ${socket.userId}`);
    
    this.userSockets.delete(socket.userId!);

    if (socket.roomId) {
      // Handle player disconnect from room
      const room = this.rooms.get(socket.roomId);
      if (room) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          player.isOnline = false;
          player.socketId = undefined;
          
          // Notify other players
          socket.to(socket.roomId).emit('player_disconnected', {
            playerId: socket.userId
          });
        }
      }
    }
  }

  public getIO() {
    return this.io;
  }
}

let battleSocketServer: BattleSocketServer | null = null;

export function getBattleSocketServer(server?: HTTPServer): BattleSocketServer {
  if (!battleSocketServer && server) {
    battleSocketServer = new BattleSocketServer(server);
  }
  return battleSocketServer!;
}

export function getBattleIO() {
  return battleSocketServer?.getIO();
}
