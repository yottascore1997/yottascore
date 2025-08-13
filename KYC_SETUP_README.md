# KYC System Setup Guide

## 🎯 Overview
This KYC (Know Your Customer) system allows users to upload identity documents for verification by admins. It's integrated with the wallet system to ensure secure transactions.

## 🗄️ Database Setup

### Option 1: SQL Script (Recommended)
Run the SQL script to add KYC fields to your existing database:

```bash
# Connect to your MySQL database and run:
mysql -u your_username -p your_database_name < scripts/add-kyc-fields.sql
```

### Option 2: Manual Database Changes
If you prefer to run the commands manually:

```sql
-- Add KYC fields to users table
ALTER TABLE users 
ADD COLUMN kycStatus ENUM('PENDING', 'VERIFIED', 'REJECTED', 'NOT_SUBMITTED') DEFAULT 'NOT_SUBMITTED',
ADD COLUMN kycVerifiedAt DATETIME NULL,
ADD COLUMN kycRejectedAt DATETIME NULL,
ADD COLUMN kycRejectionReason TEXT NULL;

-- Create kyc_documents table
CREATE TABLE kyc_documents (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  documentType ENUM('AADHAR_CARD', 'PAN_CARD', 'DRIVING_LICENSE', 'PASSPORT', 'VOTER_ID', 'BANK_PASSBOOK', 'OTHER') NOT NULL,
  documentNumber VARCHAR(255) NULL,
  documentImage TEXT NOT NULL,
  isVerified BOOLEAN DEFAULT FALSE,
  verifiedAt DATETIME NULL,
  verifiedBy VARCHAR(191) NULL,
  rejectionReason TEXT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_documentType (documentType),
  INDEX idx_isVerified (isVerified)
);
```

## 🚀 Features

### For Users:
- **KYC Status Display**: Shows verification status in wallet
- **Document Upload**: Upload identity documents (Aadhar, PAN, etc.)
- **Status Tracking**: Real-time updates on verification progress
- **Withdrawal Limits**: KYC required for withdrawals above ₹1000

### For Admins:
- **Verification Panel**: Review and approve/reject KYC documents
- **Status Management**: Update user verification status
- **Document Review**: View uploaded documents with details
- **Rejection Handling**: Provide reasons for document rejection

## 📁 File Structure

```
src/
├── app/
│   ├── student/wallet/
│   │   ├── page.tsx (Updated with KYC status)
│   │   └── kyc/
│   │       └── page.tsx (User KYC upload page)
│   ├── admin/
│   │   └── kyc/
│   │       └── page.tsx (Admin verification panel)
│   └── api/
│       ├── user/kyc/upload/
│       │   └── route.ts (User KYC API)
│       └── admin/kyc/verify/
│           └── route.ts (Admin verification API)
```

## 🔧 API Endpoints

### User KYC API (`/api/user/kyc/upload`)
- `GET`: Fetch user's KYC status and documents
- `POST`: Upload new KYC document

### Admin KYC API (`/api/admin/kyc/verify`)
- `GET`: Fetch KYC requests for admin review
- `POST`: Approve/reject KYC documents

## 🎨 UI Components

### 1. Wallet Page KYC Status
- Shows current KYC verification status
- Quick access to complete KYC
- Visual indicators for different statuses

### 2. User KYC Page
- Document type selection
- File upload interface
- Status tracking
- Uploaded documents list

### 3. Admin KYC Panel
- Filter by verification status
- Document review interface
- Approve/reject actions
- Rejection reason input

## 🔐 Security Features

- **Role-based Access**: Only admins can verify documents
- **File Validation**: File size and type restrictions
- **Status Tracking**: Complete audit trail of verification process
- **Withdrawal Limits**: KYC verification required for large withdrawals

## 📱 Usage Flow

### User Journey:
1. User visits wallet page
2. Sees KYC status (Not Submitted/Pending/Verified/Rejected)
3. Clicks "Complete KYC" button
4. Uploads identity documents
5. Waits for admin verification
6. Receives status updates

### Admin Journey:
1. Admin visits `/admin/kyc` page
2. Views pending KYC requests
3. Reviews uploaded documents
4. Approves or rejects with reason
5. Updates user verification status

## 🚨 Important Notes

- **File Storage**: Currently uses base64 encoding for demo. In production, use cloud storage (AWS S3, etc.)
- **Document Types**: Supports common Indian identity documents
- **Verification Time**: Admin verification typically takes 24-48 hours
- **Withdrawal Limits**: KYC required for withdrawals above ₹1000

## 🐛 Troubleshooting

### Common Issues:
1. **Database Errors**: Ensure MySQL supports ENUM types
2. **File Upload Issues**: Check file size limits and permissions
3. **API Errors**: Verify authentication tokens and user roles

### Testing:
1. Create a test user account
2. Upload test documents
3. Login as admin to verify
4. Test withdrawal limits

## 🔄 Future Enhancements

- **OCR Integration**: Automatic document text extraction
- **Face Verification**: Selfie matching with ID documents
- **API Integration**: Third-party verification services
- **Mobile App**: React Native KYC integration
- **Notifications**: Email/SMS updates on verification status

## 📞 Support

For technical support or questions about the KYC system, please refer to the main project documentation or contact the development team. 