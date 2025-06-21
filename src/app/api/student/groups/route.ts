import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch all groups
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { isPrivate: false },
          {
            members: {
              some: {
                userId: decoded.userId
              }
            }
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        members: {
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
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json(groups)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[GROUPS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Create a new group
export async function POST(req: Request) {
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
    const { name, description, imageUrl, isPrivate } = body

    if (!name) {
      return new NextResponse('Group name is required', { status: 400 })
    }

    // Create the group
    const group = await prisma.group.create({
      data: {
        name,
        description,
        imageUrl,
        isPrivate: isPrivate || false,
        creatorId: decoded.userId,
        members: {
          create: {
            userId: decoded.userId,
            role: 'ADMIN'
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
        members: {
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
            members: true
          }
        }
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[GROUPS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 