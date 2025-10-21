import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSupportNotification, createTicketReplyNotification, createTicketStatusUpdateNotification } from '@/lib/notifications';

// Mark as dynamic route
export const dynamic = 'force-dynamic';

// GET - Fetch specific support ticket for admin
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        user: {
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

// PATCH - Update ticket status, priority, assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, priority, assignedToId } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;

    // If status is being updated to RESOLVED, set resolvedAt
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
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

    // Send status update notification
    if (ticket.user.email && status) {
      const notification = createTicketStatusUpdateNotification(
        ticket.user.email,
        ticket.ticketId,
        ticket.title,
        status
      );
      await sendSupportNotification(notification);
    }

    return NextResponse.json({ 
      ticket,
      message: 'Ticket updated successfully' 
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add admin reply to support ticket
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { content, isInternal, attachments } = body;

    if (!content) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }

    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
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
        isInternal: isInternal || false,
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
    const updateData: any = {
      updatedAt: new Date(),
    };

    // If this is not an internal note, update status based on current status
    if (!isInternal) {
      if (ticket.status === 'WAITING_FOR_USER') {
        updateData.status = 'IN_PROGRESS';
      } else if (ticket.status === 'OPEN') {
        updateData.status = 'IN_PROGRESS';
      }
    }

    await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
    });

    // Send notification to user (only for non-internal replies)
    if (!isInternal && ticket.user.email) {
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