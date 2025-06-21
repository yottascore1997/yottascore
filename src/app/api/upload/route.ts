import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { stat, mkdir } from 'fs/promises';

export async function POST(req: Request) {
  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file found' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create a unique filename to avoid overwriting
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  
  // Define the path to the public/uploads directory
  const uploadDir = join(process.cwd(), 'public/uploads');

  // Ensure the upload directory exists
  try {
    // Check if directory exists
    await stat(uploadDir);
  } catch (e: any) {
    // If it doesn't exist, create it
    if (e.code === 'ENOENT') {
      await mkdir(uploadDir, { recursive: true });
    } else {
      console.error('Error while checking directory:', e);
      return NextResponse.json({ success: false, error: 'Could not create upload directory' }, { status: 500 });
    }
  }

  const path = join(uploadDir, filename);
  
  try {
    await writeFile(path, buffer);
    console.log(`File uploaded to ${path}`);
    
    // Return the public URL of the file, which the client can use
    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ success: false, error: 'Failed to save file' }, { status: 500 });
  }
} 