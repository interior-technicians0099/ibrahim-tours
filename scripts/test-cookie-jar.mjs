const BASE_URL = 'http://127.0.0.1:3000';

async function testCookieJar() {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const initialCookies = csrfRes.headers.getSetCookie();

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': initialCookies.map(c => c.split(';')[0]).join('; '),
    },
    body: new URLSearchParams({
      csrfToken,
      email: 'ibrahim@ibrahimtours.co.tz',
      password: 'IbrahimTour2026!',
    }),
    redirect: 'manual',
  });

  const allCookies = [...initialCookies, ...loginRes.headers.getSetCookie()]
    .map(c => c.split(';')[0])
    .join('; ');

  console.log('Combined cookies length:', allCookies.length);
  console.log('Has session token:', allCookies.includes('authjs.session-token'));
}

testCookieJar().catch(console.error);
