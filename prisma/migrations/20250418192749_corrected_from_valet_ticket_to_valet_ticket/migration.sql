/*
  Warnings:

  - You are about to drop the `valetTicket` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "valetTicket" DROP CONSTRAINT "valetTicket_customerId_fkey";

-- DropForeignKey
ALTER TABLE "valetTicket" DROP CONSTRAINT "valetTicket_issuedBy_fkey";

-- DropForeignKey
ALTER TABLE "valetTicket" DROP CONSTRAINT "valetTicket_vehicleId_fkey";

-- DropTable
DROP TABLE "valetTicket";

-- CreateTable
CREATE TABLE "ValetTicket" (
    "id" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerEmail" TEXT,
    "customerId" TEXT,
    "issuedBy" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "ValetTicket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ValetTicket" ADD CONSTRAINT "ValetTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValetTicket" ADD CONSTRAINT "ValetTicket_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValetTicket" ADD CONSTRAINT "ValetTicket_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
