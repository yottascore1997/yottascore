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
      prisma.battleQuizParticipant.count({
        where: {
          quiz: {
            createdById: decoded.userId
          }
        }
      }),
      
      // Total unique participants
      prisma.battleQuizParticipant.groupBy({
        by: ['userId'],
        where: {
          quiz: {
            createdById: decoded.userId
          }
        },
        _count: {
          userId: true
        }
      }).then(result => result.length),
      
      // Total winnings distributed
      prisma.battleQuizWinner.aggregate({
        where: {
          quiz: {
            createdById: decoded.userId
          }
        },
        _sum: {
          prizeAmount: true
        }
      }).then(result => result._sum.prizeAmount || 0),
      
      // Average win rate - we'll calculate this differently since there's no isWinner field
      prisma.battleQuizParticipant.count({
        where: {
          quiz: {
            createdById: decoded.userId
          }
        }
      }).then(totalMatches => {
        return prisma.battleQuizWinner.count({
          where: {
            quiz: {
              createdById: decoded.userId
            }
          }
        }).then(totalWins => {
          return totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
        });
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