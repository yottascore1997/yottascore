import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const categoryId = formData.get('categoryId') as string;
    const difficulty = formData.get('difficulty') as string || 'MEDIUM';

    if (!file || !categoryId) {
      return NextResponse.json({ 
        message: 'File and category are required.' 
      }, { status: 400 });
    }

    // Verify category exists and belongs to admin
    const category = await prisma.questionCategory.findFirst({
      where: {
        id: categoryId,
        createdById: decoded.userId
      }
    });

    if (!category) {
      return NextResponse.json({ 
        message: 'Category not found or access denied.' 
      }, { status: 404 });
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Skip header row and process data
    const questions = data.slice(1).filter((row: any) => 
      row.length >= 6 && row[0] && row[1] && row[2] && row[3] && row[4] && row[5]
    );

    if (questions.length === 0) {
      return NextResponse.json({ 
        message: 'No valid questions found in the file.' 
      }, { status: 400 });
    }

    const results = {
      total: questions.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      try {
        const row = questions[i] as any[];
        const [text, option1, option2, option3, option4, correct, explanation, tags] = row;

        // Validate required fields
        if (!text || !option1 || !option2 || !option3 || !option4) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        // Validate correct answer
        const correctIndex = parseInt(correct) - 1; // Convert 1-based to 0-based
        if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Invalid correct answer (should be 1-4)`);
          continue;
        }

        // Parse tags
        let parsedTags: string[] = [];
        if (tags) {
          parsedTags = tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }

        // Create question
        await prisma.questionBankItem.create({
          data: {
            text: text.toString().trim(),
            options: [
              option1.toString().trim(),
              option2.toString().trim(),
              option3.toString().trim(),
              option4.toString().trim()
            ],
            correct: correctIndex,
            explanation: explanation ? explanation.toString().trim() : null,
            difficulty: difficulty as 'EASY' | 'MEDIUM' | 'HARD',
            tags: parsedTags,
            categoryId,
            createdById: decoded.userId,
          },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: `Import completed. ${results.success} questions imported successfully, ${results.failed} failed.`,
      results
    });

  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to import questions.' 
    }, { status: 500 });
  }
} 