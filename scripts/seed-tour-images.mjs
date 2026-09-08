import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_cnMTkI5mN8Ei@ep-old-credit-b1hdpvxy-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    },
  },
});

const TOUR_PHOTO_MAP = {
  'safari-blue': {
    hero: '/images/tours/Safariblue/the-original-safari-blue.jpg.jpeg',
    gallery: [
      '/images/tours/Safariblue/the-original-safari-blue.jpg.jpeg',
      '/images/tours/Safariblue/safari-blue-zanzbar-full-day-trip-1-06.jpg.jpeg',
      '/images/tours/Safariblue/Zanzibar_Sandbank_Safari_Blue_Tour_02.jpg.jpeg',
      '/images/tours/Safariblue/dc.jpg.jpeg',
    ],
  },
  'mnemba-island': {
    hero: '/images/tours/Mnemba/Mnemba-Island-4.jpg.jpeg',
    gallery: [
      '/images/tours/Mnemba/Mnemba-Island-4.jpg.jpeg',
      '/images/tours/Mnemba/dolphin-tour-e1743842831358.jpg.jpeg',
      '/images/tours/Mnemba/Zanzibar-Mnemba-Island.jpg.jpeg',
      '/images/tours/Mnemba/caption-2.jpg.jpeg',
    ],
  },
  'nakupenda-sandbank': {
    hero: '/images/tours/Nakupenda/Nakupenda-Island-Zan-The-Level-2.jpg.jpeg',
    gallery: [
      '/images/tours/Nakupenda/Nakupenda-Island-Zan-The-Level-2.jpg.jpeg',
      '/images/tours/Nakupenda/ed.jpg.jpeg',
      '/images/tours/Nakupenda/Screenshot1686934031246.jpg.jpeg',
    ],
  },
  'prison-island': {
    hero: '/images/tours/Prison/PXL_20260819_103528045.MP.jpg-200kb.jpg',
    gallery: [
      '/images/tours/Prison/PXL_20260819_103528045.MP.jpg-200kb.jpg',
      '/images/tours/Prison/PXL_20260819_104108992.PORTRAIT.jpg-200kb.jpg',
    ],
  },
  'stone-town-tour': {
    hero: '/images/tours/Stonetown/ZOM_0097.JPG-300kb.jpg',
    gallery: [
      '/images/tours/Stonetown/ZOM_0097.JPG-300kb.jpg',
      '/images/tours/Stonetown/IMG_5745_1.jpg-100kb.jpg',
      '/images/tours/Stonetown/ZOM_0138.JPG-200kb.jpg',
      '/images/tours/Stonetown/ZOM_0144.JPG-200kb.jpg',
      '/images/tours/Stonetown/ZOM_0302.JPG-100kb.jpg',
    ],
  },
  'jozani-forest': {
    hero: '/images/tours/Jozani/6803148a-2b22-4f22-be2f-0825a2159110.jpg.jpeg',
    gallery: [
      '/images/tours/Jozani/6803148a-2b22-4f22-be2f-0825a2159110.jpg.jpeg',
      '/images/tours/Jozani/f3.jpg.jpeg',
      '/images/tours/Jozani/1694857351_jozaniii-map.jpg.jpeg',
    ],
  },
  'spice-tour': {
    hero: '/images/tours/SpiceFarm/2X7A7374.jpg-100kb.jpg',
    gallery: [
      '/images/tours/SpiceFarm/2X7A7374.jpg-100kb.jpg',
      '/images/tours/SpiceFarm/IMG_5586_1.jpg-200kb.jpg',
      '/images/tours/SpiceFarm/IMG_5589_1.jpg-200kb.jpg',
    ],
  },
  'the-rock-restaurant': {
    hero: '/images/tours/Rock_Restaurant/The-rock-zanzibar-aerial-view.webp',
    gallery: [
      '/images/tours/Rock_Restaurant/The-rock-zanzibar-aerial-view.webp',
      '/images/tours/Rock_Restaurant/281652541654.jpg.jpeg',
      '/images/tours/Rock_Restaurant/98.jpg.jpeg',
    ],
  },
  'salaam-cave': {
    hero: '/images/tours/Salam_Cave/038e96383d328557908a6b117db3326a876263affc1f3340270b8eae1a27f946.jpg.jpeg',
    gallery: [
      '/images/tours/Salam_Cave/038e96383d328557908a6b117db3326a876263affc1f3340270b8eae1a27f946.jpg.jpeg',
      '/images/tours/Salam_Cave/caption.jpg.jpeg',
      '/images/tours/Salam_Cave/caption-1.jpg.jpeg',
    ],
  },
  'dhow-sunset-cruise': {
    hero: '/images/tours/Sunset/Zanzibar_Dhow_Sunset_Cruise_03.jpg.jpeg',
    gallery: [
      '/images/tours/Sunset/Zanzibar_Dhow_Sunset_Cruise_03.jpg.jpeg',
      '/images/tours/Sunset/zanzibar_chasing_sunsets.jpg.jpeg',
      '/images/tours/Sunset/85.jpg.jpeg',
    ],
  },
  'village-tour-cooking-class': {
    hero: '/images/tours/Village/Look-like-locals.jpg.jpeg',
    gallery: [
      '/images/tours/Village/Look-like-locals.jpg.jpeg',
      '/images/tours/Village/cd.jpg.jpeg',
    ],
  },
  'town-full-day-combo': {
    hero: '/images/tours/Stonetown/ZOM_0097.JPG-300kb.jpg',
    gallery: [
      '/images/tours/Stonetown/ZOM_0097.JPG-300kb.jpg',
      '/images/tours/Prison/PXL_20260819_103528045.MP.jpg-200kb.jpg',
      '/images/tours/Nakupenda/Nakupenda-Island-Zan-The-Level-2.jpg.jpeg',
    ],
  },
  'south-full-day-combo': {
    hero: '/images/tours/Rock_Restaurant/The-rock-zanzibar-aerial-view.webp',
    gallery: [
      '/images/tours/Rock_Restaurant/The-rock-zanzibar-aerial-view.webp',
      '/images/tours/Jozani/6803148a-2b22-4f22-be2f-0825a2159110.jpg.jpeg',
      '/images/tours/Salam_Cave/038e96383d328557908a6b117db3326a876263affc1f3340270b8eae1a27f946.jpg.jpeg',
    ],
  },
  'north-full-day-combo': {
    hero: '/images/tours/Sunset/Zanzibar_Dhow_Sunset_Cruise_03.jpg.jpeg',
    gallery: [
      '/images/tours/Sunset/Zanzibar_Dhow_Sunset_Cruise_03.jpg.jpeg',
      '/images/tours/Mnemba/Mnemba-Island-4.jpg.jpeg',
    ],
  },
};

async function seedTourImages() {
  console.log('🖼️ Seeding Real Tour Photos into Neon Database...');

  for (const [slug, data] of Object.entries(TOUR_PHOTO_MAP)) {
    const tour = await prisma.tour.findUnique({ where: { slug } });
    if (!tour) {
      console.log(`Tour not found for slug: ${slug}`);
      continue;
    }

    // Delete existing TourImage entries
    await prisma.tourImage.deleteMany({ where: { tourId: tour.id } });

    // Insert gallery images
    for (let i = 0; i < data.gallery.length; i++) {
      const url = data.gallery[i];
      const isHero = url === data.hero || i === 0;
      await prisma.tourImage.create({
        data: {
          tourId: tour.id,
          url,
          alt: `${tour.title} Photo ${i + 1}`,
          sortOrder: i,
          isHero,
        },
      });
    }

    console.log(`✅ Seeded ${data.gallery.length} photos for tour: ${tour.title}`);
  }

  console.log('🎉 Done updating tour photos in DB!');
  await prisma.$disconnect();
}

seedTourImages().catch((err) => {
  console.error(err);
  process.exit(1);
});
