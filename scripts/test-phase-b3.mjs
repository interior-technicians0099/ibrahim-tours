import { PrismaClient, BookingStatus, PaymentStatus, PaymentMethod, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://127.0.0.1:3000';

async function runPhaseB3Tests() {
  console.log('🚀 ========================================================');
  console.log('🚀 RUNNING PHASE B3 AUTOMATED OPERATOR & LEDGER TEST SUITE');
  console.log('🚀 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Setup: Ensure operator account is authenticated and active
  const opUser = await prisma.adminUser.findUnique({
    where: { email: 'ibrahim@ibrahimtours.co.tz' },
  });

  if (!opUser) {
    throw new Error('Operator Ibrahim user not found in database!');
  }

  // Ensure mustChangePassword is false for test session
  if (opUser.mustChangePassword) {
    await prisma.adminUser.update({
      where: { id: opUser.id },
      data: { mustChangePassword: false },
    });
  }

  // 1. Authenticate and obtain session cookies
  console.log('🔑 Authenticating Operator Ibrahim...');
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie();

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookies.map((c) => c.split(';')[0]).join('; '),
    },
    body: new URLSearchParams({
      csrfToken,
      email: 'ibrahim@ibrahimtours.co.tz',
      password: 'IbrahimTour2026!',
    }),
    redirect: 'manual',
  });

  const sessionCookies = [...csrfCookies, ...loginRes.headers.getSetCookie()]
    .map((c) => c.split(';')[0])
    .join('; ');

  assert(sessionCookies.includes('authjs.session-token'), 'Operator successfully authenticated with session cookie');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': sessionCookies,
  };

  // Pre-clean any test bookings
  await prisma.payment.deleteMany({ where: { booking: { referenceCode: { in: ['ZNZ-2026-TEST01', 'ZNZ-2026-TEST02', 'ZNZ-2026-OTHER01'] } } } });
  await prisma.notification.deleteMany({ where: { booking: { referenceCode: { in: ['ZNZ-2026-TEST01', 'ZNZ-2026-TEST02', 'ZNZ-2026-OTHER01'] } } } });
  await prisma.booking.deleteMany({ where: { referenceCode: { in: ['ZNZ-2026-TEST01', 'ZNZ-2026-TEST02', 'ZNZ-2026-OTHER01'] } } });

  try {
    // ------------------------------------------------------------------------
    // TEST GROUP 1: Invariant Gate — Direct Confirmation Block
    // ------------------------------------------------------------------------
    console.log('\n🛡️ [Test Group 1] Invariant Gate — Reject Manual Confirmation');
    
    // Create unconfirmed booking with quoted price $160
    const testBooking1 = await prisma.booking.create({
      data: {
        referenceCode: `ZNZ-2026-TEST01`,
        serviceType: ServiceType.TOUR,
        customerName: 'Marcus Vance',
        customerEmail: 'marcus.vance@example.co.uk',
        customerPhone: '+44 7700 900888',
        customerCountry: 'United Kingdom',
        bookingDate: new Date('2026-11-05T09:00:00Z'),
        bookingTime: '08:30 AM',
        numAdults: 2,
        numChildren: 0,
        pickupLocation: 'Zanzibar Serena Hotel',
        status: BookingStatus.REQUESTED,
        paymentStatus: PaymentStatus.NOT_PAID,
        quotedPriceCents: 16000,
        totalPriceCents: 16000,
        costCents: 11000,
        amountPaidCents: 0,
        operatorId: opUser.operatorId,
      },
    });

    // Attempt to manually PATCH status: 'CONFIRMED' directly on unpaid booking
    const directConfirmRes = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking1.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });

    const directConfirmData = await directConfirmRes.json();
    assert(directConfirmRes.status === 400, `Direct CONFIRMED patch rejected with 400 (got ${directConfirmRes.status})`);
    assert(
      directConfirmData.error && directConfirmData.error.toLowerCase().includes('manual confirmation is not permitted'),
      `Rejection message states manual confirmation blocked (${directConfirmData.error})`
    );

    // Verify booking in DB is still REQUESTED and NOT_PAID
    const checkDb1 = await prisma.booking.findUnique({ where: { id: testBooking1.id } });
    assert(checkDb1.status === BookingStatus.REQUESTED, 'Booking status in DB remains REQUESTED');
    assert(checkDb1.paymentStatus === PaymentStatus.NOT_PAID, 'Payment status in DB remains NOT_PAID');

    // ------------------------------------------------------------------------
    // TEST GROUP 2: Partial Payment Recording & Balance Tracking
    // ------------------------------------------------------------------------
    console.log('\n💵 [Test Group 2] Partial Payment Recording ($50 of $160)');
    
    const partialPayRes1 = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking1.id}/payment`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amountPaidCents: 5000, // $50.00
        paymentMethod: 'MPESA',
        paymentReference: 'MPESA-TX-001A',
        notes: 'First deposit received via Vodacom M-Pesa',
      }),
    });

    const partialData1 = await partialPayRes1.json();
    assert(partialPayRes1.status === 200, `Partial payment returns 200 OK (got ${partialPayRes1.status})`);
    assert(partialData1.success === true, 'Response success is true');
    assert(partialData1.autoConfirmed === false, 'autoConfirmed is false for partial payment');
    assert(partialData1.remainingCents === 11000, `Remaining balance is $110 (11000 cents, got ${partialData1.remainingCents})`);

    // Verify Payment table entry
    const paymentRows1 = await prisma.payment.findMany({ where: { bookingId: testBooking1.id } });
    assert(paymentRows1.length === 1, `Discrete Payment row created (count: ${paymentRows1.length})`);
    assert(paymentRows1[0].amountPaidCents === 5000, 'Payment amount stored is 5000 cents');
    assert(paymentRows1[0].paymentMethod === 'MPESA', 'Payment method stored is MPESA');

    // Verify Booking table updated
    const checkDbAfterPart1 = await prisma.booking.findUnique({ where: { id: testBooking1.id } });
    assert(checkDbAfterPart1.amountPaidCents === 5000, `Booking amountPaidCents is 5000 (got ${checkDbAfterPart1.amountPaidCents})`);
    assert(checkDbAfterPart1.paymentStatus === PaymentStatus.PARTIALLY_PAID, 'Booking paymentStatus is PARTIALLY_PAID');
    assert(checkDbAfterPart1.status !== BookingStatus.CONFIRMED, 'Booking status is NOT confirmed');

    // Verify AuditLog entry for payment
    const paymentAudit1 = await prisma.auditLog.findFirst({
      where: {
        entityType: 'Booking',
        entityId: testBooking1.id,
        action: 'PAYMENT_RECORDED',
      },
    });
    assert(paymentAudit1 !== null, 'AuditLog created with action PAYMENT_RECORDED');
    assert(paymentAudit1.details.amountAddedCents === 5000, 'AuditLog recorded amountAddedCents: 5000');

    // ------------------------------------------------------------------------
    // TEST GROUP 3: Second Partial Payment ($50 additional)
    // ------------------------------------------------------------------------
    console.log('\n💵 [Test Group 3] Second Partial Payment ($50 additional -> $100 total of $160)');
    
    const partialPayRes2 = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking1.id}/payment`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amountPaidCents: 5000, // $50.00
        paymentMethod: 'CASH',
        paymentReference: 'CASH-REC-002',
        notes: 'Second deposit in cash at office',
      }),
    });

    const partialData2 = await partialPayRes2.json();
    assert(partialPayRes2.status === 200, 'Second payment returns 200 OK');
    assert(partialData2.autoConfirmed === false, 'autoConfirmed is still false');
    assert(partialData2.remainingCents === 6000, `Remaining balance is $60 (got ${partialData2.remainingCents})`);

    const paymentRows2 = await prisma.payment.findMany({ where: { bookingId: testBooking1.id } });
    assert(paymentRows2.length === 2, `Now 2 discrete Payment rows exist in history`);

    const checkDbAfterPart2 = await prisma.booking.findUnique({ where: { id: testBooking1.id } });
    assert(checkDbAfterPart2.amountPaidCents === 10000, 'Booking cumulative amountPaidCents is 10000');
    assert(checkDbAfterPart2.paymentStatus === PaymentStatus.PARTIALLY_PAID, 'Status is still PARTIALLY_PAID');

    // ------------------------------------------------------------------------
    // TEST GROUP 4: Final Payment -> PAID_IN_FULL & Automatic CONFIRMED Trigger
    // ------------------------------------------------------------------------
    console.log('\n🎉 [Test Group 4] Final Payment ($60) -> Auto-Confirmation Trigger');

    const finalPayRes = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking1.id}/payment`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amountPaidCents: 6000, // $60.00
        paymentMethod: 'BANK',
        paymentReference: 'CRDB-WIRE-992',
        notes: 'Final settlement via CRDB Bank transfer',
      }),
    });

    const finalData = await finalPayRes.json();
    assert(finalPayRes.status === 200, 'Final payment returns 200 OK');
    assert(finalData.autoConfirmed === true, 'autoConfirmed is TRUE!');
    assert(finalData.remainingCents === 0, 'Remaining balance is 0');

    // Verify DB state
    const confirmedBooking = await prisma.booking.findUnique({ where: { id: testBooking1.id } });
    assert(confirmedBooking.amountPaidCents === 16000, 'Booking amountPaidCents is 16000 ($160 full)');
    assert(confirmedBooking.paymentStatus === PaymentStatus.PAID_IN_FULL, 'paymentStatus is PAID_IN_FULL');
    assert(confirmedBooking.status === BookingStatus.CONFIRMED, 'status is CONFIRMED!');
    assert(confirmedBooking.confirmedAt !== null, 'confirmedAt timestamp is set');

    // Verify AuditLog autoConfirmed flag
    const finalAudit = await prisma.auditLog.findFirst({
      where: {
        entityType: 'Booking',
        entityId: testBooking1.id,
        action: 'PAYMENT_RECORDED',
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(finalAudit.details.autoConfirmed === true, 'AuditLog recorded autoConfirmed: true');

    // Verify Notifications created for both Tourist & Platform Admin
    // Allow brief time for async persistence
    await new Promise((r) => setTimeout(r, 600));
    const confirmNotifications = await prisma.notification.findMany({
      where: { bookingId: testBooking1.id },
    });
    assert(
      confirmNotifications.some((n) => n.recipient === 'TOURIST' && n.type === 'BOOKING_CONFIRMED_TOURIST'),
      'Tourist confirmation notification logged'
    );
    assert(
      confirmNotifications.some((n) => n.recipient === 'PLATFORM_ADMIN' && n.type === 'BOOKING_CONFIRMED_PLATFORM_ADMIN'),
      'Platform Admin confirmed alert notification logged'
    );

    // ------------------------------------------------------------------------
    // TEST GROUP 5: Status Progression Workflow (REQUESTED -> UNDER_REVIEW -> AWAITING_PAYMENT)
    // ------------------------------------------------------------------------
    console.log('\n🔄 [Test Group 5] Status Progression Workflow');

    const testBooking2 = await prisma.booking.create({
      data: {
        referenceCode: `ZNZ-2026-TEST02`,
        serviceType: ServiceType.TOUR,
        customerName: 'Elena Rostova',
        customerEmail: 'elena.rostova@example.com',
        customerPhone: '+7 999 123 4567',
        customerCountry: 'Russia',
        bookingDate: new Date('2026-11-10T09:00:00Z'),
        status: BookingStatus.REQUESTED,
        paymentStatus: PaymentStatus.NOT_PAID,
        quotedPriceCents: 12000,
        totalPriceCents: 12000,
        amountPaidCents: 0,
        operatorId: opUser.operatorId,
      },
    });

    // 1. Move to UNDER_REVIEW
    const underReviewRes = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking2.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'UNDER_REVIEW', operatorNotes: 'Checking guide availability' }),
    });
    const underReviewData = await underReviewRes.json();
    assert(underReviewRes.status === 200, 'Transition to UNDER_REVIEW returns 200 OK');
    assert(underReviewData.booking.status === 'UNDER_REVIEW', 'Status updated to UNDER_REVIEW');

    // 2. Move to AWAITING_PAYMENT
    const awaitingPayRes = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking2.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'AWAITING_PAYMENT', operatorNotes: 'Payment instructions dispatched' }),
    });
    const awaitingPayData = await awaitingPayRes.json();
    assert(awaitingPayRes.status === 200, 'Transition to AWAITING_PAYMENT returns 200 OK');
    assert(awaitingPayData.booking.status === 'AWAITING_PAYMENT', 'Status updated to AWAITING_PAYMENT');

    // ------------------------------------------------------------------------
    // TEST GROUP 6: Rejection & Cancellation with Mandatory Reason
    // ------------------------------------------------------------------------
    console.log('\n❌ [Test Group 6] Rejection & Cancellation with Mandatory Reason');

    // Attempt rejection WITHOUT reason -> Should fail 400
    const rejectNoReasonRes = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking2.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'REJECTED' }),
    });
    assert(rejectNoReasonRes.status === 400, `Rejection without reason rejected with 400 (got ${rejectNoReasonRes.status})`);

    // Valid rejection with reason
    const validRejectReason = 'Fully booked on requested date due to private boat charter constraints.';
    const rejectWithReasonRes = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking2.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'REJECTED', reason: validRejectReason }),
    });
    const rejectData = await rejectWithReasonRes.json();
    assert(rejectWithReasonRes.status === 200, 'Valid rejection returns 200 OK');
    assert(rejectData.booking.status === 'REJECTED', 'Status updated to REJECTED');
    assert(rejectData.booking.cancellationReason === validRejectReason, 'Cancellation reason stored in database');

    // Verify Notification audit row for rejection
    await new Promise((r) => setTimeout(r, 600));
    const rejectNotification = await prisma.notification.findFirst({
      where: {
        bookingId: testBooking2.id,
        recipient: 'TOURIST',
        type: 'BOOKING_REJECTED_TOURIST',
      },
    });
    assert(rejectNotification !== null, 'Rejection notification recorded for tourist');

    // ------------------------------------------------------------------------
    // TEST GROUP 7: Tour Completion Gate
    // ------------------------------------------------------------------------
    console.log('\n🏁 [Test Group 7] Tour Completion Gate (Only CONFIRMED bookings can be COMPLETED)');

    // Attempt to complete an unconfirmed / rejected booking (testBooking2)
    const completeUnconfirmedRes = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking2.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert(completeUnconfirmedRes.status === 400, `Attempt to complete unconfirmed booking blocked with 400 (got ${completeUnconfirmedRes.status})`);

    // Complete the CONFIRMED booking (testBooking1)
    const completeConfirmedRes = await fetch(`${BASE_URL}/api/operator/bookings/${testBooking1.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const completeData = await completeConfirmedRes.json();
    assert(completeConfirmedRes.status === 200, 'Completing confirmed booking returns 200 OK');
    assert(completeData.booking.status === 'COMPLETED', 'Status updated to COMPLETED');

    // Verify AuditLog BOOKING_COMPLETED
    const completionAudit = await prisma.auditLog.findFirst({
      where: {
        entityType: 'Booking',
        entityId: testBooking1.id,
        action: 'BOOKING_COMPLETED',
      },
    });
    assert(completionAudit !== null, 'AuditLog created with action BOOKING_COMPLETED');

    // ------------------------------------------------------------------------
    // TEST GROUP 8: Operator Scoping Security
    // ------------------------------------------------------------------------
    console.log('\n🔒 [Test Group 8] Operator Scoping Security');

    // Ensure a second operator profile exists for cross-scoping test
    const otherOperator = await prisma.operatorProfile.upsert({
      where: { id: 'operator-other' },
      update: {},
      create: {
        id: 'operator-other',
        name: 'Rashid',
        businessName: 'Zanzibar Blue Waters',
        tagline: 'Ocean Adventures',
        biography: 'Local marine guide with 8 years experience.',
        phone: '+255 777 999 111',
        whatsapp: '+255 777 999 111',
        email: 'rashid@bluewaters.co.tz',
        paymentInstructions: 'Pay in full via M-Pesa.',
        languages: ['en', 'sw'],
      },
    });

    // Create a booking owned by another operator
    const otherBooking = await prisma.booking.create({
      data: {
        referenceCode: `ZNZ-2026-OTHER01`,
        serviceType: ServiceType.TOUR,
        customerName: 'Foreign Tourist',
        customerEmail: 'tourist@other.com',
        customerPhone: '+1 234 567 8901',
        bookingDate: new Date('2026-11-15T09:00:00Z'),
        status: BookingStatus.REQUESTED,
        paymentStatus: PaymentStatus.NOT_PAID,
        quotedPriceCents: 20000,
        totalPriceCents: 20000,
        operatorId: otherOperator.id,
      },
    });

    // Ibrahim tries to record payment on other operator's booking
    const unauthorizedPayRes = await fetch(`${BASE_URL}/api/operator/bookings/${otherBooking.id}/payment`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amountPaidCents: 10000,
        paymentMethod: 'CASH',
      }),
    });
    assert(unauthorizedPayRes.status === 403, `Cross-operator payment attempt rejected with 403 Forbidden (got ${unauthorizedPayRes.status})`);

    // Ibrahim tries to change status on other operator's booking
    const unauthorizedStatusRes = await fetch(`${BASE_URL}/api/operator/bookings/${otherBooking.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'UNDER_REVIEW' }),
    });
    assert(unauthorizedStatusRes.status === 403, `Cross-operator status change rejected with 403 Forbidden (got ${unauthorizedStatusRes.status})`);

    // Clean up test bookings
    await prisma.payment.deleteMany({ where: { bookingId: { in: [testBooking1.id, testBooking2.id, otherBooking.id] } } });
    await prisma.notification.deleteMany({ where: { bookingId: { in: [testBooking1.id, testBooking2.id, otherBooking.id] } } });
    await prisma.auditLog.deleteMany({ where: { entityId: { in: [testBooking1.id, testBooking2.id, otherBooking.id] } } });
    await prisma.booking.deleteMany({ where: { id: { in: [testBooking1.id, testBooking2.id, otherBooking.id] } } });

    console.log(`\n========================================`);
    console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhaseB3Tests();
