'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const CATEGORY_LABELS: Record<string, string> = {
  NATIONAL: 'National',
  INTERNATIONAL: 'International',
  ECONOMY: 'Economy',
  SPORTS: 'Sports',
  SCIENCE_TECH: 'Science & Tech',
  SCHEMES_REPORTS: 'Schemes & Reports',
  AWARDS: 'Awards',
  MISCELLANEOUS: 'Miscellaneous'
}

interface Entry {
  id: string
  month: string
  category: string
  title: string
  content: string
  sortOrder: number
}

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  if (isNaN(y) || isNaN(m)) return ym
  return `${MONTH_NAMES[m - 1]} ${y}`
}

export default function CurrentAffairsMonthPage() {
  const router = useRouter()
  const params = useParams()
  const month = params.month as string
  const [entries, setEntries] = useState<Entry[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [openNote, setOpenNote] = useState<Entry | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    if (!month) return

    Promise.all([
      fetch(`/api/student/current-affairs/entries?month=${encodeURIComponent(month)}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/student/current-affairs/categories?month=${encodeURIComponent(month)}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((r) => (r.ok ? r.json() : []))
    ])
      .then(([entriesList, categoriesList]) => {
        setEntries(Array.isArray(entriesList) ? entriesList : [])
        const cats = Array.isArray(categoriesList) ? categoriesList : []
        setCategories(cats)
        setSelectedCategory(cats[0] ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [month])

  const filteredEntries = selectedCategory
    ? entries.filter((e) => e.category === selectedCategory)
    : entries

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/student/current-affairs"
          className="inline-flex items-center text-blue-600 hover:underline mb-4"
        >
          ← Back to months
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{formatMonthLabel(month)}</h1>
        <p className="text-gray-600 mb-6">Select category and tap an item to read notes</p>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        {/* List of entries – click to open notes */}
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500 border border-gray-200">
              No entries in this category.
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setOpenNote(entry)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                {entry.content && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {entry.content.replace(/\n/g, ' ').slice(0, 120)}…
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Notes modal – full content in notes format */}
      {openNote && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setOpenNote(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {CATEGORY_LABELS[openNote.category] || openNote.category}
              </span>
              <button
                onClick={() => setOpenNote(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-60px)]">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{openNote.title}</h2>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {openNote.content || 'No content.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
