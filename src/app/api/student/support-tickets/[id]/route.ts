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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

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
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // Send notification to admin
    if (ticket.user.email) {
      const notification = createTicketReplyNotification(
        ticket.user.email,
        ticket.ticketId,
        ticket.title,
        content
      );
      await sendSupportNotification(notification);
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