import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: Request) {
  try {
    // Get token from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string }

    // Verify user is an admin
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all exams created by the admin
    const [liveExams, practiceExams] = await Promise.all([
      prisma.liveExam.findMany({
        where: {
          createdById: decoded.userId.toString(),
        },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          duration: true,
          isLive: true,
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.practiceExam.findMany({
        where: {
          createdById: decoded.userId.toString(),
        },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          duration: true,
          category: true,
          subcategory: true,
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    ]);

    // Combine and format the results
    const exams = [
      ...liveExams.map((exam: any) => ({ ...exam, type: 'LIVE' })),
      ...practiceExams.map((exam: any) => ({ ...exam, type: 'PRACTICE' }))
    ];

    return NextResponse.json(exams)
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Get token from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string }

    // Verify user is an admin
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, description, duration, startTime, endTime, type } = await req.json()

    // Create new exam based on type
    let exam;
    if (type === 'LIVE') {
      exam = await prisma.liveExam.create({
        data: {
          title,
          description,
          duration,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          createdById: decoded.userId.toString(),
          spots: 100, // Default values
          spotsLeft: 100,
          entryFee: 0,
          totalCollection: 0,
          prizePool: 0,
        },
      });
    } else {
      exam = await prisma.practiceExam.create({
        data: {
          title,
          description,
          duration,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          createdById: decoded.userId.toString(),
          spots: 100, // Default values
          spotsLeft: 100,
          category: 'General',
          subcategory: 'Practice',
        },
      });
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 