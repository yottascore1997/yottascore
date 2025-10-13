import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateBookProfileSchema = z.object({
  isVerified: z.boolean().optional(),
  verificationType: z.enum(['COLLEGE_EMAIL', 'STUDENT_ID', 'COLLEGE_ID', 'AADHAR_VERIFIED']).optional(),
  collegeEmail: z.string().email().optional(),
  studentId: z.string().optional(),
  collegeName: z.string().optional(),
  graduationYear: z.number().positive().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  preferredLanguage: z.string().optional(),
  maxDistance: z.number().positive().optional(),
  notificationSettings: z.record(z.any()).optional(),
});

// GET /api/user/book-profile - Get user's book profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profile = await prisma.userBookProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            email: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Book profile not found',
      });
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching book profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch book profile' },
      { status: 500 }
    );
  }
}

// POST /api/user/book-profile - Create or update user's book profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateBookProfileSchema.parse(body);

    // Check if profile already exists
    const existingProfile = await prisma.userBookProfile.findUnique({
      where: { userId: session.user.id },
    });

    let profile;
    if (existingProfile) {
      // Update existing profile
      profile = await prisma.userBookProfile.update({
        where: { userId: session.user.id },
        data: validatedData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Create new profile
      profile = await prisma.userBookProfile.create({
        data: {
          userId: session.user.id,
          ...validatedData,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: profile,
      message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully',
    });
  } catch (error) {
    console.error('Error updating book profile:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update book profile' },
      { status: 500 }
    );
  }
}
