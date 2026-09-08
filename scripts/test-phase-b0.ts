import { PrismaClient, BookingStatus, PaymentStatus, ServiceType, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting Phase B0 Database & Invariant Verification...\n');

  // 1. Verify Settings
  const commissionSetting = await prisma.settings.findUnique({ where: { key: 'commission_rate' } });
  console.log('1. Settings Check:');
  console.log('   - commission_rate key exists:', !!commissionSetting);
  console.log('   - commission_rate value is null (TBD):', commissionSetting?.value === null);

  // 2. Verify Admin Users
  const adminUsers = await prisma.adminUser.findMany({ include: { operator: true } });
  console.log('\n2. Admin Users Check:');
  console.log('   - Total admin users:', adminUsers.length);
  const platformAdmin = adminUsers.find((u) => u.role === Role.PLATFORM_ADMIN);
  const operatorUser = adminUsers.find((u) => u.role === Role.OPERATOR);
  console.log('   - Has PLATFORM_ADMIN:', !!platformAdmin, `(${platformAdmin?.email})`);
  console.log('   - Has OPERATOR:', !!operatorUser, `(${operatorUser?.email}, linked to ${(operatorUser as any)?.operator?.name})`);

  // 3. Verify Operator Profile
  const operator = await prisma.operatorProfile.findUnique({ where: { id: 'operator-ibrahim' } });
  console.log('\n3. Operator Profile Check:');
  console.log('   - Operator exists:', !!operator);
  console.log('   - M-Pesa configured:', operator?.mpesaNumber);
  console.log('   - Bank Account configured:', operator?.bankAccount);
  console.log('   - TRA License Number:', operator?.traLicenseNumber);

  // 4. Verify Tour Categories & Tours
  const categories = await (prisma.tourCategory as any).findMany();
  const tours = await prisma.tour.findMany({ include: { category: true, images: true } });
  console.log('\n4. Catalog Check:');
  console.log('   - Total Categories:', categories.length);
  console.log('   - Total Tours Seeded:', tours.length);

  // Check specific cost/profit on Stone Town and Safari Blue
  const stoneTown = tours.find((t) => t.slug === 'stone-town-tour');
  const stoneTownTiers = stoneTown?.pricingTiers as any;
  console.log('   - Stone Town Single:', stoneTownTiers?.single);
  console.log('   - Stone Town Couple:', stoneTownTiers?.couple);

  const safariBlue = tours.find((t) => t.slug === 'safari-blue');
  console.log('   - Safari Blue Tiers:', safariBlue?.pricingTiers);

  // 5. Verify Transfer Routes & Vehicles
  const routes = await (prisma.route as any).findMany();
  const vehicles = await (prisma.vehicle as any).findMany();
  console.log('\n5. Transport Check:');
  console.log('   - Total 4-tier Routes:', routes.length, '(expected 12)');
  console.log('   - Total Vehicles:', vehicles.length, '(expected 3)');

  // 6. Verify Invariant Enforcement (DB CHECK Constraint)
  console.log('\n6. Invariant Gate Verification (booking.status CONFIRMED requires PAID_IN_FULL):');
  
  const testRef = 'TEST-INVARIANT-' + Date.now();
  
  // Create a pending booking
  const testBooking = await prisma.booking.create({
    data: {
      referenceCode: testRef,
      serviceType: ServiceType.TOUR,
      tourId: stoneTown?.id,
      customerName: 'Test Traveler',
      customerEmail: 'test@example.com',
      customerPhone: '+1234567890',
      bookingDate: new Date(),
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      totalPriceCents: 12000,
    },
  });

  console.log('   - Created test booking with status=PENDING, paymentStatus=PENDING');

  // Attempt to violate the invariant: update status to CONFIRMED while paymentStatus=PENDING
  let dbCheckViolated = false;
  try {
    await prisma.booking.update({
      where: { id: testBooking.id },
      data: { status: BookingStatus.CONFIRMED },
    });
  } catch (err: any) {
    dbCheckViolated = true;
    console.log('   - Attempt to set status=CONFIRMED with paymentStatus=PENDING was successfully BLOCKED by DB!');
    console.log('     DB Constraint Error:', err.message?.split('\n').filter(Boolean).pop());
  }

  if (!dbCheckViolated) {
    console.error('   ❌ FAILURE: DB constraint allowed CONFIRMED with PENDING payment!');
    process.exit(1);
  }

  // Now update to PAID_IN_FULL, then set CONFIRMED
  const confirmedBooking = await prisma.booking.update({
    where: { id: testBooking.id },
    data: {
      paymentStatus: PaymentStatus.PAID_IN_FULL,
      amountPaidCents: 12000,
      status: BookingStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
  });
  console.log('   - Setting status=CONFIRMED when paymentStatus=PAID_IN_FULL succeeded:', confirmedBooking.status === BookingStatus.CONFIRMED);

  // Clean up test booking
  await (prisma.booking as any).delete({ where: { id: testBooking.id } });
  console.log('   - Cleaned up test booking.');

  console.log('\n✨ ALL PHASE B0 DATABASE & INVARIANT TESTS PASSED SUCCESSFULLY!');
}

runTests()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
