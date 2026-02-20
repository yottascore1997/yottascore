import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { role: string }
    if (decoded.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const category = searchParams.get('category')

    if (!month) {
      return NextResponse.json({ message: 'Month (YYYY-MM) required.' }, { status: 400 })
    }

    const where: { month: string; category?: string } = { month }
    if (category) where.category = category

    const entries = await prisma.currentAffairsEntry.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }]
    })
    return NextResponse.json(entries)
  } catch (e) {
    console.error('[CA_ENTRIES]', e)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
