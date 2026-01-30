import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Single success story (admin)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const story = await prisma.successStory.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true } } },
    })
    if (!story) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(story)
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    console.error('[SUCCESS_STORY_GET]', e)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

// PUT - Update success story (admin). Body: title?, description?, mediaUrl?, mediaType?, order?
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const existing = await prisma.successStory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const body = await req.json()
    const data: { title?: string; description?: string; mediaUrl?: string; mediaType?: string; order?: number } = {}
    if (body.title !== undefined) data.title = body.title?.trim() || null
    if (body.description !== undefined) data.description = body.description?.trim() || null
    if (body.mediaUrl !== undefined) data.mediaUrl = body.mediaUrl
    if (body.mediaType !== undefined) data.mediaType = body.mediaType === 'IMAGE' ? 'IMAGE' : 'VIDEO'
    if (typeof body.order === 'number') data.order = body.order
    const story = await prisma.successStory.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, name: true } } },
    })
    return NextResponse.json(story)
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    console.error('[SUCCESS_STORY_PUT]', e)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

// DELETE - Delete success story (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const existing = await prisma.successStory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.successStory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    console.error('[SUCCESS_STORY_DELETE]', e)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
