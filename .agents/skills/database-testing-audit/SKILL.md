---
name: database-testing-audit
description: >-
  Systematic workflows for database verification, automated schema testing,
  constraint validation, seed assertion, and audit logging.
  Use when verifying business rules like booking confirmation gating, testing transaction isolation, and preventing regressions.
---

# Database Testing, Verification & Audit Skill

This skill guides automated testing, constraint verification, and audit trail validation for relational data models in Prisma and PostgreSQL.

---

## 1. Automated Schema & Invariant Testing

### Testing the Booking Confirmation Invariant Gate
Assert that attempting to mark a booking as `CONFIRMED` without `PAID_IN_FULL` fails immediately at both the application layer and the database layer:

```typescript
// tests/booking-integrity.test.ts
import { describe, it, expect } from 'vitest'; // or jest
import { prisma } from '@/lib/prisma';
import { BookingStatus, PaymentStatus, ServiceType } from '@prisma/client';

describe('Booking Integrity & Payment Gating', () => {
  it('should reject CONFIRMED status when paymentStatus is PENDING at DB level', async () => {
    await expect(
      prisma.booking.create({
        data: {
          referenceCode: 'TEST-INV-001',
          serviceType: ServiceType.TOUR,
          customerName: 'Test Tourist',
          customerEmail: 'test@example.com',
          customerPhone: '+255700000000',
          bookingDate: new Date(),
          status: BookingStatus.CONFIRMED, // Attempt to confirm
          paymentStatus: PaymentStatus.PENDING, // Without payment!
        },
      })
    ).rejects.toThrow(); // PostgreSQL constraint chk_booking_confirmed_paid violation
  });

  it('should allow CONFIRMED status when paymentStatus is PAID_IN_FULL', async () => {
    const booking = await prisma.booking.create({
      data: {
        referenceCode: 'TEST-INV-002',
        serviceType: ServiceType.TOUR,
        customerName: 'Paid Tourist',
        customerEmail: 'paid@example.com',
        customerPhone: '+255700000000',
        bookingDate: new Date(),
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID_IN_FULL,
        amountPaidCents: 16000,
        totalPriceCents: 16000,
      },
    });

    expect(booking.status).toBe(BookingStatus.CONFIRMED);
    expect(booking.paymentStatus).toBe(PaymentStatus.PAID_IN_FULL);
  });
});
```

---

## 2. Seed Verification Checklist

After running `npx prisma db seed`, run automated verification assertions:
1. `AdminUser` count >= 2 (1 `PLATFORM_ADMIN`, 1 `OPERATOR`).
2. `OperatorProfile` exists with ID `operator-ibrahim` and valid phone/WhatsApp.
3. `TourCategory` count = 6.
4. `Tour` count = 14 (all active, starting prices in integer cents, private costs populated).
5. `TransportService` has 12 associated `Route` records with 4 pricing tiers.
6. `Vehicle` count = 3.
7. `Settings.commission_rate` is `null` (ready for admin configuration).
8. Verify DB check constraint `chk_booking_confirmed_paid` exists in `pg_constraint`.
