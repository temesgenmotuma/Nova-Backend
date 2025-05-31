-- AlterTable
ALTER TABLE "ValetTicket" ADD COLUMN     "spotId" TEXT;

-- AddForeignKey
ALTER TABLE "ValetTicket" ADD CONSTRAINT "ValetTicket_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
