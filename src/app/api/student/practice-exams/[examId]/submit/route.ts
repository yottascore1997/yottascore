import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request, { params }: { params: { examId: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { answers } = await request.json();
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }
    // Get the exam and questions
    const exam = await prisma.practiceExam.findUnique({
      where: { id: params.examId },
      include: {
        questions: true
      }
    });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    // Check if user is a participant
    const participant = await prisma.practiceExamParticipant.findUnique({
      where: {
        examId_userId: {
          examId: params.examId,
          userId: decoded.userId
        }
      }
    });
    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this exam' }, { status: 403 });
    }
    // Calculate results
    let totalMarks = 0;
    let earnedMarks = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unattempted = 0;
    
    for (const question of exam.questions) {
      const selectedOptionIndex = answers[question.id];
      totalMarks += question.marks;
      
      if (selectedOptionIndex === undefined) {
        unattempted++;
        continue;
      }
      
      if (selectedOptionIndex === question.correct) {
        correctAnswers++;
        earnedMarks += question.marks;
      } else {
        wrongAnswers++;
      }
    }
    
    const totalQuestions = exam.questions.length;
    const score = totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0;
    
    // Save the result
    await prisma.practiceExamParticipant.update({
      where: {
        examId_userId: {
          examId: params.examId,
          userId: decoded.userId
        }
      },
      data: {
        score,
        answers: answers,
        completedAt: new Date()
      }
    });
    
    // Return detailed result data for the beautiful result page
    return NextResponse.json({
      success: true,
      redirectTo: `/student/practice-exams/${params.examId}/result`,
      result: {
        score,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unattempted,
        totalMarks,
        earnedMarks,
        answers,
        completedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 