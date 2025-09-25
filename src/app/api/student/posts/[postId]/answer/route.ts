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
    const { answer } = await request.json();

    if (!answer || answer.trim().length === 0) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    // Check if post exists and is a question
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        postType: true,
        questionType: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.postType !== 'QUESTION') {
      return NextResponse.json({ error: 'This is not a question' }, { status: 400 });
    }

    // Create or update answer
    const questionAnswer = await prisma.questionAnswer.upsert({
      where: {
        postId_userId: {
          postId,
          userId: decoded.userId
        }
      },
      update: {
        answer: answer.trim()
      },
      create: {
        postId,
        userId: decoded.userId,
        answer: answer.trim()
      }
    });

    return NextResponse.json({ success: true, answer: questionAnswer });
  } catch (error) {
    console.error('Error answering question:', error);
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

    // Get all answers for this question
    const answers = await prisma.questionAnswer.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get user's own answer
    const userAnswer = answers.find(answer => answer.userId === decoded.userId);

    return NextResponse.json({
      answers,
      userAnswer: userAnswer || null
    });
  } catch (error) {
    console.error('Error fetching question answers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

