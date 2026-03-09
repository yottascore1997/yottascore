-- DropForeignKey
ALTER TABLE `BattleQuizParticipant` DROP FOREIGN KEY `BattleQuizParticipant_quizId_fkey`;

-- DropIndex
DROP INDEX `BattleQuizParticipant_quizId_userId_key` ON `BattleQuizParticipant`;
