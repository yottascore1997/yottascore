import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: Request) {
  try {
const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
} catch (error) {
return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (decoded.role !== 'STUDENT') {
return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current time
    const now = new Date()
    
// Fetch available exams (both upcoming and started exams that haven't ended)
    const exams = await prisma.liveExam.findMany({
      where: {
        AND: [
          {
            isLive: true // Only show exams that are marked as live
          },
          {
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
            ]
          },
          {
            spotsLeft: {
              gt: 0
            }
          },
          {
            participants: {
              none: {
                userId: decoded.userId
              }
            }
          }
        ]
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

// Also check total exams without filters for debugging
    const totalExams = await prisma.liveExam.count({
      where: { isLive: true }
    })
return NextResponse.json(exams)
  } catch (error) {
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