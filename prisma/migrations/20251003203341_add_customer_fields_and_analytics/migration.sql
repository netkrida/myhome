-- CreateEnum
CREATE TYPE "public"."CustomerStatus" AS ENUM ('MAHASISWA', 'PEKERJA');

-- AlterTable
ALTER TABLE "public"."CustomerProfile" ADD COLUMN     "institutionName" VARCHAR(255),
ADD COLUMN     "status" "public"."CustomerStatus";

-- CreateTable
CREATE TABLE "public"."WebsiteVisitor" (
    "id" TEXT NOT NULL,
    "sessionId" VARCHAR(255) NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "device" VARCHAR(50),
    "browser" VARCHAR(50),
    "os" VARCHAR(50),
    "referrer" TEXT,
    "landingPage" VARCHAR(500) NOT NULL,
    "isReturning" BOOLEAN NOT NULL DEFAULT false,
    "visitDuration" INTEGER,
    "pageViewCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PageView" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" VARCHAR(255) NOT NULL,
    "page" VARCHAR(500) NOT NULL,
    "title" VARCHAR(255),
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteVisitor_sessionId_key" ON "public"."WebsiteVisitor"("sessionId");

-- CreateIndex
CREATE INDEX "WebsiteVisitor_sessionId_idx" ON "public"."WebsiteVisitor"("sessionId");

-- CreateIndex
CREATE INDEX "WebsiteVisitor_ipAddress_idx" ON "public"."WebsiteVisitor"("ipAddress");

-- CreateIndex
CREATE INDEX "WebsiteVisitor_createdAt_idx" ON "public"."WebsiteVisitor"("createdAt");

-- CreateIndex
CREATE INDEX "WebsiteVisitor_isReturning_idx" ON "public"."WebsiteVisitor"("isReturning");

-- CreateIndex
CREATE INDEX "PageView_visitorId_idx" ON "public"."PageView"("visitorId");

-- CreateIndex
CREATE INDEX "PageView_sessionId_idx" ON "public"."PageView"("sessionId");

-- CreateIndex
CREATE INDEX "PageView_page_idx" ON "public"."PageView"("page");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "public"."PageView"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."PageView" ADD CONSTRAINT "PageView_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "public"."WebsiteVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
