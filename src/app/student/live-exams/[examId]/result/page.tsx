'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FaTrophy, FaClock, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaRupeeSign, FaMedal, FaStar, FaChartLine, FaAward, FaCertificate } from 'react-icons/fa'
import { GiTrophyCup, GiLaurelCrown, GiTargetArrows } from 'react-icons/gi'
import { MdEmojiEvents, MdSpeed, MdCheckCircle } from 'react-icons/md'

interface ExamResult {
  score: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  unattempted: number
  examDuration: number
  timeTakenSeconds: number
  timeTakenMinutes: number
  timeTakenFormatted: string
  currentRank: number
  prizeAmount: number
  accuracy: number
  timeEfficiency: number
  examTitle: string
  completedAt: string
  message: string
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

export default function LiveExamResultPage() {
  const router = useRouter()
  const params = useParams()
  const examId = typeof params.examId === "string" ? params.examId : Array.isArray(params.examId) ? params.examId[0] : ""
  
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animateScore, setAnimateScore] = useState(false)
  const [improvementData, setImprovementData] = useState<ImprovementData | null>(null)
  const [showImproveModal, setShowImproveModal] = useState(false)
  const [loadingImprovements, setLoadingImprovements] = useState(false)

  useEffect(() => {
    if (!examId) return
    fetchResult()
  }, [examId])

  useEffect(() => {
    // Trigger score animation after component mounts
    setTimeout(() => setAnimateScore(true), 500)
  }, [])

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Fetch result from localStorage or API
      const storedResult = localStorage.getItem(`liveExamResult_${examId}`)
      if (storedResult) {
        setResult(JSON.parse(storedResult))
        setLoading(false)
        return
      }

      // If not in localStorage, fetch from API
      const resultRes = await fetch(`/api/student/live-exams/${examId}/attempts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!resultRes.ok) {
        setError('Result not found')
        setLoading(false)
        return
      }
      
      const resultData = await resultRes.json()
      setResult(resultData)
      setLoading(false)
    } catch (err) {
      setError('Failed to load result')
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 80) return 'bg-blue-100'
    if (score >= 70) return 'bg-yellow-100'
    if (score >= 60) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🏆'
    if (score >= 80) return '🥇'
    if (score >= 70) return '🥈'
    if (score >= 60) return '🥉'
    return '📚'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Outstanding Performance!'
    if (score >= 80) return 'Excellent Work!'
    if (score >= 70) return 'Good Job!'
    if (score >= 60) return 'Well Done!'
    return 'Keep Practicing!'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <GiTrophyCup className="text-yellow-500 text-4xl" />
    if (rank === 2) return <FaMedal className="text-gray-400 text-4xl" />
    if (rank === 3) return <FaMedal className="text-orange-500 text-4xl" />
    return <FaStar className="text-blue-500 text-3xl" />
  }

  const fetchImprovementSuggestions = async () => {
    try {
      setLoadingImprovements(true)
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
    } finally {
      setLoadingImprovements(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error || 'Result not found'}</p>
          <Link href="/student/dashboard" className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-200 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 right-32 w-12 h-12 bg-yellow-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">{getScoreEmoji(result.score)}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{getScoreMessage(result.score)}</h1>
          <p className="text-gray-600">{result.examTitle}</p>
          <p className="text-sm text-gray-500">Completed on {new Date(result.completedAt).toLocaleString()}</p>
        </div>

        {/* Main Score Display */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className={`w-40 h-40 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center shadow-2xl transform transition-all duration-1000 ${animateScore ? 'scale-110' : 'scale-100'}`}>
              <div className="text-center text-white">
                <div className="text-5xl font-bold mb-2">{result.score.toFixed(1)}%</div>
                <div className="text-lg opacity-90">Score</div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className={`w-10 h-10 rounded-full ${getScoreBgColor(result.score)} flex items-center justify-center`}>
                <div className={`text-sm font-bold ${getScoreColor(result.score)}`}>
                  {result.score >= 80 ? 'A' : result.score >= 60 ? 'B' : result.score >= 40 ? 'C' : 'D'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rank and Prize Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            {getRankIcon(result.currentRank)}
            <div className="ml-4 text-center">
              <h3 className="text-2xl font-bold text-gray-900">Rank #{result.currentRank}</h3>
              <p className="text-gray-600">Out of all participants</p>
            </div>
          </div>
          
          {result.prizeAmount > 0 && (
            <div className="text-center">
              <div className="inline-flex items-center bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-3 rounded-full">
                <FaRupeeSign className="mr-2" />
                <span className="text-xl font-bold">{result.prizeAmount}</span>
                <span className="ml-2">Prize Won!</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-xl border border-white/20 transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl text-green-500 mb-2">
              <FaCheckCircle />
            </div>
            <div className="text-2xl font-bold text-gray-900">{result.correctAnswers}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-xl border border-white/20 transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl text-red-500 mb-2">
              <FaTimesCircle />
            </div>
            <div className="text-2xl font-bold text-gray-900">{result.wrongAnswers}</div>
            <div className="text-sm text-gray-600">Wrong</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-xl border border-white/20 transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl text-gray-500 mb-2">
              <FaQuestionCircle />
            </div>
            <div className="text-2xl font-bold text-gray-900">{result.unattempted}</div>
            <div className="text-sm text-gray-600">Unattempted</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-xl border border-white/20 transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl text-blue-500 mb-2">
              <FaClock />
            </div>
            <div className="text-lg font-bold text-gray-900">{result.timeTakenFormatted}</div>
            <div className="text-sm text-gray-600">Time Taken</div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center mb-4">
              <MdCheckCircle className="text-3xl text-green-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Accuracy</h3>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">{result.accuracy}%</div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${result.accuracy}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center mb-4">
              <MdSpeed className="text-3xl text-blue-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Time Efficiency</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{result.timeEfficiency}%</div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(result.timeEfficiency, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Exam Details */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <GiTargetArrows className="mr-2 text-purple-500" />
            Exam Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Questions</div>
              <div className="font-bold text-gray-900">{result.totalQuestions}</div>
            </div>
            <div>
              <div className="text-gray-600">Exam Duration</div>
              <div className="font-bold text-gray-900">{result.examDuration} mins</div>
            </div>
            <div>
              <div className="text-gray-600">Time Used</div>
              <div className="font-bold text-gray-900">{result.timeTakenMinutes} mins</div>
            </div>
            <div>
              <div className="text-gray-600">Time Saved</div>
              <div className="font-bold text-gray-900">{Math.max(0, result.examDuration - result.timeTakenMinutes)} mins</div>
            </div>
          </div>
        </div>

        {/* Improvement Suggestions Card */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-3xl shadow-xl border border-purple-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">🚀 Improve Your Performance</h3>
                <p className="text-sm text-gray-600">Get personalized suggestions for future live exams</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-purple-200">
            <p className="text-gray-700 mb-4">
              Want to improve your rank in future live exams? Get actionable suggestions based on your performance.
            </p>
            <button
              onClick={fetchImprovementSuggestions}
              disabled={loadingImprovements}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loadingImprovements ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  <span>Loading suggestions...</span>
                </>
              ) : (
                <>
                  <FaChartLine className="mr-2" />
                  <span>Get Improvement Suggestions</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
          <Link 
            href={`/student/live-exams/${examId}/certificate`}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
          >
            <FaCertificate className="mr-2" />
            View Certificate
          </Link>
          <Link 
            href={`/student/live-exams/${examId}`}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
          >
            <MdEmojiEvents className="mr-2" />
            View Leaderboard
          </Link>
          
          <Link 
            href="/student/dashboard"
            className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-purple-600 flex items-center justify-center"
          >
            <FaAward className="mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Success Message */}
        <div className="text-center mt-8">
          <div className="bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-full inline-block">
            <FaStar className="inline mr-2" />
            {result.message}
          </div>
        </div>
      </div>

      {/* Improve Performance Modal */}
      {showImproveModal && improvementData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">🚀 Improve Your Performance</h2>
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
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
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
                  <p className="text-gray-600">{improvementData.message || 'Complete more exams to get personalized improvement suggestions'}</p>
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