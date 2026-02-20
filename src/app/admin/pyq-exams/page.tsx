'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const EXAM_TYPES = ['UPSC', 'SSC', 'JEE', 'NEET', 'Banking', 'CAT', 'State PSC', 'Other']

export default function PYQExamsPage() {
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
      if (!token) return
      const params = new URLSearchParams()
      if (filter.examType) params.set('examType', filter.examType)
      if (filter.year) params.set('year', filter.year)
      const res = await fetch(`/api/admin/pyq-exams?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setExams(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">PYQ (Previous Year Papers)</h1>
          <Link
            href="/admin/pyq-exams/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Create PYQ
          </Link>
        </div>

        <div className="flex gap-4 mb-6">
          <select
            value={filter.examType}
            onChange={(e) => setFilter((f) => ({ ...f, examType: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
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
            No PYQ exams yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/admin/pyq-exams/${exam.id}`}
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
                  <div className="text-right text-sm text-gray-600">
                    <span>{exam._count?.questions || 0} questions</span>
                    <span className="mx-2">•</span>
                    <span>{exam._count?.attempts || 0} attempts</span>
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
