-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_lotId_fkey";

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "lotId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
