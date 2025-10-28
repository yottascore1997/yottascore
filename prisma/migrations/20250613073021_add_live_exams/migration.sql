/*
  Warnings:

  - The primary key for the `question` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `correctAnswer` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `marks` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `question` table. All the data in the column will be lost.
  - The primary key for the `transaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `className` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `rollNumber` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `_studentexams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `battlequiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `battlequizquestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_StudentExams` DROP FOREIGN KEY `_StudentExams_A_fkey`;

-- DropForeignKey
ALTER TABLE `_StudentExams` DROP FOREIGN KEY `_StudentExams_B_fkey`;

-- DropForeignKey
ALTER TABLE `BattleQuizQuestion` DROP FOREIGN KEY `BattleQuizQuestion_quizId_fkey`;

-- DropForeignKey
ALTER TABLE `Exam` DROP FOREIGN KEY `Exam_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Wallet` DROP FOREIGN KEY `Wallet_userId_fkey`;

-- DropIndex
DROP INDEX `Transaction_userId_fkey` ON `Transaction`;

-- AlterTable
ALTER TABLE `Question` DROP PRIMARY KEY,
    DROP COLUMN `correctAnswer`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `marks`,
    DROP COLUMN `question`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `correct` INTEGER NULL,
    ADD COLUMN `examId` VARCHAR(191) NULL,
    ADD COLUMN `text` TEXT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `options` JSON NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Transaction` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    DROP COLUMN `className`,
    DROP COLUMN `password`,
    DROP COLUMN `phoneNumber`,
    DROP COLUMN `rollNumber`,
    DROP COLUMN `section`,
    ADD COLUMN `emailVerified` DATETIME(3) NULL,
    ADD COLUMN `hashedPassword` VARCHAR(191) NULL,
    ADD COLUMN `image` VARCHAR(191) NULL,
    ADD COLUMN `wallet` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `email` VARCHAR(191) NULL,
    MODIFY `name` VARCHAR(191) NULL,
    MODIFY `role` ENUM('ADMIN', 'STUDENT', 'USER') NOT NULL DEFAULT 'USER',
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `_StudentExams`;

-- DropTable
DROP TABLE `BattleQuiz`;

-- DropTable
DROP TABLE `BattleQuizQuestion`;

-- DropTable
DROP TABLE `Exam`;

-- DropTable
DROP TABLE `Wallet`;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveExam` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `duration` INTEGER NOT NULL,
    `totalMarks` INTEGER NOT NULL,
    `passingMarks` INTEGER NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `totalSpots` INTEGER NOT NULL,
    `spotsLeft` INTEGER NOT NULL,
    `entryFee` DOUBLE NOT NULL,
    `prizePool` DOUBLE NOT NULL,
    `isLive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `standard` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveExamParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `score` INTEGER NULL,
    `answers` JSON NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `paid` BOOLEAN NOT NULL DEFAULT false,
    `paymentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LiveExamParticipant_examId_userId_key`(`examId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveExamWinner` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,
    `prizeAmount` DOUBLE NOT NULL,
    `paid` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LiveExamWinner_examId_rank_key`(`examId`, `rank`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveExam` ADD CONSTRAINT `LiveExam_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveExamParticipant` ADD CONSTRAINT `LiveExamParticipant_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `LiveExam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveExamParticipant` ADD CONSTRAINT `LiveExamParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveExamWinner` ADD CONSTRAINT `LiveExamWinner_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `LiveExam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveExamWinner` ADD CONSTRAINT `LiveExamWinner_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `LiveExam`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
