-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('FIXED', 'PERCENT');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "commissionPercentBps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "commissionType" "CommissionType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "hideRemaining" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TicketTier" ADD COLUMN     "color" TEXT;
