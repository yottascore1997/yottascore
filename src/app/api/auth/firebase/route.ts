import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCORS } from '@/lib/cors';
import jwt from 'jsonwebtoken';
import { getClientIP, logSecurityEvent } from '@/lib/security';

// Firebase ID token verification
async function verifyFirebaseToken(idToken: string) {
  try {
    console.log('🔍 Verifying Firebase token...');
    
    // Check if Admin SDK is available
    const hasAdminSDK = process.env.FIREBASE_PRIVATE_KEY && 
                        process.env.FIREBASE_CLIENT_EMAIL && 
                        process.env.FIREBASE_PROJECT_ID;
    
    // In production, REQUIRE Admin SDK
    if (process.env.NODE_ENV === 'production' && !hasAdminSDK) {
      throw new Error('Firebase Admin SDK not configured. Production requires secure token verification.');
    }
    
    if (hasAdminSDK) {
      // Use Admin SDK for secure verification
      const { adminAuth, isAdminSDKInitialized } = await import('@/lib/firebase-admin');
      
      if (!isAdminSDKInitialized() || !adminAuth) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Firebase Admin SDK not initialized');
        }
        console.warn('⚠️ Admin SDK not initialized, falling back to decode');
      } else {
        console.log('🔐 Verifying token with Firebase Admin SDK (SECURE)...');
        const decodedToken = await adminAuth.verifyIdToken(idToken, true); // checkRevoked = true
        
        console.log('✅ Token verified with Admin SDK');
        return {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          phone_number: decodedToken.phone_number || '',
          name: decodedToken.name || `User ${decodedToken.phone_number || 'Unknown'}`,
          firebase: decodedToken.firebase
        };
      }
    }
    
    // Fallback: Basic token decode (ONLY for development)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Insecure token verification not allowed in production');
    }
    
    console.warn('⚠️ DEVELOPMENT MODE: Using basic token decode (INSECURE)');
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
    
    console.log('✅ Token decoded successfully (DEV mode):', result);
    return result;
  } catch (error: any) {
    console.error('❌ Token verification error:', error);
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

const handler = async (req: NextRequest) => {
  const ip = getClientIP(req);
  
  try {
    console.log('🔥 Firebase auth API called from IP:', ip);
    
    const body = await req.json();
    console.log('📝 Request body keys:', Object.keys(body));
    
    const { idToken } = body;

    if (!idToken) {
      console.log('❌ No ID token provided');
      
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
    
    console.log('🔑 ID token received, length:', idToken.length);

    // Verify the Firebase ID token
    const decodedToken = await verifyFirebaseToken(idToken);
    const { uid, email, phone_number, name } = decodedToken;

    console.log('🔍 Looking for user with:', { uid, phone_number, email });
    
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
      } catch (createError: any) {
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
        } catch (updateError: any) {
          console.error('❌ Error updating user:', updateError);
          throw new Error(`Failed to update user: ${updateError.message}`);
        }
      }
    }

    // Generate JWT token for our app
    console.log('🔑 Generating JWT token...');
    
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
    
    console.log('✅ JWT token generated');

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
    
    console.log('🎉 Firebase auth successful:', {
      userId: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role
    });
    
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
    console.error('❌ Firebase auth error:', error);
    
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
