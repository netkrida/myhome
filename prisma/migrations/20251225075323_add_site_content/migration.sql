-- CreateTable
CREATE TABLE "public"."SiteContent" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_type_key" ON "public"."SiteContent"("type");

-- CreateIndex
CREATE INDEX "SiteContent_type_idx" ON "public"."SiteContent"("type");

-- CreateIndex
CREATE INDEX "SiteContent_isPublished_idx" ON "public"."SiteContent"("isPublished");

-- AddForeignKey
ALTER TABLE "public"."SiteContent" ADD CONSTRAINT "SiteContent_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
