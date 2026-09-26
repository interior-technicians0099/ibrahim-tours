import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { toOperatorBookingDto, findFinancialLeaks } from '../src/lib/serialization';

const REPO_ROOT = path.resolve(__dirname, '..');

function readRepo(rel: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
}

function listFilesRecursive(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFilesRecursive(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/** Fat booking shaped like a raw Prisma record incl. every sensitive field. */
function fatBooking() {
  return {
    id: 'b1',
    referenceCode: 'ZNZ-2026-LEAK01',
    serviceType: 'TOUR',
    tour: { title: 'Test Tour' },
    bookingDate: new Date('2026-01-05T00:00:00Z'),
    bookingTime: '08:30 AM',
    numAdults: 2,
    numChildren: 1,
    pickupLocation: 'Stone Town',
    dropoffLocation: null,
    customerName: 'Leak Test',
    customerEmail: 'leak@example.com',
    customerPhone: '+100',
    customerCountry: 'Italy',
    guideNotes: 'Preferred Guide Language: Italian',
    locale: 'it',
    specialRequests: 'Window seat',
    status: 'CONFIRMED',
    guideName: 'Guide Guy',
    guidePhone: '+200',
    // --- everything below must NEVER reach the operator ---
    quotedPriceCents: 10000,
    totalPriceCents: 10000,
    amountPaidCents: 10000,
    costCents: 7000,
    profitCents: 3000,
    commissionRate: 0.15,
    commissionAmountCents: 450,
    commissionStatus: 'CALCULATED',
    costOverrideNotes: 'secret',
    paymentStatus: 'PAID_IN_FULL',
    paymentMethod: 'MPESA',
    paymentDate: new Date(),
    paymentReference: 'REF123',
    operatorNotes: 'internal',
    payments: [{ id: 'p1', amountPaidCents: 10000, paymentMethod: 'MPESA' }],
    receipt: { receiptNumber: 'ZSH-2026-000001', verificationCode: 'ABC123' },
    inboxMessages: [{ id: 'm1', sentAt: new Date('2026-01-01T00:00:00Z'), readAt: null }],
  };
}

describe('P1 operator financial invisibility', () => {
  it('toOperatorBookingDto exposes service details only', () => {
    const dto: any = toOperatorBookingDto(fatBooking() as any);

    // Allowed service-details surface
    expect(dto.referenceCode).toBe('ZNZ-2026-LEAK01');
    expect(dto.serviceTitle).toBe('Test Tour');
    expect(dto.customerName).toBe('Leak Test');
    expect(dto.customerPhone).toBe('+100');
    expect(dto.preferredLanguage).toBe('Italian');
    expect(dto.status).toBe('CONFIRMED');
    expect(dto.unreadInbox).toBe(true);

    // Zero financial data
    expect(findFinancialLeaks(dto)).toEqual([]);

    // Tourist email is not part of the operator surface
    expect(dto).not.toHaveProperty('customerEmail');

    // Exact whitelist — any new key added to the DTO fails loudly here
    expect(Object.keys(dto).sort()).toEqual(
      [
        'id', 'referenceCode', 'serviceType', 'serviceTitle', 'bookingDate', 'bookingTime',
        'numAdults', 'numChildren', 'pickupLocation', 'dropoffLocation', 'customerName',
        'customerPhone', 'customerCountry', 'preferredLanguage', 'locale', 'specialRequests',
        'status', 'guideName', 'guidePhone', 'notifiedAt', 'unreadInbox',
      ].sort()
    );
  });

  it('findFinancialLeaks catches a raw booking record', () => {
    const leaks = findFinancialLeaks(fatBooking());
    expect(leaks.length).toBeGreaterThan(10);
    expect(leaks).toContain('$.amountPaidCents');
    expect(leaks).toContain('$.commissionRate');
    expect(leaks).toContain('$.payments[0].amountPaidCents');
  });

  it('operator UI + list/inbox APIs contain zero financial tokens', () => {
    const banned = [
      'quotedPriceCents', 'totalPriceCents', 'amountPaidCents', 'costCents', 'profitCents',
      'commissionRate', 'commissionAmountCents', 'commissionStatus', 'paymentStatus',
      'paymentMethod', 'paymentReference', 'operatorNotes', 'customerEmail',
    ];
    // NOTE: src/app/api/operator/bookings/[id]/status/route.ts is intentionally
    // excluded here — it legitimately reads payment state server-side for the
    // completion gate and is covered by the DTO-only response test below.
    const scanned = [
      ...listFilesRecursive(path.join(REPO_ROOT, 'src/app/operator')),
      path.join(REPO_ROOT, 'src/app/api/operator/bookings/route.ts'),
      ...listFilesRecursive(path.join(REPO_ROOT, 'src/app/api/operator/inbox')),
      path.join(REPO_ROOT, 'src/components/operator/OperatorPortalClient.tsx'),
    ];
    expect(scanned.length).toBeGreaterThan(0);
    for (const file of scanned) {
      const src = fs.readFileSync(file, 'utf8');
      for (const token of banned) {
        expect(
          new RegExp(`\\b${token}\\b`).test(src),
          `${path.relative(REPO_ROOT, file)} leaks "${token}"`
        ).toBe(false);
      }
      // No raw receipt/payment relation expansion in operator responses
      expect(/\b(receipt|payments)\s*:/.test(src), `${path.relative(REPO_ROOT, file)} embeds receipt/payments`).toBe(false);
    }
  });

  it('operator status route returns ONLY the serialized DTO', () => {
    const src = readRepo('src/app/api/operator/bookings/[id]/status/route.ts');
    expect(src).toContain('toOperatorBookingDto');
    expect(src).toContain('booking: toOperatorBookingDto(updatedBooking)');
    expect(src).not.toMatch(/booking:\s*(updatedBooking|booking)\b/);
    // Operators may only complete — no other transition is reachable
    expect(src).toContain('COMPLETED');
  });

  it('operator media routes stay super-admin only', () => {
    for (const rel of [
      'src/app/api/operator/media/upload/route.ts',
      'src/app/api/operator/media/[id]/route.ts',
    ]) {
      const src = readRepo(rel);
      expect(src).toContain('user.role !== Role.PLATFORM_ADMIN');
    }
  });
});
