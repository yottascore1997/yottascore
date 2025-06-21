import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch group events
export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
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

    const { groupId } = params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

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

    const events = await prisma.groupEvent.findMany({
      where: {
        groupId: groupId,
        startTime: {
          gte: new Date() // Only future events
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePhoto: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json(events)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[GROUP_EVENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Create a group event
export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
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

    const { groupId } = params
    const body = await req.json()
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      eventType, 
      maxParticipants,
      isRecurring,
      recurrence 
    } = body

    if (!title || !startTime || !endTime) {
      return new NextResponse('Title, start time, and end time are required', { status: 400 })
    }

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

    // Create the group event
    const event = await prisma.groupEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        eventType: eventType || 'STUDY_SESSION',
        maxParticipants,
        isRecurring: isRecurring || false,
        recurrence,
        groupId: groupId,
        creatorId: decoded.userId,
        participants: {
          create: {
            userId: decoded.userId,
            status: 'ATTENDING'
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePhoto: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[GROUP_EVENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 