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

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const sortBy = searchParams.get("sortBy") || "rank";

    // Build the query based on filter
    let limit = undefined;
    if (filter === "top10") limit = 10;
    else if (filter === "top50") limit = 50;
    else if (filter === "top100") limit = 100;

    // Get all users with their battle quiz statistics
    const users = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        battleQuizParticipations: {
          some: {}
        }
      },
      include: {
        battleQuizParticipations: {
          include: {
            quiz: true
          }
        },
        battleQuizWins: true
      }
    });

    // Calculate statistics for each user
    const leaderboardData = users.map((user: any) => {
      const participations = user.battleQuizParticipations;
      const totalMatches = participations.length;
      const totalWins = user.battleQuizWins.length;
      const totalLosses = totalMatches - totalWins;
      const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
      const totalEarnings = user.battleQuizWins.reduce((sum: number, w: any) => sum + w.prizeAmount, 0);

      // Calculate streaks - we'll need to get this from the database or calculate differently
      // For now, let's set default values
      let currentStreak = 0;
      let bestStreak = 0;

      // Calculate level and experience
      const experience = totalWins * 100 + totalMatches * 10;
      const level = Math.floor(experience / 1000) + 1;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        totalMatches,
        totalWins,
        totalLosses,
        winRate,
        totalEarnings,
        currentStreak,
        bestStreak,
        level,
        experience,
        rank: 0 // Will be calculated after sorting
      };
    });

    // Sort based on sortBy parameter
    let sortedData = [...leaderboardData];
    switch (sortBy) {
      case "wins":
        sortedData.sort((a, b) => b.totalWins - a.totalWins);
        break;
      case "earnings":
        sortedData.sort((a, b) => b.totalEarnings - a.totalEarnings);
        break;
      case "streak":
        sortedData.sort((a, b) => b.currentStreak - a.currentStreak);
        break;
      case "level":
        sortedData.sort((a, b) => b.level - a.level);
        break;
      default: // rank (by win rate and total wins)
        sortedData.sort((a, b) => {
          if (b.winRate !== a.winRate) {
            return b.winRate - a.winRate;
          }
          return b.totalWins - a.totalWins;
        });
    }

    // Add ranks
    sortedData = sortedData.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // Apply limit if specified
    if (limit) {
      sortedData = sortedData.slice(0, limit);
    }

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 