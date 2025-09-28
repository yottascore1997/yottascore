// src/app/api/auth/firebase-verify-otp/route.ts
import { NextResponse } from 'next/server';
import { withCORS } from '@/lib/cors';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

// Access the global Firebase OTP sessions
global.firebaseOtpSessions = global.firebaseOtpSessions || new Map();

const handler = async (req: Request) => {
  try {
    const body = await req.json();
    const { sessionId, otp } = body;

    console.log('🔐 Firebase OTP verification for session:', sessionId);

    if (!sessionId || !otp) {
      return NextResponse.json(
        { error: 'Session ID and OTP are required' },
        { status: 400 }
      );
    }

    // Get stored session data
    const sessionData = global.firebaseOtpSessions.get(sessionId);

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found or expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check session expiry (10 minutes)
    const sessionExpiry = new Date(sessionData.createdAt.getTime() + 10 * 60 * 1000);
    if (new Date() > sessionExpiry) {
      global.firebaseOtpSessions.delete(sessionId);
      return NextResponse.json(
        { error: 'Session expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check attempt limit (max 3 attempts per session)
    if (sessionData.attempts >= 3) {
      global.firebaseOtpSessions.delete(sessionId);
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    try {
      // Verify OTP with Firebase
      const userCredential = await sessionData.confirmationResult.confirm(otp);
      
      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Clean up session
      global.firebaseOtpSessions.delete(sessionId);

      // Verify the Firebase ID token (reuse existing logic)
      const decoded = require('jsonwebtoken').decode(idToken) as any;
      
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid Firebase token');
      }

      const { uid, phone_number, email, name } = {
        uid: decoded.sub,
        email: decoded.email || '',
        phone_number: decoded.phone_number || sessionData.phoneNumber,
        name: decoded.name || `User ${sessionData.phoneNumber.slice(-4)}`
      };

      console.log('🔍 Looking for user with:', { uid, phone_number, email });
      
      // Check if user exists in our database
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: uid }, // Check by Firebase UID
            { phoneNumber: phone_number || '' }, // Check by phone number
            { email: email || undefined } // Check by email if available
          ]
        },
      });
      
      console.log('👤 User found:', user ? 'Yes' : 'No');

      // If user doesn't exist, create a new one
      if (!user) {
        console.log('👤 Creating new user...');
        
        // Generate unique username
        const username = `user_${uid.substring(0, 8)}`;
        
        try {
          user = await prisma.user.create({
            data: {
              id: uid, // Use Firebase UID as our user ID
              email: email || '',
              name: name || `User ${phone_number || 'Unknown'}`,
              phoneNumber: phone_number || '',
              role: 'STUDENT',
              username: username,
              // Set default wallet balance
              wallet: 100.0, // Give new users ₹100 welcome bonus
            },
          });
          
          console.log(`✅ New user created via Firebase: ${user.id} (${user.phoneNumber})`);
        } catch (createError) {
          console.error('❌ Error creating user:', createError);
          throw new Error(`Failed to create user: ${createError.message}`);
        }
      } else {
        console.log('👤 User exists, updating if needed...');
        
        // Update existing user with Firebase UID if not already set
        if (user.id !== uid) {
          try {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { 
                id: uid, // Update to Firebase UID
                phoneNumber: phone_number || user.phoneNumber,
                email: email || user.email
              }
            });
            console.log(`✅ Existing user linked to Firebase: ${user.id} (${user.phoneNumber})`);
          } catch (updateError) {
            console.error('❌ Error updating user:', updateError);
            throw new Error(`Failed to update user: ${updateError.message}`);
          }
        }
      }

      // Generate JWT token for our app
      console.log('🔑 Generating JWT token...');
      
      const token = await signToken({
        userId: user.id,
        role: user.role
      });
      
      console.log('✅ JWT token generated');

      const response = {
        success: true,
        message: 'OTP verified successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          username: user.username,
          phoneNumber: user.phoneNumber,
          wallet: user.wallet
        },
      };
      
      console.log('🎉 Firebase OTP auth successful:', {
        userId: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role
      });
      
      return NextResponse.json(response);

    } catch (firebaseError: any) {
      // Update attempt count
      sessionData.attempts += 1;
      global.firebaseOtpSessions.set(sessionId, sessionData);

      console.error('Firebase OTP verification error:', firebaseError);
      
      if (firebaseError.code === 'auth/invalid-verification-code') {
        return NextResponse.json(
          { 
            error: 'Invalid OTP', 
            attemptsLeft: 3 - sessionData.attempts 
          },
          { status: 400 }
        );
      } else if (firebaseError.code === 'auth/code-expired') {
        global.firebaseOtpSessions.delete(sessionId);
        return NextResponse.json(
          { error: 'OTP has expired. Please request a new OTP.' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: 'OTP verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

  } catch (error: any) {
    console.error('Verify Firebase OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
};

export const POST = withCORS(handler);
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));