import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { CATEGORIES } from '../route'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { role: string }
    if (decoded.role !== 'ADMIN') return null
    return decoded
  } catch {
    return null
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { month, category, title, content, sortOrder } = body as Record<string, unknown>

  const data: Record<string, unknown> = {}
  if (month != null) data.month = String(month).trim()
  if (category != null) {
    if (!CATEGORIES.includes(category as any)) {
      return NextResponse.json({ message: 'Invalid category.' }, { status: 400 })
    }
    data.category = category
  }
  if (title != null) data.title = String(title).trim()
  if (content != null) data.content = String(content).trim()
  if (typeof sortOrder === 'number') data.sortOrder = sortOrder

  const entry = await prisma.currentAffairsEntry.update({
    where: { id },
    data: data as any
  })
  return NextResponse.json(entry)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.currentAffairsEntry.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ success: true })
}
