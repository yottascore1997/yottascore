'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Loader2, Video, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'

interface SuccessStoryItem {
  id: string
  title: string | null
  description: string | null
  mediaUrl: string
  mediaType: string
  order: number
  createdAt: string
}

export default function StudentSuccessStoriesPage() {
  const router = useRouter()
  const [list, setList] = useState<SuccessStoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetch('/api/student/success-stories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          router.push('/auth/login')
          return []
        }
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setList(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Success Stories</h1>
      <p className="text-gray-600 mb-6">
        Real stories from students who achieved their goals. Watch and get inspired.
      </p>

      {list.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No success stories yet. Check back later!
        </Card>
      ) : (
        <div className="grid gap-6">
          {list.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-video bg-black relative group">
                {item.mediaType === 'VIDEO' ? (
                  <video
                    src={item.mediaUrl}
                    controls
                    className="w-full h-full object-contain"
                    playsInline
                  />
                ) : (
                  <img
                    src={item.mediaUrl}
                    alt={item.title ?? 'Success story'}
                    className="w-full h-full object-contain"
                  />
                )}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1 w-fit">
                    {item.mediaType === 'VIDEO' ? (
                      <Video className="w-3.5 h-3.5" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    {item.mediaType}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {item.title && (
                  <h2 className="font-semibold text-gray-900 text-lg">{item.title}</h2>
                )}
                {item.description && (
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{item.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {format(new Date(item.createdAt), 'dd MMM yyyy')}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
