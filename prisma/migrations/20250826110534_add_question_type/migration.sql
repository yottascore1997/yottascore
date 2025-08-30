/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `groupmessage` MODIFY `messageType` ENUM('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'DOCUMENT', 'LOCATION', 'VOICE_NOTE', 'STICKER', 'SYSTEM') NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE `kyc_documents` MODIFY `documentImage` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `post` ADD COLUMN `rejectionReason` VARCHAR(191) NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewedBy` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `question` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'MCQ';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `referralCode` VARCHAR(191) NULL,
    ADD COLUMN `referralCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `referredBy` VARCHAR(191) NULL,
    ADD COLUMN `totalReferralEarnings` DOUBLE NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `DirectMessage` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `messageType` ENUM('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'DOCUMENT', 'LOCATION', 'VOICE_NOTE', 'STICKER', 'SYSTEM') NOT NULL DEFAULT 'TEXT',
    `fileUrl` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `fileType` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `editedAt` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `pinnedAt` DATETIME(3) NULL,
    `replyToId` VARCHAR(191) NULL,
    `isForwarded` BOOLEAN NOT NULL DEFAULT false,
    `originalSenderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NOT NULL,

    INDEX `DirectMessage_senderId_receiverId_createdAt_idx`(`senderId`, `receiverId`, `createdAt`),
    INDEX `DirectMessage_receiverId_senderId_createdAt_idx`(`receiverId`, `senderId`, `createdAt`),
    INDEX `DirectMessage_replyToId_idx`(`replyToId`),
    INDEX `DirectMessage_isPinned_idx`(`isPinned`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageReaction` (
    `id` VARCHAR(191) NOT NULL,
    `reactionType` ENUM('LIKE', 'LOVE', 'LAUGH', 'WOW', 'SAD', 'ANGRY', 'THUMBS_UP', 'THUMBS_DOWN', 'HEART', 'CLAP', 'CELEBRATE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `messageId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `MessageReaction_messageId_idx`(`messageId`),
    INDEX `MessageReaction_userId_idx`(`userId`),
    UNIQUE INDEX `MessageReaction_messageId_userId_reactionType_key`(`messageId`, `userId`, `reactionType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageRequest` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `messageType` ENUM('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'DOCUMENT', 'LOCATION', 'VOICE_NOTE', 'STICKER', 'SYSTEM') NOT NULL DEFAULT 'TEXT',
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

-- CreateTable
CREATE TABLE `spy_games` (
    `id` VARCHAR(191) NOT NULL,
    `roomCode` VARCHAR(191) NOT NULL,
    `hostId` VARCHAR(191) NOT NULL,
    `status` ENUM('WAITING', 'PLAYING', 'VOTING', 'FINISHED') NOT NULL DEFAULT 'WAITING',
    `maxPlayers` INTEGER NOT NULL DEFAULT 6,
    `minPlayers` INTEGER NOT NULL DEFAULT 4,
    `wordPack` VARCHAR(191) NOT NULL DEFAULT 'default',
    `currentTurn` INTEGER NOT NULL DEFAULT 0,
    `currentPhase` ENUM('LOBBY', 'WORD_ASSIGNMENT', 'DESCRIBING', 'VOTING', 'REVEAL') NOT NULL DEFAULT 'LOBBY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spy_games_roomCode_key`(`roomCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spy_game_players` (
    `id` VARCHAR(191) NOT NULL,
    `gameId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `isSpy` BOOLEAN NOT NULL DEFAULT false,
    `isHost` BOOLEAN NOT NULL DEFAULT false,
    `isAlive` BOOLEAN NOT NULL DEFAULT true,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `spy_game_players_gameId_userId_key`(`gameId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spy_game_words` (
    `id` VARCHAR(191) NOT NULL,
    `gameId` VARCHAR(191) NOT NULL,
    `word` VARCHAR(191) NOT NULL,
    `isSpyWord` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spy_game_votes` (
    `id` VARCHAR(191) NOT NULL,
    `gameId` VARCHAR(191) NOT NULL,
    `voterId` VARCHAR(191) NOT NULL,
    `votedForId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `spy_game_votes_gameId_voterId_key`(`gameId`, `voterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushNotification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `sentBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PushNotification_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `PushNotification_type_idx`(`type`),
    INDEX `PushNotification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Post_status_createdAt_idx` ON `Post`(`status`, `createdAt`);

-- CreateIndex
CREATE UNIQUE INDEX `users_referralCode_key` ON `users`(`referralCode`);

-- AddForeignKey
ALTER TABLE `DirectMessage` ADD CONSTRAINT `DirectMessage_replyToId_fkey` FOREIGN KEY (`replyToId`) REFERENCES `DirectMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectMessage` ADD CONSTRAINT `DirectMessage_originalSenderId_fkey` FOREIGN KEY (`originalSenderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectMessage` ADD CONSTRAINT `DirectMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectMessage` ADD CONSTRAINT `DirectMessage_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageReaction` ADD CONSTRAINT `MessageReaction_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `DirectMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageReaction` ADD CONSTRAINT `MessageReaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRequest` ADD CONSTRAINT `MessageRequest_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRequest` ADD CONSTRAINT `MessageRequest_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referredId_fkey` FOREIGN KEY (`referredId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_games` ADD CONSTRAINT `spy_games_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_players` ADD CONSTRAINT `spy_game_players_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `spy_games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_players` ADD CONSTRAINT `spy_game_players_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_words` ADD CONSTRAINT `spy_game_words_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `spy_games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_votes` ADD CONSTRAINT `spy_game_votes_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `spy_games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_votes` ADD CONSTRAINT `spy_game_votes_voterId_fkey` FOREIGN KEY (`voterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_votes` ADD CONSTRAINT `spy_game_votes_votedForId_fkey` FOREIGN KEY (`votedForId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushNotification` ADD CONSTRAINT `PushNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushNotification` ADD CONSTRAINT `PushNotification_sentBy_fkey` FOREIGN KEY (`sentBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
