'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Edit3, Camera, User, Mail, BookOpen, Calendar, Share2, Users, FileText, Heart, MessageCircle, Shield } from 'lucide-react'

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showErrorMessage, setShowErrorMessage] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
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
    
    // Validate form
    if (!editForm.name.trim()) {
      setError('Name is required')
      return
    }
    
    setEditing(true)
    setError(null) // Clear any previous errors
    
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
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setShowEdit(false)
      
      // Show success message (you can replace this with a toast notification)
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
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
        // Follow request sent (always now)
        setProfile(prev => prev ? { ...prev, followRequestStatus: 'PENDING' } : null)
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
        const errorText = await response.text()
        throw new Error(`Failed to unfollow user: ${errorText}`)
      }

      fetchProfile()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unfollow user')
    }
  }

  const handleCancelRequest = async () => {
    if (!profile) return

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
        body: JSON.stringify({ targetUserId: profile.id })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel follow request')
      }

      fetchProfile()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to cancel follow request')
    }
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image file size must be less than 5MB')
          return
        }
        
        setSelectedPhoto(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhotoPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
        
        // Auto-upload if not in edit mode
        if (!showEdit) {
          setUploadingPhoto(true)
          try {
            const photoUrl = await uploadPhoto(file)
            
            // Save the profile photo URL to the database
            const token = localStorage.getItem('token')
            if (!token) {
              router.push('/auth/login')
              return
            }

            const updateResponse = await fetch('/api/student/profile', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                ...editForm,
                profilePhoto: photoUrl
              })
            })

            if (!updateResponse.ok) {
              throw new Error('Failed to save profile photo')
            }

            const updatedProfile = await updateResponse.json()
            setProfile(updatedProfile)
            setEditForm({ ...editForm, profilePhoto: photoUrl })
            
            setSelectedPhoto(null)
            setPhotoPreview(null)
            if (photoInputRef.current) {
              photoInputRef.current.value = ''
            }
            
            // Show success message
            setShowSuccessMessage(true)
            setTimeout(() => setShowSuccessMessage(false), 3000)
          } catch (error) {
            console.error('Photo upload error:', error)
            setShowErrorMessage(true)
            setTimeout(() => setShowErrorMessage(false), 5000)
          } finally {
            setUploadingPhoto(false)
          }
        }
      } else {
        alert('Please select an image file')
      }
    }
  }

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload photo')
    }

    const data = await response.json()
    return data.url
  }

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return

    setUploadingPhoto(true)
    try {
      const photoUrl = await uploadPhoto(selectedPhoto)
      
      // Save the profile photo URL to the database
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const updateResponse = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          profilePhoto: photoUrl
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to save profile photo')
      }

      const updatedProfile = await updateResponse.json()
      setProfile(updatedProfile)
      setEditForm({ ...editForm, profilePhoto: photoUrl })
      
      setSelectedPhoto(null)
      setPhotoPreview(null)
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      setShowErrorMessage(true)
      setTimeout(() => setShowErrorMessage(false), 5000)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const debugFollows = async () => {
    if (!profile) return

    try {
      const token = localStorage.getItem('token')
      if (token) {
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
      }
    } catch (error) {
      console.error('Debug error:', error)
    }
  }

  const explainFollowSystem = async () => {
    if (!profile) return

    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await fetch(`/api/student/follow-explanation?userId=${profile.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Follow Explanation:', data)
          
          const message = `
${data.explanation.title}

${data.explanation.description}

Example: ${data.explanation.example}

What happens when you follow someone:
• ${data.whatHappensWhenYouFollow.step2}
• ${data.whatHappensWhenYouFollow.step3}
• ${data.whatHappensWhenYouFollow.step4}
• ${data.whatHappensWhenYouFollow.step5}

Current Relationship:
• You follow ${data.targetUser.name}: ${data.relationship.iFollowThem ? 'Yes' : 'No'}
• ${data.targetUser.name} follows you: ${data.relationship.theyFollowMe ? 'Yes' : 'No'}
• Mutual follow: ${data.relationship.mutualFollow ? 'Yes' : 'No'}
          `.trim()
          
          alert(message)
        }
      }
    } catch (error) {
      console.error('Follow explanation error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={fetchProfile}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-500">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-in slide-in-from-right duration-300">
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <span className="text-green-500 text-sm">✓</span>
          </div>
          <span className="font-medium">Profile photo updated successfully!</span>
        </div>
      )}

      {/* Error Notification */}
      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-in slide-in-from-right duration-300">
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <span className="text-red-500 text-sm">✕</span>
          </div>
          <span className="font-medium">Failed to upload profile photo. Please try again.</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-36 translate-x-36"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full translate-y-48 -translate-x-48"></div>
        
        <div className="relative z-10 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
                <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1 shadow-lg">
                      {profile.profilePhoto ? (
                        <img
                          src={profile.profilePhoto}
                          alt={profile.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-3xl font-bold">
                            {profile.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {isOwnProfile && (
                      <button 
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        title="Change profile photo"
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingPhoto ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                      {profile.isPrivate && (
                        <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full">
                          <Shield className="w-4 h-4 text-gray-600" />
                          <span className="text-xs font-medium text-gray-600">Private</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {profile.email}
                    </p>
                    {profile.course && (
                      <p className="text-gray-500 flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {profile.course} • {profile.year}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {isOwnProfile ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEdit(true)}
                        className="rounded-full border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={debugFollows}
                    className="rounded-full border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200"
                  >
                    Debug
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={explainFollowSystem}
                    className="rounded-full border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                  >
                    How Follow Works
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                  <p className="text-gray-700 leading-relaxed text-lg">{profile.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 hover:shadow-lg transition-shadow duration-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{profile._count.posts}</div>
                  <div className="text-sm text-gray-600 font-medium">Posts</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 hover:shadow-lg transition-shadow duration-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{profile._count.followers}</div>
                  <div className="text-sm text-gray-600 font-medium" title="People who follow this user">Followers</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl border border-pink-200 hover:shadow-lg transition-shadow duration-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{profile._count.following}</div>
                  <div className="text-sm text-gray-600 font-medium" title="People this user follows">Following</div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex space-x-4">
                  {profile.isFollowing ? (
                    <Button
                      variant="outline"
                      onClick={handleUnfollow}
                      className="flex-1 rounded-xl border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 h-12"
                    >
                      Following
                    </Button>
                  ) : profile.followRequestStatus === 'PENDING' ? (
                    <Button
                      variant="outline"
                      onClick={handleCancelRequest}
                      className="flex-1 rounded-xl border-orange-300 text-orange-600 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 h-12"
                    >
                      Cancel Request
                    </Button>
                  ) : profile.followRequestStatus === 'DECLINED' ? (
                    <Button
                      onClick={handleFollow}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Send Again
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFollow}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Follow
                    </Button>
                  )}
                  {profile.isFollowing && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/student/messages?user=${profile.id}`)}
                      className="rounded-xl border-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all duration-200 h-12 px-6"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for profile photo upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setShowEdit(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                
                {/* Profile Photo Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700">Profile Photo</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1">
                        {(photoPreview || editForm.profilePhoto) ? (
                          <img
                            src={photoPreview || editForm.profilePhoto}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {editForm.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                      >
                        <Camera className="w-3 h-3 text-white" />
                      </button>
                      {(photoPreview || editForm.profilePhoto) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm({ ...editForm, profilePhoto: '' })
                            setPhotoPreview(null)
                            setSelectedPhoto(null)
                            if (photoInputRef.current) {
                              photoInputRef.current.value = ''
                            }
                          }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <span className="text-white text-xs">×</span>
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      {selectedPhoto && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">{selectedPhoto.name}</p>
                          <Button
                            type="button"
                            onClick={handlePhotoUpload}
                            disabled={uploadingPhoto}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                          >
                            {uploadingPhoto ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-2"></div>
                                Uploading...
                              </div>
                            ) : (
                              'Upload Photo'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                      <User className="w-5 h-5 text-blue-500" />
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <Input
                        value={editForm.email}
                        placeholder="Email address"
                        disabled
                        className="border-0 bg-transparent focus:ring-0 text-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Course</label>
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <BookOpen className="w-5 h-5 text-green-500" />
                      <Input
                        value={editForm.course}
                        onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                        placeholder="Enter your course"
                        className="border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Year</label>
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <Input
                        value={editForm.year}
                        onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                        placeholder="Enter your year"
                        className="border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Bio</label>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <Textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="border-0 bg-transparent focus:ring-0 resize-none text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={editForm.isPrivate}
                    onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-700 font-medium">
                    Make profile private
                  </label>
                </div>
                
                <div className="flex space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEdit(false)}
                    className="flex-1 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 h-12"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={editing}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {editing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No posts yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                When you share posts, they'll appear here for your followers to see.
              </p>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Create Your First Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 