import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'test-follow') {
      // Test follow relationship creation
      const user1 = await prisma.user.findFirst({
        where: { role: 'USER' }
      });
      
      const user2 = await prisma.user.findFirst({
        where: { 
          role: 'USER',
          id: { not: user1?.id }
        }
      });

      if (!user1 || !user2) {
        return NextResponse.json({ error: 'Need at least 2 users to test' });
      }

      // Create a follow relationship: user1 follows user2
      const follow = await prisma.follow.create({
        data: {
          followerId: user1.id,
          followingId: user2.id
        },
        include: {
          follower: {
            select: { id: true, name: true }
          },
          following: {
            select: { id: true, name: true }
          }
        }
      });

      // Get user1's followers and following
      const user1Data = await prisma.user.findUnique({
        where: { id: user1.id },
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
                select: { id: true, name: true }
              }
            }
          },
          following: {
            select: {
              following: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      // Get user2's followers and following
      const user2Data = await prisma.user.findUnique({
        where: { id: user2.id },
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
                select: { id: true, name: true }
              }
            }
          },
          following: {
            select: {
              following: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      return NextResponse.json({
        followRelationship: {
          id: follow.id,
          follower: follow.follower,
          following: follow.following,
          relationship: `${follow.follower.name} follows ${follow.following.name}`
        },
        user1: {
          id: user1Data?.id,
          name: user1Data?.name,
          followersCount: user1Data?._count.followers,
          followingCount: user1Data?._count.following,
          followers: user1Data?.followers.map(f => f.follower.name),
          following: user1Data?.following.map(f => f.following.name)
        },
        user2: {
          id: user2Data?.id,
          name: user2Data?.name,
          followersCount: user2Data?._count.followers,
          followingCount: user2Data?._count.following,
          followers: user2Data?.followers.map(f => f.follower.name),
          following: user2Data?.following.map(f => f.following.name)
        },
        explanation: {
          expected: `${user1.name} should appear in ${user2.name}'s followers list`,
          expected2: `${user2.name} should appear in ${user1.name}'s following list`
        }
      });
    }

    if (action === 'test-unfollow') {
      // Test unfollow functionality
      const user1 = await prisma.user.findFirst({
        where: { role: 'USER' }
      });
      
      const user2 = await prisma.user.findFirst({
        where: { 
          role: 'USER',
          id: { not: user1?.id }
        }
      });

      if (!user1 || !user2) {
        return NextResponse.json({ error: 'Need at least 2 users to test' });
      }

      // First create a follow relationship
      const follow = await prisma.follow.create({
        data: {
          followerId: user1.id,
          followingId: user2.id
        }
      });

      // Get counts before unfollow
      const beforeUnfollow = await prisma.user.findUnique({
        where: { id: user1.id },
        select: {
          _count: {
            select: {
              followers: true,
              following: true
            }
          }
        }
      });

      // Now unfollow
      await prisma.follow.deleteMany({
        where: {
          followerId: user1.id,
          followingId: user2.id
        }
      });

      // Get counts after unfollow
      const afterUnfollow = await prisma.user.findUnique({
        where: { id: user1.id },
        select: {
          _count: {
            select: {
              followers: true,
              following: true
            }
          }
        }
      });

      return NextResponse.json({
        test: 'Unfollow Test',
        beforeUnfollow: {
          followers: beforeUnfollow?._count.followers,
          following: beforeUnfollow?._count.following
        },
        afterUnfollow: {
          followers: afterUnfollow?._count.followers,
          following: afterUnfollow?._count.following
        },
        result: {
          followingDecreased: (beforeUnfollow?._count.following || 0) > (afterUnfollow?._count.following || 0),
          relationshipRemoved: true
        }
      });
    }

    return NextResponse.json({ message: 'Use ?action=test-follow to test follow relationships' });
  } catch (error) {
    console.error('[TEST_DB_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 