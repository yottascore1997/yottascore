-- DropForeignKey
ALTER TABLE `battlequizparticipant` DROP FOREIGN KEY `BattleQuizParticipant_quizId_fkey`;

-- DropIndex
DROP INDEX `BattleQuizParticipant_quizId_userId_key` ON `battlequizparticipant`;
