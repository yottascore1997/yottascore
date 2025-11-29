# Environment Variables Setup

Aapko `.env.local` file mein yeh environment variables add karne hain:

## Required Variables

```env
# Upload Configuration
UPLOAD_TOKEN=your_secret_upload_token_here
PHP_UPLOAD_URL=https://store.beyondspacework.com/upload.php
```

## Steps to Setup:

1. Project root mein `.env.local` file create karein (agar nahi hai)

2. Upar wale variables add karein

3. **UPLOAD_TOKEN** ko strong random string se replace karein:
   - Terminal mein yeh command run karein:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   - Ya manually ek long random string use karein (e.g., `my_secure_upload_token_2024_xyz123`)

4. **PHP_UPLOAD_URL** already set hai: `https://store.beyondspacework.com/upload.php`

5. `upload.php` file mein same token set karein (line 17):
   ```php
   $UPLOAD_TOKEN = 'your_secret_upload_token_here'; // Same as .env.local
   ```

6. Next.js dev server restart karein:
   ```bash
   npm run dev
   ```

## Important Notes:

- `.env.local` file git mein commit nahi hoti (`.gitignore` mein hoti hai)
- Token dono jagah (`.env.local` aur `upload.php`) same hona chahiye
- Server restart ke baad changes apply honge

