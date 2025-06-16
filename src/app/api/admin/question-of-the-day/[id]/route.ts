import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }

    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const { isActive } = body

    if (isActive === undefined) {
      return new NextResponse('Missing isActive field', { status: 400 })
    }

    // If activating a question, deactivate all others
    if (isActive) {
      await prisma.questionOfTheDay.updateMany({
        where: {
          isActive: true
        },
        data: {
          isActive: false
        }
      })
    }

    const updatedQuestion = await prisma.questionOfTheDay.update({
      where: {
        id: params.id
      },
      data: {
        isActive
      }
    })

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[QUESTION_OF_THE_DAY_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 