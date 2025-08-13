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

-- AddForeignKey
ALTER TABLE `spy_games` ADD CONSTRAINT `spy_games_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_players` ADD CONSTRAINT `spy_game_players_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `spy_games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_players` ADD CONSTRAINT `spy_game_players_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_words` ADD CONSTRAINT `spy_game_words_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `spy_games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_votes` ADD CONSTRAINT `spy_game_votes_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `spy_games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_votes` ADD CONSTRAINT `spy_game_votes_voterId_fkey` FOREIGN KEY (`voterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spy_game_votes` ADD CONSTRAINT `spy_game_votes_votedForId_fkey` FOREIGN KEY (`votedForId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
