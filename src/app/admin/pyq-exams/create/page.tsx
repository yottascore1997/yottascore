'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const EXAM_TYPES = ['UPSC', 'SSC', 'JEE', 'NEET', 'Banking', 'CAT', 'State PSC', 'Other']

interface PYQQuestion {
  text: string
  options: string[]
  correct: number | null
  marks: number
  topic?: string
  explanation?: string
  difficulty?: string
}

export default function CreatePYQPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    examType: 'UPSC',
    year: new Date().getFullYear(),
    subject: '',
    paperType: '',
    duration: 60,
    totalMarks: 100,
  })
  const [questions, setQuestions] = useState<PYQQuestion[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string; _count?: { questions: number } }>>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch('/api/admin/question-categories', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
        if (data.length > 0 && !selectedCategoryId) setSelectedCategoryId(data[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleImportFromQuestionBank = async () => {
    if (!selectedCategoryId) {
      setError('Please select a category')
      return
    }
    if (questionCount < 1 || questionCount > 100) {
      setError('Enter 1-100 questions')
      return
    }
    setLoadingQuestions(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Not authenticated')
        return
      }
      const res = await fetch(`/api/admin/question-bank?categoryId=${selectedCategoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setError('Failed to fetch questions')
        setLoadingQuestions(false)
        return
      }
      const questionBankItems = await res.json()
      if (questionBankItems.length === 0) {
        setError('No questions in this category')
        setLoadingQuestions(false)
        return
      }
      const shuffled = [...questionBankItems].sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, Math.min(questionCount, questionBankItems.length))
      const converted: PYQQuestion[] = selected.map((q: any) => ({
        text: q.text || '',
        options: Array.isArray(q.options) ? q.options : [],
        correct: q.correct !== undefined && q.correct !== null ? q.correct : null,
        marks: 1,
        topic: Array.isArray(q.tags) ? q.tags[0] : (q.category?.name || null),
        explanation: q.explanation || undefined,
        difficulty: q.difficulty || undefined,
      }))
      const shouldAppend = questions.length > 0 && window.confirm(
        `You have ${questions.length} questions. Add these ${converted.length}? (OK=append, Cancel=replace)`
      )
      if (shouldAppend) {
        setQuestions([...questions, ...converted])
        setSuccess(`Added ${converted.length} questions. Total: ${questions.length + converted.length}`)
      } else {
        setQuestions(converted)
        setSuccess(`Imported ${converted.length} questions`)
      }
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to import')
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((p) => p.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.title || !form.examType || !form.year) {
      setError('Title, exam type and year required')
      return
    }
    if (questions.length === 0) {
      setError('Add at least 1 question from Question Bank')
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Not authenticated')
        setLoading(false)
        return
      }
      const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0)
      const res = await fetch('/api/admin/pyq-exams', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          totalMarks: form.totalMarks || totalMarks,
          questions: questions.map((q) => ({
            text: q.text,
            options: q.options,
            correct: q.correct,
            marks: q.marks,
            topic: q.topic,
            explanation: q.explanation,
            difficulty: q.difficulty,
          })),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to create')
        setLoading(false)
        return
      }
      setSuccess('PYQ exam created!')
      setTimeout(() => router.push('/admin/pyq-exams'), 1500)
    } catch {
      setError('Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create PYQ (Previous Year Paper)</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Exam Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. UPSC CSE Prelims 2024"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.examType}
                  onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value }))}
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  required
                  min={2000}
                  max={2030}
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) || 2024 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject (optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. General Studies"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paper Type (optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Prelims, Mains, etc."
                  value={form.paperType}
                  onChange={(e) => setForm((f) => ({ ...f, paperType: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min={5}
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: parseInt(e.target.value) || 60 }))}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Import from Question Bank</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a category and number of questions. Topic, explanation and difficulty from Question Bank will be used for analysis.
            </p>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c._count?.questions ?? 0})</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="w-full px-3 py-2 border rounded-lg"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                />
              </div>
              <button
                type="button"
                onClick={handleImportFromQuestionBank}
                disabled={loadingQuestions || !selectedCategoryId}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loadingQuestions ? 'Loading...' : 'Import'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {questions.length} questions added
            </p>
          </div>

          {questions.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Questions ({questions.length})</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {questions.map((q, idx) => (
                  <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-2 flex-1 mr-2">
                      {idx + 1}. {q.text?.slice(0, 80)}...
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || questions.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating...' : 'Create PYQ'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/pyq-exams')}
              className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
