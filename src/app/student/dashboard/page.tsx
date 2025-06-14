'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface Quiz {
  id: string
  title: string
  description: string
  startTime: string
  duration: number
  spots: number
  spotsLeft: number
  entryFee: number
  prizePool: number
  isLive: boolean
  createdBy: {
    name: string
  }
}

function BattleQuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/exams', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch quizzes')
      }

      const data = await response.json()
      setQuizzes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  const handleJoinQuiz = async (quizId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/live-exams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ examId: quizId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to join exam')
      }

      router.push(`/student/live-exams/${quizId}`)
    } catch (error) {
      console.error('Error joining exam:', error)
      alert(error instanceof Error ? error.message : 'Failed to join exam')
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Battle Quizzes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white rounded shadow p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg">{quiz.title}</h3>
              <p className="text-gray-600 mb-2">{quiz.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Spots:</span>
                  <span className="ml-1">{quiz.spotsLeft}/{quiz.spots}</span>
                </div>
                <div>
                  <span className="text-gray-500">Entry Fee:</span>
                  <span className="ml-1">₹{quiz.entryFee}</span>
                </div>
                <div>
                  <span className="text-gray-500">Prize Pool:</span>
                  <span className="ml-1">₹{quiz.prizePool}</span>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-1">{quiz.duration} mins</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Starts {formatDistanceToNow(new Date(quiz.startTime), { addSuffix: true })}
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => handleJoinQuiz(quiz.id)}
                disabled={!quiz.isLive || quiz.spotsLeft === 0}
                className="w-full"
              >
                {quiz.spotsLeft === 0 ? 'Full' : quiz.isLive ? 'Join Now' : 'Coming Soon'}
              </Button>
            </div>
          </div>
        ))}

        {quizzes.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No battle quizzes available at the moment.
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'STUDENT') {
        router.push('/admin/dashboard')
      }
    } catch (e) {
      router.push('/auth/login')
    }
  }, [router])

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/exams', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch quizzes')
      }

      const data = await response.json()
      setQuizzes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching quizzes:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch quizzes')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinQuiz = async (quizId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/live-exams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ examId: quizId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to join exam')
      }

      router.push(`/student/live-exams/${quizId}`)
    } catch (error) {
      console.error('Error joining exam:', error)
      alert(error instanceof Error ? error.message : 'Failed to join exam')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Battle Quizzes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded shadow p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg">{quiz.title}</h3>
                <p className="text-gray-600 mb-2">{quiz.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Spots:</span>
                    <span className="ml-1">{quiz.spotsLeft}/{quiz.spots}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Entry Fee:</span>
                    <span className="ml-1">₹{quiz.entryFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Prize Pool:</span>
                    <span className="ml-1">₹{quiz.prizePool}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-1">{quiz.duration} mins</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Starts {formatDistanceToNow(new Date(quiz.startTime), { addSuffix: true })}
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => handleJoinQuiz(quiz.id)}
                  disabled={!quiz.isLive || quiz.spotsLeft === 0}
                  className="w-full"
                >
                  {quiz.spotsLeft === 0 ? 'Full' : quiz.isLive ? 'Join Now' : 'Coming Soon'}
                </Button>
              </div>
            </div>
          ))}

          {quizzes.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No battle quizzes available at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 