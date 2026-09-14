const BASE_URL = 'https://ibrahim-tours-beige.vercel.app';

async function testEndpoint(name, path) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    console.log(`[${res.status}] ${name} -> ${url}`);
    if (res.status === 200 || res.status === 307 || res.status === 308) {
      if (res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        console.log('   Data:', JSON.stringify(data).slice(0, 150));
      } else {
        const text = await res.text();
        console.log(`   HTML Length: ${text.length} bytes`);
      }
      return true;
    } else {
      const text = await res.text();
      console.log(`   Response text (first 200 chars):`, text.slice(0, 200));
      return false;
    }
  } catch (err) {
    console.error(`❌ Failed ${name}:`, err.message);
    return false;
  }
}

async function main() {
  console.log(`🚀 Testing Live Vercel Deployment: ${BASE_URL}\n`);
  
  await testEndpoint('Health Check', '/api/health');
  await testEndpoint('Home Page', '/');
  await testEndpoint('Tours Page', '/tours');
  await testEndpoint('Transport Page', '/transport');
  await testEndpoint('Login Page', '/login');
}

main();
