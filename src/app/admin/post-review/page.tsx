'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  Search, 
  Filter, 
  RefreshCw, 
  BarChart3, 
  Users, 
  FileText,
  CheckSquare,
  Square,
  Trash2,
  Flag,
  Shield,
  TrendingUp,
  Calendar,
  Clock as ClockIcon
} from 'lucide-react'

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
}

interface ReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
  flagged: number
}

export default function PostReviewPage() {
  const [pendingPosts, setPendingPosts] = useState<Post[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED'>('PENDING')
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'flag' | null>(null)
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0
  })
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const router = useRouter()

  useEffect(() => {
    fetchAllPosts()
  }, [])

  useEffect(() => {
    updateStats()
  }, [allPosts])

  const fetchAllPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/admin/posts/review', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      setAllPosts(data)
      setPendingPosts(data.filter((post: Post) => post.status === 'PENDING'))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  const updateStats = () => {
    const stats = {
      total: allPosts.length,
      pending: allPosts.filter(post => post.status === 'PENDING').length,
      approved: allPosts.filter(post => post.status === 'APPROVED').length,
      rejected: allPosts.filter(post => post.status === 'REJECTED').length,
      flagged: allPosts.filter(post => post.status === 'FLAGGED').length
    }
    setStats(stats)
  }

  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleReview = async (postId: string, action: 'approve' | 'reject' | 'flag') => {
    setReviewing(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const body: any = { postId, action }
      if (action === 'reject' && rejectionReason.trim()) {
        body.rejectionReason = rejectionReason.trim()
      }

      const response = await fetch('/api/admin/posts/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('Failed to review post')
      }

      const result = await response.json()
      
      // Update the post status in our state
      setAllPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'FLAGGED' }
          : post
      ))
      
      setSelectedPost(null)
      setRejectionReason('')
      setSelectedPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
      
      // Show success message
      showNotification(`Post ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged'} successfully!`, 'success')
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Failed to review post', 'error')
    } finally {
      setReviewing(false)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedPosts.size === 0) return
    
    setReviewing(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const promises = Array.from(selectedPosts).map(postId => 
        handleReview(postId, bulkAction)
      )
      
      await Promise.all(promises)
      setSelectedPosts(new Set())
      setBulkAction(null)
      showNotification(`Bulk ${bulkAction} completed for ${selectedPosts.size} posts!`, 'success')
    } catch (error) {
      showNotification('Bulk action failed', 'error')
    } finally {
      setReviewing(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification - you can replace with a proper toast library
    alert(`${type.toUpperCase()}: ${message}`)
  }

  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const selectAllPosts = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(filteredPosts.map(post => post.id)))
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
        return <Flag className="h-4 w-4 text-orange-500" />
      default:
        return null
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
          <p className="text-gray-600">Loading post review dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Post Review Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage and moderate all posts</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={fetchAllPosts}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                variant="outline"
                size="sm"
              >
                {viewMode === 'list' ? 'Grid View' : 'List View'}
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Posts</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Flagged</p>
                  <p className="text-2xl font-bold">{stats.flagged}</p>
                </div>
                <Flag className="h-8 w-8 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search posts by content, author, or hashtags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="FLAGGED">Flagged</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedPosts.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-blue-800">
                    {selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected
                  </span>
                  <select
                    value={bulkAction || ''}
                    onChange={(e) => setBulkAction(e.target.value as any)}
                    className="border border-blue-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="">Select Action</option>
                    <option value="approve">Approve All</option>
                    <option value="reject">Reject All</option>
                    <option value="flag">Flag All</option>
                  </select>
                  <Button
                    onClick={handleBulkAction}
                    disabled={!bulkAction || reviewing}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {reviewing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => setSelectedPosts(new Set())}
                  variant="outline"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your search or filters'
                : 'No posts available for review'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Posts List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Posts ({filteredPosts.length})
                    </h2>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={selectAllPosts}
                        variant="outline"
                        size="sm"
                      >
                        {selectedPosts.size === filteredPosts.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                      <span className="text-sm text-gray-500">
                        Select All
                      </span>
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedPost?.id === post.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedPosts.has(post.id)}
                          onChange={() => togglePostSelection(post.id)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                        />

                        {/* Author Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
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

                        {/* Post Content */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedPost(post)}>
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="font-semibold text-gray-900">{post.author.name}</p>
                            <span className="text-sm text-gray-500">
                              {format(new Date(post.createdAt), 'MMM d, HH:mm')}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(post.status)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                              {post.status}
                            </span>
                          </div>

                          <p className="text-gray-900 text-sm line-clamp-2">{post.content}</p>
                          
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.hashtags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  #{tag}
                                </span>
                              ))}
                              {post.hashtags.length > 2 && (
                                <span className="text-xs text-gray-500">+{post.hashtags.length - 2} more</span>
                              )}
                            </div>
                          )}

                          {/* Media Indicators */}
                          {(post.imageUrl || post.videoUrl) && (
                            <div className="flex items-center space-x-2 mt-2">
                              {post.imageUrl && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Image
                                </span>
                              )}
                              {post.videoUrl && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Video
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Post Detail & Review Panel */}
            {selectedPost && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Review Post</h2>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                {/* Author Info */}
                <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {selectedPost.author.profilePhoto ? (
                      <img 
                        src={selectedPost.author.profilePhoto} 
                        alt={selectedPost.author.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      selectedPost.author.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedPost.author.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedPost.author.course && selectedPost.author.year 
                        ? `${selectedPost.author.course} - Year ${selectedPost.author.year}`
                        : 'Student'
                      }
                    </p>
                    <p className="text-xs text-gray-400 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(selectedPost.createdAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Content:</h3>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <p className="text-gray-900 whitespace-pre-wrap text-sm">{selectedPost.content}</p>
                  </div>
                </div>

                {/* Media Preview */}
                {selectedPost.imageUrl && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Image:</h3>
                    <img 
                      src={selectedPost.imageUrl} 
                      alt="Post content"
                      className="w-full max-h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {selectedPost.videoUrl && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Video:</h3>
                    <video 
                      src={selectedPost.videoUrl} 
                      controls
                      className="w-full max-h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Hashtags */}
                {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Hashtags:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.hashtags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Quick Actions:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleReview(selectedPost.id, 'approve')}
                      disabled={reviewing}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(selectedPost.id, 'reject')}
                      disabled={reviewing}
                      size="sm"
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleReview(selectedPost.id, 'flag')}
                      disabled={reviewing}
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Flag
                    </Button>
                    <Button
                      onClick={() => setSelectedPost(null)}
                      size="sm"
                      variant="outline"
                    >
                      <EyeOff className="h-4 w-4 mr-1" />
                      Close
                    </Button>
                  </div>
                </div>

                {/* Rejection Reason */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Rejection Reason:</h3>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    className="w-full text-sm"
                  />
                </div>

                {/* Guidelines */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm">Review Guidelines:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>Approve:</strong> Educational content, study tips</li>
                    <li>• <strong>Reject:</strong> Inappropriate content, spam</li>
                    <li>• <strong>Flag:</strong> Needs further review</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
