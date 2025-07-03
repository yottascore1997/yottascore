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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let whereClause: any = {
      userId: user.userId,
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

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

    const total = await prisma.supportTicket.count({ where: whereClause });

    return NextResponse.json({ 
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // Send notification
    if (ticket.user.email) {
      const notification = createTicketCreatedNotification(
        ticket.user.email,
        ticket.ticketId,
        ticket.title
      );
      await sendSupportNotification(notification);
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