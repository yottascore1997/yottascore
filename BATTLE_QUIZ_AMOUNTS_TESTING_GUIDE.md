# 🧪 Battle Quiz Amounts Testing Guide

## 📋 **Pre-Testing Checklist**

### **1. Database Setup**
```bash
# Ensure database is up to date
npx prisma generate
npx prisma db push

# Check if BattleQuizAmount table exists
npx prisma studio
```

### **2. Server Setup**
```bash
# Start the main server
npm run dev

# Start socket server (in separate terminal)
node socket-server.js
```

### **3. Prerequisites**
- ✅ Admin user logged in
- ✅ Student user logged in  
- ✅ At least one question category exists
- ✅ Questions exist in categories
- ✅ Users have wallet balance

---

## 🎯 **Testing Scenarios**

### **Scenario 1: Admin Configuration Testing**

#### **1.1 Access Admin Panel**
```
URL: http://localhost:3000/admin/battle-quiz/amounts
Expected: Should see all categories with "0 amounts" badge
```

#### **1.2 Configure Amounts for Category**
```
Steps:
1. Click "Add Amounts" on any category
2. Select amounts: ₹10, ₹25, ₹50
3. Click "Save"
Expected: Success message, amounts appear in list
```

#### **1.3 Enable/Disable Amounts**
```
Steps:
1. Click "Disable" on ₹25 amount
2. Verify badge shows "Disabled"
3. Click "Enable" to reactivate
Expected: Status toggles correctly
```

#### **1.4 Edit Existing Amounts**
```
Steps:
1. Click "Edit Amounts" on configured category
2. Remove ₹10, add ₹75
3. Save changes
Expected: Old amounts removed, new amounts added
```

---

### **Scenario 2: Student Experience Testing**

#### **2.1 Default Amounts (No Configuration)**
```
Steps:
1. Go to /student/battle-quiz
2. Select any category
3. Check amount selection
Expected: Should show default amounts (₹5, ₹10, ₹25, ₹35, ₹50, ₹75, ₹100)
```

#### **2.2 Custom Amounts (With Configuration)**
```
Steps:
1. Configure amounts for a category as admin
2. Go to /student/battle-quiz as student
3. Select that category
4. Check amount selection
Expected: Should show only configured amounts
```

#### **2.3 Amount Selection Flow**
```
Steps:
1. Select category with custom amounts
2. Select ₹25 amount
3. Click "Find Opponent"
Expected: Should navigate to matchmaking with amount parameter
```

---

### **Scenario 3: Matchmaking Testing**

#### **3.1 Single User Matchmaking**
```
Steps:
1. Login as student
2. Select category + amount
3. Click "Find Opponent"
4. Check browser console
Expected: Should see matchmaking logs, no opponent found
```

#### **3.2 Two User Matchmaking**
```
Steps:
1. Login as Student A (Browser 1)
2. Login as Student B (Browser 2)
3. Both select same category + amount
4. Both click "Find Opponent"
Expected: Should match and start battle
```

#### **3.3 Different Amounts**
```
Steps:
1. Student A selects ₹10
2. Student B selects ₹25
3. Both click "Find Opponent"
Expected: Should NOT match (different amounts)
```

---

### **Scenario 4: Battle Quiz Creation Testing**

#### **4.1 Auto-Creation for New Amounts**
```
Steps:
1. Configure new amount (e.g., ₹15) for category
2. Student selects ₹15 amount
3. Check database
Expected: New battle quiz created with ₹15 entry fee
```

#### **4.2 Quiz Questions**
```
Steps:
1. Start battle with custom amount
2. Check questions
Expected: Should get 5 random questions from selected category
```

---

### **Scenario 5: Wallet Integration Testing**

#### **5.1 Entry Fee Deduction**
```
Steps:
1. Note student wallet balance
2. Start battle with ₹25 amount
3. Check wallet after matchmaking
Expected: Balance reduced by ₹25
```

#### **5.2 Winning Distribution**
```
Steps:
1. Complete battle with winner
2. Check winner's wallet
Expected: Winner gets 80% of total prize pool
```

---

## 🔍 **API Testing**

### **Admin API Endpoints**

#### **GET /api/admin/battle-quiz/amounts**
```bash
curl -X GET "http://localhost:3000/api/admin/battle-quiz/amounts" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
**Expected Response:**
```json
[
  {
    "id": "category1",
    "name": "General Knowledge",
    "battleQuizAmounts": [
      {
        "id": "amount1",
        "amount": 10,
        "isActive": true
      }
    ]
  }
]
```

#### **POST /api/admin/battle-quiz/amounts**
```bash
curl -X POST "http://localhost:3000/api/admin/battle-quiz/amounts" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "category1",
    "amounts": [10, 25, 50]
  }'
```

#### **PUT /api/admin/battle-quiz/amounts**
```bash
curl -X PUT "http://localhost:3000/api/admin/battle-quiz/amounts" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "amount1",
    "isActive": false
  }'
```

### **Student API Endpoints**

#### **GET /api/student/battle-quiz/amounts?categoryId=xxx**
```bash
curl -X GET "http://localhost:3000/api/student/battle-quiz/amounts?categoryId=category1" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```
**Expected Response (with custom amounts):**
```json
[
  {
    "id": "amount1",
    "categoryId": "category1",
    "amount": 10,
    "isActive": true
  }
]
```

**Expected Response (no custom amounts):**
```json
[
  {
    "id": "default_5",
    "categoryId": "category1",
    "amount": 5,
    "isActive": true
  }
]
```

---

## 🐛 **Common Issues & Debugging**

### **Issue 1: "Property 'battleQuizAmount' does not exist"**
**Solution:**
```bash
npx prisma generate
npx prisma db push
```

### **Issue 2: Amounts not showing for students**
**Check:**
1. Category has `isActive: true`
2. Amounts have `isActive: true`
3. API returns correct data
4. Frontend fetches amounts correctly

### **Issue 3: Matchmaking not working**
**Check:**
1. Socket server is running
2. Users have sufficient wallet balance
3. Same amount selected by both users
4. Console logs for matchmaking events

### **Issue 4: Quiz creation fails**
**Check:**
1. Category exists in database
2. Questions exist for category
3. User has permission to create quizzes
4. Database connection is working

---

## 📊 **Database Verification**

### **Check BattleQuizAmount Table**
```sql
SELECT * FROM BattleQuizAmount;
```

### **Check Category Relations**
```sql
SELECT 
  c.name as category_name,
  COUNT(ba.id) as amount_count
FROM QuestionCategory c
LEFT JOIN BattleQuizAmount ba ON c.id = ba.categoryId
WHERE c.isActive = true
GROUP BY c.id, c.name;
```

### **Check Auto-Created Quizzes**
```sql
SELECT 
  title,
  entryAmount,
  categoryId,
  isActive,
  createdAt
FROM BattleQuiz
WHERE isActive = true
ORDER BY createdAt DESC;
```

---

## 🎯 **Performance Testing**

### **Load Testing (50K Users)**
```bash
# Test with multiple concurrent users
# Monitor:
- Database performance
- Socket server memory usage
- Queue processing speed
- Matchmaking response time
```

### **Scalability Testing**
```bash
# Test scenarios:
1. 100 users searching simultaneously
2. 50 different amount combinations
3. Multiple categories with different amounts
4. Rapid amount configuration changes
```

---

## ✅ **Success Criteria**

### **Functional Requirements**
- ✅ Admin can configure amounts per category
- ✅ Students see correct amounts for categories
- ✅ Matchmaking works with amount selection
- ✅ Auto-creation of quizzes for new amounts
- ✅ Wallet integration works correctly
- ✅ Default amounts fallback works

### **Non-Functional Requirements**
- ✅ Response time < 2 seconds for amount fetching
- ✅ Matchmaking time < 30 seconds
- ✅ No memory leaks in socket server
- ✅ Database queries optimized
- ✅ Error handling graceful

---

## 🚀 **Production Readiness Checklist**

- [ ] All tests pass
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Database indexes optimized
- [ ] API rate limiting configured
- [ ] Security headers set
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place

---

**🎉 Ready for 50K+ users!** 