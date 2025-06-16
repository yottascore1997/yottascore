'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { FaRupeeSign } from 'react-icons/fa'

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

function QuestionOfTheDay() {
  const [question, setQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchQuestion()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showModal && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [showModal, timeLeft])

  const fetchQuestion = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/question-of-the-day', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch question')
      }

      const data = await response.json()
      setQuestion(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch question')
    } finally {
      setLoading(false)
    }
  }

  const handleViewQuestion = () => {
    if (question && !question.hasAttempted) {
      setShowModal(true)
      setTimeLeft(question.timeLimit)
      setSelectedOption(null)
      setIsAnswered(false)
    }
  }

  const handleSelectOption = async (index: number) => {
    if (isAnswered) return

    setSelectedOption(index)
    setIsAnswered(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/question-of-the-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: question.id,
          selected: index,
          timeTaken: question.timeLimit - timeLeft
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }

      const data = await response.json()
      setIsCorrect(data.isCorrect)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit answer')
    }
  }

  if (loading) {
    return <div className="mt-8">Loading...</div>
  }

  if (error) {
    return <div className="mt-8 text-red-500">{error}</div>
  }

  if (!question) {
    return null
  }

  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Question of the Day</h2>
          {!question.hasAttempted && (
            <Button onClick={handleViewQuestion}>View Question</Button>
          )}
        </div>
        {question.hasAttempted && (
          <div className="text-center py-4">
            <p className="text-lg">
              {question.isCorrect
                ? '🎉 Congratulations! You got it right!'
                : 'Better luck next time!'}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Question of the Day</h3>
              <div className="text-sm font-medium">
                Time Left: {timeLeft}s
              </div>
            </div>
            <p className="mb-4">{question.question}</p>
            <div className="space-y-2">
              {question.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleSelectOption(index)}
                  disabled={isAnswered}
                  className={`w-full p-3 text-left rounded-lg border ${
                    selectedOption === index
                      ? isCorrect
                        ? 'bg-green-100 border-green-500'
                        : 'bg-red-100 border-red-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {isAnswered && (
              <div className="mt-4 text-center">
                <p className="text-lg font-medium">
                  {isCorrect ? '🎉 Congratulations! You are a champion!' : 'Try again tomorrow!'}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wallet, setWallet] = useState<number>(0)
  const [walletLoading, setWalletLoading] = useState(true)
  const [showAddCash, setShowAddCash] = useState(false)
  const [addAmount, setAddAmount] = useState<number | ''>('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuizzes()
    fetchWallet()
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

  const fetchWallet = async () => {
    setWalletLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      const res = await fetch('/api/student/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch wallet')
      const data = await res.json()
      setWallet(data.balance ?? data.wallet ?? 0)
    } catch (e) {
      setWallet(0)
    } finally {
      setWalletLoading(false)
    }
  }

  const handleAddCash = async () => {
    if (typeof addAmount !== 'number' || addAmount <= 0) return
    setAddLoading(true)
    setAddError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      const res = await fetch('/api/student/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: addAmount })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to add cash')
      }
      setAddAmount('')
      setShowAddCash(false)
      fetchWallet()
    } catch (e: any) {
      setAddError(e.message || 'Failed to add cash')
    } finally {
      setAddLoading(false)
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

  if (loading || walletLoading) {
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
      {/* Wallet Card */}
      <div className="bg-blue-600 text-white rounded-lg shadow-md p-6 mb-6 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold mb-1">Available Balance</div>
          <div className="text-3xl font-bold flex items-center"><FaRupeeSign className="mr-1" />{wallet.toFixed(2)}</div>
        </div>
        <button
          className="bg-white text-blue-700 font-bold px-4 py-2 rounded-lg shadow hover:bg-blue-100 transition"
          onClick={() => setShowAddCash(true)}
        >
          + Add Cash
        </button>
      </div>
      {/* Add Cash Dialog */}
      {showAddCash && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add Cash</h2>
            <input
              type="number"
              placeholder="Enter amount"
              value={addAmount}
              onChange={e => setAddAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full p-2 border rounded mb-4"
              min={1}
            />
            {addError && <div className="text-red-500 mb-2 text-sm">{addError}</div>}
            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:bg-gray-400"
                onClick={handleAddCash}
                disabled={addLoading || typeof addAmount !== 'number' || addAmount <= 0}
              >
                {addLoading ? 'Adding...' : 'Add'}
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold"
                onClick={() => setShowAddCash(false)}
                disabled={addLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
      <QuestionOfTheDay />
    </div>
  )
} 