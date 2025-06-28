import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { withCORS } from '@/lib/cors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const getHandler = async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        course: true,
        year: true,
        createdAt: true,
        updatedAt: true,
        wallet: true,
        isPrivate: true,
        profilePhoto: true,
        bio: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
};

const postHandler = async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, phoneNumber, course, year } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        phoneNumber: phoneNumber || '',
        role: 'STUDENT',
        course: course || '',
        year: year || '',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        course: true,
        year: true,
        createdAt: true,
        wallet: true,
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
};

export const GET = withCORS(getHandler);
export const POST = withCORS(postHandler);
export const OPTIONS = withCORS(() => new Response(null, { status: 204 })); 