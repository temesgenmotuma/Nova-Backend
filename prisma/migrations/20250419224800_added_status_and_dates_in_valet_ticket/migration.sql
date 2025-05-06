-- CreateEnum
CREATE TYPE "ValetTicketStatus" AS ENUM ('ISSUED', 'VEHICLEREQUESTED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ValetTicket" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "requestedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ValetTicketStatus" NOT NULL DEFAULT 'ISSUED';
