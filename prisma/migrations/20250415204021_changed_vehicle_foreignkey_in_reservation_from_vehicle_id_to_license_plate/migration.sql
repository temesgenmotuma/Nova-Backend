/*
  Warnings:

  - You are about to drop the column `vehicleId` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `licensePlate` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_vehicleId_fkey";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "vehicleId",
ADD COLUMN     "licensePlate" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_licensePlate_fkey" FOREIGN KEY ("licensePlate") REFERENCES "Vehicle"("licensePlateNumber") ON DELETE RESTRICT ON UPDATE CASCADE;
