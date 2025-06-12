'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Summary {
  totalStudents: number
  totalExams: number
  examsTaken: number
  recentActivities: any[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [summary, setSummary] = useState<Summary>({
    totalStudents: 0,
    totalExams: 0,
    examsTaken: 0,
    recentActivities: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetchSummary()
  }, [router])

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/admin/summary', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <Link
          href="/admin/exams/create"
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700"
        >
          Create New Exam
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-lg font-semibold">Total Students</div>
          <div className="text-2xl font-bold">{summary.totalStudents}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
          <div className="text-4xl mb-2">📄</div>
          <div className="text-lg font-semibold">Total Exams</div>
          <div className="text-2xl font-bold">{summary.totalExams}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-lg font-semibold">Exams Taken</div>
          <div className="text-2xl font-bold">{summary.examsTaken}</div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Activities</h3>
        {/* Recent activities list can be added here */}
        <div className="text-gray-500">No recent activities.</div>
      </div>
    </div>
  )
} 