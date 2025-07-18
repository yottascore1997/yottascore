/*
  Warnings:

  - A unique constraint covering the columns `[roomCode]` on the table `BattleQuiz` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `battlequiz` ADD COLUMN `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maxPlayers` INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN `roomCode` VARCHAR(191) NULL,
    ADD COLUMN `timePerQuestion` INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE `battlequizmatch` ADD COLUMN `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `player1Answers` JSON NULL,
    ADD COLUMN `player2Answers` JSON NULL,
    ADD COLUMN `roomCode` VARCHAR(191) NULL,
    MODIFY `status` ENUM('WAITING', 'STARTING', 'PLAYING', 'FINISHED', 'CANCELLED', 'TIMEOUT') NOT NULL DEFAULT 'WAITING';

-- AlterTable
ALTER TABLE `battlequizparticipant` ADD COLUMN `responseTimes` JSON NULL,
    MODIFY `status` ENUM('WAITING', 'READY', 'PLAYING', 'FINISHED', 'DISCONNECTED') NOT NULL DEFAULT 'WAITING';

-- AlterTable
ALTER TABLE `battlequizquestion` ADD COLUMN `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN `explanation` TEXT NULL;

-- CreateTable
CREATE TABLE `BattleQuizLeaderboard` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `totalMatches` INTEGER NOT NULL DEFAULT 0,
    `wins` INTEGER NOT NULL DEFAULT 0,
    `losses` INTEGER NOT NULL DEFAULT 0,
    `draws` INTEGER NOT NULL DEFAULT 0,
    `totalScore` INTEGER NOT NULL DEFAULT 0,
    `averageScore` DOUBLE NOT NULL DEFAULT 0,
    `winStreak` INTEGER NOT NULL DEFAULT 0,
    `bestWinStreak` INTEGER NOT NULL DEFAULT 0,
    `totalPrizeMoney` DOUBLE NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `experience` INTEGER NOT NULL DEFAULT 0,
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BattleQuizLeaderboard_totalScore_idx`(`totalScore`),
    INDEX `BattleQuizLeaderboard_wins_idx`(`wins`),
    INDEX `BattleQuizLeaderboard_level_idx`(`level`),
    UNIQUE INDEX `BattleQuizLeaderboard_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserBattleStats` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `totalMatches` INTEGER NOT NULL DEFAULT 0,
    `wins` INTEGER NOT NULL DEFAULT 0,
    `losses` INTEGER NOT NULL DEFAULT 0,
    `draws` INTEGER NOT NULL DEFAULT 0,
    `winRate` DOUBLE NOT NULL DEFAULT 0,
    `totalScore` INTEGER NOT NULL DEFAULT 0,
    `averageScore` DOUBLE NOT NULL DEFAULT 0,
    `fastestAnswer` INTEGER NULL,
    `totalPrizeMoney` DOUBLE NOT NULL DEFAULT 0,
    `currentStreak` INTEGER NOT NULL DEFAULT 0,
    `bestStreak` INTEGER NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `experience` INTEGER NOT NULL DEFAULT 0,
    `experienceToNext` INTEGER NOT NULL DEFAULT 100,
    `favoriteCategory` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserBattleStats_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `BattleQuiz_roomCode_key` ON `BattleQuiz`(`roomCode`);

-- AddForeignKey
ALTER TABLE `BattleQuizLeaderboard` ADD CONSTRAINT `BattleQuizLeaderboard_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBattleStats` ADD CONSTRAINT `UserBattleStats_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
