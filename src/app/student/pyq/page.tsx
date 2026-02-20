'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const EXAM_TYPES = ['UPSC', 'SSC', 'JEE', 'NEET', 'Banking', 'CAT', 'State PSC', 'Other']

export default function PYQPage() {
  const router = useRouter()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ examType: '', year: '' })

  useEffect(() => {
    fetchExams()
  }, [filter.examType, filter.year])

  const fetchExams = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      const params = new URLSearchParams()
      if (filter.examType) params.set('examType', filter.examType)
      if (filter.year) params.set('year', filter.year)
      const res = await fetch(`/api/student/pyq?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) router.push('/auth/login')
        return
      }
      const data = await res.json()
      setExams(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Previous Year Papers (PYQ)</h1>
            <p className="text-gray-600 mt-1">Practice with past papers and track your progress</p>
          </div>
          <Link
            href="/student/pyq/analysis"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            My Analysis
          </Link>
        </div>

        <div className="flex gap-4 mb-6">
          <select
            value={filter.examType}
            onChange={(e) => setFilter((f) => ({ ...f, examType: e.target.value }))}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">All Exam Types</option>
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Year"
            value={filter.year}
            onChange={(e) => setFilter((f) => ({ ...f, year: e.target.value }))}
            className="px-3 py-2 border rounded-lg w-24"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            No PYQ papers available yet. Check back later.
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/student/pyq/${exam.id}`}
                className="block bg-white rounded-xl p-4 shadow hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {exam.examType} • {exam.year}
                      {exam.subject && ` • ${exam.subject}`}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <span>{exam._count?.questions || 0} questions</span>
                    <span className="mx-2">•</span>
                    <span>{exam.duration} min</span>
                    {exam.myAttempts > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-indigo-600">{exam.myAttempts} attempts</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
