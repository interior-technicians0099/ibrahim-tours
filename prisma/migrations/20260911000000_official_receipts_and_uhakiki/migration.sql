-- CreateTable: Receipt
CREATE TABLE IF NOT EXISTS "Receipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentReference" TEXT,
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- Add checkedIn fields to Booking table if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='checkedInAt') THEN
    ALTER TABLE "Booking" ADD COLUMN "checkedInAt" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='checkedInById') THEN
    ALTER TABLE "Booking" ADD COLUMN "checkedInById" TEXT;
  END IF;
END $$;

-- CreateIndex: unique receiptNumber
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex: unique verificationCode
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_verificationCode_key" ON "Receipt"("verificationCode");

-- CreateIndex: unique bookingId
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_bookingId_key" ON "Receipt"("bookingId");

-- Foreign key: Receipt -> Booking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Receipt_bookingId_fkey'
  ) THEN
    ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Foreign key: Receipt -> AdminUser (issuedById)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Receipt_issuedById_fkey'
  ) THEN
    ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_issuedById_fkey" 
    FOREIGN KEY ("issuedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Foreign key: Booking -> AdminUser (checkedInById)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Booking_checkedInById_fkey'
  ) THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_checkedInById_fkey" 
    FOREIGN KEY ("checkedInById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
