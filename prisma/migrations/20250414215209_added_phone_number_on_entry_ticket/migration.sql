/*
  Warnings:

  - Added the required column `phoneNumber` to the `EntryTicket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EntryTicket" ADD COLUMN     "phoneNumber" TEXT NOT NULL;
