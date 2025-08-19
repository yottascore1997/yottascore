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
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ message: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        participatedExams: true,
        participatedPracticeExams: true,
        battleQuizParticipations: true,
        referrerReferrals: true
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to include calculated fields
    const transformedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phoneNumber: student.phoneNumber,
      course: student.course,
      year: student.year,
      profilePhoto: student.profilePhoto,
      createdAt: student.createdAt,
      kycStatus: student.kycStatus,
      walletBalance: student.wallet || 0,
      totalExamsTaken: student.participatedExams.length + student.participatedPracticeExams.length + student.battleQuizParticipations.length,
      totalWinnings: student.wallet || 0, // This would need to be calculated from actual winnings
      referralCount: student.referrerReferrals?.length || 0
    }));
    return NextResponse.json(transformedStudents);
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
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ message: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
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