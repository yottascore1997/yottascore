import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const categoryId = params.id;

    // Check if category exists and belongs to the admin
    const category = await prisma.questionCategory.findFirst({
      where: {
        id: categoryId,
        createdById: decoded.userId
      },
      include: {
        _count: {
          select: {
            questions: true,
            battleQuizzes: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 });
    }

    // Delete related data first
    // 1. Delete all questions in this category (QuestionBankItem has ON DELETE CASCADE, but we'll do it explicitly)
    const deletedQuestions = await prisma.questionBankItem.deleteMany({
      where: { categoryId }
    });

    // 2. Update battle quizzes to remove category reference (set categoryId to null)
    // BattleQuiz has ON DELETE SET NULL, but we'll do it explicitly for clarity
    const updatedQuizzes = await prisma.battleQuiz.updateMany({
      where: { categoryId },
      data: { categoryId: null }
    });

    // 3. Update battle rooms to remove category reference
    await prisma.battleRoom.updateMany({
      where: { categoryId },
      data: { categoryId: null }
    });

    // 4. Delete battle quiz amounts for this category
    await prisma.battleQuizAmount.deleteMany({
      where: { categoryId }
    });

    // 5. Update Question model (if any questions reference this category)
    await prisma.question.updateMany({
      where: { categoryId },
      data: { categoryId: null }
    });

    // 6. Now delete the category
    await prisma.questionCategory.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      deletedQuestions: deletedQuestions.count,
      updatedQuizzes: updatedQuizzes.count
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete category. It has related records that need to be removed first.'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to delete category'
    }, { status: 500 });
  }
}

