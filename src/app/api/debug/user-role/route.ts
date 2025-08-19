import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No authorization header',
        hasToken: false 
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    
    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        role: decoded.role
      },
      token: token.substring(0, 20) + '...' // Show first 20 chars for debugging
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid token',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 401 })
  }
}
