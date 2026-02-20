import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Same quote for everyone per day: pick by (day of year) % count
function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string }
    if (decoded.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const quotes = await prisma.dailyQuote.findMany({
      orderBy: { createdAt: 'asc' }
    })

    if (quotes.length === 0) {
      return NextResponse.json(
        { message: 'No quotes available yet.' },
        { status: 404 }
      )
    }

    const today = new Date()
    const dayOfYear = getDayOfYear(today)
    const index = dayOfYear % quotes.length
    const quote = quotes[index]

    return NextResponse.json({
      id: quote.id,
      text: quote.text,
      author: quote.author ?? null,
      date: today.toISOString().slice(0, 10)
    })
  } catch (e) {
    console.error('[QUOTES_TODAY]', e)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
