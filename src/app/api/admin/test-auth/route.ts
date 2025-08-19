import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('No token provided', { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Not admin', { status: 403 });
    }

    return NextResponse.json({
      message: 'Authentication successful',
      user: {
        userId: decoded.userId,
        role: decoded.role
      }
    });

  } catch (error) {
    console.error('Auth test error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
