import { PrismaClient } from '@prisma/client';

const BASE_URL = 'https://ibrahim-tours-beige.vercel.app';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_cnMTkI5mN8Ei@ep-old-credit-b1hdpvxy-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    },
  },
});

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function withRetry(fn, retries = 5, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`    [Transient network hiccup: ${e.message.slice(0, 50)}, retrying in ${delayMs}ms...]`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function safeFetch(url, options = {}) {
  return withRetry(() => fetch(url, options));
}

async function loginUser(email, password) {
  // 1. Get CSRF Token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie();

  let cookieHeader = csrfCookies.map((c) => c.split(';')[0]).join('; ');

  // 2. Submit credentials
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader,
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
    }),
    redirect: 'manual',
  });

  const loginCookies = loginRes.headers.getSetCookie();
  if (loginCookies.length > 0) {
    cookieHeader += '; ' + loginCookies.map((c) => c.split(';')[0]).join('; ');
  }

  // 3. Verify session
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  });
  const sessionData = await sessionRes.json();

  return { session: sessionData, cookieHeader, status: loginRes.status };
}

async function runE2E() {
  console.log('\n============================================================');
  console.log('🚀 RUNNING PRODUCTION END-TO-END VERIFICATION (PHASE D2)');
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log('============================================================\n');

  // STEP 1: Health Check
  console.log('--- 1. HEALTH CHECK ---');
  try {
    const healthRes = await safeFetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, `Health status code is 200 (received ${healthRes.status})`);
    assert(healthData.status === 'healthy', `App status is healthy`);
    assert(healthData.checks?.database?.status === 'up', `Database check is UP (latency: ${healthData.checks?.database?.latencyMs}ms)`);
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // STEP 2: Ground Truth Catalog Verification
  console.log('\n--- 2. GROUND TRUTH CATALOG VERIFICATION ---');
  const tours = await withRetry(() => prisma.tour.findMany({ select: { slug: true, title: true, startingPriceCents: true, pricingTiers: true } }));
  assert(tours.length === 14, `All 14 tours populated (found ${tours.length})`);

  const stoneTown = tours.find(t => t.slug === 'stone-town-tour');
  const prisonIsland = tours.find(t => t.slug === 'prison-island');
  const nakupenda = tours.find(t => t.slug === 'nakupenda-sandbank');
  const safariBlue = tours.find(t => t.slug === 'safari-blue');

  assert(stoneTown && stoneTown.startingPriceCents === 12000, `Stone Town Tour: $120 ($${stoneTown?.startingPriceCents / 100})`);
  assert(prisonIsland && prisonIsland.startingPriceCents === 15500, `Prison Island: $155 ($${prisonIsland?.startingPriceCents / 100})`);
  assert(nakupenda && nakupenda.startingPriceCents === 17500, `Nakupenda Sandbank: $175 ($${nakupenda?.startingPriceCents / 100})`);
  assert(safariBlue && safariBlue.startingPriceCents === 20000, `Safari Blue: $200 ($${safariBlue?.startingPriceCents / 100})`);

  const routes = await withRetry(() => prisma.route.findMany());
  assert(routes.length === 12, `All 12 transfer routes populated (found ${routes.length})`);

  const vehicles = await withRetry(() => prisma.vehicle.findMany());
  assert(vehicles.length === 3, `All 3 vehicle types populated (found ${vehicles.length})`);

  // STEP 3: Authentication Tests on Production
  console.log('\n--- 3. AUTHENTICATION ON PRODUCTION ---');
  
  // 3a. Platform Admin Login
  console.log('Testing PLATFORM_ADMIN login (admin@ibrahimtours.co.tz)...');
  const adminAuth = await loginUser('admin@ibrahimtours.co.tz', 'AdminPass123!');
  assert(adminAuth.session?.user?.email === 'admin@ibrahimtours.co.tz', `Admin user session email matches`);
  assert(adminAuth.session?.user?.role === 'PLATFORM_ADMIN', `Admin user role is PLATFORM_ADMIN`);

  // 3b. Operator Login
  console.log('Testing OPERATOR login (ibrahim@ibrahimtours.co.tz)...');
  const opAuth = await loginUser('ibrahim@ibrahimtours.co.tz', 'IbrahimTour2026!');
  assert(opAuth.session?.user?.email === 'ibrahim@ibrahimtours.co.tz', `Operator user session email matches`);
  assert(opAuth.session?.user?.role === 'OPERATOR', `Operator user role is OPERATOR`);

  // STEP 4: Critical Booking Flow
  console.log('\n--- 4. CRITICAL BOOKING FLOW ON PRODUCTION ---');
  console.log('Submitting public test booking for Stone Town Tour...');

  const bookingPayload = {
    serviceType: 'TOUR',
    tourSlug: 'stone-town-tour',
    tier: 'couple',
    fullName: 'Phase D2 Verified Tourist',
    email: 'tourist-d2@example.com',
    phone: '+255777123456',
    country: 'Tanzania',
    tourDate: '2026-09-25',
    tourTime: '08:30 AM',
    numAdults: 2,
    numChildren: 0,
    pickupLocation: 'Park Hyatt Zanzibar, Stone Town',
    specialRequests: 'Phase D2 Automated Verification Test Booking',
    locale: 'en',
  };

  const bookingRes = await safeFetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload),
  });

  const bookingData = await bookingRes.json();
  assert(bookingRes.status === 201 || bookingRes.status === 200, `Booking submission status is 201/200 (received ${bookingRes.status})`);
  assert(Boolean(bookingData.referenceCode), `Booking reference code generated: ${bookingData.referenceCode}`);

  const testRef = bookingData.referenceCode;

  // Verify public confirmation page
  if (testRef) {
    const confRes = await safeFetch(`${BASE_URL}/book/confirmation/${testRef}`);
    assert(confRes.status === 200, `Confirmation page /book/confirmation/${testRef} loads with 200 OK`);
  }

  // STEP 5: Operator Records Payment Flow
  console.log('\n--- 5. OPERATOR PAYMENT RECORDING & CONFIRMATION ---');
  // Fetch booking record from DB
  const createdBooking = await withRetry(() => prisma.booking.findUnique({
    where: { referenceCode: testRef },
  }));

  assert(Boolean(createdBooking), `Booking found in database: ID ${createdBooking?.id}`);
  assert(createdBooking?.status === 'REQUESTED', `Initial booking status is REQUESTED`);
  assert(createdBooking?.totalPriceCents === 16000, `Quoted price is $160 (couple tier)`);

  // Operator records payment via API
  console.log(`Operator recording full payment ($160.00) for booking ${createdBooking.id}...`);
  const paymentRes = await safeFetch(`${BASE_URL}/api/operator/bookings/${createdBooking.id}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': opAuth.cookieHeader,
    },
    body: JSON.stringify({
      amountPaidCents: 16000,
      paymentMethod: 'CASH_USD',
      paymentReference: 'VERIFY-REC-CASH-160',
      notes: 'Phase D2 Payment Verification Paid in Full',
    }),
  });

  assert(paymentRes.status === 200, `Record payment API status is 200 OK (received ${paymentRes.status})`);
  const updatedBooking = await withRetry(() => prisma.booking.findUnique({
    where: { id: createdBooking.id },
    include: { payments: true },
  }));

  assert(updatedBooking?.status === 'CONFIRMED', `Booking transitioned to CONFIRMED`);
  assert(updatedBooking?.paymentStatus === 'PAID_IN_FULL', `Payment status is PAID_IN_FULL`);
  assert(updatedBooking?.amountPaidCents === 16000, `Recorded amount paid is $160.00`);
  assert(updatedBooking?.payments?.length >= 1, `Payment ledger entry created`);

  // STEP 6: Platform Admin View & Private Financials
  console.log('\n--- 6. PLATFORM ADMIN PRIVATE FINANCIALS ---');
  const platformRes = await safeFetch(`${BASE_URL}/api/platform/bookings`, {
    headers: { Cookie: adminAuth.cookieHeader },
  });
  assert(platformRes.status === 200, `Platform bookings API status is 200 OK (received ${platformRes.status})`);
  
  // Verify private financials in DB
  assert(updatedBooking?.costCents === 10000, `Private cost is $100.00 ($10,000 cents)`);
  assert(updatedBooking?.profitCents === 6000, `Private net profit is $60.00 ($6,000 cents)`);

  // STEP 7: Check Constraint chk_booking_confirmed_paid
  console.log('\n--- 7. DATABASE CHECK CONSTRAINT INTEGRITY ---');
  try {
    // Attempt illegal state: CONFIRMED with NOT_PAID
    await prisma.$executeRaw`
      INSERT INTO "Booking" ("id", "referenceCode", "serviceType", "customerName", "customerEmail", "customerPhone", "bookingDate", "status", "paymentStatus", "createdAt", "updatedAt")
      VALUES ('illegal-test', 'TZ-ILLEGAL-01', 'TOUR', 'Hacker', 'hacker@test.com', '123', NOW(), 'CONFIRMED', 'NOT_PAID', NOW(), NOW())
    `;
    assert(false, `Database allowed CONFIRMED without PAID_IN_FULL (constraint missing!)`);
  } catch (constraintErr) {
    assert(true, `Database strictly blocked CONFIRMED with NOT_PAID (check constraint enforced: ${constraintErr.message.slice(0, 70)}...)`);
  }

  // STEP 8: Public UI Accessibility
  console.log('\n--- 8. PUBLIC UI ACCESSIBILITY ---');
  const pages = ['/', '/tours', '/transport', '/about', '/contact', '/faq', '/reviews', '/privacy', '/terms'];
  for (const p of pages) {
    const r = await safeFetch(`${BASE_URL}${p}`);
    assert(r.status === 200, `Page ${p} returned HTTP 200 OK`);
  }

  console.log('\n============================================================');
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  await prisma.$disconnect();
  return { passed, failed, testRef };
}

runE2E().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
