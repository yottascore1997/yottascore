const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkQuestions() {
  try {

    
    // Get all categories
    const categories = await prisma.questionCategory.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
categories.forEach(cat => {
});
    
for (const category of categories) {
// Check QuestionBankItem table
      const questionBankCount = await prisma.questionBankItem.count({
        where: {
          categoryId: category.id,
          isActive: true
        }
      });
      
      // Check Question table
      const questionTableCount = await prisma.question.count({
        where: {
          categoryId: category.id
        }
      });
      
// Show sample questions from QuestionBankItem
      if (questionBankCount > 0) {
        const sampleQuestions = await prisma.questionBankItem.findMany({
          where: {
            categoryId: category.id,
            isActive: true
          },
          select: {
            id: true,
            text: true,
            options: true,
            correctAnswer: true
          },
          take: 3
        });
      }
      
}
    
  } catch {} finally {
    await prisma.$disconnect();
  }
}

checkQuestions(); 