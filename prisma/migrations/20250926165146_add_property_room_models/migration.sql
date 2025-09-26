-- CreateEnum
CREATE TYPE "public"."PropertyType" AS ENUM ('MALE_ONLY', 'FEMALE_ONLY', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."ImageCategory" AS ENUM ('BUILDING_PHOTOS', 'SHARED_FACILITIES_PHOTOS', 'FLOOR_PLAN_PHOTOS', 'ROOM_PHOTOS', 'BATHROOM_PHOTOS');

-- CreateTable
CREATE TABLE "public"."Property" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "buildYear" INTEGER NOT NULL,
    "propertyType" "public"."PropertyType" NOT NULL,
    "description" TEXT NOT NULL,
    "roomTypes" JSONB NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "availableRooms" INTEGER NOT NULL DEFAULT 0,
    "provinceCode" VARCHAR(10) NOT NULL,
    "provinceName" VARCHAR(100) NOT NULL,
    "regencyCode" VARCHAR(10) NOT NULL,
    "regencyName" VARCHAR(100) NOT NULL,
    "districtCode" VARCHAR(10) NOT NULL,
    "districtName" VARCHAR(100) NOT NULL,
    "fullAddress" VARCHAR(500) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "facilities" JSONB NOT NULL,
    "rules" JSONB NOT NULL,
    "status" "public"."PropertyStatus" NOT NULL DEFAULT 'PENDING',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "category" "public"."ImageCategory" NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "publicId" VARCHAR(255),
    "caption" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Room" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomNumber" VARCHAR(50) NOT NULL,
    "floor" INTEGER NOT NULL,
    "roomType" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "size" VARCHAR(50),
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "dailyPrice" DECIMAL(10,2),
    "weeklyPrice" DECIMAL(10,2),
    "quarterlyPrice" DECIMAL(10,2),
    "yearlyPrice" DECIMAL(10,2),
    "hasDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositPercent" INTEGER,
    "facilities" JSONB NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoomImage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "category" "public"."ImageCategory" NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "publicId" VARCHAR(255),
    "caption" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "public"."Property"("status");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "public"."Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "public"."Property"("ownerId");

-- CreateIndex
CREATE INDEX "Property_provinceCode_regencyCode_districtCode_idx" ON "public"."Property"("provinceCode", "regencyCode", "districtCode");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_category_idx" ON "public"."PropertyImage"("propertyId", "category");

-- CreateIndex
CREATE INDEX "Room_propertyId_idx" ON "public"."Room"("propertyId");

-- CreateIndex
CREATE INDEX "Room_roomType_idx" ON "public"."Room"("roomType");

-- CreateIndex
CREATE INDEX "Room_isAvailable_idx" ON "public"."Room"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "Room_propertyId_roomNumber_key" ON "public"."Room"("propertyId", "roomNumber");

-- CreateIndex
CREATE INDEX "RoomImage_roomId_category_idx" ON "public"."RoomImage"("roomId", "category");

-- AddForeignKey
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomImage" ADD CONSTRAINT "RoomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
