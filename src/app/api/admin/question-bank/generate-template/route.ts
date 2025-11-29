import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Template-based question generation - COMPLETELY FREE
 * Uses pre-defined templates and variations
 */

interface QuestionTemplate {
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

// Pre-defined question templates for common topics
const questionTemplates: Record<string, QuestionTemplate[]> = {
  'programming': [
    {
      text: 'What is the output of the following code?\n\n```\nprint(2 + 3 * 2)\n```',
      options: ['8', '10', '7', '12'],
      correct: 0,
      explanation: 'Multiplication has higher precedence than addition, so 3*2=6, then 2+6=8'
    },
    {
      text: 'Which keyword is used to define a function in Python?',
      options: ['func', 'function', 'def', 'define'],
      correct: 2,
      explanation: 'In Python, the "def" keyword is used to define a function'
    },
    {
      text: 'What does HTML stand for?',
      options: ['HyperText Markup Language', 'High-level Text Markup Language', 'Hyperlink Text Markup Language', 'Home Tool Markup Language'],
      correct: 0,
      explanation: 'HTML stands for HyperText Markup Language'
    }
  ],
  'general': [
    {
      text: 'What is the capital of India?',
      options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
      correct: 1,
      explanation: 'Delhi is the capital of India'
    },
    {
      text: 'Who wrote "Romeo and Juliet"?',
      options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
      correct: 1,
      explanation: 'William Shakespeare wrote Romeo and Juliet'
    }
  ],
  'math': [
    {
      text: 'What is 15 × 8?',
      options: ['100', '120', '105', '115'],
      correct: 1,
      explanation: '15 multiplied by 8 equals 120'
    },
    {
      text: 'What is the square root of 64?',
      options: ['6', '7', '8', '9'],
      correct: 2,
      explanation: '8 × 8 = 64, so the square root of 64 is 8'
    }
  ]
};

// Generate variations of questions based on topic keywords
function generateQuestionsFromTemplates(
  topic: string,
  count: number
): QuestionTemplate[] {
  const lowerTopic = topic.toLowerCase();
  const generated: QuestionTemplate[] = [];
  
  // Detect topic category
  let category = 'general';
  if (lowerTopic.includes('program') || lowerTopic.includes('code') || 
      lowerTopic.includes('python') || lowerTopic.includes('javascript') ||
      lowerTopic.includes('html') || lowerTopic.includes('css')) {
    category = 'programming';
  } else if (lowerTopic.includes('math') || lowerTopic.includes('calculate') ||
             lowerTopic.includes('arithmetic') || lowerTopic.includes('number')) {
    category = 'math';
  }
  
  // Get base templates
  const templates = questionTemplates[category] || questionTemplates['general'];
  
  // Generate variations
  for (let i = 0; i < count && i < 20; i++) {
    const template = templates[i % templates.length];
    
    // Create variation
    const variation: QuestionTemplate = {
      text: `${template.text} (${topic} - Question ${i + 1})`,
      options: [...template.options],
      correct: template.correct,
      explanation: template.explanation
    };
    
    // Shuffle options sometimes
    if (i % 2 === 0) {
      const shuffled = [...template.options];
      const correctAnswer = shuffled[template.correct];
      shuffled.sort(() => Math.random() - 0.5);
      const newCorrect = shuffled.indexOf(correctAnswer);
      variation.options = shuffled;
      variation.correct = newCorrect;
    }
    
    generated.push(variation);
  }
  
  return generated;
}

/**
 * POST: Generate questions using templates (FREE - No API needed)
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

    const { topic, categoryId, difficulty, count = 5 } = await req.json();
    
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

    // Generate questions using templates (FREE)
    const generatedQuestions = generateQuestionsFromTemplates(topic, count);

    // Save questions to database
    const savedQuestions = [];
    for (const q of generatedQuestions) {
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
      }
    }

    return NextResponse.json({
      success: true,
      generated: generatedQuestions.length,
      saved: savedQuestions.length,
      questions: savedQuestions,
      message: `Successfully generated and saved ${savedQuestions.length} questions using FREE templates!`,
      method: 'template-based'
    });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to generate questions.' 
    }, { status: 500 });
  }
}





