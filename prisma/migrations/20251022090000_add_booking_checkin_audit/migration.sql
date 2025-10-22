-- Add booking check-in/out audit fields
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "checkedInBy" TEXT,
  ADD COLUMN IF NOT EXISTS "actualCheckInAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "checkedOutBy" TEXT,
  ADD COLUMN IF NOT EXISTS "actualCheckOutAt" TIMESTAMP(3);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "Booking_actualCheckInAt_idx" ON "Booking" ("actualCheckInAt");
CREATE INDEX IF NOT EXISTS "Booking_actualCheckOutAt_idx" ON "Booking" ("actualCheckOutAt");
CREATE INDEX IF NOT EXISTS "Booking_checkedInBy_idx" ON "Booking" ("checkedInBy");
CREATE INDEX IF NOT EXISTS "Booking_checkedOutBy_idx" ON "Booking" ("checkedOutBy");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_checkedInBy_fkey"
    FOREIGN KEY ("checkedInBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_checkedOutBy_fkey"
    FOREIGN KEY ("checkedOutBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
