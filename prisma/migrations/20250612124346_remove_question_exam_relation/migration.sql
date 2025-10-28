/*
  Warnings:

  - You are about to drop the column `examId` on the `Question` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Question` DROP FOREIGN KEY `Question_examId_fkey`;

-- DropIndex
DROP INDEX `Question_examId_fkey` ON `Question`;

-- AlterTable
ALTER TABLE `Question` DROP COLUMN `examId`;
