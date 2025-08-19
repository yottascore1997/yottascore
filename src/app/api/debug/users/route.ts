import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all users with their basic info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        course: true,
        year: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Count users by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    })

    return NextResponse.json({
      totalUsers: users.length,
      roleCounts,
      users: users.slice(0, 10) // Show first 10 users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
