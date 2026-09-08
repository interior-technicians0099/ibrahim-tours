/**
 * Seed script for Ibrahim Tours Zanzibar
 */
import { PrismaClient, Prisma, Role, ServiceType, BookingStatus, PaymentStatus, ReviewType } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Ibrahim Tours Zanzibar Database Seed...');

  // 1. Settings (commission_rate = null TBD)
  console.log('⚙️ Seeding Settings...');
  await prisma.settings.upsert({
    where: { key: 'commission_rate' },
    update: {},
    create: {
      key: 'commission_rate',
      value: Prisma.JsonNull, // TBD: Set by Platform Admin
      description: 'Default platform commission rate applied to operator net profit.',
    },
  });

  // 2. Operator Profile (Ibrahim)
  console.log('👤 Seeding Operator Profile...');
  const operatorData = {
    id: 'operator-ibrahim',
    name: 'Ibrahim',
    businessName: 'Ibrahim Tours Zanzibar',
    tagline: 'Your Trusted Guide to Paradise Island',
    biography:
      'Born and raised in Zanzibar, Ibrahim has guided travelers across Unguja for over a decade. His passion for Swahili culture, deep knowledge of coral reefs, and fluent multilingual communication ensure authentic, 5-star island experiences.',
    shortBio: 'Licensed Zanzibar tour guide & native islander with 10+ years of 5-star experience.',
    profilePhotoUrl: '/images/ibrahim-profile.webp',
    yearsExperience: 10,
    languages: ['English', 'Swahili', 'Italian'],
    phone: '+255700000000',
    whatsapp: '255700000000',
    email: 'info@ibrahimtours.co.tz',
    socials: {
      facebook: 'https://facebook.com/ibrahimtourszanzibar',
      instagram: 'https://instagram.com/ibrahimtours_zanzibar',
    },
    paymentInstructions:
      'Your booking request has been reviewed and confirmed. To secure your reservation, please send the full payment to the M-Pesa number or Bank Account provided below. Your booking is confirmed only when full payment is received.',
    paymentNotes: 'Always verify the payment reference number before sending the final confirmation voucher.',
    mpesaNumber: '+255 700 000 000 (Vodacom M-Pesa)',
    bankName: 'CRDB Bank Tanzania',
    bankAccount: '0150 0000 0000 0 (Ibrahim Tours)',
    traLicenseNumber: 'TRA-ZNZ-2024-8841',
    traLicenseExpiry: new Date('2026-12-31T23:59:59Z'),
    traLicenseUrl: '/licenses/tra-license-ibrahim.pdf',
    commissionRate: null, // Inherit from global settings
  };

  const ibrahimProfile = await prisma.operatorProfile.upsert({
    where: { id: 'operator-ibrahim' },
    update: operatorData,
    create: operatorData,
  });

  // 3. Admin Users (Platform Admin + Ibrahim Operator)
  console.log('🔐 Seeding Admin Users (argon2id)...');
  const defaultAdminHash = await hash('AdminPass123!');
  const defaultOperatorHash = await hash('IbrahimTour2026!');

  await prisma.adminUser.upsert({
    where: { email: 'admin@ibrahimtours.co.tz' },
    update: {
      name: 'Platform SuperAdmin',
      passwordHash: defaultAdminHash,
      role: Role.PLATFORM_ADMIN,
      isActive: true,
      mustChangePassword: true,
    },
    create: {
      email: 'admin@ibrahimtours.co.tz',
      name: 'Platform SuperAdmin',
      passwordHash: defaultAdminHash,
      role: Role.PLATFORM_ADMIN,
      isActive: true,
      mustChangePassword: true,
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'ibrahim@ibrahimtours.co.tz' },
    update: {
      name: 'Ibrahim (Operator)',
      passwordHash: defaultOperatorHash,
      role: Role.OPERATOR,
      operatorId: ibrahimProfile.id,
      isActive: true,
      mustChangePassword: true,
    },
    create: {
      email: 'ibrahim@ibrahimtours.co.tz',
      name: 'Ibrahim (Operator)',
      passwordHash: defaultOperatorHash,
      role: Role.OPERATOR,
      operatorId: ibrahimProfile.id,
      isActive: true,
      mustChangePassword: true,
    },
  });

  // 4. Tour Categories
  console.log('📂 Seeding Tour Categories...');
  const categoryDefs = [
    { slug: 'sea-water', name: 'Sea & Water', sortOrder: 1 },
    { slug: 'city-cultural', name: 'City & Cultural', sortOrder: 2 },
    { slug: 'nature-wildlife', name: 'Nature & Wildlife', sortOrder: 3 },
    { slug: 'island-experiences', name: 'Island Experiences', sortOrder: 4 },
    { slug: 'beach-island', name: 'Beach & Island', sortOrder: 5 },
    { slug: 'full-day-combos', name: 'Full Day Combos', sortOrder: 6 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryDefs) {
    const created = await prisma.tourCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { slug: cat.slug, name: cat.name, sortOrder: cat.sortOrder, isActive: true },
    });
    categoryMap[cat.name] = created.id;
  }

  // 5. Tours & Day Combos (Private cost & profit embedded in pricingTiers)
  console.log('🏝️ Seeding Tours & Pricing Tiers (Private Cost/Profit)...');
  const toursData = [
    {
      slug: 'stone-town-tour',
      title: 'Stone Town Tour (City Walk)',
      categoryName: 'City & Cultural',
      durationText: 'Half Day',
      startingPriceCents: 12000,
      description:
        'Immerse yourself in centuries of Swahili, Arabic, Persian, and European history. Walk through the narrow winding alleys of Stone Town, see the House of Wonders, the Old Fort, the former Slave Market site, and bustling local bazaars with your private licensed guide.',
      pricingTiers: {
        single: { priceCents: 12000, costCents: 9000, profitCents: 3000 },
        couple: { priceCents: 16000, costCents: 10000, profitCents: 6000 },
        group5to10: { priceCents: 4000, costCents: null, profitCents: null, note: 'per person' },
      },
      highlights: [
        'Historic UNESCO World Heritage alleys',
        'Former Slave Market & Anglican Cathedral',
        'Freddie Mercury birthplace & House of Wonders',
        'Authentic Darajani spice and fruit market',
      ],
      inclusions: [
        'Museum entrance tickets',
        'Hotel transfer (Stone Town area)',
        'Professional licensed local guide',
        '1 soft drink & mineral water per person',
      ],
      image: '/images/stone-town.webp',
      isFeatured: false,
    },
    {
      slug: 'prison-island',
      title: 'Prison Island (Giant Tortoises)',
      categoryName: 'City & Cultural',
      durationText: 'Half Day',
      startingPriceCents: 15500,
      description:
        'Take a scenic 30-minute wooden boat ride across azure waters to Prison Island. Discover the historical quarantine station built in 1893 and spend quality time feeding and interacting with giant Aldabra tortoises, some older than 150 years.',
      pricingTiers: {
        single: { priceCents: 15500, costCents: 12500, profitCents: 3000 },
        couple: { priceCents: 19000, costCents: 15000, profitCents: 4000 },
        group5to10: { priceCents: 9400, costCents: 6400, profitCents: 3000, note: 'per person' },
      },
      highlights: [
        'Aldabra giant tortoises interaction & feeding',
        'Historical 1893 prison & quarantine ruins',
        'Crystal-clear turquoise coastal waters',
        'Panoramic ocean views back to Stone Town',
      ],
      inclusions: [
        'Marine conservation fees',
        'Island entrance ticket',
        'Private traditional wooden boat ride',
        'Roundtrip hotel transfers',
        'Professional private guide',
        'Soft drink & mineral water',
      ],
      image: '/images/prison-island.webp',
      isFeatured: false,
    },
    {
      slug: 'nakupenda-sandbank',
      title: 'Nakupenda White Sandbank',
      categoryName: 'Sea & Water',
      durationText: 'Half Day',
      startingPriceCents: 17500,
      description:
        'Sail out to the famous Nakupenda ("I Love You") sandbank. Bask in the sun, swim in crystalline warm waters, snorkel over vibrant coral gardens, and savor fresh tropical fruits and light snacks served right on the beach.',
      pricingTiers: {
        single: { priceCents: 17500, costCents: 14500, profitCents: 3000 },
        couple: { priceCents: 21000, costCents: 17000, profitCents: 4000 },
        group5to10: { priceCents: 9700, costCents: 7700, profitCents: 2000, note: 'per person' },
      },
      highlights: [
        'Pristine white sandbank emerging at low tide',
        'World-class snorkeling among colorful reef fish',
        'Fresh mangoes, pineapples, watermelon & coconuts',
        'Private sun tent shade setup',
      ],
      inclusions: [
        'Marine conservation fees',
        'Private boat charter',
        'Hotel pickup and drop-off',
        'Fresh tropical fruits, snacks & soft drinks',
        'Professional guide & snorkeling gear',
      ],
      image: '/images/nakupenda.webp',
      isFeatured: false,
    },
    {
      slug: 'town-full-day-combo',
      title: 'Town Full Day Combo (Stone Town + Prison + Sandbank)',
      categoryName: 'Full Day Combos',
      durationText: 'Full Day',
      startingPriceCents: 19000,
      description:
        'The comprehensive Zanzibar day trip! Start with a guided historic walk through Stone Town, cruise to Prison Island to feed the giant tortoises, and end the afternoon unwinding on the breathtaking Nakupenda Sandbank with an abundant seafood lunch.',
      pricingTiers: {
        single: { priceCents: 19000, costCents: null, profitCents: null, note: 'set in admin' },
        couple: { priceCents: 23000, costCents: null, profitCents: null, note: 'set in admin' },
        group5to10: { priceCents: 10000, costCents: null, profitCents: null, note: 'set in admin - per person' },
        group20: { priceCents: 6000, costCents: null, profitCents: null, note: 'set in admin - per person' },
      },
      highlights: [
        'All 3 top attractions in one seamless day',
        'Grilled seafood feast (lobster, calamari, fish)',
        'Rich culture + exotic wildlife + ocean relaxation',
        'All transfer logistics taken care of by Ibrahim',
      ],
      inclusions: [
        'Stone Town museum & historical site fees',
        'Prison Island entry ticket',
        'Marine conservation fees',
        'Private dhow boat charter',
        'Roundtrip hotel transfers',
        'Fresh seafood lunch & tropical fruit platter',
        'Professional English/Italian/Swahili guide',
        'Soft drinks & bottled water throughout',
      ],
      image: '/images/stone-town-prison-island.webp',
      isFeatured: true,
    },
    {
      slug: 'mnemba-island',
      title: 'Mnemba Island (Swim with Dolphins)',
      categoryName: 'Sea & Water',
      durationText: 'Full Day',
      startingPriceCents: 15800,
      description:
        'Cruise to the marine conservation sanctuary of Mnemba Atoll. Experience prime snorkeling with tropical fish species, stingrays, and sea turtles, with a high chance of spotting and swimming alongside wild dolphins in their natural habitat.',
      pricingTiers: {
        single: { priceCents: 15800, costCents: 12800, profitCents: 3000 },
        couple: { priceCents: 18200, costCents: 14200, profitCents: 4000 },
        group5to10: { priceCents: 8300, costCents: 6300, profitCents: 2000, note: 'per person' },
      },
      highlights: [
        'Premier coral reef snorkeling spot in East Africa',
        'Wild dolphin spotting in Muyuni / Matemwe Bay',
        'Crystal clear 20+ meter visibility waters',
        'Fresh coconut water & sweet seasonal fruits',
      ],
      inclusions: [
        'Marine conservation & park fees',
        'Private speedboat transfer to Mnemba Reef',
        'Hotel pickup & drop-off',
        'Fresh tropical fruits & chilled soft drinks',
        'Professional guide & snorkeling gear',
      ],
      image: '/images/mnemba-island.webp',
      isFeatured: true,
    },
    {
      slug: 'spice-tour',
      title: 'Spice Tour',
      categoryName: 'City & Cultural',
      durationText: 'Half Day',
      startingPriceCents: 10500,
      description:
        'Discover why Zanzibar is known as the "Spice Island." Walk through lush tropical spice plantations, witness how local farmers harvest spices, taste exotic fruits, and receive a handmade palm leaf hat and necklace.',
      pricingTiers: {
        single: { priceCents: 10500, costCents: 8500, profitCents: 2000 },
        couple: { priceCents: 12000, costCents: 9000, profitCents: 3000 },
        group5to10: { priceCents: 5000, costCents: 3500, profitCents: 1500, note: 'per person' },
      },
      highlights: [
        'Smell and taste raw cloves, cardamom, black pepper & vanilla',
        'Coconut tree climbing performance ("Butterfly Man")',
        'Traditional palm leaf crafts & crown gifts',
        'Opportunity to purchase fresh farm spices directly',
      ],
      inclusions: [
        'Organic spice farm entrance fee',
        'Roundtrip hotel transfer',
        'Expert local spice botanist guide',
        'Fresh exotic fruit tasting & 1 soft drink',
      ],
      image: '/images/spice-tour.webp',
      isFeatured: false,
    },
    {
      slug: 'dhow-sunset-cruise',
      title: 'Dhow Sunset Cruise',
      categoryName: 'Sea & Water',
      durationText: 'Half Day',
      startingPriceCents: 12000,
      description:
        'Step aboard a traditional Swahili dhow as the late afternoon breeze picks up. Glide along the coast of Stone Town or Kendwa, listening to gentle acoustic Swahili rhythms while sipping drinks and watching the sky turn brilliant gold and crimson.',
      pricingTiers: {
        single: { priceCents: 12000, costCents: 10000, profitCents: 2000 },
        couple: { priceCents: 15000, costCents: 12000, profitCents: 3000 },
        group5to10: { priceCents: 6200, costCents: 4200, profitCents: 2000, note: 'per person' },
      },
      highlights: [
        'Breathtaking Indian Ocean sunset panorama',
        'Authentic handcrafted wooden sailing vessel',
        'Relaxing Swahili coastal atmosphere',
        'Ideal for couples, honeymooners and families',
      ],
      inclusions: [
        'Traditional wooden dhow cruise',
        'Soft drinks, chilled juices & tropical fruit platter',
        'Roundtrip hotel transfer',
        'Experienced captain & local guide',
      ],
      image: '/images/sunset-cruise.webp',
      isFeatured: false,
    },
    {
      slug: 'north-full-day-combo',
      title: 'North Full Day Combo (Mnemba + Spice + Dhow Sunset)',
      categoryName: 'Full Day Combos',
      durationText: 'Full Day',
      startingPriceCents: 19000,
      description:
        'A full day of tropical adventure in northern Zanzibar. Morning snorkeling at Mnemba Atoll with dolphins, midday journey through the aromatic spice plantations, and ending with a serene wooden dhow sunset cruise along the coastline.',
      pricingTiers: {
        single: { priceCents: 19000, costCents: null, profitCents: null, note: 'set in admin' },
        couple: { priceCents: 23000, costCents: null, profitCents: null, note: 'set in admin' },
        group5to10: { priceCents: 10000, costCents: null, profitCents: null, note: 'set in admin - per person' },
        group20: { priceCents: 7000, costCents: null, profitCents: null, note: 'set in admin - per person' },
      },
      highlights: [
        'Mnemba dolphin swim & coral reef snorkeling',
        'Hands-on spice tour with exotic fruit tastings',
        'Romantic dhow sunset sail on the ocean',
        'Maximum value multi-destination full-day itinerary',
      ],
      inclusions: [
        'Marine conservation fees & Mnemba boat',
        'Spice farm entrance fee & guided tour',
        'Evening dhow sunset cruise',
        'All roundtrip hotel transfers in private AC vehicle',
        'Tropical fruits, refreshments & soft drinks',
        'Full-day private guide with Ibrahim',
      ],
      image: '/images/north-combo.webp',
      isFeatured: false,
    },
    {
      slug: 'jozani-forest',
      title: 'Jozani Forest (Red Colobus Monkeys)',
      categoryName: 'Nature & Wildlife',
      durationText: 'Half Day',
      startingPriceCents: 12200,
      description:
        'Venture into Zanzibar’s only national park, Jozani Chwaka Bay. Get up-close views of the playful and habituated Red Colobus monkeys found nowhere else on earth, explore mahogany forest trails, and stroll along the mangrove boardwalk.',
      pricingTiers: {
        single: { priceCents: 12200, costCents: 9200, profitCents: 3000 },
        couple: { priceCents: 14400, costCents: 11400, profitCents: 3000 },
        group5to10: { priceCents: 5400, costCents: 3900, profitCents: 1500, note: 'per person' },
      },
      highlights: [
        'Endangered endemic Zanzibar Red Colobus monkeys',
        'Ancient mahogany and eucalyptus trees',
        'Elevated mangrove swamp boardwalk',
        'Rich birdlife, medicinal plants and butterflies',
      ],
      inclusions: [
        'Jozani National Park entry fees & conservation levy',
        'Roundtrip hotel transfer',
        'Official park ranger & private tour guide',
        '1 soft drink & bottled water',
      ],
      image: '/images/jozani-forest.webp',
      isFeatured: false,
    },
    {
      slug: 'salaam-cave',
      title: 'Salaam Cave (Swim with Sea Turtles)',
      categoryName: 'Nature & Wildlife',
      durationText: 'Half Day',
      startingPriceCents: 12200,
      description:
        'Visit the natural tidal pool of Salaam Cave (or Baraka Aquarium). Step into the clear sea water to hand-feed seaweed to gentle rescued green sea turtles and swim alongside these peaceful ancient marine creatures.',
      pricingTiers: {
        single: { priceCents: 12200, costCents: 9200, profitCents: 3000 },
        couple: { priceCents: 14400, costCents: 10400, profitCents: 4000 },
        group5to10: { priceCents: 7400, costCents: 5400, profitCents: 2000, note: 'per person' },
      },
      highlights: [
        'Direct swimming with rescued sea turtles',
        'Hand-feeding seaweed to friendly green turtles',
        'Unique natural coral stone tidal lagoon',
        'Educational conservation talk by local caretakers',
      ],
      inclusions: [
        'Salaam Cave conservation entrance fee',
        'Roundtrip hotel transfer',
        'Private guide & turtle feeding seaweed',
        '1 soft drink & bottled water',
      ],
      image: '/images/turtle-cave.webp',
      isFeatured: false,
    },
    {
      slug: 'the-rock-restaurant',
      title: 'The Rock Restaurant',
      categoryName: 'Island Experiences',
      durationText: 'Half Day',
      startingPriceCents: 9700,
      description:
        'Enjoy seamless private transportation to the iconic The Rock Restaurant at Michamvi Pingwe. At high tide, take a short wooden boat ride to the rock; at low tide, walk right across the exposed reef sands.',
      pricingTiers: {
        single: { priceCents: 9700, costCents: 8200, profitCents: 1500 },
        couple: { priceCents: 10500, costCents: 8500, profitCents: 2000 },
        group5to10: { priceCents: 3500, costCents: 2300, profitCents: 1200, note: 'per person' },
      },
      highlights: [
        'Zanzibar’s most photographed landmark restaurant',
        'Panoramic 360-degree ocean views from the terrace',
        'Combine with relaxation on gorgeous Michamvi beach',
        'Stress-free roundtrip private transfer',
      ],
      inclusions: [
        'Private roundtrip hotel transfer to Michamvi',
        'Table booking coordination assistance',
        'Professional driver / local escort',
      ],
      image: '/images/the-rock.webp',
      isFeatured: true,
    },
    {
      slug: 'south-full-day-combo',
      title: 'South Full Day Combo (Jozani + Salaam + The Rock)',
      categoryName: 'Full Day Combos',
      durationText: 'Full Day',
      startingPriceCents: 15000,
      description:
        'The definitive South & East coast exploration! Start the morning with the monkeys of Jozani Forest, swim with the rescued sea turtles at Salaam Cave, and spend the afternoon and sunset at Michamvi beach and The Rock Restaurant.',
      pricingTiers: {
        single: { priceCents: 15000, costCents: null, profitCents: null, note: 'set in admin' },
        couple: { priceCents: 20000, costCents: null, profitCents: null, note: 'set in admin' },
        group5to10: { priceCents: 8000, costCents: null, profitCents: null, note: 'set in admin - per person' },
        group20: { priceCents: 6000, costCents: null, profitCents: null, note: 'set in admin - per person' },
      },
      highlights: [
        'Wildlife encounters: monkeys and sea turtles',
        'Visit the world-famous Rock Restaurant in Michamvi',
        'Private, comfortable, air-conditioned vehicle all day',
        'Customizable pacing for family or romantic couples',
      ],
      inclusions: [
        'Jozani National Park entrance fee',
        'Salaam Cave entrance fee & turtle feeding',
        'Michamvi / The Rock Restaurant transfer',
        'Roundtrip hotel transfers in private AC vehicle',
        'Professional guide with Ibrahim',
        'Soft drinks & mineral water',
      ],
      image: '/images/south-combo.webp',
      isFeatured: false,
    },
    {
      slug: 'safari-blue',
      title: 'Safari Blue (Snorkeling)',
      categoryName: 'Sea & Water',
      durationText: 'Full Day',
      startingPriceCents: 20000,
      description:
        'Departing from Fumba in Menai Bay Conservation Area, Safari Blue takes you on handcrafted wooden dhows to isolated sandbanks, prime snorkeling reefs, a hidden mangrove lagoon for swimming, and a desert island for a legendary grilled seafood lunch.',
      pricingTiers: {
        single: { priceCents: 20000, costCents: 17000, profitCents: 3000 },
        couple: { priceCents: 23000, costCents: 19000, profitCents: 4000 },
        group5to10: { priceCents: 7700, costCents: 6500, profitCents: 1200, note: 'per person' },
        group20: { priceCents: 6000, costCents: null, profitCents: null, note: 'set in admin - per person' },
      },
      highlights: [
        'Zanzibar’s most famous and acclaimed ocean excursion',
        'Spectacular sandbank lounging & reef snorkeling',
        'Mangrove lagoon natural swimming pool',
        'Giant 500-year-old baobab tree climb on Kwale Island',
      ],
      inclusions: [
        'Menai Bay marine conservation fees',
        'Handcrafted traditional sailing dhow charter',
        'Roundtrip hotel transfers',
        'Lavish seafood buffet (lobster, slipper lobster, fish, calamari)',
        'Exotic fruit tasting with 10+ tropical fruits',
        'Professional guides, snorkeling gear & life vests',
        'Soft drinks, mineral water & fresh juice',
      ],
      image: '/images/safari-blue.webp',
      isFeatured: true,
    },
    {
      slug: 'village-tour-cooking-class',
      title: 'Village Tour (Culture + Cooking Class)',
      categoryName: 'City & Cultural',
      durationText: 'Full Day',
      startingPriceCents: 16000,
      description:
        'Experience genuine Zanzibari hospitality away from the typical tourist routes. Walk through a traditional village, learn how locals weave palm roofs, grind cassava, and participate in a step-by-step Swahili cooking class using fresh farm ingredients and coconut milk.',
      pricingTiers: {
        single: { priceCents: 16000, costCents: 13000, profitCents: 3000 },
        couple: { priceCents: 18500, costCents: 14500, profitCents: 4000 },
        group5to10: { priceCents: 7200, costCents: 5700, profitCents: 1500, note: 'per person' },
        group20: { priceCents: 5000, costCents: null, profitCents: null, note: 'set in admin - per person' },
      },
      highlights: [
        'Genuine connection with local village families',
        'Learn Swahili cooking techniques (Pilau, Coconut Curry, Chapati)',
        'Support community-based sustainable tourism',
        'Take home authentic recipe secrets from Zanzibar',
      ],
      inclusions: [
        'Roundtrip private hotel transfer',
        'Professional local cultural guide',
        'Hands-on Swahili cooking masterclass',
        'Full multi-course lunch prepared in class',
        'Village community contribution & market visit',
        'Soft drinks & fresh coconut water',
      ],
      image: '/images/village-tour.webp',
      isFeatured: false,
    },
  ];

  for (const tour of toursData) {
    const categoryId = categoryMap[tour.categoryName];
    const createdTour = await prisma.tour.upsert({
      where: { slug: tour.slug },
      update: {
        title: tour.title,
        categoryId,
        operatorId: ibrahimProfile.id,
        durationText: tour.durationText,
        startingPriceCents: tour.startingPriceCents,
        pricingTiers: tour.pricingTiers,
        highlights: tour.highlights,
        inclusions: tour.inclusions,
        description: tour.description,
        isFeatured: tour.isFeatured,
      },
      create: {
        slug: tour.slug,
        title: tour.title,
        categoryId,
        operatorId: ibrahimProfile.id,
        durationText: tour.durationText,
        startingPriceCents: tour.startingPriceCents,
        currency: 'USD',
        pricingTiers: tour.pricingTiers,
        highlights: tour.highlights,
        inclusions: tour.inclusions,
        description: tour.description,
        isFeatured: tour.isFeatured,
        isActive: true,
      },
    });

    // Create Tour Hero Image
    await prisma.tourImage.deleteMany({ where: { tourId: createdTour.id } });
    await prisma.tourImage.create({
      data: {
        tourId: createdTour.id,
        url: tour.image,
        alt: tour.title,
        isHero: true,
        sortOrder: 0,
      },
    });
  }

  // 6. Transport Service & 12 Transfer Routes (4-tier pricing in cents)
  console.log('🚐 Seeding Transport Service & 12 Transfer Routes...');
  const transportService = await prisma.transportService.upsert({
    where: { slug: 'private-island-transfers' },
    update: {},
    create: {
      slug: 'private-island-transfers',
      title: 'Private Island Transfers & Airport Shuttles',
      description: 'Reliable, air-conditioned private transfers across Zanzibar with licensed professional drivers.',
      serviceType: 'AIRPORT_TRANSFER',
      operatorId: ibrahimProfile.id,
      isActive: true,
      isFeatured: true,
    },
  });

  const routesData = [
    { origin: 'Zanzibar Airport (ZNZ)', destination: 'Stone Town', distanceText: '10 km', durationText: '20–30 min', pricing: { van1to3: 2000, van4to6: 2500, miniBus7to12: 3500, bigBus13to25: 5000 } },
    { origin: 'Stone Town', destination: 'Zanzibar Airport (ZNZ)', distanceText: '10 km', durationText: '20–30 min', pricing: { van1to3: 2000, van4to6: 2500, miniBus7to12: 3500, bigBus13to25: 5000 } },
    { origin: 'Stone Town', destination: 'Nungwi / Kendwa', distanceText: '55 km', durationText: '1–1.5 h', pricing: { van1to3: 4000, van4to6: 4500, miniBus7to12: 7500, bigBus13to25: 10000 } },
    { origin: 'Nungwi / Kendwa', destination: 'Stone Town', distanceText: '55 km', durationText: '1–1.5 h', pricing: { van1to3: 4000, van4to6: 4500, miniBus7to12: 7500, bigBus13to25: 10000 } },
    { origin: 'Stone Town', destination: 'Paje / Jambiani', distanceText: '50 km', durationText: '1–1.5 h', pricing: { van1to3: 4000, van4to6: 4500, miniBus7to12: 7500, bigBus13to25: 10000 } },
    { origin: 'Paje / Jambiani', destination: 'Stone Town', distanceText: '50 km', durationText: '1–1.5 h', pricing: { van1to3: 4000, van4to6: 4500, miniBus7to12: 7500, bigBus13to25: 10000 } },
    { origin: 'Paje / Jambiani', destination: 'Nungwi / Kendwa', distanceText: '70 km', durationText: '1.5–2 h', pricing: { van1to3: 5000, van4to6: 6000, miniBus7to12: 7500, bigBus13to25: 10000 } },
    { origin: 'Nungwi / Kendwa', destination: 'Paje / Jambiani', distanceText: '70 km', durationText: '1.5–2 h', pricing: { van1to3: 5000, van4to6: 6000, miniBus7to12: 7500, bigBus13to25: 10000 } },
    { origin: 'Zanzibar Airport (ZNZ)', destination: 'Paje / Jambiani', distanceText: '50 km', durationText: '1–1.5 h', pricing: { van1to3: 5000, van4to6: 6000, miniBus7to12: 7500, bigBus13to25: 10000 } },
    { origin: 'Paje / Jambiani', destination: 'Zanzibar Airport (ZNZ)', distanceText: '50 km', durationText: '1–1.5 h', pricing: { van1to3: 5000, van4to6: 6000, miniBus7to12: 7500, bigBus13to25: 10000 } },
    { origin: 'Zanzibar Airport (ZNZ)', destination: 'Nungwi / Kendwa', distanceText: '65 km', durationText: '1.5 h', pricing: { van1to3: 5000, van4to6: 6000, miniBus7to12: 7500, bigBus13to25: 10000 } },
    { origin: 'Nungwi / Kendwa', destination: 'Zanzibar Airport (ZNZ)', distanceText: '65 km', durationText: '1.5 h', pricing: { van1to3: 5000, van4to6: 6000, miniBus7to12: 7500, bigBus13to25: 10000 } },
  ];

  await prisma.route.deleteMany({ where: { transportServiceId: transportService.id } });
  for (const route of routesData) {
    await prisma.route.create({
      data: {
        transportServiceId: transportService.id,
        origin: route.origin,
        destination: route.destination,
        distanceText: route.distanceText,
        durationText: route.durationText,
        pricingTiers: route.pricing,
        isActive: true,
      },
    });
  }

  // 7. Vehicles (3 vehicles)
  console.log('🚗 Seeding Vehicles...');
  await (prisma.vehicle as any).deleteMany({ where: { operatorId: ibrahimProfile.id } });
  const vehiclesData = [
    {
      name: 'Private Tourist Van',
      vehicleType: 'Van',
      capacity: '1–6 passengers',
      hasAc: true,
      driverIncluded: true,
      imageUrl: '/images/van.webp',
      features: [
        'Full Air Conditioning (A/C)',
        'Professional licensed English/Italian-speaking driver',
        'Spacious luggage boot for up to 6 large suitcases',
        'Clean, comfortable high-roof seating',
        'Bottled mineral water included',
      ],
    },
    {
      name: 'Executive Mini Bus',
      vehicleType: 'MiniBus',
      capacity: '7–12 passengers',
      hasAc: true,
      driverIncluded: true,
      imageUrl: '/images/minibus.webp',
      features: [
        'High-power Dual A/C system',
        'Experienced commercial tourism chauffeur',
        'Ample luggage compartment + roof rack option',
        'Reclining passenger seats with seatbelts',
        'Ideal for medium family and friends groups',
      ],
    },
    {
      name: 'Luxury Coach / Big Bus',
      vehicleType: 'BigBus',
      capacity: '13–25 passengers',
      hasAc: true,
      driverIncluded: true,
      imageUrl: '/images/bigbus.webp',
      features: [
        'Heavy-duty climate control cabin',
        'Professional driver + tour assistant on board',
        'Maximum luggage capacity for large tour groups',
        'Public address (PA) microphone system for guides',
        'Smooth suspension for island-wide transfers',
      ],
    },
  ];

  for (const v of vehiclesData) {
    await prisma.vehicle.create({
      data: {
        name: v.name,
        vehicleType: v.vehicleType,
        capacity: v.capacity,
        hasAc: v.hasAc,
        driverIncluded: v.driverIncluded,
        imageUrl: v.imageUrl,
        features: v.features,
        operatorId: ibrahimProfile.id,
        isActive: true,
      },
    });
  }

  // 8. Sample Reviews
  console.log('⭐ Seeding Reviews...');
  await (prisma.review as any).deleteMany({});
  const reviewsData = [
    {
      reviewerName: 'Sarah & James Jenkins',
      reviewerCountry: 'United Kingdom',
      rating: 5,
      title: 'Safari Blue & Stone Town Full Day',
      body: 'Booking with Ibrahim made our Zanzibar holiday seamless and unforgettable! He met us on time with a clean AC van, shared amazing stories about Stone Town, and the Safari Blue seafood lunch was simply out of this world. Booking through WhatsApp was instant and stress-free.',
      source: 'TripAdvisor',
      type: ReviewType.VERIFIED,
      isPublished: true,
      isFeatured: true,
    },
    {
      reviewerName: 'Marco Rossi & Famiglia',
      reviewerCountry: 'Italy',
      rating: 5,
      title: 'Mnemba Island & Spice Tour',
      body: 'Ibrahim parla un ottimo italiano ed è stato una guida fantastica per tutta la nostra famiglia! Abbiamo nuotato con i delfini a Mnemba e visitato le piantagioni di spezie. Prezzi chiarissimi, nessun costo nascosto e puntualità svizzera. Consigliatissimo a tutti gli italiani!',
      source: 'Direct',
      type: ReviewType.VERIFIED,
      isPublished: true,
      isFeatured: true,
    },
    {
      reviewerName: 'Astrid & Johan Lindqvist',
      reviewerCountry: 'Sweden',
      rating: 5,
      title: 'Airport Transfers & Jozani Forest',
      body: 'We booked both airport transfers and the Jozani Forest tour with Ibrahim. Communication on WhatsApp was super quick, driver was waiting right at the arrivals terminal with a name sign, and seeing the Red Colobus monkeys was magical. 10/10 service!',
      source: 'Google',
      type: ReviewType.VERIFIED,
      isPublished: true,
      isFeatured: true,
    },
  ];

  for (const rev of reviewsData) {
    await prisma.review.create({
      data: {
        reviewerName: rev.reviewerName,
        reviewerCountry: rev.reviewerCountry,
        rating: rev.rating,
        title: rev.title,
        body: rev.body,
        source: rev.source,
        type: rev.type,
        isPublished: rev.isPublished,
        isFeatured: rev.isFeatured,
      },
    });
  }

  // 9. FAQs
  console.log('❓ Seeding FAQs...');
  await (prisma.faq as any).deleteMany({});
  const faqsData = [
    {
      question: 'Do I pay online when submitting a booking request?',
      answer:
        'No, you do not need to pay via credit card on the website. After you submit your request, Ibrahim will personally confirm availability. You will then receive an M-Pesa number or Bank Transfer details to make your full payment. Your booking is only confirmed once full payment is received.',
      category: 'Booking & Payment',
      sortOrder: 1,
    },
    {
      question: 'How is my booking confirmed?',
      answer:
        'Once you submit a request form or send a WhatsApp message, Ibrahim personally verifies availability and responds within a short time with full pickup details, vehicle assignment, and your final voucher confirmation.',
      category: 'Booking & Payment',
      sortOrder: 2,
    },
    {
      question: 'Can I book directly via WhatsApp?',
      answer:
        'Yes, absolutely! WhatsApp is the fastest and most convenient method. You can click any of our "Chat on WhatsApp" buttons with prefilled tour or transfer details, and Ibrahim will assist you immediately in English, Italian, or Swahili.',
      category: 'Booking & Payment',
      sortOrder: 3,
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept Cash (US Dollars printed after 2009, Euros, British Pounds, and Tanzanian Shillings), Vodacom M-Pesa mobile money, and local/international bank transfers.',
      category: 'Payment',
      sortOrder: 4,
    },
    {
      question: 'Are airport pickups and hotel transfers private?',
      answer:
        'Yes, 100% of our transfers and tours are private for you and your group. Your driver will greet you at Abeid Amani Karume International Airport (ZNZ) arrivals with a personalized name board and assist with your luggage.',
      category: 'Transfers',
      sortOrder: 5,
    },
    {
      question: 'Can I customize a tour or combine multiple destinations?',
      answer:
        'Yes! Because Ibrahim is a private operator, we can tailor custom combos to suit your schedule and interests (e.g. combining Jozani Forest, Spice Farm, and The Rock Restaurant in a single day). Simply let us know your preferred itinerary on WhatsApp.',
      category: 'Tours',
      sortOrder: 6,
    },
    {
      question: 'What happens after I submit a booking request on the site?',
      answer:
        'We receive your details immediately. Ibrahim checks driver and boat availability for your requested date and contacts you directly via WhatsApp or Email to confirm meeting time, hotel pickup location, and final pricing.',
      category: 'Booking & Payment',
      sortOrder: 7,
    },
  ];

  for (const faq of faqsData) {
    await prisma.faq.create({
      data: {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        sortOrder: faq.sortOrder,
        isActive: true,
      },
    });
  }

  // 10. Database Constraint Enforcement
  console.log('🛡️ Applying database constraint: booking.status CONFIRMED requires paymentStatus PAID_IN_FULL...');
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_booking_confirmed_paid'
        ) THEN
          ALTER TABLE "Booking"
          ADD CONSTRAINT "chk_booking_confirmed_paid"
          CHECK ("status" != 'CONFIRMED' OR "paymentStatus" = 'PAID_IN_FULL');
        END IF;
      END $$;
    `);
    console.log('✅ Constraint chk_booking_confirmed_paid verified.');
  } catch (err) {
    console.warn('⚠️ Note on DB constraint: Will be applied once tables are created via prisma migrate.', err);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
