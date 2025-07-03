-- CreateTable
CREATE TABLE `SupportTicket` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `issueType` ENUM('TECHNICAL_ISSUE', 'PAYMENT_PROBLEM', 'EXAM_ACCESS', 'ACCOUNT_ISSUE', 'FEATURE_REQUEST', 'BUG_REPORT', 'GENERAL_INQUIRY', 'OTHER') NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `assignedToId` VARCHAR(191) NULL,

    UNIQUE INDEX `SupportTicket_ticketId_key`(`ticketId`),
    INDEX `SupportTicket_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `SupportTicket_status_priority_idx`(`status`, `priority`),
    INDEX `SupportTicket_assignedToId_idx`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportTicketReply` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isInternal` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `SupportTicketReply_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportTicketAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ticketId` VARCHAR(191) NULL,
    `replyId` VARCHAR(191) NULL,

    INDEX `SupportTicketAttachment_ticketId_idx`(`ticketId`),
    INDEX `SupportTicketAttachment_replyId_idx`(`replyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicketReply` ADD CONSTRAINT `SupportTicketReply_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicketReply` ADD CONSTRAINT `SupportTicketReply_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicketAttachment` ADD CONSTRAINT `SupportTicketAttachment_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicketAttachment` ADD CONSTRAINT `SupportTicketAttachment_replyId_fkey` FOREIGN KEY (`replyId`) REFERENCES `SupportTicketReply`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
