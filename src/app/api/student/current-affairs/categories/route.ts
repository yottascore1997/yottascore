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
    if (!month) {
      return NextResponse.json({ message: 'Month required.' }, { status: 400 })
    }

    const result = await prisma.currentAffairsEntry.findMany({
      where: { month },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    })
    const categories = result.map((r) => r.category)
    return NextResponse.json(categories)
  } catch (e) {
    console.error('[CA_CATEGORIES]', e)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
