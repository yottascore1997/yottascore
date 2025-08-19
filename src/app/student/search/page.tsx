'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, User, Hash, FileText, Users, Heart, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface SearchResults {
  users: any[]
  posts: any[]
  hashtags: any[]
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ users: [], posts: [], hashtags: [] })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'hashtags'>('all')
  const router = useRouter()

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to search')
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: userId })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to follow user')
      }

      const result = await response.json()
      
      // Update the user state based on the response
      setResults(prev => ({
        ...prev,
        users: prev.users.map(user => {
          if (user.id === userId) {
            if (result.type === 'request') {
              return { ...user, followRequestStatus: 'PENDING' }
            } else if (result.type === 'follow') {
              return { ...user, isFollowing: true, followRequestStatus: null }
            }
          }
          return user
        })
      }))

      // Refresh search results
      handleSearch()
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/follow?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to unfollow user')
      }

      // Refresh search results
      handleSearch()
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  const handleCancelRequest = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/follow/cancel-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: userId })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel follow request')
      }

      // Refresh search results
      handleSearch()
    } catch (error) {
      console.error('Error cancelling follow request:', error)
    }
  }

  return (
    <div className="pb-4">
      {/* Search Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search users, posts, or hashtags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Search Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex px-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('hashtags')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'hashtags'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Hashtags
          </button>
        </div>
      </div>

      {/* Search Results */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : query.trim() === '' ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for something</h3>
            <p className="text-gray-500">Find users, posts, and hashtags in your study community.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Users */}
            {(activeTab === 'all' || activeTab === 'users') && results.users && results.users.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Users
                </h2>
                <div className="space-y-3">
                  {results.users.map((user: any) => (
                    <div key={user.id} className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Link href={`/student/profile?userId=${user.id}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              {user.profilePhoto ? (
                                <img
                                  src={user.profilePhoto}
                                  alt={user.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold text-sm">
                                  {user.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">{user.name}</h3>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              {user.course && (
                                <p className="text-xs text-gray-400">
                                  {user.course} • {user.year}
                                </p>
                              )}
                            </div>
                          </Link>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Message Button - Show when following */}
                          {user.isFollowing && (
                            <Button
                              size="sm"
                              onClick={() => router.push(`/student/messages?user=${user.id}`)}
                              className="bg-green-500 hover:bg-green-600 text-white rounded-full"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                          )}
                          
                                                     {/* Follow/Unfollow Button */}
                           {user.isFollowing ? (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleUnfollow(user.id)}
                               className="border-gray-300 text-gray-700 rounded-full"
                             >
                               Following
                             </Button>
                           ) : user.followRequestStatus === 'PENDING' ? (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleCancelRequest(user.id)}
                               className="border-orange-300 text-orange-600 rounded-full"
                             >
                               Cancel Request
                             </Button>
                           ) : (
                             <Button
                               variant="default"
                               size="sm"
                               onClick={() => handleFollow(user.id)}
                               className={`rounded-full ${
                                 user.followRequestStatus === 'DECLINED'
                                   ? 'border-red-300 text-red-600'
                                   : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                               }`}
                             >
                               {user.followRequestStatus === 'DECLINED' ? 'Send Again' : 'Follow'}
                             </Button>
                           )}
                        </div>
                        
                                                 {/* Status Information */}
                         <div className="mt-2 text-xs text-gray-500">
                           {!user.isFollowing && !user.followRequestStatus && (
                             <span>Follow this user to start messaging</span>
                           )}
                           {user.followRequestStatus === 'PENDING' && (
                             <span>Follow request sent - waiting for response</span>
                           )}
                           {user.followRequestStatus === 'DECLINED' && (
                             <span>Follow request was declined - you can try again</span>
                           )}
                           {user.isFollowing && (
                             <span>You can message this user directly</span>
                           )}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {(activeTab === 'all' || activeTab === 'posts') && results.posts && results.posts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Posts
                </h2>
                <div className="space-y-3">
                  {results.posts.map((post: any) => (
                    <div key={post.id} className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Link href={`/student/profile?userId=${post.author?.id}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            {post.author?.profilePhoto ? (
                              <img
                                src={post.author.profilePhoto}
                                alt={post.author.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-xs">
                                {post.author?.name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">{post.author?.name}</h4>
                            <p className="text-xs text-gray-500">{post.author?.course} • {post.author?.year}</p>
                          </div>
                        </Link>
                      </div>
                      <p className="text-gray-800 text-sm mb-3 line-clamp-3">{post.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            {post._count?.likes || 0}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {post._count?.comments || 0}
                          </span>
                        </div>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {(activeTab === 'all' || activeTab === 'hashtags') && results.hashtags && results.hashtags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  Hashtags
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {results.hashtags.map((hashtag: any) => (
                    <div key={hashtag.name} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                      <div className="text-lg font-semibold text-blue-600 mb-1">#{hashtag.name}</div>
                      <div className="text-sm text-gray-500">{hashtag.count} posts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query.trim() !== '' && 
             ((activeTab === 'all' && results.users.length === 0 && results.posts.length === 0 && results.hashtags.length === 0) ||
              (activeTab === 'users' && results.users.length === 0) ||
              (activeTab === 'posts' && results.posts.length === 0) ||
              (activeTab === 'hashtags' && results.hashtags.length === 0)) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500">Try searching with different keywords.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 