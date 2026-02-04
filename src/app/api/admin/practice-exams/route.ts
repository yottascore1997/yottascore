import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const exams = await prisma.practiceExam.findMany({
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        title: true,
        spots: true,
        spotsLeft: true,
        startTime: true,
        endTime: true,
      },
    });
    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Handle FormData for file upload
    const formData = await req.formData();
    console.log('FormData received');
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const instructions = formData.get('instructions') as string;
    const category = formData.get('category') as string;
    const subcategory = formData.get('subcategory') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const duration = parseInt(formData.get('duration') as string);
    const spots = parseInt(formData.get('spots') as string);
    const questions = JSON.parse(formData.get('questions') as string);
    const logoFile = formData.get('logo') as File | null;
    const categoryLogoFile = formData.get('categoryLogo') as File | null;
    
    console.log('Parsed form data:', {
      title, description, instructions, category, subcategory,
      startTime, endTime, duration, spots, questionsCount: questions?.length
    });
    if (!title || !startTime || !duration || !spots || !category || !subcategory) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Handle logo uploads - use same path as live exams (PHP upload endpoint)
    let logoUrl: string | null = null;
    let categoryLogoUrl: string | null = null;
    
    // Helper function to upload a file
    const uploadFile = async (file: File): Promise<string | null> => {
      try {
        const PHP_UPLOAD_URL = process.env.PHP_UPLOAD_URL || 'https://score.yottascore.com/upload.php';
        const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN;
        
        // Validate file size (max 5MB)
        const MAX_SIZE_BYTES = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE_BYTES) {
          console.error('File too large');
          return null;
        }
        
        // Validate file type
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
          console.error('Invalid file type');
          return null;
        }
        
        if (UPLOAD_TOKEN && PHP_UPLOAD_URL && PHP_UPLOAD_URL.includes('upload.php')) {
          // Forward to PHP endpoint (same as live exams) - use same multipart/form-data construction
          const buffer = Buffer.from(await file.arrayBuffer());
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
          
          const uploadResponse = await fetch(PHP_UPLOAD_URL, {
            method: 'POST',
            body: formDataBody,
            headers: {
              'X-Upload-Token': UPLOAD_TOKEN,
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': formDataBody.length.toString(),
            },
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            const returnedUrl = uploadData.url;
            if (!returnedUrl || typeof returnedUrl !== 'string') return null;
            // Normalize URL: use same origin as PHP_UPLOAD_URL so DB always has correct domain (e.g. yottascore.com)
            try {
              const origin = new URL(PHP_UPLOAD_URL).origin;
              const pathname = new URL(returnedUrl).pathname;
              return origin + pathname;
            } catch {
              return returnedUrl;
            }
          } else {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
            console.error('Error uploading file via PHP endpoint:', errorData);
            return null;
          }
        } else {
          console.warn('PHP upload not configured, skipping file upload');
          return null;
        }
      } catch (fileError) {
        console.error('Error uploading file:', fileError);
        return null;
      }
    };
    
    // Upload subcategory logo
    if (logoFile && logoFile.size > 0) {
      console.log('Processing subcategory logo file:', {
        name: logoFile.name,
        size: logoFile.size,
        type: logoFile.type
      });
      logoUrl = await uploadFile(logoFile);
      if (logoUrl) {
        console.log('Subcategory logo uploaded successfully:', logoUrl);
      }
    }
    
    // Upload category logo
    if (categoryLogoFile && categoryLogoFile.size > 0) {
      console.log('Processing category logo file:', {
        name: categoryLogoFile.name,
        size: categoryLogoFile.size,
        type: categoryLogoFile.type
      });
      categoryLogoUrl = await uploadFile(categoryLogoFile);
      if (categoryLogoUrl) {
        console.log('Category logo uploaded successfully:', categoryLogoUrl);
      }
    }
    
    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    console.log('Creating exam with data:', {
      title,
      description,
      instructions,
      category,
      subcategory,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      duration,
      spots,
      spotsLeft: spots,
      createdById: decoded.userId,
      questionsCount: questions?.length || 0
    });
    
    // Try creating without questions first
    const examData = {
      title,
      description,
      instructions,
      category,
      subcategory,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      duration,
      spots,
      spotsLeft: spots,
      createdById: decoded.userId,
      logoUrl,
      categoryLogoUrl,
    };
    
    console.log('Exam data without questions:', examData);
    
    const exam = await prisma.practiceExam.create({
      data: examData,
    });
    
    console.log('Exam created successfully:', exam.id);
    
    // If there are questions, add them separately
    if (questions && Array.isArray(questions) && questions.length > 0) {
      console.log('Adding questions:', questions.length);
      for (const q of questions) {
        await prisma.practiceExamQuestion.create({
          data: {
            examId: exam.id,
            text: q.text,
            options: q.options,
            correct: q.correct,
            marks: q.marks || 1,
          },
        });
      }
      console.log('Questions added successfully');
    }
    
    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error creating practice exam:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 