# Image Upload Setup Guide

Yeh image upload system GoDaddy server ke saath kaam karta hai. Setup ke liye yeh steps follow karein:

## Setup Steps

### 1. Environment Variables (.env.local)

`.env.local` file mein yeh variables add karein:

```env
UPLOAD_TOKEN=your_secret_upload_token_here_change_this
PHP_UPLOAD_URL=https://yourdomain.com/upload.php
```

**Important:** 
- `UPLOAD_TOKEN` ko strong random string se replace karein (e.g., use `openssl rand -hex 32`)
- `PHP_UPLOAD_URL` mein apna GoDaddy domain URL daalein

### 2. GoDaddy Server Setup (upload.php)

1. `upload.php` file ko apne GoDaddy hosting ke `public_html` ya `www` folder mein upload karein
2. `upload.php` file khol kar line 17 par `$UPLOAD_TOKEN` ko `.env.local` ke same token se update karein:

```php
$UPLOAD_TOKEN = 'your_secret_upload_token_here_change_this'; // Same as .env.local
```

3. `uploads/` folder create karein (ya `upload.php` automatically create kar dega)

### 3. Folder Permissions

GoDaddy pe `uploads/` folder ka permission 755 set karein:

```bash
chmod 755 uploads/
```

### 4. Usage in Components

#### Single File Upload:

```tsx
import { handleFileUpload } from '@/lib/upload';

const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const result = await handleFileUpload(file);
    if (result.success) {
      console.log('Image URL:', result.url);
      // Use result.url in your component
    } else {
      alert(result.error);
    }
  }
};
```

#### Multiple Files Upload (Parallel):

```tsx
import { handleMultipleFileUpload } from '@/lib/upload';

const handleMultipleFiles = async (files: FileList | null) => {
  if (!files) return;
  
  const fileArray = Array.from(files);
  const results = await handleMultipleFileUpload(fileArray);
  
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`File ${index + 1} URL:`, result.url);
    } else {
      console.error(`File ${index + 1} error:`, result.error);
    }
  });
};
```

#### Multiple Files Upload with Progress:

```tsx
import { handleMultipleFileUploadWithProgress } from '@/lib/upload';

const [uploadProgress, setUploadProgress] = useState(0);

const handleFilesWithProgress = async (files: FileList | null) => {
  if (!files) return;
  
  const fileArray = Array.from(files);
  const results = await handleMultipleFileUploadWithProgress(fileArray, {
    onProgress: (progress) => {
      setUploadProgress(progress);
      console.log(`Upload progress: ${progress.toFixed(0)}%`);
    }
  });
};
```

## Security Features

1. **Token Authentication**: Har request mein token validate hota hai
2. **File Type Validation**: Sirf allowed file types accept hote hain
3. **File Size Limit**: Maximum 5MB file size
4. **CORS Protection**: PHP endpoint CORS headers set karta hai

## File Types Allowed

- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, Excel (XLS, XLSX, ODS)

## Troubleshooting

### Error: "Unauthorized. Invalid upload token"
- Check `.env.local` aur `upload.php` mein same token hai
- Check token properly set ho raha hai environment variable mein

### Error: "Failed to upload file to server"
- Check `PHP_UPLOAD_URL` correct hai
- Check GoDaddy server pe `upload.php` accessible hai
- Check `uploads/` folder exists aur writable hai

### Error: "File size too large"
- Maximum file size 5MB hai
- Agar zyada chahiye, `upload.php` mein `$MAX_FILE_SIZE` update karein

### Files upload nahi ho rahe
- Check GoDaddy hosting pe PHP file uploads enabled hain
- Check `uploads/` folder permissions (755 recommended)
- Check server error logs

## Testing

Upload test karne ke liye:

1. Browser console mein check karein network requests
2. GoDaddy cPanel mein error logs check karein
3. `upload.php` directly test karein:

```bash
curl -X POST https://yourdomain.com/upload.php \
  -H "X-Upload-Token: your_token_here" \
  -F "file=@test.jpg"
```

## API Response Format

Success response:
```json
{
  "success": true,
  "url": "https://yourdomain.com/uploads/1234567890_abc123.jpg",
  "fileName": "1234567890_abc123.jpg",
  "fileSize": 123456,
  "fileType": "image/jpeg"
}
```

Error response:
```json
{
  "error": "Error message here"
}
```

