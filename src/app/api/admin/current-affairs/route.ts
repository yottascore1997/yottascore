import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const CATEGORIES = [
  'NATIONAL',
  'INTERNATIONAL',
  'ECONOMY',
  'SPORTS',
  'SCIENCE_TECH',
  'SCHEMES_REPORTS',
  'AWARDS',
  'MISCELLANEOUS'
] as const

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

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const category = searchParams.get('category')

  const where: { month?: string; category?: string } = {}
  if (month) where.month = month
  if (category) where.category = category

  const entries = await prisma.currentAffairsEntry.findMany({
    where,
    orderBy: [{ month: 'desc' }, { category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }]
  })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { month, category, title, content, sortOrder } = body as {
    month?: string
    category?: string
    title?: string
    content?: string
    sortOrder?: number
  }

  if (!month || !category || !title?.trim()) {
    return NextResponse.json(
      { message: 'Month, category and title are required.' },
      { status: 400 }
    )
  }
  if (!CATEGORIES.includes(category as any)) {
    return NextResponse.json({ message: 'Invalid category.' }, { status: 400 })
  }

  const entry = await prisma.currentAffairsEntry.create({
    data: {
      month: String(month).trim(),
      category,
      title: title.trim(),
      content: (content && String(content).trim()) || '',
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0
    }
  })
  return NextResponse.json(entry)
}
