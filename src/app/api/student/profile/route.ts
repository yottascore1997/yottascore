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
        username: true,
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

    // Count all visible posts (only APPROVED, matching what the posts API returns)
    const visiblePostsCount = await prisma.post.count({
      where: {
        authorId: userId,
        status: 'APPROVED' // Only approved posts (instantly visible)
      }
    })

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
      _count: {
        ...user._count,
        posts: visiblePostsCount // Use visible posts count (instantly visible posts)
      },
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

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return new NextResponse('Name is required', { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name: name.trim(),
        course: course?.trim() || null,
        year: year?.trim() || null,
        bio: bio?.trim() || null,
        profilePhoto: profilePhoto || null,
        isPrivate: isPrivate || false
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
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

    // Count all visible posts (only APPROVED, matching what the posts API returns)
    const visiblePostsCount = await prisma.post.count({
      where: {
        authorId: decoded.userId,
        status: 'APPROVED' // Only approved posts (instantly visible)
      }
    })

    return NextResponse.json({
      ...updatedUser,
      _count: {
        ...updatedUser._count,
        posts: visiblePostsCount // Use visible posts count (instantly visible posts)
      }
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[PROFILE_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PUT(req: Request) {
  // Handle PUT requests the same as PATCH
  return PATCH(req)
} 