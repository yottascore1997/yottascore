/*
  Warnings:

  - You are about to drop the column `endDate` on the `govtexamnotification` table. All the data in the column will be lost.
  - You are about to drop the column `isOfficial` on the `govtexamnotification` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `govtexamnotification` table. All the data in the column will be lost.
  - You are about to drop the column `officialLink` on the `govtexamnotification` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `govtexamnotification` table. All the data in the column will be lost.
  - Added the required column `applyLink` to the `GovtExamNotification` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `govtexamnotification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `govtexamnotification` DROP COLUMN `endDate`,
    DROP COLUMN `isOfficial`,
    DROP COLUMN `logoUrl`,
    DROP COLUMN `officialLink`,
    DROP COLUMN `startDate`,
    ADD COLUMN `applyLink` VARCHAR(191) NOT NULL,
    MODIFY `description` TEXT NOT NULL;
