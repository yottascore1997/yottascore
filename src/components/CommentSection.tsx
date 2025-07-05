'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { Send, Heart, Reply, MoreHorizontal, User } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    profilePhoto?: string
  }
  _count?: {
    _all: number
  }
}

interface CommentSectionProps {
  postId: string
  initialComments?: Comment[]
  onCommentAdded?: () => void
}

export default function CommentSection({ postId, initialComments = [], onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  // Fetch comments when component mounts
  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/posts/${postId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch comments:', response.status, response.statusText)
        // Keep existing comments if any, don't clear them
        return
      }

      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
      // Keep existing comments if any, don't clear them
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const newCommentData = await response.json()
      setComments(prev => [newCommentData, ...prev])
      setNewComment('')
      onCommentAdded?.()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const displayedComments = showAllComments ? comments : comments.slice(0, 3)

  return (
    <div className="border-t border-gray-100">
      {/* Comment Input */}
      <div className="p-4">
        <form onSubmit={handleSubmitComment} className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border-0 bg-gray-50 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white"
            disabled={submitting}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || submitting}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full p-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">Loading comments...</span>
          </div>
        </div>
      ) : comments.length > 0 ? (
        <div className="px-4 pb-4">
          {/* Show more comments button */}
          {comments.length > 3 && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-sm text-gray-500 hover:text-gray-700 mb-3"
            >
              View all {comments.length} comments
            </button>
          )}

          {/* Comments */}
          <div className="space-y-3">
            {displayedComments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Link href={`/student/profile?userId=${comment.user.id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    {comment.user.profilePhoto ? (
                      <img
                        src={comment.user.profilePhoto}
                        alt={comment.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-semibold">
                        {comment.user.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl px-3 py-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link href={`/student/profile?userId=${comment.user.id}`}>
                        <span className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                          {comment.user.name}
                        </span>
                      </Link>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 ml-2">
                    <button className="text-xs text-gray-500 hover:text-red-500 flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>Like</span>
                    </button>
                    <button className="text-xs text-gray-500 hover:text-blue-500 flex items-center space-x-1">
                      <Reply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Show less button */}
          {showAllComments && comments.length > 3 && (
            <button
              onClick={() => setShowAllComments(false)}
              className="text-sm text-gray-500 hover:text-gray-700 mt-3"
            >
              Show less
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="text-center py-4">
            <span className="text-sm text-gray-500">No comments yet. Be the first to comment!</span>
          </div>
        </div>
      )}
    </div>
  )
} 