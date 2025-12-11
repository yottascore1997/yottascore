# Railway Database Deployment Guide

## 🚀 Steps to Deploy Changes to Railway

### 1. **Update Existing PENDING Posts to APPROVED**

Railway database में existing PENDING posts को APPROVED में convert करें:

#### Option A: Railway Dashboard से (Recommended)
1. Railway dashboard में जाएं
2. अपने database service को select करें
3. "Query" या "MySQL" tab खोलें
4. नीचे दिया गया SQL query run करें:

```sql
UPDATE Post 
SET status = 'APPROVED' 
WHERE status = 'PENDING';
```

#### Option B: Railway CLI से
```bash
# Railway CLI install करें (अगर नहीं है)
npm i -g @railway/cli

# Login करें
railway login

# Database connect करें
railway connect

# SQL query run करें
mysql -h $DATABASE_HOST -u $DATABASE_USER -p$DATABASE_PASSWORD $DATABASE_NAME -e "UPDATE Post SET status = 'APPROVED' WHERE status = 'PENDING';"
```

### 2. **Verify Database Connection**

Railway में `DATABASE_URL` environment variable check करें:

```bash
# Railway dashboard में:
# Service → Variables → DATABASE_URL

# Format होना चाहिए:
# mysql://user:password@host:port/database
```

### 3. **Deploy Code Changes**

#### Railway Dashboard से:
1. GitHub repository connect करें (अगर नहीं है)
2. Auto-deploy enable करें
3. या manually "Deploy" button click करें

#### Railway CLI से:
```bash
# Project link करें
railway link

# Deploy करें
railway up
```

### 4. **Run Prisma Migrations (अगर जरूरत हो)**

```bash
# Railway dashboard में "Deploy" command में add करें:
npx prisma migrate deploy

# या build command में:
prisma generate && prisma migrate deploy && next build
```

### 5. **Verify Changes**

Deployment के बाद verify करें:

1. **Posts API Test:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-app.railway.app/api/student/posts
   ```

2. **Profile Posts Test:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-app.railway.app/api/student/posts/user/USER_ID
   ```

## 📋 Environment Variables Checklist

Railway dashboard में ये variables set करें:

- ✅ `DATABASE_URL` - Railway MySQL connection string
- ✅ `JWT_SECRET` - JWT token secret
- ✅ `NODE_ENV=production`
- ✅ अन्य required environment variables

## 🔍 Troubleshooting

### Error: "500 Internal Server Error"
- Database connection check करें
- `DATABASE_URL` format verify करें
- Railway database logs check करें

### Posts नहीं दिख रहे
- SQL query run करें: `SELECT status, COUNT(*) FROM Post GROUP BY status;`
- सभी posts `APPROVED` status में होनी चाहिए

### Migration Issues
```bash
# Prisma client regenerate करें
npx prisma generate

# Database schema check करें
npx prisma db pull
```

## ✅ Post-Deployment Checklist

- [ ] All PENDING posts converted to APPROVED
- [ ] Code deployed to Railway
- [ ] Environment variables set correctly
- [ ] API endpoints working
- [ ] Posts instantly visible after creation
- [ ] Profile page showing correct post count

## 📞 Support

अगर कोई issue हो, तो:
1. Railway logs check करें
2. Database query logs देखें
3. API response errors check करें

