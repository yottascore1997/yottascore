import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Function to check and send timetable reminders
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
    const { checkReminders = true } = body

    if (!checkReminders) {
      return NextResponse.json({ message: 'Reminder check disabled' })
    }

    // Get current time and calculate reminder window (15 minutes before + 5 minutes after for testing)
    const now = new Date()
    const reminderWindow = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now
    const currentDay = now.getDay() // 0-6 (Sunday-Saturday)

    // Find timetable slots that need reminders
    const upcomingSlots = await prisma.timetableSlot.findMany({
      where: {
        userId: decoded.userId,
        reminder: true,
        reminderSent: false,
        day: currentDay,
        startTime: {
          gte: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes before current time (for testing)
          lte: reminderWindow
        },
        isCompleted: false
      },
      include: {
        timetable: {
          select: {
            name: true
          }
        }
      }
    })

    const sentReminders = []

    for (const slot of upcomingSlots) {
      // Create notification for this reminder
      const notification = await prisma.pushNotification.create({
        data: {
          userId: decoded.userId,
          title: `Study Reminder: ${slot.subject}`,
          message: `Your study session "${slot.subject}"${slot.topic ? ` - ${slot.topic}` : ''} starts in ${Math.round((new Date(slot.startTime).getTime() - now.getTime()) / (1000 * 60))} minutes.${slot.notes ? `\n\nNotes: ${slot.notes}` : ''}`,
          type: 'REMINDER',
          isRead: false,
          sentBy: 'SYSTEM' // System-generated reminder
        }
      })

      // Mark reminder as sent
      await prisma.timetableSlot.update({
        where: { id: slot.id },
        data: { reminderSent: true }
      })

      sentReminders.push({
        slotId: slot.id,
        subject: slot.subject,
        startTime: slot.startTime,
        notificationId: notification.id
      })
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentReminders.length} reminders`,
      reminders: sentReminders
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[TIMETABLE_REMINDERS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// Function to reset reminder status (for testing or manual reset)
export async function PATCH(req: Request) {
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
    const { slotId, resetAll = false } = body

    if (resetAll) {
      // Reset all reminder status for the user
      await prisma.timetableSlot.updateMany({
        where: {
          userId: decoded.userId,
          reminder: true
        },
        data: {
          reminderSent: false
        }
      })

      return NextResponse.json({
        success: true,
        message: 'All reminder statuses reset'
      })
    } else if (slotId) {
      // Reset specific slot reminder status
      await prisma.timetableSlot.update({
        where: {
          id: slotId,
          userId: decoded.userId
        },
        data: {
          reminderSent: false
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Reminder status reset for specific slot'
      })
    }

    return new NextResponse('Invalid request', { status: 400 })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[TIMETABLE_REMINDERS_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
