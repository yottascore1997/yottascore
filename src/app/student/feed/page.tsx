'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Image, Video, Hash, Loader2, Upload, X } from 'lucide-react'
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
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image file size must be less than 5MB')
          return
        }
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
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          alert('Video file size must be less than 50MB')
          return
        }
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

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const removeVideo = () => {
    setSelectedVideo(null)
    setVideoPreview(null)
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
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

    const data = await response.json()
    return data.url
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
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
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

      setShowCreatePost(false)
      resetForm()
      fetchPosts()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setUploading(false)
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

  const handleCommentAdded = () => {
    // Refresh posts to update comment counts
    fetchPosts()
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

      {/* Story Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <StoryBar 
          onAddStory={() => setShowCreateStory(true)}
          onViewStory={(storyGroup) => setSelectedStoryGroup(storyGroup)}
          refreshTrigger={storyRefreshTrigger}
        />
      </div>

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal 
          isOpen={showCreateStory}
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={() => {
            setShowCreateStory(false)
            setStoryRefreshTrigger(prev => prev + 1) // Refresh stories
          }}
        />
      )}

      {/* Story Viewer Modal */}
      {selectedStoryGroup && (
        <StoryViewer
          storyGroup={selectedStoryGroup}
          onClose={() => {
            setSelectedStoryGroup(null)
            setStoryRefreshTrigger(prev => prev + 1) // Refresh stories after viewing
          }}
          onNext={() => {
            // Navigate to next user's stories if available
            setSelectedStoryGroup(null)
            setStoryRefreshTrigger(prev => prev + 1) // Refresh stories
          }}
          onPrevious={() => {
            // Navigate to previous user's stories if available
            setSelectedStoryGroup(null)
            setStoryRefreshTrigger(prev => prev + 1) // Refresh stories
          }}
        />
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreatePost(false)
              resetForm()
            }
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
                <button
                  onClick={() => {
                    setShowCreatePost(false)
                    resetForm()
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreatePost} className="space-y-4">
                {uploading && (
                  <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-600">Uploading files...</span>
                  </div>
                )}
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
                
                {/* Image Upload Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <Image className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      {selectedImage ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate">{selectedImage.name}</span>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="text-left text-gray-500 hover:text-gray-700 w-full"
                        >
                          Upload Image
                        </button>
                      )}
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 px-3">Supported: JPG, PNG, GIF (Max 5MB)</p>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Video Upload Section */}
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <Video className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      {selectedVideo ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate">{selectedVideo.name}</span>
                          <button
                            type="button"
                            onClick={removeVideo}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="text-left text-gray-500 hover:text-gray-700 w-full"
                        >
                          Upload Video
                        </button>
                      )}
                    </div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 px-3">Supported: MP4, AVI, MOV (Max 50MB)</p>
                  
                  {/* Video Preview */}
                  {videoPreview && (
                    <div className="relative">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
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
                    onClick={() => {
                      setShowCreatePost(false)
                      resetForm()
                    }}
                    className="flex-1"
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
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
                {post.videoUrl && (
                  <video 
                    src={post.videoUrl} 
                    controls 
                    className="mt-3 rounded-lg w-full" 
                  />
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
                  <CommentSection 
                    postId={post.id} 
                    initialComments={post.comments}
                    onCommentAdded={handleCommentAdded}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 