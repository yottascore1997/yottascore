import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const kycVerificationSchema = z.object({
  documentId: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized - No token provided', { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return new NextResponse('Unauthorized - Invalid token', { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
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
      const updatedUser = await prisma.user.update({
        where: { id: kycDocument.userId },
        data: {
          kycStatus: 'REJECTED',
          kycRejectedAt: new Date(),
          kycRejectionReason: validatedData.rejectionReason,
          // Reset verification fields
          kycVerifiedAt: null
        }
      });

      console.log('User KYC status updated to REJECTED:', {
        userId: kycDocument.userId,
        newStatus: updatedUser.kycStatus,
        rejectionReason: validatedData.rejectionReason,
        rejectedAt: updatedUser.kycRejectedAt
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
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized - No token provided', { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return new NextResponse('Unauthorized - Invalid token', { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
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

    console.log('Admin KYC filter:', { status, where });

    // Get KYC requests with documents
    const [kycRequests, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...where,
          // Only show users who have uploaded documents
          kycDocuments: {
            some: {}
          }
        },
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
      prisma.user.count({ 
        where: {
          ...where,
          kycDocuments: {
            some: {}
          }
        }
      })
    ]);

    console.log('KYC requests found:', kycRequests.length);
    kycRequests.forEach(req => {
      console.log('User KYC status:', { 
        name: req.name, 
        status: req.kycStatus, 
        documents: req.kycDocuments.length 
      });
    });

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