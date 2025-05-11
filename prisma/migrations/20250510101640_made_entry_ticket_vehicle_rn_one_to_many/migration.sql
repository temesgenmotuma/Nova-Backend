/*
  Warnings:

  - You are about to drop the column `lotId` on the `Spot` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `zoneId` to the `Spot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Spot" DROP CONSTRAINT "Spot_lotId_fkey";

-- DropIndex
DROP INDEX "EntryTicket_vehicleId_key";

-- AlterTable
ALTER TABLE "Spot" DROP COLUMN "lotId",
ADD COLUMN     "zoneId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleType" TEXT,
    "totalNumberOfSpots" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "lotId" TEXT NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
