'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, BookOpen, Target, Bell, FileText, Repeat, Save } from 'lucide-react'

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">Schedule Name</Label>
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <Target className="w-5 h-5 text-blue-500" />
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Weekly Study Plan"
              className="border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description (Optional)</Label>
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description for your schedule"
              className="border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Schedule Type</Label>
          <div className="flex space-x-3">
            <Button
              type="button"
              variant={formData.isWeekly ? 'default' : 'outline'}
              onClick={() => handleSelectChange('isWeekly', 'true')}
              className={`flex-1 rounded-xl transition-all duration-200 ${
                formData.isWeekly 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <Repeat className="w-4 h-4 mr-2" />
              Weekly
            </Button>
            <Button
              type="button"
              variant={!formData.isWeekly ? 'default' : 'outline'}
              onClick={() => handleSelectChange('isWeekly', 'false')}
              className={`flex-1 rounded-xl transition-all duration-200 ${
                !formData.isWeekly 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                  : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Daily
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="day" className="text-sm font-medium text-gray-700">Day</Label>
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
            <Calendar className="w-5 h-5 text-orange-500" />
            <Select
              value={formData.day}
              onValueChange={(value) => handleSelectChange('day', value)}
            >
              <SelectTrigger className="border-0 bg-transparent focus:ring-0 text-gray-900">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">Start Time</Label>
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <Clock className="w-5 h-5 text-green-500" />
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="border-0 bg-transparent focus:ring-0 text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">End Time</Label>
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
              <Clock className="w-5 h-5 text-red-500" />
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="border-0 bg-transparent focus:ring-0 text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject</Label>
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="e.g., Mathematics"
              className="border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-medium text-gray-700">Topic (Optional)</Label>
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
            <FileText className="w-5 h-5 text-indigo-500" />
            <Input
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g., Calculus"
              className="border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes"
              className="border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            id="reminder"
            checked={formData.reminder}
            onChange={(e) => handleSelectChange('reminder', e.target.checked.toString())}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-500" />
            <Label htmlFor="reminder" className="text-sm font-medium text-gray-700 cursor-pointer">
              Set Reminder
            </Label>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 h-12"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Creating...
            </div>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Create Schedule
            </>
          )}
        </Button>
      </div>
    </form>
  )
} 