-- CreateTable
CREATE TABLE "public"."PropertyStatusHistory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "fromStatus" "public"."PropertyStatus",
    "toStatus" "public"."PropertyStatus" NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyStatusHistory_propertyId_idx" ON "public"."PropertyStatusHistory"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyStatusHistory_toStatus_idx" ON "public"."PropertyStatusHistory"("toStatus");

-- CreateIndex
CREATE INDEX "PropertyStatusHistory_changedBy_idx" ON "public"."PropertyStatusHistory"("changedBy");

-- CreateIndex
CREATE INDEX "PropertyStatusHistory_createdAt_idx" ON "public"."PropertyStatusHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."PropertyStatusHistory" ADD CONSTRAINT "PropertyStatusHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyStatusHistory" ADD CONSTRAINT "PropertyStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
