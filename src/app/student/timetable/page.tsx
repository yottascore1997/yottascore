'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import AddScheduleForm from './components/AddScheduleForm'

interface TimetableSlot {
  id: string
  day: number
  startTime: string
  endTime: string
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
  const router = useRouter()

  useEffect(() => {
    fetchTimetables()
  }, [])

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
      timetable.slots.filter(slot => slot.day === day)
    )
  }

  const getWeekDates = () => {
    const start = startOfWeek(selectedDate)
    const end = endOfWeek(selectedDate)
    return eachDayOfInterval({ start, end })
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Study Timetable</h1>
        <div className="space-x-2">
          <Button
            variant={view === 'daily' ? 'default' : 'outline'}
            onClick={() => setView('daily')}
          >
            Daily View
          </Button>
          <Button
            variant={view === 'weekly' ? 'default' : 'outline'}
            onClick={() => setView('weekly')}
          >
            Weekly View
          </Button>
          <Button onClick={() => setShowAddModal(true)}>Add New Schedule</Button>
        </div>
      </div>

      {view === 'daily' ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={() => setSelectedDate(prev => addDays(prev, -1))}
            >
              Previous
            </Button>
            <h2 className="text-xl font-semibold">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(prev => addDays(prev, 1))}
            >
              Next
            </Button>
          </div>

          <div className="space-y-4">
            {getSlotsForDay(selectedDate).map(slot => (
              <div
                key={slot.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">{slot.subject}</h3>
                  {slot.topic && <p className="text-gray-600">{slot.topic}</p>}
                  <p className="text-sm text-gray-500">
                    {format(new Date(slot.startTime), 'h:mm a')} -{' '}
                    {format(new Date(slot.endTime), 'h:mm a')}
                  </p>
                  {slot.notes && (
                    <p className="text-sm text-gray-600 mt-1">{slot.notes}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={slot.isCompleted}
                    onChange={e => handleToggleComplete(slot.id, e.target.checked)}
                    className="h-5 w-5"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSlot(slot.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {getSlotsForDay(selectedDate).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No slots scheduled for this day
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={() => setSelectedDate(prev => addDays(prev, -7))}
            >
              Previous Week
            </Button>
            <h2 className="text-xl font-semibold">
              Week of {format(startOfWeek(selectedDate), 'MMMM d')}
            </h2>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(prev => addDays(prev, 7))}
            >
              Next Week
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {getWeekDates().map(date => (
              <div key={date.toISOString()} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  {format(date, 'EEE, MMM d')}
                </h3>
                <div className="space-y-2">
                  {getSlotsForDay(date).map(slot => (
                    <div
                      key={slot.id}
                      className={`p-2 rounded ${
                        slot.isCompleted ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <p className="font-medium">{slot.subject}</p>
                      <p className="text-sm text-gray-600">
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <AddScheduleForm
              onClose={() => setShowAddModal(false)}
              onSuccess={fetchTimetables}
            />
          </div>
        </div>
      )}
    </div>
  )
} 