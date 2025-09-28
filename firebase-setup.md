# Firebase Authentication Setup Guide

## 1. Firebase Project Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "YottaScore"
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Enable
   - **Phone**: Enable (for OTP login)

### Step 3: Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add web app
4. Enter app nickname: "YottaScore Web"
5. Copy the configuration object

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

## 3. Firebase Admin SDK Setup

### Step 1: Generate Service Account Key
1. Go to Firebase Console → Project Settings
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Extract the values for environment variables

### Step 2: Install Firebase Admin SDK
```bash
npm install firebase-admin
```

## 4. Database Schema Update

The existing User model already supports Firebase UID:
- `id` field can store Firebase UID
- `email`, `phoneNumber` fields are compatible
- No database changes needed!

## 5. Usage

### Client-side Login
```tsx
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

const { signInWithEmail, signInWithPhone, user, loading } = useFirebaseAuth();
```

### Server-side Verification
```tsx
// API route automatically verifies Firebase ID token
// and creates/updates user in your database
```

## 6. Features Supported

✅ **Email/Password Login**
✅ **Phone/OTP Login** 
✅ **Automatic User Creation**
✅ **JWT Token Generation**
✅ **Role-based Redirect**
✅ **reCAPTCHA Integration**

## 7. Testing

1. Start your app: `npm run dev`
2. Go to `/firebase-login`
3. Test both email and phone login methods

## 8. Security Notes

- Firebase handles password hashing
- OTP verification is secure
- JWT tokens are signed with your secret
- All authentication is server-verified
