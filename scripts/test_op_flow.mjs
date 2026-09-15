const BASE_URL = 'https://ibrahim-tours-beige.vercel.app';

async function testOperatorFlow() {
  console.log('Testing Operator flow on Vercel...');
  // 1. Get CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.get('set-cookie');
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;

  // 2. Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookies || '',
    },
    body: new URLSearchParams({
      csrfToken,
      email: 'ibrahim@ibrahimtours.co.tz',
      password: 'IbrahimTour2026!',
    }),
    redirect: 'manual',
  });

  const loginCookies = loginRes.headers.get('set-cookie') || '';
  console.log('Login status:', loginRes.status);
  console.log('Redirect location:', loginRes.headers.get('location'));

  // Extract auth cookie
  const authCookie = loginCookies
    .split(',')
    .map(c => c.trim().split(';')[0])
    .filter(c => c.includes('authjs.session-token') || c.includes('authjs.csrf-token'))
    .join('; ');

  console.log('Auth cookie extracted:', authCookie ? 'YES' : 'NO');

  // 3. Follow redirect to /operator
  const opRes = await fetch(`${BASE_URL}/operator`, {
    headers: {
      'Cookie': authCookie,
    },
    redirect: 'manual',
  });
  console.log('/operator status:', opRes.status, 'Location:', opRes.headers.get('location'));

  // 4. Follow redirect to /operator/tours
  const toursRes = await fetch(`${BASE_URL}/operator/tours`, {
    headers: {
      'Cookie': authCookie,
    },
  });
  console.log('/operator/tours status:', toursRes.status);
  const text = await toursRes.text();
  if (toursRes.status !== 200 || text.includes('Page Unavailable')) {
    console.log('ERROR on /operator/tours! HTML preview:', text.slice(0, 500));
  } else {
    console.log('SUCCESS on /operator/tours! Page title / content found.');
  }

  // 5. Also check platform admin flow
  // 6. Check booking submit on Vercel
}

testOperatorFlow().catch(console.error);
