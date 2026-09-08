import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://127.0.0.1:3000';

async function runVerification() {
  console.log('--- STARTING PHASE B2 VERIFICATION SUITE ---\n');

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

  try {
    // 1. Test POST /api/bookings with TOUR variant (French guest)
    console.log('1. Testing Tour Booking submission (locale: fr)...');
    const tourPayload = {
      serviceType: 'TOUR',
      tourSlug: 'stone-town-walking-tour',
      tourDate: '2026-10-15',
      tourTime: '09:00 AM',
      numAdults: 2,
      numChildren: 1,
      pickupLocation: 'Park Hyatt Zanzibar, Stone Town',
      fullName: 'Amélie Laurent',
      email: 'amelie.laurent@example.fr',
      phone: '+33 6 12 34 56 78',
      country: 'France',
      specialRequests: 'Please arrange French-speaking guide if available.',
      locale: 'fr',
      honeypot: '',
    };

    const tourRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.1',
      },
      body: JSON.stringify(tourPayload),
    });

    const tourData = await tourRes.json();
    assert(tourRes.status === 200, `Tour booking returns 200 OK (got ${tourRes.status})`);
    assert(tourData.success === true, 'Tour response has success: true');
    assert(
      /^ZNZ-2026-[2-9A-Z]{6}$/.test(tourData.referenceCode),
      `Reference code matches ZNZ-2026-XXXXXX (${tourData.referenceCode})`
    );

    // Verify in database
    const dbTourBooking = await prisma.booking.findUnique({
      where: { referenceCode: tourData.referenceCode },
    });
    assert(dbTourBooking !== null, 'Tour booking exists in database');
    assert(dbTourBooking.status === 'REQUESTED', `Booking status is REQUESTED (got ${dbTourBooking?.status})`);
    assert(dbTourBooking.paymentStatus === 'NOT_PAID', `Payment status is NOT_PAID (got ${dbTourBooking?.paymentStatus})`);
    assert(dbTourBooking.locale === 'fr', `Locale stored is 'fr' (got ${dbTourBooking?.locale})`);
    assert(dbTourBooking.quotedPriceCents > 0, `quotedPriceCents snapshot is populated (${dbTourBooking?.quotedPriceCents})`);
    assert(dbTourBooking.totalPriceCents === dbTourBooking.quotedPriceCents, 'totalPriceCents matches quotedPriceCents');

    // Verify Audit Log
    const auditLogTour = await prisma.auditLog.findFirst({
      where: {
        entityType: 'Booking',
        entityId: dbTourBooking.id,
        action: 'BOOKING_CREATED',
      },
    });
    assert(auditLogTour !== null, 'AuditLog created with action BOOKING_CREATED');

    // Verify Notification rows
    // Allow brief time for async notification persistence
    await new Promise((r) => setTimeout(r, 600));
    const notifications = await prisma.notification.findMany({
      where: { bookingId: dbTourBooking.id },
    });
    assert(notifications.length >= 2, `Created ${notifications.length} notification audit rows (Tourist + Operator)`);

    // 2. Test POST /api/bookings with TRANSPORT variant (Arabic guest)
    console.log('\n2. Testing Transport Booking submission (locale: ar)...');
    const transportPayload = {
      serviceType: 'TRANSPORT',
      routeId: 'route-znz-nkw',
      transportDate: '2026-10-20',
      transportTime: '02:00 PM',
      passengers: 4,
      luggageCount: '4 Suitcases',
      pickupLocation: 'Abeid Amani Karume International Airport (ZNZ)',
      dropoffLocation: 'Riu Palace Zanzibar, Nungwi',
      fullName: 'Tariq Al-Mansoor',
      email: 'tariq.mansoor@example.ae',
      phone: '+971 50 123 4567',
      country: 'United Arab Emirates',
      specialRequests: 'Child booster seat needed please.',
      locale: 'ar',
      honeypot: '',
    };

    const transRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.2',
      },
      body: JSON.stringify(transportPayload),
    });

    const transData = await transRes.json();
    assert(transRes.status === 200, `Transport booking returns 200 OK (got ${transRes.status})`);
    assert(transData.success === true, 'Transport response has success: true');
    assert(
      /^ZNZ-2026-[2-9A-Z]{6}$/.test(transData.referenceCode),
      `Reference code format valid (${transData.referenceCode})`
    );

    const dbTransBooking = await prisma.booking.findUnique({
      where: { referenceCode: transData.referenceCode },
    });
    assert(dbTransBooking !== null, 'Transport booking exists in database');
    assert(dbTransBooking.status === 'REQUESTED', 'Transport status is REQUESTED');
    assert(dbTransBooking.paymentStatus === 'NOT_PAID', 'Transport paymentStatus is NOT_PAID');
    assert(dbTransBooking.locale === 'ar', `Transport locale is 'ar' (got ${dbTransBooking?.locale})`);
    assert(dbTransBooking.quotedPriceCents > 0, `Transport quotedPriceCents snapshot is ${dbTransBooking?.quotedPriceCents}`);

    // 3. Test Honeypot Spam Prevention
    console.log('\n3. Testing Honeypot Spam Prevention...');
    const botPayload = {
      serviceType: 'TOUR',
      tourSlug: 'stone-town-walking-tour',
      tourDate: '2026-10-15',
      tourTime: '09:00 AM',
      numAdults: 2,
      numChildren: 0,
      pickupLocation: 'Fake Hotel',
      fullName: 'Bot Spammer',
      email: 'bot@spam.com',
      phone: '+1 800 000 0000',
      country: 'United States',
      honeypot: 'http://spam-link.ru',
    };

    const botRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.3',
      },
      body: JSON.stringify(botPayload),
    });

    const botData = await botRes.json();
    assert(botRes.status === 200, 'Honeypot returns 200 quietly');
    assert(botData.referenceCode === 'ZNZ-2026-REQ-VERIFIED', 'Honeypot dummy reference returned');
    const botCheckDb = await prisma.booking.findFirst({
      where: { customerEmail: 'bot@spam.com' },
    });
    assert(botCheckDb === null, 'Spam booking was NOT written to database');

    // 4. Test Confirmation Page (SSR + Payment Instructions)
    console.log('\n4. Testing Confirmation Page (/book/confirmation/[reference])...');
    const confRes = await fetch(`${BASE_URL}/book/confirmation/${tourData.referenceCode}`, {
      headers: { 'Cookie': 'locale=fr' },
    });
    assert(confRes.status === 200, `Confirmation page loaded 200 OK (got ${confRes.status})`);
    const confHtml = await confRes.text();
    assert(confHtml.includes(tourData.referenceCode), 'Confirmation page displays booking reference code');
    assert(
      confHtml.includes('Amélie Laurent') || confHtml.includes('Am&eacute;lie Laurent'),
      'Confirmation page contains customer name'
    );
    assert(
      confHtml.includes('M-Pesa') || confHtml.includes('mpesa') || confHtml.includes('CRDB'),
      'Confirmation page contains payment details (M-Pesa / Bank)'
    );

    // 5. Test robots.txt
    console.log('\n5. Testing robots.txt...');
    const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
    assert(robotsRes.status === 200, `robots.txt loaded 200 OK (got ${robotsRes.status})`);
    const robotsTxt = await robotsRes.text();
    assert(robotsTxt.includes('Disallow: /book/confirmation/'), 'robots.txt disallows /book/confirmation/');
    assert(robotsTxt.includes('Disallow: /operator/'), 'robots.txt disallows /operator/');
    assert(robotsTxt.includes('Disallow: /platform/'), 'robots.txt disallows /platform/');
    assert(robotsTxt.includes('Disallow: /change-password'), 'robots.txt disallows /change-password');

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runVerification();
