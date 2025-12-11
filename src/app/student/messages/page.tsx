'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MessageCircle, Send, ArrowLeft, Plus, Paperclip, Loader2 } from 'lucide-react'
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    // Get current user from JWT token
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          id: payload.userId,
          name: payload.name || 'User',
          profilePhoto: null,
          course: null,
          year: null
        };
        setCurrentUser(user);
      } catch (error) {
        console.error('Error decoding JWT token:', error);
      }
    }

    fetchConversations()
    fetchMessageRequests()
  }, [])

  useEffect(() => {
    if (selectedUser && currentUser) {
      // Clear previous messages when switching users
      setMessages([]);
      
      // Fetch messages for the selected user
      fetchMessages(selectedUser.id)
      
      if (socket && isConnected) {
        const chatId = [currentUser.id, selectedUser.id].sort().join('-');
        socket.emit('join_chat', chatId);
        socket.emit('join_typing_room', chatId);
      }
    }
  }, [selectedUser, currentUser, socket, isConnected])

  // Handle user parameter from URL
  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId && currentUser) {
      const user = conversations.find(conv => conv.user.id === userId)?.user
      if (user) {
        setSelectedUser(user)
      } else {
        fetchUserProfile(userId)
      }
    }
  }, [searchParams, conversations, currentUser])

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

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewMessage = (newMessage: Message) => {
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
      setIsTyping(false)
    }

    const handleMessagesRead = ({ readerId }: { readerId: string }) => {
      if (selectedUser && selectedUser.id === readerId) {
        setMessages(prev =>
          prev.map(msg => 
            msg.sender.id === currentUser?.id ? { ...msg, isRead: true } : msg
          )
        )
      }
    }
    
    socket.on('new_message', handleNewMessage)
    socket.on('messages_were_read', handleMessagesRead)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('messages_were_read', handleMessagesRead)
    }
  }, [socket, isConnected, selectedUser, currentUser])

  // Effect to mark messages as read when a chat is opened
  useEffect(() => {
    if (socket && isConnected && selectedUser && currentUser) {
      const unreadMessages = messages.filter(
        (msg) => msg.receiver.id === currentUser.id && !msg.isRead
      )

      if (unreadMessages.length > 0) {
        const markAsRead = async () => {
          try {
            const token = localStorage.getItem('token')
            await fetch('/api/student/messages/read', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ otherUserId: selectedUser.id }),
            })

            socket.emit('notify_messages_read', { 
              readerId: currentUser.id,
              otherUserId: selectedUser.id 
            })

            setMessages(prev => 
              prev.map(msg => 
                msg.receiver.id === currentUser.id ? { ...msg, isRead: true } : msg
              )
            )

          } catch (error) {
            console.error("Failed to mark messages as read", error)
          }
        }
        markAsRead()
      }
    }
  }, [selectedUser, messages, socket, isConnected])

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

      console.log('🔍 Fetching messages for user:', userId);

      const response = await fetch(`/api/student/messages/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json()
        console.log('📨 Fetched messages data:', data);
        console.log('📨 Data type:', typeof data);
        console.log('📨 Is array:', Array.isArray(data));
        console.log('📨 Data length:', data?.length);
        
        if (data && Array.isArray(data)) {
          console.log('📨 Processing array of messages...');
          
          // Sort messages by creation time (oldest first)
          const sortedMessages: Message[] = [...data].sort((a: Message, b: Message) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          console.log('📨 Sorted messages:', sortedMessages.map((m: Message) => ({
            id: m.id,
            content: m.content.substring(0, 30),
            sender: m.sender.name,
            receiver: m.receiver.name,
            createdAt: m.createdAt
          })));
          
          setMessages(sortedMessages);
          
          if (data.length === 0) {
            console.log('📨 No messages found, checking for pending requests...');
            const pendingRequest = messageRequests.find(req => 
              req.sender.id === userId && req.status === 'PENDING'
            )
            if (pendingRequest) {
              console.log('📨 Found pending request:', pendingRequest);
              setMessages([{
                id: `request-${pendingRequest.id}`,
                content: pendingRequest.content,
                messageType: pendingRequest.messageType,
                fileUrl: pendingRequest.fileUrl,
                isRead: false,
                createdAt: pendingRequest.createdAt,
                sender: pendingRequest.sender,
                receiver: pendingRequest.receiver,
                isRequest: true,
                requestId: pendingRequest.id
              }])
            } else {
              console.log('📨 No pending requests either, setting empty messages');
              setMessages([]);
            }
          }
        } else {
          console.log('❌ No messages data or not an array');
          console.log('❌ Data:', data);
          setMessages([]);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Response not ok:', response.status);
        console.log('❌ Error text:', errorText);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      setMessages([]);
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
        setMessageRequests(prev => prev.filter(req => req.id !== requestId))
        fetchConversations()
        
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
        setMessageRequests(prev => prev.filter(req => req.id !== requestId))
        setMessages(prev => prev.filter(msg => msg.requestId !== requestId))
      }
    } catch (error) {
      console.error('Error rejecting message request:', error)
    }
  }

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim() || !currentUser) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    // Create optimistic message for immediate display
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content,
      messageType: 'TEXT',
      fileUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      receiver: selectedUser,
    }

    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const token = localStorage.getItem('token')
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
        const errorText = await response.text();
        console.error('Server error response:', response.status, errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }
      
      const result = await response.json()
      console.log('Message API response:', result);

      if (result.type === 'direct') {
        // Replace optimistic message with real message from server
        if (result.message) {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id ? result.message : msg
          ))
        }
        
        // Update conversations list
        fetchConversations();
        
        // Emit socket event for real-time delivery
        if (socket && isConnected) {
          const chatId = [currentUser.id, selectedUser.id].sort().join('-');
          socket.emit('private_message', { message: result.message || optimisticMessage });
        }
        
      } else if (result.type === 'request') {
        // Remove optimistic message since it was sent as request
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
        
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
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      setNewMessage(content)
      
      if (error instanceof Error) {
        if (error.message.includes('follow')) {
          alert('You need to follow this user first before you can message them. Please go to their profile and follow them.')
        } else {
          alert(`Message failed to send: ${error.message}`)
        }
      } else {
        alert('Message failed to send. Please try again.')
      }
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
    }, 2000)
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    // Validate file type
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      // Documents
      'application/pdf',
      // Excel
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.oasis.opendocument.spreadsheet' // .ods
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed types: Images (JPEG, PNG, GIF, WebP), PDF, and Excel files.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Uploading file:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Upload-Token': token
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('📥 Upload result:', result);
      
      if (result.success && result.url) {
        // Create optimistic file message for immediate display
        const optimisticMessage: Message = {
          id: `temp-file-${Date.now()}`,
          content: file.name,
          messageType: file.type.startsWith('image/') ? 'IMAGE' 
            : file.type === 'application/pdf' ? 'PDF'
            : (file.type === 'application/vnd.ms-excel' || 
               file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
               file.type === 'application/vnd.oasis.opendocument.spreadsheet') ? 'EXCEL'
            : 'FILE',
          fileUrl: result.url,
          isRead: false,
          createdAt: new Date().toISOString(),
          sender: currentUser!,
          receiver: selectedUser,
        }

        // Add optimistic message to UI immediately
        setMessages(prev => [...prev, optimisticMessage])

        // Send file message
        const token = localStorage.getItem('token');
        const messageResponse = await fetch('/api/student/messages', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            receiverId: selectedUser.id,
            content: file.name,
            messageType: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
            fileUrl: result.url,
          }),
        });

        if (messageResponse.ok) {
          const savedMessage = await messageResponse.json();
          
          // Replace optimistic message with real message from server
          if (savedMessage.message) {
            setMessages(prev => prev.map(msg => 
              msg.id === optimisticMessage.id ? savedMessage.message : msg
            ))
          }
          
          // Update conversations list
          fetchConversations();
          
          // Emit socket event for real-time delivery
          if (socket && isConnected && currentUser) {
            const chatId = [currentUser.id, selectedUser.id].sort().join('-');
            socket.emit('private_message', { message: savedMessage.message || optimisticMessage });
          }
        } else {
          // Remove optimistic message on error
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
          throw new Error('Failed to save file message');
        }
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

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h ago`
    } else {
      // For messages older than 24 hours, show time
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white"></span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">
                  {isTyping ? 'typing...' : 'Online'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation by sending a message!</p>
            </div>
          ) : (
            // Group messages by date
            Object.entries(
              messages.reduce<{ [key: string]: Message[] }>((groups, message) => {
                const date = new Date(message.createdAt);
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                let dateKey = '';
                
                if (date.toDateString() === today.toDateString()) {
                  dateKey = 'Today';
                } else if (date.toDateString() === yesterday.toDateString()) {
                  dateKey = 'Yesterday';
                } else {
                  // For older messages, group by date
                  dateKey = date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                }

                if (!groups[dateKey]) {
                  groups[dateKey] = [];
                }
                groups[dateKey].push(message);
                return groups;
              }, {})
            ).map(([dateKey, groupMessages]) => (
              <div key={dateKey} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center justify-center">
                  <div className="bg-gray-100 rounded-full px-4 py-1">
                    <span className="text-sm text-gray-500">{dateKey}</span>
                  </div>
                </div>

                {/* Messages for this date */}
                {groupMessages.map((message, index) => {
                  const isOwn = message.sender.id !== selectedUser.id;
                  return (
                <div
                  key={message.id || index}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-900'
                  }`}>
                    {message.fileUrl ? (
                      message.messageType === 'IMAGE' ? (
                        // Image preview
                        <img 
                          src={message.fileUrl} 
                          alt="Image" 
                          className="max-w-full h-auto rounded"
                        />
                      ) : message.messageType === 'PDF' ? (
                        // PDF file link with icon
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4v12h12V4H4zm11 11H5V5h10v10z"/>
                            <path d="M7 7h6v2H7zM7 11h6v2H7z"/>
                          </svg>
                          <a 
                            href={message.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {message.content} (PDF)
                          </a>
                        </div>
                      ) : message.messageType === 'EXCEL' ? (
                        // Excel file link with icon
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4v12h12V4H4zm11 11H5V5h10v10z"/>
                            <path d="M7 8h6v1H7zM7 10h6v1H7zM7 12h6v1H7z"/>
                          </svg>
                          <a 
                            href={message.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {message.content} (Excel)
                          </a>
                        </div>
                      ) : (
                        // Default file link
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4" />
                          <a 
                            href={message.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {message.content}
                          </a>
                        </div>
                      )
                    ) : (
                      <p>{message.content}</p>
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
                  </div>
                </div>
              )
                })}
              </div>
            ))
          )}
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
              accept="image/*,.pdf,.xls,.xlsx,.ods"
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAttachmentClick}
              disabled={isUploading}
              className="rounded-full w-10 h-10 p-0 text-gray-500 hover:bg-gray-100"
              title="Attach file"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
            </Button>
            
            <Input
              value={newMessage}
              onChange={handleTypingChange}
              placeholder="Type a message..."
              className="flex-1 rounded-full border-gray-300 bg-gray-100 focus:border-blue-500 focus:bg-white"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              onKeyDown={(e) => e.key === 'Enter' && e.shiftKey && setNewMessage(prev => prev + '\n')}
            />
            
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="rounded-full bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 p-0 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <div className="flex space-x-1 mr-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              {selectedUser?.name} is typing...
            </div>
          )}
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
                 <div className="flex space-x-2">
           <Button variant="ghost" size="icon" onClick={() => router.push('/student/search')}>
             <Plus className="h-6 w-6 text-blue-500" />
           </Button>
                       {selectedUser ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token')
                      const response = await fetch(`/api/debug/follow-status?otherUserId=${(selectedUser as User)?.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      })
                      if (response.ok) {
                        const data = await response.json()
                        console.log('Follow Status Debug:', data)
                        alert(`Follow Status:\nFollow: ${data.follow ? 'Yes' : 'No'}\nRequest: ${data.followRequest?.status || 'None'}\nMessages: ${data.messageCount}`)
                      }
                    } catch (error) {
                      console.error('Debug error:', error)
                    }
                  }}
                  className="text-xs"
                >
                  Debug
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token')
                      console.log('🔍 Testing API directly for user:', (selectedUser as User)?.id);
                      const response = await fetch(`/api/student/messages/${(selectedUser as User)?.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      })
                      console.log('📡 Direct API Response status:', response.status);
                      if (response.ok) {
                        const data = await response.json()
                        console.log('📨 Direct API Response data:', data);
                        alert(`Direct API Test:\nStatus: ${response.status}\nMessages: ${data?.length || 0}\nData: ${JSON.stringify(data, null, 2)}`)
                      } else {
                        const errorText = await response.text();
                        alert(`Direct API Error:\nStatus: ${response.status}\nError: ${errorText}`)
                      }
                    } catch (error) {
                      console.error('Direct API test error:', error)
                      alert(`Direct API Test Error: ${error}`)
                    }
                  }}
                  className="text-xs bg-red-100"
                >
                  Test API
                </Button>
              </>
            ) : null}
         </div>
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
                 onClick={() => {
                   console.log('Clicked on conversation with user:', conversation.user);
                   setSelectedUser(conversation.user);
                 }}
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