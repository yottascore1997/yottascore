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

-- Update existing users to have NOT_SUBMITTED status
UPDATE users SET kycStatus = 'NOT_SUBMITTED' WHERE kycStatus IS NULL; 