const { Server } = require('socket.io');
const { createServer } = require('http');

const httpServer = createServer();


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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove user from mapping
    const userId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
    if (userId) {
      delete userSockets[userId];
      console.log(`User ${userId} disconnected`);
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
}); 