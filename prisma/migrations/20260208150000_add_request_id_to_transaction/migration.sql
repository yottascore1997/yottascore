-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `requestId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Transaction_requestId_key` ON `Transaction`(`requestId`);
