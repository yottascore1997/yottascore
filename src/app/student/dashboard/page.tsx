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
  imageUrl?: string
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Battle Quizzes</h2>
          <p className="text-gray-600">Join live competitions and win prizes</p>
        </div>
        <Link href="/student/battle-quiz" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>View All</span>
        </Link>
      </div>
      
      {quizzes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const isUpcoming = new Date(quiz.startTime) > new Date();
            const isExpired = new Date(quiz.startTime) < new Date();
            
            return (
              <div key={quiz.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
                <div className={`h-2 ${
                  isExpired 
                    ? 'bg-gradient-to-r from-red-400 to-red-500' 
                    : isUpcoming 
                      ? 'bg-gradient-to-r from-green-400 to-green-500'
                      : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                }`}></div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      {quiz.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={quiz.imageUrl}
                            alt={`${quiz.title} logo`}
                            className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white p-2"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {quiz.title}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">{quiz.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isExpired 
                        ? 'bg-red-100 text-red-700' 
                        : isUpcoming 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isExpired ? '⏰ Expired' : isUpcoming ? '🔴 Live' : '⏳ Soon'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Available Spots</span>
                      <span className="font-semibold text-gray-700">{quiz.spotsLeft}/{quiz.spots}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((quiz.spots - quiz.spotsLeft) / quiz.spots) * 100}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-gray-500 text-xs">Entry Fee</p>
                        <p className="font-bold text-gray-800">₹{quiz.entryFee}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-gray-500 text-xs">Prize Pool</p>
                        <p className="font-bold text-gray-800">₹{quiz.prizePool}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {quiz.duration} mins
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDistanceToNow(new Date(quiz.startTime), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleJoinQuiz(quiz.id)}
                    disabled={!quiz.isLive || quiz.spotsLeft === 0}
                    className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                      quiz.spotsLeft === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : quiz.isLive
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{quiz.spotsLeft === 0 ? 'Full' : quiz.isLive ? 'Join Now' : 'Coming Soon'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Battle Quizzes Available</h3>
          <p className="text-gray-500 mb-6">Check back later for exciting competitions</p>
          <Link href="/student/battle-quiz" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
            Browse All Quizzes
          </Link>
        </div>
      )}
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
      console.log('Question data received:', data);
      console.log('Selected option:', data.selectedOption);
      console.log('Correct answer:', data.correctAnswer);
      console.log('Is correct:', data.isCorrect);
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
    setIsCorrect(index === question.correct)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      await fetch('/api/student/question-of-the-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption: index
        })
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  if (loading) {
    return (
      <div className="mt-8">
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question of the day...</p>
        </div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="mt-8">
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Question Available</h3>
          <p className="text-gray-500">Check back tomorrow for a new question</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Question of the Day</h2>
              <p className="text-yellow-100">Test your knowledge daily</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {question.hasAttempted ? (
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                question.isCorrect ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-8 h-8 ${question.isCorrect ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={question.isCorrect ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M6 18L18 6M6 6l12 12"} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {question.isCorrect ? 'Correct Answer!' : 'Incorrect Answer!'}
              </h3>
              <p className="text-gray-500 mb-4">You've already answered today's question. Come back tomorrow!</p>
              
              {/* Show question and answers */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-gray-700 mb-4 text-left">{question.question}</p>
                
                <div className="space-y-2">
                  {question.options.map((option: string, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 text-left ${
                        index === question.selectedOption
                          ? question.isCorrect
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                          : index === question.correctAnswer
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === question.selectedOption
                            ? question.isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                            : index === question.correctAnswer
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span>{option}</span>
                        {index === question.selectedOption && (
                          <span className="ml-auto text-sm font-medium">
                            {question.isCorrect ? '✅ Your Answer (Correct)' : '❌ Your Answer'}
                          </span>
                        )}
                        {index === question.correctAnswer && index !== question.selectedOption && (
                          <span className="ml-auto text-sm font-medium text-green-600">✅ Correct Answer</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-6 text-lg">{question.question}</p>
              <button
                onClick={handleViewQuestion}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-medium hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Answer Question</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Question Modal */}
      {showModal && question && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Question of the Day</h2>
                  <p className="text-gray-500">Time remaining: {timeLeft}s</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-lg text-gray-800 mb-6">{question.question}</p>
              
              <div className="space-y-3 mb-6">
                {question.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleSelectOption(index)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedOption === index
                        ? isCorrect
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                        selectedOption === index
                          ? isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{option}</span>
                      {selectedOption === index && (
                        <svg className={`w-5 h-5 ml-auto ${isCorrect ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCorrect ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {isAnswered && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? '✅ Correct!' : '❌ Incorrect!'}
                  </p>
                  <p className="text-gray-600 mt-1">
                    The correct answer was: {question.options[question.correct]}
                  </p>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DailyQuoteCard() {
  const [quote, setQuote] = useState<{ text: string; author: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    fetch('/api/student/quotes/today', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setQuote({ text: data.text, author: data.author ?? null }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mt-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-3 bg-gray-100 rounded w-full mb-2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!quote) return null

  return (
    <div className="mt-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Quote of the Day</h2>
              <p className="text-indigo-100">Stay motivated</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-800 text-lg italic">&ldquo;{quote.text}&rdquo;</p>
          {quote.author && (
            <p className="text-gray-500 mt-3">— {quote.author}</p>
          )}
        </div>
      </div>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Student Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back! Ready to learn and compete?</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Time</p>
                <p className="font-semibold text-gray-700">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Wallet Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 mb-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold mb-1 text-blue-100">Available Balance</div>
                <div className="text-4xl font-bold flex items-center">
                  <FaRupeeSign className="mr-2" />
                  {wallet.toFixed(2)}
                </div>
                <p className="text-blue-100 mt-2">Ready to join competitions!</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <button
              className="mt-4 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
              onClick={() => setShowAddCash(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Cash</span>
            </button>
          </div>
        </div>

        {/* Add Cash Modal */}
        {showAddCash && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Add Cash</h2>
                  <button
                    onClick={() => setShowAddCash(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={addAmount}
                      onChange={e => setAddAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      min={1}
                    />
                  </div>
                  
                  {addError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-red-600 text-sm">{addError}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                      onClick={handleAddCash}
                      disabled={addLoading || typeof addAmount !== 'number' || addAmount <= 0}
                    >
                      {addLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Adding...</span>
                        </div>
                      ) : (
                        'Add Cash'
                      )}
                    </button>
                    <button
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                      onClick={() => setShowAddCash(false)}
                      disabled={addLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quote of the Day */}
        <DailyQuoteCard />

        {/* Battle Quizzes Section */}
        <BattleQuizList />

        {/* Question of the Day Section */}
        <QuestionOfTheDay />
      </div>
    </div>
  )
} 