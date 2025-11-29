# .env File Configuration

Aapke `.env` file mein yeh dono variables honi chahiye:

```env
PHP_UPLOAD_URL=https://store.beyondspacework.com/upload.php
UPLOAD_TOKEN=your_secret_token_here
```

## Abhi kya karna hai:

1. `.env` file kholiye
2. Add kariye:
   ```
   UPLOAD_TOKEN=your_secret_upload_token_here
   ```
   
   **Important:** `UPLOAD_TOKEN` ko ek strong random string se replace karein.

3. **Same token `upload.php` file mein bhi set karein** (line 17):
   ```php
   $UPLOAD_TOKEN = 'your_secret_upload_token_here'; // Same as .env
   ```

4. Next.js dev server **restart** karein (stop aur start karein)

## Quick Token Generate (Optional):

Terminal mein yeh command run karein strong token generate karne ke liye:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Example .env file:

```env
PHP_UPLOAD_URL=https://store.beyondspacework.com/upload.php
UPLOAD_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

**Yaad rakhein:** `UPLOAD_TOKEN` dono jagah same hona chahiye:
- `.env` file mein
- `upload.php` file mein (GoDaddy server pe)

