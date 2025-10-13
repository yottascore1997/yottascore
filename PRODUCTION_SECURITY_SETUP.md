# 🔒 Production Security Setup Guide

## ✅ Security Features Implemented

### 1. **Firebase Admin SDK Integration**
- ✅ Proper token verification using Firebase Admin SDK
- ✅ Token signature validation
- ✅ Revocation checking (`checkRevoked: true`)
- ✅ Automatic fallback to insecure mode disabled in production
- ✅ Environment variable validation

**Location**: `src/lib/firebase-admin.ts`, `src/app/api/auth/firebase/route.ts`

### 2. **Phone Number Validation**
- ✅ Indian phone number format validation (6-9 starting, 10 digits)
- ✅ E.164 format conversion (+919876543210)
- ✅ Test phone number detection and blocking in production
- ✅ Input sanitization

**Location**: `src/lib/phone-validation.ts`

### 3. **Rate Limiting**
- ✅ 3 OTP requests per hour per phone number
- ✅ 10 OTP requests per day per phone number
- ✅ 10 OTP requests per hour per IP address
- ✅ Automatic cleanup of expired entries

**Location**: `src/lib/rate-limiter.ts`

### 4. **IP-Based Security**
- ✅ IP address extraction from headers
- ✅ IP blocking mechanism
- ✅ Suspicious activity tracking
- ✅ Auto-block after 10 suspicious attempts
- ✅ Origin validation (CSRF protection)

**Location**: `src/lib/security.ts`

### 5. **Comprehensive Logging**
- ✅ All security events logged
- ✅ Phone numbers masked in logs (show only last 4 digits)
- ✅ Success/failure tracking
- ✅ Ready for monitoring service integration (Sentry, DataDog)

**Location**: `src/lib/security.ts`

### 6. **Frontend Validation**
- ✅ Pre-validation before Firebase OTP send
- ✅ Rate limit checking
- ✅ Phone format validation
- ✅ Better error messages

**Location**: `src/components/FirebaseLogin.tsx`

---

## 📋 Environment Variables Required

### Development (.env.local)
```bash
# Frontend Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDir-vmz1zsEgE6Xo9PXudEM957QZnxDb0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yottascore-6a99f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=yottascore-6a99f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=yottascore-6a99f.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=566653108169
NEXT_PUBLIC_FIREBASE_APP_ID=1:566653108169:web:05edc8ee6bc8931eba3218
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-LPVGETRKKB

# Backend Firebase Admin SDK (REQUIRED FOR PRODUCTION)
FIREBASE_PROJECT_ID=yottascore-6a99f
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@yottascore-6a99f.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9nUUjPtNuya7N\n0XsLSjx6NcicUgcOjLDL0MgQ5M5Wd0B8GiT9fdNGdfyEeMgJvk2QgqPFG7HCGAmc\nFc5akxM4IY3jEatOrbQHfUiKJQtUrrO+mLO5Fk1KowAykYE6hmOIN1Y54Ial25sO\nNHik803p5NE9wG+xCTzXXD2gSJMsZggWDU1PqqlhqFyP/KAZ1vD3KHgDftK3LlJF\ngIMOQO8ORvDH/XNyR3H2WzMMun4J4qWYPQ1wDKAOOADkR6a+MxzzByONDly2VrYc\nTa5x+zsyzERWIXllQny6ZcfTdvY8RWb8sm3Jygu3rksWHm/6XrwlP4MY8VDz8wLu\n1qyLMec9AgMBAAECggEAHu3CU0dyMYYQT142FddcGgsf1+/BWuw0Amrh12+bAJuf\nFx8knXyis8GXGPyilIRIHqRQllw4GJLXLnCYIkoPPn6qqDk/mivXS8lxxabZPEzq\n4NIDrtMmdGA2Lglx7Nvy7Esqc3JeRDuYBS8l5rIRKW+7ebkj/tqk4/QV0UlFSF5s\nQzPQSWAfxmxzoOi4X6LTVDG7ngl0H9vVNCf96KDbqz5bfJYxgWW9HJaIK1x4Ef6F\nxALK+Qitdc6CPIfTFJNUJ8Xfm0ismmvB7Ezjzswf0CLQaymsxu3bRh86Rh7y7bfS\nT8r9eV4WPunh7dpghVNwjgcyAuG1lNLT8OC1fDvDAQKBgQDoxRDmONmutd2Trzpz\nK5aLQ4DqtVRrJqmoEqXM9zVbfhqGGuqL03qKdELg+AYW8ABR48L6YQiQTeA8kxDc\nFxoPdo1e1LkMPig2yEkuBvCWh4JgeMDDB4mUtRT/UdL1uiMKGXKrMiJU3KtxZkK8\n7dujBwLDGBoSylC3XjRKvqYIoQKBgQDQiaTpDF2GLT9cRFMHIf9hXeWIbO/G5HrF\n4eH9ZCNfi+kCuIdJuDP2cZRmJss26ExfbTIENxzPwHB60jHFnTi95+dqXKeyY5P6\nqDKriAUSoVv7MLaXBzVVUXT7h8oyfrc4ctsN08YvVgDFSjeZ9Xm2qIRN9oCKlzVc\n9T8iaTrNHQKBgQCjuHh6deImkKSZC9cAytfIfGJgs8n80+Tg4rzbvcU55SiiyqvO\nTaETYVLpCYq+93BCKQErOrTbSus9r/Nb2qPp3GjzGoxNoCqI3bcbOKZgOk/pqwVq\nKBMNFZD/RH4teA7NO7j70Pd02QF9cX/fgy3JLVU0A+/S55p+XzRInnAKAQKBgEyX\nITBO0FKlb63tkij+fZM/LzxJ9k6wP79J1PyBuNQwyKWtLFMRClSrJnvWJ7DE5Lfv\nnP0bWMOcxDL33DveIKbu83mHCjhkhkb7W5DQZjyPcv7wxz708MujHTn8h3DARX7A\nAGA1tYZRKftL5Nvw4oEJp34S2OcN3hWEJWn4CBapAoGBAIcQKVXVowga7IWKzVOj\nFStJwRYfYn1BvR9FvzjunY9YloGprdD8mR1yZSlNqnQ2XNwnHSgex3wz8wFP3Qab\n1qKE9cPA6/jlJgB3uW2tQcMw5COVVBqD2Y9QGrDaYhdNxk2VuZyGl1PeXY7kKUI5\w8ciMdjhXNC0bT9qlqYYqHSX\n-----END PRIVATE KEY-----"

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL=your-database-url

# JWT Secret (Use strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Production Environment Variables
```bash
# Same as above, but:
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Use strong JWT secret
JWT_SECRET=generate-a-strong-random-secret-key-here
```

---

## 🚀 Production Deployment Checklist

### Before Deployment:

- [ ] **Firebase Admin SDK configured** with service account credentials
- [ ] **Environment variables** set in production (Vercel/Netlify/etc.)
- [ ] **Remove test phone numbers** from Firebase Console
- [ ] **HTTPS enabled** (required for phone auth)
- [ ] **Strong JWT_SECRET** generated and set
- [ ] **Database** configured and accessible
- [ ] **CORS** properly configured for your domain

### After Deployment:

- [ ] Test OTP login flow end-to-end
- [ ] Verify rate limiting works
- [ ] Check security logs
- [ ] Monitor for suspicious activity
- [ ] Setup monitoring alerts (optional)

---

## 🔐 Security Features Breakdown

### Token Verification Flow:

```
1. User enters phone number
   ↓
2. Frontend validates format
   ↓
3. Backend checks rate limits
   ↓
4. Firebase sends OTP
   ↓
5. User enters OTP
   ↓
6. Firebase verifies OTP
   ↓
7. Get Firebase ID token
   ↓
8. Backend verifies with Admin SDK ← SECURE
   ↓
9. Generate app JWT token
   ↓
10. User authenticated ✅
```

### Rate Limits:

| Limit Type | Value | Window |
|------------|-------|--------|
| Per Phone | 3 requests | 1 hour |
| Per Phone | 10 requests | 1 day |
| Per IP | 10 requests | 1 hour |

### Phone Number Rules:

- ✅ Must be Indian number (starts with 6-9)
- ✅ Exactly 10 digits
- ✅ Auto-formatted to E.164 (+919876543210)
- ✅ Test numbers blocked in production

---

## 🧪 Testing

### Development Testing:
```bash
# Start server
npm run dev

# Test with test phone number
Phone: +919999999999
OTP: 123456 (from Firebase Console)
```

### Production Testing:
```bash
# Use real phone number
Phone: +919876543210
OTP: (will receive actual SMS)

# Test rate limiting
# Try sending OTP 4 times in 1 hour - should block
```

---

## 📊 Monitoring & Logs

### Security Events Logged:

```javascript
// OTP send attempt
🔒 [SECURITY] 2024-01-01T12:00:00.000Z - otp_send
{ ip: '192.168.1.1', phoneNumber: '***3210', success: true }

// Login success
🔒 [SECURITY] 2024-01-01T12:00:30.000Z - login_success
{ ip: '192.168.1.1', phoneNumber: '***3210', success: true }

// Rate limit hit
🔒 [SECURITY] 2024-01-01T12:05:00.000Z - rate_limit
{ ip: '192.168.1.1', phoneNumber: '***3210', success: false, message: 'Too many requests' }

// IP blocked
🔒 [SECURITY] 2024-01-01T12:10:00.000Z - ip_block
{ ip: '192.168.1.1', success: false, message: 'Multiple suspicious attempts' }
```

---

## 🔧 Production Configuration

### Vercel Environment Variables:
```bash
# Go to: Vercel Dashboard → Project → Settings → Environment Variables

FIREBASE_PROJECT_ID=yottascore-6a99f
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@yottascore-6a99f.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
JWT_SECRET=your-strong-random-secret
DATABASE_URL=your-production-database-url
```

### Firebase Console Configuration:
1. **Authentication → Settings**
   - ✅ Phone authentication enabled
   - ❌ Remove all test phone numbers
   - ✅ Add production domain to authorized domains

2. **Authentication → Templates**
   - ✅ Customize OTP SMS template (optional)

3. **Service Accounts**
   - ✅ Keep service account key secure
   - ✅ Don't commit to Git
   - ✅ Rotate keys periodically

---

## ⚠️ Security Best Practices

### DO's ✅
- ✅ Use Firebase Admin SDK in production
- ✅ Implement rate limiting
- ✅ Validate phone numbers
- ✅ Log all security events
- ✅ Use HTTPS only
- ✅ Keep secrets in environment variables
- ✅ Monitor suspicious activity
- ✅ Regular security audits

### DON'Ts ❌
- ❌ Never use test phone numbers in production
- ❌ Never use jwt.decode() without verification
- ❌ Never commit .env files to Git
- ❌ Never expose Firebase service account keys
- ❌ Never allow unlimited OTP requests
- ❌ Never skip rate limiting
- ❌ Never trust client-side validation alone

---

## 🐛 Troubleshooting

### Issue: "Firebase Admin SDK not configured"
**Solution**: Add Firebase service account credentials to .env

### Issue: "Too many OTP requests"
**Solution**: Wait for rate limit window to reset, or adjust limits in `src/lib/rate-limiter.ts`

### Issue: "Invalid phone number"
**Solution**: Use format +919876543210 (Indian numbers only)

### Issue: "Access denied from IP"
**Solution**: IP may be blocked due to suspicious activity. Contact support to unblock.

### Issue: "Token verification failed"
**Solution**: 
1. Check Firebase Admin SDK is initialized
2. Verify service account credentials are correct
3. Ensure token is not expired

---

## 📈 Future Enhancements

### Recommended for Scale:
1. **Redis for Rate Limiting**: Replace in-memory store with Redis
2. **Database for IP Blocks**: Persistent IP blocking
3. **Monitoring Service**: Integrate Sentry/DataDog
4. **SMS Provider**: Consider Twilio/AWS SNS for custom OTP
5. **2FA**: Add additional authentication factors
6. **Device Fingerprinting**: Track trusted devices
7. **Geolocation**: Block requests from suspicious locations

### Optional Features:
- Biometric authentication
- Session management
- Refresh tokens
- Device trust system
- Fraud detection AI

---

## 🎯 Current Status

| Feature | Development | Production |
|---------|-------------|------------|
| Firebase Admin SDK | ✅ Optional | ✅ Required |
| Rate Limiting | ✅ Enabled | ✅ Enabled |
| Phone Validation | ✅ Enabled | ✅ Enabled |
| IP Blocking | ✅ Enabled | ✅ Enabled |
| Security Logging | ✅ Enabled | ✅ Enabled |
| Test Numbers | ✅ Allowed | ❌ Blocked |
| Token Verification | ⚠️ Basic decode | ✅ Admin SDK |

---

## 📞 Support

For security issues or concerns:
- Email: security@yottascore.com
- Emergency: Contact Firebase support for account-related issues

**Last Updated**: 2024
**Security Review**: Required before production deployment

