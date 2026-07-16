-- CreateEnum
CREATE TYPE "ConsentRequirement" AS ENUM ('NONE', 'UNDERAGE', 'ALL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "commissionFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consentFormUrl" TEXT,
ADD COLUMN     "consentRequirement" "ConsentRequirement" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "ticketAccentColor" TEXT,
ADD COLUMN     "ticketNote" TEXT,
ALTER COLUMN "refundsAllowed" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "consentAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TicketTier" ADD COLUMN     "password" TEXT;
