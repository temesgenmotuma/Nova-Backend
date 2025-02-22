/*
  Warnings:

  - Added the required column `name` to the `Spot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Spot" ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "price" DROP NOT NULL;
