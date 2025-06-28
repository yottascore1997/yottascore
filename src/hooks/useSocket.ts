import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Use the current window location for the socket URL
const SOCKET_URL = typeof window !== 'undefined' 
  ? 'http://localhost:3001'
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only create socket on client side
    if (typeof window === 'undefined') return;

    console.log('Connecting to Socket.IO server at:', SOCKET_URL);

    // Get auth token
    const token = localStorage.getItem('token');
    console.log('Auth token available:', !!token);

    const newSocket = io(SOCKET_URL, {
      path: '/api/socket',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token || undefined
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err: any) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to game server. Make sure the Socket.IO server is running on port 3001.');
      setIsConnected(false);
    });

    newSocket.on('error', (err: any) => {
      console.error('Socket error:', err);
      setError(err.message || 'Socket error occurred');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, isConnected, error };
}

export const useSocketWithNotification = (onNotification?: (notification: any) => void) => {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const newSocket = io(SOCKET_URL, {
      path: '/api/socket',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', (reason: any) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    newSocket.on('reconnect_attempt', (attemptNumber: any) => {
      console.log('Reconnection attempt:', attemptNumber);
    });

    newSocket.on('reconnect_failed', (error: any) => {
      console.error('Reconnection failed:', error);
    });

    // Listen for notifications
    if (onNotification) {
      newSocket.on('notification', (data: any) => {
        onNotification(data);
      });

      newSocket.on('live_exam_notification', (data: any) => {
        onNotification(data);
      });
    }

    socketRef.current = newSocket;
  }, [onNotification]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { socket: socketRef.current, connect, disconnect };
}; 