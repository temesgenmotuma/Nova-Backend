-- CreateEnum
CREATE TYPE "EntryTicketStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "EntryTicket" (
    "id" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3),
    "exitTime" TIMESTAMP(3) NOT NULL,
    "status" "EntryTicketStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "isPaid" BOOLEAN NOT NULL,
    "spotId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "EntryTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntryTicket_vehicleId_key" ON "EntryTicket"("vehicleId");

-- CreateIndex
CREATE INDEX "location_idx" ON "Lot" USING GIST ("location");

-- AddForeignKey
ALTER TABLE "EntryTicket" ADD CONSTRAINT "EntryTicket_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryTicket" ADD CONSTRAINT "EntryTicket_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
