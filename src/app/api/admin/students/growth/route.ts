import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized - No token provided', { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    let decoded: { userId: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    } catch (error) {
      return new NextResponse('Unauthorized - Invalid token', { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Admin access required', { status: 403 });
    }

    // Get date range for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Generate array of dates
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fetch student registration data for each date
    const growthData = await Promise.all(
      dates.map(async (date: Date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await prisma.user.count({
          where: {
            role: 'STUDENT',
            createdAt: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        });

        return {
          date: date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short' 
          }),
          count
        };
      })
    );

    return NextResponse.json(growthData);

  } catch (error) {
    console.error('Error fetching student growth data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
