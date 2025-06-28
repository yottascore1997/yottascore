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

    // Get current user's follow relationships
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    // Get target user's follow relationships
    const targetUser = await prisma.user.findUnique({
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

    if (!currentUser || !targetUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if current user follows target user
    const iFollowThem = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: userId
        }
      }
    })

    // Check if target user follows current user
    const theyFollowMe = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: decoded.userId
        }
      }
    })

    return NextResponse.json({
      explanation: {
        title: "How Follow System Works",
        description: "When you follow someone, you appear in their followers list and they appear in your following list.",
        example: `${currentUser.name} follows ${targetUser.name}`
      },
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        followersCount: currentUser._count.followers,
        followingCount: currentUser._count.following,
        followers: currentUser.followers.map(f => f.follower.name),
        following: currentUser.following.map(f => f.following.name)
      },
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        followersCount: targetUser._count.followers,
        followingCount: targetUser._count.following,
        followers: targetUser.followers.map(f => f.follower.name),
        following: targetUser.following.map(f => f.following.name)
      },
      relationship: {
        iFollowThem: !!iFollowThem,
        theyFollowMe: !!theyFollowMe,
        mutualFollow: !!iFollowThem && !!theyFollowMe
      },
      whatHappensWhenYouFollow: {
        step1: `When ${currentUser.name} follows ${targetUser.name}:`,
        step2: `${currentUser.name} appears in ${targetUser.name}'s followers list`,
        step3: `${targetUser.name} appears in ${currentUser.name}'s following list`,
        step4: `${currentUser.name}'s following count increases by 1`,
        step5: `${targetUser.name}'s followers count increases by 1`
      }
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[FOLLOW_EXPLANATION_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 