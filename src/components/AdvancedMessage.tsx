'use client'

import { useState, useRef, useEffect } from 'react'
import { Message, ReactionType, REACTION_EMOJIS, REACTION_COLORS, User } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Reply, 
  Forward, 
  Pin, 
  Edit, 
  Trash2,
  Download,
  Play,
  Pause,
  Volume2,
  FileText,
  MapPin,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AdvancedMessageProps {
  message: Message
  currentUser: User
  onReply: (message: Message) => void
  onReaction: (messageId: string, reactionType: ReactionType) => void
  onForward: (message: Message) => void
  onPin: (messageId: string) => void
  onEdit: (messageId: string, newContent: string) => void
  onDelete: (messageId: string) => void
  isReplyingTo?: Message | null
}

export default function AdvancedMessage({
  message,
  currentUser,
  onReply,
  onReaction,
  onForward,
  onPin,
  onEdit,
  onDelete,
  isReplyingTo
}: AdvancedMessageProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (messageId: string) => {
    setShowDeleteModal(true)
  }

  const handleDeleteForMe = async () => {
    if (!message.id) return
    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const payload = { messageId: message.id, deleteType: 'for_me' }
      console.log('Message object:', message)
      console.log('Message ID type:', typeof message.id, 'Value:', message.id)
      console.log('Sending payload:', payload)
      console.log('Payload JSON:', JSON.stringify(payload))
      
      const response = await fetch(`/api/student/messages/delete-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowDeleteModal(false)
        onDelete(message.id)
      } else {
        alert('Failed to delete message')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteForEveryone = async () => {
    if (!message.id) return
    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const payload = { messageId: message.id, deleteType: 'for_everyone' }
      console.log('Sending payload:', payload) // Debug log
      
      const response = await fetch(`/api/student/messages/delete-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowDeleteModal(false)
        onDelete(message.id)
      } else {
        alert('Failed to delete message')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    } finally {
      setDeleting(false)
    }
  }

  // Safety check - if message is invalid, render nothing
  if (!message || !message.sender || !currentUser) {
    return (
      <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-sm text-red-700">Invalid message data</p>
      </div>
    )
  }

  const [showReactions, setShowReactions] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content || '')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)

  const isOwnMessage = message.sender && message.sender.id === currentUser.id
  const hasReactions = message.reactions && message.reactions.length > 0

  // Handle click outside to close options
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle audio progress
  useEffect(() => {
    if (audioRef.current && message.messageType === 'AUDIO') {
      const audio = audioRef.current
      const updateProgress = () => {
        setAudioProgress((audio.currentTime / audio.duration) * 100)
      }
      audio.addEventListener('timeupdate', updateProgress)
      return () => audio.removeEventListener('timeupdate', updateProgress)
    }
  }, [message.messageType])

  const handleReaction = (reactionType: ReactionType) => {
    if (message.id) {
      onReaction(message.id, reactionType)
      setShowReactions(false)
    }
  }

  const handleEdit = () => {
    if (message.id && editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent)
      setIsEditing(false)
    }
  }

  const handleAudioToggle = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'IMAGE':
        return (
          <div className="relative group">
            {message.fileUrl ? (
              <>
                <img 
                  src={message.fileUrl} 
                  alt={message.content || 'Image'}
                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </>
            ) : (
              <div className="max-w-xs rounded-lg bg-gray-200 p-8 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Image not available</p>
              </div>
            )}
          </div>
        )
      
      case 'VIDEO':
        return (
          <div className="relative">
            {message.fileUrl ? (
              <>
                <video 
                  src={message.fileUrl} 
                  controls
                  className="max-w-xs rounded-lg"
                  poster={message.fileUrl}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                  <VideoIcon className="w-4 h-4 text-white" />
                </div>
              </>
            ) : (
              <div className="max-w-xs rounded-lg bg-gray-200 p-8 text-center">
                <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Video not available</p>
              </div>
            )}
          </div>
        )
      
      case 'AUDIO':
        return (
          <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-3 min-w-[200px]">
            {message.fileUrl ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAudioToggle}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                </div>
                <Volume2 className="w-4 h-4 text-gray-500" />
                <audio ref={audioRef} src={message.fileUrl} />
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <MusicIcon className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-500">Audio not available</p>
              </div>
            )}
          </div>
        )
      
      case 'DOCUMENT':
      case 'FILE':
        return (
          <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-3 min-w-[250px]">
            {message.fileUrl ? (
              <>
                <FileText className="w-8 h-8 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{message.fileName || 'Document'}</p>
                  <p className="text-xs text-gray-500">
                    {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
                  className="w-8 h-8 p-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-500">File not available</p>
              </div>
            )}
          </div>
        )
      
      case 'LOCATION':
        return (
          <div className="bg-gray-100 rounded-lg p-3 min-w-[250px]">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="text-sm text-gray-700">{message.content || 'No location data'}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => message.content && window.open(`https://maps.google.com/?q=${encodeURIComponent(message.content)}`, '_blank')}
            >
              Open in Maps
            </Button>
          </div>
        )
      
      default:
        return (
          <p className={`text-sm ${message.isDeleted ? 'italic text-gray-500' : 'text-gray-900'}`}>
            {message.isDeleted ? 'This message was deleted' : (message.content || 'No content')}
            {message.isEdited && !message.isDeleted && (
              <span className="text-xs text-gray-500 ml-2">(edited)</span>
            )}
          </p>
        )
    }
  }

  const renderReactions = () => {
    if (!hasReactions) return null

    const reactionCounts = (message.reactions || []).reduce((acc, reaction) => {
      acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1
      return acc
    }, {} as Record<ReactionType, number>)

    return (
      <div className="flex items-center space-x-1 mt-2">
        {Object.entries(reactionCounts).map(([type, count]) => (
          <div
            key={type}
            className={`${REACTION_COLORS[type as ReactionType]} text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1`}
          >
            <span>{REACTION_EMOJIS[type as ReactionType]}</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`group relative ${isOwnMessage ? 'ml-auto' : 'mr-auto'} max-w-[70%] mb-4`}>
      {/* Reply Preview */}
      {message.replyTo && message.replyTo.sender && (
        <div className={`mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500 ${isOwnMessage ? 'ml-4' : 'mr-4'}`}>
          <p className="text-xs text-gray-500 mb-1">
            Replying to {message.replyTo.sender?.name || 'Unknown user'}
          </p>
          <p className="text-sm text-gray-700 truncate">
            {message.replyTo.content || 'No content'}
          </p>
        </div>
      )}

      {/* Forwarded Message Header */}
      {message.isForwarded && message.originalSender && (
        <div className="mb-2 text-xs text-gray-500 flex items-center space-x-1">
          <Forward className="w-3 h-3" />
          <span>Forwarded from {message.originalSender?.name || 'Unknown user'}</span>
        </div>
      )}

      {/* Main Message */}
      <div className={`relative ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
        {/* Message Options */}
        <div className="absolute top-2 right-2 opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowOptions(!showOptions)}
            className={`w-6 h-6 p-0 ${isOwnMessage ? 'text-white hover:bg-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Options Menu */}
        {showOptions && (
          <div 
            ref={optionsRef}
            className={`absolute top-10 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px] ${isOwnMessage ? 'right-0' : 'left-0'}`}
          >
            <div className="p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(message)}
                className="w-full justify-start text-sm"
              >
                <Reply className="w-4 h-4 mr-2" />
                Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onForward(message)}
                className="w-full justify-start text-sm"
              >
                <Forward className="w-4 h-4 mr-2" />
                Forward
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => message.id && onPin(message.id)}
                className="w-full justify-start text-sm"
              >
                <Pin className="w-4 h-4 mr-2" />
                Pin
              </Button>
              {isOwnMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="w-full justify-start text-sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(message.id)}
                className="w-full justify-start text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Message Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 resize-none"
              rows={3}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleEdit} className="bg-blue-500 hover:bg-blue-600">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          renderMessageContent()
        )}

        {/* Message Footer */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className={isOwnMessage ? 'text-blue-100' : 'text-gray-500'}>
            {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'Just now'}
          </span>
          
          {/* Read Receipt */}
          {isOwnMessage && (
            <div className="flex items-center space-x-1">
              {message.isRead ? (
                <span className="text-blue-200">✓✓</span>
              ) : (
                <span className="text-blue-200">✓</span>
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        {renderReactions()}
      </div>

      {/* Reaction Picker */}
      {showReactions && (
        <div className={`absolute bottom-12 ${isOwnMessage ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10`}>
          <div className="grid grid-cols-5 gap-1">
            {Object.values(ReactionType).map((type) => (
              <Button
                key={type}
                size="sm"
                variant="ghost"
                onClick={() => handleReaction(type)}
                className="w-8 h-8 p-0 text-lg hover:scale-110 transition-transform"
              >
                {REACTION_EMOJIS[type]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex items-center space-x-2 mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowReactions(!showReactions)}
          className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700"
        >
          <Heart className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onReply(message)}
          className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700"
        >
          <Reply className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onForward(message)}
          className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700"
        >
          <Forward className="w-4 h-4" />
        </Button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Message</h3>
            
            <div className="space-y-3">
              <Button
                onClick={handleDeleteForMe}
                disabled={deleting}
                variant="outline"
                className="w-full justify-start"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete for Me
                <span className="text-xs text-gray-500 ml-2">(Only you won't see this message)</span>
              </Button>
              
              <Button
                onClick={handleDeleteForEveryone}
                disabled={deleting}
                className="w-full justify-start bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete for Everyone
                <span className="text-xs text-gray-300 ml-2">(Everyone will see "This message was deleted")</span>
              </Button>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
