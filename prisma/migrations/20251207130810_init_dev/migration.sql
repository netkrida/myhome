/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Advertisement` table. All the data in the column will be lost.
  - Added the required column `submittedBy` to the `Advertisement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AdvertisementStatus" AS ENUM ('PENDING', 'APPROVED', 'PLACED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."Advertisement" DROP COLUMN "createdBy",
ADD COLUMN     "layoutSlot" INTEGER,
ADD COLUMN     "placedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "status" "public"."AdvertisementStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "submittedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "accountId" TEXT;

-- CreateIndex
CREATE INDEX "Advertisement_status_idx" ON "public"."Advertisement"("status");

-- CreateIndex
CREATE INDEX "Advertisement_submittedBy_idx" ON "public"."Advertisement"("submittedBy");

-- CreateIndex
CREATE INDEX "Advertisement_layoutSlot_idx" ON "public"."Advertisement"("layoutSlot");

-- AddForeignKey
ALTER TABLE "public"."Advertisement" ADD CONSTRAINT "Advertisement_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Advertisement" ADD CONSTRAINT "Advertisement_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
