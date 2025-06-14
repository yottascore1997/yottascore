/*
  Warnings:

  - You are about to drop the column `examId` on the `question` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `question` DROP FOREIGN KEY `Question_examId_fkey`;

-- DropIndex
DROP INDEX `Question_examId_fkey` ON `question`;

-- AlterTable
ALTER TABLE `question` DROP COLUMN `examId`;
