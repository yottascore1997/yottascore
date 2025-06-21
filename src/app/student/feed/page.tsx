'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Image, Video, Hash, Loader2 } from 'lucide-react'
import CommentSection from '@/components/CommentSection'
import Link from 'next/link'
import { useSocket } from '@/hooks/useSocket'

interface PostAuthor {
  id: string
  name: string
  profilePhoto: string | null
  course?: string
  year?: string
}

interface Post {
  id: string
  content: string
  imageUrl: string | null
  videoUrl?: string
  hashtags: string[]
  createdAt: string
  author: PostAuthor
  likes: any[]
  comments: any[]
  _count: {
    likes: number
    comments: number
  }
  isLiked: boolean
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPost, setNewPost] = useState({
    content: '',
    imageUrl: '',
    videoUrl: '',
    hashtags: '',
    isPrivate: false
  })
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null)
  const router = useRouter()

  // Initialize socket connection
  const { registerUser } = useSocket()

  useEffect(() => {
    fetchPosts()
    
    // Register user with socket
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.userId) {
          registerUser(payload.userId)
        }
      } catch (error) {
        console.error('Error decoding token:', error)
      }
    }
  }, [registerUser])

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/posts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      setPosts(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const hashtags = newPost.hashtags
        .split(' ')
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.slice(1))

      const response = await fetch('/api/student/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newPost.content,
          imageUrl: newPost.imageUrl || undefined,
          videoUrl: newPost.videoUrl || undefined,
          hashtags,
          isPrivate: newPost.isPrivate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      setShowCreatePost(false)
      setNewPost({
        content: '',
        imageUrl: '',
        videoUrl: '',
        hashtags: '',
        isPrivate: false
      })
      fetchPosts()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create post')
    }
  }

  const handleLikeToggle = async (postId: string) => {
    const originalPosts = [...posts]
    
    // Optimistic UI update
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          _count: { ...p._count, likes: p.isLiked ? p._count.likes - 1 : p._count.likes + 1 }
        }
      }
      return p
    }))

    try {
      const post = originalPosts.find(p => p.id === postId)
      if (!post) return

      const token = localStorage.getItem('token')
      const method = post.isLiked ? 'DELETE' : 'POST'
      
      const response = await fetch(`/api/student/posts/${postId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        // If API call fails, revert the optimistic update
        setPosts(originalPosts)
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      setPosts(originalPosts)
    }
  }

  const toggleCommentSection = (postId: string) => {
    setActiveCommentSection(prev => (prev === postId ? null : postId))
  }

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + "y"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + "mo"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + "d"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + "h"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + "m"
    return Math.floor(seconds) + "s"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Create Post Button */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <Button 
          onClick={() => setShowCreatePost(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl py-3"
        >
          <Send className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="What's on your mind?"
                    rows={4}
                    className="border-0 resize-none focus:ring-0 text-lg"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <Image className="w-5 h-5 text-gray-500" />
                    <Input
                      value={newPost.imageUrl}
                      onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                      placeholder="Add image URL"
                      className="border-0 bg-transparent focus:ring-0"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <Video className="w-5 h-5 text-gray-500" />
                    <Input
                      value={newPost.videoUrl}
                      onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                      placeholder="Add video URL"
                      className="border-0 bg-transparent focus:ring-0"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <Hash className="w-5 h-5 text-gray-500" />
                    <Input
                      value={newPost.hashtags}
                      onChange={(e) => setNewPost({ ...newPost, hashtags: e.target.value })}
                      placeholder="Add hashtags #study #exam"
                      className="border-0 bg-transparent focus:ring-0"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newPost.isPrivate}
                    onChange={(e) => setNewPost({ ...newPost, isPrivate: e.target.checked })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-600">
                    Private post
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreatePost(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Post
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4 px-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">Be the first to share something with your study community!</p>
          </div>
        ) : (
          posts.map((post: Post) => (
            <div className="bg-white rounded-lg shadow-md mb-6">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <Link href={`/student/profile?userId=${post.author.id}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      {post.author.profilePhoto ? (
                        <img
                          src={post.author.profilePhoto}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {post.author.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                        {post.author.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {post.author.course} • {post.author.year}
                      </p>
                      <p className="text-xs text-gray-400">
                        {timeSince(post.createdAt)}
                      </p>
                    </div>
                  </Link>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </div>
  
              {/* Post Content */}
              <div className="px-4 pb-4">
                <p className="text-gray-800">{post.content}</p>
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Post content" className="mt-3 rounded-lg w-full" />
                )}
              </div>
  
              {/* Post Actions */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLikeToggle(post.id)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Heart className={`w-6 h-6 ${post.isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{post._count.likes}</span>
                  </button>
                  <button
                    onClick={() => toggleCommentSection(post.id)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className={`w-6 h-6 ${activeCommentSection === post.id ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{post._count.comments}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
                <button className="text-gray-500 hover:text-gray-700">
                  <Bookmark className="w-6 h-6" />
                </button>
              </div>
              {/* Comment Section */}
              {activeCommentSection === post.id && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <CommentSection postId={post.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 