/*
  Warnings:

  - You are about to drop the column `correct` on the `question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `question` DROP COLUMN `correct`,
    ADD COLUMN `categoryId` VARCHAR(191) NULL,
    ADD COLUMN `correctAnswer` INTEGER NULL;

-- CreateTable
CREATE TABLE `battle_rooms` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `maxPlayers` INTEGER NOT NULL DEFAULT 2,
    `status` ENUM('waiting', 'starting', 'active', 'finished') NOT NULL DEFAULT 'waiting',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `battle_players` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `isReady` BOOLEAN NOT NULL DEFAULT false,
    `isOnline` BOOLEAN NOT NULL DEFAULT true,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `battle_players_roomId_userId_key`(`roomId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `battle_questions` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `questionIndex` INTEGER NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `battle_questions_roomId_questionIndex_key`(`roomId`, `questionIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `battle_answers` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `questionIndex` INTEGER NOT NULL,
    `answerIndex` INTEGER NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,
    `timeSpent` INTEGER NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `answeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `battle_answers_roomId_userId_questionIndex_key`(`roomId`, `userId`, `questionIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `QuestionCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_rooms` ADD CONSTRAINT `battle_rooms_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `QuestionCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_rooms` ADD CONSTRAINT `battle_rooms_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_players` ADD CONSTRAINT `battle_players_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `battle_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_players` ADD CONSTRAINT `battle_players_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_questions` ADD CONSTRAINT `battle_questions_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `battle_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_questions` ADD CONSTRAINT `battle_questions_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_answers` ADD CONSTRAINT `battle_answers_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `battle_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_answers` ADD CONSTRAINT `battle_answers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_answers` ADD CONSTRAINT `battle_answers_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
