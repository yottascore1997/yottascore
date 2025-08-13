import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Use the current window location for the socket URL
const SOCKET_URL = typeof window !== 'undefined' 
  ? 'http://localhost:3001'
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

// Check if running in React Native environment
const isReactNative = typeof window !== 'undefined' && 
  (window as any).ReactNativeWebView !== undefined || 
  typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = isReactNative ? 10 : 5; // More attempts for React Native
  const reconnectDelayRef = useRef(1000);

  const createSocket = useCallback(() => {
    // Only create socket on client side
    if (typeof window === 'undefined') return null;

    console.log('🔌 Creating Socket.IO connection...');
    console.log('   - URL:', SOCKET_URL);
    console.log('   - Is React Native:', isReactNative);
    console.log('   - Max reconnect attempts:', maxReconnectAttempts);

    // Get auth token
    const token = localStorage.getItem('token');
    console.log('🔐 Auth token available:', !!token);

    const newSocket = io(SOCKET_URL, {
      path: '/api/socket',
      transports: isReactNative ? ['polling', 'websocket'] : ['websocket', 'polling'], // Prefer polling for React Native
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelayRef.current,
      reconnectionDelayMax: 5000,
      timeout: isReactNative ? 20000 : 10000, // Longer timeout for React Native
      forceNew: true, // Force new connection for React Native
      auth: {
        token: token || undefined
      }
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      console.log('   - Is React Native:', isReactNative);
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts
      reconnectDelayRef.current = 1000; // Reset reconnect delay
      
      // Register user with socket server
      if (token) {
        try {
          // Decode JWT to get userId
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.userId) {
            newSocket.emit('register_user', payload.userId);
            console.log('👤 User registered with socket server:', payload.userId);
          }
        } catch (error) {
          console.error('❌ Error decoding token:', error);
        }
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      console.log('   - Is React Native:', isReactNative);
      setIsConnected(false);
      
      // Handle specific disconnect reasons for React Native
      if (isReactNative) {
        if (reason === 'io server disconnect') {
          console.log('🔄 Server disconnected, attempting to reconnect...');
          newSocket.connect();
        } else if (reason === 'io client disconnect') {
          console.log('📱 Client disconnected (app backgrounded or network issue)');
        }
      }
    });

    newSocket.on('connect_error', (err: any) => {
      console.error('❌ Socket connection error:', err);
      console.log('   - Is React Native:', isReactNative);
      console.log('   - Reconnect attempts:', reconnectAttemptsRef.current);
      
      setIsConnected(false);
      
      // Handle connection errors for React Native
      if (isReactNative) {
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 5000);
          console.log(`🔄 React Native reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${reconnectDelayRef.current}ms`);
        } else {
          setError('Failed to connect to game server after multiple attempts. Please check your internet connection and try again.');
        }
      } else {
        setError('Failed to connect to game server. Make sure the Socket.IO server is running on port 3001.');
      }
    });

    newSocket.on('error', (err: any) => {
      console.error('❌ Socket error:', err);
      console.log('   - Is React Native:', isReactNative);
      setError(err.message || 'Socket error occurred');
    });

    // React Native specific event handlers
    if (isReactNative) {
      newSocket.on('reconnect_attempt', (attemptNumber: number) => {
        console.log(`🔄 React Native reconnect attempt ${attemptNumber}/${maxReconnectAttempts}`);
      });

      newSocket.on('reconnect_failed', (error: any) => {
        console.error('❌ React Native reconnection failed:', error);
        setError('Connection failed after multiple attempts. Please restart the app.');
      });

      newSocket.on('reconnect', (attemptNumber: number) => {
        console.log(`✅ React Native reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setError(null);
      });
    }

    return newSocket;
  }, [maxReconnectAttempts]);

  useEffect(() => {
    const newSocket = createSocket();
    if (newSocket) {
      setSocket(newSocket);
    }

    return () => {
      if (newSocket) {
        console.log('🧹 Cleaning up socket connection');
        newSocket.close();
      }
    };
  }, [createSocket]);

  // React Native specific: Handle app state changes
  useEffect(() => {
    if (!isReactNative || !socket) return;

    const handleAppStateChange = (nextAppState: string) => {
      console.log('📱 App state changed:', nextAppState);
      
      if (nextAppState === 'active' && !socket.connected) {
        console.log('🔄 App became active, attempting to reconnect...');
        socket.connect();
      } else if (nextAppState === 'background') {
        console.log('📱 App backgrounded, socket will handle disconnection');
      }
    };

    // Add app state listener if available (React Native)
    if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
      // This would be handled by React Native's AppState in a real RN app
      console.log('📱 React Native WebView detected, app state handling would be implemented here');
    }

    return () => {
      // Cleanup app state listener if needed
    };
  }, [socket, isReactNative]);

  return { socket, isConnected, error, isReactNative };
}

export const useSocketWithNotification = (onNotification?: (notification: any) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const isReactNative = typeof window !== 'undefined' && 
    (window as any).ReactNativeWebView !== undefined || 
    typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log('🔌 Creating notification socket connection...');
    console.log('   - Is React Native:', isReactNative);

    const newSocket = io(SOCKET_URL, {
      path: '/api/socket',
      transports: isReactNative ? ['polling', 'websocket'] : ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: isReactNative ? 10 : 5,
      reconnectionDelay: 1000,
      timeout: isReactNative ? 20000 : 10000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Notification socket connected:', newSocket.id);
      console.log('   - Is React Native:', isReactNative);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Notification socket disconnected:', reason);
      console.log('   - Is React Native:', isReactNative);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ Notification socket connection error:', error);
      console.log('   - Is React Native:', isReactNative);
    });

    newSocket.on('error', (error: any) => {
      console.error('❌ Notification socket error:', error);
    });

    // React Native specific handlers
    if (isReactNative) {
      newSocket.on('reconnect_attempt', (attemptNumber: number) => {
        console.log(`🔄 Notification socket reconnect attempt ${attemptNumber}`);
      });

      newSocket.on('reconnect_failed', (error: any) => {
        console.error('❌ Notification socket reconnection failed:', error);
      });

      newSocket.on('reconnect', (attemptNumber: number) => {
        console.log(`✅ Notification socket reconnected after ${attemptNumber} attempts`);
      });
    }

    // Listen for notifications
    if (onNotification) {
      newSocket.on('notification', (data: any) => {
        console.log('📢 Notification received:', data);
        onNotification(data);
      });

      newSocket.on('live_exam_notification', (data: any) => {
        console.log('📢 Live exam notification received:', data);
        onNotification(data);
      });
    }

    socketRef.current = newSocket;
  }, [onNotification, isReactNative]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🧹 Disconnecting notification socket');
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { socket: socketRef.current, connect, disconnect, isReactNative };
}; 