'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Question {
  id: string
  text: string
  options: string[]
  marks: number
  orderIndex: number
}

export default function PYQAttemptPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const examId = params.examId as string
  const attemptId = searchParams.get('attemptId')

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!examId || !attemptId) {
      router.push(`/student/pyq/${examId}`)
      return
    }
    const fetchQuestions = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      const res = await fetch(`/api/student/pyq/${examId}/questions?attemptId=${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        router.push(`/student/pyq/${examId}`)
        return
      }
      const data = await res.json()
      setQuestions(data)
      const dur = 60 * 60
      setTimeLeft(dur)
      setLoading(false)
    }
    fetchQuestions()
  }, [examId, attemptId, router])

  useEffect(() => {
    if (timeLeft === null) return
    const t = setInterval(() => {
      setTimeLeft((p) => (p !== null && p > 0 ? p - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  const handleOptionSelect = (qid: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    try {
      const duration = 60 * 60
      const elapsed = timeLeft !== null ? duration - timeLeft : duration
      const res = await fetch(`/api/student/pyq/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attemptId,
          answers,
          timeTakenSeconds: elapsed,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to submit')
        setSubmitting(false)
        return
      }
      router.push(`/student/pyq/${examId}/result/${attemptId}`)
    } catch {
      setError('Failed to submit')
      setSubmitting(false)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href={`/student/pyq/${examId}`} className="text-blue-600 hover:underline">← Back</Link>
          {timeLeft !== null && (
            <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
              Time: {formatTime(timeLeft)}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl shadow p-4">
              <p className="font-medium text-gray-900 mb-3">
                Q{idx + 1}. {q.text}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => (
                  <label
                    key={oIdx}
                    className={`flex items-center p-3 rounded-lg cursor-pointer border transition ${
                      answers[q.id] === oIdx
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={oIdx}
                      checked={answers[q.id] === oIdx}
                      onChange={() => handleOptionSelect(q.id, oIdx)}
                      className="mr-3"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {error && <div className="text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}
