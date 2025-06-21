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

    if (decoded.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const timetables = await prisma.timetable.findMany({
      where: {
        userId: decoded.userId
      },
      include: {
        slots: {
          orderBy: {
            startTime: 'asc'
          }
        }
      }
    })

    return NextResponse.json(timetables)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[TIMETABLE_GET]', error)
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

    if (decoded.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const { name, description, isWeekly, slots } = body

    if (!name || !slots || !Array.isArray(slots)) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Helper function to create a Date object from time string
    const createDateTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      return date
    }

    const timetable = await prisma.timetable.create({
      data: {
        name,
        description,
        isWeekly: isWeekly === 'true',
        userId: decoded.userId,
        slots: {
          create: slots.map((slot: any) => ({
            day: parseInt(slot.day),
            startTime: createDateTime(slot.startTime),
            endTime: createDateTime(slot.endTime),
            subject: slot.subject,
            topic: slot.topic,
            notes: slot.notes,
            reminder: slot.reminder === 'true',
            userId: decoded.userId
          }))
        }
      },
      include: {
        slots: true
      }
    })

    return NextResponse.json(timetable)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[TIMETABLE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 