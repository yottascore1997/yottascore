const { Server } = require('socket.io');
const { createServer } = require('http');
const { PrismaClient } = require('@prisma/client');

const httpServer = createServer();
const prisma = new PrismaClient();

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

// Battle Quiz Matchmaking
const waitingPlayers = new Map(); // quizId -> array of waiting players
const activeMatches = new Map(); // matchId -> match data
const privateRooms = new Map(); // roomCode -> room data

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register_user', (userId) => {
    if (userId) {
      userSockets[userId] = socket.id;
      socket.userId = userId; // Store userId in socket object
      console.log(`User ${userId} registered with socket ${socket.id}`);
    }
  });

  // Battle Quiz Events
  socket.on('join_matchmaking', (data) => {
    const { categoryId, mode } = data;
    const userId = socket.userId; // We need to get userId from socket
    console.log(`User joining matchmaking for category ${categoryId}, mode: ${mode}`);
    console.log('Socket userId:', userId);
    console.log('Socket id:', socket.id);
    
    // For now, let's use a simple approach - join a general queue
    const quizId = categoryId || 'general';
    console.log('Using quizId:', quizId);
    
    if (!waitingPlayers.has(quizId)) {
      waitingPlayers.set(quizId, []);
      console.log('Created new waiting queue for quizId:', quizId);
    }
    
    const player = {
      userId: userId || socket.id, // Fallback to socket.id if no userId
      socketId: socket.id,
      quizData: {
        categoryId,
        mode,
        questionCount: 5,
        timePerQuestion: 15
      },
      joinedAt: Date.now()
    };
    
    waitingPlayers.get(quizId).push(player);
    console.log(`Player added to queue. Queue size for ${quizId}:`, waitingPlayers.get(quizId).length);
    console.log('All waiting players:', Array.from(waitingPlayers.entries()));
    
    socket.join(`quiz_${quizId}`);
    
    // Send matchmaking update
    socket.emit('matchmaking_update', {
      status: 'searching',
      estimatedWait: 30,
      message: 'Searching for opponent...'
    });
    
    // Try to match players
    tryMatchPlayers(quizId).catch(error => {
      console.error('Error in tryMatchPlayers:', error);
    });
  });

  socket.on('cancel_matchmaking', () => {
    console.log(`User ${socket.id} cancelled matchmaking`);
    
    // Remove from all waiting queues
    waitingPlayers.forEach((players, quizId) => {
      const index = players.findIndex(p => p.socketId === socket.id);
      if (index !== -1) {
        players.splice(index, 1);
        console.log(`Removed player from quiz ${quizId}`);
      }
    });
    
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
    if (match.player1Id === userId) {
      match.player1Answers[questionIndex] = { answer, timeSpent, timestamp: Date.now() };
      console.log('Player 1 answer recorded for question', questionIndex);
    } else if (match.player2Id === userId) {
      match.player2Answers[questionIndex] = { answer, timeSpent, timestamp: Date.now() };
      console.log('Player 2 answer recorded for question', questionIndex);
    }
    
    // Notify opponent that this player answered
    const opponentSocketId = match.player1Id === userId ? match.player2SocketId : match.player1SocketId;
    console.log('Notifying opponent at socket:', opponentSocketId);
    io.to(opponentSocketId).emit('opponent_answered', { questionIndex });
    
    // Check if both players answered
    const p1Answered = match.player1Answers[questionIndex];
    const p2Answered = match.player2Answers[questionIndex];
    console.log('Player 1 answered:', !!p1Answered);
    console.log('Player 2 answered:', !!p2Answered);
    
    if (p1Answered && p2Answered) {
      console.log('Both players answered question', questionIndex);
      
      // Move to next question or end game
      setTimeout(() => {
        if (questionIndex < match.totalQuestions - 1) {
          match.currentQuestion = questionIndex + 1;
          const nextQuestion = match.questions[match.currentQuestion];
          console.log('Moving to next question:', match.currentQuestion);
          console.log('Next question:', nextQuestion);
          
          io.to(match.player1SocketId).emit('next_question', {
            questionIndex: match.currentQuestion,
            question: nextQuestion
          });
          
          io.to(match.player2SocketId).emit('next_question', {
            questionIndex: match.currentQuestion,
            question: nextQuestion
          });
        } else {
          console.log('All questions answered, ending match');
          endMatch(matchId);
        }
      }, 2000); // 2 second delay between questions
    } else {
      console.log('Waiting for other player to answer...');
    }
  });

  socket.on('leave_battle_queue', (quizId) => {
    if (waitingPlayers.has(quizId)) {
      const players = waitingPlayers.get(quizId);
      const index = players.findIndex(p => p.socketId === socket.id);
      if (index !== -1) {
        players.splice(index, 1);
        console.log(`Player left battle queue for quiz ${quizId}`);
      }
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
        timeLimit: 15
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove user from mapping
    const userId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
    if (userId) {
      delete userSockets[userId];
      console.log(`User ${userId} disconnected`);
    }
    
    // Remove from waiting queues
    waitingPlayers.forEach((players, quizId) => {
      const index = players.findIndex(p => p.socketId === socket.id);
      if (index !== -1) {
        players.splice(index, 1);
        console.log(`Removed disconnected player from quiz ${quizId}`);
      }
    });
  });
});

// Helper Functions
async function tryMatchPlayers(quizId) {
  const players = waitingPlayers.get(quizId);
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
    
    // Create match
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Generating questions for match with quiz data:', player1.quizData);
    const questions = await generateQuestions(player1.quizData);
    console.log('Generated questions:', questions);
    
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
      startTime: Date.now()
    };
    
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
    console.log('Sending opponent_found to player1:', player1.socketId);
    io.to(player1.socketId).emit('opponent_found', { 
      opponent: { id: player2.userId, name: `Player ${player2.userId.slice(-4)}` },
      category: player1.quizData.categoryId
    });
    
    console.log('Sending opponent_found to player2:', player2.socketId);
    io.to(player2.socketId).emit('opponent_found', { 
      opponent: { id: player1.userId, name: `Player ${player1.userId.slice(-4)}` },
      category: player2.quizData.categoryId
    });
    
    // Start match after 3 seconds
    setTimeout(() => {
      // Send match starting event
      console.log('Sending match_starting to both players');
      io.to(player1.socketId).emit('match_starting', { countdown: 3 });
      io.to(player2.socketId).emit('match_starting', { countdown: 3 });
      
      setTimeout(() => {
        // Send match ready event
        console.log('Sending match_ready to both players');
        io.to(player1.socketId).emit('match_ready', { matchId });
        io.to(player2.socketId).emit('match_ready', { matchId });
        
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
  
  io.to(match.player1SocketId).emit('match_started', matchStartedData);
  io.to(match.player2SocketId).emit('match_started', matchStartedData);
  
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

function endMatch(matchId) {
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
  
  const winner = player1Score > player2Score ? match.player1Id : 
                player2Score > player1Score ? match.player2Id : null;
  
  const results = {
    matchId,
    player1Score,
    player2Score,
    winner,
    isDraw: player1Score === player2Score
  };
  
  console.log('Match results:', results);
  
  // Send results to both players
  io.to(match.player1SocketId).emit('match_ended', results);
  io.to(match.player2SocketId).emit('match_ended', results);
  
  // Clean up
  activeMatches.delete(matchId);
  
  console.log(`Match ${matchId} ended. Winner: ${winner}`);
}

async function generateQuestions(quizData) {
  try {
    console.log('Generating questions for quiz data:', quizData);
    console.log('Category ID:', quizData.categoryId);
    
    // Always try to fetch questions from database first
    if (quizData.categoryId) {
      console.log('Fetching questions from category:', quizData.categoryId);
      
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
      
      console.log(`Found ${questions.length} questions in category ${quizData.categoryId}`);
      
      if (questions.length > 0) {
        // Shuffle and pick random questions
        const shuffled = questions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, quizData.questionCount || 5);
        
        console.log(`Selected ${selectedQuestions.length} questions from database`);
        
        return selectedQuestions.map((q, index) => ({
          id: index,
          text: q.text,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation
        }));
      } else {
        console.log('No questions found in category, trying to fetch any active questions');
        
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
        
        console.log(`Found ${allQuestions.length} total active questions`);
        
        if (allQuestions.length > 0) {
          const shuffled = allQuestions.sort(() => 0.5 - Math.random());
          const selectedQuestions = shuffled.slice(0, quizData.questionCount || 5);
          
          console.log(`Selected ${selectedQuestions.length} questions from all categories`);
          
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
    console.log('No questions found in database, using dummy questions');
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
    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
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
    return questions;
  }
}

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Battle Quiz matchmaking enabled`);
}); 