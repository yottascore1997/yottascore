// React Native Messaging Logic - Complete Implementation
// Copy this entire file to your React Native project

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * User interface
 */
interface User {
  id: string;
  name: string;
  profilePhoto: string | null;
  course: string | null;
  year: number | null;
}

/**
 * Message interface
 */
interface Message {
  id: string;
  content: string;
  messageType: string;
  fileUrl: string | null;
  isRead: boolean;
  createdAt: string;
  sender: User;
  receiver: User;
  isRequest?: boolean;
  requestId?: string;
}

/**
 * Message request interface
 */
interface MessageRequest {
  id: string;
  content: string;
  messageType: string;
  fileUrl: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  sender: User;
  receiver: User;
}

/**
 * Conversation interface
 */
interface Conversation {
  user: User;
  latestMessage: Message | null;
  unreadCount: number;
}

// ============================================================================
// SOCKET HOOK
// ============================================================================

/**
 * Custom hook for Socket.IO connection
 */
export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const reconnectDelayRef = useRef(1000);

  const createSocket = useCallback(async () => {
    try {
      console.log('🔌 Creating Socket.IO connection...');
      
      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      console.log('🔐 Auth token available:', !!token);

      const SOCKET_URL = 'http://localhost:3001'; // Change this to your server URL

      const newSocket = io(SOCKET_URL, {
        path: '/api/socket',
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: reconnectDelayRef.current,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        auth: {
          token: token || undefined
        }
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;
        
        // Register user with socket server
        if (token) {
          try {
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
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          console.log('🔄 Server disconnected, attempting to reconnect...');
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err);
        setIsConnected(false);
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 5000);
          console.log(`🔄 Reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${reconnectDelayRef.current}ms`);
        } else {
          setError('Failed to connect to server after multiple attempts. Please check your internet connection and try again.');
        }
      });

      newSocket.on('error', (err) => {
        console.error('❌ Socket error:', err);
        setError(err.message || 'Socket error occurred');
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnect attempt ${attemptNumber}/${maxReconnectAttempts}`);
      });

      newSocket.on('reconnect_failed', (error) => {
        console.error('❌ Reconnection failed:', error);
        setError('Connection failed after multiple attempts. Please restart the app.');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setError(null);
      });

      setSocket(newSocket);
      return newSocket;
    } catch (error) {
      console.error('❌ Error creating socket:', error);
      setError('Failed to create socket connection');
    }
  }, [maxReconnectAttempts]);

  useEffect(() => {
    const newSocket = createSocket();
    
    return () => {
      if (newSocket) {
        console.log('🧹 Cleaning up socket connection');
        newSocket.close();
      }
    };
  }, [createSocket]);

  return { socket, isConnected, error };
};

// ============================================================================
// API UTILITIES
// ============================================================================

/**
 * Get auth token from AsyncStorage
 */
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * API base URL - change this to your server URL
 */
const API_BASE_URL = 'http://localhost:3000'; // Change this to your server URL

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// ============================================================================
// MESSAGING HOOK
// ============================================================================

/**
 * Custom hook for messaging functionality
 */
export const useMessaging = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageRequests, setMessageRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { socket, isConnected, error: socketError } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Initialize current user
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user = {
            id: payload.userId,
            name: payload.name || 'User',
            profilePhoto: null,
            course: null,
            year: null
          };
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error decoding JWT token:', error);
      }
    };

    initializeUser();
  }, []);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/student/messages');
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific user
  const fetchMessages = async (userId) => {
    try {
      console.log('🔍 Fetching messages for user:', userId);
      const data = await apiRequest(`/api/student/messages/${userId}`);
      
      if (data && Array.isArray(data)) {
        const sortedMessages = [...data].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  // Fetch message requests
  const fetchMessageRequests = async () => {
    try {
      const data = await apiRequest('/api/student/message-requests');
      setMessageRequests(data);
    } catch (error) {
      console.error('Error fetching message requests:', error);
    }
  };

  // Send message
  const sendMessage = async (content, receiverId) => {
    if (!receiverId || !content.trim() || !currentUser) return;

    setSending(true);
    const messageContent = content.trim();

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      messageType: 'TEXT',
      fileUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      receiver: { id: receiverId },
    };

    // Add optimistic message to UI
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const result = await apiRequest('/api/student/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: receiverId,
          content: messageContent,
        }),
      });

      if (result.type === 'direct') {
        // Replace optimistic message with real message
        if (result.message) {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id ? result.message : msg
          ));
        }
        
        // Update conversations
        fetchConversations();
        
        // Emit socket event
        if (socket && isConnected) {
          const chatId = [currentUser.id, receiverId].sort().join('-');
          socket.emit('private_message', { message: result.message || optimisticMessage });
        }
      } else if (result.type === 'request') {
        // Remove optimistic message since it was sent as request
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        Alert.alert('Message Sent', 'Message sent as a request. The recipient will need to accept it to start the conversation.');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      if (error.message.includes('follow')) {
        Alert.alert('Error', 'You need to follow this user first before you can message them.');
      } else {
        Alert.alert('Error', `Message failed to send: ${error.message}`);
      }
    } finally {
      setSending(false);
    }
  };

  // Accept message request
  const acceptRequest = async (requestId) => {
    try {
      const result = await apiRequest('/api/student/message-requests', {
        method: 'POST',
        body: JSON.stringify({
          requestId,
          action: 'accept'
        })
      });

      setMessageRequests(prev => prev.filter(req => req.id !== requestId));
      fetchConversations();
      
      if (result.message) {
        setMessages(prev => prev.map(msg => 
          msg.requestId === requestId ? result.message : msg
        ));
      }
    } catch (error) {
      console.error('Error accepting message request:', error);
      Alert.alert('Error', 'Failed to accept message request');
    }
  };

  // Reject message request
  const rejectRequest = async (requestId) => {
    try {
      await apiRequest('/api/student/message-requests', {
        method: 'POST',
        body: JSON.stringify({
          requestId,
          action: 'reject'
        })
      });

      setMessageRequests(prev => prev.filter(req => req.id !== requestId));
      setMessages(prev => prev.filter(msg => msg.requestId !== requestId));
    } catch (error) {
      console.error('Error rejecting message request:', error);
      Alert.alert('Error', 'Failed to reject message request');
    }
  };

  // Handle typing
  const handleTyping = (isTypingNow, receiverId) => {
    if (!socket || !receiverId || !currentUser) return;
    
    const chatId = [currentUser.id, receiverId].sort().join('-');
    
    if (isTypingNow) {
      socket.emit('start_typing', { chatId });
    } else {
      socket.emit('stop_typing', { chatId });
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (newMessage) => {
      if (selectedUser && 
          (newMessage.sender.id === selectedUser.id || 
           newMessage.receiver.id === selectedUser.id)) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (!exists) {
            return [...prev, newMessage];
          }
          return prev;
        });
        fetchConversations();
      } else {
        fetchConversations();
      }
      setIsTyping(false);
    };

    const handleMessagesRead = ({ readerId }) => {
      if (selectedUser && selectedUser.id === readerId) {
        setMessages(prev =>
          prev.map(msg => 
            msg.sender.id === currentUser?.id ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_were_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_were_read', handleMessagesRead);
    };
  }, [socket, isConnected, selectedUser, currentUser]);

  // Mark messages as read
  useEffect(() => {
    if (socket && isConnected && selectedUser && currentUser) {
      const unreadMessages = messages.filter(
        (msg) => msg.receiver.id === currentUser.id && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        const markAsRead = async () => {
          try {
            await apiRequest('/api/student/messages/read', {
              method: 'POST',
              body: JSON.stringify({ otherUserId: selectedUser.id }),
            });

            socket.emit('notify_messages_read', { 
              readerId: currentUser.id,
              otherUserId: selectedUser.id 
            });

            setMessages(prev => 
              prev.map(msg => 
                msg.receiver.id === currentUser.id ? { ...msg, isRead: true } : msg
              )
            );
          } catch (error) {
            console.error("Failed to mark messages as read", error);
          }
        };
        markAsRead();
      }
    }
  }, [selectedUser, messages, socket, isConnected]);

  // Initialize data
  useEffect(() => {
    fetchConversations();
    fetchMessageRequests();
  }, []);

  return {
    conversations,
    selectedUser,
    setSelectedUser,
    messages,
    messageRequests,
    loading,
    sending,
    currentUser,
    socketError,
    isTyping,
    setIsTyping,
    fetchConversations,
    fetchMessages,
    fetchMessageRequests,
    sendMessage,
    acceptRequest,
    rejectRequest,
    handleTyping,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format time for display
 */
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return `${Math.floor(diffInHours * 60)}m`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (name) => {
  return name ? name.charAt(0).toUpperCase() : 'U';
};

// ============================================================================
// STYLES
// ============================================================================

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  conversationItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  conversationContent: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  ownMessage: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageRequestContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  requestCount: {
    fontSize: 14,
    color: '#92400e',
  },
  requestItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  requestButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
    marginRight: 4,
  },
  typingText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Avatar component
 */
export const Avatar = ({ user, size = 50, style }) => {
  if (user?.profilePhoto) {
    return (
      <Image
        source={{ uri: user.profilePhoto }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#3b82f6',
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#ffffff',
          fontSize: size * 0.4,
          fontWeight: 'bold',
        }}
      >
        {getUserInitials(user?.name)}
      </Text>
    </View>
  );
};

/**
 * Message bubble component
 */
export const MessageBubble = ({ message, isOwn, onAcceptRequest, onRejectRequest }) => {
  const bubbleStyle = [
    styles.messageBubble,
    isOwn ? styles.ownMessage : styles.otherMessage,
  ];

  const textStyle = [
    styles.messageText,
    isOwn ? styles.ownMessageText : styles.otherMessageText,
  ];

  return (
    <View style={bubbleStyle}>
      {message.fileUrl && message.messageType === 'IMAGE' ? (
        <Image
          source={{ uri: message.fileUrl }}
          style={{ width: 200, height: 200, borderRadius: 8 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={textStyle}>{message.content}</Text>
      )}
      
      <Text style={[styles.messageTime, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
        {formatTime(message.createdAt)}
      </Text>
      
      {message.isRequest && !isOwn && (
        <View style={styles.requestButtons}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => onAcceptRequest(message.requestId)}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => onRejectRequest(message.requestId)}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/**
 * Conversation item component
 */
export const ConversationItem = ({ conversation, onPress }) => {
  return (
    <TouchableOpacity style={styles.conversationItem} onPress={onPress}>
      <Avatar user={conversation.user} size={50} />
      
      <View style={styles.conversationContent}>
        <Text style={styles.conversationName}>{conversation.user.name}</Text>
        {conversation.latestMessage && (
          <Text style={styles.conversationLastMessage} numberOfLines={1}>
            {conversation.latestMessage.content}
            {' • '}
            {formatTime(conversation.latestMessage.createdAt)}
          </Text>
        )}
      </View>
      
      {conversation.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Message request item component
 */
export const MessageRequestItem = ({ request, onAccept, onReject }) => {
  return (
    <View style={styles.requestItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Avatar user={request.sender} size={40} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
            {request.sender.name}
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            {formatTime(request.createdAt)}
          </Text>
        </View>
      </View>
      
      <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
        {request.content}
      </Text>
      
      <View style={styles.requestButtons}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept(request.id)}>
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={() => onReject(request.id)}>
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Typing indicator component
 */
export const TypingIndicator = ({ isTyping, userName }) => {
  if (!isTyping) return null;

  return (
    <View style={styles.typingIndicator}>
      <View style={styles.typingDots}>
        <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
        <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
        <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
      </View>
      <Text style={styles.typingText}>{userName} is typing...</Text>
    </View>
  );
};

// ============================================================================
// MAIN MESSAGING SCREEN
// ============================================================================

/**
 * Main messaging screen component
 */
export const MessagingScreen = () => {
  const {
    conversations,
    selectedUser,
    setSelectedUser,
    messages,
    messageRequests,
    loading,
    sending,
    currentUser,
    socketError,
    isTyping,
    setIsTyping,
    fetchConversations,
    fetchMessages,
    sendMessage,
    acceptRequest,
    rejectRequest,
    handleTyping,
  } = useMessaging();

  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    sendMessage(newMessage, selectedUser.id);
    setNewMessage('');
    handleTyping(false, selectedUser.id);
  };

  const handleTypingChange = (text) => {
    setNewMessage(text);
    if (selectedUser) {
      handleTyping(true, selectedUser.id);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set typing timeout
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false, selectedUser.id);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>Loading messages...</Text>
      </View>
    );
  }

  if (socketError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Connection Error</Text>
        <Text style={{ textAlign: 'center', color: '#6b7280', marginBottom: 16 }}>
          {socketError}
        </Text>
        <Text style={{ textAlign: 'center', color: '#6b7280', marginBottom: 16 }}>
          Real-time messaging may not work properly.
        </Text>
        <TouchableOpacity style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selectedUser) {
    return (
      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedUser(null)}>
            <Text style={{ color: '#3b82f6', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 12 }}>
            <Avatar user={selectedUser} size={40} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.headerTitle}>{selectedUser.name}</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                {isTyping ? 'typing...' : 'Online'}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={messagesEndRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender.id === currentUser?.id}
              onAcceptRequest={acceptRequest}
              onRejectRequest={rejectRequest}
            />
          )}
          style={styles.messagesContainer}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: '#6b7280', fontSize: 16 }}>No messages yet</Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
                Start a conversation by sending a message!
              </Text>
            </View>
          }
        />

        {/* Typing Indicator */}
        <TypingIndicator isTyping={isTyping} userName={selectedUser.name} />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={handleTypingChange}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={sending || !newMessage.trim()}
          >
            <Text style={{ color: '#ffffff', fontSize: 16 }}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations..."
        />
      </View>

      {/* Message Requests */}
      {messageRequests.length > 0 && (
        <View style={styles.messageRequestContainer}>
          <View style={styles.requestHeader}>
            <Text style={styles.requestTitle}>Message Requests</Text>
            <Text style={styles.requestCount}>{messageRequests.length} pending</Text>
          </View>
          {messageRequests.map((request) => (
            <MessageRequestItem
              key={request.id}
              request={request}
              onAccept={acceptRequest}
              onReject={rejectRequest}
            />
          ))}
        </View>
      )}

      {/* Conversations */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.user.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() => {
              setSelectedUser(item.user);
              fetchMessages(item.user.id);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: '#6b7280', fontSize: 16 }}>No conversations yet</Text>
            <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
              Start messaging with your friends!
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchConversations}
            colors={['#3b82f6']}
          />
        }
      />
    </View>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// In your App.js or main component:

import React from 'react';
import { MessagingScreen } from './ReactNativeMessagingLogic';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <MessagingScreen />
    </View>
  );
}

// Make sure to install required dependencies:
// npm install @react-native-async-storage/async-storage socket.io-client

// And update your server URLs in the constants:
// - API_BASE_URL: Your backend API URL
// - SOCKET_URL: Your Socket.IO server URL
*/
