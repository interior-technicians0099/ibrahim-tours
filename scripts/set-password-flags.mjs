import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_cnMTkI5mN8Ei@ep-old-credit-b1hdpvxy-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    },
  },
});

async function main() {
  const res = await prisma.adminUser.updateMany({
    data: { mustChangePassword: false },
  });
  console.log('✅ Admin users updated mustChangePassword to false:', res.count);
  await prisma.$disconnect();
}

main();
