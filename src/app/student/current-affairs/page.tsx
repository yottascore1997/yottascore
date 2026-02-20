'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  if (isNaN(y) || isNaN(m)) return ym
  return `${MONTH_NAMES[m - 1]} ${y}`
}

export default function CurrentAffairsMonthsPage() {
  const router = useRouter()
  const [months, setMonths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetch('/api/student/current-affairs/months', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMonths(Array.isArray(data) ? data : []))
      .catch(() => setMonths([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Monthly Current Affairs</h1>
          <p className="text-gray-600 mt-1">Select a month to view category-wise notes</p>
        </div>

        {months.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-gray-500">No current affairs available yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {months.map((month) => (
              <Link
                key={month}
                href={`/student/current-affairs/${month}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <span className="font-semibold text-gray-900">{formatMonthLabel(month)}</span>
                <span className="text-gray-500 text-sm ml-2">View by category →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
