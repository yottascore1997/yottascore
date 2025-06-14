import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

// Use the current window location for the socket URL
const SOCKET_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      console.log('Initializing Socket.IO client...', SOCKET_URL);
      socketRef.current = io(SOCKET_URL, {
        path: '/api/socket',
        addTrailingSlash: false,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true,
        withCredentials: true,
        autoConnect: true,
        upgrade: true
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current?.id);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        // Try to reconnect with a different transport
        if (socketRef.current?.io?.opts?.transports?.[0] === 'polling') {
          socketRef.current.io.opts.transports = ['websocket', 'polling'];
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          socketRef.current?.connect();
        }
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
      });

      socketRef.current.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });

      socketRef.current.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
      });
    }

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
}; 