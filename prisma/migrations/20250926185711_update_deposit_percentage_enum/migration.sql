/*
  Warnings:

  - You are about to drop the column `depositPercent` on the `Room` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."DepositPercentage" AS ENUM ('TEN_PERCENT', 'TWENTY_PERCENT', 'THIRTY_PERCENT', 'FORTY_PERCENT', 'FIFTY_PERCENT');

-- AlterTable
ALTER TABLE "public"."Room" DROP COLUMN "depositPercent",
ADD COLUMN     "depositPercentage" "public"."DepositPercentage";
