'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface MessageNotificationProps {
  onMessageReceived?: (message: any) => void;
}

interface NotificationData {
  type: string;
  message: any;
  unreadCount: number;
}

export default function MessageNotification({ onMessageReceived }: MessageNotificationProps) {
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  // Get user data from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.userId, token });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.token) return;

    // Initialize socket connection
    const newSocket = io('http://localhost:3000', {
      path: '/api/socket',
      auth: {
        token: user.token
      }
    });

    newSocket.on('connect', () => {
      console.log('🔌 Message notification socket connected');
      // Join user's personal room
      newSocket.emit('join_chat', `user_${user.id}`);
    });

    // Listen for new messages
    newSocket.on('new_message', (message) => {
      console.log('📨 New message received:', message);
      
      // Add to notifications
      const notification: NotificationData = {
        type: 'new_message',
        message,
        unreadCount: 1
      };
      
      setNotifications(prev => [...prev, notification]);
      setShowNotification(true);
      
      // Call callback if provided
      if (onMessageReceived) {
        onMessageReceived(message);
      }
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    });

    // Listen for message notifications
    newSocket.on('message_notification', (data: NotificationData) => {
      console.log('🔔 Message notification:', data);
      setNotifications(prev => [...prev, data]);
      setShowNotification(true);
    });

    // Listen for admin push notifications
    newSocket.on('admin_notification', (data: any) => {
      console.log('🔔 Admin push notification:', data);
      const notification: NotificationData = {
        type: 'admin_notification',
        message: {
          title: data.title,
          content: data.message,
          type: data.notificationType
        },
        unreadCount: 1
      };
      setNotifications(prev => [...prev, notification]);
      setShowNotification(true);
      
      // Update unread count in parent component
      const event = new CustomEvent('notificationReceived', { 
        detail: { type: 'admin_notification', count: 1 } 
      });
      window.dispatchEvent(event);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.token, user?.id, onMessageReceived]);

  const handleNotificationClick = () => {
    setShowNotification(false);
    // Navigate to messages page or specific chat
    window.location.href = '/student/messages';
  };

  if (!showNotification || notifications.length === 0) {
    return null;
  }

  const latestNotification = notifications[notifications.length - 1];

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className="bg-blue-600 text-white p-4 rounded-lg shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
        onClick={handleNotificationClick}
      >
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <div>
            <div className="font-semibold">
              {latestNotification.type === 'admin_notification' ? 'Admin Notification' : 'New Message'}
            </div>
            <div className="text-sm opacity-90">
              {latestNotification.type === 'admin_notification' 
                ? latestNotification.message?.title || 'New notification'
                : `${latestNotification.message?.sender?.name || 'Someone'} sent you a message`
              }
            </div>
            <div className="text-xs opacity-75 mt-1">
              {latestNotification.type === 'admin_notification'
                ? latestNotification.message?.content?.substring(0, 50) + '...'
                : latestNotification.message?.content?.substring(0, 50) + '...'
              }
            </div>
          </div>
        </div>
        
        {notifications.length > 1 && (
          <div className="mt-2 text-xs opacity-75">
            +{notifications.length - 1} more messages
          </div>
        )}
      </div>
    </div>
  );
}
