-- CreateTable
CREATE TABLE `BattleQuizAmount` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `maxPlayers` INTEGER NOT NULL DEFAULT 1000,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BattleQuizAmount_categoryId_isActive_idx`(`categoryId`, `isActive`),
    UNIQUE INDEX `BattleQuizAmount_categoryId_amount_key`(`categoryId`, `amount`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BattleQuizAmount` ADD CONSTRAINT `BattleQuizAmount_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `QuestionCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
