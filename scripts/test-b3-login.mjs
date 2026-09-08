import { PrismaClient } from '@prisma/client';
import { verify as verifyArgon2 } from '@node-rs/argon2';

const prisma = new PrismaClient();
const BASE_URL = 'http://127.0.0.1:3000';

async function testLogin() {
  const opUser = await prisma.adminUser.findUnique({ where: { email: 'ibrahim@ibrahimtours.co.tz' } });
  console.log('Operator user:', opUser?.email, 'mustChangePassword:', opUser?.mustChangePassword);

  // Temporarily set mustChangePassword = false for API testing if needed
  if (opUser?.mustChangePassword) {
    await prisma.adminUser.update({
      where: { id: opUser.id },
      data: { mustChangePassword: false },
    });
    console.log('Set mustChangePassword to false for API testing');
  }

  // 1. Get CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const setCookies = csrfRes.headers.get('set-cookie');
  console.log('CSRF Token obtained:', !!csrfToken, 'Cookie:', setCookies ? 'present' : 'none');

  // 2. Sign in via credentials
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': setCookies || '',
    },
    body: new URLSearchParams({
      csrfToken,
      email: 'ibrahim@ibrahimtours.co.tz',
      password: 'IbrahimTour2026!',
    }),
    redirect: 'manual',
  });

  console.log('Login response status:', loginRes.status);
  const loginCookies = loginRes.headers.get('set-cookie');
  console.log('Login set-cookie:', loginCookies ? loginCookies.slice(0, 50) + '...' : 'none');

  await prisma.$disconnect();
}

testLogin().catch(console.error);
