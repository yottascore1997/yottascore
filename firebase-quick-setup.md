# Firebase Quick Setup for YottaScore

## 🚀 **Quick Fix for Configuration Error**

### **Step 1: Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Project name: `yottascore-app`
4. Enable Google Analytics: No
5. Click "Create project"

### **Step 2: Add Web App**
1. In Firebase Console, click "Add app" → Web (</>)
2. App nickname: `YottaScore Web`
3. **Don't check** "Also set up Firebase Hosting"
4. Click "Register app"
5. **Copy the configuration object**

### **Step 3: Enable Authentication**
1. Go to "Authentication" in Firebase Console
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable:
   - ✅ **Email/Password**
   - ✅ **Phone**

### **Step 4: Get Configuration**
Copy this configuration from Firebase Console:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "yottascore-app.firebaseapp.com",
  projectId: "yottascore-app",
  storageBucket: "yottascore-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### **Step 5: Update Environment Variables**
Create `.env.local` file in project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-actual-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="yottascore-app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="yottascore-app"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="yottascore-app.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-actual-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-actual-app-id"
```

### **Step 6: Test Configuration**
1. Restart your development server: `npm run dev`
2. Go to: `http://localhost:3000/firebase-test`
3. Check browser console for Firebase config logs
4. Test email login first (easier)
5. Test phone login with real number

## 🔧 **Alternative: Use Demo Configuration**

If you want to test immediately without Firebase setup:

```javascript
// Use this in src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyDir-vmz1zsEgE6Xo9PXudEM957QZnxDb0",
  authDomain: "yottascore-demo.firebaseapp.com",
  projectId: "yottascore-demo",
  storageBucket: "yottascore-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo1234567890"
};
```

## ⚠️ **Common Issues:**

### **Issue 1: Configuration Not Found**
- **Cause**: Invalid Firebase project ID
- **Fix**: Use real Firebase project configuration

### **Issue 2: Phone Authentication Not Enabled**
- **Cause**: Phone provider not enabled in Firebase Console
- **Fix**: Enable Phone in Authentication → Sign-in method

### **Issue 3: reCAPTCHA Issues**
- **Cause**: Domain not authorized
- **Fix**: Add your domain to Firebase Console → Authentication → Settings → Authorized domains

## 🧪 **Testing Steps:**

1. **Create Firebase project** (5 minutes)
2. **Enable Authentication** (2 minutes)
3. **Get configuration** (1 minute)
4. **Update .env.local** (1 minute)
5. **Test**: `http://localhost:3000/firebase-test`

**Total time: 10 minutes for working Firebase authentication!**
