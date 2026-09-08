import { PrismaClient, Role, BookingStatus, PaymentStatus, SettlementStatus, CommissionStatus } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://127.0.0.1:3000';

let adminCookie = '';
let operatorCookie = '';
let createdBookingIds = [];
let createdSettlementIds = [];

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function loginUser(email, password) {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.getSetCookie();
  const { csrfToken } = await csrfRes.json();

  const cookiesToForward = csrfCookies.map((c) => c.split(';')[0]).join('; ');

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookiesToForward,
    },
    body: new URLSearchParams({
      email,
      password,
      csrfToken,
      redirect: 'false',
    }),
    redirect: 'manual',
  });

  const sessionCookies = [...csrfCookies, ...loginRes.headers.getSetCookie()]
    .map((c) => c.split(';')[0])
    .join('; ');

  if (!sessionCookies.includes('authjs.session-token')) {
    throw new Error(`Failed to login as ${email}. Session cookies: ${sessionCookies}`);
  }

  return sessionCookies;
}

async function runTests() {
  console.log('🚀 ========================================================');
  console.log('🚀 RUNNING PHASE B4 COMMISSION & SETTLEMENT TEST SUITE');
  console.log('🚀 ========================================================\n');

  try {
    // Ensure mustChangePassword is false for test accounts
    await prisma.adminUser.updateMany({
      where: { email: { in: ['admin@ibrahimtours.co.tz', 'ibrahim@ibrahimtours.co.tz'] } },
      data: { mustChangePassword: false },
    });

    // Clean up any previous test settlements for clean test run
    await prisma.monthlySettlement.deleteMany({
      where: { operatorId: 'operator-ibrahim' },
    });

    // 0. Ensure operator exists
    let operator = await prisma.operatorProfile.findUnique({
      where: { id: 'operator-ibrahim' },
    });
    if (!operator) {
      operator = await prisma.operatorProfile.create({
        data: {
          id: 'operator-ibrahim',
          name: 'Ibrahim Mohamed',
          businessName: 'Ibrahim Tours Zanzibar',
          tagline: 'Authentic Spice Island Experiences',
          biography: 'Over 10 years guiding tourists across Unguja and Pemba.',
          phone: '+255777123456',
          whatsapp: '+255777123456',
          email: 'ibrahim@ibrahimtours.co.tz',
          paymentInstructions: 'Send M-Pesa to 0777123456 or Bank Transfer.',
        },
      });
    } else {
      await prisma.operatorProfile.update({
        where: { id: 'operator-ibrahim' },
        data: { commissionRate: null },
      });
    }

    // 1. Authenticate users
    console.log('🔑 [1] Authenticating Test Users...');
    adminCookie = await loginUser('admin@ibrahimtours.co.tz', 'AdminPass123!');
    assert(adminCookie.includes('authjs.session-token'), 'Platform Admin authenticated');

    operatorCookie = await loginUser('ibrahim@ibrahimtours.co.tz', 'IbrahimTour2026!');
    assert(operatorCookie.includes('authjs.session-token'), 'Operator Ibrahim authenticated');

    // 2. Pure Calculation & Flag Invariant Tests
    console.log('\n🧮 [2] Pure Commission Calculation & Flags...');
    const { calculateCommission } = await import('../src/lib/commission.ts');

    // Standard 15% rate on $100 profit
    const calc1 = calculateCommission(16000, 6000, 15);
    assert(calc1.profitCents === 10000, 'Standard profit is 10,000 cents ($100)');
    assert(calc1.commissionRate === 15, 'Commission rate is 15%');
    assert(calc1.commissionAmountCents === 1500, 'Commission is 1,500 cents ($15)');
    assert(calc1.status === CommissionStatus.CALCULATED, 'Status is CALCULATED');

    // Missing cost -> MISSING_COST
    const calc2 = calculateCommission(16000, null, 15);
    assert(calc2.profitCents === null, 'Missing cost yields profitCents = null');
    assert(calc2.commissionAmountCents === null, 'Missing cost yields commissionAmountCents = null');
    assert(calc2.status === CommissionStatus.MISSING_COST, 'Status is MISSING_COST');

    // Null rate -> PENDING_RATE
    const calc3 = calculateCommission(16000, 6000, null);
    assert(calc3.profitCents === 10000, 'Null rate still calculates profit');
    assert(calc3.commissionAmountCents === null, 'Null rate yields commissionAmountCents = null');
    assert(calc3.status === CommissionStatus.PENDING_RATE, 'Status is PENDING_RATE');

    // Fractional rate 12.5% on $50 profit
    const calc4 = calculateCommission(25000, 20000, 12.5);
    assert(calc4.profitCents === 5000, 'Fractional profit is 5,000 cents');
    assert(calc4.commissionAmountCents === 625, 'Commission on 5,000 cents at 12.5% is 625 cents');

    // 3. Platform Settings API (PLATFORM_ADMIN only)
    console.log('\n⚙️ [3] Platform Settings API (commission_rate)...');

    // Operator attempt to update rate should fail with 403
    const operatorPatchRes = await fetch(`${BASE_URL}/api/platform/settings/commission`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: operatorCookie,
      },
      body: JSON.stringify({ rate: 20 }),
    });
    assert(operatorPatchRes.status === 403, 'Operator PATCH commission rate rejected with 403 Forbidden');

    // Platform admin sets rate to 15.00%
    const adminPatchRes = await fetch(`${BASE_URL}/api/platform/settings/commission`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        rate: 15.00,
        description: 'Standard 15% platform commission on tours',
      }),
    });
    assert(adminPatchRes.status === 200, 'Platform Admin PATCH commission rate returns 200 OK');
    const adminPatchData = await adminPatchRes.json();
    assert(adminPatchData.success === true, 'Settings response success is true');
    assert(adminPatchData.commissionRate === 15, 'Updated commission rate is 15%');
    assert(adminPatchData.status === 'CONFIGURED', 'Setting status is CONFIGURED');

    // Verify AuditLog entry
    const auditSetting = await prisma.auditLog.findFirst({
      where: {
        action: 'UPDATE_COMMISSION_SETTING',
        entityType: 'Settings',
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(auditSetting !== null, 'AuditLog created for UPDATE_COMMISSION_SETTING');
    assert(auditSetting.details?.newRate === 15, 'AuditLog recorded newRate: 15');
    assert(typeof auditSetting.details?.effectiveDate === 'string', 'AuditLog recorded effectiveDate');

    // 4. Booking Completion with Snapshot Rate
    console.log('\n🏁 [4] Completing a Booking with Snapshot Rate (15%)...');
    const booking1 = await prisma.booking.create({
      data: {
        referenceCode: 'ZNZ-2026-B4TEST01',
        serviceType: 'TOUR',
        operatorId: 'operator-ibrahim',
        customerName: 'Alice Tourer',
        customerEmail: 'alice@example.com',
        customerPhone: '+123456789',
        bookingDate: new Date('2026-09-10T10:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID_IN_FULL,
        amountPaidCents: 16000,
        totalPriceCents: 16000,
        costCents: 6000,
        locale: 'en',
      },
    });
    createdBookingIds.push(booking1.id);

    // Complete booking via operator API
    const completeRes1 = await fetch(`${BASE_URL}/api/operator/bookings/${booking1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: operatorCookie,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert(completeRes1.status === 200, 'Booking completed successfully (200 OK)');

    const updatedBooking1 = await prisma.booking.findUnique({ where: { id: booking1.id } });
    assert(updatedBooking1.status === BookingStatus.COMPLETED, 'Booking status updated to COMPLETED');
    assert(updatedBooking1.profitCents === 10000, 'profitCents snapshotted at 10,000 cents');
    assert(Number(updatedBooking1.commissionRate) === 0.15, 'commissionRate snapshotted at 0.1500 (15%)');
    assert(updatedBooking1.commissionAmountCents === 1500, 'commissionAmountCents snapshotted at 1,500 cents');
    assert(updatedBooking1.commissionStatus === CommissionStatus.CALCULATED, 'commissionStatus is CALCULATED');

    // 5. Pending Rate Handling
    console.log('\n⏳ [5] Completing a Booking with Rate = NULL (PENDING_RATE)...');
    // Set global rate to null
    await fetch(`${BASE_URL}/api/platform/settings/commission`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ rate: null }),
    });

    const booking2 = await prisma.booking.create({
      data: {
        referenceCode: 'ZNZ-2026-B4TEST02',
        serviceType: 'TOUR',
        operatorId: 'operator-ibrahim',
        customerName: 'Bob Pending',
        customerEmail: 'bob@example.com',
        customerPhone: '+198765432',
        bookingDate: new Date('2026-09-12T10:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID_IN_FULL,
        amountPaidCents: 12000,
        totalPriceCents: 12000,
        costCents: 5000,
        locale: 'en',
      },
    });
    createdBookingIds.push(booking2.id);

    const completeRes2 = await fetch(`${BASE_URL}/api/operator/bookings/${booking2.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: operatorCookie,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert(completeRes2.status === 200, 'Booking 2 completed with null rate (200 OK)');

    const updatedBooking2 = await prisma.booking.findUnique({ where: { id: booking2.id } });
    assert(updatedBooking2.profitCents === 7000, 'profitCents is 7,000 cents');
    assert(updatedBooking2.commissionRate === null, 'commissionRate is null');
    assert(updatedBooking2.commissionAmountCents === null, 'commissionAmountCents is null');
    assert(updatedBooking2.commissionStatus === CommissionStatus.PENDING_RATE, 'commissionStatus is PENDING_RATE');

    // 6. Missing Cost Handling
    console.log('\n⚠️ [6] Completing a Booking with costCents = NULL (MISSING_COST)...');
    const booking3 = await prisma.booking.create({
      data: {
        referenceCode: 'ZNZ-2026-B4TEST03',
        serviceType: 'TOUR',
        operatorId: 'operator-ibrahim',
        customerName: 'Charlie NoCost',
        customerEmail: 'charlie@example.com',
        customerPhone: '+1555444333',
        bookingDate: new Date('2026-09-15T10:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID_IN_FULL,
        amountPaidCents: 20000,
        totalPriceCents: 20000,
        costCents: null, // MISSING COST!
        locale: 'en',
      },
    });
    createdBookingIds.push(booking3.id);

    const completeRes3 = await fetch(`${BASE_URL}/api/operator/bookings/${booking3.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: operatorCookie,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert(completeRes3.status === 200, 'Booking 3 completed with missing cost (200 OK)');

    const updatedBooking3 = await prisma.booking.findUnique({ where: { id: booking3.id } });
    assert(updatedBooking3.profitCents === null, 'profitCents is null due to missing cost');
    assert(updatedBooking3.commissionStatus === CommissionStatus.MISSING_COST, 'commissionStatus is MISSING_COST');

    // 7. Booking Cost Override API
    console.log('\n🔧 [7] Admin Cost Override API (PATCH /api/platform/bookings/[id]/cost)...');
    const costOverrideRes = await fetch(`${BASE_URL}/api/platform/bookings/${booking3.id}/cost`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        costCents: 8000,
        notes: 'Supplied operator cost for custom island package',
      }),
    });
    assert(costOverrideRes.status === 200, 'Cost override returns 200 OK');
    const costOverrideData = await costOverrideRes.json();
    assert(costOverrideData.success === true, 'Cost override response success is true');
    assert(costOverrideData.booking.costCents === 8000, 'Updated costCents is 8000');
    assert(costOverrideData.booking.profitCents === 12000, 'profitCents recomputed as 12,000 cents');
    assert(costOverrideData.booking.commissionStatus === CommissionStatus.PENDING_RATE, 'Transformed from MISSING_COST to PENDING_RATE');

    // Verify AuditLog for cost override
    const auditCost = await prisma.auditLog.findFirst({
      where: {
        action: 'UPDATE_BOOKING_COST',
        entityId: booking3.id,
      },
    });
    assert(auditCost !== null, 'AuditLog created for UPDATE_BOOKING_COST');
    assert(auditCost.details?.newCostCents === 8000, 'AuditLog recorded newCostCents: 8000');

    // 8. Recalculation API & Setting Rate Back to 15%
    console.log('\n🔄 [8] Setting Rate Back to 15% & Running Recalculation API...');
    await fetch(`${BASE_URL}/api/platform/settings/commission`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ rate: 15.00 }),
    });

    const recalcRes = await fetch(`${BASE_URL}/api/platform/commission/recalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ operatorId: 'operator-ibrahim' }),
    });
    assert(recalcRes.status === 200, 'Recalculation API returns 200 OK');
    const recalcData = await recalcRes.json();
    assert(recalcData.success === true, 'Recalculation success is true');
    assert(recalcData.recalculatedCount >= 2, `Recalculated at least 2 bookings (got ${recalcData.recalculatedCount})`);

    // Verify booking2 and booking3 are now CALCULATED with 15% rate
    const recheckedBooking2 = await prisma.booking.findUnique({ where: { id: booking2.id } });
    assert(recheckedBooking2.commissionStatus === CommissionStatus.CALCULATED, 'Booking 2 updated to CALCULATED');
    assert(recheckedBooking2.commissionAmountCents === 1050, 'Booking 2 commission is 15% of 7000 = 1050 cents');

    const recheckedBooking3 = await prisma.booking.findUnique({ where: { id: booking3.id } });
    assert(recheckedBooking3.commissionStatus === CommissionStatus.CALCULATED, 'Booking 3 updated to CALCULATED');
    assert(recheckedBooking3.commissionAmountCents === 1800, 'Booking 3 commission is 15% of 12000 = 1800 cents');

    // 9. Monthly Settlement Service & Service Date Bucketing
    console.log('\n📊 [9] Monthly Settlement Rollup & Service Date Bucketing (2026-09)...');

    // Add a booking in August 2026 (service date outside Sept) -> should be excluded from Sept
    const augustBooking = await prisma.booking.create({
      data: {
        referenceCode: 'ZNZ-2026-AUGTEST',
        serviceType: 'TOUR',
        operatorId: 'operator-ibrahim',
        customerName: 'August Guest',
        customerEmail: 'august@example.com',
        customerPhone: '+1999888777',
        bookingDate: new Date('2026-08-25T10:00:00.000Z'), // AUGUST!
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID_IN_FULL,
        amountPaidCents: 10000,
        totalPriceCents: 10000,
        costCents: 4000,
        profitCents: 6000,
        commissionRate: 0.15,
        commissionAmountCents: 900,
        commissionStatus: CommissionStatus.CALCULATED,
        locale: 'en',
      },
    });
    createdBookingIds.push(augustBooking.id);

    // Add a cancelled booking in Sept 2026 -> should be excluded
    const cancelledSeptBooking = await prisma.booking.create({
      data: {
        referenceCode: 'ZNZ-2026-CANCTEST',
        serviceType: 'TOUR',
        operatorId: 'operator-ibrahim',
        customerName: 'Cancelled Guest',
        customerEmail: 'cancelled@example.com',
        customerPhone: '+1777666555',
        bookingDate: new Date('2026-09-18T10:00:00.000Z'),
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.NOT_PAID,
        amountPaidCents: 0,
        totalPriceCents: 15000,
        costCents: 5000,
        locale: 'en',
      },
    });
    createdBookingIds.push(cancelledSeptBooking.id);

    // Run settlement for September 2026
    const { runMonthlySettlementForOperator } = await import('../src/lib/services/settlement-service.ts');
    const settlementSummary = await runMonthlySettlementForOperator('operator-ibrahim', '2026-09', 'system-admin');
    createdSettlementIds.push(settlementSummary.id);

    assert(settlementSummary.month === '2026-09', 'Settlement month is 2026-09');
    assert(settlementSummary.totalBookings === 3, `Settlement totalBookings is 3 (got ${settlementSummary.totalBookings})`);
    
    // Expected sums for bookings 1, 2, 3:
    // Revenue: 16000 + 12000 + 20000 = 48000
    // Cost: 6000 + 5000 + 8000 = 19000
    // Profit: 10000 + 7000 + 12000 = 29000
    // Commission: 1500 + 1050 + 1800 = 4350
    assert(settlementSummary.totalRevenueCents === 48000, `Total revenue is 48,000 cents ($480) (got ${settlementSummary.totalRevenueCents})`);
    assert(settlementSummary.totalProfitCents === 29000, `Total profit is 29,000 cents ($290) (got ${settlementSummary.totalProfitCents})`);
    assert(settlementSummary.commissionDueCents === 4350, `Commission due is 4,350 cents ($43.50) (got ${settlementSummary.commissionDueCents})`);
    assert(settlementSummary.status === SettlementStatus.PENDING, 'Settlement initial status is PENDING');

    // Verify MonthlySettlement row in database
    const dbSettlement = await prisma.monthlySettlement.findUnique({
      where: {
        operatorId_month: {
          operatorId: 'operator-ibrahim',
          month: '2026-09',
        },
      },
    });
    assert(dbSettlement !== null, 'MonthlySettlement record exists in database');
    assert(Number(dbSettlement.totalBookings) === 3, 'DB settlement totalBookings is 3');
    assert(Number(dbSettlement.totalRevenueCents) === 48000, 'DB totalRevenueCents is 48000');
    assert(Number(dbSettlement.commissionDueCents) === 4350, 'DB commissionDueCents is 4350');

    // Verify AuditLog row for settlement generation
    const auditSettlement = await prisma.auditLog.findFirst({
      where: {
        action: 'GENERATE_MONTHLY_SETTLEMENT',
        entityId: dbSettlement.id,
      },
    });
    assert(auditSettlement !== null, 'AuditLog entry created for GENERATE_MONTHLY_SETTLEMENT');

    // Verify Notifications created for PLATFORM_ADMIN and OPERATOR
    const notifications = await prisma.notification.findMany({
      where: { type: 'SETTLEMENT_STATEMENT_READY' },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    assert(notifications.length >= 2, 'Settlement statement notifications generated for both recipients');

    // 10. Settlement Lifecycle Transitions
    console.log('\n🔄 [10] Settlement Lifecycle Transitions (PENDING -> SETTLED -> PAID)...');
    
    // PENDING -> SETTLED
    const settleRes = await fetch(`${BASE_URL}/api/platform/settlements/${dbSettlement.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        status: 'SETTLED',
        notes: 'Numbers reconciled and confirmed with Ibrahim via phone call',
      }),
    });
    assert(settleRes.status === 200, 'Transition to SETTLED returns 200 OK');
    const settledData = await settleRes.json();
    assert(settledData.settlement.status === 'SETTLED', 'Settlement status is now SETTLED');
    assert(settledData.settlement.settledAt !== null, 'settledAt timestamp is set');

    // SETTLED -> PAID
    const paidRes = await fetch(`${BASE_URL}/api/platform/settlements/${dbSettlement.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        status: 'PAID',
        notes: 'Commission paid via M-Pesa transfer reference MP2026-9912',
      }),
    });
    assert(paidRes.status === 200, 'Transition to PAID returns 200 OK');
    const paidData = await paidRes.json();
    assert(paidData.settlement.status === 'PAID', 'Settlement status is now PAID');

    // Invalid transition: PAID -> PENDING should be rejected
    const invalidRes = await fetch(`${BASE_URL}/api/platform/settlements/${dbSettlement.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'PENDING' }),
    });
    assert(invalidRes.status === 400, 'Invalid transition (PAID -> PENDING) rejected with 400 Bad Request');

    // 11. Vercel Cron Route Test
    console.log('\n⏰ [11] Testing Vercel Cron Route (/api/cron/monthly-settlement)...');
    const cronRes = await fetch(`${BASE_URL}/api/cron/monthly-settlement?secret=local-test`);
    assert(cronRes.status === 200, 'Cron route returns 200 OK');
    const cronData = await cronRes.json();
    assert(cronData.success === true, 'Cron execution reports success: true');
    assert(typeof cronData.month === 'string', `Cron resolved target month (${cronData.month})`);
    assert(Array.isArray(cronData.settlements), 'Cron returned settlements array');

    console.log('\n========================================');
    console.log('FINAL RESULTS: ALL PHASE B4 TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    console.log('🧹 Cleaning up test artifacts from database...');
    if (createdBookingIds.length > 0) {
      await prisma.booking.deleteMany({
        where: { id: { in: createdBookingIds } },
      });
    }
    if (createdSettlementIds.length > 0) {
      await prisma.monthlySettlement.deleteMany({
        where: { id: { in: createdSettlementIds } },
      });
    }
    await prisma.$disconnect();
    console.log('✨ Cleanup complete.');
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN TERMINATED WITH ERROR:', err);
  process.exit(1);
});
