import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCORS } from '@/lib/cors'

const handler = async (req: Request) => {
  try {
    // Validate Prisma client is available
    if (!prisma) {
      throw new Error('Database connection not available')
    }

    const { searchParams } = new URL(req.url)
    const username = (searchParams.get('username') || '').trim().toLowerCase()

    if (!username) {
      return NextResponse.json({ available: false, message: 'Username is required' }, { status: 400 })
    }

    const usernameRegex = /^[a-z0-9_\.]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ available: false, message: 'Invalid username format' }, { status: 200 })
    }

    // Query for existing username
    const existing = await prisma.user.findUnique({ 
      where: { username }, 
      select: { id: true } 
    })
    
    return NextResponse.json({ available: !existing })
  } catch (error: any) {
    console.error('[CHECK_USERNAME] Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    })
    
    // Handle Prisma-specific errors
    if (error?.code === 'P2002') {
      // Unique constraint violation - username exists
      return NextResponse.json({ available: false }, { status: 200 })
    }
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error?.message || 'Internal error'
      : 'Internal error'
    
    return NextResponse.json({ 
      available: false, 
      message: errorMessage 
    }, { status: 500 })
  }
}

export const GET = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))


