import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function verify() {
  console.log('🔍 Verifying Production Database on Neon...');

  const users = await prisma.adminUser.findMany({ select: { id: true, email: true, role: true, name: true } });
  console.log(`✅ Admin Users (${users.length}):`, users);

  const operator = await prisma.operatorProfile.findFirst();
  console.log(`✅ Operator Profile: ${operator?.businessName} (${operator?.email}), Phone: ${operator?.phone}`);

  const categories = await prisma.tourCategory.findMany({ select: { name: true, slug: true } });
  console.log(`✅ Categories (${categories.length}):`, categories.map(c => c.name));

  const tours = await prisma.tour.findMany({ select: { title: true, startingPriceCents: true, slug: true } });
  console.log(`✅ Tours (${tours.length}):`);
  tours.forEach(t => console.log(`   - ${t.title}: $${t.startingPriceCents / 100}`));

  const routes = await prisma.route.findMany({ select: { origin: true, destination: true } });
  console.log(`✅ Transfer Routes (${routes.length}):`);
  routes.slice(0, 4).forEach(r => console.log(`   - ${r.origin} ↔ ${r.destination}`));
  if (routes.length > 4) console.log(`   ... and ${routes.length - 4} more`);

  const vehicles = await prisma.vehicle.findMany({ select: { name: true, vehicleType: true, capacity: true } });
  console.log(`✅ Vehicles (${vehicles.length}):`, vehicles);

  const reviews = await prisma.review.count();
  const faqs = await prisma.faq.count();
  const settings = await prisma.settings.findMany();

  console.log(`✅ Reviews: ${reviews}, FAQs: ${faqs}, Settings: ${settings.length}`);

  await prisma.$disconnect();
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
