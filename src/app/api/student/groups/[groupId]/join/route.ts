import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Join a group
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

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return new NextResponse('Group not found', { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: decoded.userId,
          groupId: groupId
        }
      }
    })

    if (existingMember) {
      return new NextResponse('Already a member of this group', { status: 400 })
    }

    // Join the group
    const member = await prisma.groupMember.create({
      data: {
        userId: decoded.userId,
        groupId: groupId,
        role: 'MEMBER'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        group: {
          include: {
            _count: {
              select: {
                members: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(member)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[JOIN_GROUP]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 