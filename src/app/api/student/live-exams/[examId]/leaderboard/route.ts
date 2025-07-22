import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { examId: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { examId } = params;
    
    // Get all participants with their scores
    const participants = await prisma.liveExamParticipant.findMany({
      where: { examId },
      include: { user: { select: { name: true, id: true } } },
      orderBy: [
        { score: 'desc' },
        { completedAt: 'asc' }
      ]
    });

    // Fetch winnings for this exam
    const winnings = await prisma.liveExamWinner.findMany({
      where: { examId },
      select: { rank: true, prizeAmount: true }
    });
    const winningsMap = new Map(winnings.map((w: any) => [w.rank, w.prizeAmount]));

    // Calculate time taken and create enhanced leaderboard
    const enhancedParticipants = participants.map((p: any) => {
      let timeTaken = null;
      if (p.startedAt && p.completedAt) {
        const startTime = new Date(p.startedAt).getTime();
        const endTime = new Date(p.completedAt).getTime();
        timeTaken = Math.round((endTime - startTime) / 1000); // Time in seconds
      }
      
      return {
        ...p,
        timeTaken
      };
    });

    // Sort by score first, then by time taken (faster = better)
    const sortedParticipants = enhancedParticipants.sort((a: any, b: any) => {
      // First sort by score (descending)
      if (a.score !== b.score) {
        return (b.score || 0) - (a.score || 0);
      }
      
      // If scores are equal, sort by time taken (ascending - faster is better)
      if (a.timeTaken !== null && b.timeTaken !== null) {
        return a.timeTaken - b.timeTaken;
      }
      
      // If one has no time taken, prioritize the one with time
      if (a.timeTaken !== null && b.timeTaken === null) return -1;
      if (a.timeTaken === null && b.timeTaken !== null) return 1;
      
      // If both have no time taken, sort by completion time (earlier = better)
      if (a.completedAt && b.completedAt) {
        return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      }
      
      return 0;
    });

    // Create the full leaderboard with ranks
    const fullLeaderboard = sortedParticipants.map((p: any, i: number) => ({
      rank: i + 1,
      name: p.user?.name || 'Anonymous',
      userId: p.user?.id,
      score: p.score || 0,
      timeTaken: p.timeTaken,
      completedAt: p.completedAt,
      prizeAmount: winningsMap.get(i + 1) || 0,
      isCurrentUser: p.userId === decoded.userId
    }));

    // Find current user's entry
    const currentUserEntry = fullLeaderboard.find((p: any) => p.isCurrentUser);
    
    // Create the response structure
    const response = {
      currentUser: currentUserEntry ? {
        rank: currentUserEntry.rank,
        name: currentUserEntry.name,
        userId: currentUserEntry.userId,
        score: currentUserEntry.score,
        timeTaken: currentUserEntry.timeTaken,
        completedAt: currentUserEntry.completedAt,
        prizeAmount: currentUserEntry.prizeAmount
      } : null,
      leaderboard: fullLeaderboard.map((p: any) => ({
        rank: p.rank,
        name: p.name,
        userId: p.userId,
        score: p.score,
        timeTaken: p.timeTaken,
        completedAt: p.completedAt,
        prizeAmount: p.prizeAmount
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 