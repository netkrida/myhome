-- CreateEnum
CREATE TYPE "public"."AdvertisementStatus" AS ENUM ('PENDING', 'APPROVED', 'PLACED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "accountId" TEXT;

-- CreateTable
CREATE TABLE "public"."Advertisement" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "imageUrl" VARCHAR(500) NOT NULL,
    "publicId" VARCHAR(255),
    "linkUrl" VARCHAR(500),
    "status" "public"."AdvertisementStatus" NOT NULL DEFAULT 'PENDING',
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "layoutSlot" INTEGER,
    "placedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Advertisement_status_idx" ON "public"."Advertisement"("status");

-- CreateIndex
CREATE INDEX "Advertisement_submittedBy_idx" ON "public"."Advertisement"("submittedBy");

-- CreateIndex
CREATE INDEX "Advertisement_layoutSlot_idx" ON "public"."Advertisement"("layoutSlot");

-- CreateIndex
CREATE INDEX "Advertisement_isActive_idx" ON "public"."Advertisement"("isActive");

-- CreateIndex
CREATE INDEX "Advertisement_sortOrder_idx" ON "public"."Advertisement"("sortOrder");

-- CreateIndex
CREATE INDEX "Advertisement_startDate_endDate_idx" ON "public"."Advertisement"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "public"."Advertisement" ADD CONSTRAINT "Advertisement_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Advertisement" ADD CONSTRAINT "Advertisement_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
