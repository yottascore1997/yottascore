-- AlterTable
ALTER TABLE `StudyPartnerProfile` ADD COLUMN `studyTimeSlot` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `dateOfBirth` DATETIME(3) NULL;
