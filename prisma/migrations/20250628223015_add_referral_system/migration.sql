/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `referralCode` VARCHAR(191) NULL,
    ADD COLUMN `referralCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `referredBy` VARCHAR(191) NULL,
    ADD COLUMN `totalReferralEarnings` DOUBLE NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Referral` (
    `id` VARCHAR(191) NOT NULL,
    `referrerId` VARCHAR(191) NOT NULL,
    `referredId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Referral_code_key`(`code`),
    UNIQUE INDEX `Referral_referrerId_referredId_key`(`referrerId`, `referredId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_referralCode_key` ON `User`(`referralCode`);

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referredId_fkey` FOREIGN KEY (`referredId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
