/*
  Warnings:

  - You are about to alter the column `status` on the `battle_rooms` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `Enum(EnumId(16))`.
  - You are about to drop the column `assignedToId` on the `supportticket` table. All the data in the column will be lost.
  - You are about to drop the `directmessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messagerequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referral` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spy_game_players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spy_game_votes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spy_game_words` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spy_games` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `battle_answers` DROP FOREIGN KEY `battle_answers_userId_fkey`;

-- DropForeignKey
ALTER TABLE `battle_players` DROP FOREIGN KEY `battle_players_userId_fkey`;

-- DropForeignKey
ALTER TABLE `battle_rooms` DROP FOREIGN KEY `battle_rooms_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `BattleQuiz` DROP FOREIGN KEY `BattleQuiz_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `BattleQuizLeaderboard` DROP FOREIGN KEY `BattleQuizLeaderboard_userId_fkey`;

-- DropForeignKey
ALTER TABLE `BattleQuizMatch` DROP FOREIGN KEY `BattleQuizMatch_player1Id_fkey`;

-- DropForeignKey
ALTER TABLE `BattleQuizMatch` DROP FOREIGN KEY `BattleQuizMatch_player2Id_fkey`;

-- DropForeignKey
ALTER TABLE `BattleQuizMatch` DROP FOREIGN KEY `BattleQuizMatch_winnerId_fkey`;

-- DropForeignKey
ALTER TABLE `BattleQuizParticipant` DROP FOREIGN KEY `BattleQuizParticipant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `BattleQuizWinner` DROP FOREIGN KEY `BattleQuizWinner_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Comment` DROP FOREIGN KEY `Comment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `DirectMessage` DROP FOREIGN KEY `DirectMessage_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `DirectMessage` DROP FOREIGN KEY `DirectMessage_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `Follow` DROP FOREIGN KEY `Follow_followerId_fkey`;

-- DropForeignKey
ALTER TABLE `Follow` DROP FOREIGN KEY `Follow_followingId_fkey`;

-- DropForeignKey
ALTER TABLE `FollowRequest` DROP FOREIGN KEY `FollowRequest_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `FollowRequest` DROP FOREIGN KEY `FollowRequest_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `Group` DROP FOREIGN KEY `Group_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupEvent` DROP FOREIGN KEY `GroupEvent_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupEventParticipant` DROP FOREIGN KEY `GroupEventParticipant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupMember` DROP FOREIGN KEY `GroupMember_userId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupMessage` DROP FOREIGN KEY `GroupMessage_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupPoll` DROP FOREIGN KEY `GroupPoll_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupPollVote` DROP FOREIGN KEY `GroupPollVote_userId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupPost` DROP FOREIGN KEY `GroupPost_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupPostComment` DROP FOREIGN KEY `GroupPostComment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupPostLike` DROP FOREIGN KEY `GroupPostLike_userId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupQuiz` DROP FOREIGN KEY `GroupQuiz_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `GroupQuizAttempt` DROP FOREIGN KEY `GroupQuizAttempt_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Like` DROP FOREIGN KEY `Like_userId_fkey`;

-- DropForeignKey
ALTER TABLE `LiveExam` DROP FOREIGN KEY `LiveExam_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `LiveExamParticipant` DROP FOREIGN KEY `LiveExamParticipant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `LiveExamWinner` DROP FOREIGN KEY `LiveExamWinner_userId_fkey`;

-- DropForeignKey
ALTER TABLE `MessageRequest` DROP FOREIGN KEY `MessageRequest_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `MessageRequest` DROP FOREIGN KEY `MessageRequest_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `PracticeExam` DROP FOREIGN KEY `PracticeExam_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `PracticeExamParticipant` DROP FOREIGN KEY `PracticeExamParticipant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionBankItem` DROP FOREIGN KEY `QuestionBankItem_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionCategory` DROP FOREIGN KEY `QuestionCategory_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionOfTheDay` DROP FOREIGN KEY `QuestionOfTheDay_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionOfTheDayAttempt` DROP FOREIGN KEY `QuestionOfTheDayAttempt_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Referral` DROP FOREIGN KEY `Referral_referredId_fkey`;

-- DropForeignKey
ALTER TABLE `Referral` DROP FOREIGN KEY `Referral_referrerId_fkey`;

-- DropForeignKey
ALTER TABLE `SavedPost` DROP FOREIGN KEY `SavedPost_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Session` DROP FOREIGN KEY `Session_userId_fkey`;

-- DropForeignKey
ALTER TABLE `spy_game_players` DROP FOREIGN KEY `spy_game_players_gameId_fkey`;

-- DropForeignKey
ALTER TABLE `spy_game_players` DROP FOREIGN KEY `spy_game_players_userId_fkey`;

-- DropForeignKey
ALTER TABLE `spy_game_votes` DROP FOREIGN KEY `spy_game_votes_gameId_fkey`;

-- DropForeignKey
ALTER TABLE `spy_game_votes` DROP FOREIGN KEY `spy_game_votes_votedForId_fkey`;

-- DropForeignKey
ALTER TABLE `spy_game_votes` DROP FOREIGN KEY `spy_game_votes_voterId_fkey`;

-- DropForeignKey
ALTER TABLE `spy_game_words` DROP FOREIGN KEY `spy_game_words_gameId_fkey`;

-- DropForeignKey
ALTER TABLE `spy_games` DROP FOREIGN KEY `spy_games_hostId_fkey`;

-- DropForeignKey
ALTER TABLE `Story` DROP FOREIGN KEY `Story_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `StoryLike` DROP FOREIGN KEY `StoryLike_userId_fkey`;

-- DropForeignKey
ALTER TABLE `StoryView` DROP FOREIGN KEY `StoryView_viewerId_fkey`;

-- DropForeignKey
ALTER TABLE `SupportTicket` DROP FOREIGN KEY `SupportTicket_assignedToId_fkey`;

-- DropForeignKey
ALTER TABLE `SupportTicket` DROP FOREIGN KEY `SupportTicket_userId_fkey`;

-- DropForeignKey
ALTER TABLE `SupportTicketReply` DROP FOREIGN KEY `SupportTicketReply_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Timetable` DROP FOREIGN KEY `Timetable_userId_fkey`;

-- DropForeignKey
ALTER TABLE `TimetableSlot` DROP FOREIGN KEY `TimetableSlot_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserBattleStats` DROP FOREIGN KEY `UserBattleStats_userId_fkey`;

-- DropIndex
DROP INDEX `Account_userId_fkey` ON `Account`;

-- DropIndex
DROP INDEX `battle_answers_userId_fkey` ON `battle_answers`;

-- DropIndex
DROP INDEX `battle_players_userId_fkey` ON `battle_players`;

-- DropIndex
DROP INDEX `battle_rooms_createdById_fkey` ON `battle_rooms`;

-- DropIndex
DROP INDEX `BattleQuiz_createdById_fkey` ON `BattleQuiz`;

-- DropIndex
DROP INDEX `BattleQuizMatch_player1Id_fkey` ON `BattleQuizMatch`;

-- DropIndex
DROP INDEX `BattleQuizMatch_player2Id_fkey` ON `BattleQuizMatch`;

-- DropIndex
DROP INDEX `BattleQuizMatch_winnerId_fkey` ON `BattleQuizMatch`;

-- DropIndex
DROP INDEX `BattleQuizParticipant_userId_fkey` ON `BattleQuizParticipant`;

-- DropIndex
DROP INDEX `BattleQuizWinner_userId_fkey` ON `BattleQuizWinner`;

-- DropIndex
DROP INDEX `Comment_userId_fkey` ON `Comment`;

-- DropIndex
DROP INDEX `Follow_followingId_fkey` ON `Follow`;

-- DropIndex
DROP INDEX `FollowRequest_receiverId_fkey` ON `FollowRequest`;

-- DropIndex
DROP INDEX `Group_creatorId_fkey` ON `Group`;

-- DropIndex
DROP INDEX `GroupEvent_creatorId_fkey` ON `GroupEvent`;

-- DropIndex
DROP INDEX `GroupMessage_senderId_fkey` ON `GroupMessage`;

-- DropIndex
DROP INDEX `GroupPoll_creatorId_fkey` ON `GroupPoll`;

-- DropIndex
DROP INDEX `GroupPost_authorId_fkey` ON `GroupPost`;

-- DropIndex
DROP INDEX `GroupPostComment_userId_fkey` ON `GroupPostComment`;

-- DropIndex
DROP INDEX `GroupQuiz_creatorId_fkey` ON `GroupQuiz`;

-- DropIndex
DROP INDEX `LiveExam_createdById_fkey` ON `LiveExam`;

-- DropIndex
DROP INDEX `LiveExamParticipant_userId_fkey` ON `LiveExamParticipant`;

-- DropIndex
DROP INDEX `LiveExamWinner_userId_fkey` ON `LiveExamWinner`;

-- DropIndex
DROP INDEX `PracticeExam_createdById_fkey` ON `PracticeExam`;

-- DropIndex
DROP INDEX `PracticeExamParticipant_userId_fkey` ON `PracticeExamParticipant`;

-- DropIndex
DROP INDEX `QuestionBankItem_createdById_fkey` ON `QuestionBankItem`;

-- DropIndex
DROP INDEX `QuestionCategory_createdById_fkey` ON `QuestionCategory`;

-- DropIndex
DROP INDEX `QuestionOfTheDay_createdById_fkey` ON `QuestionOfTheDay`;

-- DropIndex
DROP INDEX `QuestionOfTheDayAttempt_userId_fkey` ON `QuestionOfTheDayAttempt`;

-- DropIndex
DROP INDEX `Session_userId_fkey` ON `Session`;

-- DropIndex
DROP INDEX `StoryLike_userId_fkey` ON `StoryLike`;

-- DropIndex
DROP INDEX `StoryView_viewerId_fkey` ON `StoryView`;

-- DropIndex
DROP INDEX `SupportTicket_assignedToId_idx` ON `SupportTicket`;

-- DropIndex
DROP INDEX `SupportTicketReply_userId_fkey` ON `SupportTicketReply`;

-- DropIndex
DROP INDEX `Timetable_userId_fkey` ON `Timetable`;

-- DropIndex
DROP INDEX `Transaction_userId_fkey` ON `Transaction`;

-- AlterTable
ALTER TABLE `battle_rooms` MODIFY `status` ENUM('WAITING', 'PLAYING', 'FINISHED') NOT NULL DEFAULT 'WAITING';

-- AlterTable
ALTER TABLE `SupportTicket` DROP COLUMN `assignedToId`;

-- DropTable
DROP TABLE `DirectMessage`;

-- DropTable
DROP TABLE `MessageRequest`;

-- DropTable
DROP TABLE `Referral`;

-- DropTable
DROP TABLE `spy_game_players`;

-- DropTable
DROP TABLE `spy_game_votes`;

-- DropTable
DROP TABLE `spy_game_words`;

-- DropTable
DROP TABLE `spy_games`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `hashedPassword` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'STUDENT', 'USER') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `kycStatus` ENUM('PENDING', 'VERIFIED', 'REJECTED', 'NOT_SUBMITTED') NOT NULL DEFAULT 'NOT_SUBMITTED',
    `kycVerifiedAt` DATETIME(3) NULL,
    `kycRejectedAt` DATETIME(3) NULL,
    `kycRejectionReason` VARCHAR(191) NULL,
    `wallet` DOUBLE NOT NULL DEFAULT 0,
    `profilePhoto` VARCHAR(191) NULL,
    `course` VARCHAR(191) NULL,
    `year` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kyc_documents` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `documentType` ENUM('AADHAR_CARD', 'PAN_CARD', 'DRIVING_LICENSE', 'PASSPORT', 'VOTER_ID', 'BANK_PASSBOOK', 'OTHER') NOT NULL,
    `documentNumber` VARCHAR(191) NULL,
    `documentImage` VARCHAR(191) NOT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveExam` ADD CONSTRAINT `LiveExam_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveExamParticipant` ADD CONSTRAINT `LiveExamParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveExamWinner` ADD CONSTRAINT `LiveExamWinner_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeExam` ADD CONSTRAINT `PracticeExam_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeExamParticipant` ADD CONSTRAINT `PracticeExamParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionOfTheDay` ADD CONSTRAINT `QuestionOfTheDay_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionOfTheDayAttempt` ADD CONSTRAINT `QuestionOfTheDayAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable` ADD CONSTRAINT `Timetable_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimetableSlot` ADD CONSTRAINT `TimetableSlot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_followingId_fkey` FOREIGN KEY (`followingId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowRequest` ADD CONSTRAINT `FollowRequest_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowRequest` ADD CONSTRAINT `FollowRequest_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedPost` ADD CONSTRAINT `SavedPost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupPost` ADD CONSTRAINT `GroupPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupPostLike` ADD CONSTRAINT `GroupPostLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupPostComment` ADD CONSTRAINT `GroupPostComment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMessage` ADD CONSTRAINT `GroupMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupEvent` ADD CONSTRAINT `GroupEvent_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupEventParticipant` ADD CONSTRAINT `GroupEventParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupQuiz` ADD CONSTRAINT `GroupQuiz_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupQuizAttempt` ADD CONSTRAINT `GroupQuizAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupPoll` ADD CONSTRAINT `GroupPoll_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupPollVote` ADD CONSTRAINT `GroupPollVote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuiz` ADD CONSTRAINT `BattleQuiz_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizParticipant` ADD CONSTRAINT `BattleQuizParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizWinner` ADD CONSTRAINT `BattleQuizWinner_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizMatch` ADD CONSTRAINT `BattleQuizMatch_player1Id_fkey` FOREIGN KEY (`player1Id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizMatch` ADD CONSTRAINT `BattleQuizMatch_player2Id_fkey` FOREIGN KEY (`player2Id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizMatch` ADD CONSTRAINT `BattleQuizMatch_winnerId_fkey` FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BattleQuizLeaderboard` ADD CONSTRAINT `BattleQuizLeaderboard_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBattleStats` ADD CONSTRAINT `UserBattleStats_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionCategory` ADD CONSTRAINT `QuestionCategory_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionBankItem` ADD CONSTRAINT `QuestionBankItem_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Story` ADD CONSTRAINT `Story_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoryView` ADD CONSTRAINT `StoryView_viewerId_fkey` FOREIGN KEY (`viewerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoryLike` ADD CONSTRAINT `StoryLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicketReply` ADD CONSTRAINT `SupportTicketReply_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_rooms` ADD CONSTRAINT `battle_rooms_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_players` ADD CONSTRAINT `battle_players_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_answers` ADD CONSTRAINT `battle_answers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc_documents` ADD CONSTRAINT `kyc_documents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
