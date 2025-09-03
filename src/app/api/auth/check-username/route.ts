import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCORS } from '@/lib/cors'

const handler = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url)
    const username = (searchParams.get('username') || '').trim().toLowerCase()

    if (!username) {
      return NextResponse.json({ available: false, message: 'Username is required' }, { status: 400 })
    }

    const usernameRegex = /^[a-z0-9_\.]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ available: false, message: 'Invalid username format' }, { status: 200 })
    }

    const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } })
    return NextResponse.json({ available: !existing })
  } catch (error) {
    console.error('[CHECK_USERNAME]', error)
    return NextResponse.json({ available: false, message: 'Internal error' }, { status: 500 })
  }
}

export const GET = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))


