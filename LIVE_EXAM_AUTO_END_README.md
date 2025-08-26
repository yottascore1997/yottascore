# Live Exam Auto-End System

## Overview
Yeh system automatically live exams ko end kar deta hai jab unka time khatam ho jata hai. Jab exam ka countdown timer 0 ho jata hai, to system automatically `isLive` ko `false` kar deta hai aur exam ko "ended" status mein mark kar deta hai.

## Features

### 1. **Automatic Exam Ending**
- System har 1 minute mein check karta hai expired exams
- Jab exam ka `endTime` current time se kam ho jata hai, to exam automatically end ho jata hai
- `isLive` field automatically `false` ho jata hai

### 2. **Real-time Notifications**
- Jab exam end hota hai, to sabhi connected users ko notification jata hai
- Socket.io ke through real-time updates
- Frontend automatically refresh hota hai

### 3. **Manual Control**
- Admin panel mein "End Expired Exams" button
- Manual trigger kar sakte hain expired exams ko end karne ke liye
- API endpoint: `POST /api/admin/end-expired-exams`

### 4. **Individual Exam Timers**
- Har exam ke liye individual timer set hota hai
- Exam creation ke time auto-end timer setup hota hai
- Socket events ke through timer management

## How It Works

### 1. **Scheduled Check (Every 1 minute)**
```javascript
// socket-server.js mein
setInterval(async () => {
  await checkAndEndExpiredExams();
}, 60 * 1000); // Har 1 minute mein
```

### 2. **Exam Ending Logic**
```javascript
// Find live exams that have ended
const expiredExams = await prisma.liveExam.findMany({
  where: {
    isLive: true,
    endTime: {
      lt: now // endTime current time se kam hai
    }
  }
});

// Update exam status
await prisma.liveExam.update({
  where: { id: exam.id },
  data: { isLive: false }
});
```

### 3. **Real-time Notifications**
```javascript
// Send notification to all users
io.emit('exam_ended', {
  examId: exam.id,
  title: exam.title,
  message: `Exam "${exam.title}" has ended. Results will be available soon.`
});
```

## API Endpoints

### 1. **End Expired Exams**
```
POST /api/admin/end-expired-exams
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Successfully ended 2 expired exams",
  "ended": 2,
  "exams": [
    {
      "id": "exam_id",
      "title": "Exam Title",
      "endTime": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### 2. **Get Exam Status**
```
GET /api/admin/end-expired-exams
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "expired": [...],      // Already ended exams
    "expiringSoon": [...], // Exams ending in next 1 hour
    "active": [...],       // Active exams
    "total": 10
  }
}
```

## Socket Events

### 1. **Setup Exam Auto-End**
```javascript
// Client emits
socket.emit('setup_exam_auto_end', {
  examId: 'exam_id',
  endTime: '2024-01-01T10:00:00Z'
});

// Server responds
socket.on('exam_auto_end_setup', (data) => {
  console.log('Auto-end setup:', data);
});
```

### 2. **Cancel Exam Auto-End**
```javascript
// Client emits
socket.emit('cancel_exam_auto_end', {
  examId: 'exam_id'
});

// Server responds
socket.on('exam_auto_end_cancelled', (data) => {
  console.log('Auto-end cancelled:', data);
});
```

### 3. **Exam Ended Notification**
```javascript
// Server emits to all clients
socket.on('exam_ended', (data) => {
  console.log('Exam ended:', data);
  // Refresh page or update UI
});
```

## Frontend Integration

### 1. **Admin Panel**
- "End Expired Exams" button added
- Manual trigger for ending expired exams
- Real-time status updates

### 2. **Student Interface**
- Automatic page refresh when exam ends
- Real-time notifications
- Updated exam status display

## Database Changes

### LiveExam Model
```prisma
model LiveExam {
  id          String      @id @default(cuid())
  title       String
  endTime     DateTime?   // Exam end time
  isLive      Boolean     @default(false)  // Auto-updated when exam ends
  // ... other fields
}
```

## Configuration

### 1. **Check Interval**
```javascript
// socket-server.js mein change kar sakte hain
setInterval(async () => {
  await checkAndEndExpiredExams();
}, 60 * 1000); // 1 minute (change to 5 minutes: 5 * 60 * 1000)
```

### 2. **Expiring Soon Threshold**
```javascript
// API mein change kar sakte hain
const soon = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
```

## Testing

### 1. **Manual Test**
1. Admin panel mein "End Expired Exams" button click karein
2. Check console logs for results
3. Verify exam status updated in database

### 2. **Automatic Test**
1. Exam create karein with past endTime
2. Wait for automatic check (1 minute)
3. Verify exam automatically ended

### 3. **Real-time Test**
1. Multiple browser tabs open karein
2. Exam end karein
3. Verify all tabs get notification

## Troubleshooting

### 1. **Exams Not Ending Automatically**
- Check socket server is running
- Verify database connection
- Check console logs for errors

### 2. **Notifications Not Working**
- Verify socket connection
- Check browser console for errors
- Ensure proper event listeners

### 3. **Manual Button Not Working**
- Check admin authentication
- Verify API endpoint
- Check network requests

## Future Enhancements

### 1. **Email Notifications**
- Send email when exam ends
- Include results summary

### 2. **SMS Notifications**
- Send SMS to participants
- Real-time updates

### 3. **Advanced Scheduling**
- Custom end times
- Multiple time zones
- Recurring exams

### 4. **Analytics Dashboard**
- Exam ending statistics
- Performance metrics
- User engagement data
