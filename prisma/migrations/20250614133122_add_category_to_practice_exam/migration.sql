/*
  Warnings:

  - Added the required column `category` to the `PracticeExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subcategory` to the `PracticeExam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PracticeExam` ADD COLUMN `category` VARCHAR(191) NOT NULL,
    ADD COLUMN `subcategory` VARCHAR(191) NOT NULL;
