'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Send, 
  Users, 
  Target, 
  MessageSquare,
  AlertCircle,
  Info,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  course: string | null
  year: string | null
  role: string
}

interface NotificationHistory {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    course: string | null
    year: string | null
  }
  sentByUser: {
    id: string
    name: string
  }
}

function PushNotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showUserSelector, setShowUserSelector] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'GENERAL',
    targetRole: 'STUDENT',
    targetCourse: '',
    targetYear: '',
    sendToAll: false
  })

  useEffect(() => {
    fetchUsers()
    fetchNotificationHistory()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/admin/students', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchNotificationHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/admin/push-notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotificationHistory(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notification history:', error)
    }
  }

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      alert('Please fill in title and message')
      return
    }

    if (!formData.sendToAll && selectedUsers.length === 0) {
      alert('Please select target users or choose "Send to All"')
      return
    }

    setSending(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetRole: formData.targetRole,
        targetCourse: formData.targetCourse || undefined,
        targetYear: formData.targetYear || undefined,
        targetUsers: formData.sendToAll ? [] : selectedUsers
      }

      const response = await fetch('/api/admin/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ Notification sent successfully to ${result.usersCount} users!`)
        
        // Reset form
        setFormData({
          title: '',
          message: '',
          type: 'GENERAL',
          targetRole: 'STUDENT',
          targetCourse: '',
          targetYear: '',
          sendToAll: false
        })
        setSelectedUsers([])
        
        // Refresh history
        fetchNotificationHistory()
      } else {
        const error = await response.text()
        alert(`❌ Error: ${error}`)
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('❌ Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EXAM':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'ANNOUNCEMENT':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'REMINDER':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'EXAM':
        return 'bg-blue-100 text-blue-800'
      case 'ANNOUNCEMENT':
        return 'bg-orange-100 text-orange-800'
      case 'REMINDER':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter(user => {
    if (formData.targetRole && user.role !== formData.targetRole) return false
    if (formData.targetCourse && user.course !== formData.targetCourse) return false
    if (formData.targetYear && user.year !== formData.targetYear) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="h-8 w-8 text-blue-500 mr-3" />
            Push Notifications
          </h1>
          <p className="text-gray-600 mt-2">Send notifications to students and track delivery</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Notification Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send New Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notification title"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notification message"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GENERAL">General</option>
                  <option value="EXAM">Exam</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="REMINDER">Reminder</option>
                </select>
              </div>

              {/* Target Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sendToAll}
                      onChange={(e) => setFormData({ ...formData, sendToAll: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Send to All Students</span>
                  </label>
                </div>

                {!formData.sendToAll && (
                  <div className="space-y-4">
                    {/* Target Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Role
                      </label>
                      <select
                        value={formData.targetRole}
                        onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="STUDENT">Students</option>
                        <option value="ADMIN">Admins</option>
                      </select>
                    </div>

                    {/* Target Course */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Course (Optional)
                      </label>
                      <select
                        value={formData.targetCourse}
                        onChange={(e) => setFormData({ ...formData, targetCourse: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Courses</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Medical">Medical</option>
                        <option value="Commerce">Commerce</option>
                      </select>
                    </div>

                    {/* Target Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Year (Optional)
                      </label>
                      <select
                        value={formData.targetYear}
                        onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Years</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>

                    {/* User Selector */}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUserSelector(!showUserSelector)}
                        className="w-full"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {selectedUsers.length > 0 
                          ? `${selectedUsers.length} users selected`
                          : 'Select Specific Users'
                        }
                      </Button>
                    </div>

                    {showUserSelector && (
                      <div className="border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
                        <div className="space-y-2">
                          {filteredUsers.map(user => (
                            <label key={user.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user.id])
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">
                                {user.name} ({user.email}) - {user.course} {user.year}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendNotification}
                disabled={sending || !formData.title || !formData.message}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Notification History */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notificationHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No notifications sent yet</p>
                  </div>
                ) : (
                  notificationHistory.map((notification) => (
                    <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getTypeIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                              <Badge className={getTypeBadgeColor(notification.type)}>
                                {notification.type}
                              </Badge>
                              {notification.isRead ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="text-xs text-gray-500">
                              To: {notification.user.name} ({notification.user.email})
                              <br />
                              Sent by: {notification.sentByUser.name} • {new Date(notification.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PushNotificationsPage
