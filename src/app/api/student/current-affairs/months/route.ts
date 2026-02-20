import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { role: string }
    if (decoded.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const months = await prisma.currentAffairsEntry.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'desc' }
    })

    const list = months.map((m) => m.month)
    return NextResponse.json(list)
  } catch (e) {
    console.error('[CA_MONTHS]', e)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
