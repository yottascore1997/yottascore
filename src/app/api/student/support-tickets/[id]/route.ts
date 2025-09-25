import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSupportNotification, createTicketReplyNotification } from '@/lib/notifications';

// GET - Fetch specific support ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [SUPPORT_TICKET_GET] Starting request for ticket:', params.id);
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('❌ [SUPPORT_TICKET_GET] No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔑 [SUPPORT_TICKET_GET] Token found, verifying...');
    const user = await verifyToken(token);
    if (!user) {
      console.log('❌ [SUPPORT_TICKET_GET] Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('✅ [SUPPORT_TICKET_GET] User verified:', { userId: user.userId, role: user.role });

    console.log('📊 [SUPPORT_TICKET_GET] Fetching ticket from database...');
    
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
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
            attachments: true,
          },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      console.log('❌ [SUPPORT_TICKET_GET] Ticket not found for user');
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    console.log('✅ [SUPPORT_TICKET_GET] Ticket fetched successfully:', {
      id: ticket.id,
      title: ticket.title,
      status: ticket.status,
      repliesCount: ticket.replies.length
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('❌ [SUPPORT_TICKET_GET] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('🔍 [SUPPORT_TICKET_GET] Prisma error code:', (error as any).code);
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST - Add reply to support ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { content, attachments } = body;

    if (!content) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }

    // Check if ticket exists and belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
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
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Create reply with attachments
    const reply = await prisma.supportTicketReply.create({
      data: {
        content,
        isInternal: false,
        ticketId: params.id,
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

    // Update ticket status and timestamp
    await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        status: 'WAITING_FOR_USER',
        updatedAt: new Date(),
      },
    });

    // Send notification to admin (with error handling)
    try {
      if (ticket.user.email) {
        const notification = createTicketReplyNotification(
          ticket.user.email,
          ticket.ticketId,
          ticket.title,
          content
        );
        await sendSupportNotification(notification);
        console.log('✅ [SUPPORT_TICKET_POST] Notification sent successfully');
      }
    } catch (notificationError) {
      console.error('⚠️ [SUPPORT_TICKET_POST] Notification failed (non-critical):', notificationError);
      // Don't fail the entire request if notification fails
    }

    return NextResponse.json({ 
      reply,
      message: 'Reply added successfully' 
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 