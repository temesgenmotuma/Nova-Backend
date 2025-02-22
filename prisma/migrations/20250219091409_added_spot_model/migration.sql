-- CreateEnum
CREATE TYPE "SpotStatus" AS ENUM ('Available', 'Reserved', 'Occupied');

-- CreateTable
CREATE TABLE "Spot" (
    "id" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "status" "SpotStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lotId" TEXT NOT NULL,

    CONSTRAINT "Spot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
