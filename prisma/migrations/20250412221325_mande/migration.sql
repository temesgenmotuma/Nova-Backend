/*
  Warnings:

  - Made the column `entryTime` on table `EntryTicket` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "EntryTicket" ALTER COLUMN "entryTime" SET NOT NULL,
ALTER COLUMN "exitTime" DROP NOT NULL;
