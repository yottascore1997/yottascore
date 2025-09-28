'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, Calendar, User, 
  TrendingUp, Heart, MessageSquare, MoreVertical, Copy, ExternalLink,
  BarChart3, Clock, Tag, Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'

interface Blog {
  id: string
  title: string
  excerpt: string | null
  imageUrl: string | null
  author: string
  published: boolean
  publishedAt: string | null
  createdAt: string
  tags: string
  views: number
  likes: number
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchBlogs()
  }, [statusFilter])

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/admin/blogs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBlogs(data.blogs)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        setBlogs(blogs.filter(blog => blog.id !== id))
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
    }
  }

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const blog = blogs.find(b => b.id === id)
      if (!blog) return

      const response = await fetch(`/api/admin/blogs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...blog,
          published: !currentStatus
        })
      })

      if (response.ok) {
        fetchBlogs()
      }
    } catch (error) {
      console.error('Error toggling publish status:', error)
    }
  }

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (blog.excerpt && blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (blog.tags && blog.tags.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'views':
        return b.views - a.views
      case 'likes':
        return b.likes - a.likes
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const toggleBlogSelection = (blogId: string) => {
    setSelectedBlogs(prev => 
      prev.includes(blogId) 
        ? prev.filter(id => id !== blogId)
        : [...prev, blogId]
    )
  }

  const selectAllBlogs = () => {
    setSelectedBlogs(sortedBlogs.map(blog => blog.id))
  }

  const clearSelection = () => {
    setSelectedBlogs([])
  }

  const bulkPublish = async () => {
    if (selectedBlogs.length === 0) return
    
    try {
      const token = localStorage.getItem('token')
      for (const blogId of selectedBlogs) {
        const blog = blogs.find(b => b.id === blogId)
        if (blog) {
          await fetch(`/api/admin/blogs/${blogId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              ...blog,
              published: true
            })
          })
        }
      }
      fetchBlogs()
      clearSelection()
    } catch (error) {
      console.error('Error bulk publishing:', error)
    }
  }

  const bulkUnpublish = async () => {
    if (selectedBlogs.length === 0) return
    
    try {
      const token = localStorage.getItem('token')
      for (const blogId of selectedBlogs) {
        const blog = blogs.find(b => b.id === blogId)
        if (blog) {
          await fetch(`/api/admin/blogs/${blogId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              ...blog,
              published: false
            })
          })
        }
      }
      fetchBlogs()
      clearSelection()
    } catch (error) {
      console.error('Error bulk unpublishing:', error)
    }
  }

  const bulkDelete = async () => {
    if (selectedBlogs.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedBlogs.length} blog(s)?`)) return
    
    try {
      const token = localStorage.getItem('token')
      for (const blogId of selectedBlogs) {
        await fetch(`/api/admin/blogs/${blogId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      }
      fetchBlogs()
      clearSelection()
    } catch (error) {
      console.error('Error bulk deleting:', error)
    }
  }

  const copyBlogLink = (blogId: string) => {
    const url = `${window.location.origin}/blogs/${blogId}`
    navigator.clipboard.writeText(url)
    alert('Blog link copied to clipboard!')
  }

  const getBlogStats = () => {
    const total = blogs.length
    const published = blogs.filter(b => b.published).length
    const drafts = total - published
    const totalViews = blogs.reduce((sum, blog) => sum + blog.views, 0)
    const totalLikes = blogs.reduce((sum, blog) => sum + blog.likes, 0)
    
    return { total, published, drafts, totalViews, totalLikes }
  }

  const stats = getBlogStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blogs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Blog Management
              </h1>
              <p className="text-gray-600 mt-2">Create, manage, and analyze your blog content</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="flex items-center gap-2"
              >
                {viewMode === 'grid' ? '📋' : '⊞'}
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
              <Link href="/admin/blogs/create">
                <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4" />
                  Create Blog
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Blogs</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Published</p>
                  <p className="text-2xl font-bold text-green-800">{stats.published}</p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Drafts</p>
                  <p className="text-2xl font-bold text-orange-800">{stats.drafts}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Views</p>
                  <p className="text-2xl font-bold text-purple-800">{stats.totalViews.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-pink-600 font-medium">Total Likes</p>
                  <p className="text-2xl font-bold text-pink-800">{stats.totalLikes.toLocaleString()}</p>
                </div>
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search blogs by title, author, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="views">Most Views</option>
                <option value="likes">Most Likes</option>
                <option value="title">Title A-Z</option>
              </select>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                More Filters
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">All Authors</option>
                    {Array.from(new Set(blogs.map(b => b.author))).map(author => (
                      <option key={author} value={author}>{author}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Views Range</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">All Views</option>
                    <option value="0-100">0-100</option>
                    <option value="100-500">100-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Bulk Actions */}
        {selectedBlogs.length > 0 && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-800">
                  {selectedBlogs.length} blog(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="text-blue-600 border-blue-300"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={bulkPublish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Publish All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={bulkUnpublish}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Unpublish All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={bulkDelete}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete All
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Blog Cards */}
        <div className="space-y-6">
          {sortedBlogs.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No blogs found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
              <Link href="/admin/blogs/create">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Blog
                </Button>
              </Link>
            </Card>
          ) : (
            sortedBlogs.map((blog) => (
              <Card key={blog.id} className={`overflow-hidden transition-all duration-300 hover:shadow-xl ${
                selectedBlogs.includes(blog.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}>
                <div className="flex">
                  {/* Selection Checkbox */}
                  <div className="p-4 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedBlogs.includes(blog.id)}
                      onChange={() => toggleBlogSelection(blog.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  {/* Blog Image */}
                  <div className="w-48 h-32 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    {blog.imageUrl ? (
                      <img
                        src={blog.imageUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl text-gray-400">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Blog Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
                            {blog.title}
                          </h3>
                          <Badge 
                            variant={blog.published ? "default" : "secondary"}
                            className={blog.published ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                          >
                            {blog.published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        
                        {blog.excerpt && (
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {blog.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Blog Meta */}
                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{blog.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{blog.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{blog.likes} likes</span>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {blog.tags && (
                      <div className="flex gap-2 mb-4">
                        {blog.tags.split(',').slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag.trim()}
                          </Badge>
                        ))}
                        {blog.tags.split(',').length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{blog.tags.split(',').length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublish(blog.id, blog.published)}
                        className={blog.published ? "border-orange-300 text-orange-600 hover:bg-orange-50" : "border-green-300 text-green-600 hover:bg-green-50"}
                      >
                        {blog.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {blog.published ? 'Unpublish' : 'Publish'}
                      </Button>
                      
                      <Link href={`/admin/blogs/${blog.id}/edit`}>
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyBlogLink(blog.id)}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      
                      <Link href={`/blogs/${blog.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBlog(blog.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
