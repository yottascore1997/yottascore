'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns'
import { Calendar, Clock, BookOpen, Plus, ChevronLeft, ChevronRight, CheckCircle, Circle, Trash2, Edit3, Bell, Target, TrendingUp, CalendarDays, Grid3X3 } from 'lucide-react'
import AddScheduleForm from './components/AddScheduleForm'
import { io, Socket } from 'socket.io-client'

interface TimetableSlot {
  id: string
  day: number
  startTime: string
  endTime: string
  slotDate?: string | null
  subject: string
  topic?: string
  notes?: string
  isCompleted: boolean
  reminder: boolean
}

interface Timetable {
  id: string
  name: string
  description?: string
  isWeekly: boolean
  slots: TimetableSlot[]
}

export default function TimetablePage() {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'daily' | 'weekly'>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [reminderInterval, setReminderInterval] = useState<NodeJS.Timeout | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchTimetables()
    startReminderCheck()
    initializeSocket()
    
    return () => {
      if (reminderInterval) {
        clearInterval(reminderInterval)
      }
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const initializeSocket = () => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const newSocket = io('http://localhost:3001', {
        path: '/api/socket',
        auth: { token }
      })

      newSocket.on('connect', () => {
        console.log('🔌 Timetable socket connected')
        // Start timetable reminders
        newSocket.emit('start_timetable_reminders', { userId: payload.userId })
      })

      newSocket.on('timetable_reminder', (data) => {
        console.log('⏰ Timetable reminder received:', data)
        // Show notification to user
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.subject, {
            body: `Your study session starts in ${Math.round((new Date(data.startTime).getTime() - Date.now()) / (1000 * 60))} minutes.${data.notes ? `\n\nNotes: ${data.notes}` : ''}`,
            icon: '/favicon.ico'
          })
        }
      })

      newSocket.on('disconnect', () => {
        console.log('🔌 Timetable socket disconnected')
      })

      setSocket(newSocket)
    } catch (error) {
      console.error('Error initializing socket:', error)
    }
  }

  const fetchTimetables = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/timetable', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch timetables')
      }

      const data = await response.json()
      setTimetables(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch timetables')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (slotId: string, isCompleted: boolean) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/timetable/${slotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isCompleted })
      })

      if (!response.ok) {
        throw new Error('Failed to update slot')
      }

      fetchTimetables()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update slot')
    }
  }

  const handleToggleReminder = async (slotId: string, reminder: boolean) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/timetable/${slotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reminder })
      })

      if (!response.ok) {
        throw new Error('Failed to update reminder')
      }

      fetchTimetables()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update reminder')
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/student/timetable/${slotId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete slot')
      }

      fetchTimetables()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete slot')
    }
  }

  const getSlotsForDay = (date: Date) => {
    const day = date.getDay()
    return timetables.flatMap(timetable =>
      timetable.slots.filter(slot => {
        if (slot.slotDate) {
          return isSameDay(new Date(slot.slotDate), date)
        }
        return slot.day === day
      })
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }

  const getWeekDates = () => {
    const start = startOfWeek(selectedDate)
    const end = endOfWeek(selectedDate)
    return eachDayOfInterval({ start, end })
  }

  const getCompletedCount = () => {
    const todaySlots = getSlotsForDay(selectedDate)
    return todaySlots.filter(slot => slot.isCompleted).length
  }

  const getTotalCount = () => {
    return getSlotsForDay(selectedDate).length
  }

  const startReminderCheck = () => {
    // Check reminders every 5 minutes
    const interval = setInterval(async () => {
      await checkReminders()
    }, 5 * 60 * 1000) // 5 minutes

    setReminderInterval(interval)
    
    // Also check immediately when component loads
    checkReminders()
  }

  const checkReminders = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/student/timetable/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ checkReminders: true })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.reminders && result.reminders.length > 0) {
          console.log('Reminders sent:', result.reminders)
          alert(`✅ ${result.reminders.length} reminders sent!`)
        } else {
          alert('ℹ️ No upcoming reminders found')
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error)
      alert('❌ Error checking reminders')
    }
  }

  const resetReminders = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/student/timetable/reminders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resetAll: true })
      })

      if (response.ok) {
        alert('✅ All reminder statuses reset!')
        fetchTimetables()
      }
    } catch (error) {
      console.error('Error resetting reminders:', error)
      alert('❌ Error resetting reminders')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your timetable...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Timetable</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={fetchTimetables}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-36 translate-x-36"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full translate-y-48 -translate-x-48"></div>
        
        <div className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
                <div className="mb-6 lg:mb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Study Timetable</h1>
                      <p className="text-gray-600">Organize your study schedule efficiently</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <Button
                      variant={view === 'daily' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setView('daily')}
                      className={`rounded-lg ${view === 'daily' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    >
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Daily
                    </Button>
                    <Button
                      variant={view === 'weekly' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setView('weekly')}
                      className={`rounded-lg ${view === 'weekly' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    >
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Weekly
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={() => setShowAddModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-6 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Schedule
                    </Button>
                    <Button 
                      onClick={checkReminders}
                      variant="outline"
                      className="rounded-xl border-green-200 hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all duration-200"
                      title="Test reminder system"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Test Reminders
                    </Button>
                    <Button 
                      onClick={resetReminders}
                      variant="outline"
                      className="rounded-xl border-orange-200 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200"
                      title="Reset all reminder statuses"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Reset Reminders
                    </Button>
                  </div>
                </div>
              </div>

              {/* Progress Stats */}
              {view === 'daily' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{getTotalCount()}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-700">Total Tasks</h3>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-green-600">{getCompletedCount()}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-700">Completed</h3>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {getTotalCount() > 0 ? Math.round((getCompletedCount() / getTotalCount()) * 100) : 0}%
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-700">Progress</h3>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {view === 'daily' ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              {/* Daily Navigation */}
              <div className="flex justify-between items-center mb-8">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(prev => addDays(prev, -1))}
                  className="rounded-xl border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h2>
                  {isToday(selectedDate) && (
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full mt-2">
                      Today
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                  className="rounded-xl border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Daily Schedule */}
              <div className="space-y-4">
                {getSlotsForDay(selectedDate).map((slot, index) => (
                  <div
                    key={slot.id}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${
                      slot.isCompleted 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                        : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            slot.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className={`text-lg font-bold ${
                              slot.isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                            }`}>
                              {slot.subject}
                            </h3>
                            {slot.topic && (
                              <p className={`text-sm ${
                                slot.isCompleted ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {slot.topic}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                            </span>
                          </div>
                          {slot.reminder && (
                            <div className="flex items-center space-x-1">
                              <Bell className="w-4 h-4" />
                              <span>Reminder set</span>
                            </div>
                          )}
                        </div>
                        
                        {slot.notes && (
                          <p className="text-gray-600 text-sm bg-white/50 rounded-lg p-3">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleComplete(slot.id, !slot.isCompleted)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                            slot.isCompleted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {slot.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleReminder(slot.id, !slot.reminder)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                            slot.reminder 
                              ? 'bg-blue-500 hover:bg-blue-600' 
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          title={slot.reminder ? 'Disable reminder' : 'Enable reminder'}
                        >
                          <Bell className={`w-4 h-4 ${slot.reminder ? 'text-white' : 'text-gray-600'}`} />
                        </button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="rounded-lg border-red-200 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {getSlotsForDay(selectedDate).length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No tasks scheduled</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      You have no study sessions scheduled for {format(selectedDate, 'EEEE, MMMM d')}. 
                      Add a new schedule to get started!
                    </p>
                    <Button 
                      onClick={() => setShowAddModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Schedule
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              {/* Weekly Navigation */}
              <div className="flex justify-between items-center mb-8">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(prev => addDays(prev, -7))}
                  className="rounded-xl border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous Week
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">
                  Week of {format(startOfWeek(selectedDate), 'MMMM d')}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(prev => addDays(prev, 7))}
                  className="rounded-xl border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                >
                  Next Week
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Weekly Grid */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {getWeekDates().map(date => (
                  <div key={date.toISOString()} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                    <div className={`text-center mb-4 p-2 rounded-lg ${
                      isToday(date) ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white'
                    }`}>
                      <h3 className={`font-bold ${
                        isToday(date) ? 'text-white' : 'text-gray-900'
                      }`}>
                        {format(date, 'EEE')}
                      </h3>
                      <p className={`text-sm ${
                        isToday(date) ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {format(date, 'MMM d')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {getSlotsForDay(date).map(slot => (
                        <div
                          key={slot.id}
                          className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                            slot.isCompleted 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-medium text-sm ${
                              slot.isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                            }`}>
                              {slot.subject}
                            </p>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleToggleReminder(slot.id, !slot.reminder)}
                                className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                                  slot.reminder 
                                    ? 'bg-blue-500' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                title={slot.reminder ? 'Disable reminder' : 'Enable reminder'}
                              >
                                <Bell className={`w-3 h-3 ${slot.reminder ? 'text-white' : 'text-gray-600'}`} />
                              </button>
                              <button
                                onClick={() => handleToggleComplete(slot.id, !slot.isCompleted)}
                                className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                                  slot.isCompleted 
                                    ? 'bg-green-500' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              >
                                {slot.isCompleted ? (
                                  <CheckCircle className="w-2 h-2 text-white" />
                                ) : (
                                  <Circle className="w-2 h-2 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">
                            {format(new Date(slot.startTime), 'h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Schedule</h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
              
              <AddScheduleForm
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchTimetables}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 