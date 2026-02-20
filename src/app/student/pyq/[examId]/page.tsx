'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function PYQExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!examId) return
    const fetchExam = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      const res = await fetch(`/api/student/pyq/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) router.push('/auth/login')
        else router.push('/student/pyq')
        return
      }
      const data = await res.json()
      setExam(data)
    }
    fetchExam().finally(() => setLoading(false))
  }, [examId, router])

  const handleStartAttempt = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    try {
      const res = await fetch(`/api/student/pyq/${examId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Failed to start')
      const data = await res.json()
      router.push(`/student/pyq/${examId}/attempt?attemptId=${data.attemptId}`)
    } catch {
      alert('Failed to start attempt')
    }
  }

  if (loading || !exam) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/student/pyq" className="text-blue-600 hover:underline mb-4 inline-block">← Back to PYQ</Link>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-gray-600 mt-2">
            {exam.examType} • {exam.year}
            {exam.subject && ` • ${exam.subject}`}
          </p>
          <div className="mt-4 flex gap-4 text-sm text-gray-500">
            <span>{exam._count?.questions || 0} questions</span>
            <span>{exam.duration} minutes</span>
            <span>{exam.totalMarks} marks</span>
          </div>

          {exam.myAttempts?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-2">Your previous attempts</h3>
              <div className="space-y-2">
                {exam.myAttempts.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-sm">
                      {a.score}/{a.totalMarks} • {a.correctCount} correct, {a.wrongCount} wrong
                    </span>
                    <Link
                      href={`/student/pyq/${examId}/result/${a.id}`}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View result
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleStartAttempt}
            className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Start Attempt
          </button>
        </div>
      </div>
    </div>
  )
}
