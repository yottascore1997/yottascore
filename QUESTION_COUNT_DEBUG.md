# 🔍 Question Count Debug Guide

## 🎯 **Issue: Match ends after 1 question instead of 5**

### **What to Check in Console Logs:**

#### **1. Match Creation Logs:**
```
📊 Creating match with details:
   - Player 1 quiz data: { quizId: "...", categoryId: "...", questionCount: 5, ... }
   - Question count from quiz data: 5
   - Questions array length: 5
   - Entry fee: 10
✅ Match created with 5 total questions
```

#### **2. Question Generation Logs:**
```
🎯 Generating questions for quiz data: { categoryId: "...", questionCount: 5 }
📚 Fetching questions from category: categoryId
📊 Found 10 questions in category categoryId
✅ Selected 5 questions from database
   - Required: 5
   - Available: 10
   - Selected: 5
```

#### **3. Question Progression Logs:**
```
📊 Question progression check:
   - Current question index: 0
   - Total questions: 5
   - Questions array length: 5
   - Condition check: 0 < 4 = true
🔄 Moving to next question: 1
```

#### **4. Match End Logs:**
```
📊 Question progression check:
   - Current question index: 4
   - Total questions: 5
   - Questions array length: 5
   - Condition check: 4 < 4 = false
🏁 All questions answered, ending match
   - Final question index: 4
   - Total questions: 5
```

## 🚨 **Common Issues:**

### **Issue 1: Question Count Not Set**
```
- Question count from quiz data: undefined
✅ Match created with 5 total questions
```
**Fix:** Check if battle quiz has correct questionCount

### **Issue 2: Not Enough Questions in Database**
```
📊 Found 2 questions in category categoryId
✅ Selected 2 questions from database
   - Required: 5
   - Available: 2
   - Selected: 2
```
**Fix:** Add more questions to the category

### **Issue 3: Wrong Category ID**
```
📚 Fetching questions from category: undefined
🔄 No questions found in database, using dummy questions
✅ Generated 5 dummy questions
```
**Fix:** Check if categoryId is being passed correctly

### **Issue 4: Question Index Issue**
```
📊 Question progression check:
   - Current question index: 0
   - Total questions: 1
   - Condition check: 0 < 0 = false
🏁 All questions answered, ending match
```
**Fix:** totalQuestions is 1 instead of 5

## 🧪 **Test Steps:**

### **Step 1: Check Battle Quiz Creation**
1. Go to `/admin/battle-quizzes`
2. Create a new quiz with:
   - **Entry Amount**: 10
   - **Category**: Select category with questions
   - **Number of Questions**: 5
   - **Time Per Question**: 10

### **Step 2: Check Questions in Category**
1. Go to `/admin/question-bank`
2. Check if selected category has at least 5 questions
3. If not, add more questions

### **Step 3: Test Matchmaking**
1. Join battle quiz from 2 different browsers
2. Watch console logs for:
   - Question generation
   - Match creation
   - Question progression

### **Step 4: Expected Flow**
```
Question 0 → Both answer → Question 1 → Both answer → Question 2 → Both answer → Question 3 → Both answer → Question 4 → Both answer → Match End
```

## 🔧 **Quick Fixes:**

### **If Questions Not Loading:**
```javascript
// Check if category has questions
const questions = await prisma.questionBankItem.findMany({
  where: { categoryId: "your-category-id", isActive: true }
});
console.log('Questions in category:', questions.length);
```

### **If Question Count Wrong:**
```javascript
// Check battle quiz data
const quiz = await prisma.battleQuiz.findUnique({
  where: { id: quizId },
  select: { questionCount: true, categoryId: true }
});
console.log('Quiz data:', quiz);
```

### **If Match Ends Early:**
```javascript
// Check match object
console.log('Match object:', {
  totalQuestions: match.totalQuestions,
  questionsLength: match.questions.length,
  currentQuestion: match.currentQuestion
});
```

## 📊 **Expected Console Output:**

```
🎮 join_matchmaking event received
✅ Battle quiz found: Math Challenge
   - Entry fee: ₹10
💰 User wallet check: Student Name
   - Current balance: ₹1000
   - Required entry fee: ₹10
✅ Sufficient balance confirmed

🎯 Generating questions for quiz data: { categoryId: "...", questionCount: 5 }
📚 Fetching questions from category: ...
📊 Found 10 questions in category ...
✅ Selected 5 questions from database
   - Required: 5
   - Available: 10
   - Selected: 5

📊 Creating match with details:
   - Player 1 quiz data: { questionCount: 5, ... }
   - Question count from quiz data: 5
   - Questions array length: 5
✅ Match created with 5 total questions

📊 Question progression check:
   - Current question index: 0
   - Total questions: 5
   - Condition check: 0 < 4 = true
🔄 Moving to next question: 1

... (repeat for questions 1, 2, 3)

📊 Question progression check:
   - Current question index: 4
   - Total questions: 5
   - Condition check: 4 < 4 = false
🏁 All questions answered, ending match
```

**Run this and check the logs! 🔍** 