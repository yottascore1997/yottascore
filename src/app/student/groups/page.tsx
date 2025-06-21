'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Users, Plus, Lock, Globe, User, MessageCircle, Calendar, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function GroupsPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isPrivate: false
  })
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/groups', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch groups')
      }

      const data = await response.json()
      setGroups(data)
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newGroup)
      })

      if (!response.ok) {
        throw new Error('Failed to create group')
      }

      setShowCreateGroup(false)
      setNewGroup({
        name: '',
        description: '',
        imageUrl: '',
        isPrivate: false
      })
      fetchGroups()
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    setJoining(groupId)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to join group')
      }

      fetchGroups()
    } catch (error) {
      console.error('Error joining group:', error)
    } finally {
      setJoining(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Study Groups</h1>
          <Button 
            onClick={() => setShowCreateGroup(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="p-4">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups available</h3>
            <p className="text-gray-500 mb-6">Create the first study group to get started!</p>
            <Button 
              onClick={() => setShowCreateGroup(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {groups.map((group: any) => (
              <div key={group.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt={group.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-lg">
                            {group.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{group.name}</h3>
                          {group.isPrivate ? (
                            <Lock className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Globe className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">Created by {group.creator.name}</p>
                      </div>
                    </div>
                  </div>
                  
                  {group.description && (
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">{group.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {group._count?.members || 0} members
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {group._count?.posts || 0} posts
                      </span>
                      <span className="flex items-center">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {group._count?.quizzes || 0} quizzes
                      </span>
                    </div>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {group.isMember ? (
                      <Link href={`/student/groups/${group.id}`}>
                        <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl">
                          View Group
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={joining === group.id}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl"
                      >
                        {joining === group.id ? 'Joining...' : 'Join Group'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Study Group</h2>
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <Users className="w-5 h-5 text-gray-500" />
                    <Input
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder="Group Name"
                      className="border-0 bg-transparent focus:ring-0"
                      required
                    />
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Textarea
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder="Describe your study group..."
                      rows={3}
                      className="border-0 bg-transparent focus:ring-0 resize-none"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-gray-500" />
                    <Input
                      value={newGroup.imageUrl}
                      onChange={(e) => setNewGroup({ ...newGroup, imageUrl: e.target.value })}
                      placeholder="Group Image URL (optional)"
                      className="border-0 bg-transparent focus:ring-0"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newGroup.isPrivate}
                    onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-600">
                    Private group
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateGroup(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {creating ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 