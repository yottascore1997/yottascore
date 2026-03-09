-- CreateTable
CREATE TABLE `StudyPartnerProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `subjects` JSON NULL,
    `examType` VARCHAR(191) NULL,
    `goals` TEXT NULL,
    `studyTimeFrom` VARCHAR(191) NULL,
    `studyTimeTo` VARCHAR(191) NULL,
    `language` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudyPartnerProfile_userId_key`(`userId`),
    INDEX `StudyPartnerProfile_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyPartnerLike` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `targetUserId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudyPartnerLike_userId_targetUserId_key`(`userId`, `targetUserId`),
    INDEX `StudyPartnerLike_userId_idx`(`userId`),
    INDEX `StudyPartnerLike_targetUserId_idx`(`targetUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyPartnerMatch` (
    `id` VARCHAR(191) NOT NULL,
    `user1Id` VARCHAR(191) NOT NULL,
    `user2Id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unmatchedAt` DATETIME(3) NULL,

    UNIQUE INDEX `StudyPartnerMatch_user1Id_user2Id_key`(`user1Id`, `user2Id`),
    INDEX `StudyPartnerMatch_user1Id_idx`(`user1Id`),
    INDEX `StudyPartnerMatch_user2Id_idx`(`user2Id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StudyPartnerProfile` ADD CONSTRAINT `StudyPartnerProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyPartnerLike` ADD CONSTRAINT `StudyPartnerLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyPartnerLike` ADD CONSTRAINT `StudyPartnerLike_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyPartnerMatch` ADD CONSTRAINT `StudyPartnerMatch_user1Id_fkey` FOREIGN KEY (`user1Id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyPartnerMatch` ADD CONSTRAINT `StudyPartnerMatch_user2Id_fkey` FOREIGN KEY (`user2Id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
