import { PrismaClient, BookingStatus, PaymentStatus, SettlementStatus, CommissionStatus } from '@prisma/client';
import { runMonthlySettlementForOperator, updateSettlementStatus } from '../src/lib/services/settlement-service.ts';

const prisma = new PrismaClient();

async function runSettlementAudit() {
  console.log('--- TESTING MONTHLY SETTLEMENTS & AUDIT LOGGING ---');
  
  const testMonth = '2026-10';
  const operatorId = 'operator-ibrahim';
  
  // Clean up any existing bookings in test month
  await prisma.booking.deleteMany({
    where: {
      operatorId,
      bookingDate: {
        gte: new Date('2026-10-01T00:00:00Z'),
        lt: new Date('2026-11-01T00:00:00Z'),
      },
    },
  });
  await prisma.monthlySettlement.deleteMany({
    where: { operatorId, month: testMonth },
  });

  // Ensure global commission rate is set to 15%
  await prisma.settings.upsert({
    where: { key: 'commission_rate' },
    update: { value: 15 },
    create: { key: 'commission_rate', value: 15, description: 'Platform commission %' },
  });

  // Create Booking 1: Mnemba Single ($158, cost $128, profit $30, commission $4.50)
  const b1 = await prisma.booking.create({
    data: {
      referenceCode: 'ZNZ-2026-TEST01',
      serviceType: 'TOUR',
      tier: 'single',
      operatorId,
      customerName: 'Settlement Test Tourist 1',
      customerEmail: 't1@example.com',
      customerPhone: '+255777000001',
      bookingDate: new Date('2026-10-05T09:00:00Z'),
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID_IN_FULL,
      totalPriceCents: 15800,
      quotedPriceCents: 15800,
      amountPaidCents: 15800,
      costCents: 12800,
      profitCents: 3000,
      commissionRate: 0.15,
      commissionAmountCents: 450,
      commissionStatus: CommissionStatus.CALCULATED,
    },
  });

  // Create Booking 2: Safari Blue Couple ($230, cost $190, profit $40, commission $6.00)
  const b2 = await prisma.booking.create({
    data: {
      referenceCode: 'ZNZ-2026-TEST02',
      serviceType: 'TOUR',
      tier: 'couple',
      operatorId,
      customerName: 'Settlement Test Tourist 2',
      customerEmail: 't2@example.com',
      customerPhone: '+255777000002',
      bookingDate: new Date('2026-10-12T08:30:00Z'),
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID_IN_FULL,
      totalPriceCents: 23000,
      quotedPriceCents: 23000,
      amountPaidCents: 23000,
      costCents: 19000,
      profitCents: 4000,
      commissionRate: 0.15,
      commissionAmountCents: 600,
      commissionStatus: CommissionStatus.CALCULATED,
    },
  });

  // 1. Run Monthly Settlement for 2026-10
  const summary = await runMonthlySettlementForOperator(operatorId, testMonth);
  console.log('Generated Settlement Summary:', summary);

  // Expected totals:
  // totalBookings = 2
  // totalRevenue = $158 + $230 = $388 (38,800 cents)
  // totalProfit = $30 + $40 = $70 (7,000 cents)
  // commissionDue = $4.50 + $6.00 = $10.50 (1,050 cents)
  if (summary.totalBookings !== 2) throw new Error(`Expected 2 bookings, got ${summary.totalBookings}`);
  if (summary.totalRevenueCents !== 38800) throw new Error(`Expected 38800 rev cents, got ${summary.totalRevenueCents}`);
  if (summary.totalProfitCents !== 7000) throw new Error(`Expected 7000 profit cents, got ${summary.totalProfitCents}`);
  if (summary.commissionDueCents !== 1050) throw new Error(`Expected 1050 commission cents, got ${summary.commissionDueCents}`);
  if (summary.status !== 'PENDING') throw new Error(`Expected status PENDING, got ${summary.status}`);
  console.log('✅ Settlement generation and financial totals verified: Revenue $388.00, Profit $70.00, Commission Due $10.50');

  // Fetch admin user ID for audit logging
  const admin = await prisma.adminUser.findFirst({ where: { role: 'PLATFORM_ADMIN' } });

  // 2. Transition PENDING -> SETTLED
  const settlementRecord = await prisma.monthlySettlement.findUnique({
    where: { operatorId_month: { operatorId, month: testMonth } },
  });
  const settled = await updateSettlementStatus(settlementRecord.id, SettlementStatus.SETTLED, admin.id, 'Approved after review');
  if (settled.status !== 'SETTLED') throw new Error(`Expected SETTLED, got ${settled.status}`);
  console.log('✅ Transition to SETTLED successful');

  // 3. Transition SETTLED -> PAID
  const paid = await updateSettlementStatus(settlementRecord.id, SettlementStatus.PAID, admin.id, 'Wire transfer completed');
  if (paid.status !== 'PAID') throw new Error(`Expected PAID, got ${paid.status}`);
  console.log('✅ Transition to PAID successful');

  // 4. Verify Audit Logs for transitions
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'MonthlySettlement', entityId: settlementRecord.id },
  });
  if (auditLogs.length < 2) throw new Error(`Expected at least 2 audit logs, found ${auditLogs.length}`);
  console.log(`✅ AuditLog recorded ${auditLogs.length} state transitions`);

  // Clean up test data
  await prisma.auditLog.deleteMany({ where: { entityId: settlementRecord.id } });
  await prisma.monthlySettlement.delete({ where: { id: settlementRecord.id } });
  await prisma.booking.deleteMany({ where: { id: { in: [b1.id, b2.id] } } });

  console.log('ALL SETTLEMENT AUDIT CHECKS PASSED ✅');
  await prisma.$disconnect();
}

runSettlementAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
