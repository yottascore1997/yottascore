import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSupportNotification, createTicketCreatedNotification } from '@/lib/notifications';

// Generate unique ticket ID
function generateTicketId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

// GET - Fetch user's support tickets
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [SUPPORT_TICKETS_GET] Starting request');
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('❌ [SUPPORT_TICKETS_GET] No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔑 [SUPPORT_TICKETS_GET] Token found, verifying...');
    const user = await verifyToken(token);
    if (!user) {
      console.log('❌ [SUPPORT_TICKETS_GET] Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('✅ [SUPPORT_TICKETS_GET] User verified:', { userId: user.userId, role: user.role });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    console.log('📋 [SUPPORT_TICKETS_GET] Query params:', { status, page, limit, skip });

    let whereClause: any = {
      userId: user.userId,
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    console.log('🔍 [SUPPORT_TICKETS_GET] Where clause:', whereClause);
    console.log('📊 [SUPPORT_TICKETS_GET] Fetching tickets from database...');

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // assignedTo: {
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //   },
        // },
        replies: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    });

    console.log('✅ [SUPPORT_TICKETS_GET] Tickets fetched successfully:', tickets.length);

    const total = await prisma.supportTicket.count({ where: whereClause });
    console.log('📊 [SUPPORT_TICKETS_GET] Total tickets count:', total);

    const response = { 
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    console.log('🎉 [SUPPORT_TICKETS_GET] Response prepared successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [SUPPORT_TICKETS_GET] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('🔍 [SUPPORT_TICKETS_GET] Prisma error code:', (error as any).code);
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST - Create new support ticket
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, issueType, priority, attachments } = body;

    if (!title || !description || !issueType || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique ticket ID
    let ticketId;
    let isUnique = false;
    while (!isUnique) {
      ticketId = generateTicketId();
      const existing = await prisma.supportTicket.findUnique({
        where: { ticketId },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // Create ticket with attachments
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketId: ticketId!,
        title,
        description,
        issueType,
        priority,
        status: 'OPEN',
        userId: user.userId,
        attachments: {
          create: attachments?.map((attachment: any) => ({
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
          })) || [],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: true,
      },
    });

    // Send notification (with error handling)
    try {
      if (ticket.user.email) {
        const notification = createTicketCreatedNotification(
          ticket.user.email,
          ticket.ticketId,
          ticket.title
        );
        await sendSupportNotification(notification);
        console.log('✅ [SUPPORT_TICKETS_POST] Notification sent successfully');
      }
    } catch (notificationError) {
      console.error('⚠️ [SUPPORT_TICKETS_POST] Notification failed (non-critical):', notificationError);
      // Don't fail the entire request if notification fails
    }

    return NextResponse.json({ 
      ticket,
      message: 'Support ticket created successfully' 
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 