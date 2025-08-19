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
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      return NextResponse.json({
        users: [],
        posts: [],
        hashtags: []
      })
    }

    const searchTerm = query.trim()
    console.log(`🔍 Searching for: "${searchTerm}"`)

    // Search users - try multiple approaches
    let users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { course: { contains: searchTerm } }
        ],
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        course: true,
        year: true
      },
      take: 10
    })

    // If no results with STUDENT role, try without role filter
    if (users.length === 0) {
      console.log('🔍 No STUDENT users found, trying without role filter...')
      users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { course: { contains: searchTerm } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          course: true,
          year: true,
          role: true
        },
        take: 10
      })
    }

    console.log(`📊 Found ${users.length} users matching search term`)

    // Check if current user is following each user AND follow request status
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user: any) => {
        // Check if we're following them
        const isFollowing = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: decoded.userId,
              followingId: user.id
            }
          }
        })
        
        // Check if they follow us back
        const isFollowedBack = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: user.id,
              followingId: decoded.userId
            }
          }
        })
        
        // Check follow request status
        const followRequest = await prisma.followRequest.findUnique({
          where: {
            senderId_receiverId: {
              senderId: decoded.userId,
              receiverId: user.id
            }
          }
        })
        
        return {
          ...user,
          isFollowing: !!isFollowing,
          isFollowedBack: !!isFollowedBack,
          followRequestStatus: followRequest?.status || null,
          canMessageDirectly: !!isFollowing // If you follow them, you can message them directly
        }
      })
    )

    // Search posts
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { content: { contains: searchTerm } },
          { hashtags: { array_contains: [searchTerm] } }
        ],
        isPrivate: false
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            course: true,
            year: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Search hashtags (simplified - in a real app you'd have a separate hashtag table)
    const hashtagPosts = await prisma.post.findMany({
      where: {
        hashtags: { array_contains: [searchTerm] }
      },
      select: {
        hashtags: true
      }
    })

    const hashtagCount = hashtagPosts.length
    const hashtags = hashtagCount > 0 ? [{ name: searchTerm, count: hashtagCount }] : []

    return NextResponse.json({
      users: usersWithFollowStatus,
      posts,
      hashtags
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[SEARCH_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 