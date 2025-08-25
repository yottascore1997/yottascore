'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Image, Video, Hash, Loader2, Upload, X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import CommentSection from '@/components/CommentSection'
import StoryBar from '@/components/StoryBar'
import CreateStoryModal from '@/components/CreateStoryModal'
import StoryViewer from '@/components/StoryViewer'
import Link from 'next/link'

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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED'
  rejectionReason?: string
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
  const [pendingPosts, setPendingPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<any>(null)
  const [storyRefreshTrigger, setStoryRefreshTrigger] = useState(0)
  const [newPost, setNewPost] = useState({
    content: '',
    imageUrl: '',
    videoUrl: '',
    hashtags: '',
    isPrivate: false
  })
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null)
  const [showPendingPosts, setShowPendingPosts] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
    fetchPendingPosts()
  }, [])

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

  const fetchPendingPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/student/posts/pending', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPendingPosts(data)
      }
    } catch (error) {
      console.error('Failed to fetch pending posts:', error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        alert('Please select an image file')
      }
    }
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedVideo(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setVideoPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        alert('Please select a video file')
      }
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload file')
    }

    const result = await response.json()
    return result.url
  }

  const resetForm = () => {
    setNewPost({
      content: '',
      imageUrl: '',
      videoUrl: '',
      hashtags: '',
      isPrivate: false
    })
    setSelectedImage(null)
    setSelectedVideo(null)
    setImagePreview(null)
    setVideoPreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      let imageUrl = newPost.imageUrl
      let videoUrl = newPost.videoUrl

      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadFile(selectedImage)
      }

      // Upload video if selected
      if (selectedVideo) {
        videoUrl = await uploadFile(selectedVideo)
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
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          hashtags,
          isPrivate: newPost.isPrivate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      const result = await response.json()
      
      // Show success message
      alert(result.message || 'Post submitted for review!')
      
      setShowCreatePost(false)
      resetForm()
      fetchPosts()
      fetchPendingPosts() // Refresh pending posts
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setUploading(false)
    }
  }

  const handleLikeToggle = async (postId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/student/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Update the post's like status
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                _count: {
                  ...post._count,
                  likes: post.isLiked ? post._count.likes - 1 : post._count.likes + 1
                }
              }
            : post
        ))
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'FLAGGED':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Review'
      case 'APPROVED':
        return 'Approved'
      case 'REJECTED':
        return 'Rejected'
      case 'FLAGGED':
        return 'Flagged for Review'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'FLAGGED':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Feed</h1>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowCreateStory(true)}
                variant="outline"
                size="sm"
              >
                <Image className="h-4 w-4 mr-2" />
                Story
              </Button>
              <Button
                onClick={() => setShowCreatePost(true)}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Posts Notification */}
      {pendingPosts.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    You have {pendingPosts.length} post{pendingPosts.length > 1 ? 's' : ''} pending review
                  </p>
                  <p className="text-xs text-yellow-600">
                    Your posts will be visible once approved by our team
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowPendingPosts(!showPendingPosts)}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                {showPendingPosts ? 'Hide' : 'View'} Pending
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Posts Section */}
      {showPendingPosts && pendingPosts.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Posts</h2>
          <div className="space-y-4">
            {pendingPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {post.author.profilePhoto ? (
                      <img 
                        src={post.author.profilePhoto} 
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      post.author.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="font-semibold text-gray-900">{post.author.name}</p>
                      <span className="text-sm text-gray-500">
                        {format(new Date(post.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center space-x-2 mb-3">
                      {getStatusIcon(post.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                        {getStatusText(post.status)}
                      </span>
                    </div>

                    <p className="text-gray-900 mb-3">{post.content}</p>
                    
                    {post.imageUrl && (
                      <img 
                        src={post.imageUrl} 
                        alt="Post content"
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    {post.videoUrl && (
                      <video 
                        src={post.videoUrl} 
                        controls
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}

                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.hashtags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      <p>⏳ This post is waiting for review. It usually takes 30-60 minutes.</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <StoryBar onStoryClick={setSelectedStoryGroup} refreshTrigger={storyRefreshTrigger} />
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">
              Follow some people or create your first post to see content here.
            </p>
            <Button onClick={() => setShowCreatePost(true)}>
              Create Post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {post.author.profilePhoto ? (
                      <img 
                        src={post.author.profilePhoto} 
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      post.author.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="font-semibold text-gray-900">{post.author.name}</p>
                      <span className="text-sm text-gray-500">
                        {format(new Date(post.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    <p className="text-gray-900 mb-3">{post.content}</p>
                    
                    {post.imageUrl && (
                      <img 
                        src={post.imageUrl} 
                        alt="Post content"
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    {post.videoUrl && (
                      <video 
                        src={post.videoUrl} 
                        controls
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}

                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.hashtags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLikeToggle(post.id)}
                        className={`flex items-center space-x-1 ${
                          post.isLiked ? 'text-red-500' : 'text-gray-500'
                        } hover:text-red-500 transition-colors`}
                      >
                        <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{post._count.likes}</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveCommentSection(activeCommentSection === post.id ? null : post.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm">{post._count.comments}</span>
                      </button>
                      
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm">Share</span>
                      </button>
                      
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-yellow-500 transition-colors">
                        <Bookmark className="h-5 w-5" />
                        <span className="text-sm">Save</span>
                      </button>
                    </div>

                    {activeCommentSection === post.id && (
                      <CommentSection postId={post.id} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Create Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="What's on your mind?"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <Input
                    value={newPost.hashtags}
                    onChange={(e) => setNewPost({ ...newPost, hashtags: e.target.value })}
                    placeholder="Add hashtags (e.g., #study #exam)"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoSelect}
                    accept="video/*"
                    className="hidden"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                </div>
                
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                        if (imageInputRef.current) imageInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {videoPreview && (
                  <div className="relative">
                    <video src={videoPreview} controls className="w-full h-32 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVideo(null)
                        setVideoPreview(null)
                        if (videoInputRef.current) videoInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newPost.isPrivate}
                    onChange={(e) => setNewPost({ ...newPost, isPrivate: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-600">
                    Make this post private
                  </label>
                </div>
                
                <div className="flex space-x-2">
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
                    disabled={uploading || !newPost.content.trim()}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onStoryCreated={() => {
          setStoryRefreshTrigger(prev => prev + 1)
          setShowCreateStory(false)
        }}
      />

      {/* Story Viewer */}
      {selectedStoryGroup && (
        <StoryViewer
          storyGroup={selectedStoryGroup}
          onClose={() => setSelectedStoryGroup(null)}
        />
      )}
    </div>
  )
} 