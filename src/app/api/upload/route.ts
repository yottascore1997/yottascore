import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
];

// Get PHP endpoint URL from environment variable
// Update this with your GoDaddy domain
const PHP_UPLOAD_URL = process.env.PHP_UPLOAD_URL || 'https://store.beyondspacework.com/upload.php';
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // Debug: Log environment variables (without exposing values)
    console.log('[Upload] Environment check:', {
      hasPHPUrl: !!PHP_UPLOAD_URL,
      hasUploadToken: !!UPLOAD_TOKEN,
      phpUrl: PHP_UPLOAD_URL?.substring(0, 30) + '...',
      tokenLength: UPLOAD_TOKEN?.length || 0
    });

    // Get token from Authorization header or X-Upload-Token header
    const authHeader = request.headers.get('Authorization');
    const uploadToken = request.headers.get('X-Upload-Token');
    
    const token = authHeader?.replace('Bearer ', '') || uploadToken;
    
    if (!token) {
      console.error('[Upload] No token provided');
      return NextResponse.json(
        { error: 'Unauthorized. No token provided.' },
        { status: 401 }
      );
    }

    // Validate token:
    // 1. First try to verify as JWT (user's auth token)
    // 2. If UPLOAD_TOKEN is set, also check if token matches UPLOAD_TOKEN
    let isValid = false;
    
    // Try JWT verification first (user's auth token)
    const decodedToken = await verifyToken(token);
    if (decodedToken) {
      isValid = true;
      console.log('[Upload] Token validated as JWT');
    } else if (UPLOAD_TOKEN && token === UPLOAD_TOKEN) {
      // If JWT verification fails, check if it's the UPLOAD_TOKEN
      isValid = true;
      console.log('[Upload] Token validated as UPLOAD_TOKEN');
    } else {
      console.error('[Upload] Token validation failed - JWT invalid and UPLOAD_TOKEN mismatch');
    }
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid token.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Allowed: Images (JPEG, PNG, GIF, WebP), PDF, Excel.',
        },
        { status: 400 }
      );
    }

    // Check if PHP endpoint is configured
    // Use PHP upload if UPLOAD_TOKEN is set AND PHP_UPLOAD_URL is not a placeholder
    const usePHPUpload = UPLOAD_TOKEN && PHP_UPLOAD_URL && 
                        PHP_UPLOAD_URL !== 'https://yourdomain.com/upload.php' &&
                        PHP_UPLOAD_URL.includes('upload.php');
    
    console.log('[Upload] Config check:', {
      hasUploadToken: !!UPLOAD_TOKEN,
      phpUploadUrl: PHP_UPLOAD_URL,
      usePHPUpload,
      fileSize: file.size,
      fileName: file.name
    });
    
    if (usePHPUpload) {
      // Forward file to PHP endpoint using FormData
      const buffer = Buffer.from(await file.arrayBuffer());

      try {
        console.log('[Upload] Forwarding to PHP endpoint:', PHP_UPLOAD_URL);
        console.log('[Upload] File details:', {
          name: file.name,
          type: file.type,
          size: buffer.length
        });
        
        // For Node.js, we need to manually construct multipart/form-data
        // Since native FormData in Node.js might have issues with external endpoints
        const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}`;
        const formDataParts: Buffer[] = [];
        
        // Add file field
        const fileHeader = `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n` +
          `Content-Type: ${file.type}\r\n\r\n`;
        formDataParts.push(Buffer.from(fileHeader));
        formDataParts.push(buffer);
        formDataParts.push(Buffer.from('\r\n'));
        
        // Add closing boundary
        formDataParts.push(Buffer.from(`--${boundary}--\r\n`));
        
        const formDataBody = Buffer.concat(formDataParts);
        
        // Use fetch with manually constructed multipart/form-data
        // Note: If SSL certificate issues, you might need to configure Node.js to accept self-signed certs
        const phpResponse = await fetch(PHP_UPLOAD_URL, {
          method: 'POST',
          body: formDataBody,
          headers: {
            'X-Upload-Token': UPLOAD_TOKEN!,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': formDataBody.length.toString(),
          },
          // Remove timeout to see if it's a timeout issue
          // signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        console.log('[Upload] PHP response status:', phpResponse.status);

        if (!phpResponse.ok) {
          const errorText = await phpResponse.text();
          console.error('[Upload] PHP endpoint error response:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `PHP upload failed: ${phpResponse.status} ${phpResponse.statusText}`, raw: errorText };
          }
          
          return NextResponse.json(
            { error: errorData.error || 'Failed to upload file to server', details: errorData },
            { status: phpResponse.status }
          );
        }

        const phpResult = await phpResponse.json();
        console.log('[Upload] PHP upload successful:', phpResult);

        return NextResponse.json({
          success: true,
          url: phpResult.url,
          fileName: phpResult.fileName,
          fileSize: phpResult.fileSize,
          type: file.type,
        });
      } catch (phpError: any) {
        console.error('[Upload] PHP forwarding error:', {
          message: phpError.message,
          code: phpError.code,
          cause: phpError.cause,
          endpoint: PHP_UPLOAD_URL
        });
        
        // Check if it's a DNS resolution error
        if (phpError.code === 'ENOTFOUND') {
          return NextResponse.json(
            { 
              error: 'DNS Resolution Failed',
              details: `Cannot resolve domain: ${PHP_UPLOAD_URL.split('/')[2]}. Please check: 1) Domain name is correct, 2) Domain is live and accessible, 3) DNS is properly configured`,
              endpoint: PHP_UPLOAD_URL,
              code: 'ENOTFOUND',
              suggestion: 'Try accessing the URL in your browser to verify it exists'
            },
            { status: 502 }
          );
        }
        
        // Check if it's a network/SSL error
        if (phpError.message.includes('fetch failed') || phpError.code === 'ECONNREFUSED') {
          return NextResponse.json(
            { 
              error: 'Failed to connect to PHP endpoint',
              details: `Cannot reach ${PHP_UPLOAD_URL}. Please check: 1) Server is online, 2) URL is correct, 3) SSL certificate is valid`,
              endpoint: PHP_UPLOAD_URL,
              code: phpError.code || 'NETWORK_ERROR'
            },
            { status: 502 }
          );
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to upload file to PHP endpoint',
            details: phpError.message,
            endpoint: PHP_UPLOAD_URL
          },
          { status: 500 }
        );
      }
    }

    // Fallback: Return error if PHP endpoint is required but not configured
    if (!UPLOAD_TOKEN) {
      return NextResponse.json(
        { 
          error: 'Upload service not configured. Please set UPLOAD_TOKEN in .env.local',
          details: 'PHP endpoint requires UPLOAD_TOKEN to be set in environment variables'
        },
        { status: 500 }
      );
    }

    // If we reach here, PHP upload was attempted but failed
    return NextResponse.json(
      { 
        error: 'Failed to upload file to PHP endpoint',
        details: `Upload endpoint: ${PHP_UPLOAD_URL}. Please check server configuration.`
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
