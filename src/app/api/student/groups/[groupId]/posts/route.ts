import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch group posts
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

    const posts = await prisma.groupPost.findMany({
      where: {
        groupId: groupId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
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
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json(posts)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[GROUP_POSTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Create a group post
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
    const { content, imageUrl, videoUrl, fileUrl } = body

    if (!content) {
      return new NextResponse('Content is required', { status: 400 })
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

    // Create the group post
    const post = await prisma.groupPost.create({
      data: {
        content,
        imageUrl,
        videoUrl,
        fileUrl,
        authorId: decoded.userId,
        groupId: groupId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[GROUP_POSTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 