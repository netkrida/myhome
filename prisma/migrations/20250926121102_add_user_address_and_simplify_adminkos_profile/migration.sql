/*
  Warnings:

  - You are about to drop the column `businessAddress` on the `AdminKosProfile` table. All the data in the column will be lost.
  - You are about to drop the column `businessName` on the `AdminKosProfile` table. All the data in the column will be lost.
  - You are about to drop the column `businessPhone` on the `AdminKosProfile` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `AdminKosProfile` table. All the data in the column will be lost.
  - The `shift` column on the `ReceptionistProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `phoneNumber` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Favorite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KosProperty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PropertyImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PropertyReceptionist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PropertyRoomType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Shift" AS ENUM ('MORNING', 'EVENING', 'NIGHT');

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Favorite" DROP CONSTRAINT "Favorite_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Favorite" DROP CONSTRAINT "Favorite_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."KosProperty" DROP CONSTRAINT "KosProperty_adminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."KosProperty" DROP CONSTRAINT "KosProperty_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyImage" DROP CONSTRAINT "PropertyImage_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyReceptionist" DROP CONSTRAINT "PropertyReceptionist_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyReceptionist" DROP CONSTRAINT "PropertyReceptionist_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyRoomType" DROP CONSTRAINT "PropertyRoomType_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Room" DROP CONSTRAINT "Room_customTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Room" DROP CONSTRAINT "Room_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoomImage" DROP CONSTRAINT "RoomImage_roomId_fkey";

-- AlterTable
ALTER TABLE "public"."AdminKosProfile" DROP COLUMN "businessAddress",
DROP COLUMN "businessName",
DROP COLUMN "businessPhone",
DROP COLUMN "description";

-- AlterTable
ALTER TABLE "public"."ReceptionistProfile" DROP COLUMN "shift",
ADD COLUMN     "shift" "public"."Shift";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "address" TEXT,
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "phoneNumber" SET DATA TYPE VARCHAR(20);

-- DropTable
DROP TABLE "public"."Booking";

-- DropTable
DROP TABLE "public"."Favorite";

-- DropTable
DROP TABLE "public"."KosProperty";

-- DropTable
DROP TABLE "public"."PropertyImage";

-- DropTable
DROP TABLE "public"."PropertyReceptionist";

-- DropTable
DROP TABLE "public"."PropertyRoomType";

-- DropTable
DROP TABLE "public"."Room";

-- DropTable
DROP TABLE "public"."RoomImage";

-- DropEnum
DROP TYPE "public"."BookingStatus";

-- DropEnum
DROP TYPE "public"."FacilityCategory";

-- DropEnum
DROP TYPE "public"."ImageCategory";

-- DropEnum
DROP TYPE "public"."PropertyStatus";

-- DropEnum
DROP TYPE "public"."PropertyType";

-- DropEnum
DROP TYPE "public"."RoomType";
