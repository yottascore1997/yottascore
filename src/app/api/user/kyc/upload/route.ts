import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const kycUploadSchema = z.object({
  documentType: z.enum(['AADHAR_CARD', 'PAN_CARD', 'DRIVING_LICENSE', 'PASSPORT', 'VOTER_ID', 'BANK_PASSBOOK', 'OTHER']),
  documentNumber: z.string().optional(),
  documentImage: z.string().min(1).max(10000000), // Max 10MB base64
});

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized - No token provided', { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = await verifyToken(token);
    
    if (!payload?.userId) {
      return new NextResponse('Unauthorized - Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { kycDocuments: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const body = await request.json();
    const validatedData = kycUploadSchema.parse(body);

    // Validate base64 format
    if (validatedData.documentImage.startsWith('data:image/')) {
      const base64Data = validatedData.documentImage.split(',')[1];
      if (!base64Data) {
        return NextResponse.json({ 
          error: 'Invalid image format' 
        }, { status: 400 });
      }
      
      // Check if base64 is valid
      try {
        Buffer.from(base64Data, 'base64');
      } catch (e) {
        return NextResponse.json({ 
          error: 'Invalid base64 image data' 
        }, { status: 400 });
      }
    }

    // Check if user already has this document type
    const existingDocument = user.kycDocuments.find(
      doc => doc.documentType === validatedData.documentType
    );

    if (existingDocument) {
      return new NextResponse('Document type already uploaded', { status: 400 });
    }

    // Create KYC document
    const kycDocument = await prisma.kYCDocument.create({
      data: {
        userId: user.id,
        documentType: validatedData.documentType,
        documentNumber: validatedData.documentNumber,
        documentImage: validatedData.documentImage,
      }
    });

    // Update user KYC status to PENDING if it was NOT_SUBMITTED or REJECTED
    if (user.kycStatus === 'NOT_SUBMITTED' || user.kycStatus === 'REJECTED') {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          kycStatus: 'PENDING',
          kycRejectedAt: null,
          kycRejectionReason: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'KYC document uploaded successfully',
      document: kycDocument
    });

  } catch (error) {
    console.error('KYC upload error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 });
    }

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Check for Prisma errors
    if ((error as any).code) {
      console.error('Prisma error code:', (error as any).code);
      return NextResponse.json({ 
        error: 'Database error', 
        code: (error as any).code 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    const payload = await verifyToken(token);
    
    if (!payload?.userId) {
      return new NextResponse('Unauthorized - Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { 
        kycDocuments: true
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      kycStatus: user.kycStatus,
      kycVerifiedAt: user.kycVerifiedAt,
      kycRejectedAt: user.kycRejectedAt,
      kycRejectionReason: user.kycRejectionReason,
      documents: user.kycDocuments
    });

  } catch (error) {
    console.error('KYC fetch error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 