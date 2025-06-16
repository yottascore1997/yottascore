'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Question {
  id: string
  question: string
  options: string[]
  correct: number
  timeLimit: number
  isActive: boolean
  createdAt: string
}

export default function QuestionOfTheDayPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: 0,
    timeLimit: 10
  })
  const router = useRouter()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/admin/question-of-the-day', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }

      const data = await response.json()
      setQuestions(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/admin/question-of-the-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newQuestion)
      })

      if (!response.ok) {
        throw new Error('Failed to add question')
      }

      setShowAddModal(false)
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correct: 0,
        timeLimit: 10
      })
      fetchQuestions()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add question')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/admin/question-of-the-day/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update question')
      }

      fetchQuestions()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update question')
    }
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
        <h1 className="text-2xl font-bold">Question of the Day</h1>
        <Button onClick={() => setShowAddModal(true)}>Add New Question</Button>
      </div>

      <div className="grid gap-4">
        {questions.map((q) => (
          <div key={q.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold mb-2">{q.question}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        index === q.correct ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Time Limit: {q.timeLimit} seconds
                </div>
              </div>
              <Button
                onClick={() => handleToggleActive(q.id, q.isActive)}
                variant={q.isActive ? 'destructive' : 'default'}
              >
                {q.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add New Question</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              {newQuestion.options.map((option, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium mb-1">
                    Option {index + 1}
                  </label>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newQuestion.options]
                      newOptions[index] = e.target.value
                      setNewQuestion({ ...newQuestion, options: newOptions })
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Correct Option
                </label>
                <select
                  value={newQuestion.correct}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      correct: parseInt(e.target.value)
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  {newQuestion.options.map((_, index) => (
                    <option key={index} value={index}>
                      Option {index + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  value={newQuestion.timeLimit}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      timeLimit: parseInt(e.target.value)
                    })
                  }
                  className="w-full p-2 border rounded"
                  min="1"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddQuestion}>Add Question</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 