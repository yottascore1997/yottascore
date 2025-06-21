'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AddScheduleFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddScheduleForm({ onClose, onSuccess }: AddScheduleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isWeekly: true,
    day: '1',
    startTime: '',
    endTime: '',
    subject: '',
    topic: '',
    notes: '',
    reminder: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          isWeekly: formData.isWeekly,
          slots: [{
            day: parseInt(formData.day),
            startTime: formData.startTime,
            endTime: formData.endTime,
            subject: formData.subject,
            topic: formData.topic,
            notes: formData.notes,
            reminder: formData.reminder
          }]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create schedule')
      }

      onSuccess()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Schedule Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., Weekly Study Plan"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add a description for your schedule"
        />
      </div>

      <div className="space-y-2">
        <Label>Schedule Type</Label>
        <div className="flex space-x-4">
          <Button
            type="button"
            variant={formData.isWeekly ? 'default' : 'outline'}
            onClick={() => handleSelectChange('isWeekly', 'true')}
          >
            Weekly
          </Button>
          <Button
            type="button"
            variant={!formData.isWeekly ? 'default' : 'outline'}
            onClick={() => handleSelectChange('isWeekly', 'false')}
          >
            Daily
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="day">Day</Label>
        <Select
          value={formData.day}
          onValueChange={(value) => handleSelectChange('day', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Sunday</SelectItem>
            <SelectItem value="1">Monday</SelectItem>
            <SelectItem value="2">Tuesday</SelectItem>
            <SelectItem value="3">Wednesday</SelectItem>
            <SelectItem value="4">Thursday</SelectItem>
            <SelectItem value="5">Friday</SelectItem>
            <SelectItem value="6">Saturday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          placeholder="e.g., Mathematics"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic (Optional)</Label>
        <Input
          id="topic"
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          placeholder="e.g., Calculus"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any additional notes"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="reminder"
          checked={formData.reminder}
          onChange={(e) => handleSelectChange('reminder', e.target.checked.toString())}
          className="h-4 w-4"
        />
        <Label htmlFor="reminder">Set Reminder</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Schedule'}
        </Button>
      </div>
    </form>
  )
} 