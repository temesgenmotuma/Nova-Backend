/*
  Warnings:

  - Added the required column `token` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "token" TEXT NOT NULL;
