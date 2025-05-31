-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "reservationId" TEXT;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
