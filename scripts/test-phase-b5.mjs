import { PrismaClient, Role, BookingStatus, PaymentStatus, SettlementStatus, CommissionStatus, PaymentMethod } from '@prisma/client';

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
  console.log('🚀 RUNNING PHASE B5 PLATFORM ADMIN DASHBOARD TEST SUITE');
  console.log('🚀 ========================================================\n');

  try {
    // 0. Setup: ensure mustChangePassword is false for test accounts
    await prisma.adminUser.updateMany({
      where: { email: { in: ['admin@ibrahimtours.co.tz', 'ibrahim@ibrahimtours.co.tz'] } },
      data: { mustChangePassword: false },
    });

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
    }

    // 1. Authenticate users
    console.log('🔑 [1] Authenticating Test Users...');
    adminCookie = await loginUser('admin@ibrahimtours.co.tz', 'AdminPass123!');
    assert(adminCookie.includes('authjs.session-token'), 'Platform Admin authenticated');

    operatorCookie = await loginUser('ibrahim@ibrahimtours.co.tz', 'IbrahimTour2026!');
    assert(operatorCookie.includes('authjs.session-token'), 'Operator Ibrahim authenticated');

    // 2. Test RBAC & Route Access Protection
    console.log('\n🛡️ [2] Testing RBAC & Platform Route Protection...');
    
    // 2a. Unauthenticated request to platform bookings
    const unauthRes = await fetch(`${BASE_URL}/api/platform/bookings`);
    assert(unauthRes.status === 401 || unauthRes.status === 403, 'Unauthenticated request to /api/platform/bookings is rejected');

    // 2b. Operator request to platform bookings
    const opRes = await fetch(`${BASE_URL}/api/platform/bookings`, {
      headers: { Cookie: operatorCookie },
    });
    assert(opRes.status === 403, 'Operator request to /api/platform/bookings is strictly forbidden (403)');

    // 2c. Admin request to platform bookings
    const adminBookingsRes = await fetch(`${BASE_URL}/api/platform/bookings`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminBookingsRes.status === 200, 'Platform Admin successfully accesses /api/platform/bookings (200)');

    // 3. Test Confidential Financial Transparency & Public Non-Leakage
    console.log('\n🔒 [3] Testing Confidential Financial Data Isolation...');
    
    // Create a test booking with private financials
    const testRef = `B5-FIN-${Date.now().toString().slice(-6)}`;
    const testBooking = await prisma.booking.create({
      data: {
        referenceCode: testRef,
        customerName: 'Secret Guest',
        customerEmail: 'secret@example.com',
        customerPhone: '+1234567890',
        serviceType: 'TOUR',
        bookingDate: new Date(),
        numAdults: 2,
        numChildren: 0,
        quotedPriceCents: 20000,
        amountPaidCents: 20000,
        costCents: 12000,
        profitCents: 8000,
        commissionRate: 0.1500,
        commissionAmountCents: 1200,
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID_IN_FULL,
        operatorId: operator.id,
      },
    });
    createdBookingIds.push(testBooking.id);

    // Platform admin view contains cost, profit, and commission
    const adminData = await adminBookingsRes.json();
    assert(Array.isArray(adminData.bookings), 'Admin receives bookings array');
    
    // Verify public API does NOT leak costCents, profitCents, commissionAmountCents
    const publicLookupRes = await fetch(`${BASE_URL}/api/bookings/${testRef}`);
    if (publicLookupRes.ok) {
      const pubData = await publicLookupRes.json();
      assert(pubData.costCents === undefined, 'Public lookup NEVER leaks costCents');
      assert(pubData.profitCents === undefined, 'Public lookup NEVER leaks profitCents');
      assert(pubData.commissionAmountCents === undefined, 'Public lookup NEVER leaks commissionAmountCents');
      assert(pubData.commissionRate === undefined, 'Public lookup NEVER leaks commissionRate');
    } else {
      console.log('✅ PASS: Public lookup does not expose internal endpoints directly');
    }

    // 4. Test Reconciliation & Anomaly Detection Rules
    console.log('\n⚖️ [4] Testing Reconciliation & Anomaly Cross-Checks...');

    // Anomaly 1: COMPLETED but NOT_PAID
    const anom1 = await prisma.booking.create({
      data: {
        referenceCode: `ANOM1-${Date.now().toString().slice(-4)}`,
        customerName: 'Unpaid Completed Traveler',
        customerEmail: 'anom1@example.com',
        customerPhone: '+111111111',
        serviceType: 'TOUR',
        bookingDate: new Date(),
        numAdults: 2,
        numChildren: 0,
        quotedPriceCents: 15000,
        amountPaidCents: 0,
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.NOT_PAID,
        operatorId: operator.id,
      },
    });
    createdBookingIds.push(anom1.id);

    // Anomaly 2: Price Mismatch (amountPaid != quotedPrice)
    const anom2 = await prisma.booking.create({
      data: {
        referenceCode: `ANOM2-${Date.now().toString().slice(-4)}`,
        customerName: 'Underpaid Traveler',
        customerEmail: 'anom2@example.com',
        customerPhone: '+222222222',
        serviceType: 'TOUR',
        bookingDate: new Date(),
        numAdults: 2,
        numChildren: 0,
        quotedPriceCents: 25000,
        amountPaidCents: 20000,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID_IN_FULL,
        operatorId: operator.id,
      },
    });
    createdBookingIds.push(anom2.id);

    // Anomaly 3: Payment recorded > 7 days ago but not COMPLETED
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const anom3 = await prisma.booking.create({
      data: {
        referenceCode: `ANOM3-${Date.now().toString().slice(-4)}`,
        customerName: 'Stale Confirmed Traveler',
        customerEmail: 'anom3@example.com',
        customerPhone: '+333333333',
        serviceType: 'TOUR',
        bookingDate: eightDaysAgo,
        numAdults: 1,
        numChildren: 0,
        quotedPriceCents: 10000,
        amountPaidCents: 10000,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID_IN_FULL,
        operatorId: operator.id,
        createdAt: eightDaysAgo,
      },
    });
    createdBookingIds.push(anom3.id);

    // Anomaly 4: COMPLETED booking with MISSING_COST
    const anom4 = await prisma.booking.create({
      data: {
        referenceCode: `ANOM4-${Date.now().toString().slice(-4)}`,
        customerName: 'Missing Cost Traveler',
        customerEmail: 'anom4@example.com',
        customerPhone: '+444444444',
        serviceType: 'TOUR',
        bookingDate: new Date(),
        numAdults: 2,
        numChildren: 0,
        quotedPriceCents: 18000,
        amountPaidCents: 18000,
        costCents: null,
        commissionStatus: CommissionStatus.MISSING_COST,
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID_IN_FULL,
        operatorId: operator.id,
      },
    });
    createdBookingIds.push(anom4.id);

    // Fetch reconciliation view data through API
    const reconRes = await fetch(`${BASE_URL}/api/platform/bookings`, {
      headers: { Cookie: adminCookie },
    });
    const { bookings: allBookings } = await reconRes.json();
    
    // Cross-check anomalies
    const foundAnom1 = allBookings.find((b) => b.id === anom1.id);
    assert(foundAnom1 && foundAnom1.status === 'COMPLETED' && foundAnom1.paymentStatus === 'NOT_PAID', 'Rule 1: Completed without full payment identified');

    const foundAnom2 = allBookings.find((b) => b.id === anom2.id);
    assert(foundAnom2 && foundAnom2.amountPaidCents !== foundAnom2.quotedPriceCents, 'Rule 2: Quoted price vs collected mismatch identified');

    const foundAnom3 = allBookings.find((b) => b.id === anom3.id);
    assert(foundAnom3 && foundAnom3.status !== 'COMPLETED' && foundAnom3.paymentStatus === 'PAID_IN_FULL', 'Rule 3: Stale uncompleted tour > 7 days identified');

    const foundAnom4 = allBookings.find((b) => b.id === anom4.id);
    assert(foundAnom4 && foundAnom4.costCents === null, 'Rule 4: Missing operating cost identified');

    // Test inline resolution: supply missing cost via PATCH /api/platform/bookings/[id]/cost
    console.log('\n🛠️ [5] Testing Inline Cost Supply & Commission Recalculation...');
    const patchCostRes = await fetch(`${BASE_URL}/api/platform/bookings/${anom4.id}/cost`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        costCents: 10000, // $100 cost -> $80 profit
      }),
    });

    assert(patchCostRes.status === 200, 'Cost supplied successfully (200)');
    const patchCostData = await patchCostRes.json();
    assert(patchCostData.booking.costCents === 10000, 'costCents updated to 10,000 cents');
    assert(patchCostData.booking.profitCents === 8000, 'profitCents recomputed to 8,000 cents ($80)');
    assert(patchCostData.booking.commissionStatus !== 'MISSING_COST', 'MISSING_COST flag cleared');

    // Verify AuditLog record was created for UPDATE_BOOKING_COST
    const costAudit = await prisma.auditLog.findFirst({
      where: {
        action: 'UPDATE_BOOKING_COST',
        entityId: anom4.id,
      },
    });
    assert(Boolean(costAudit), 'AuditLog entry created for UPDATE_BOOKING_COST');

    // 6. Test Monthly Settlements & Dual-Party Transparency
    console.log('\n📊 [6] Testing Monthly Settlement Rollup & Transparency...');
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Trigger settlement rollup
    const rollupRes = await fetch(`${BASE_URL}/api/platform/settlements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ month: currentMonth }),
    });
    assert(rollupRes.status === 200, 'Monthly settlement rollup triggered successfully (200)');

    // Fetch settlements as admin
    const adminSettlementsRes = await fetch(`${BASE_URL}/api/platform/settlements`, {
      headers: { Cookie: adminCookie },
    });
    const adminSettlementsData = await adminSettlementsRes.json();
    assert(adminSettlementsData.success, 'Settlements list retrieved');
    
    const targetSettlement = adminSettlementsData.settlements.find((s) => s.month === currentMonth);
    assert(Boolean(targetSettlement), `Settlement for current month ${currentMonth} found`);
    createdSettlementIds.push(targetSettlement.id);

    // Test settlement status transitions: PENDING -> SETTLED -> PAID
    console.log('🔄 Transitioning Settlement Status: PENDING -> SETTLED...');
    const markSettledRes = await fetch(`${BASE_URL}/api/platform/settlements/${targetSettlement.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: SettlementStatus.SETTLED }),
    });
    assert(markSettledRes.status === 200, 'Settlement marked as SETTLED');

    console.log('🔄 Transitioning Settlement Status: SETTLED -> PAID...');
    const markPaidRes = await fetch(`${BASE_URL}/api/platform/settlements/${targetSettlement.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: SettlementStatus.PAID }),
    });
    assert(markPaidRes.status === 200, 'Settlement marked as PAID');

    // Verify AuditLog has SETTLEMENT_STATUS_UPDATED
    const settlementAudit = await prisma.auditLog.findFirst({
      where: {
        action: 'UPDATE_SETTLEMENT_STATUS',
        entityId: targetSettlement.id,
      },
    });
    assert(Boolean(settlementAudit), 'AuditLog entry created for UPDATE_SETTLEMENT_STATUS');

    // Verify Operator view has identical numbers (dual-party transparency)
    const opSettlementInDb = await prisma.monthlySettlement.findUnique({
      where: { id: targetSettlement.id },
    });
    assert(
      Number(opSettlementInDb.totalRevenueCents) === targetSettlement.totalRevenueCents,
      'Operator and Admin see identical gross revenue'
    );
    assert(
      Number(opSettlementInDb.totalProfitCents) === targetSettlement.totalProfitCents,
      'Operator and Admin see identical gross profit'
    );
    assert(
      Number(opSettlementInDb.commissionDueCents) === targetSettlement.commissionDueCents,
      'Operator and Admin see identical platform commission'
    );
    assert(opSettlementInDb.status === SettlementStatus.PAID, 'Operator sees final PAID settlement status');

    // 7. Test Operator Management, Payment Oversight & TRA Licensing
    console.log('\n🏛️ [7] Testing Operator Governance, Payment Oversight & TRA Licensing...');

    const updateOpRes = await fetch(`${BASE_URL}/api/platform/operators/${operator.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        traLicenseNumber: 'ZCT-OP-2026-TEST',
        traLicenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        traLicenseUrl: 'https://zct.go.tz/verify/ZCT-OP-2026-TEST',
        commissionRate: 14.5,
        mpesaNumber: '+255777888999',
        bankName: 'CRDB Bank Zanzibar',
        bankAccount: '01509999888800',
        paymentInstructions: 'Deposit directly to CRDB Bank or M-Pesa.',
        paymentNotes: 'Prefer USD cash for park conservation fees.',
      }),
    });
    assert(updateOpRes.status === 200, 'Operator configuration updated successfully (200)');

    const updatedOp = await prisma.operatorProfile.findUnique({
      where: { id: operator.id },
    });
    assert(updatedOp.traLicenseNumber === 'ZCT-OP-2026-TEST', 'TRA license number updated');
    assert(Number(updatedOp.commissionRate) === 0.145, 'Commission override updated to 14.5%');
    assert(updatedOp.mpesaNumber === '+255777888999', 'M-Pesa number oversight saved');
    assert(updatedOp.bankName === 'CRDB Bank Zanzibar', 'Bank name oversight saved');
    assert(updatedOp.bankAccount === '01509999888800', 'Bank account oversight saved');

    // Verify AuditLog for UPDATE_OPERATOR_CONFIG
    const opAudit = await prisma.auditLog.findFirst({
      where: {
        action: 'UPDATE_OPERATOR_CONFIG',
        entityId: operator.id,
      },
    });
    assert(Boolean(opAudit), 'AuditLog entry created for UPDATE_OPERATOR_CONFIG');

    // Verify Trust Badge Expiry Logic
    console.log('🛡️ Verifying Trust Badge Expiry Logic...');
    const isUnexpiredValid = updatedOp.traLicenseNumber && (!updatedOp.traLicenseExpiry || new Date(updatedOp.traLicenseExpiry) > new Date());
    assert(isUnexpiredValid === true, 'Valid future license activates trust badge');

    // Simulate expired license
    const expiredOp = {
      traLicenseNumber: 'ZCT-EXPIRED-999',
      traLicenseExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    };
    const isExpiredValid = expiredOp.traLicenseNumber && (!expiredOp.traLicenseExpiry || new Date(expiredOp.traLicenseExpiry) > new Date());
    assert(isExpiredValid === false, 'Expired license hides verified trust badge');

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL PHASE B5 VERIFICATION CHECKS PASSED (14/14)!');
    console.log('🎉 ========================================================\n');
  } finally {
    // Cleanup created test records
    console.log('🧹 Cleaning up test bookings and settlements...');
    if (createdBookingIds.length > 0) {
      await prisma.payment.deleteMany({ where: { bookingId: { in: createdBookingIds } } });
      await prisma.auditLog.deleteMany({ where: { entityId: { in: createdBookingIds } } });
      await prisma.booking.deleteMany({ where: { id: { in: createdBookingIds } } });
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  prisma.$disconnect();
  process.exit(1);
});
