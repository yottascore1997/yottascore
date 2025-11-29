import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Bulk generate questions - For generating 1000+ questions at once
 * Uses template-based generation (FREE) with batch processing
 */

interface QuestionTemplate {
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

// Expanded question templates
const questionTemplates: Record<string, QuestionTemplate[]> = {
  'programming': [
    { text: 'What is the output of print(2 + 3 * 2)?', options: ['8', '10', '7', '12'], correct: 0, explanation: 'Multiplication has higher precedence' },
    { text: 'Which keyword defines a function in Python?', options: ['func', 'function', 'def', 'define'], correct: 2, explanation: '"def" keyword is used in Python' },
    { text: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High-level Text Markup', 'Hyperlink Text Markup', 'Home Tool Markup'], correct: 0, explanation: 'HTML = HyperText Markup Language' },
    { text: 'What is CSS used for?', options: ['Database queries', 'Styling web pages', 'Server logic', 'File storage'], correct: 1, explanation: 'CSS is for styling' },
    { text: 'Which loop runs at least once?', options: ['for', 'while', 'do-while', 'foreach'], correct: 2, explanation: 'do-while executes at least once' },
    { text: 'What is JavaScript?', options: ['A database', 'A programming language', 'A browser', 'An OS'], correct: 1, explanation: 'JavaScript is a programming language' },
    { text: 'What is an array index?', options: ['The array name', 'The position of element', 'The array length', 'The data type'], correct: 1, explanation: 'Index is the position' },
    { text: 'What does API stand for?', options: ['Application Programming Interface', 'Advanced Program Interface', 'Application Program Interface', 'Automated Program Interface'], correct: 0, explanation: 'API = Application Programming Interface' },
    { text: 'What is a variable?', options: ['A function', 'A data container', 'A loop', 'A condition'], correct: 1, explanation: 'Variable stores data' },
    { text: 'What is recursion?', options: ['A loop type', 'Function calling itself', 'A data type', 'An operator'], correct: 1, explanation: 'Recursion is self-calling function' }
  ],
  'math': [
    { text: 'What is 15 × 8?', options: ['100', '120', '105', '115'], correct: 1, explanation: '15 × 8 = 120' },
    { text: 'What is the square root of 64?', options: ['6', '7', '8', '9'], correct: 2, explanation: '8 × 8 = 64' },
    { text: 'What is 25 + 37?', options: ['61', '62', '63', '64'], correct: 1, explanation: '25 + 37 = 62' },
    { text: 'What is 100 ÷ 4?', options: ['20', '25', '30', '35'], correct: 1, explanation: '100 ÷ 4 = 25' },
    { text: 'What is 3²?', options: ['6', '9', '12', '15'], correct: 1, explanation: '3² = 3 × 3 = 9' },
    { text: 'What is 50 - 23?', options: ['25', '27', '28', '29'], correct: 1, explanation: '50 - 23 = 27' },
    { text: 'What is 12 × 5?', options: ['55', '60', '65', '70'], correct: 1, explanation: '12 × 5 = 60' },
    { text: 'What is the square of 7?', options: ['42', '49', '56', '63'], correct: 1, explanation: '7² = 49' },
    { text: 'What is 144 ÷ 12?', options: ['10', '11', '12', '13'], correct: 2, explanation: '144 ÷ 12 = 12' },
    { text: 'What is 8³?', options: ['384', '512', '640', '768'], correct: 1, explanation: '8³ = 8 × 8 × 8 = 512' }
  ],
  'general': [
    { text: 'What is the capital of India?', options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'], correct: 1, explanation: 'Delhi is the capital' },
    { text: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correct: 1, explanation: 'Shakespeare wrote it' },
    { text: 'How many continents are there?', options: ['5', '6', '7', '8'], correct: 2, explanation: 'There are 7 continents' },
    { text: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct: 3, explanation: 'Pacific is the largest' },
    { text: 'What is H2O?', options: ['Carbon dioxide', 'Water', 'Oxygen', 'Hydrogen'], correct: 1, explanation: 'H2O is water' },
    { text: 'What planet is closest to Sun?', options: ['Venus', 'Mercury', 'Earth', 'Mars'], correct: 1, explanation: 'Mercury is closest' },
    { text: 'How many days in a year?', options: ['360', '365', '366', '370'], correct: 1, explanation: '365 days (366 in leap year)' },
    { text: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], correct: 2, explanation: '2 is the smallest prime' },
    { text: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correct: 0, explanation: 'Light speed is 300,000 km/s' },
    { text: 'Who invented the telephone?', options: ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Guglielmo Marconi'], correct: 1, explanation: 'Bell invented telephone' }
  ]
};

// Generate variations with numbers and shuffling
function generateBulkQuestions(
  topic: string,
  count: number
): QuestionTemplate[] {
  const lowerTopic = topic.toLowerCase();
  let category = 'general';
  
  if (lowerTopic.includes('program') || lowerTopic.includes('code') || 
      lowerTopic.includes('python') || lowerTopic.includes('javascript') ||
      lowerTopic.includes('html') || lowerTopic.includes('css')) {
    category = 'programming';
  } else if (lowerTopic.includes('math') || lowerTopic.includes('calculate') ||
             lowerTopic.includes('arithmetic') || lowerTopic.includes('number')) {
    category = 'math';
  }
  
  const templates = questionTemplates[category] || questionTemplates['general'];
  const generated: QuestionTemplate[] = [];
  
  // Generate variations using templates
  for (let i = 0; i < count; i++) {
    const baseIndex = i % templates.length;
    const template = templates[baseIndex];
    const variation = i % templates.length;
    
    // Create unique variations
    const question: QuestionTemplate = {
      text: `${template.text} (${topic} - Set ${Math.floor(i / templates.length) + 1})`,
      options: [...template.options],
      correct: template.correct,
      explanation: template.explanation
    };
    
    // Shuffle options randomly
    if (i % 3 === 0) {
      const correctAnswer = question.options[question.correct];
      question.options.sort(() => Math.random() - 0.5);
      question.correct = question.options.indexOf(correctAnswer);
    }
    
    generated.push(question);
  }
  
  return generated;
}

/**
 * POST: Bulk generate 1000+ questions (FREE - Template-based)
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

    const { topic, categoryId, difficulty, count = 1000 } = await req.json();
    
    if (!topic || !categoryId) {
      return NextResponse.json({ 
        message: 'Topic and category are required.' 
      }, { status: 400 });
    }

    if (count < 1 || count > 10000) {
      return NextResponse.json({ 
        message: 'Count must be between 1 and 10,000.' 
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

    console.log(`[Bulk Generate] Starting generation of ${count} questions for topic: ${topic}`);

    // Generate all questions
    const generatedQuestions = generateBulkQuestions(topic, count);
    console.log(`[Bulk Generate] Generated ${generatedQuestions.length} questions`);

    // Batch insert for performance (insert 100 at a time)
    const batchSize = 100;
    const savedQuestions = [];
    let savedCount = 0;
    
    for (let i = 0; i < generatedQuestions.length; i += batchSize) {
      const batch = generatedQuestions.slice(i, i + batchSize);
      
      const batchData = batch.map(q => ({
        text: q.text,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation || '',
        difficulty: (difficulty || 'MEDIUM') as any,
        categoryId,
        createdById: decoded.userId,
      }));

      // Use createMany for batch insert
      await prisma.questionBankItem.createMany({
        data: batchData,
        skipDuplicates: true
      });

      savedCount += batch.length;
      console.log(`[Bulk Generate] Saved batch: ${savedCount}/${generatedQuestions.length}`);

      // Fetch saved questions to return
      const saved = await prisma.questionBankItem.findMany({
        where: {
          categoryId,
          createdById: decoded.userId,
          text: { in: batch.map(b => b.text) }
        },
        take: batchSize
      });
      savedQuestions.push(...saved);

      // Small delay to prevent database overload
      if (i + batchSize < generatedQuestions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`[Bulk Generate] Successfully saved ${savedCount} questions`);

    return NextResponse.json({
      success: true,
      generated: generatedQuestions.length,
      saved: savedCount,
      message: `✅ Successfully generated and saved ${savedCount} questions! (FREE - Template-based)`,
      method: 'template-bulk'
    });
  } catch (error: any) {
    console.error('[Bulk Generate] Error:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to generate questions.' 
    }, { status: 500 });
  }
}





