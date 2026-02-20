'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'NATIONAL',
  'INTERNATIONAL',
  'ECONOMY',
  'SPORTS',
  'SCIENCE_TECH',
  'SCHEMES_REPORTS',
  'AWARDS',
  'MISCELLANEOUS'
]

interface Entry {
  id: string
  month: string
  category: string
  title: string
  content: string
  sortOrder: number
  createdAt: string
}

export default function AdminCurrentAffairsPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    category: 'NATIONAL',
    title: '',
    content: '',
    sortOrder: 0
  })

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      const params = new URLSearchParams()
      if (filterMonth) params.set('month', filterMonth)
      if (filterCategory) params.set('category', filterCategory)
      const res = await fetch(`/api/admin/current-affairs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [filterMonth, filterCategory])

  const saveEntry = async () => {
    if (!form.title.trim()) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const url = editing
        ? `/api/admin/current-affairs/${editing.id}`
        : '/api/admin/current-affairs'
      const method = editing ? 'PATCH' : 'POST'
      const body = editing
        ? { title: form.title, content: form.content, category: form.category, month: form.month, sortOrder: form.sortOrder }
        : form
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Failed to save')
      setShowAdd(false)
      setEditing(null)
      setForm({
        month: new Date().toISOString().slice(0, 7),
        category: 'NATIONAL',
        title: '',
        content: '',
        sortOrder: 0
      })
      fetchEntries()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      await fetch(`/api/admin/current-affairs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchEntries()
    } catch (e) {
      alert('Failed to delete')
    }
  }

  const openEdit = (e: Entry) => {
    setEditing(e)
    setForm({
      month: e.month,
      category: e.category,
      title: e.title,
      content: e.content,
      sortOrder: e.sortOrder
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Monthly Current Affairs</h1>
        <p className="text-gray-600 mb-6">Add and manage current affairs by month and category. Students see them as notes.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditing(null)
              setForm({
                month: new Date().toISOString().slice(0, 7),
                category: 'NATIONAL',
                title: '',
                content: '',
                sortOrder: 0
              })
              setShowAdd(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add entry
          </button>
        </div>

        {/* Add/Edit modal */}
        {(showAdd || editing) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
              <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit entry' : 'Add entry'}</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month (YYYY-MM)</label>
                    <input
                      type="month"
                      value={form.month}
                      onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full p-2 border rounded-lg"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Headline / title"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content (notes format)</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="Points, paragraphs – notes format"
                    className="w-full p-2 border rounded-lg min-h-[120px]"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveEntry} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editing ? 'Update' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowAdd(false); setEditing(null); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 font-semibold text-gray-700">Month</th>
                <th className="p-3 font-semibold text-gray-700">Category</th>
                <th className="p-3 font-semibold text-gray-700">Title</th>
                <th className="p-3 font-semibold text-gray-700 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    No entries. Add one or filter differently.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-3 text-gray-700">{e.month}</td>
                    <td className="p-3 text-gray-600">{e.category.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-gray-800 max-w-md truncate">{e.title}</td>
                    <td className="p-3">
                      <button onClick={() => openEdit(e)} className="text-blue-600 hover:underline text-sm mr-2">Edit</button>
                      <button onClick={() => deleteEntry(e.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
