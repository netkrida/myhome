/*
  Warnings:

  - You are about to drop the column `facilities` on the `KosProperty` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Room` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."FacilityCategory" AS ENUM ('PROPERTY', 'ROOM', 'BATHROOM', 'PARKING');

-- CreateEnum
CREATE TYPE "public"."ImageCategory" AS ENUM ('BUILDING_PHOTOS', 'SHARED_FACILITIES_PHOTOS', 'ROOM_PHOTOS', 'BATHROOM_PHOTOS');

-- DropIndex
DROP INDEX "public"."Room_type_idx";

-- AlterTable
ALTER TABLE "public"."KosProperty" DROP COLUMN "facilities",
ADD COLUMN     "addressNotes" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "availableRooms" INTEGER,
ADD COLUMN     "baseDailyPrice" DECIMAL(65,30),
ADD COLUMN     "baseMonthlyPrice" DECIMAL(65,30),
ADD COLUMN     "baseWeeklyPrice" DECIMAL(65,30),
ADD COLUMN     "bathroomFacilities" TEXT[],
ADD COLUMN     "city" TEXT,
ADD COLUMN     "customRoomSize" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "downPaymentPercent" INTEGER,
ADD COLUMN     "hasMinimumDuration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasMultipleRoomTypes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minimumDuration" TEXT,
ADD COLUMN     "parkingFacilities" TEXT[],
ADD COLUMN     "propertyFacilities" TEXT[],
ADD COLUMN     "province" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "requiresDownPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roomFacilities" TEXT[],
ADD COLUMN     "roomSizeOptions" TEXT[],
ADD COLUMN     "status" "public"."PropertyStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalRooms" INTEGER,
ADD COLUMN     "yearBuilt" INTEGER;

-- AlterTable
ALTER TABLE "public"."Room" DROP COLUMN "type",
ADD COLUMN     "customTypeId" TEXT,
ADD COLUMN     "floor" TEXT,
ADD COLUMN     "isOccupied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "standardType" "public"."RoomType",
ADD COLUMN     "weeklyPrice" DECIMAL(65,30),
ALTER COLUMN "monthlyPrice" DROP NOT NULL,
ALTER COLUMN "size" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "public"."PropertyRoomType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(65,30),
    "dailyPrice" DECIMAL(65,30),
    "weeklyPrice" DECIMAL(65,30),
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyRoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "category" "public"."ImageCategory" NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoomImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "category" "public"."ImageCategory" NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyRoomType_propertyId_idx" ON "public"."PropertyRoomType"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyRoomType_propertyId_name_key" ON "public"."PropertyRoomType"("propertyId", "name");

-- CreateIndex
CREATE INDEX "Favorite_customerId_idx" ON "public"."Favorite"("customerId");

-- CreateIndex
CREATE INDEX "Favorite_propertyId_idx" ON "public"."Favorite"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_customerId_propertyId_key" ON "public"."Favorite"("customerId", "propertyId");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_idx" ON "public"."PropertyImage"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyImage_category_idx" ON "public"."PropertyImage"("category");

-- CreateIndex
CREATE INDEX "RoomImage_roomId_idx" ON "public"."RoomImage"("roomId");

-- CreateIndex
CREATE INDEX "RoomImage_category_idx" ON "public"."RoomImage"("category");

-- CreateIndex
CREATE INDEX "KosProperty_status_idx" ON "public"."KosProperty"("status");

-- CreateIndex
CREATE INDEX "Room_standardType_idx" ON "public"."Room"("standardType");

-- CreateIndex
CREATE INDEX "Room_customTypeId_idx" ON "public"."Room"("customTypeId");

-- CreateIndex
CREATE INDEX "Room_isOccupied_idx" ON "public"."Room"("isOccupied");

-- AddForeignKey
ALTER TABLE "public"."KosProperty" ADD CONSTRAINT "KosProperty_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyRoomType" ADD CONSTRAINT "PropertyRoomType_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."KosProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_customTypeId_fkey" FOREIGN KEY ("customTypeId") REFERENCES "public"."PropertyRoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."KosProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."KosProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomImage" ADD CONSTRAINT "RoomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
