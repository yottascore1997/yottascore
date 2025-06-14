'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Summary {
  totalStudents: number
  totalExams: number
  examsTaken: number
  recentActivities: any[]
}

interface LiveExam {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  totalSpots: number
  spotsLeft: number
  entryFee: number
  prizePool: number
  isLive: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [summary, setSummary] = useState<Summary>({
    totalStudents: 0,
    totalExams: 0,
    examsTaken: 0,
    recentActivities: [],
  })
  const [liveExams, setLiveExams] = useState<LiveExam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'ADMIN') {
        router.push('/student/dashboard')
      }
    } catch (e) {
      router.push('/auth/login')
    }
    fetchSummary()
    fetchLiveExams()
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
    }
  }

  const fetchLiveExams = async () => {
    try {
      const response = await fetch('/api/admin/live-exams', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setLiveExams(data)
      }
    } catch (error) {
      console.error('Error fetching live exams:', error)
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Students</h3>
          <p className="text-2xl font-bold">{summary.totalStudents}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Exams</h3>
          <p className="text-2xl font-bold">{summary.totalExams}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-gray-500 text-sm">Exams Taken</h3>
          <p className="text-2xl font-bold">{summary.examsTaken}</p>
        </div>
      </div>

      {/* Live Exams */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Live Exams</h2>
          <button
            onClick={() => router.push('/admin/live-exams/create')}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
          >
            Create New Exam
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {liveExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded shadow p-4">
              <h3 className="font-semibold text-lg">{exam.title}</h3>
              <p className="text-gray-600 mb-2">{exam.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Spots:</span>
                  <span className="ml-1">{exam.spotsLeft}/{exam.totalSpots}</span>
                </div>
                <div>
                  <span className="text-gray-500">Entry Fee:</span>
                  <span className="ml-1">₹{exam.entryFee}</span>
                </div>
                <div>
                  <span className="text-gray-500">Prize Pool:</span>
                  <span className="ml-1">₹{exam.prizePool}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-1 ${exam.isLive ? 'text-green-500' : 'text-gray-500'}`}>
                    {exam.isLive ? 'Live' : 'Upcoming'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => router.push(`/admin/live-exams/${exam.id}`)}
                  className="text-primary hover:text-primary-dark"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
        <div className="bg-white rounded shadow">
          {summary.recentActivities.length > 0 ? (
            <ul className="divide-y">
              {summary.recentActivities.map((activity, index) => (
                <li key={index} className="p-4">
                  {activity.description}
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-gray-500">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  )
} 