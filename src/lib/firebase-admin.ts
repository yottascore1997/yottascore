import * as admin from 'firebase-admin';

// Validate required environment variables
const requiredEnvVars = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const errorMsg = `❌ Missing Firebase Admin SDK environment variables: ${missingVars.join(', ')}`;
// In production, throw error - in development, log warning
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
}

// Initialize Firebase Admin SDK
if (!admin.apps.length && !missingVars.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: requiredEnvVars.projectId,
        clientEmail: requiredEnvVars.clientEmail,
        privateKey: requiredEnvVars.privateKey?.replace(/\\n/g, '\n'),
      }),
    });
} catch (error: any) {
if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const isAdminSDKInitialized = () => admin.apps.length > 0;
export default admin;




