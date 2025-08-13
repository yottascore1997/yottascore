import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const kycVerificationSchema = z.object({
  documentId: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return new NextResponse('Admin access required', { status: 403 });
    }

    const body = await request.json();
    const validatedData = kycVerificationSchema.parse(body);

    // Get the KYC document
    const kycDocument = await prisma.kYCDocument.findUnique({
      where: { id: validatedData.documentId },
      include: { user: true }
    });

    if (!kycDocument) {
      return new NextResponse('KYC document not found', { status: 404 });
    }

    if (validatedData.action === 'APPROVE') {
      // Approve the document
      await prisma.kYCDocument.update({
        where: { id: validatedData.documentId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: adminUser.id,
          rejectionReason: null
        }
      });

      // Check if all documents are verified
      const allDocuments = await prisma.kYCDocument.findMany({
        where: { userId: kycDocument.userId }
      });

      const allVerified = allDocuments.every(doc => doc.isVerified);

      if (allVerified) {
        // Update user KYC status to VERIFIED
        await prisma.user.update({
          where: { id: kycDocument.userId },
          data: {
            kycStatus: 'VERIFIED',
            kycVerifiedAt: new Date(),
            kycRejectedAt: null,
            kycRejectionReason: null
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'KYC document approved successfully',
        allVerified
      });

    } else {
      // Reject the document
      if (!validatedData.rejectionReason) {
        return new NextResponse('Rejection reason is required', { status: 400 });
      }

      await prisma.kYCDocument.update({
        where: { id: validatedData.documentId },
        data: {
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null,
          rejectionReason: validatedData.rejectionReason
        }
      });

      // Update user KYC status to REJECTED
      await prisma.user.update({
        where: { id: kycDocument.userId },
        data: {
          kycStatus: 'REJECTED',
          kycRejectedAt: new Date(),
          kycRejectionReason: validatedData.rejectionReason
        }
      });

      return NextResponse.json({
        success: true,
        message: 'KYC document rejected successfully'
      });
    }

  } catch (error) {
    console.error('KYC verification error:', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return new NextResponse('Admin access required', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && status !== 'ALL') {
      where.kycStatus = status;
    }

    // Get pending KYC requests
    const [kycRequests, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          kycStatus: true,
          kycVerifiedAt: true,
          kycRejectedAt: true,
          kycRejectionReason: true,
          createdAt: true,
          kycDocuments: {
            select: {
              id: true,
              documentType: true,
              documentNumber: true,
              documentImage: true,
              isVerified: true,
              verifiedAt: true,
              rejectionReason: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      kycRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('KYC requests fetch error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 