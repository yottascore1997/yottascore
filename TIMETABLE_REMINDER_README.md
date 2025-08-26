# Timetable Reminder System

## Overview
Yeh system timetable slots ke liye automatic reminders bhejta hai. Jab aap timetable mein "Set Reminder" select karte hain, toh system aapko notifications bhejega jab aapka study session start hone wala ho.

## Features

### 1. **Reminder Toggle**
- Har timetable slot ke liye reminder enable/disable kar sakte hain
- Bell icon se reminder status toggle hota hai
- Blue color = reminder enabled, Gray color = reminder disabled

### 2. **Automatic Notifications**
- System har 5 minutes mein check karta hai upcoming sessions
- 15 minutes pehle reminder bhejta hai
- Real-time notifications via WebSocket
- Browser notifications (agar permission di hai)

### 3. **Notification Types**
- **In-App Notifications**: PushNotification table mein save hota hai
- **Real-time Alerts**: Socket.io ke through instant notifications
- **Browser Notifications**: Desktop notifications

## How It Works

### 1. **Reminder Setup**
```typescript
// AddScheduleForm.tsx mein
reminder: formData.reminder // true/false
```

### 2. **Database Storage**
```sql
-- TimetableSlot table mein
reminder: Boolean @default(true)
reminderSent: Boolean @default(false)
```

### 3. **Reminder Check Process**
```javascript
// Har 5 minutes mein check karta hai
setInterval(async () => {
  await checkTimetableReminders(userId)
}, 5 * 60 * 1000)
```

### 4. **Notification Creation**
```javascript
// PushNotification create karta hai
const notification = await prisma.pushNotification.create({
  data: {
    userId: userId,
    title: `Study Reminder: ${slot.subject}`,
    message: `Your study session starts in X minutes...`,
    type: 'REMINDER',
    isRead: false,
    sentBy: 'SYSTEM'
  }
})
```

## API Endpoints

### 1. **Check Reminders**
```
POST /api/student/timetable/reminders
Body: { checkReminders: true }
```

### 2. **Reset Reminders**
```
PATCH /api/student/timetable/reminders
Body: { resetAll: true }
```

### 3. **Toggle Reminder**
```
PATCH /api/student/timetable/[slotId]
Body: { reminder: true/false }
```

## Socket Events

### 1. **Start Reminders**
```javascript
socket.emit('start_timetable_reminders', { userId })
```

### 2. **Receive Reminder**
```javascript
socket.on('timetable_reminder', (data) => {
  // Show notification
})
```

## UI Components

### 1. **Reminder Toggle Button**
```tsx
<button
  onClick={() => handleToggleReminder(slot.id, !slot.reminder)}
  className={`w-8 h-8 rounded-full ${slot.reminder ? 'bg-blue-500' : 'bg-gray-200'}`}
>
  <Bell className={`w-4 h-4 ${slot.reminder ? 'text-white' : 'text-gray-600'}`} />
</button>
```

### 2. **Test Buttons**
- **Test Reminders**: Manual reminder check
- **Reset Reminders**: Reset all reminder statuses

## Configuration

### 1. **Reminder Window**
```javascript
const reminderWindow = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes
```

### 2. **Check Interval**
```javascript
setInterval(async () => {
  await checkReminders()
}, 5 * 60 * 1000) // 5 minutes
```

### 3. **Notification Permission**
```javascript
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}
```

## Testing

### 1. **Manual Test**
- "Test Reminders" button click karein
- Console mein check karein logs
- Alert message dekhein

### 2. **Real-time Test**
- Timetable slot create karein (current time + 15 minutes)
- Reminder enable karein
- Wait karein ya "Test Reminders" click karein

### 3. **Reset Test**
- "Reset Reminders" button click karein
- All reminder statuses reset ho jayenge

## Troubleshooting

### 1. **Notifications nahi aa rahe**
- Browser notification permission check karein
- Socket connection verify karein
- Console logs check karein

### 2. **Reminders repeat ho rahe**
- `reminderSent` field check karein
- "Reset Reminders" click karein

### 3. **Socket connection issues**
- Socket server running hai ya nahi check karein
- Network connectivity verify karein

## Future Enhancements

1. **Custom Reminder Times**: User apne hisab se reminder time set kar sake
2. **Email Notifications**: Email reminders bhi bhejne
3. **SMS Notifications**: SMS reminders
4. **Reminder History**: Past reminders ka history
5. **Reminder Templates**: Different types of reminder messages

## Files Modified

1. `src/app/api/student/timetable/reminders/route.ts` - New API endpoint
2. `src/app/student/timetable/page.tsx` - UI updates
3. `socket-server.js` - Socket functionality
4. `prisma/schema.prisma` - Database schema (already had reminder fields)

## Usage Instructions

1. **Timetable slot create karein**
2. **"Set Reminder" checkbox tick karein**
3. **Save karein**
4. **System automatically reminders bhejega**
5. **Test karne ke liye "Test Reminders" button use karein**
