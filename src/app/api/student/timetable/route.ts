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

    const isWeeklyFlag = isWeekly === true || isWeekly === 'true'

    const getStartOfWeek = (date: Date) => {
      const start = new Date(date)
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      start.setHours(0, 0, 0, 0)
      return start
    }

    const getDateForWeekday = (weekday: number) => {
      const startOfWeek = getStartOfWeek(new Date())
      const target = new Date(startOfWeek)
      target.setDate(startOfWeek.getDate() + weekday)
      return target
    }

    // Helper function to create a Date object from time string
    const createDateTime = (timeStr: string, baseDate?: Date) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const date = baseDate ? new Date(baseDate) : new Date()
      date.setHours(hours, minutes, 0, 0)
      return date
    }

    const buildSlots = () => {
      if (!isWeeklyFlag) {
        return slots.map((slot: any) => ({
          day: parseInt(slot.day),
          slotDate: null,
          startTime: createDateTime(slot.startTime),
          endTime: createDateTime(slot.endTime),
          subject: slot.subject,
          topic: slot.topic,
          notes: slot.notes,
          reminder: slot.reminder === true || slot.reminder === 'true',
          userId: decoded.userId
        }))
      }

      // Weekly = apply to all days of current week with same time/details
      return slots.flatMap((slot: any) => {
        const base = {
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject,
          topic: slot.topic,
          notes: slot.notes,
          reminder: slot.reminder
        }

        return Array.from({ length: 7 }, (_, weekday) => {
          const dateForDay = getDateForWeekday(weekday)
          return {
            day: weekday,
            slotDate: dateForDay,
            startTime: createDateTime(base.startTime, dateForDay),
            endTime: createDateTime(base.endTime, dateForDay),
            subject: base.subject,
            topic: base.topic,
            notes: base.notes,
            reminder: base.reminder === true || base.reminder === 'true',
            userId: decoded.userId
          }
        })
      })
    }

    const timetable = await prisma.timetable.create({
      data: {
        name,
        description,
        isWeekly: isWeeklyFlag,
        userId: decoded.userId,
        slots: {
          create: buildSlots()
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