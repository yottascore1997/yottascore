import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: Request) {
  try {
    console.log('Received request to fetch student exams')
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header or invalid format')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
      console.log('Token decoded:', { userId: decoded.userId, role: decoded.role })
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (decoded.role !== 'STUDENT') {
      console.log('User is not a student')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current time
    const now = new Date()

    // Fetch available exams (both upcoming and started exams that haven't ended)
    const exams = await prisma.liveExam.findMany({
      where: {
        isLive: true, // Only show exams that are marked as live
        // Remove startTime filter to include upcoming exams (startTime > now)
        // Only exclude exams that have ended (if endTime exists and has passed)
        OR: [
          {
            endTime: null // No end time, show if live
          },
          {
            endTime: {
              gt: now // End time hasn't passed yet
            }
          }
        ],
        spotsLeft: {
          gt: 0
        },
        participants: {
          none: {
            userId: decoded.userId
          }
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        instructions: true,
        category: true,
        imageUrl: true,
        startTime: true,
        endTime: true,
        duration: true,
        spots: true,
        spotsLeft: true,
        entryFee: true,
        prizePool: true,
        isLive: true,
        createdBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    console.log(`Found ${exams.length} available exams`)
    console.log('Sample exam data:', exams.length > 0 ? {
      id: exams[0].id,
      title: exams[0].title,
      imageUrl: exams[0].imageUrl,
      hasImageUrl: !!exams[0].imageUrl
    } : 'No exams found')
    return NextResponse.json(exams)
  } catch (error) {
    console.error('[STUDENT_EXAMS_GET] Detailed error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
} 