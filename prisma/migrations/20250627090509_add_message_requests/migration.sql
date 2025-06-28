/*
  Warnings:

  - The values [DECLINED,NOT_RESPONDED] on the enum `GroupEventParticipant_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `groupeventparticipant` MODIFY `status` ENUM('ATTENDING', 'NOT_ATTENDING', 'MAYBE') NOT NULL DEFAULT 'ATTENDING';

-- CreateTable
CREATE TABLE `MessageRequest` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `messageType` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') NOT NULL DEFAULT 'TEXT',
    `fileUrl` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NOT NULL,

    INDEX `MessageRequest_senderId_receiverId_createdAt_idx`(`senderId`, `receiverId`, `createdAt`),
    INDEX `MessageRequest_receiverId_senderId_createdAt_idx`(`receiverId`, `senderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MessageRequest` ADD CONSTRAINT `MessageRequest_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRequest` ADD CONSTRAINT `MessageRequest_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizParticipant` ADD CONSTRAINT `BattleQuizParticipant_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `BattleQuiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
