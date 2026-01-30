import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const PHP_UPLOAD_URL = process.env.PHP_UPLOAD_URL || 'https://score.yottascore.com/upload.php'
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN
const MAX_VIDEO_SIZE = 80 * 1024 * 1024 // 80 MB for videos
const MAX_IMAGE_SIZE = 5 * 1024 * 1024   // 5 MB for images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

async function uploadFile(file: File): Promise<string | null> {
  try {
    const isVideo = file.type.startsWith('video/')
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      console.error('File too large:', file.size, 'max:', maxSize)
      return null
    }
    const allowed = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
    if (!allowed.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return null
    }
    if (!UPLOAD_TOKEN || !PHP_UPLOAD_URL?.includes('upload.php')) {
      console.warn('PHP upload not configured')
      return null
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}`
    const formDataParts: Buffer[] = []
    const fileHeader = `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n` +
      `Content-Type: ${file.type}\r\n\r\n`
    formDataParts.push(Buffer.from(fileHeader))
    formDataParts.push(buffer)
    formDataParts.push(Buffer.from('\r\n'))
    formDataParts.push(Buffer.from(`--${boundary}--\r\n`))
    const formDataBody = Buffer.concat(formDataParts)
    const uploadResponse = await fetch(PHP_UPLOAD_URL, {
      method: 'POST',
      body: formDataBody,
      headers: {
        'X-Upload-Token': UPLOAD_TOKEN,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBody.length.toString(),
      },
    })
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json()
      return uploadData.url ?? null
    }
    const errorData = await uploadResponse.json().catch(() => ({}))
    console.error('PHP upload error:', errorData)
    return null
  } catch (e) {
    console.error('Upload file error:', e)
    return null
  }
}

// GET - List all success stories (admin)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const list = await prisma.successStory.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json(list)
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    console.error('[SUCCESS_STORIES_GET]', e)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

// POST - Create success story (admin), FormData: title, description, file (video/image)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const title = (formData.get('title') as string)?.trim() || null
    const description = (formData.get('description') as string)?.trim() || null
    const file = formData.get('file') as File | null
    const mediaUrlFromForm = (formData.get('mediaUrl') as string)?.trim() || null

    let mediaUrl: string
    let mediaType: string

    if (file && file.size > 0) {
      const url = await uploadFile(file)
      if (!url) {
        return NextResponse.json(
          { error: 'Failed to upload file. Check file type (image/video) and size (image max 5MB, video max 80MB).' },
          { status: 400 }
        )
      }
      mediaUrl = url
      mediaType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'
    } else if (mediaUrlFromForm) {
      mediaUrl = mediaUrlFromForm
      const requestedType = (formData.get('mediaType') as string) || ''
      // YouTube URLs: store as YOUTUBE so frontend can embed
      if (/youtube\.com|youtu\.be/i.test(mediaUrlFromForm)) {
        mediaType = 'YOUTUBE'
      } else {
        mediaType = requestedType === 'IMAGE' ? 'IMAGE' : 'VIDEO'
      }
    } else {
      return NextResponse.json({ error: 'Either upload a file or provide mediaUrl' }, { status: 400 })
    }

    const maxOrder = await prisma.successStory.aggregate({ _max: { order: true } })
    const order = (maxOrder._max.order ?? -1) + 1

    const story = await prisma.successStory.create({
      data: {
        title,
        description,
        mediaUrl,
        mediaType,
        order,
        createdById: decoded.userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json(story)
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    console.error('[SUCCESS_STORIES_POST]', e)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
