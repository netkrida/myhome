-- CreateEnum
CREATE TYPE "public"."LedgerAccountType" AS ENUM ('INCOME', 'EXPENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LedgerRefType" AS ENUM ('PAYMENT', 'PAYOUT', 'MANUAL', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "public"."LedgerAccount" (
    "id" TEXT NOT NULL,
    "adminKosId" TEXT NOT NULL,
    "code" VARCHAR(30),
    "name" VARCHAR(100) NOT NULL,
    "type" "public"."LedgerAccountType" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LedgerEntry" (
    "id" TEXT NOT NULL,
    "adminKosId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "direction" VARCHAR(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(500),
    "refType" "public"."LedgerRefType" NOT NULL,
    "refId" VARCHAR(100),
    "propertyId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerAccount_adminKosId_type_idx" ON "public"."LedgerAccount"("adminKosId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_adminKosId_name_key" ON "public"."LedgerAccount"("adminKosId", "name");

-- CreateIndex
CREATE INDEX "LedgerEntry_adminKosId_direction_idx" ON "public"."LedgerEntry"("adminKosId", "direction");

-- CreateIndex
CREATE INDEX "LedgerEntry_adminKosId_date_idx" ON "public"."LedgerEntry"("adminKosId", "date");

-- CreateIndex
CREATE INDEX "LedgerEntry_refType_refId_idx" ON "public"."LedgerEntry"("refType", "refId");

-- AddForeignKey
ALTER TABLE "public"."LedgerAccount" ADD CONSTRAINT "LedgerAccount_adminKosId_fkey" FOREIGN KEY ("adminKosId") REFERENCES "public"."AdminKosProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LedgerEntry" ADD CONSTRAINT "LedgerEntry_adminKosId_fkey" FOREIGN KEY ("adminKosId") REFERENCES "public"."AdminKosProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."LedgerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
