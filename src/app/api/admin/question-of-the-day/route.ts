import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: Request) {
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

    const questions = await prisma.questionOfTheDay.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(questions)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[QUESTION_OF_THE_DAY_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
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
    const { question, options, correct, timeLimit } = body

    if (!question || !options || correct === undefined || !timeLimit) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Deactivate all other questions
    await prisma.questionOfTheDay.updateMany({
      where: {
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    const newQuestion = await prisma.questionOfTheDay.create({
      data: {
        question,
        options,
        correct,
        timeLimit,
        isActive: true,
        createdById: decoded.userId
      }
    })

    return NextResponse.json(newQuestion)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[QUESTION_OF_THE_DAY_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 