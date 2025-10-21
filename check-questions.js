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
    
    console.log('📋 Categories found:');
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.id})`);
    });
    
    console.log('\n🔍 Checking questions for each category...\n');
    
    for (const category of categories) {
      console.log(`📊 Category: ${category.name}`);
      
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
      
      console.log(`   - QuestionBankItem: ${questionBankCount} questions`);
      console.log(`   - Question table: ${questionTableCount} questions`);
      console.log(`   - Total: ${questionBankCount + questionTableCount} questions`);
      
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
        
        console.log(`   - Sample questions from QuestionBankItem:`);
        sampleQuestions.forEach((q, index) => {
          console.log(`     ${index + 1}. ${q.text.substring(0, 80)}...`);
          console.log(`        Options: ${JSON.stringify(q.options)}`);
          console.log(`        Correct: ${q.correctAnswer}`);
        });
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestions(); 