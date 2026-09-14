import { PrismaClient } from '@prisma/client';

const urlClean = 'postgresql://neondb_owner:npg_cnMTkI5mN8Ei@ep-old-credit-b1hdpvxy.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const prisma = new PrismaClient({
  datasources: { db: { url: urlClean } }
});

async function run() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('QUERY SUCCESS WITHOUT channel_binding:', res);
  } catch (err) {
    console.error('QUERY FAILED:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
