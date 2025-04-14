/*
  Warnings:

  - Added the required column `licensePlate` to the `EntryTicket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EntryTicket" ADD COLUMN     "licensePlate" TEXT NOT NULL;
