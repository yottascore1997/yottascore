import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

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
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
socket.on('join-battle', (data) => {
// Handle battle joining logic here
      });

      socket.on('submit-answer', (data) => {
// Handle answer submission logic here
      });

      socket.on('disconnect', () => {
});
    });

    res.socket.server.io = io;
    setSocketServer(io); // Store the instance globally
  }
  return res.socket.server.io;
}; 