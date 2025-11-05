import { NextResponse } from 'next/server'
import { validateUser, signToken } from '@/lib/auth'
import { z } from 'zod'
import { withCORS } from '@/lib/cors'

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
})

const handler = async (req: Request) => {
  try {
    const body = await req.json()
    const validatedFields = loginSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: validatedFields.error.errors },
        { status: 400 }
      )
    }

    const { identifier, password } = validatedFields.data
    
    console.log('[LOGIN] Attempting login:', { 
      identifier, 
      passwordLength: password.length 
    })
    
    const user = await validateUser(identifier, password)

    if (!user) {
      console.log('[LOGIN] Login failed - invalid credentials for:', identifier)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('[LOGIN] Login successful:', {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    })

    const token = await signToken({
      userId: user.id,
      role: user.role,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 })) 