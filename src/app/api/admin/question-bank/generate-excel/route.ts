import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface GeneratedQuestion {
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

/**
 * Generate questions using Gemini AI
 */
async function generateWithGemini(
  topic: string,
  category: string,
  difficulty: string,
  count: number
): Promise<GeneratedQuestion[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `Generate ${count} multiple-choice questions (MCQ) about "${topic}" in the category "${category}" with ${difficulty} difficulty.

Each question must have:
- A clear, unique question text (do NOT repeat questions)
- Exactly 4 options
- One correct answer (index: 0-3)
- A brief explanation

Return ONLY a valid JSON array:
[
  {
    "text": "Question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation"
  }
]

Make each question unique and relevant to the topic.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    
    try {
      const questions = JSON.parse(jsonString);
      return Array.isArray(questions) ? questions : [];
    } catch (error) {
      throw new Error(`Failed to parse Gemini response: ${error}`);
    }
  } catch (error: any) {
    console.error('[Gemini] Error:', error);
    throw error;
  }
}

/**
 * Generate questions in batches (for 1000+ questions)
 */
async function generateBulkQuestionsWithGemini(
  topic: string,
  category: string,
  difficulty: string,
  totalCount: number
): Promise<GeneratedQuestion[]> {
  const batchSize = 50; // Generate 50 questions per API call
  const allQuestions: GeneratedQuestion[] = [];
  const batches = Math.ceil(totalCount / batchSize);

  console.log(`[Gemini Excel] Generating ${totalCount} questions in ${batches} batches`);

  for (let i = 0; i < batches; i++) {
    const currentBatchSize = Math.min(batchSize, totalCount - allQuestions.length);
    
    console.log(`[Gemini Excel] Batch ${i + 1}/${batches}: Generating ${currentBatchSize} questions...`);

    try {
      const batchQuestions = await generateWithGemini(
        topic,
        category,
        difficulty,
        currentBatchSize
      );
      
      allQuestions.push(...batchQuestions);
      console.log(`[Gemini Excel] Batch ${i + 1} complete: ${batchQuestions.length} questions generated`);

      // Rate limiting: Wait between batches (Gemini free tier limit: 60 requests/minute)
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    } catch (error: any) {
      console.error(`[Gemini Excel] Batch ${i + 1} failed:`, error.message);
      // Continue with next batch even if one fails
    }
  }

  return allQuestions.slice(0, totalCount);
}

/**
 * POST: Generate questions with Gemini and export as Excel
 */
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

    const { topic, categoryId, difficulty, count = 1000, saveToDatabase = false } = await req.json();
    
    if (!topic || !categoryId) {
      return NextResponse.json({ 
        message: 'Topic and category are required.' 
      }, { status: 400 });
    }

    if (count < 1 || count > 1000) {
      return NextResponse.json({ 
        message: 'Count must be between 1 and 1000.' 
      }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        message: 'GEMINI_API_KEY not configured. Please add it to .env.local',
        suggestion: 'Get free API key from: https://makersuite.google.com/app/apikey'
      }, { status: 400 });
    }

    // Verify category exists
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

    console.log(`[Gemini Excel] Starting generation: ${count} questions for "${topic}"`);

    // Generate questions using Gemini AI
    let generatedQuestions: GeneratedQuestion[];
    
    if (count > 50) {
      // For large batches, generate in chunks
      generatedQuestions = await generateBulkQuestionsWithGemini(
        topic,
        category.name,
        difficulty || 'MEDIUM',
        count
      );
    } else {
      // For small batches, single request
      generatedQuestions = await generateWithGemini(
        topic,
        category.name,
        difficulty || 'MEDIUM',
        count
      );
    }

    console.log(`[Gemini Excel] Generated ${generatedQuestions.length} questions`);

    // Validate generated questions
    const validQuestions = generatedQuestions.filter(q => 
      q.text && 
      Array.isArray(q.options) && 
      q.options.length === 4 &&
      typeof q.correct === 'number' &&
      q.correct >= 0 && 
      q.correct < 4
    );

    if (validQuestions.length === 0) {
      return NextResponse.json({ 
        message: 'No valid questions generated. Please try again.' 
      }, { status: 400 });
    }

    // Optionally save to database
    let savedCount = 0;
    if (saveToDatabase) {
      const batchSize = 100;
      for (let i = 0; i < validQuestions.length; i += batchSize) {
        const batch = validQuestions.slice(i, i + batchSize);
        const batchData = batch.map(q => ({
          text: q.text,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation || '',
          difficulty: (difficulty || 'MEDIUM') as any,
          categoryId,
          createdById: decoded.userId,
        }));

        await prisma.questionBankItem.createMany({
          data: batchData,
          skipDuplicates: true
        });
        savedCount += batch.length;
      }
      console.log(`[Gemini Excel] Saved ${savedCount} questions to database`);
    }

    // Create Excel file
    const excelData = [
      [
        'Question Text',
        'Option 1',
        'Option 2',
        'Option 3',
        'Option 4',
        'Correct Answer (1-4)',
        'Explanation',
        'Difficulty'
      ],
      ...validQuestions.map(q => [
        q.text,
        q.options[0] || '',
        q.options[1] || '',
        q.options[2] || '',
        q.options[3] || '',
        (q.correct + 1).toString(), // Convert 0-indexed to 1-indexed for Excel
        q.explanation || '',
        difficulty || 'MEDIUM'
      ])
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 60 }, // Question Text
      { wch: 30 }, // Option 1
      { wch: 30 }, // Option 2
      { wch: 30 }, // Option 3
      { wch: 30 }, // Option 4
      { wch: 18 }, // Correct Answer
      { wch: 50 }, // Explanation
      { wch: 12 }  // Difficulty
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

    // Generate Excel buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename
    const safeTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    const filename = `${safeTopic}_${count}_questions_${Date.now()}.xlsx`;

    console.log(`[Gemini Excel] Excel file created: ${filename}`);

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[Gemini Excel] Error:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to generate Excel file.',
      error: error.message
    }, { status: 500 });
  }
}





