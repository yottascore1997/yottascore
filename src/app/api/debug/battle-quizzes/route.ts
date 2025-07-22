import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const quizzes = await prisma.battleQuiz.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            correct: true
          }
        },
        _count: {
          select: {
            questions: true,
            participants: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      total: quizzes.length,
      quizzes: quizzes.map((q: any) => ({
        id: q.id,
        title: q.title,
        isActive: q.isActive,
        entryAmount: q.entryAmount,
        questionCount: q.questionCount,
        category: q.category?.name || 'No Category',
        questionsCount: q._count.questions,
        participantsCount: q._count.participants,
        createdAt: q.createdAt,
        questions: q.questions.slice(0, 2) // Show first 2 questions as sample
      }))
    });

  } catch (error: any) {
    console.error('Debug battle quizzes error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Find a battle quiz without questions
    const quizWithoutQuestions = await prisma.battleQuiz.findFirst({
      where: {
        questions: {
          none: {}
        }
      },
      include: {
        category: true
      }
    });

    if (!quizWithoutQuestions) {
      return NextResponse.json({ 
        message: 'All battle quizzes already have questions' 
      });
    }

    // Create sample questions
    const sampleQuestions = [
      {
        text: "What is the capital of India?",
        options: ["Mumbai", "Delhi", "Kolkata", "Chennai"],
        correct: 1,
        marks: 1
      },
      {
        text: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correct: 1,
        marks: 1
      },
      {
        text: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correct: 1,
        marks: 1
      },
      {
        text: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correct: 1,
        marks: 1
      },
      {
        text: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correct: 3,
        marks: 1
      }
    ];

    // Add questions to the quiz
    const createdQuestions = await prisma.battleQuizQuestion.createMany({
      data: sampleQuestions.map((q: any) => ({
        ...q,
        quizId: quizWithoutQuestions.id
      }))
    });

    return NextResponse.json({
      message: `Added ${createdQuestions.count} questions to quiz: ${quizWithoutQuestions.title}`,
      quizId: quizWithoutQuestions.id,
      questionsAdded: createdQuestions.count
    });

  } catch (error: any) {
    console.error('Add test questions error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 