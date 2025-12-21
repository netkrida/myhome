-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "discountAmount" DECIMAL(12,2),
ADD COLUMN     "discountNote" VARCHAR(255),
ADD COLUMN     "finalAmount" DECIMAL(12,2);
