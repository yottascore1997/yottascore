import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get battle quiz statistics
    const [
      totalQuizzes,
      totalMatches,
      totalParticipants,
      totalWinnings,
      averageWinRate
    ] = await Promise.all([
      // Total quizzes
      prisma.battleQuiz.count({
        where: {
          createdById: decoded.userId
        }
      }),
      
      // Total matches (participations)
      prisma.battleQuizParticipation.count({
        where: {
          battleQuiz: {
            createdById: decoded.userId
          }
        }
      }),
      
      // Total unique participants
      prisma.battleQuizParticipation.groupBy({
        by: ['userId'],
        where: {
          battleQuiz: {
            createdById: decoded.userId
          }
        },
        _count: {
          userId: true
        }
      }).then(result => result.length),
      
      // Total winnings distributed
      prisma.battleQuizWinning.aggregate({
        where: {
          battleQuiz: {
            createdById: decoded.userId
          }
        },
        _sum: {
          amount: true
        }
      }).then(result => result._sum.amount || 0),
      
      // Average win rate
      prisma.battleQuizParticipation.groupBy({
        by: ['userId'],
        where: {
          battleQuiz: {
            createdById: decoded.userId
          }
        },
        _count: {
          id: true
        },
        _sum: {
          isWinner: true
        }
      }).then(results => {
        if (results.length === 0) return 0;
        
        const totalMatches = results.reduce((sum, r) => sum + r._count.id, 0);
        const totalWins = results.reduce((sum, r) => sum + (r._sum.isWinner || 0), 0);
        
        return totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
      })
    ]);

    return NextResponse.json({
      totalQuizzes,
      totalMatches,
      totalParticipants,
      totalWinnings,
      averageWinRate
    });
  } catch (error) {
    console.error("Error fetching battle quiz stats:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 