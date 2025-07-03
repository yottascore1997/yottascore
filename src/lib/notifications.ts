// Simple notification utility for support tickets
// In a real application, you would integrate with services like SendGrid, AWS SES, or similar

export interface NotificationData {
  to: string;
  subject: string;
  body: string;
  ticketId?: string;
  ticketTitle?: string;
}

export async function sendSupportNotification(data: NotificationData) {
  try {
    // In a real application, you would send an actual email here
    // For now, we'll just log the notification
    console.log('📧 Support Notification:', {
      to: data.to,
      subject: data.subject,
      body: data.body,
      ticketId: data.ticketId,
      ticketTitle: data.ticketTitle,
      timestamp: new Date().toISOString(),
    });

    // You could integrate with services like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer
    // - Resend
    // - Mailgun

    return { success: true, messageId: `mock-${Date.now()}` };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function createTicketCreatedNotification(userEmail: string, ticketId: string, ticketTitle: string) {
  return {
    to: userEmail,
    subject: `Support Ticket Created - ${ticketId}`,
    body: `
Hello,

Your support ticket has been successfully created.

Ticket ID: ${ticketId}
Title: ${ticketTitle}

Our support team will review your request and respond as soon as possible. You will receive an email notification when we reply.

Thank you for your patience.

Best regards,
ExamIndia Support Team
    `.trim(),
    ticketId,
    ticketTitle,
  };
}

export function createTicketReplyNotification(userEmail: string, ticketId: string, ticketTitle: string, replyContent: string) {
  return {
    to: userEmail,
    subject: `New Reply to Your Support Ticket - ${ticketId}`,
    body: `
Hello,

You have received a new reply to your support ticket.

Ticket ID: ${ticketId}
Title: ${ticketTitle}

Reply:
${replyContent}

You can view the full conversation by logging into your account and visiting the support section.

Thank you.

Best regards,
ExamIndia Support Team
    `.trim(),
    ticketId,
    ticketTitle,
  };
}

export function createTicketStatusUpdateNotification(userEmail: string, ticketId: string, ticketTitle: string, newStatus: string) {
  return {
    to: userEmail,
    subject: `Support Ticket Status Updated - ${ticketId}`,
    body: `
Hello,

The status of your support ticket has been updated.

Ticket ID: ${ticketId}
Title: ${ticketTitle}
New Status: ${newStatus.replace('_', ' ')}

You can view the full details by logging into your account and visiting the support section.

Thank you.

Best regards,
ExamIndia Support Team
    `.trim(),
    ticketId,
    ticketTitle,
  };
} 