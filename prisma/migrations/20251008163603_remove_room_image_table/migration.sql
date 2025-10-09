/*
  Warnings:

  - You are about to drop the `RoomImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."RoomImage" DROP CONSTRAINT "RoomImage_roomId_fkey";

-- DropTable
DROP TABLE "public"."RoomImage";
