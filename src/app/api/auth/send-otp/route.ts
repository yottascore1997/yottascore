import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from '@/lib/cors';
import { validateAndFormatPhone, isTestPhoneNumber } from '@/lib/phone-validation';
import { checkOTPRateLimit, checkIPRateLimit } from '@/lib/rate-limiter';
import { getClientIP, validateOrigin, logSecurityEvent, isIPBlocked } from '@/lib/security';

/**
 * POST /api/auth/send-otp
 * Validates phone number and rate limits before allowing OTP send
 * This is called BEFORE Firebase sends the OTP
 */
const handler = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Get client IP
    const ip = getClientIP(req);
// Check if IP is blocked
    if (isIPBlocked(ip)) {
      logSecurityEvent({
        type: 'ip_block',
        ip,
        phoneNumber,
        success: false,
        message: 'Blocked IP attempted OTP request',
      });
      
      return NextResponse.json(
        { success: false, error: 'Access denied. Your IP has been blocked due to suspicious activity.' },
        { status: 403 }
      );
    }

    // Validate request origin
    if (!validateOrigin(req)) {
      logSecurityEvent({
        type: 'otp_send',
        ip,
        phoneNumber,
        success: false,
        message: 'Invalid origin',
      });
      
      return NextResponse.json(
        { success: false, error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    // Validate phone number
    let formattedPhone: string;
    try {
      formattedPhone = validateAndFormatPhone(phoneNumber);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Check IP rate limit
    const ipLimit = checkIPRateLimit(ip);
    if (!ipLimit.allowed) {
return NextResponse.json(
        { success: false, error: ipLimit.message },
        { status: 429 }
      );
    }

    // Check phone number rate limit
    const phoneLimit = checkOTPRateLimit(formattedPhone);
    if (!phoneLimit.allowed) {
return NextResponse.json(
        { success: false, error: phoneLimit.message },
        { status: 429 }
      );
    }

    // Warn if test number in production
    if (process.env.NODE_ENV === 'production' && isTestPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Test phone numbers are not allowed in production' },
        { status: 403 }
      );
    }

    // All validations passed
// Log security event
    logSecurityEvent({
      type: 'otp_send',
      ip,
      phoneNumber: formattedPhone,
      success: true,
      message: 'OTP request validated',
    });
    
    return NextResponse.json({
      success: true,
      message: 'Validation passed. Proceed with OTP send.',
      phoneNumber: formattedPhone,
    });

  } catch (error: any) {
// Log failed attempt
    const ip = getClientIP(req);
    logSecurityEvent({
      type: 'otp_send',
      ip,
      success: false,
      message: error.message,
    });
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const POST = withCORS(handler);

