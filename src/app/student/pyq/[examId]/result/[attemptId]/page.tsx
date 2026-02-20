'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function PYQResultPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string
  const attemptId = params.attemptId as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetch(`/api/student/pyq/${examId}/result/${attemptId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then(setData)
      .catch(() => router.push(`/student/pyq/${examId}`))
      .finally(() => setLoading(false))
  }, [examId, attemptId, router])

  if (loading || !data) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const { attempt, exam, questions } = data
  const accuracy = attempt.correctCount + attempt.wrongCount > 0
    ? Math.round((attempt.correctCount / (attempt.correctCount + attempt.wrongCount)) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href={`/student/pyq/${examId}`} className="text-blue-600 hover:underline mb-4 inline-block">← Back</Link>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-gray-600 mt-1">Result</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{attempt.score}/{attempt.totalMarks}</p>
              <p className="text-sm text-gray-600">Score</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{attempt.correctCount}</p>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{attempt.wrongCount}</p>
              <p className="text-sm text-gray-600">Wrong</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{accuracy}%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Solutions</h2>
          {questions.map((q: any, idx: number) => (
            <div key={q.id} className="bg-white rounded-xl shadow p-4">
              <p className="font-medium text-gray-900">Q{idx + 1}. {q.text}</p>
              <div className="mt-2 space-y-1">
                {q.options?.map((opt: string, oIdx: number) => (
                  <p
                    key={oIdx}
                    className={`text-sm ${
                      oIdx === q.correct
                        ? 'text-green-700 font-medium'
                        : oIdx === q.userSelected && oIdx !== q.correct
                          ? 'text-red-700'
                          : 'text-gray-600'
                    }`}
                  >
                    {String.fromCharCode(65 + oIdx)}. {opt}
                    {oIdx === q.correct && ' ✓'}
                    {oIdx === q.userSelected && oIdx !== q.correct && ' ✗ (Your answer)'}
                  </p>
                ))}
              </div>
              {q.explanation && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Explanation</p>
                  <p className="text-sm text-gray-600 mt-1">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href={`/student/pyq/${examId}`}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Try Again
          </Link>
          <Link
            href="/student/pyq/analysis"
            className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
          >
            View Analysis
          </Link>
        </div>
      </div>
    </div>
  )
}
