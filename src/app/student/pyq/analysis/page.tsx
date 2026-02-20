'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PYQAnalysisPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetch('/api/student/pyq/analysis', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center">Failed to load</div>

  const { summary, byTopic, weakTopics, recentAttempts } = data

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/student/pyq" className="text-blue-600 hover:underline mb-4 inline-block">← Back to PYQ</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">PYQ Analysis & Progress</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-2xl font-bold text-blue-600">{summary.totalAttempts}</p>
            <p className="text-sm text-gray-600">Total Attempts</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-2xl font-bold text-green-600">{summary.totalCorrect}</p>
            <p className="text-sm text-gray-600">Total Correct</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-2xl font-bold text-indigo-600">{summary.avgScore}%</p>
            <p className="text-sm text-gray-600">Avg Score</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-2xl font-bold text-purple-600">{summary.overallAccuracy}%</p>
            <p className="text-sm text-gray-600">Accuracy</p>
          </div>
        </div>

        {weakTopics.length > 0 && (
          <div className="bg-amber-50 rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold text-amber-800 mb-3">Weak Topics (Focus here)</h2>
            <ul className="space-y-2">
              {weakTopics.map((t: any) => (
                <li key={t.topic} className="flex justify-between">
                  <span>{t.topic}</span>
                  <span className="font-medium">{t.accuracy}% ({t.correct}/{t.total})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Accuracy by Topic</h2>
          {byTopic.length === 0 ? (
            <p className="text-gray-500">Attempt more papers to see topic-wise analysis.</p>
          ) : (
            <div className="space-y-2">
              {byTopic.map((t: any) => (
                <div key={t.topic} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span>{t.topic}</span>
                  <span className="font-medium">{t.accuracy}% ({t.correct}/{t.total})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Recent Attempts</h2>
          {recentAttempts.length === 0 ? (
            <p className="text-gray-500">No attempts yet. Start a PYQ to see your history.</p>
          ) : (
            <div className="space-y-2">
              {recentAttempts.map((a: any) => (
                <Link
                  key={a.id}
                  href={`/student/pyq/${a.examId}/result/${a.id}`}
                  className="flex justify-between items-center py-3 border-b last:border-0 hover:bg-gray-50 rounded px-2"
                >
                  <span>{a.exam?.title || 'Exam'}</span>
                  <span className="font-medium">{a.score}/{a.totalMarks}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
