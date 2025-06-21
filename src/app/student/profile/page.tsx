'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Edit3, Camera, User, Mail, BookOpen, Calendar, Share2 } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  profilePhoto?: string
  course?: string
  year?: string
  bio?: string
  isPrivate: boolean
  createdAt: string
  _count: {
    followers: number
    following: number
    posts: number
  }
  isFollowing: boolean
  followRequestStatus: string | null
  isMutualFollower?: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    course: '',
    year: '',
    profilePhoto: '',
    email: '',
    isPrivate: false
  })
  const [isOwnProfile, setIsOwnProfile] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Get userId from URL params or use current user's ID
      const urlParams = new URLSearchParams(window.location.search)
      const targetUserId = urlParams.get('userId')
      
      // Check if this is the current user's profile
      const currentUserResponse = await fetch('/api/student/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (currentUserResponse.ok) {
        const currentUser = await currentUserResponse.json()
        setIsOwnProfile(!targetUserId || currentUser.id === targetUserId)
      }

      const response = await fetch(`/api/student/profile${targetUserId ? `?userId=${targetUserId}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setProfile(data)
      setEditForm({
        name: data.name || '',
        bio: data.bio || '',
        course: data.course || '',
        year: data.year || '',
        profilePhoto: data.profilePhoto || '',
        email: data.email || '',
        isPrivate: data.isPrivate || false
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditing(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      setShowEdit(false)
      fetchProfile()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setEditing(false)
    }
  }

  const handleFollow = async () => {
    if (!profile) return

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
        body: JSON.stringify({ targetUserId: profile.id })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to follow user')
      }

      const result = await response.json()
      
      // Update the profile state based on the response
      if (result.type === 'request') {
        // Follow request sent for private account
        setProfile(prev => prev ? { ...prev, followRequestStatus: 'PENDING' } : null)
      } else if (result.type === 'follow') {
        // Direct follow for public account
        setProfile(prev => prev ? { ...prev, isFollowing: true, followRequestStatus: null } : null)
      }

      fetchProfile()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to follow user')
    }
  }

  const handleUnfollow = async () => {
    if (!profile) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/follow?userId=${profile.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to unfollow user')
      }

      fetchProfile()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unfollow user')
    }
  }

  const debugFollows = async () => {
    if (!profile) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/student/debug-follows?userId=${profile.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Debug Follow Data:', data)
        alert(`Debug Info:\nUser: ${data.user.name}\nFollowers: ${data.user.followersCount}\nFollowing: ${data.user.followingCount}\n\nFollowers: ${data.followers.map((f: any) => f.name).join(', ')}\nFollowing: ${data.following.map((f: any) => f.name).join(', ')}`)
      }
    } catch (error) {
      console.error('Debug error:', error)
    }
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

  if (!profile) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Profile Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt={profile.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-semibold">
                      {profile.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Camera className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-500 text-sm">{profile.email}</p>
                {profile.course && (
                  <p className="text-gray-400 text-xs flex items-center mt-1">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {profile.course} • {profile.year}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEdit(true)}
                    className="rounded-full"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={debugFollows}
                className="rounded-full"
              >
                Debug
              </Button>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-700 mb-4 leading-relaxed">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{profile._count.posts}</div>
              <div className="text-xs text-gray-500">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{profile._count.followers}</div>
              <div className="text-xs text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{profile._count.following}</div>
              <div className="text-xs text-gray-500">Following</div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex space-x-2">
              {profile.isFollowing ? (
                <Button
                  variant="outline"
                  onClick={handleUnfollow}
                  className="flex-1 rounded-xl"
                >
                  Following
                </Button>
              ) : profile.followRequestStatus === 'PENDING' ? (
                <Button
                  variant="outline"
                  disabled
                  className="flex-1 rounded-xl"
                >
                  Request Sent
                </Button>
              ) : (
                <Button
                  onClick={handleFollow}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
                >
                  Follow
                </Button>
              )}
              {profile.isMutualFollower && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/student/messages?user=${profile.id}`)}
                  className="rounded-xl"
                >
                  Message
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setShowEdit(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-gray-500" />
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Full Name"
                      className="border-0 bg-transparent focus:ring-0"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <Input
                      value={editForm.email}
                      placeholder="Email"
                      disabled
                      className="border-0 bg-transparent focus:ring-0 text-gray-400"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                    <Input
                      value={editForm.course}
                      onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                      placeholder="Course"
                      className="border-0 bg-transparent focus:ring-0"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <Input
                      value={editForm.year}
                      onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                      placeholder="Year"
                      className="border-0 bg-transparent focus:ring-0"
                    />
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Write a bio..."
                      rows={3}
                      className="border-0 bg-transparent focus:ring-0 resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={editForm.isPrivate}
                    onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-600">
                    Private profile
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEdit(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={editing}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {editing ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid Placeholder */}
      <div className="p-4">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500">When you share posts, they'll appear here.</p>
        </div>
      </div>
    </div>
  )
} 