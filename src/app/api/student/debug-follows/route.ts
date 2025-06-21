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

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 })
    }

    // Get detailed follow information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            followers: true,
            following: true
          }
        },
        followers: {
          select: {
            follower: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        following: {
          select: {
            following: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        followersCount: user._count.followers,
        followingCount: user._count.following
      },
      followers: user.followers.map(f => ({
        id: f.follower.id,
        name: f.follower.name
      })),
      following: user.following.map(f => ({
        id: f.following.id,
        name: f.following.name
      }))
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[DEBUG_FOLLOWS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 