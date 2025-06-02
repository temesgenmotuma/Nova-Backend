-- AlterTable
ALTER TABLE "Lot" ADD COLUMN     "hasValet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Provider" ALTER COLUMN "hasValet" DROP NOT NULL;
