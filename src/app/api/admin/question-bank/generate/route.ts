import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface GeneratedQuestion {
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

/**
 * Generate questions using OpenAI API
 */
async function generateWithOpenAI(
  topic: string,
  category: string,
  difficulty: string,
  count: number
): Promise<GeneratedQuestion[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `Generate ${count} multiple-choice questions (MCQ) about "${topic}" in the category "${category}" with ${difficulty} difficulty.

Each question should have:
- A clear, concise question text
- Exactly 4 options (A, B, C, D)
- One correct answer (specify the index: 0, 1, 2, or 3)
- A brief explanation for why the answer is correct

Return the response as a JSON array with this exact format:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation here"
  }
]

Make questions educational, relevant, and appropriate for quiz purposes. Ensure diversity in topics within the subject.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert quiz question generator. Always return valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Parse JSON from response (sometimes includes markdown code blocks)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  const jsonString = jsonMatch ? jsonMatch[0] : content;
  
  try {
    const questions = JSON.parse(jsonString);
    return questions;
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error}`);
  }
}

/**
 * Generate questions using Google Gemini API (Fallback)
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
- A clear question text
- Exactly 4 options
- One correct answer (index: 0-3)
- A brief explanation

Return ONLY a valid JSON array:
[
  {
    "text": "Question?",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "Explanation"
  }
]`;

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
    return questions;
  } catch (error) {
    throw new Error(`Failed to parse Gemini response: ${error}`);
  }
}

/**
 * POST: Generate questions automatically using AI
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

    const { topic, categoryId, difficulty, count = 5, provider = 'template' } = await req.json();
    
    if (!topic || !categoryId) {
      return NextResponse.json({ 
        message: 'Topic and category are required.' 
      }, { status: 400 });
    }

    if (count < 1 || count > 20) {
      return NextResponse.json({ 
        message: 'Count must be between 1 and 20.' 
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

    // Generate questions using selected method
    let generatedQuestions: GeneratedQuestion[];
    
    // If template-based (FREE), use templates
    if (provider === 'template') {
      try {
        // Import template generator
        const templateResponse = await fetch(`${req.nextUrl.origin}/api/admin/question-bank/generate-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({ topic, categoryId, difficulty, count })
        });
        
        if (!templateResponse.ok) {
          throw new Error('Template generation failed');
        }
        
        const templateData = await templateResponse.json();
        return NextResponse.json(templateData);
      } catch (templateError: any) {
        console.error('Template generation error:', templateError);
        return NextResponse.json({ 
          message: 'Failed to generate questions with templates.',
          error: templateError.message
        }, { status: 500 });
      }
    }
    
    // Use AI generation
    try {
      if (provider === 'gemini' || (!OPENAI_API_KEY && GEMINI_API_KEY)) {
        if (!GEMINI_API_KEY) {
          return NextResponse.json({ 
            message: 'GEMINI_API_KEY not configured. Please use template-based generation (FREE) or add API key.',
            suggestion: 'Set GEMINI_API_KEY in .env.local or use template method'
          }, { status: 400 });
        }
        generatedQuestions = await generateWithGemini(
          topic,
          category.name,
          difficulty || 'MEDIUM',
          count
        );
      } else {
        if (!OPENAI_API_KEY) {
          return NextResponse.json({ 
            message: 'OPENAI_API_KEY not configured. Please use template-based generation (FREE) or add API key.',
            suggestion: 'Set OPENAI_API_KEY in .env.local or use template method'
          }, { status: 400 });
        }
        generatedQuestions = await generateWithOpenAI(
          topic,
          category.name,
          difficulty || 'MEDIUM',
          count
        );
      }
    } catch (aiError: any) {
      console.error('AI Generation error:', aiError);
      return NextResponse.json({ 
        message: 'Failed to generate questions with AI.',
        error: aiError.message,
        suggestion: 'Please check your API key configuration (OPENAI_API_KEY or GEMINI_API_KEY) or use template-based generation (FREE)'
      }, { status: 500 });
    }

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

    // Save questions to database
    const savedQuestions = [];
    for (const q of validQuestions) {
      try {
        const question = await prisma.questionBankItem.create({
          data: {
            text: q.text,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation || '',
            difficulty: (difficulty || 'MEDIUM') as any,
            categoryId,
            createdById: decoded.userId,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        });
        savedQuestions.push(question);
      } catch (dbError) {
        console.error('Failed to save question:', dbError);
        // Continue with other questions
      }
    }

    return NextResponse.json({
      success: true,
      generated: validQuestions.length,
      saved: savedQuestions.length,
      questions: savedQuestions,
      message: `Successfully generated and saved ${savedQuestions.length} questions.`
    });
  } catch (error: any) {
    console.error('Auto-generate questions error:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to generate questions.' 
    }, { status: 500 });
  }
}

