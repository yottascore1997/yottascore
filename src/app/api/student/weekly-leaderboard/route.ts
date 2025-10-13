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

    const { searchParams } = new URL(req.url)
    const week = searchParams.get('week') // Format: YYYY-WW (e.g., 2024-01)
    
    // Calculate week start and end dates
    let weekStart: Date
    let weekEnd: Date
    
    if (week) {
      // Parse week parameter (YYYY-WW format)
      const [year, weekNum] = week.split('-').map(Number)
      const firstDayOfYear = new Date(year, 0, 1)
      const daysToAdd = (weekNum - 1) * 7
      weekStart = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
      weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else {
      // Default to current week
      const now = new Date()
      const dayOfWeek = now.getDay()
      weekStart = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
      weekStart.setHours(0, 0, 0, 0)
      weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

    console.log('🔍 Fetching live exams for week:', { weekStart, weekEnd })
    
    // Get all live exams conducted in the specified week
    const liveExams = await prisma.liveExam.findMany({
      where: {
        endTime: {
          gte: weekStart,
          lt: weekEnd,
          not: null
        }
      },
      include: {
        participants: {
          where: {
            completedAt: { not: null }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePhoto: true,
                course: true,
                year: true
              }
            }
          },
          orderBy: [
            { score: 'desc' },
            { completedAt: 'asc' }
          ]
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        endTime: 'desc'
      }
    })

    console.log('📊 Found live exams:', liveExams.length)

    // Format the response
    const leaderboardData = liveExams.map(exam => {
      // Calculate winners from top participants
      const topParticipants = exam.participants.slice(0, 5) // Top 5 winners
      
      // Calculate prize amounts for each rank
      const totalPrizePool = exam.spots * exam.entryFee
      const winningPool = totalPrizePool * 0.9
      const calculatePrize = (rank: number) => {
        if (rank === 1) return Math.floor(winningPool * 0.20)
        if (rank === 2) return Math.floor(winningPool * 0.15)
        if (rank === 3) return Math.floor(winningPool * 0.10)
        if (rank >= 4 && rank <= 10) return Math.floor(winningPool * 0.25 / 7)
        if (rank >= 11 && rank <= 25) return Math.floor(winningPool * 0.30 / 15)
        return 0
      }

      return {
        examId: exam.id,
        examTitle: exam.title,
        examDate: exam.endTime,
        totalParticipants: exam._count.participants,
        prizePool: exam.prizePool,
        winners: topParticipants.map((participant, index) => ({
          rank: index + 1,
          userId: participant.user.id,
          userName: participant.user.name,
          userPhoto: participant.user.profilePhoto,
          course: participant.user.course,
          year: participant.user.year,
          winnings: calculatePrize(index + 1),
          score: participant.score
        }))
      }
    })

    // Calculate current week info
    const currentWeek = `${weekStart.getFullYear()}-${String(Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))).padStart(2, '0')}`

    return NextResponse.json({
      currentWeek,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalExams: liveExams.length,
      leaderboard: leaderboardData
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[WEEKLY_LEADERBOARD_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
