import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { postId } = params;
    const { optionIndex } = await request.json();

    // Check if post exists and is a poll
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        postType: true,
        pollOptions: true,
        pollEndTime: true,
        allowMultipleVotes: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.postType !== 'POLL') {
      return NextResponse.json({ error: 'This is not a poll' }, { status: 400 });
    }

    // Check if poll has ended (only if pollEndTime is set and valid)
    if (post.pollEndTime) {
      const endTime = new Date(post.pollEndTime);
      const now = new Date();
      
      // Only check if the date is valid (not NaN)
      if (!isNaN(endTime.getTime()) && endTime < now) {
        return NextResponse.json({ error: 'Poll has ended' }, { status: 400 });
      }
    }

    // Validate option index
    const pollOptions = post.pollOptions as string[] || [];
    if (optionIndex < 0 || optionIndex >= pollOptions.length) {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
    }

    // Check if user already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: decoded.userId
        }
      }
    });

    if (existingVote && !post.allowMultipleVotes) {
      return NextResponse.json({ error: 'You have already voted' }, { status: 400 });
    }

    // Create or update vote
    const vote = await prisma.pollVote.upsert({
      where: {
        postId_userId: {
          postId,
          userId: decoded.userId
        }
      },
      update: {
        optionIndex
      },
      create: {
        postId,
        userId: decoded.userId,
        optionIndex
      }
    });

    return NextResponse.json({ success: true, vote });
  } catch (error) {
    console.error('Error voting on poll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { postId } = params;

    // Get poll results
    const pollResults = await prisma.pollVote.groupBy({
      by: ['optionIndex'],
      where: { postId },
      _count: {
        optionIndex: true
      }
    });

    // Get user's vote
    const userVote = await prisma.pollVote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: decoded.userId
        }
      }
    });

    return NextResponse.json({
      results: pollResults,
      userVote: userVote?.optionIndex || null
    });
  } catch (error) {
    console.error('Error fetching poll results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
