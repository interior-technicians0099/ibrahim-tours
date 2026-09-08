import { PrismaClient } from '@prisma/client';
import { sanitizeHtml, escapeHtml } from '../src/lib/sanitize.ts';
import { toPublicBookingDto, stripPrivateFinancials } from '../src/lib/serialization.ts';
import { isValidImageMagicBytes } from '../src/app/api/operator/media/upload/route.ts';
import { checkContactRateLimit } from '../src/lib/contact-rate-limiter.ts';
import { checkBookingRateLimit } from '../src/lib/booking-rate-limiter.ts';
import { checkRateLimit, recordFailedAttempt } from '../src/lib/rate-limiter.ts';

const prisma = new PrismaClient();
const BASE_URL = 'http://127.0.0.1:3000';

let testBookingIds = [];

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

  if (!sessionCookies.includes('authjs.session-token') && !sessionCookies.includes('__Secure-authjs.session-token')) {
    throw new Error(`Failed to login as ${email}. Cookies: ${sessionCookies}`);
  }

  return sessionCookies;
}

async function runPhaseB6TestSuite() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING PHASE B6 COMPREHENSIVE VERIFICATION SUITE');
  console.log('======================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Security Headers on HTTP Responses
    // ----------------------------------------------------
    console.log('--- TEST 1: Security Headers on Responses ---');
    const headerRes = await fetch(`${BASE_URL}/`);
    assert(headerRes.ok, 'Root endpoint responds with 200 OK');

    const headers = headerRes.headers;
    assert(headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is DENY');
    assert(headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff');
    assert(
      headers.get('referrer-policy') === 'strict-origin-when-cross-origin',
      'Referrer-Policy is strict-origin-when-cross-origin'
    );
    assert(headers.has('permissions-policy'), 'Permissions-Policy header is configured');

    const csp = headers.get('content-security-policy') || '';
    assert(csp.includes("default-src 'self'"), "CSP contains default-src 'self'");
    assert(csp.includes('res.cloudinary.com'), 'CSP permits res.cloudinary.com for image assets');

    // ----------------------------------------------------
    // TEST 2: Public DTO Serialization & Private Financial Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Public DTO Serialization & Isolation ---');
    const mockInternalBooking = {
      id: 'b-mock-12345',
      referenceCode: 'ZNZ-TEST-B6-001',
      serviceType: 'TOUR',
      tier: 'Standard',
      bookingDate: new Date('2026-10-15'),
      bookingTime: '09:00',
      numAdults: 2,
      numChildren: 0,
      status: 'CONFIRMED',
      paymentStatus: 'PAID_IN_FULL',
      quotedPriceCents: 20000,
      amountPaidCents: 20000,
      totalPriceCents: 20000,
      pickupLocation: 'Stone Town',
      dropoffLocation: 'Kendwa',
      customerName: 'Secret Guest',
      customerEmail: 'guest@example.com',
      customerPhone: '+255711223344',
      customerCountry: 'Germany',
      specialRequests: 'Vegetarian snacks',
      createdAt: new Date(),
      // CONFIDENTIAL INTERNAL FINANCIAL FIELDS:
      costCents: 12000,
      profitCents: 8000,
      commissionRate: 0.15,
      commissionAmountCents: 1200,
      commissionStatus: 'PENDING',
      operatorNotes: 'High margin private tour',
    };

    const publicDto = toPublicBookingDto(mockInternalBooking);
    assert(publicDto.referenceCode === 'ZNZ-TEST-B6-001', 'Public DTO preserves referenceCode');
    assert(publicDto.quotedPriceCents === 20000, 'Public DTO preserves quotedPriceCents');
    assert(publicDto.customerName === 'Secret Guest', 'Public DTO preserves customerName');
    assert(publicDto.costCents === undefined, 'Public DTO STRICTLY omits costCents');
    assert(publicDto.profitCents === undefined, 'Public DTO STRICTLY omits profitCents');
    assert(publicDto.commissionRate === undefined, 'Public DTO STRICTLY omits commissionRate');
    assert(publicDto.commissionAmountCents === undefined, 'Public DTO STRICTLY omits commissionAmountCents');
    assert(publicDto.operatorNotes === undefined, 'Public DTO STRICTLY omits operatorNotes');

    const stripped = stripPrivateFinancials(mockInternalBooking);
    assert(stripped.costCents === undefined, 'stripPrivateFinancials removes costCents');
    assert(stripped.profitCents === undefined, 'stripPrivateFinancials removes profitCents');
    assert(stripped.commissionRate === undefined, 'stripPrivateFinancials removes commissionRate');
    assert(stripped.commissionAmountCents === undefined, 'stripPrivateFinancials removes commissionAmountCents');
    assert(stripped.operatorNotes === undefined, 'stripPrivateFinancials removes operatorNotes');

    // ----------------------------------------------------
    // TEST 3: Rich Text Sanitization (Whitelist & XSS Prevention)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Rich Text Sanitizer & Escaping ---');
    const safeInput = '<p>Welcome to <b>Zanzibar</b>! Enjoy our <i>snorkeling</i> tour.</p>';
    const sanitizedSafe = sanitizeHtml(safeInput);
    assert(sanitizedSafe.includes('<b>Zanzibar</b>'), 'sanitizeHtml retains whitelisted tags like <b>');
    assert(sanitizedSafe.includes('<i>snorkeling</i>'), 'sanitizeHtml retains whitelisted tags like <i>');

    const maliciousScript = '<p>Test</p><script>alert("XSS")</script><b>Good</b>';
    const sanitizedScript = sanitizeHtml(maliciousScript);
    assert(!sanitizedScript.includes('<script>'), 'sanitizeHtml strips <script> tags completely');
    assert(!sanitizedScript.includes('alert("XSS")'), 'sanitizeHtml strips script contents');

    const maliciousEvent = '<img src="x" onerror="stealCookies()" /><b>Safe</b>';
    const sanitizedEvent = sanitizeHtml(maliciousEvent);
    assert(!sanitizedEvent.includes('onerror'), 'sanitizeHtml strips onerror event handler');
    assert(!sanitizedEvent.includes('<img'), 'sanitizeHtml strips non-whitelisted img tags');

    const maliciousProtocol = '<a href="javascript:alert(1)">Click here</a>';
    const sanitizedProtocol = sanitizeHtml(maliciousProtocol);
    assert(!sanitizedProtocol.includes('javascript:'), 'sanitizeHtml neutralizes javascript: protocol');

    const escaped = escapeHtml('<script>alert("hi")</script>');
    assert(escaped === '&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;', 'escapeHtml encodes characters');

    // ----------------------------------------------------
    // TEST 4: Media Upload Magic Byte Inspection
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Media Upload Magic Byte Inspection ---');
    // Valid JPEG: FF D8 FF
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    assert(isValidImageMagicBytes(validJpeg) === true, 'isValidImageMagicBytes accepts genuine JPEG');

    // Valid PNG: 89 50 4E 47
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    assert(isValidImageMagicBytes(validPng) === true, 'isValidImageMagicBytes accepts genuine PNG');

    // Valid WebP: RIFF....WEBP
    const validWebp = Buffer.alloc(16);
    validWebp.write('RIFF', 0, 'ascii');
    validWebp.write('WEBP', 8, 'ascii');
    assert(isValidImageMagicBytes(validWebp) === true, 'isValidImageMagicBytes accepts genuine WebP');

    // Disguised malicious text / PHP script
    const fakeImage = Buffer.from('<?php echo "evil shell"; ?>');
    assert(isValidImageMagicBytes(fakeImage) === false, 'isValidImageMagicBytes rejects disguised PHP payload');

    // Short buffer
    const tinyBuffer = Buffer.from([0xff, 0xd8]);
    assert(isValidImageMagicBytes(tinyBuffer) === false, 'isValidImageMagicBytes rejects truncated files');

    // ----------------------------------------------------
    // TEST 5: Rate Limiter Validation
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Rate Limiting Enforcement ---');
    const testIpContact = `192.168.99.${Math.floor(Math.random() * 200 + 50)}`;
    for (let i = 1; i <= 5; i++) {
      const res = checkContactRateLimit(testIpContact);
      assert(res.allowed === true, `Contact attempt ${i} of 5 is allowed`);
    }
    const contactBlocked = checkContactRateLimit(testIpContact);
    assert(contactBlocked.allowed === false, 'Contact attempt 6 is blocked by 5/15min rate limit');

    const testIpBooking = `10.50.88.${Math.floor(Math.random() * 200 + 50)}`;
    for (let i = 1; i <= 10; i++) {
      const res = checkBookingRateLimit(testIpBooking);
      assert(res.allowed === true, `Booking attempt ${i} of 10 is allowed`);
    }
    const bookingBlocked = checkBookingRateLimit(testIpBooking);
    assert(bookingBlocked.allowed === false, 'Booking attempt 11 is blocked by 10/hr rate limit');

    // ----------------------------------------------------
    // TEST 6: System Health Check Endpoint
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Health Check API Endpoint ---');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert(healthRes.status === 200, '/api/health returns HTTP 200 OK');
    const healthData = await healthRes.json();
    assert(healthData.status === 'healthy', 'Health status is "healthy"');
    assert(healthData.checks?.database?.status === 'up', 'Database health check status is "up"');
    assert(typeof healthData.checks?.database?.latencyMs === 'number', 'Database ping latency is reported');
    assert(healthRes.headers.get('x-health-status') === 'healthy', 'X-Health-Status header is healthy');

    // ----------------------------------------------------
    // TEST 7: GDPR Anonymization & Financial Retention
    // ----------------------------------------------------
    console.log('\n--- TEST 7: GDPR Anonymization & Accounting Preservation ---');
    const adminCookies = await loginUser('admin@ibrahimtours.co.tz', 'AdminPass123!');
    assert(adminCookies.length > 0, 'Platform Admin logged in successfully');

    // Find operator Ibrahim
    const operator = await prisma.operatorProfile.findFirst({
      where: { users: { some: { email: 'ibrahim@ibrahimtours.co.tz' } } },
    });
    assert(operator !== null, 'Operator Ibrahim found in database');

    // Create a real completed test booking with financial numbers
    const testBooking = await prisma.booking.create({
      data: {
        operatorId: operator.id,
        referenceCode: `ZNZ-GDPR-${Date.now().toString().slice(-6)}`,
        serviceType: 'TOUR',
        tier: 'VIP',
        bookingDate: new Date('2026-08-15'),
        bookingTime: '08:30',
        numAdults: 2,
        numChildren: 0,
        status: 'COMPLETED',
        paymentStatus: 'PAID_IN_FULL',
        quotedPriceCents: 35000,
        amountPaidCents: 35000,
        totalPriceCents: 35000,
        costCents: 20000,
        profitCents: 15000,
        commissionRate: 0.1500,
        commissionAmountCents: 2250,
        commissionStatus: 'CALCULATED',
        customerName: 'Anonymize Me',
        customerEmail: 'gdpr.traveler@example.com',
        customerPhone: '+447999888777',
        customerCountry: 'United Kingdom',
        pickupLocation: 'Zanzibar Palace Hotel',
        specialRequests: 'Allergic to peanuts; sensitive personal details',
      },
    });
    testBookingIds.push(testBooking.id);

    // Call Anonymize Endpoint
    const anonRes = await fetch(`${BASE_URL}/api/platform/bookings/${testBooking.id}/anonymize`, {
      method: 'POST',
      headers: {
        Cookie: adminCookies,
      },
    });
    assert(anonRes.ok, 'POST /api/platform/bookings/[id]/anonymize returns 200 OK');

    // Verify database record
    const anonymizedBooking = await prisma.booking.findUnique({
      where: { id: testBooking.id },
    });

    assert(
      anonymizedBooking.customerName.startsWith('DELETED-'),
      `Customer name pseudonymized: ${anonymizedBooking.customerName}`
    );
    assert(
      anonymizedBooking.customerEmail.endsWith('@anonymized.local'),
      `Customer email pseudonymized: ${anonymizedBooking.customerEmail}`
    );
    assert(
      anonymizedBooking.customerPhone.startsWith('DELETED-'),
      `Customer phone pseudonymized: ${anonymizedBooking.customerPhone}`
    );
    assert(
      anonymizedBooking.specialRequests === null ||
      anonymizedBooking.specialRequests === 'DELETED' ||
      anonymizedBooking.specialRequests === 'REDACTED',
      'Special requests redacted'
    );

    // CRITICAL ACCOUNTING PRESERVATION:
    assert(anonymizedBooking.quotedPriceCents === 35000, 'Quoted price preserved for tax records');
    assert(anonymizedBooking.amountPaidCents === 35000, 'Amount paid preserved for accounting');
    assert(anonymizedBooking.costCents === 20000, 'Cost cents preserved for operator reconciliation');
    assert(anonymizedBooking.profitCents === 15000, 'Gross profit preserved');
    assert(anonymizedBooking.commissionAmountCents === 2250, 'Platform commission preserved');
    assert(anonymizedBooking.paymentStatus === 'PAID_IN_FULL', 'Payment status preserved');

    // AuditLog check
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'GDPR_ANONYMIZE_CUSTOMER',
        entityId: testBooking.id,
      },
    });
    assert(auditLog !== null, 'AuditLog entry created for GDPR_ANONYMIZE_CUSTOMER');

    // ----------------------------------------------------
    // TEST 8: Public Legal Pages & Contact Form Consent Check
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Public Legal Pages & Consent Check ---');
    const privacyRes = await fetch(`${BASE_URL}/privacy`);
    assert(privacyRes.ok, 'GET /privacy returns 200 OK');

    const termsRes = await fetch(`${BASE_URL}/terms`);
    assert(termsRes.ok, 'GET /terms returns 200 OK');

    // Contact API spam honeypot rejection
    const honeypotRes = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Spam Bot',
        email: 'bot@spam.com',
        phone: '+1234567890',
        message: 'Buy cheap watches now!',
        honeypot: 'bot-filled-value',
      }),
    });
    assert(honeypotRes.status === 400, 'Contact API rejects submission with honeypot filled');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE B6 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    // Cleanup created test records
    if (testBookingIds.length > 0) {
      await prisma.booking.deleteMany({
        where: { id: { in: testBookingIds } },
      }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runPhaseB6TestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
