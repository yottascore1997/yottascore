import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { withCORS } from '@/lib/cors';
import { getClientIP, logSecurityEvent } from '@/lib/security';
import {
  DUMMY_PHONE,
  DUMMY_UID,
  isDummyLoginEnabled,
  isDummyPhoneNumber,
  verifyDummyOTP,
} from '@/lib/dummy-auth';
import { validateAndFormatPhone } from '@/lib/phone-validation';

const handler = async (req: NextRequest) => {
  const ip = getClientIP(req);

  try {
    if (!isDummyLoginEnabled()) {
      return NextResponse.json(
        { error: 'Dummy login is not enabled' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { phoneNumber, otp } = body;

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    let formattedPhone: string;
    try {
      formattedPhone = validateAndFormatPhone(phoneNumber);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid phone number';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!isDummyPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { error: 'This phone number is not configured for dummy login' },
        { status: 403 }
      );
    }

    if (!verifyDummyOTP(otp)) {
      logSecurityEvent({
        type: 'login_fail',
        ip,
        phoneNumber: formattedPhone,
        success: false,
        message: 'Invalid dummy OTP',
      });

      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ id: DUMMY_UID }, { phoneNumber: DUMMY_PHONE }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: DUMMY_UID,
          email: null,
          name: 'Test User',
          phoneNumber: DUMMY_PHONE,
          role: 'STUDENT',
          username: 'user_dummy9420',
          wallet: 100.0,
        },
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        firebaseUid: DUMMY_UID,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    logSecurityEvent({
      type: 'login_success',
      ip,
      phoneNumber: user.phoneNumber || undefined,
      success: true,
      message: `Dummy login for user ${user.id}`,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';

    logSecurityEvent({
      type: 'login_fail',
      ip,
      success: false,
      message,
    });

    return NextResponse.json({ error: `Authentication failed: ${message}` }, { status: 401 });
  }
};

export const POST = withCORS(handler);

export const GET = withCORS(() =>
  new Response(JSON.stringify({ error: 'Dummy login requires POST' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  })
);
