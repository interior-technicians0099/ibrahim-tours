import { prisma } from '../src/lib/prisma';
import {
  generateNextReceiptNumber,
  generateVerificationCode,
  generateReceiptQrDataUrl,
  issueBookingReceipt,
  verifyReceiptCode,
  markBookingCheckedIn,
  updateReceiptNotes,
} from '../src/lib/services/receipt-service';
import { PaymentMethod, BookingStatus, PaymentStatus, ServiceType } from '@prisma/client';

async function runPhaseR3VerificationSuite() {
  console.log('===============================================================');
  console.log('🚀 RUNNING PHASE R3: BRANDED RECEIPT & TOUR UHAKIKI TEST SUITE');
  console.log('===============================================================\n');

  const currentYear = new Date().getFullYear();

  // ---------------------------------------------------------------------------
  // TEST 1: Sequential Receipt Number Formatting & Increment
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 1] Sequential Receipt Number Generation...');
  const nextNumber1 = await generateNextReceiptNumber();
  console.log('  Generated Receipt Number:', nextNumber1);
  const regexPattern = new RegExp(`^ZSH-${currentYear}-\\d{6}$`);
  if (!regexPattern.test(nextNumber1)) {
    throw new Error(`TEST 1 FAILED: Receipt number format invalid: "${nextNumber1}". Expected ZSH-${currentYear}-XXXXXX.`);
  }
  console.log('  ✓ Receipt number correctly formatted with 6-digit sequence.\n');

  // ---------------------------------------------------------------------------
  // TEST 2: Cryptographic 6-Char Verification Code Uniqueness & Disambiguation
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 2] Cryptographic 6-Char Verification Code Generation...');
  const sampleCodes = new Set<string>();
  for (let i = 0; i < 25; i++) {
    const code = await generateVerificationCode();
    if (code.length !== 6) {
      throw new Error(`TEST 2 FAILED: Code length is ${code.length}, expected 6: ${code}`);
    }
    // Disallowed ambiguous characters: 0, 1, O, I
    if (/[01OI]/.test(code)) {
      throw new Error(`TEST 2 FAILED: Code contains ambiguous characters (0, 1, O, I): ${code}`);
    }
    // Must be uppercase alphanumeric
    if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code)) {
      throw new Error(`TEST 2 FAILED: Code contains unexpected characters: ${code}`);
    }
    sampleCodes.add(code);
  }
  if (sampleCodes.size !== 25) {
    throw new Error(`TEST 2 FAILED: Detected duplicate code in 25 samples.`);
  }
  console.log(`  ✓ Generated 25 distinct unambiguous verification codes (e.g. ${Array.from(sampleCodes)[0]}).\n`);

  // ---------------------------------------------------------------------------
  // TEST 3: Scannable QR Code Base64 Data URI Generation
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 3] Offline QR Code Generation...');
  const testUrl = `https://zansafarihorizon.com/receipt/${nextNumber1}`;
  const qrDataUrl = await generateReceiptQrDataUrl(testUrl);
  if (!qrDataUrl || !qrDataUrl.startsWith('data:image/png;base64,')) {
    throw new Error(`TEST 3 FAILED: QR Code base64 URL failed to generate. Prefix: "${qrDataUrl.slice(0, 30)}"`);
  }
  if (qrDataUrl.length < 500) {
    throw new Error(`TEST 3 FAILED: QR Code data payload suspiciously small (${qrDataUrl.length} chars).`);
  }
  console.log(`  ✓ Scannable PNG Data URI created successfully (${qrDataUrl.length} chars, prefix: ${qrDataUrl.slice(0, 35)}...)\n`);

  // ---------------------------------------------------------------------------
  // TEST 4: Prepare Test Tour & Bookings
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 4] Provisioning Test Bookings...');
  
  // Find a tour
  let testTour = await prisma.tour.findFirst();
  if (!testTour) {
    const category = await prisma.tourCategory.findFirst() || await prisma.tourCategory.create({
      data: { slug: 'test-cat', name: 'Test Category' }
    });
    testTour = await prisma.tour.create({
      data: {
        title: 'Stone Town & Spice Tour Test',
        slug: 'stone-town-spice-tour-test',
        description: 'Test tour for Phase R3 verification',
        durationText: 'Half Day',
        startingPriceCents: 5000,
        pricingTiers: {},
        highlights: [],
        inclusions: [],
        categoryId: category.id,
      },
    });
  }

  // Find or create a platform admin user for check-in audits
  let adminUser = await prisma.adminUser.findFirst();
  if (!adminUser) {
    adminUser = await prisma.adminUser.create({
      data: {
        name: 'Super Admin Test',
        email: 'testadmin@zansafarihorizon.com',
        role: 'PLATFORM_ADMIN',
        passwordHash: 'testhash',
      },
    });
  }

  // Create Booking A: Fully Confirmed & Paid in Full (Cost $80, Price $150, Profit $70)
  const timestamp = Date.now();
  const bookingA = await prisma.booking.create({
    data: {
      referenceCode: `ZSH-TEST-A-${timestamp}`,
      serviceType: ServiceType.TOUR,
      tourId: testTour.id,
      customerName: 'Matteo Rossi',
      customerEmail: 'matteo.rossi@example.it',
      customerPhone: '+39 340 1234567',
      customerCountry: 'Italy',
      locale: 'it',
      bookingDate: new Date(),
      bookingTime: '08:30 AM',
      numAdults: 2,
      numChildren: 0,
      totalPriceCents: 15000,
      quotedPriceCents: 15000,
      amountPaidCents: 15000,
      costCents: 8000, // Private internal cost
      profitCents: 7000, // Private internal profit
      paymentStatus: PaymentStatus.PAID_IN_FULL,
      status: BookingStatus.CONFIRMED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentReference: `CRDB-FT-${timestamp}`,
      confirmedAt: new Date(),
      guideName: 'Salum Hamisi',
      guidePhone: '+255 777 123 456',
      guideNotes: 'Speaks Italian, meet at lobby.',
    },
  });

  // Create Booking B: Unconfirmed / Pending Payment (Gating test)
  const bookingB = await prisma.booking.create({
    data: {
      referenceCode: `ZSH-TEST-B-${timestamp}`,
      serviceType: ServiceType.TOUR,
      tourId: testTour.id,
      customerName: 'Jean Dupont',
      customerEmail: 'jean.dupont@example.fr',
      customerPhone: '+33 6 12 34 56 78',
      customerCountry: 'France',
      locale: 'fr',
      bookingDate: new Date(),
      totalPriceCents: 20000,
      quotedPriceCents: 20000,
      amountPaidCents: 0,
      costCents: 10000,
      profitCents: 10000,
      paymentStatus: PaymentStatus.PENDING,
      status: BookingStatus.REQUESTED,
    },
  });

  console.log(`  ✓ Created Confirmed Booking A (${bookingA.referenceCode}) and Pending Booking B (${bookingB.referenceCode}).\n`);

  // ---------------------------------------------------------------------------
  // TEST 5: Receipt Auto-Issuance for Booking A
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 5] Issuing Official Branded Receipt for Booking A...');
  const receiptA = await issueBookingReceipt({
    bookingId: bookingA.id,
    amountPaidCents: bookingA.amountPaidCents ?? 15000,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentReference: bookingA.paymentReference,
    issuedById: adminUser.id,
    notes: 'Initial test issuance',
  });

  console.log(`  Receipt Number:    ${receiptA.receiptNumber}`);
  console.log(`  Verification Code: ${receiptA.verificationCode}`);
  console.log(`  Amount Recorded:   $${receiptA.amountCents / 100}`);

  if (!receiptA.receiptNumber.startsWith(`ZSH-${currentYear}-`)) {
    throw new Error(`TEST 5 FAILED: Invalid receipt number: ${receiptA.receiptNumber}`);
  }
  if (receiptA.verificationCode.length !== 6) {
    throw new Error(`TEST 5 FAILED: Invalid verification code: ${receiptA.verificationCode}`);
  }
  console.log('  ✓ Receipt successfully created and linked to Booking A.\n');

  // ---------------------------------------------------------------------------
  // TEST 6: Uhakiki Code Verification (Valid Case)
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 6] Verifying Code via verifyReceiptCode...');
  const verifyResultA = await verifyReceiptCode(receiptA.verificationCode);
  if (!verifyResultA.isValid) {
    throw new Error(`TEST 6 FAILED: Expected code ${receiptA.verificationCode} to be valid, got: ${verifyResultA.reason}`);
  }
  if (verifyResultA.booking?.customerName !== 'Matteo Rossi') {
    throw new Error(`TEST 6 FAILED: Customer name mismatch. Expected Matteo Rossi, got ${verifyResultA.booking?.customerName}`);
  }
  if (verifyResultA.booking?.guideName !== 'Salum Hamisi') {
    throw new Error(`TEST 6 FAILED: Guide name missing or mismatch: ${verifyResultA.booking?.guideName}`);
  }
  console.log('  Verification Result:', {
    isValid: verifyResultA.isValid,
    receiptNumber: verifyResultA.receipt?.receiptNumber,
    customer: verifyResultA.booking?.customerName,
    service: verifyResultA.booking?.serviceTitle,
    guide: verifyResultA.booking?.guideName,
  });
  console.log('  ✓ Code verification succeeded with complete booking and guide context.\n');

  // ---------------------------------------------------------------------------
  // TEST 7: Financial Privacy Invariant Assertion
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 7] Enforcing Financial Privacy Invariant (Zero Internal Leakage)...');
  const serializedVerification = JSON.stringify(verifyResultA);
  
  if (serializedVerification.includes('costCents') || serializedVerification.includes('8000')) {
    throw new Error('CRITICAL INVARIANT VIOLATION: costCents leaked in verification payload!');
  }
  if (serializedVerification.includes('profitCents') || serializedVerification.includes('7000')) {
    throw new Error('CRITICAL INVARIANT VIOLATION: profitCents leaked in verification payload!');
  }
  if (serializedVerification.includes('commissionRate') || serializedVerification.includes('commissionAmountCents')) {
    throw new Error('CRITICAL INVARIANT VIOLATION: commission details leaked in verification payload!');
  }
  console.log('  ✓ Zero financial internals (cost, gross profit, commission rate) exposed in customer/verification DTO.\n');

  // ---------------------------------------------------------------------------
  // TEST 8: Gating Invariant: Unconfirmed / Unpaid Booking Receipt Rejection
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 8] Gating Invariant: Verifying Unconfirmed Bookings Are Rejected...');
  // Force a receipt onto Booking B (which is PENDING) to test rejection
  const receiptB = await prisma.receipt.create({
    data: {
      receiptNumber: `ZSH-${currentYear}-999999`,
      verificationCode: 'UNPD01',
      bookingId: bookingB.id,
      amountCents: 0,
      currency: 'USD',
      paymentMethod: PaymentMethod.CASH_USD,
    },
  });

  const verifyResultB = await verifyReceiptCode(receiptB.verificationCode);
  if (verifyResultB.isValid) {
    throw new Error('TEST 8 FAILED: verifyReceiptCode allowed verification of unconfirmed/unpaid booking!');
  }
  console.log('  Expected Rejection Received:', verifyResultB.reason);
  console.log('  ✓ Correctly rejected unconfirmed/unpaid receipt on tour day.\n');

  // ---------------------------------------------------------------------------
  // TEST 9: Tour-Day Check-In (markBookingCheckedIn)
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 9] Testing Tour-Day Check-In via markBookingCheckedIn...');
  const checkInResult = await markBookingCheckedIn(receiptA.verificationCode, adminUser.id);
  if (!checkInResult.success) {
    throw new Error(`TEST 9 FAILED: Check-in failed: ${(checkInResult as any).error || 'Unknown error'}`);
  }

  // Verify Booking database state
  const updatedBookingA = await prisma.booking.findUnique({
    where: { id: bookingA.id },
    select: { checkedInAt: true, checkedInById: true },
  });

  if (!updatedBookingA?.checkedInAt || updatedBookingA.checkedInById !== adminUser.id) {
    throw new Error('TEST 9 FAILED: checkedInAt or checkedInById was not properly saved in DB.');
  }

  // Verify AuditLog record
  const checkInAudit = await prisma.auditLog.findFirst({
    where: {
      action: 'TOURIST_CHECKED_IN',
      entityId: bookingA.id,
    },
  });
  if (!checkInAudit) {
    throw new Error('TEST 9 FAILED: TOURIST_CHECKED_IN audit log record was not created.');
  }
  console.log(`  ✓ Check-in timestamp saved (${updatedBookingA.checkedInAt.toISOString()}) and audited in AuditLog.\n`);

  // ---------------------------------------------------------------------------
  // TEST 10: Invalid Code Rejection & Offline Note Update
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 10] Invalid Code Rejection & Reconciliation Note Update...');
  
  // 10A. Invalid code rejection
  const invalidResult = await verifyReceiptCode('INVALID_CODE_XYZ');
  if (invalidResult.isValid) {
    throw new Error('TEST 10A FAILED: Random code was accepted as valid!');
  }
  console.log('  ✓ Invalid code properly rejected with descriptive feedback.');

  // 10B. Note update
  const updatedNoteReceipt = await updateReceiptNotes(
    receiptA.id,
    'Tourist requested early pickup at 08:00 AM. Cash balance settled.',
    adminUser.id
  );
  if (!updatedNoteReceipt.notes?.includes('early pickup')) {
    throw new Error('TEST 10B FAILED: Notes were not updated properly on receipt.');
  }

  const noteAudit = await prisma.auditLog.findFirst({
    where: {
      action: 'RECEIPT_NOTE_UPDATED',
      entityId: receiptA.id,
    },
  });
  if (!noteAudit) {
    throw new Error('TEST 10B FAILED: RECEIPT_NOTE_UPDATED audit log record was not created.');
  }
  console.log('  ✓ Offline reconciliation note updated and audited successfully.\n');

  // ---------------------------------------------------------------------------
  // CLEANUP TEST DATA
  // ---------------------------------------------------------------------------
  console.log('▶ Cleaning up test bookings...');
  await prisma.receipt.deleteMany({
    where: { id: { in: [receiptA.id, receiptB.id] } },
  });
  await prisma.auditLog.deleteMany({
    where: { entityId: { in: [bookingA.id, bookingB.id, receiptA.id, receiptB.id] } },
  });
  await prisma.booking.deleteMany({
    where: { id: { in: [bookingA.id, bookingB.id] } },
  });
  console.log('  ✓ Test data cleaned up successfully.\n');

  console.log('===============================================================');
  console.log('🎉 ALL 10 PHASE R3 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
  console.log('===============================================================');
}

runPhaseR3VerificationSuite()
  .catch((err) => {
    console.error('\n❌ Phase R3 Verification Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
