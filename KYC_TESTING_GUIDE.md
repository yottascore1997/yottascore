# 🆔 KYC Verification System Testing Guide

## 📋 **KYC System Overview**

### **🔄 Complete Flow:**
1. **User uploads documents** → Student wallet page
2. **Admin reviews documents** → Admin KYC panel
3. **Admin approves/rejects** → Status updates
4. **User sees status** → Wallet page shows verification status

---

## 🧪 **Testing Scenarios**

### **Scenario 1: User KYC Upload**

#### **Step 1: Access KYC Page**
```
URL: http://localhost:3000/student/wallet/kyc
Expected: Should see KYC upload form
```

#### **Step 2: Upload Document**
```
Steps:
1. Select document type (Aadhar Card, PAN Card, etc.)
2. Enter document number
3. Upload document image (base64 or file)
4. Click "Submit KYC"
Expected: Success message, status shows "Pending"
```

#### **Step 3: Check Status**
```
URL: http://localhost:3000/student/wallet
Expected: Should show "Pending Verification" status
```

---

### **Scenario 2: Admin KYC Review**

#### **Step 1: Access Admin KYC Panel**
```
URL: http://localhost:3000/admin/kyc
Expected: Should see KYC verification requests
```

#### **Step 2: Review Documents**
```
Steps:
1. Click on a pending request
2. View uploaded document
3. Check document details
Expected: Document preview and details visible
```

#### **Step 3: Approve/Reject**
```
Steps:
1. Click "Approve" or "Reject"
2. If rejecting, provide reason
3. Confirm action
Expected: Status updates, user notified
```

---

## 🔍 **How to Test KYC System**

### **Method 1: Complete End-to-End Testing**

#### **Step 1: Start Servers**
```bash
# Start main server
npm run dev

# Start socket server (if needed)
node socket-server.js
```

#### **Step 2: Create Test Users**
```bash
# Register as student user
# Register as admin user
# Or use existing users
```

#### **Step 3: Test User Flow**
1. **Login as Student**
2. **Go to Wallet** → `/student/wallet`
3. **Click "Complete KYC"**
4. **Upload test document**
5. **Check status shows "Pending"**

#### **Step 4: Test Admin Flow**
1. **Login as Admin**
2. **Go to KYC Panel** → `/admin/kyc`
3. **Find pending request**
4. **Review document**
5. **Approve or reject**

#### **Step 5: Verify Status Update**
1. **Go back to student wallet**
2. **Check KYC status updated**

---

### **Method 2: API Testing**

#### **User KYC Upload API**
```bash
# Upload KYC document
curl -X POST "http://localhost:3000/api/user/kyc/upload" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "AADHAR_CARD",
    "documentNumber": "123456789012",
    "documentImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }'
```

#### **Admin KYC Fetch API**
```bash
# Get KYC requests
curl -X GET "http://localhost:3000/api/admin/kyc/verify?status=PENDING" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### **Admin KYC Verify API**
```bash
# Approve document
curl -X POST "http://localhost:3000/api/admin/kyc/verify" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_id_here",
    "action": "APPROVE"
  }'

# Reject document
curl -X POST "http://localhost:3000/api/admin/kyc/verify" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_id_here",
    "action": "REJECT",
    "rejectionReason": "Document unclear, please upload clearer image"
  }'
```

---

## 📊 **Expected API Responses**

### **User KYC Upload Response**
```json
{
  "success": true,
  "message": "KYC document uploaded successfully",
  "document": {
    "id": "doc_123",
    "documentType": "AADHAR_CARD",
    "documentNumber": "123456789012",
    "isVerified": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### **Admin KYC Fetch Response**
```json
{
  "kycRequests": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "kycStatus": "PENDING",
      "kycDocuments": [
        {
          "id": "doc_123",
          "documentType": "AADHAR_CARD",
          "documentNumber": "123456789012",
          "documentImage": "data:image/jpeg;base64,...",
          "isVerified": false,
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### **Admin KYC Verify Response**
```json
{
  "success": true,
  "message": "KYC document approved successfully",
  "allVerified": true
}
```

---

## 🐛 **Common Issues & Debugging**

### **Issue 1: KYC Link Not Showing in Admin Panel**
**Solution:**
- Check if KYC link is added to `src/app/admin/layout.tsx`
- Verify admin user has ADMIN role
- Check browser console for errors

### **Issue 2: Document Upload Fails**
**Check:**
1. File size (should be < 5MB)
2. File format (JPEG, PNG, PDF)
3. Base64 encoding is correct
4. User is authenticated

### **Issue 3: Admin Can't See KYC Requests**
**Check:**
1. Admin role is set correctly
2. KYC documents exist in database
3. API endpoint is working
4. Authentication token is valid

### **Issue 4: Status Not Updating**
**Check:**
1. Database transaction completed
2. User KYC status field updated
3. Frontend refreshes data
4. No JavaScript errors

---

## 📱 **Database Verification**

### **Check KYC Documents**
```sql
-- Check uploaded documents
SELECT 
  kd.id,
  kd.documentType,
  kd.documentNumber,
  kd.isVerified,
  kd.createdAt,
  u.name as userName,
  u.email
FROM KYCDocument kd
JOIN User u ON kd.userId = u.id
ORDER BY kd.createdAt DESC;
```

### **Check User KYC Status**
```sql
-- Check user KYC status
SELECT 
  id,
  name,
  email,
  kycStatus,
  kycVerifiedAt,
  kycRejectedAt,
  kycRejectionReason
FROM User
WHERE kycStatus IS NOT NULL
ORDER BY createdAt DESC;
```

### **Check Admin Users**
```sql
-- Verify admin users
SELECT 
  id,
  name,
  email,
  role
FROM User
WHERE role = 'ADMIN';
```

---

## 🎯 **Frontend Testing**

### **Student Wallet Page**
```
URL: http://localhost:3000/student/wallet
Expected Elements:
- KYC status display
- "Complete KYC" button (if not verified)
- Verification date (if verified)
- Rejection reason (if rejected)
```

### **Student KYC Page**
```
URL: http://localhost:3000/student/wallet/kyc
Expected Elements:
- Document type selector
- Document number input
- File upload area
- Uploaded documents list
- Status indicators
```

### **Admin KYC Panel**
```
URL: http://localhost:3000/admin/kyc
Expected Elements:
- Filter dropdown (All/Pending/Verified/Rejected)
- KYC requests list
- Document preview
- Approve/Reject buttons
- Rejection reason input
```

---

## ✅ **Success Criteria**

### **Functional Requirements**
- ✅ User can upload KYC documents
- ✅ Admin can view KYC requests
- ✅ Admin can approve/reject documents
- ✅ Status updates correctly
- ✅ Rejection reasons are stored
- ✅ Withdrawal limits enforced

### **Non-Functional Requirements**
- ✅ File upload size limits
- ✅ Image format validation
- ✅ Role-based access control
- ✅ Audit trail maintained
- ✅ Responsive UI design

---

## 🚀 **Production Checklist**

- [ ] Database migrations applied
- [ ] File upload limits configured
- [ ] Admin roles verified
- [ ] Error handling tested
- [ ] Security measures in place
- [ ] UI responsive on all devices
- [ ] API endpoints documented
- [ ] Monitoring alerts configured

---

## 🎉 **Quick Test Commands**

### **Start Testing**
```bash
# 1. Start servers
npm run dev

# 2. Open browser
# Student: http://localhost:3000/student/wallet
# Admin: http://localhost:3000/admin/kyc

# 3. Test flow
# - Upload document as student
# - Review as admin
# - Verify status updates
```

**🎯 KYC system is now ready for comprehensive testing!** 