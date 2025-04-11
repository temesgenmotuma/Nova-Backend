-- CreateEnum
CREATE TYPE "OccupationType" AS ENUM ('RESERVATION', 'NONRESERVATION');

-- AlterTable
ALTER TABLE "Spot" ADD COLUMN     "occupationType" "OccupationType";
