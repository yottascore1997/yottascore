'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface ExamResult {
  score: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  unattempted: number
  totalMarks: number
  earnedMarks: number
  answers: Record<string, number>
  completedAt: string
}

interface Question {
  id: string
  text: string
  options: string[]
  correct: number
  marks: number
}

interface Exam {
  id: string
  title: string
  category: string
  subcategory: string
}

interface RankPreview {
  hasEnoughData: boolean
  projectedScore?: number
  rankRange?: [number, number]
  performanceIndex?: number
  breakdown?: {
    accuracy: number
    attemptRatio: number
    speedScore: number
    consistency: number
  }
  disclaimer?: string
  message?: string
  requiredAttempts?: number
  currentAttempts?: number
}

interface ImprovementSuggestion {
  area: string
  current: number
  target: number
  improvement: number
  priority: 'high' | 'medium' | 'low'
  action: string
}

interface ImprovementData {
  hasEnoughData: boolean
  suggestions: ImprovementSuggestion[]
  summary?: {
    totalAreas: number
    avgImprovement: number
    estimatedRankImprovement: string
  }
  nextSteps?: string[]
  message?: string
}

export default function PracticeExamResultPage() {
  const router = useRouter()
  const params = useParams()
  const examId = typeof params.examId === "string" ? params.examId : Array.isArray(params.examId) ? params.examId[0] : ""
  
  const [result, setResult] = useState<ExamResult | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rankPreview, setRankPreview] = useState<RankPreview | null>(null)
  const [improvementData, setImprovementData] = useState<ImprovementData | null>(null)
  const [showImproveModal, setShowImproveModal] = useState(false)
  const [loadingRankPreview, setLoadingRankPreview] = useState(false)

  useEffect(() => {
    if (!examId) return
    fetchResult()
  }, [examId])

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Fetch exam details
      const examRes = await fetch(`/api/student/practice-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (examRes.ok) {
        const examData = await examRes.json()
        setExam(examData)
      }

      // Fetch result
      const resultRes = await fetch(`/api/student/practice-exams/${examId}/attempts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!resultRes.ok) {
        setError('Result not found')
        setLoading(false)
        return
      }
      const resultData = await resultRes.json()
      setResult(resultData)

      // Fetch questions for detailed analysis
      const questionsRes = await fetch(`/api/student/practice-exams/${examId}/questions-with-answers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json()
        setQuestions(questionsData)
      }

      setLoading(false)
      
      // Fetch rank preview after result is loaded
      fetchRankPreview()
    } catch (err) {
      setError('Failed to load result')
      setLoading(false)
    }
  }

  const fetchRankPreview = async () => {
    try {
      setLoadingRankPreview(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('/api/student/performance/rank-preview?examType=DEFAULT', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setRankPreview(data)
      }
    } catch (err) {
      console.error('Failed to fetch rank preview:', err)
    } finally {
      setLoadingRankPreview(false)
    }
  }

  const fetchImprovementSuggestions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('/api/student/performance/improvement-suggestions', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setImprovementData(data)
        setShowImproveModal(true)
      }
    } catch (err) {
      console.error('Failed to fetch improvement suggestions:', err)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    if (score >= 40) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🎉'
    if (score >= 60) return '👍'
    if (score >= 40) return '😐'
    return '😔'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Excellent! You did amazing!'
    if (score >= 60) return 'Good job! Keep practicing!'
    if (score >= 40) return 'Not bad! Room for improvement.'
    return 'Keep studying! You can do better!'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Result Not Found</h3>
          <p className="text-gray-500 mb-4">{error || 'Unable to load your exam result'}</p>
          <Link 
            href={`/student/practice-exams/${examId}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Exam
          </Link>
        </div>
      </div>
    )
  }

  const accuracy = result.totalQuestions > 0 ? (result.correctAnswers / result.totalQuestions) * 100 : 0
  const completionRate = result.totalQuestions > 0 ? ((result.correctAnswers + result.wrongAnswers) / result.totalQuestions) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam?.title || 'Practice Exam'}</h1>
              <p className="text-gray-600">{exam?.category} • {exam?.subcategory}</p>
            </div>
            <Link 
              href={`/student/practice-exams/${examId}`}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Exam
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Score Summary Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{getScoreEmoji(result.score)}</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{getScoreMessage(result.score)}</h2>
            <p className="text-gray-600">Completed on {new Date(result.completedAt).toLocaleString()}</p>
          </div>

          {/* Main Score Display */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <div className="text-center text-white">
                  <div className="text-3xl font-bold">{result.score.toFixed(1)}%</div>
                  <div className="text-sm opacity-90">Score</div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className={`w-6 h-6 rounded-full ${getScoreBgColor(result.score)} flex items-center justify-center`}>
                  <div className={`text-xs font-bold ${getScoreColor(result.score)}`}>
                    {result.score >= 80 ? 'A' : result.score >= 60 ? 'B' : result.score >= 40 ? 'C' : 'D'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
              <div className="text-sm text-green-700">Correct</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{result.wrongAnswers}</div>
              <div className="text-sm text-red-700">Wrong</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{result.unattempted}</div>
              <div className="text-sm text-gray-700">Unattempted</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{result.totalQuestions}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
          </div>

          {/* Marks Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">Marks Earned</div>
                <div className="text-2xl font-bold text-blue-600">{result.earnedMarks} / {result.totalMarks}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Accuracy</div>
                <div className="text-2xl font-bold text-green-600">{accuracy.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Accuracy Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Performance Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Correct Answers</span>
                  <span className="font-semibold">{result.correctAnswers} ({accuracy.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${accuracy}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Wrong Answers</span>
                  <span className="font-semibold">{result.wrongAnswers} ({((result.wrongAnswers / result.totalQuestions) * 100).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(result.wrongAnswers / result.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Unattempted</span>
                  <span className="font-semibold">{result.unattempted} ({((result.unattempted / result.totalQuestions) * 100).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gray-400 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(result.unattempted / result.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Completion Rate</span>
                </div>
                <span className="font-bold text-blue-600">{completionRate.toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Success Rate</span>
                </div>
                <span className="font-bold text-green-600">{accuracy.toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Time Taken</span>
                </div>
                <span className="font-bold text-purple-600">~{Math.ceil(result.totalQuestions * 1.5)} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Question Analysis */}
        {questions.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">🔍 Question Analysis</h3>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const userAnswer = result.answers[question.id]
                const isCorrect = userAnswer === question.correct
                const isAttempted = userAnswer !== undefined
                
                return (
                  <div 
                    key={question.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : isAttempted 
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                        isCorrect ? 'bg-green-500' : isAttempted ? 'bg-red-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">{question.text}</div>
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div 
                              key={optIndex}
                              className={`flex items-center space-x-2 text-sm ${
                                optIndex === question.correct 
                                  ? 'text-green-700 font-semibold' 
                                  : optIndex === userAnswer 
                                  ? 'text-red-700 font-semibold'
                                  : 'text-gray-600'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                optIndex === question.correct 
                                  ? 'border-green-500 bg-green-100' 
                                  : optIndex === userAnswer 
                                  ? 'border-red-500 bg-red-100'
                                  : 'border-gray-300'
                              }`}>
                                {optIndex === question.correct && (
                                  <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {optIndex === userAnswer && optIndex !== question.correct && (
                                  <svg className="w-2 h-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span>{option}</span>
                              {optIndex === question.correct && (
                                <span className="text-green-600 font-medium">✓ Correct</span>
                              )}
                              {optIndex === userAnswer && optIndex !== question.correct && (
                                <span className="text-red-600 font-medium">✗ Your Answer</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Marks: {question.marks} • {isCorrect ? 'Correct' : isAttempted ? 'Incorrect' : 'Unattempted'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Future Rank Preview Card */}
        {rankPreview && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-3xl shadow-xl border border-purple-200 p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">🔮 Future Rank Preview</h3>
                  <p className="text-sm text-gray-600">Based on your current performance trends</p>
                </div>
              </div>
            </div>

            {loadingRankPreview ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            ) : rankPreview.hasEnoughData ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-4">Agar aap isi tarah padhte rahe, real exam me expected rank:</p>
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      {rankPreview.rankRange?.[0].toLocaleString()} – {rankPreview.rankRange?.[1].toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">Projected Score: {rankPreview.projectedScore}%</p>
                  </div>
                </div>

                {rankPreview.breakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/60 rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-purple-600">{rankPreview.breakdown.accuracy}%</div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-indigo-600">{rankPreview.breakdown.attemptRatio}%</div>
                      <div className="text-xs text-gray-600">Attempt Rate</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-blue-600">{rankPreview.breakdown.speedScore}%</div>
                      <div className="text-xs text-gray-600">Speed Score</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-green-600">{rankPreview.breakdown.consistency}%</div>
                      <div className="text-xs text-gray-600">Consistency</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={fetchImprovementSuggestions}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  👉 Improve Rank
                </button>

                <p className="text-xs text-gray-500 text-center italic">
                  {rankPreview.disclaimer}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-purple-200 text-center">
                <p className="text-gray-600 mb-2">{rankPreview.message}</p>
                <p className="text-sm text-gray-500">
                  Complete {rankPreview.requiredAttempts || 5} practice exams to get rank prediction
                  {rankPreview.currentAttempts !== undefined && (
                    <span className="block mt-1">Current: {rankPreview.currentAttempts} attempts</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link 
            href={`/student/practice-exams/${examId}?tab=leaderboard`}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            View Leaderboard
          </Link>
          <Link 
            href="/student/practice-exams"
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 text-center"
          >
            Browse More Exams
          </Link>
        </div>
      </div>

      {/* Improve Rank Modal */}
      {showImproveModal && improvementData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">🚀 Improve Your Rank</h2>
                <button
                  onClick={() => setShowImproveModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {improvementData.hasEnoughData ? (
                <>
                  {improvementData.summary && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-gray-700">
                        <strong>Summary:</strong> {improvementData.summary.totalAreas} areas need improvement. 
                        Average improvement needed: {improvementData.summary.avgImprovement}%
                      </p>
                    </div>
                  )}

                  {improvementData.suggestions.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Actionable Steps:</h3>
                      {improvementData.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`border-2 rounded-xl p-5 ${
                            suggestion.priority === 'high'
                              ? 'border-red-200 bg-red-50'
                              : suggestion.priority === 'medium'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-blue-200 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{suggestion.area}</h4>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    suggestion.priority === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : suggestion.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {suggestion.priority.toUpperCase()} PRIORITY
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{suggestion.action}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Current</div>
                              <div className="font-semibold text-gray-900">{suggestion.current}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Target</div>
                              <div className="font-semibold text-green-600">{suggestion.target}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Improve</div>
                              <div className="font-semibold text-purple-600">+{suggestion.improvement}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Great Job!</h3>
                      <p className="text-gray-600">You're performing well. Keep maintaining your current performance!</p>
                    </div>
                  )}

                  {improvementData.nextSteps && improvementData.nextSteps.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">📋 Next Steps:</h3>
                      <ul className="space-y-2">
                        {improvementData.nextSteps.map((step, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                            <span className="text-purple-600 font-bold mt-1">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">{improvementData.message}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setShowImproveModal(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
              >
                Got it! Let's Improve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 