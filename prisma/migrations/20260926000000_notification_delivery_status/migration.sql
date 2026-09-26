-- P0: track email delivery outcome on Notification rows (SENT/FAILED + error)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Notification' AND column_name='status') THEN
    ALTER TABLE "Notification" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SENT';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Notification' AND column_name='errorMessage') THEN
    ALTER TABLE "Notification" ADD COLUMN "errorMessage" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Notification' AND column_name='providerId') THEN
    ALTER TABLE "Notification" ADD COLUMN "providerId" TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Notification_status_idx" ON "Notification"("status");
CREATE INDEX IF NOT EXISTS "Notification_bookingId_idx" ON "Notification"("bookingId");
