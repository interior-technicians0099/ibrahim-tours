import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://127.0.0.1:3000';

async function testCompanyAdmin() {
  console.log('--- Testing Company Admin Access ---');
  const user = await prisma.adminUser.findUnique({
    where: { email: 'manager@zansafarihorizon.com' },
  });
  console.log('Company Admin user in DB:', user?.email, 'Role:', user?.role, 'mustChange:', user?.mustChangePassword);

  if (user?.mustChangePassword) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { mustChangePassword: false },
    });
  }

  // 1. Get CSRF Token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const initialCookies = csrfRes.headers.get('set-cookie');

  // 2. Sign In
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': initialCookies || '',
    },
    body: new URLSearchParams({
      csrfToken,
      email: 'manager@zansafarihorizon.com',
      password: 'Zansafari2026!',
    }),
    redirect: 'manual',
  });

  const authCookies = loginRes.headers.get('set-cookie');
  console.log('Login response status:', loginRes.status);

  // Combine cookies
  const allCookies = [initialCookies, authCookies].filter(Boolean).join('; ');

  const routesToTest = [
    '/operator',
    '/operator/transport',
    '/operator/categories',
    '/operator/faqs',
    '/operator/reviews',
    '/operator/tours',
    '/operator/settlements',
    '/operator/profile',
    '/operator/branding',
  ];

  for (const route of routesToTest) {
    const res = await fetch(`${BASE_URL}${route}`, {
      headers: {
        'Cookie': allCookies,
      },
      redirect: 'manual',
    });
    console.log(`Route [${route}]: status = ${res.status} ${res.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (res.status === 307 || res.status === 302) {
      console.log(`  -> Redirected to: ${res.headers.get('location')}`);
    }
  }

  await prisma.$disconnect();
}

testCompanyAdmin().catch(console.error);
