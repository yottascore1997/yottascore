/*
  Warnings:

  - You are about to drop the column `completedAt` on the `battlequizparticipant` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `battlequizparticipant` table. All the data in the column will be lost.
  - You are about to drop the column `paid` on the `battlequizparticipant` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `battlequizparticipant` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `battlequizparticipant` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `battlequizparticipant` table. All the data in the column will be lost.
  - Made the column `score` on table `battlequizparticipant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `answers` on table `battlequizparticipant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `battlequizparticipant` DROP COLUMN `completedAt`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `paid`,
    DROP COLUMN `paymentId`,
    DROP COLUMN `startedAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `matchId` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('WAITING', 'PLAYING', 'FINISHED', 'DISCONNECTED') NOT NULL DEFAULT 'WAITING',
    MODIFY `score` INTEGER NOT NULL DEFAULT 0,
    MODIFY `answers` JSON NOT NULL;

-- CreateTable
CREATE TABLE `BattleQuizMatch` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `player1Id` VARCHAR(191) NOT NULL,
    `player2Id` VARCHAR(191) NOT NULL,
    `status` ENUM('WAITING', 'STARTING', 'PLAYING', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    `currentRound` INTEGER NOT NULL DEFAULT 0,
    `totalRounds` INTEGER NOT NULL DEFAULT 5,
    `player1Score` INTEGER NOT NULL DEFAULT 0,
    `player2Score` INTEGER NOT NULL DEFAULT 0,
    `startTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endTime` DATETIME(3) NULL,
    `winnerId` VARCHAR(191) NULL,
    `prizeAmount` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BattleQuizParticipant` ADD CONSTRAINT `BattleQuizParticipant_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `BattleQuizMatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizMatch` ADD CONSTRAINT `BattleQuizMatch_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `BattleQuiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizMatch` ADD CONSTRAINT `BattleQuizMatch_player1Id_fkey` FOREIGN KEY (`player1Id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizMatch` ADD CONSTRAINT `BattleQuizMatch_player2Id_fkey` FOREIGN KEY (`player2Id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizMatch` ADD CONSTRAINT `BattleQuizMatch_winnerId_fkey` FOREIGN KEY (`winnerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
