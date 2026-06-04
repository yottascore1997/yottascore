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
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// Store user socket mappings
const userSockets = {};

io.on('connection', (socket) => {
socket.on('register_user', (userId) => {
    if (userId) {
      userSockets[userId] = socket.id;
      socket.userId = userId;
}
  });
  
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  socket.on('disconnect', () => {
});
});

// Start the server
const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
});
