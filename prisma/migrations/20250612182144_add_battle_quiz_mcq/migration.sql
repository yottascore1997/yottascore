/*
  Warnings:

  - You are about to drop the column `questions` on the `BattleQuiz` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `BattleQuiz` DROP COLUMN `questions`;

-- CreateTable
CREATE TABLE `BattleQuizQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quizId` INTEGER NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `options` JSON NOT NULL,
    `correct` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BattleQuizQuestion` ADD CONSTRAINT `BattleQuizQuestion_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `BattleQuiz`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
