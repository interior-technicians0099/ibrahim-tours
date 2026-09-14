const url = 'https://ibrahim-tours-beige.vercel.app/api/health';

async function checkHealth() {
  console.log('Fetching', url);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    const json = await res.json();
    console.log('STATUS:', res.status);
    console.log('BODY:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}

checkHealth();
