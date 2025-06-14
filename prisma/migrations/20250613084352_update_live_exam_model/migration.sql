/*
  Warnings:

  - You are about to drop the column `endTime` on the `liveexam` table. All the data in the column will be lost.
  - You are about to drop the column `passingMarks` on the `liveexam` table. All the data in the column will be lost.
  - You are about to drop the column `standard` on the `liveexam` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `liveexam` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarks` on the `liveexam` table. All the data in the column will be lost.
  - You are about to drop the column `totalSpots` on the `liveexam` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `liveexam` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `LiveExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spots` to the `LiveExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCollection` to the `LiveExam` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `liveexam` DROP FOREIGN KEY `LiveExam_userId_fkey`;

-- DropIndex
DROP INDEX `LiveExam_userId_fkey` ON `liveexam`;

-- AlterTable
ALTER TABLE `liveexam` DROP COLUMN `endTime`,
    DROP COLUMN `passingMarks`,
    DROP COLUMN `standard`,
    DROP COLUMN `subject`,
    DROP COLUMN `totalMarks`,
    DROP COLUMN `totalSpots`,
    DROP COLUMN `userId`,
    ADD COLUMN `createdById` VARCHAR(191) NOT NULL,
    ADD COLUMN `spots` INTEGER NOT NULL,
    ADD COLUMN `totalCollection` DOUBLE NOT NULL;

-- AddForeignKey
ALTER TABLE `LiveExam` ADD CONSTRAINT `LiveExam_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
