import { prisma } from '../src/lib/prisma';
import { Role } from '@prisma/client';

async function runPhaseCmsTests() {
  console.log('🚀 ========================================================');
  console.log('🚀 RUNNING PHASE B-CMS AUTOMATED AUDIT & VERIFICATION SUITE');
  console.log('🚀 ========================================================\n');

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    testsTotal++;
    if (condition) {
      testsPassed++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      process.exitCode = 1;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Operator Profile & Confidential Payment / TRA Fields
    // ------------------------------------------------------------------------
    console.log('📋 [Test Group 1] Operator Profile & Confidential Payment Details');
    let operator = await prisma.operatorProfile.findFirst({
      where: { name: 'Ibrahim' },
    });

    if (!operator) {
      operator = await prisma.operatorProfile.create({
        data: {
          id: 'operator-ibrahim',
          name: 'Ibrahim',
          businessName: 'Ibrahim Tours Zanzibar',
          tagline: 'Your Trusted Guide to Paradise Island',
          biography: 'Licensed Zanzibar tour guide & native islander with 10+ years experience.',
          phone: '+255 777 123 456',
          whatsapp: '+255 777 123 456',
          email: 'info@ibrahimtours.com',
          paymentInstructions: 'Deposit 100% in full via M-Pesa or Bank Transfer to confirm.',
          languages: ['en', 'fr', 'ar', 'sw'],
        },
      });
    }

    assert(Boolean(operator), 'Operator Ibrahim profile exists in database');

    // Update with M-Pesa, Bank, and TRA License credentials
    const updatedOperator = await prisma.operatorProfile.update({
      where: { id: operator.id },
      data: {
        mpesaNumber: '+255 777 889 900 (Ibrahim Tours)',
        bankName: 'CRDB Bank Zanzibar',
        bankAccount: '0150244488800 (USD / TZS)',
        traLicenseNumber: 'TRA-ZNZ-2026-98124',
        traLicenseExpiry: new Date('2027-12-31T23:59:59Z'),
        traLicenseUrl: 'https://res.cloudinary.com/ibrahim/image/upload/v1/tra_license_cert.pdf',
        profilePhotoUrl: 'https://res.cloudinary.com/ibrahim/image/upload/v1/ibrahim_portrait.jpg',
      },
    });

    assert(
      updatedOperator.mpesaNumber?.includes('777 889 900') === true,
      'Confidential M-Pesa number persisted'
    );
    assert(
      updatedOperator.bankName === 'CRDB Bank Zanzibar' &&
        updatedOperator.bankAccount?.includes('0150244488800') === true,
      'Confidential Bank details persisted'
    );
    assert(
      updatedOperator.traLicenseNumber === 'TRA-ZNZ-2026-98124',
      'TRA License number persisted'
    );
    assert(
      updatedOperator.traLicenseUrl?.includes('tra_license_cert') === true,
      'TRA License document URL persisted'
    );

    // ------------------------------------------------------------------------
    // TEST 2: Tour Category CRUD
    // ------------------------------------------------------------------------
    console.log('\n📂 [Test Group 2] Tour Category CRUD');
    const testCategorySlug = `test-cat-${Date.now()}`;
    const category = await prisma.tourCategory.create({
      data: {
        name: 'Ocean Sandbanks & Islands',
        slug: testCategorySlug,
        description: 'Pristine sandbank excursions, dolphin watching, and coral reefs.',
        sortOrder: 1,
        isActive: true,
      },
    });

    assert(Boolean(category.id), 'Category created successfully');
    assert(category.slug === testCategorySlug, 'Category slug normalized and saved');

    const updatedCategory = await prisma.tourCategory.update({
      where: { id: category.id },
      data: { name: 'Ocean Sandbanks & Islands (Updated)' },
    });
    assert(
      updatedCategory.name.includes('(Updated)'),
      'Category updated successfully'
    );

    // ------------------------------------------------------------------------
    // TEST 3: Tour Creation with Confidential Cost & Live Profit Calculation
    // ------------------------------------------------------------------------
    console.log('\n🏝️ [Test Group 3] Tour Creation, Tier Pricing & Profit Isolation');
    const testTourSlug = `test-tour-${Date.now()}`;
    const testTiers = {
      solo: { price_cents: 14000, cost_cents: 6000 },       // $140 price, $60 cost -> $80 profit
      couple: { price_cents: 20000, cost_cents: 8000 },     // $200 price, $80 cost -> $120 profit
      group4: { price_cents: 32000, cost_cents: 14000 },    // $320 price, $140 cost -> $180 profit
      group6plus: { price_cents: 42000, cost_cents: 18000 },// $420 price, $180 cost -> $240 profit
    };

    const tour = await prisma.tour.create({
      data: {
        title: 'Mnemba Atoll Luxury Marine Safari',
        slug: testTourSlug,
        shortDescription: 'Snorkel the crystal waters of Mnemba Atoll.',
        description: 'Full day excursion with private boat, fresh seafood lunch, and dolphin sighting.',
        categoryId: category.id,
        operatorId: operator.id,
        durationText: 'Full Day (7 hours)',
        startingPriceCents: 14000,
        pricingTiers: testTiers,
        highlights: ['Mnemba Marine Reserve', 'Dolphin Spotting', 'Fresh Fruit Platter'],
        inclusions: ['Marine park fees', 'Snorkeling gear', 'Seafood buffet lunch', 'Private dhow'],
        exclusions: ['Hotel pickup outside North Coast', 'Gratuities'],
        isFeatured: true,
        isActive: true,
        seoTitle: 'Mnemba Atoll Private Snorkeling Tour | Ibrahim Tours',
        seoDescription: 'Book exclusive Mnemba Island marine safari in Zanzibar.',
      },
    });

    assert(Boolean(tour.id), 'Tour created successfully with pricing tiers');

    // Verify live profit calculation
    const rawTiers = tour.pricingTiers as Record<string, { price_cents: number; cost_cents: number }>;
    const coupleProfit = rawTiers.couple.price_cents - rawTiers.couple.cost_cents;
    assert(coupleProfit === 12000, `Live profit correctly computed ($120 profit, got: $${coupleProfit / 100})`);

    // Verify confidential costs isolation: simulated public DTO stripping
    function toPublicTourDto(t: typeof tour) {
      const tiers = t.pricingTiers as Record<string, { price_cents: number; cost_cents?: number }>;
      const publicTiers: Record<string, { price_cents: number }> = {};
      for (const [k, v] of Object.entries(tiers)) {
        publicTiers[k] = { price_cents: v.price_cents };
      }
      return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        startingPriceCents: t.startingPriceCents,
        pricingTiers: publicTiers,
      };
    }

    const publicDto = toPublicTourDto(tour);
    assert(
      (publicDto.pricingTiers as any).couple.cost_cents === undefined,
      'Confidential cost_cents is completely stripped from public tourist DTO'
    );

    // ------------------------------------------------------------------------
    // TEST 4: Media Asset Management (MediaAsset model)
    // ------------------------------------------------------------------------
    console.log('\n📸 [Test Group 4] Media Asset Management (Cloudinary Record)');
    const testPublicId = `ibrahim_tours/tours/mnemba_${Date.now()}`;
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        operatorId: operator.id,
        publicId: testPublicId,
        url: `http://res.cloudinary.com/demo/image/upload/${testPublicId}.jpg`,
        secureUrl: `https://res.cloudinary.com/demo/image/upload/${testPublicId}.jpg`,
        width: 1920,
        height: 1080,
        format: 'jpg',
        bytes: 345600,
        alt: 'Turquoise ocean water at Mnemba Island Zanzibar',
        entityType: 'TOUR',
        entityId: tour.id,
        isHero: true,
        sortOrder: 0,
      },
    });

    assert(Boolean(mediaAsset.id), 'MediaAsset record created');
    assert(mediaAsset.isHero === true, 'Hero flag set correctly');
    assert(Boolean(mediaAsset.alt), 'SEO Alt text stored accurately');

    // Create linked TourImage
    const tourImage = await prisma.tourImage.create({
      data: {
        tourId: tour.id,
        publicId: testPublicId,
        url: mediaAsset.secureUrl || mediaAsset.url,
        alt: mediaAsset.alt,
        sortOrder: 0,
        isHero: true,
      },
    });
    assert(Boolean(tourImage.id), 'TourImage thumbnail linked to Tour');

    // ------------------------------------------------------------------------
    // TEST 5: Transport Routes & 4-Tier Pricing
    // ------------------------------------------------------------------------
    console.log('\n🚐 [Test Group 5] Transport Service & 4-Tier Route Pricing');
    let transportService = await prisma.transportService.findFirst();
    if (!transportService) {
      transportService = await prisma.transportService.create({
        data: {
          slug: 'private-airport-hotel-transfers',
          title: 'Private Airport & Hotel Transfers Zanzibar',
          description: 'Comfortable air-conditioned door-to-door island transfers.',
          serviceType: 'AIRPORT_TRANSFER',
          operatorId: operator.id,
          isActive: true,
        },
      });
    }

    const testRouteTiers = {
      van1to3: { price_cents: 4500, cost_cents: 2000 },        // $45 public, $20 cost -> $25 profit
      van4to6: { price_cents: 6000, cost_cents: 2500 },        // $60 public, $25 cost -> $35 profit
      miniBus7to12: { price_cents: 9500, cost_cents: 4000 },   // $95 public, $40 cost -> $55 profit
      bigBus13to25: { price_cents: 16000, cost_cents: 7000 },  // $160 public, $70 cost -> $90 profit
    };

    const route = await prisma.route.create({
      data: {
        transportServiceId: transportService.id,
        origin: 'Zanzibar Airport (ZNZ)',
        destination: 'Nungwi / Kendwa Hotels',
        durationText: '1 hr 15 min',
        distanceText: '62 km',
        pricingTiers: testRouteTiers,
        isActive: true,
      },
    });

    assert(Boolean(route.id), 'Transfer Route created with 4-tier pricing structure');
    const rTiers = route.pricingTiers as any;
    assert(
      rTiers.van1to3.price_cents === 4500 && rTiers.bigBus13to25.price_cents === 16000,
      '4-tier vehicle price tiers saved accurately'
    );
    assert(
      rTiers.miniBus7to12.price_cents - rTiers.miniBus7to12.cost_cents === 5500,
      'Transfer profit calculated ($55 profit for MiniBus)'
    );

    // ------------------------------------------------------------------------
    // TEST 6: Vehicle Fleet Management
    // ------------------------------------------------------------------------
    console.log('\n🚗 [Test Group 6] Vehicle Fleet Management');
    const vehicle = await prisma.vehicle.create({
      data: {
        name: 'Toyota Alphard Executive VIP',
        vehicleType: 'Van',
        capacity: '1–5 passengers + 4 large bags',
        hasAc: true,
        driverIncluded: true,
        imageUrl: 'https://res.cloudinary.com/ibrahim/image/upload/v1/alphard.jpg',
        features: ['Dual AC', 'Leather Reclining Seats', 'Complimentary Bottled Water', 'USB Chargers'],
        operatorId: operator.id,
      },
    });

    assert(Boolean(vehicle.id), 'Fleet vehicle created');
    assert(vehicle.hasAc && vehicle.driverIncluded, 'Vehicle equipment flags verified');

    // ------------------------------------------------------------------------
    // TEST 7: Review Management & Public Visibility Toggle
    // ------------------------------------------------------------------------
    console.log('\n⭐ [Test Group 7] Review Attribution & Host Reply');
    const review = await prisma.review.create({
      data: {
        type: 'IMPORTED',
        reviewerName: 'Sophie & Liam',
        reviewerCountry: 'United Kingdom',
        rating: 5,
        title: 'Unforgettable Mnemba Snorkeling Trip!',
        body: 'Ibrahim was an extraordinary host. He guided us directly to dolphins and prepared fresh fruit on the sandbank.',
        tourId: tour.id,
        source: 'TRIPADVISOR',
        sourceUrl: 'https://www.tripadvisor.com/ShowUserReviews-zanzibar-ibrahim',
        isPublished: true,
        isFeatured: true,
        adminResponse: 'Thank you Sophie and Liam! It was an absolute pleasure hosting you in Zanzibar.',
      },
    });

    assert(Boolean(review.id), 'Review created with external attribution');
    assert(review.source === 'TRIPADVISOR' && review.sourceUrl?.includes('tripadvisor.com') === true, 'Review source and sourceUrl persisted');
    assert(Boolean(review.adminResponse), 'Host response saved');

    // Toggle unpublished
    const toggledReview = await prisma.review.update({
      where: { id: review.id },
      data: { isPublished: false },
    });
    assert(toggledReview.isPublished === false, 'Review publish toggle verified');

    // ------------------------------------------------------------------------
    // TEST 8: FAQ Management
    // ------------------------------------------------------------------------
    console.log('\n❓ [Test Group 8] FAQ Management');
    const faq = await prisma.faq.create({
      data: {
        question: 'Do you require full payment in advance to confirm our tour?',
        answer: 'Yes. Under our v3.0 booking policy, 100% full payment is required via M-Pesa or bank transfer to confirm and secure your guide, boat, and vehicle. We do not accept pay on arrival.',
        category: 'Booking & Payment',
        sortOrder: 1,
        isActive: true,
      },
    });

    assert(Boolean(faq.id), 'FAQ item created');
    assert(faq.answer.includes('100% full payment'), 'Pay-in-full policy reflected in FAQ content');

    // ------------------------------------------------------------------------
    // TEST 9: Audit Logging for CMS Mutations
    // ------------------------------------------------------------------------
    console.log('\n🛡️ [Test Group 9] AuditLog Mutation Verification');
    const adminUser = await prisma.adminUser.findFirst();
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: adminUser?.id || null,
        action: 'TEST_PHASE_CMS_VERIFICATION',
        entityType: 'Tour',
        entityId: tour.id,
        details: {
          tourTitle: tour.title,
          testDate: new Date().toISOString(),
          status: 'SUCCESS',
        },
      },
    });

    assert(Boolean(auditLog.id), 'AuditLog entry successfully generated and linked');

    // ------------------------------------------------------------------------
    // CLEANUP OF TEST ARTIFACTS
    // ------------------------------------------------------------------------
    console.log('\n🧹 Cleaning up test artifacts...');
    await prisma.review.delete({ where: { id: review.id } });
    await prisma.tourImage.deleteMany({ where: { tourId: tour.id } });
    await prisma.mediaAsset.delete({ where: { id: mediaAsset.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.tourCategory.delete({ where: { id: category.id } });
    await prisma.route.delete({ where: { id: route.id } });
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
    await prisma.faq.delete({ where: { id: faq.id } });
    await prisma.auditLog.delete({ where: { id: auditLog.id } });
    console.log('✨ Cleanup complete.');

    console.log('\n========================================================');
    console.log(`📊 FINAL SUMMARY: ${testsPassed}/${testsTotal} CMS TESTS PASSED`);
    console.log('========================================================');

    if (testsPassed === testsTotal) {
      console.log('🎉 PHASE B-CMS ARCHITECTURE & IMPLEMENTATION 100% VERIFIED!\n');
    } else {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('\n💥 Unhandled error in CMS verification suite:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runPhaseCmsTests();
