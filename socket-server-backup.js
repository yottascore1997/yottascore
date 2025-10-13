console.log('🚀 Starting Socket Server...');

const { Server } = require('socket.io');
const { createServer } = require('http');
const { PrismaClient } = require('@prisma/client');

console.log('📦 Dependencies loaded...');

const httpServer = createServer();
const prisma = new PrismaClient();

console.log('🔧 Initializing Socket.IO...');
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/api/socket',
  addTrailingSlash: false,
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

console.log('✅ Socket.IO initialized');

// Store user socket mappings
const userSockets = {};

io.on('connection', (socket) => {
  console.log('🔌 New socket connection:', socket.id);
  
  socket.on('register_user', (userId) => {
    if (userId) {
      userSockets[userId] = socket.id;
      socket.userId = userId;
      console.log('👤 User registered:', userId);
    }
  });
  
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

// Start the server
console.log('🔄 Starting server...');
const PORT = process.env.SOCKET_PORT || 3001;
console.log('📡 Port:', PORT);

httpServer.listen(PORT, () => {
  console.log('🚀 Socket server running on port ' + PORT);
  console.log('📡 Socket path: /api/socket');
  console.log('🔗 CORS enabled for all origins');
  console.log('✅ Server is ready!');
});
