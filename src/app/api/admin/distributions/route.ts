import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // PENDING, FAILED, SUCCESS
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.winningsDistribution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          // include basic user and exam info
          // note: exclude heavy relations
          // Prisma relation names: user and exam not directly on model, so query separately
        }
      }),
      prisma.winningsDistribution.count({ where })
    ]);

    // Enrich with user and exam basic info
    const userIds = Array.from(new Set(items.map((i) => i.userId)));
    const examIds = Array.from(new Set(items.map((i) => i.examId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true }
    });
    const exams = await prisma.liveExam.findMany({
      where: { id: { in: examIds } },
      select: { id: true, title: true }
    });

    const itemsWithMeta = items.map((it) => ({
      ...it,
      user: users.find((u) => u.id === it.userId) || null,
      exam: exams.find((e) => e.id === it.examId) || null
    }));

    return NextResponse.json({ items: itemsWithMeta, total, page, limit });
  } catch (err) {
    console.error('Error fetching distributions:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

