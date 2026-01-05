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

interface QuestionBankItem {
  id: string
  text: string
  options: string[]
  correct: number
  explanation?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: {
    id: string
    name: string
    color: string
  }
}

interface Category {
  id: string
  name: string
  _count: {
    questions: number
  }
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

  // Question Bank import states
  const [showImportModal, setShowImportModal] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [questionBankQuestions, setQuestionBankQuestions] = useState<QuestionBankItem[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingQuestionBank, setLoadingQuestionBank] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [])

  useEffect(() => {
    if (showImportModal) {
      fetchCategories()
    }
  }, [showImportModal])

  useEffect(() => {
    if (selectedCategoryId && showImportModal) {
      fetchQuestionBankQuestions(selectedCategoryId)
    }
  }, [selectedCategoryId, showImportModal])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch("/api/admin/question-categories", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setCategories(data)
        if (data.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(data[0].id)
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchQuestionBankQuestions = async (categoryId: string) => {
    try {
      setLoadingQuestionBank(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`/api/admin/question-bank?categoryId=${categoryId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setQuestionBankQuestions(data)
      }
    } catch (err) {
      console.error("Failed to fetch question bank questions:", err)
      setQuestionBankQuestions([])
    } finally {
      setLoadingQuestionBank(false)
    }
  }

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

  const handleUseQuestionFromBank = async (questionBankItem: QuestionBankItem) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Convert QuestionBankItem format to QuestionOfTheDay format
      const questionOfTheDay = {
        question: questionBankItem.text,
        options: questionBankItem.options,
        correct: questionBankItem.correct !== undefined && questionBankItem.correct !== null ? questionBankItem.correct : 0,
        timeLimit: 10 // Default time limit
      }

      const response = await fetch('/api/admin/question-of-the-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(questionOfTheDay)
      })

      if (!response.ok) {
        throw new Error('Failed to add question')
      }

      setShowImportModal(false)
      fetchQuestions()
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add question from Question Bank')
    }
  }

  const handlePickRandomQuestion = () => {
    if (questionBankQuestions.length === 0) {
      setError('No questions available in the selected category')
      return
    }

    // Pick a random question
    const randomIndex = Math.floor(Math.random() * questionBankQuestions.length)
    const randomQuestion = questionBankQuestions[randomIndex]
    handleUseQuestionFromBank(randomQuestion)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading questions...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Questions</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchQuestions}
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
                Question of the Day
              </h1>
              <p className="text-gray-600 mt-1">Manage daily questions for student engagement</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Import from Question Bank</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add New Question</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Questions</p>
                <p className="text-3xl font-bold text-gray-800">{questions.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Questions</p>
                <p className="text-3xl font-bold text-gray-800">{questions.filter(q => q.isActive).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Inactive Questions</p>
                <p className="text-3xl font-bold text-gray-800">{questions.filter(q => !q.isActive).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Grid */}
        {questions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {questions.map((q) => (
              <div key={q.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
                <div className={`h-2 ${q.isActive ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {q.question}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {q.timeLimit}s
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      q.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {q.isActive ? '🔴 Active' : '⏸️ Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {q.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          index === q.correct 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                            index === q.correct 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="line-clamp-2">{option}</span>
                          {index === q.correct && (
                            <svg className="w-5 h-5 text-green-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleToggleActive(q.id, q.isActive)}
                    className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                      q.isActive
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {q.isActive ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    <span>{q.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Yet</h3>
            <p className="text-gray-500 mb-6">Create your first question of the day to engage students</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Create First Question
            </button>
          </div>
        )}
      </div>

      {/* Import from Question Bank Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Import from Question Bank</h2>
                  <p className="text-sm text-gray-600 mt-1">Select a category and choose a question from your Question Bank</p>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setSelectedCategoryId('')
                    setQuestionBankQuestions([])
                  }}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Category</label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  disabled={loadingCategories}
                >
                  <option value="">Select a category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category._count.questions} questions)
                    </option>
                  ))}
                </select>
              </div>

              {/* Pick Random Button */}
              {selectedCategoryId && questionBankQuestions.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handlePickRandomQuestion}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Pick Random Question</span>
                  </button>
                </div>
              )}

              {/* Questions List */}
              {loadingQuestionBank ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                  <span className="ml-4 text-gray-600">Loading questions...</span>
                </div>
              ) : selectedCategoryId && questionBankQuestions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Found</h3>
                  <p className="text-gray-600">This category doesn't have any questions yet.</p>
                </div>
              ) : selectedCategoryId && questionBankQuestions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Available Questions ({questionBankQuestions.length})
                    </h3>
                  </div>
                  {questionBankQuestions.map((q) => (
                    <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium mb-3">{q.text}</p>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {q.options.map((option, index) => (
                              <div
                                key={index}
                                className={`p-2 rounded-lg text-sm ${
                                  index === q.correct
                                    ? 'bg-green-50 border border-green-200 text-green-800'
                                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className="font-medium">{String.fromCharCode(65 + index)}. </span>
                                {option}
                                {index === q.correct && (
                                  <svg className="w-4 h-4 text-green-500 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                          )}
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              q.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                              q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {q.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">{q.category.name}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUseQuestionFromBank(q)}
                        className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Use as Question of the Day</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-600">Please select a category to view questions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Add New Question</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows={4}
                  placeholder="Enter your question here..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Options</label>
                <div className="space-y-3">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options]
                          newOptions[index] = e.target.value
                          setNewQuestion({ ...newQuestion, options: newOptions })
                        }}
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {newQuestion.options.map((_, index) => (
                      <option key={index} value={index}>
                        Option {index + 1} ({String.fromCharCode(65 + index)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    min="1"
                    max="300"
                  />
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 