import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string }
    if (decoded.role !== 'ADMIN') return null
    return decoded
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const quotes = await prisma.dailyQuote.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { text, author } = body as { text?: string; author?: string }
  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ message: 'Quote text is required.' }, { status: 400 })
  }

  const quote = await prisma.dailyQuote.create({
    data: {
      text: text.trim(),
      author: author ? String(author).trim() || null : null
    }
  })
  return NextResponse.json(quote)
}
