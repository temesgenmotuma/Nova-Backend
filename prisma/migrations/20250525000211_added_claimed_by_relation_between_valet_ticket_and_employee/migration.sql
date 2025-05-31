-- AlterTable
ALTER TABLE "ValetTicket" ADD COLUMN     "claimedBy" TEXT;

-- AddForeignKey
ALTER TABLE "ValetTicket" ADD CONSTRAINT "ValetTicket_claimedBy_fkey" FOREIGN KEY ("claimedBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
