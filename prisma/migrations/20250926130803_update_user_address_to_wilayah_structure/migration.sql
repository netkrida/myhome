/*
  Warnings:

  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "address",
ADD COLUMN     "districtCode" VARCHAR(10),
ADD COLUMN     "districtName" VARCHAR(100),
ADD COLUMN     "provinceCode" VARCHAR(10),
ADD COLUMN     "provinceName" VARCHAR(100),
ADD COLUMN     "regencyCode" VARCHAR(10),
ADD COLUMN     "regencyName" VARCHAR(100),
ADD COLUMN     "streetAddress" VARCHAR(500);
