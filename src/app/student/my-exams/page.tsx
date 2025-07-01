'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Award,
  Target,
  TrendingUp,
  FileText,
  Zap,
  Star
} from 'lucide-react'

interface ExamAttempt {
  id: string
  examId: string
  examName: string
  examType: 'LIVE' | 'PRACTICE' | 'BATTLE'
  score: number
  totalQuestions: number
  correctAnswers: number
  timeTaken: number
  completedAt: string
  status: 'COMPLETED' | 'IN_PROGRESS' | 'ABANDONED'
  examImageUrl?: string
  category?: string
  subcategory?: string
  isWinner?: boolean
  matchId?: string
}

export default function MyExamsPage() {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'PRACTICE' | 'BATTLE'>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'type'>('date')
  const router = useRouter()

  useEffect(() => {
    fetchAttempts()
  }, [])

  const fetchAttempts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/student/my-exams', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch exam attempts')
      }

      const data = await response.json()
      setAttempts(data)
    } catch (error) {
      setError('Failed to fetch exam attempts')
    } finally {
      setLoading(false)
    }
  }

  const filteredAttempts = attempts.filter(attempt => {
    if (filter === 'ALL') return true
    return attempt.examType === filter
  })

  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      case 'score':
        return b.score - a.score
      case 'type':
        return a.examType.localeCompare(b.examType)
      default:
        return 0
    }
  })

  const getExamTypeIcon = (type: string) => {
    switch (type) {
      case 'LIVE':
        return <BookOpen className="w-5 h-5" />
      case 'PRACTICE':
        return <Trophy className="w-5 h-5" />
      case 'BATTLE':
        return <Zap className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'LIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PRACTICE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'BATTLE':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your exam history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Exams</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={fetchAttempts}
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
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Exams</h1>
              <p className="text-gray-600">Track your exam performance and results</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{attempts.length}</div>
                <div className="text-sm text-gray-500">Total Attempts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {attempts.filter(a => a.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0}%
                </div>
                <div className="text-sm text-gray-500">Avg Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {attempts.filter(a => a.examType === 'BATTLE' && a.isWinner).length}
                </div>
                <div className="text-sm text-gray-500">Battle Wins</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              {(['ALL', 'LIVE', 'PRACTICE', 'BATTLE'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(type)}
                  className={`rounded-full ${
                    filter === type 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'type')}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exam Attempts */}
        <div className="space-y-4">
          {sortedAttempts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No exam attempts yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start taking exams to see your performance history and results here.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Button 
                  onClick={() => router.push('/student/live-exams')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Live Exams
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/student/practice-exams')}
                  className="border-gray-300 hover:border-blue-500"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Practice Exams
                </Button>
              </div>
            </div>
          ) : (
            sortedAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Exam Image */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {attempt.examImageUrl ? (
                        <img
                          src={attempt.examImageUrl}
                          alt={attempt.examName}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        getExamTypeIcon(attempt.examType)
                      )}
                    </div>

                    {/* Exam Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {attempt.examName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getExamTypeColor(attempt.examType)}`}>
                          {attempt.examType}
                        </span>
                        {attempt.status === 'COMPLETED' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Score: <span className={`font-semibold ${getScoreColor(attempt.score)}`}>{attempt.score}%</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {attempt.correctAnswers}/{attempt.totalQuestions} correct
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {formatTime(attempt.timeTaken)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {formatDate(attempt.completedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Additional Stats for Live Exams */}
                      {attempt.examType === 'LIVE' && attempt.category && (
                        <div className="mt-3 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Award className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-600">
                              Category: <span className="font-semibold text-blue-600">{attempt.category}</span>
                            </span>
                          </div>
                          {attempt.subcategory && (
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-600">
                                Subcategory: <span className="font-semibold text-green-600">{attempt.subcategory}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Battle Quiz Stats */}
                      {attempt.examType === 'BATTLE' && (
                        <div className="mt-3 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-gray-600">
                              Result: <span className={`font-semibold ${attempt.isWinner ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.isWinner ? 'Winner' : 'Runner-up'}
                              </span>
                            </span>
                          </div>
                          {attempt.category && (
                            <div className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-purple-500" />
                              <span className="text-sm text-gray-600">
                                Category: <span className="font-semibold text-purple-600">{attempt.category}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (attempt.examType === 'LIVE') {
                          router.push(`/student/live-exams/${attempt.examId}`)
                        } else if (attempt.examType === 'PRACTICE') {
                          router.push(`/student/practice-exams/${attempt.examId}`)
                        } else if (attempt.examType === 'BATTLE') {
                          router.push(`/student/battle-quiz/${attempt.examId}`)
                        }
                      }}
                      className="border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 