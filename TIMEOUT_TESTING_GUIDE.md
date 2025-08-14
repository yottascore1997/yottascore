# ⏰ Battle Quiz Timeout Testing Guide

## 📋 **What Happens When Timer Expires**

### **🔄 Automatic Timeout Behavior:**
1. **Timer runs out** → System automatically marks unanswered players as "timed out"
2. **Opponent notification** → Other player gets notified that opponent timed out
3. **Question progression** → Next question starts automatically after timeout
4. **Scoring** → Timed out players get 0 points for that question
5. **Match continues** → Game proceeds to next question or ends if all questions done

### **📊 Timeout Data Structure:**
```javascript
{
  answer: null,           // No answer given
  timeSpent: 15,          // Full time limit used
  timestamp: Date.now(),  // When timeout occurred
  timedOut: true          // Flag indicating timeout
}
```

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Single Player Timeout**

#### **Test Setup:**
```
Player A: Answers normally
Player B: Doesn't answer (let timer expire)
```

#### **Expected Behavior:**
1. Player A answers within time limit
2. Player B doesn't answer
3. Timer expires (15 seconds)
4. System marks Player B as "timed out"
5. Player A gets notification: `{ questionIndex: 0, answer: null, timedOut: true }`
6. Next question starts automatically
7. Player B gets 0 points for that question

#### **Console Logs to Check:**
```
⏰ Time's up for question 0 in match match_xxx
⏰ Player B (userId) timed out on question 0
📤 Sent timeout notification to player A
🔄 Moving to next question after timeout: 1
```

---

### **Scenario 2: Both Players Timeout**

#### **Test Setup:**
```
Player A: Doesn't answer (let timer expire)
Player B: Doesn't answer (let timer expire)
```

#### **Expected Behavior:**
1. Both players don't answer
2. Timer expires (15 seconds)
3. System marks both players as "timed out"
4. Both players get timeout notifications
5. Next question starts automatically
6. Both players get 0 points for that question

#### **Console Logs to Check:**
```
⏰ Time's up for question 0 in match match_xxx
⏰ Player A (userId) timed out on question 0
⏰ Player B (userId) timed out on question 0
📤 Sent timeout notification to player A
📤 Sent timeout notification to player B
🔄 Moving to next question after timeout: 1
```

---

### **Scenario 3: Mixed Answering Pattern**

#### **Test Setup:**
```
Question 1: Player A answers, Player B times out
Question 2: Player B answers, Player A times out
Question 3: Both answer normally
```

#### **Expected Behavior:**
1. **Q1**: Player A gets points, Player B gets 0
2. **Q2**: Player B gets points, Player A gets 0
3. **Q3**: Both get points based on correctness
4. Final score reflects only correct answers

---

### **Scenario 4: Last Question Timeout**

#### **Test Setup:**
```
5-question match
Questions 1-4: Both answer normally
Question 5: One player times out
```

#### **Expected Behavior:**
1. Questions 1-4 proceed normally
2. Question 5: One player times out
3. Match ends immediately after timeout
4. Final scoring includes timeout penalty

---

## 🔍 **How to Test Timeout Functionality**

### **Method 1: Manual Testing (Recommended)**

#### **Step 1: Start Battle Quiz**
```bash
# Start both servers
npm run dev          # Main server
node socket-server.js # Socket server
```

#### **Step 2: Create Test Match**
1. Login as Student A (Browser 1)
2. Login as Student B (Browser 2)
3. Both select same category + amount
4. Both click "Find Opponent"

#### **Step 3: Test Timeout Scenarios**

**For Single Player Timeout:**
1. Player A answers normally
2. Player B waits for timer to expire (15 seconds)
3. Observe console logs and UI behavior

**For Both Players Timeout:**
1. Both players wait for timer to expire
2. Observe automatic progression

### **Method 2: API Testing**

#### **Test Timeout via Socket Events**
```javascript
// Connect to socket server
const socket = io('http://localhost:3001');

// Join matchmaking
socket.emit('join_matchmaking', {
  categoryId: 'category1',
  mode: 'quick',
  amount: 10
});

// Don't answer questions - let timer expire
// Observe timeout events in console
```

### **Method 3: Database Verification**

#### **Check Answer Records**
```sql
-- Check for timeout records
SELECT 
  matchId,
  questionIndex,
  player1Answer,
  player2Answer,
  player1TimedOut,
  player2TimedOut
FROM BattleQuizMatch
WHERE player1TimedOut = true OR player2TimedOut = true;
```

---

## 📊 **Expected Console Output**

### **Normal Answer Flow:**
```
🎯 answer_question event received
📝 Recording answer for question 0
✅ Player 1 answer recorded
📤 opponent_answered event sent
✅ Both players answered question 0
🔄 Moving to next question: 1
⏰ Starting timer for question 1
```

### **Timeout Flow:**
```
⏰ Time's up for question 0 in match match_xxx
📊 Timeout check for question 0:
   - Player 1 answered: true
   - Player 2 answered: false
⏰ Player 2 (userId) timed out on question 0
📤 Sent timeout notification to player 1
🔄 Moving to next question after timeout: 1
⏰ Starting timer for question 1
```

### **Scoring with Timeouts:**
```
🔍 Question 0 analysis:
   - Player 1 answer: { answer: 1, timeSpent: 5 }
   - Player 2 answer: { answer: null, timedOut: true }
✅ Player 1 correct! Score: 10
⏰ Player 2 timed out on question 0 - no points
```

---

## 🐛 **Common Issues & Debugging**

### **Issue 1: Timer Not Starting**
**Check:**
1. `startQuestionTimer` function is called
2. `setTimeout` is working
3. Match object exists in memory

### **Issue 2: Timeout Not Triggering**
**Check:**
1. Timer duration is correct (15 seconds)
2. `clearTimeout` is not called prematurely
3. Match is still active

### **Issue 3: Players Not Notified**
**Check:**
1. Socket connections are active
2. `opponent_answered` event is emitted
3. Frontend handles timeout notifications

### **Issue 4: Scoring Incorrect**
**Check:**
1. `timedOut` flag is set correctly
2. Scoring logic checks for `timedOut` flag
3. Timeout answers are not counted as correct

---

## 🎯 **Frontend Integration**

### **Handle Timeout Notifications**
```javascript
socket.on('opponent_answered', (data) => {
  if (data.timedOut) {
    console.log('Opponent timed out on question', data.questionIndex);
    // Show timeout message to user
    showTimeoutMessage(data.questionIndex);
  } else {
    console.log('Opponent answered:', data.answer);
    // Show opponent's answer
    showOpponentAnswer(data.questionIndex, data.answer);
  }
});
```

### **Show Timeout UI**
```javascript
function showTimeoutMessage(questionIndex) {
  // Disable answer buttons
  disableAnswerButtons();
  
  // Show timeout message
  setMessage(`Opponent timed out on question ${questionIndex + 1}`);
  
  // Wait for next question
  setTimeout(() => {
    enableAnswerButtons();
    clearMessage();
  }, 2000);
}
```

---

## ✅ **Success Criteria**

### **Functional Requirements**
- ✅ Timer starts automatically for each question
- ✅ Timeout triggers after 15 seconds
- ✅ Unanswered players marked as "timed out"
- ✅ Opponents notified of timeout
- ✅ Next question starts automatically
- ✅ Scoring excludes timed out questions
- ✅ Match continues after timeouts

### **Non-Functional Requirements**
- ✅ Timer accuracy within ±1 second
- ✅ No memory leaks from timers
- ✅ Graceful handling of disconnections
- ✅ Clear user feedback for timeouts

---

## 🚀 **Production Considerations**

### **Timer Configuration**
```javascript
const QUESTION_TIME_LIMIT = 15; // seconds
const TIMEOUT_BUFFER = 1000;    // 1 second buffer
```

### **Error Handling**
```javascript
// Clear timers on match end
if (match.questionTimer) {
  clearTimeout(match.questionTimer);
  match.questionTimer = null;
}
```

### **Monitoring**
```javascript
// Log timeout statistics
console.log(`⏰ Timeout stats: ${timeoutCount}/${totalQuestions} questions had timeouts`);
```

---

**🎉 Timeout functionality is now robust and ready for testing!** 