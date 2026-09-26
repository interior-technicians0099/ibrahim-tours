-- P1: OperatorInbox (super-admin → operator assignment feed)
CREATE TABLE IF NOT EXISTS "OperatorInbox" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentById" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "OperatorInbox_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperatorInbox_bookingId_fkey') THEN
    ALTER TABLE "OperatorInbox" ADD CONSTRAINT "OperatorInbox_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperatorInbox_sentById_fkey') THEN
    ALTER TABLE "OperatorInbox" ADD CONSTRAINT "OperatorInbox_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "OperatorInbox_bookingId_idx" ON "OperatorInbox"("bookingId");
CREATE INDEX IF NOT EXISTS "OperatorInbox_sentAt_idx" ON "OperatorInbox"("sentAt");

-- P1: PaymentMethodConfig (super-admin checkout method settings)
CREATE TABLE IF NOT EXISTS "PaymentMethodConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethodConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentMethodConfig_code_key" ON "PaymentMethodConfig"("code");
