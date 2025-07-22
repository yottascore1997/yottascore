'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MessageCircle, Send, ArrowLeft, Plus, Paperclip, Loader2, File } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface User {
  id: string
  name: string
  profilePhoto: string | null
  course: string | null
  year: number | null
}

interface Message {
  id: string
  content: string
  messageType: string
  fileUrl: string | null
  isRead: boolean
  createdAt: string
  sender: User
  receiver: User
  isRequest?: boolean
  requestId?: string
}

interface MessageRequest {
  id: string
  content: string
  messageType: string
  fileUrl: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
  sender: User
  receiver: User
}

interface Conversation {
  user: User
  latestMessage: Message | null
  unreadCount: number
}

function MessagesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMessageRequests, setShowMessageRequests] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const { socket, isConnected, error: socketError } = useSocket()
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Refs to hold the most current state for our socket listeners, avoiding stale closures
  const selectedUserRef = useRef(selectedUser)
  const messagesRef = useRef(messages)
  const currentUserRef = useRef(currentUser)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchConversations()
    fetchMessageRequests()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id)
    }
  }, [selectedUser, messageRequests])

  // Handle user parameter from URL
  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId) {
      // First try to find user in existing conversations
      const user = conversations.find(conv => conv.user.id === userId)?.user
      if (user) {
        setSelectedUser(user)
      } else {
        // If user not in conversations, fetch their profile data
        fetchUserProfile(userId)
      }
    }
  }, [searchParams, conversations])

  // Fetch current user's profile to get their ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/student/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data)
        }
      } catch (error) {
        console.error("Failed to fetch current user", error)
      }
    }
    fetchCurrentUser()
  }, [])
  
  // Register user with socket server
  useEffect(() => {
    if (socket && isConnected && currentUser) {
      socket.emit('register_user', currentUser.id)
    }
  }, [socket, isConnected, currentUser])

  // Keep refs updated with the latest state
  useEffect(() => {
    selectedUserRef.current = selectedUser
    messagesRef.current = messages
    currentUserRef.current = currentUser
  }, [selectedUser, messages, currentUser])

  // Centralized real-time event handler setup
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('Socket not connected, real-time features disabled')
      return
    }

    // --- Listener for new messages ---
    const handleNewMessage = (newMessage: Message) => {
      // Check if newMessage and sender exist before accessing properties
      if (!newMessage || !newMessage.sender) {
        console.warn('Received message with missing sender:', newMessage)
        return
      }
      
      // If this chat is currently open, add the message to the state
      if (selectedUserRef.current && newMessage.sender.id === selectedUserRef.current.id) {
        setMessages(prev => [...prev, newMessage])
      } else {
        // If chat is not open, just refresh the conversation list to show the notification
        fetchConversations()
      }
      setIsTyping(false)
    }

    // --- Listener for read receipts ---
    const handleMessagesRead = ({ readerId }: { readerId: string }) => {
      if (selectedUserRef.current && selectedUserRef.current.id === readerId) {
        setMessages(prev =>
          prev.map(msg => {
            // Check if msg and sender exist before accessing properties
            if (!msg || !msg.sender) {
              console.warn('Message with missing sender found in handleMessagesRead:', msg);
              return msg; // Return unchanged message
            }
            return msg.sender.id === currentUserRef.current?.id ? { ...msg, isRead: true } : msg;
          })
        )
      }
    }
    
    socket.on('new_message', handleNewMessage)
    socket.on('messages_were_read', handleMessagesRead)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('messages_were_read', handleMessagesRead)
    }
  }, [socket, isConnected]) // This effect now runs when socket is ready and connected

  // Effect to mark messages as read when a chat is opened
  useEffect(() => {
    if (socket && isConnected && selectedUserRef.current && currentUserRef.current) {
      const unreadMessages = messagesRef.current.filter(
        (msg) => {
          // Check if msg and receiver exist before accessing properties
          if (!msg || !msg.receiver) {
            console.warn('Message with missing receiver found in unreadMessages filter:', msg);
            return false; // Skip this message
          }
          return msg.receiver.id === currentUserRef.current?.id && !msg.isRead;
        }
      )

      if (unreadMessages.length > 0) {
        // 1. Call API to update the database
        const markAsRead = async () => {
          try {
            const token = localStorage.getItem('token')
            await fetch('/api/student/messages/read', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ otherUserId: selectedUserRef.current?.id }),
            })

            // 2. Notify the other user via WebSocket
            socket.emit('notify_messages_read', { 
              readerId: currentUserRef.current?.id,
              otherUserId: selectedUserRef.current?.id 
            })

            // 3. Update the state locally for the current user
            setMessages(prev => 
              prev.map(msg => {
                // Check if msg and receiver exist before accessing properties
                if (!msg || !msg.receiver) {
                  console.warn('Message with missing receiver found in setMessages:', msg);
                  return msg; // Return unchanged message
                }
                return msg.receiver.id === currentUserRef.current?.id ? { ...msg, isRead: true } : msg;
              })
            )

          } catch (error) {
            console.error("Failed to mark messages as read", error)
          }
        }
        markAsRead()
      }
    }
  }, [selectedUser, messages, socket, isConnected]) // This effect now correctly depends on selectedUser

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/messages', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/student/messages/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        
        // If no direct messages, check for message requests from this user
        if (data.length === 0) {
          const pendingRequest = messageRequests.find(req => {
            // Check if req and sender exist before accessing properties
            if (!req || !req.sender) {
              console.warn('Message request with missing sender found:', req);
              return false; // Skip this request
            }
            return req.sender.id === userId && req.status === 'PENDING';
          })
          if (pendingRequest) {
            // Show the pending request as a message in the chat
            setMessages([{
              id: `request-${pendingRequest.id}`,
              content: pendingRequest.content,
              messageType: pendingRequest.messageType,
              fileUrl: pendingRequest.fileUrl,
              isRead: false,
              createdAt: pendingRequest.createdAt,
              sender: pendingRequest.sender,
              receiver: pendingRequest.receiver,
              isRequest: true, // Flag to identify this as a request
              requestId: pendingRequest.id
            }])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/student/profile?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        const user: User = {
          id: userData.id,
          name: userData.name,
          profilePhoto: userData.profilePhoto,
          course: userData.course,
          year: userData.year
        }
        setSelectedUser(user)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchMessageRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/message-requests', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessageRequests(data)
      }
    } catch (error) {
      console.error('Error fetching message requests:', error)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/student/message-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId,
          action: 'accept'
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Remove the request from the list
        setMessageRequests(prev => prev.filter(req => req.id !== requestId))
        // Refresh conversations to show the new conversation
        fetchConversations()
        
        // Update messages state - replace the request message with the actual message
        if (result.message) {
          setMessages(prev => prev.map(msg => 
            msg.requestId === requestId ? result.message : msg
          ))
        }
      }
    } catch (error) {
      console.error('Error accepting message request:', error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/student/message-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId,
          action: 'reject'
        })
      })

      if (response.ok) {
        // Remove the request from the list
        setMessageRequests(prev => prev.filter(req => req.id !== requestId))
        // Remove the request message from the chat
        setMessages(prev => prev.filter(msg => msg.requestId !== requestId))
      }
    } catch (error) {
      console.error('Error rejecting message request:', error)
    }
  }

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim() || !currentUser) return

    setSending(true)
    const chatId = [currentUser.id, selectedUser.id].sort().join('-')
    const tempId = `temp-${Date.now()}`
    const content = newMessage.trim()
    
    // Clear the input immediately for a responsive feel
    setNewMessage('')

    // 1. Optimistic UI update for the sender
    const optimisticMessage: Message = {
      id: tempId,
      content: content,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      receiver: selectedUser,
      messageType: 'TEXT',
      fileUrl: null,
      isRead: false,
    }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const token = localStorage.getItem('token')
      // 2. Save the message to the database
      const response = await fetch('/api/student/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: content,
        }),
      })

      if (!response.ok) {
        throw new Error('Server responded with an error')
      }
      
      const result = await response.json()

      if (result.type === 'direct') {
        // 3. Replace the optimistic message with the real one from the server
        setMessages(prev => prev.map(msg => (msg.id === tempId ? result.message : msg)))
        
        // 4. Emit WebSocket event for real-time delivery
        if (socket && isConnected) {
          socket.emit('private_message', { message: result.message });
          console.log('Emitted private_message event:', result.message.id);
        }

      } else if (result.type === 'request') {
        // Message was sent as a request - remove the optimistic message
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        // Show a notification that the message was sent as a request
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50'
        notification.innerHTML = `
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">Message sent as a request</p>
              <p class="text-sm">The recipient will need to accept it to start the conversation.</p>
            </div>
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 5000)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      // 5. If sending fails, remove the optimistic message
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setNewMessage(content) // Restore the message in the input box
      alert('Message failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    if (!socket || !selectedUser || !currentUser) return
    const chatId = [currentUser.id, selectedUser.id].sort().join('-')

    socket.emit('start_typing', { chatId })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { chatId })
    }, 2000) // Consider typing stopped after 2 seconds of inactivity
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.success && result.url) {
        await sendFileMessage(result.url, file.type, file.name);
      } else {
        throw new Error(result.error || 'Upload returned an error');
      }

    } catch (error) {
      console.error("File upload error:", error);
      alert("Sorry, there was an error uploading your file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const sendFileMessage = async (fileUrl: string, fileType: string, fileName: string) => {
    if (!selectedUser || !currentUser || !fileUrl) return;
    
    const messageType = fileType.startsWith('image/') ? 'IMAGE' : 'FILE';
    const content = messageType === 'IMAGE' ? 'Image' : fileName;
    
    // The rest is the same as the text message sending logic
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      receiver: selectedUser,
      messageType,
      fileUrl,
      isRead: false,
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content,
          messageType,
          fileUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to save file message');
      
      const savedMessage = await response.json();
      setMessages(prev => prev.map(msg => (msg.id === tempId ? savedMessage : msg)));
      
      // Emit WebSocket event for real-time delivery
      if (socket && isConnected) {
        socket.emit('private_message', { message: savedMessage });
        console.log('Emitted private_message event for file:', savedMessage.id);
      }

    } catch (error) {
      console.error("Error sending file message:", error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert('Failed to send file.');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`
    } else {
      return date.toLocaleDateString()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Manual refresh function
  const refreshMessages = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/student/messages/${selectedUser.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const newMessages = await response.json();
        setMessages(newMessages);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  // Real-time message updates using WebSocket events (no polling)
  useEffect(() => {
    console.log('Setting up WebSocket listeners:', { 
      socket: !!socket, 
      isConnected, 
      currentUser: !!currentUser 
    });
    
    if (!socket || !isConnected || !currentUser) return;

    // Listen for new messages in real-time
    const handleNewMessage = (message: Message) => {
      console.log('Received new_message event:', message);
      
      // Check if message and sender/receiver exist before accessing properties
      if (!message || !message.sender || !message.receiver) {
        console.warn('Received message with missing sender or receiver:', message);
        return;
      }
      
      // If this message is for the currently open chat
      if (selectedUser && 
          (message.sender.id === selectedUser.id || message.receiver.id === selectedUser.id)) {
        console.log('Message is for current chat, adding to messages');
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.id === message.id);
          if (!exists) {
            return [...prev, message];
          }
          console.log('Message already exists, not adding duplicate');
          return prev;
        });
        
        // Update conversations list to show latest message
        fetchConversations();
      } else if (!selectedUser) {
        // If no chat is open, just update conversations
        console.log('No chat open, updating conversations');
        fetchConversations();
      } else {
        console.log('Message not for current chat, ignoring');
      }
    };

    // Listen for message read receipts
    const handleMessageRead = (data: { readerId: string, otherUserId: string }) => {
      if (selectedUser && data.otherUserId === selectedUser.id) {
        setMessages(prev =>
          prev.map(msg => {
            // Check if msg and sender exist before accessing properties
            if (!msg || !msg.sender) {
              console.warn('Message with missing sender found in handleMessageRead:', msg);
              return msg; // Return unchanged message
            }
            return msg.sender.id === currentUser.id ? { ...msg, isRead: true } : msg;
          })
        );
      }
    };

    // Listen for typing indicators
    const handleTypingStart = () => {
      if (selectedUser) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = () => {
      if (selectedUser) {
        setIsTyping(false);
      }
    };



    console.log('Registering socket event listeners');
    socket.on('new_message', handleNewMessage);
    socket.on('messages_were_read', handleMessageRead);
    socket.on('user_typing', handleTypingStart);
    socket.on('user_stopped_typing', handleTypingStop);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_were_read', handleMessageRead);
      socket.off('user_typing', handleTypingStart);
      socket.off('user_stopped_typing', handleTypingStop);
    };
  }, [socket, isConnected, currentUser, selectedUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  // Show socket connection error if socket failed to connect
  if (socketError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-red-500 rounded-full"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{socketError}</p>
          <p className="text-sm text-gray-500">Real-time messaging may not work properly.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (selectedUser) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUser(null)}
              className="p-2 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={() => router.push(`/student/profile?userId=${selectedUser.id}`)}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {selectedUser.profilePhoto ? (
                    <img 
                      src={selectedUser.profilePhoto} 
                      alt={selectedUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    selectedUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                {/* Placeholder for online status */}
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white"></span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">
                  {isTyping ? 'typing...' : 'Online'}
                </p>
              </div>
            </div>
            

            
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshMessages}
              className="p-2 rounded-full text-gray-500 hover:text-blue-600"
              title="Refresh messages"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message, index) => {
            // Check if message and sender exist before accessing properties
            if (!message || !message.sender) {
              console.warn('Message with missing sender found:', message);
              return null; // Skip rendering this message
            }
            
            const isOwn = message.sender.id !== selectedUser.id
            
            return (
              <div
                key={message.id || index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl ${
                    message.isRequest 
                      ? 'bg-yellow-50 border-2 border-yellow-200' 
                      : isOwn 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                  } ${message.messageType === 'IMAGE' ? 'p-1' : 'px-4 py-2'}`}
                >
                  {message.messageType === 'IMAGE' && message.fileUrl && (
                    <img
                      src={message.fileUrl}
                      alt="Sent image"
                      className="rounded-xl max-w-xs cursor-pointer"
                      onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
                    />
                  )}
                  {message.messageType === 'FILE' && message.fileUrl && (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center rounded-lg ${isOwn ? 'text-white hover:text-blue-100' : 'text-gray-800 hover:text-black'}`}
                    >
                      <File className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span className="truncate font-medium">{message.content}</span>
                    </a>
                  )}
                  {message.messageType === 'TEXT' && (
                    <p className={`text-sm ${message.isRequest ? 'text-gray-700' : ''}`}>
                      {message.content}
                    </p>
                  )}
                  
                  {/* Show accept/reject buttons for message requests */}
                  {message.isRequest && !isOwn && (
                    <div className="mt-3 flex space-x-2">
                      <Button
                        onClick={() => handleAcceptRequest(message.requestId!)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(message.requestId!)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 hover:border-red-500 hover:text-red-600 px-3 py-1 text-xs"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-end space-x-1">
                    {isOwn && !message.isRequest && (
                      <span className="text-xs text-blue-200">
                        {message.isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                    {message.isRequest && (
                      <span className="text-xs text-yellow-600 font-medium">
                        Message Request
                      </span>
                    )}
                    <p className={`text-xs mt-1 text-right ${
                      message.isRequest 
                        ? 'text-yellow-600' 
                        : isOwn 
                          ? 'text-blue-100' 
                          : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAttachmentClick}
              disabled={isUploading}
              className="rounded-full w-10 h-10 p-0 text-gray-500"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
            </Button>
            <Input
              value={newMessage}
              onChange={handleTypingChange}
              placeholder="Message..."
              className="flex-1 rounded-full border-gray-300 bg-gray-100 focus:border-blue-500 focus:bg-white"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="rounded-full bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="pl-10 rounded-full bg-gray-100 border-gray-100 focus:bg-white focus:border-blue-500"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push('/student/search')}>
          <Plus className="h-6 w-6 text-blue-500" />
        </Button>
      </div>

      {/* Message Requests */}
      {messageRequests.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Message Requests</h2>
            <span className="text-sm text-gray-500">{messageRequests.length} pending</span>
          </div>
          <div className="space-y-3">
            {messageRequests.map((request) => (
              <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {request.sender.profilePhoto ? (
                      <img 
                        src={request.sender.profilePhoto} 
                        alt={request.sender.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">{request.sender.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{request.sender.name}</h3>
                      <span className="text-xs text-gray-500">{formatTime(request.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 text-sm mb-3">{request.content}</p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(request.id)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 hover:border-red-500 hover:text-red-600 px-4 py-1"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your messages</h3>
            <p className="text-gray-500 mb-4">
              Send private photos and messages to a friend or group.
            </p>
            <Button
              onClick={() => router.push('/student/search')}
              className="bg-blue-500 hover:bg-blue-600 rounded-lg"
            >
              Send Message
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.user.id}
                onClick={() => setSelectedUser(conversation.user)}
                className="p-4 hover:bg-gray-50 cursor-pointer flex items-center"
              >
                <div className="relative mr-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {conversation.user.profilePhoto ? (
                      <img 
                        src={conversation.user.profilePhoto} 
                        alt={conversation.user.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">{conversation.user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {/* Online status indicator */}
                  <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-white"></span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {conversation.user.name}
                  </p>
                  
                  {conversation.latestMessage && (
                    <p className="text-sm text-gray-500 truncate">
                      <span>{conversation.latestMessage.content}</span>
                      <span className="ml-2">{formatTime(conversation.latestMessage.createdAt)}</span>
                    </p>
                  )}
                </div>

                {conversation.unreadCount > 0 && (
                  <div className="ml-4">
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesPageContent />
    </Suspense>
  )
} 