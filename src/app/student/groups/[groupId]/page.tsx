'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Heart, MessageCircle, Share2, Send, Paperclip } from 'lucide-react'

interface GroupPost {
  id: string
  content: string
  imageUrl?: string
  videoUrl?: string
  fileUrl?: string
  createdAt: string
  author: {
    id: string
    name: string
    profilePhoto?: string
  }
  _count: {
    likes: number
    comments: number
  }
}

interface GroupMessage {
  id: string
  content: string
  messageType: string
  fileUrl?: string
  createdAt: string
  sender: {
    id: string
    name: string
    profilePhoto?: string
  }
}

export default function GroupDetailPage() {
  const [group, setGroup] = useState<any>(null)
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'chat' | 'events'>('posts')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [newPost, setNewPost] = useState({
    content: '',
    imageUrl: '',
    videoUrl: '',
    fileUrl: ''
  })
  const [newMessage, setNewMessage] = useState('')
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    eventType: 'STUDY_SESSION',
    maxParticipants: ''
  })
  const [creating, setCreating] = useState(false)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails()
      fetchGroupPosts()
      fetchGroupMessages()
      fetchGroupEvents()
    }
  }, [groupId])

  const fetchGroupDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch group details')
      }

      const data = await response.json()
      setGroup(data)
    } catch (error) {
      console.error('Error fetching group details:', error)
    }
  }

  const fetchGroupPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/groups/${groupId}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch group posts')
      }

      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('Error fetching group posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/groups/${groupId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch group messages')
      }

      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching group messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupEvents = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/groups/${groupId}/events`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch group events')
      }

      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching group events:', error)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/groups/${groupId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newPost)
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      setShowCreatePost(false)
      setNewPost({
        content: '',
        imageUrl: '',
        videoUrl: '',
        fileUrl: ''
      })
      
      fetchGroupPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setCreating(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newMessage,
          messageType: 'TEXT'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setNewMessage('')
      fetchGroupMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingEvent(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/groups/${groupId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newEvent,
          maxParticipants: newEvent.maxParticipants ? parseInt(newEvent.maxParticipants) : null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      setShowCreateEvent(false)
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        eventType: 'STUDY_SESSION',
        maxParticipants: ''
      })
      
      fetchGroupEvents()
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    } finally {
      setCreatingEvent(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (!group) {
    return <div className="p-4">Group not found</div>
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Group Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          {group.imageUrl ? (
            <img
              src={group.imageUrl}
              alt={group.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-2xl">
                {group.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-gray-600">{group.description}</p>
            <p className="text-sm text-gray-500">
              Created by {group.creator?.name} • {group._count?.members || 0} members
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'posts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'events'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Events
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Chat
        </button>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Group Posts</h2>
            <Button onClick={() => setShowCreatePost(true)}>Create Post</Button>
          </div>

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No posts yet</p>
                <p className="text-sm">Be the first to share something in this group!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      {post.author.profilePhoto ? (
                        <img
                          src={post.author.profilePhoto}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {post.author.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{post.author.name}</h3>
                      <p className="text-xs text-gray-500">
                        {format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 mb-3">{post.content}</p>
                  
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post image"
                      className="w-full rounded-lg mb-3"
                    />
                  )}
                  
                  {post.videoUrl && (
                    <video
                      src={post.videoUrl}
                      controls
                      className="w-full rounded-lg mb-3"
                    />
                  )}
                  
                  {post.fileUrl && (
                    <div className="mb-3">
                      <a
                        href={post.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <Paperclip className="w-4 h-4" />
                        <span>Download File</span>
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>❤️ {post._count.likes}</span>
                    <span>💬 {post._count.comments}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Group Events</h2>
            <Button onClick={() => setShowCreateEvent(true)}>Create Event</Button>
          </div>

          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No events scheduled</p>
                <p className="text-sm">Create a study session or event to get started!</p>
              </div>
            ) : (
              events.map((event: any) => (
                <div key={event.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.eventType === 'STUDY_SESSION' ? 'bg-blue-100 text-blue-800' :
                      event.eventType === 'QUIZ' ? 'bg-green-100 text-green-800' :
                      event.eventType === 'DISCUSSION' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.eventType.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-700 mb-3">{event.description}</p>
                  )}
                  
                  {event.location && (
                    <p className="text-sm text-gray-600 mb-3">
                      📍 {event.location}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>👥 {event._count.participants} attending</span>
                      {event.maxParticipants && (
                        <span>Max: {event.maxParticipants}</span>
                      )}
                    </div>
                    <Button size="sm">Join Event</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Group Chat</h2>
          </div>
          
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    {message.sender.profilePhoto ? (
                      <img
                        src={message.sender.profilePhoto}
                        alt={message.sender.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-gray-600 text-sm font-semibold">
                        {message.sender.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm">{message.sender.name}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.createdAt), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-gray-800">{message.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={creating}
              />
              <Button type="submit" disabled={creating || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Create Group Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share something with your group..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <Input
                  value={newPost.imageUrl}
                  onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Video URL</label>
                <Input
                  value={newPost.videoUrl}
                  onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">File URL (Study Material)</label>
                <Input
                  value={newPost.fileUrl}
                  onChange={(e) => setNewPost({ ...newPost, fileUrl: e.target.value })}
                  placeholder="https://example.com/notes.pdf"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreatePost(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Post'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Create Group Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Title *</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g., Calculus Study Session"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Describe what this event is about..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time *</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time *</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location/Meeting Link</label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Room 101 or Zoom link"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Event Type</label>
                <select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="STUDY_SESSION">Study Session</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="DISCUSSION">Discussion</option>
                  <option value="PRESENTATION">Presentation</option>
                  <option value="EXAM_PREP">Exam Prep</option>
                  <option value="SOCIAL">Social</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Participants</label>
                <Input
                  type="number"
                  value={newEvent.maxParticipants}
                  onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateEvent(false)}
                  disabled={creatingEvent}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingEvent}>
                  {creatingEvent ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 