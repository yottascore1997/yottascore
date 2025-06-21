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
    const userId = searchParams.get('userId') || decoded.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        course: true,
        year: true,
        bio: true,
        isPrivate: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if current user is following the profile user
    const iFollowThem = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: userId,
        },
      },
    });

    // Check if the profile user is following the current user
    const theyFollowMe = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: decoded.userId,
        },
      },
    });

    // Check if there's a pending follow request
    const followRequest = await prisma.followRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: decoded.userId,
          receiverId: userId,
        },
      },
    });

    return NextResponse.json({
      ...user,
      isFollowing: !!iFollowThem,
      followRequestStatus: followRequest?.status || null,
      isMutualFollower: !!iFollowThem && !!theyFollowMe,
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[PROFILE_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

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
    const { name, course, year, bio, profilePhoto, isPrivate } = body

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name,
        course,
        year,
        bio,
        profilePhoto,
        isPrivate
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        course: true,
        year: true,
        bio: true,
        isPrivate: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[PROFILE_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 