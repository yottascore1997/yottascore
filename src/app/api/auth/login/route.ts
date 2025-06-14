import { NextResponse } from 'next/server'
import { validateUser, signToken } from '@/lib/auth'
import { z } from 'zod'
import { withCORS } from '@/lib/cors'

const loginSchema = z.object({
  email: z.string().email(),
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

    const { email, password } = validatedFields.data
    const user = await validateUser(email, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

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