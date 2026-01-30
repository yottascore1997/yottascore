'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Edit, Video, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'

interface SuccessStory {
  id: string
  title: string | null
  description: string | null
  mediaUrl: string
  mediaType: string
  order: number
  createdAt: string
  createdBy?: { id: string; name: string }
}

export default function AdminSuccessStoriesPage() {
  const [list, setList] = useState<SuccessStory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    mediaType: 'VIDEO' as 'VIDEO' | 'IMAGE' | 'YOUTUBE',
  })

  const isYoutubeUrl = (url: string) => /youtube\.com|youtu\.be/i.test(url?.trim() || '')
  const getYoutubeEmbedUrl = (url: string) => {
    const id = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)?.[1]
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  const fetchList = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/auth/login'
        return
      }
      const res = await fetch('/api/admin/success-stories', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setList(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm({ title: '', description: '', mediaUrl: '', mediaType: 'VIDEO' })
    setSelectedFile(null)
    setFilePreview(null)
    setShowModal(true)
  }

  const openEdit = (item: SuccessStory) => {
    setEditingId(item.id)
    setForm({
      title: item.title ?? '',
      description: item.description ?? '',
      mediaUrl: item.mediaUrl,
      mediaType: item.mediaType === 'IMAGE' ? 'IMAGE' : 'VIDEO',
    })
    setSelectedFile(null)
    setFilePreview(item.mediaUrl)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm({ title: '', description: '', mediaUrl: '', mediaType: 'VIDEO' })
    setSelectedFile(null)
    setFilePreview(null)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setFilePreview(url)
    setForm((f) => ({ ...f, mediaType: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/success-stories/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.title.trim() || null,
            description: form.description.trim() || null,
            mediaUrl: form.mediaUrl || undefined,
            mediaType: form.mediaType,
          }),
        })
        if (!res.ok) throw new Error('Update failed')
        alert('Success story updated.')
      } else {
        if (!selectedFile && !form.mediaUrl.trim()) {
          alert('Please upload a video/image or enter a media URL.')
          setSaving(false)
          return
        }
        const fd = new FormData()
        fd.append('title', form.title.trim())
        fd.append('description', form.description.trim())
        if (selectedFile) fd.append('file', selectedFile)
        else if (form.mediaUrl.trim()) {
          fd.append('mediaUrl', form.mediaUrl.trim())
          fd.append('mediaType', form.mediaType)
        }
        const res = await fetch('/api/admin/success-stories', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Create failed')
        }
        alert('Success story added. It will appear on the app.')
      }
      closeModal()
      fetchList()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this success story? It will be removed from the app.')) return
    const token = localStorage.getItem('token')
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/success-stories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setList((prev) => prev.filter((s) => s.id !== id))
      } else {
        alert('Delete failed.')
      }
    } catch (e) {
      alert('Delete failed.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Success Stories
            </h1>
            <p className="text-gray-600 mt-1">
              Add student success stories (video/image). They appear on the app under Success Stories.
            </p>
          </div>
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Success Story
          </Button>
        </div>

        {list.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">
            No success stories yet. Click &quot;Add Success Story&quot; to add a video or image.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  {item.mediaType === 'YOUTUBE' || isYoutubeUrl(item.mediaUrl) ? (
                    <iframe
                      src={getYoutubeEmbedUrl(item.mediaUrl) || item.mediaUrl}
                      title={item.title ?? 'YouTube'}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : item.mediaType === 'VIDEO' ? (
                    <video
                      src={item.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title ?? 'Success story'}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => openEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-900 truncate">
                    {item.title || 'Untitled'}
                  </p>
                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(item.createdAt), 'dd MMM yyyy')} · {item.mediaType === 'YOUTUBE' || isYoutubeUrl(item.mediaUrl) ? 'YouTube' : item.mediaType}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Success Story' : 'Add Success Story'}
              </h2>
              <button type="button" onClick={closeModal} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. How I cracked the exam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description"
                  rows={2}
                />
              </div>
              {!editingId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video or Image (upload file)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,image/gif"
                      onChange={onFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Video: MP4/WebM, max 80MB. Image: JPG/PNG/WebP/GIF, max 5MB.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Or paste media URL (YouTube link bhi chalega)
                    </label>
                    <Input
                      value={form.mediaUrl}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm((f) => ({
                          ...f,
                          mediaUrl: v,
                          mediaType: /youtube\.com|youtu\.be/i.test(v) ? 'YOUTUBE' : f.mediaType === 'YOUTUBE' ? 'VIDEO' : f.mediaType,
                        }))
                      }}
                      placeholder="https://www.youtube.com/watch?v=... ya https://youtu.be/..."
                    />
                    {isYoutubeUrl(form.mediaUrl) && (
                      <p className="text-xs text-green-600 mt-1">YouTube link — app par video embed hoke chalegi.</p>
                    )}
                  </div>
                </>
              )}
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Media URL (edit if needed, YouTube bhi chalega)</label>
                  <Input
                    value={form.mediaUrl}
                    onChange={(e) => {
                      const v = e.target.value
                      setForm((f) => ({
                        ...f,
                        mediaUrl: v,
                        mediaType: /youtube\.com|youtu\.be/i.test(v) ? 'YOUTUBE' : f.mediaType === 'YOUTUBE' ? 'VIDEO' : f.mediaType,
                      }))
                    }}
                    placeholder="https://..."
                  />
                </div>
              )}
              {(filePreview || form.mediaUrl) && (
                <div className="rounded border overflow-hidden">
                  {getYoutubeEmbedUrl(form.mediaUrl) ? (
                    <iframe
                      src={getYoutubeEmbedUrl(form.mediaUrl)!}
                      title="YouTube preview"
                      className="w-full aspect-video max-h-48"
                      allowFullScreen
                    />
                  ) : form.mediaType === 'VIDEO' && filePreview ? (
                    <video src={filePreview} controls className="w-full max-h-48" />
                  ) : filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-full max-h-48 object-contain" />
                  ) : null}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    'Update'
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
