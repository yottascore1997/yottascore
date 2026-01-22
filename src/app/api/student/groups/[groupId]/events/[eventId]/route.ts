import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// DELETE - Delete a group event
export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string; eventId: string } }
) {
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

    const { groupId, eventId } = params

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: decoded.userId,
          groupId: groupId
        }
      }
    })

    if (!membership) {
      return new NextResponse('Not a member of this group', { status: 403 })
    }

    // Check if event exists and user is the creator
    const event = await prisma.groupEvent.findUnique({
      where: {
        id: eventId
      },
      select: {
        id: true,
        creatorId: true,
        groupId: true
      }
    })

    if (!event) {
      return new NextResponse('Event not found', { status: 404 })
    }

    // Verify event belongs to this group
    if (event.groupId !== groupId) {
      return new NextResponse('Event does not belong to this group', { status: 403 })
    }

    // Only creator can delete the event
    if (event.creatorId !== decoded.userId) {
      return new NextResponse('Only the event creator can delete this event', { status: 403 })
    }

    // Delete the event (cascade will automatically delete participants)
    await prisma.groupEvent.delete({
      where: {
        id: eventId
      }
    })

    return NextResponse.json({ 
      message: 'Event deleted successfully',
      eventId: eventId
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[GROUP_EVENT_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

