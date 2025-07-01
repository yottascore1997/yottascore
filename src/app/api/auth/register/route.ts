import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { withCORS } from '@/lib/cors'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const handler = async (req: Request) => {
  try {
    const body = await req.json()
    console.log('Registration request body:', body)

    const { email, name, password, phoneNumber, referralCode } = body

    // Validate required fields
    if (!email || !name || !password || !phoneNumber) {
      console.log('Missing required fields:', { email, name, password: !!password, phoneNumber })
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('User already exists:', email)
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      )
    }

    // Validate referral code if provided
    let referrerId = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true }
      });
      
      if (!referrer) {
        return NextResponse.json(
          { message: 'Invalid referral code' },
          { status: 400 }
        );
      }
      
      // Prevent self-referral
      if (referrer.id === email) {
        return NextResponse.json(
          { message: 'Cannot use your own referral code' },
          { status: 400 }
        );
      }
      
      referrerId = referrer.id;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user with referral info
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        phoneNumber,
        role: 'STUDENT', // Default role is student
        referredBy: referralCode || null,
      },
    })

    console.log('User created successfully:', { id: user.id, email: user.email })

    // If referral code was used, process the referral
    if (referralCode && referrerId) {
      try {
        // Use transaction to ensure data consistency
        await prisma.$transaction(async (tx) => {
          // Create referral record
          await tx.referral.create({
            data: {
              referrerId,
              referredId: user.id,
              code: referralCode
            }
          });

          // Update referrer's stats
          await tx.user.update({
            where: { id: referrerId },
            data: {
              referralCount: { increment: 1 },
              totalReferralEarnings: { increment: 100 },
              wallet: { increment: 100 }
            }
          });

          // Create transaction record for referrer
          await tx.transaction.create({
            data: {
              userId: referrerId,
              amount: 100,
              type: 'REFERRAL_BONUS',
              status: 'COMPLETED'
            }
          });
        });

        console.log('Referral processed successfully:', { referrerId, referredId: user.id });
      } catch (referralError) {
        console.error('Error processing referral:', referralError);
        // Don't fail registration if referral processing fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      role: user.role,
      message: 'Registration successful',
    })
  } catch (error) {
    console.error('Registration error details:', error)
    
    // Check for Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

export const POST = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 })) 