-- CreateTable
CREATE TABLE "public"."RoomTypeImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomType" VARCHAR(100) NOT NULL,
    "category" "public"."ImageCategory" NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "publicId" VARCHAR(255),
    "caption" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomTypeImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomTypeImage_propertyId_roomType_idx" ON "public"."RoomTypeImage"("propertyId", "roomType");

-- CreateIndex
CREATE INDEX "RoomTypeImage_propertyId_roomType_category_idx" ON "public"."RoomTypeImage"("propertyId", "roomType", "category");

-- AddForeignKey
ALTER TABLE "public"."RoomTypeImage" ADD CONSTRAINT "RoomTypeImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
