# 🧪 Battle Quiz Testing Guide

## 📋 **Prerequisites**
- Database migration completed successfully
- Admin account logged in
- Student account logged in

## 🎯 **Step 1: Create Question Bank (Admin)**

### 1.1 Create Categories
1. Go to `/admin/question-bank`
2. Click "Add Category"
3. Create these categories:
   - **Math** (Color: #3B82F6)
   - **English** (Color: #10B981)
   - **Science** (Color: #F59E0B)

### 1.2 Add Questions
1. Click "Add Question" or "Bulk Import"
2. Add at least 10 questions per category
3. Example questions:

**Math Questions:**
- What is 2 + 2? (Options: 3, 4, 5, 6) Correct: 2
- What is 5 × 6? (Options: 25, 30, 35, 40) Correct: 2
- What is √16? (Options: 2, 4, 8, 16) Correct: 2

**English Questions:**
- What is the past tense of "go"? (Options: went, gone, going, goes) Correct: 1
- Which is a synonym for "happy"? (Options: sad, joyful, angry, tired) Correct: 2

**Science Questions:**
- Which planet is closest to the Sun? (Options: Venus, Mercury, Earth, Mars) Correct: 2
- What is H2O? (Options: Carbon dioxide, Water, Oxygen, Hydrogen) Correct: 2

## 🎮 **Step 2: Create Battle Quizzes (Admin)**

### 2.1 Create Quiz
1. Go to `/admin/battle-quizzes`
2. Click "Create New Quiz"
3. Fill in details:
   - **Title**: "Math Challenge"
   - **Description**: "Test your math skills against others"
   - **Entry Amount**: 10
   - **Category**: Math
   - **Number of Questions**: 5

### 2.2 Create More Quizzes
- "English Battle" (Entry: 15, Category: English, Questions: 5)
- "Science Quiz" (Entry: 20, Category: Science, Questions: 5)

## 👥 **Step 3: Test Student Experience**

### 3.1 Login as Student
1. Go to `/auth/login`
2. Login with student credentials
3. Check wallet balance (should be > 0)

### 3.2 Browse Battle Quizzes
1. Go to `/student/battle-quiz`
2. You should see:
   - Available quizzes listed
   - Entry amounts displayed
   - Prize pools calculated (85% of total)
   - Wallet balance shown

### 3.3 Join a Quiz
1. Click "Find Random Opponent" on any quiz
2. Should see "Finding Opponent..." message
3. If no opponent found, shows "Waiting for opponent..."

## 🎯 **Step 4: Test with Two Students**

### 4.1 Open Two Browser Windows
1. **Window 1**: Login as Student A
2. **Window 2**: Login as Student B

### 4.2 Join Same Quiz
1. **Student A**: Click "Find Random Opponent" on Math Challenge
2. **Student B**: Click "Find Random Opponent" on Math Challenge
3. Both should be matched automatically

### 4.3 Expected Results
- Both students should be redirected to match page
- Match should start automatically
- Questions should appear for both players

## 💰 **Step 5: Test Prize Distribution**

### 5.1 Complete a Match
1. Both students answer all questions
2. Higher scorer wins
3. Check winner's wallet balance (should increase by 85% of total entry fees)

### 5.2 Verify Results
- **Winner**: Gets ₹17 (85% of ₹20 total)
- **Loser**: Loses ₹10 entry fee
- **App**: Keeps ₹3 (15% fee)

## 🔍 **Step 6: Test Edge Cases**

### 6.1 Insufficient Balance
1. Student with ₹5 tries to join ₹10 quiz
2. Should show "Insufficient Balance" error

### 6.2 Already Participating
1. Student joins quiz
2. Try to join same quiz again
3. Should show "Already participating" error

### 6.3 No Opponent Found
1. Only one student joins quiz
2. Wait 2 minutes
3. Should show "No opponent found" message

## 📊 **Step 7: Admin Verification**

### 7.1 Check Admin Dashboard
1. Go to `/admin/battle-quizzes`
2. Should see:
   - Created quizzes listed
   - Participant counts
   - Winner counts

### 7.2 Check Question Bank
1. Go to `/admin/question-bank`
2. Should see:
   - Categories with question counts
   - All imported questions

## 🐛 **Common Issues & Solutions**

### Issue: "No Battle Quizzes Available"
**Solution**: Create quizzes in admin panel

### Issue: "Insufficient Balance"
**Solution**: Add money to student wallet via admin

### Issue: Migration Errors
**Solution**: Run `npx prisma migrate resolve --applied 20250625085221_add_battle_quiz_models`

### Issue: API 500 Errors
**Solution**: Check if all database tables exist

## ✅ **Success Criteria**

The feature is working correctly if:
- ✅ Students can browse available quizzes
- ✅ Students can join quizzes and find opponents
- ✅ Matches start automatically when opponents found
- ✅ Questions appear and can be answered
- ✅ Scores are calculated correctly
- ✅ Winners receive prizes in wallet
- ✅ Admin can see all activity

## 🎉 **Congratulations!**

If all tests pass, your Battle Quiz system is working perfectly! 🚀 