/*
  Warnings:

  - The values [PENDING] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `shift` on the `ReceptionistProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."BankAccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."PayoutSource" AS ENUM ('SALES', 'DEPOSIT', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."BookingStatus_new" AS ENUM ('UNPAID', 'DEPOSIT_PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'EXPIRED');
ALTER TABLE "public"."Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Booking" ALTER COLUMN "status" TYPE "public"."BookingStatus_new" USING ("status"::text::"public"."BookingStatus_new");
ALTER TYPE "public"."BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "public"."BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "public"."Booking" ALTER COLUMN "status" SET DEFAULT 'UNPAID';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Booking" ALTER COLUMN "status" SET DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "public"."ReceptionistProfile" DROP COLUMN "shift",
ADD COLUMN     "defaultShift" "public"."Shift",
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "propertyId" TEXT;

-- CreateTable
CREATE TABLE "public"."ShiftAssignment" (
    "id" TEXT NOT NULL,
    "receptionistId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "shiftType" "public"."Shift" NOT NULL,
    "date" DATE NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BankAccount" (
    "id" TEXT NOT NULL,
    "adminKosId" TEXT NOT NULL,
    "bankCode" VARCHAR(10) NOT NULL,
    "bankName" VARCHAR(255) NOT NULL,
    "accountNumber" VARCHAR(50) NOT NULL,
    "accountName" VARCHAR(255) NOT NULL,
    "status" "public"."BankAccountStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payout" (
    "id" TEXT NOT NULL,
    "adminKosId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "source" "public"."PayoutSource" NOT NULL DEFAULT 'SALES',
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "rejectionReason" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayoutAttachment" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "fileUrl" VARCHAR(500) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileType" VARCHAR(50) NOT NULL,
    "publicId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftAssignment_receptionistId_idx" ON "public"."ShiftAssignment"("receptionistId");

-- CreateIndex
CREATE INDEX "ShiftAssignment_propertyId_idx" ON "public"."ShiftAssignment"("propertyId");

-- CreateIndex
CREATE INDEX "ShiftAssignment_date_idx" ON "public"."ShiftAssignment"("date");

-- CreateIndex
CREATE INDEX "ShiftAssignment_shiftType_idx" ON "public"."ShiftAssignment"("shiftType");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_receptionistId_date_shiftType_key" ON "public"."ShiftAssignment"("receptionistId", "date", "shiftType");

-- CreateIndex
CREATE INDEX "BankAccount_adminKosId_idx" ON "public"."BankAccount"("adminKosId");

-- CreateIndex
CREATE INDEX "BankAccount_status_idx" ON "public"."BankAccount"("status");

-- CreateIndex
CREATE INDEX "Payout_adminKosId_idx" ON "public"."Payout"("adminKosId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "public"."Payout"("status");

-- CreateIndex
CREATE INDEX "Payout_createdAt_idx" ON "public"."Payout"("createdAt");

-- CreateIndex
CREATE INDEX "PayoutAttachment_payoutId_idx" ON "public"."PayoutAttachment"("payoutId");

-- CreateIndex
CREATE INDEX "ReceptionistProfile_propertyId_idx" ON "public"."ReceptionistProfile"("propertyId");

-- CreateIndex
CREATE INDEX "ReceptionistProfile_userId_idx" ON "public"."ReceptionistProfile"("userId");

-- AddForeignKey
ALTER TABLE "public"."ReceptionistProfile" ADD CONSTRAINT "ReceptionistProfile_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_receptionistId_fkey" FOREIGN KEY ("receptionistId") REFERENCES "public"."ReceptionistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankAccount" ADD CONSTRAINT "BankAccount_adminKosId_fkey" FOREIGN KEY ("adminKosId") REFERENCES "public"."AdminKosProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankAccount" ADD CONSTRAINT "BankAccount_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_adminKosId_fkey" FOREIGN KEY ("adminKosId") REFERENCES "public"."AdminKosProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayoutAttachment" ADD CONSTRAINT "PayoutAttachment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "public"."Payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
