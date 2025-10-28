-- Fix User table schema
-- This script will properly convert User.id from INT to VARCHAR

-- Step 1: Drop foreign key constraints
ALTER TABLE `Account` DROP FOREIGN KEY IF EXISTS `Account_userId_fkey`;
ALTER TABLE `Session` DROP FOREIGN KEY IF EXISTS `Session_userId_fkey`;
ALTER TABLE `LiveExam` DROP FOREIGN KEY IF EXISTS `LiveExam_createdById_fkey`;
ALTER TABLE `LiveExamParticipant` DROP FOREIGN KEY IF EXISTS `LiveExamParticipant_userId_fkey`;
ALTER TABLE `LiveExamWinner` DROP FOREIGN KEY IF EXISTS `LiveExamWinner_userId_fkey`;
ALTER TABLE `Transaction` DROP FOREIGN KEY IF EXISTS `Transaction_userId_fkey`;

-- Step 2: Modify User.id column to VARCHAR
ALTER TABLE `User` DROP PRIMARY KEY;
ALTER TABLE `User` MODIFY COLUMN `id` VARCHAR(191) NOT NULL;
ALTER TABLE `User` ADD PRIMARY KEY (`id`);

-- Step 3: Recreate foreign key constraints
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LiveExam` ADD CONSTRAINT `LiveExam_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `LiveExamParticipant` ADD CONSTRAINT `LiveExamParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `LiveExamWinner` ADD CONSTRAINT `LiveExamWinner_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
