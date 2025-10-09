-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "public"."Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_expiryTime_idx" ON "public"."Payment"("status", "expiryTime");

-- CreateIndex
CREATE INDEX "Payment_expiryTime_idx" ON "public"."Payment"("expiryTime");
