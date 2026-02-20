'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

interface Quote {
  id: string
  text: string
  author: string | null
  createdAt: string
}

export default function DailyQuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  const fetchQuotes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      const res = await fetch('/api/admin/daily-quotes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setQuotes(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  const handleAdd = async () => {
    if (!newText.trim()) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch('/api/admin/daily-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newText.trim(), author: newAuthor.trim() || null })
      })
      if (!res.ok) throw new Error('Failed to add')
      setShowAdd(false)
      setNewText('')
      setNewAuthor('')
      fetchQuotes()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add quote')
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) return
    setUploading(true)
    setUploadMessage(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const form = new FormData()
      form.append('file', uploadFile)
      const res = await fetch('/api/admin/daily-quotes/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUploadMessage(data.message || 'Upload failed')
        return
      }
      setUploadMessage(data.message || `${data.added ?? 0} quote(s) added.`)
      setUploadFile(null)
      fetchQuotes()
    } catch (e) {
      setUploadMessage('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quote?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      await fetch(`/api/admin/daily-quotes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchQuotes()
    } catch (e) {
      alert('Failed to delete')
    }
  }

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['Quote', 'Author'],
      ['Success is not final, failure is not fatal.', 'Winston Churchill'],
      ['The only way to do great work is to love what you do.', 'Steve Jobs']
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'Quotes')
    XLSX.writeFile(wb, 'daily-quotes-template.xlsx')
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Daily Quotes</h1>
        <p className="text-gray-600 mb-6">Manage quotes. One quote is shown to students each day (auto-selected by date).</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add single quote
          </button>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
          >
            Download Excel template
          </button>
        </div>

        {/* Excel upload */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="font-semibold text-gray-800 mb-2">Bulk upload (Excel)</h2>
          <p className="text-sm text-gray-600 mb-2">First row: headers. Use columns &quot;Quote&quot; (or &quot;Text&quot;) and optional &quot;Author&quot;.</p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                setUploadFile(e.target.files?.[0] || null)
                setUploadMessage(null)
              }}
              className="text-sm"
            />
            <button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {uploadMessage && (
            <p className="mt-2 text-sm text-gray-700">{uploadMessage}</p>
          )}
        </div>

        {/* Add modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h2 className="text-lg font-semibold mb-4">Add quote</h2>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Quote text"
                className="w-full p-3 border rounded-lg mb-3 min-h-[100px]"
                rows={4}
              />
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Author (optional)"
                className="w-full p-3 border rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 font-semibold text-gray-700">Quote</th>
                <th className="p-3 font-semibold text-gray-700 w-32">Author</th>
                <th className="p-3 font-semibold text-gray-700 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    No quotes yet. Add one or upload Excel.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-3 text-gray-800 max-w-md">{q.text}</td>
                    <td className="p-3 text-gray-600">{q.author || '—'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
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
