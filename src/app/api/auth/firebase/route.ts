import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCORS } from '@/lib/cors';
import jwt from 'jsonwebtoken';
import { getClientIP, logSecurityEvent } from '@/lib/security';

// Firebase ID token verification
async function verifyFirebaseToken(idToken: string) {
  try {
// Check if Admin SDK is available
    const hasAdminSDK = process.env.FIREBASE_PRIVATE_KEY && 
                        process.env.FIREBASE_CLIENT_EMAIL && 
                        process.env.FIREBASE_PROJECT_ID;
    
    // In production, REQUIRE Admin SDK
    if (process.env.NODE_ENV === 'production' && !hasAdminSDK) {
      throw new Error('Firebase Admin SDK not configured. Production requires secure token verification.');
    }
    
    if (hasAdminSDK) {
      const { adminAuth, isAdminSDKInitialized } = await import('@/lib/firebase-admin')

      if (!isAdminSDKInitialized()) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            'Firebase Admin SDK not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY on the server.'
          )
        }
      } else {
        const decodedToken = await adminAuth.verifyIdToken(idToken, true)

        return {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          phone_number: decodedToken.phone_number || '',
          name: decodedToken.name || `User ${decodedToken.phone_number || 'Unknown'}`,
          firebase: decodedToken.firebase,
        }
      }
    }
    
    // Fallback: Basic token decode (ONLY for development)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Insecure token verification not allowed in production');
    }
    
const decoded = jwt.decode(idToken) as any;
    
    if (!decoded || !decoded.sub) {
      throw new Error('Invalid token structure');
    }
    
    // Check expiry
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    const result = {
      uid: decoded.sub,
      email: decoded.email || '',
      phone_number: decoded.phone_number || '',
      name: decoded.name || `User ${decoded.phone_number || 'Unknown'}`,
      firebase: decoded.firebase
    };
    
return result;
  } catch (error: any) {
throw new Error(`Token verification failed: ${error.message}`);
  }
}

const handler = async (req: NextRequest) => {
  const ip = getClientIP(req);
  
  try {
const body = await req.json();
const { idToken } = body;

    if (!idToken) {
logSecurityEvent({
        type: 'login_fail',
        ip,
        success: false,
        message: 'No ID token provided',
      });
      
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }
    
// Verify the Firebase ID token
    const decodedToken = await verifyFirebaseToken(idToken);
    const { uid, email, phone_number, name } = decodedToken;

// Check if user exists in our database by Firebase UID or phone number
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: uid }, // Check by Firebase UID
          { phoneNumber: phone_number || '' }, // Check by phone number
          { email: email || undefined } // Check by email if available
        ]
      },
    });
    
// If user doesn't exist, create a new one
    if (!user) {
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
        
} catch (createError: any) {
throw new Error(`Failed to create user: ${createError.message}`);
      }
    } else {
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
} catch (updateError: any) {
throw new Error(`Failed to update user: ${updateError.message}`);
        }
      }
    }

    // Generate JWT token for our app
const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        firebaseUid: uid 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
const response = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        phoneNumber: user.phoneNumber,
      },
    };
    
// Log successful login
    logSecurityEvent({
      type: 'login_success',
      ip,
      phoneNumber: user.phoneNumber || undefined,
      success: true,
      message: `User ${user.id} logged in successfully`,
    });
    
    return NextResponse.json(response);

  } catch (error: any) {
// Log failed login attempt
    logSecurityEvent({
      type: 'login_fail',
      ip,
      success: false,
      message: error.message,
    });
    
    return NextResponse.json(
      { error: `Authentication failed: ${error.message}` },
      { status: 401 }
    );
  }
};

export const POST = withCORS(handler);
