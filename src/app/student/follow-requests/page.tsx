'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Heart, User, Check, X, Clock } from 'lucide-react'

interface FollowRequest {
  id: string
  sender: {
    id: string
    name: string
    email: string
    profilePhoto?: string
    course?: string
    year?: string
  }
  status: string
  createdAt: string
}

export default function FollowRequestsPage() {
  const [requests, setRequests] = useState<FollowRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchFollowRequests()
  }, [])

  const fetchFollowRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/follow-requests', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch follow requests')
      }

      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching follow requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessing(requestId)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/follow-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, action })
      })

      if (!response.ok) {
        throw new Error('Failed to handle follow request')
      }

      // Remove the request from the list
      setRequests((prev) => prev.filter((req) => req.id !== requestId))
    } catch (error) {
      console.error('Error handling follow request:', error)
    } finally {
      setProcessing(null)
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
          <h1 className="text-xl font-bold text-gray-900">Follow Requests</h1>
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">{requests.length} pending</span>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="p-4">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
            <p className="text-gray-500">When someone requests to follow you, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request: FollowRequest) => (
              <div key={request.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      {request.sender.profilePhoto ? (
                        <img
                          src={request.sender.profilePhoto}
                          alt={request.sender.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {request.sender.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{request.sender.name}</h3>
                      <p className="text-sm text-gray-500">{request.sender.email}</p>
                      {request.sender.course && (
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <User className="w-3 h-3 mr-1" />
                          {request.sender.course} • {request.sender.year}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleFollowRequest(request.id, 'accept')}
                      disabled={processing === request.id}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFollowRequest(request.id, 'reject')}
                      disabled={processing === request.id}
                      className="border-red-300 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 