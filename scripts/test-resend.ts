import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local first, then .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

async function testResend() {
  console.log('--- RESEND EMAIL CONFIGURATION TEST ---');
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Ibrahim Tours Zanzibar <onboarding@resend.dev>';
  const alertEmail = process.env.OPERATOR_ALERT_EMAIL || 'info@ibrahimtours.co.tz';

  console.log('Checking Environment Variables:');
  console.log(`- RESEND_API_KEY: ${resendApiKey ? 'Present (' + resendApiKey.slice(0, 5) + '...)' : 'MISSING'}`);
  console.log(`- RESEND_FROM_EMAIL: ${fromEmail}`);
  console.log(`- OPERATOR_ALERT_EMAIL: ${alertEmail}`);

  if (!resendApiKey) {
    console.error('\n❌ ERROR: RESEND_API_KEY is missing or empty in .env.local!');
    console.error('Fungua akaunti: resend.com, pata API Key yako, kisha weka kwenye .env.local na ubonyeze Ctrl + S.');
    process.exit(1);
  }

  console.log('\nTesting Resend API connection (validating API Key)...');
  try {
    const res = await fetch('https://api.resend.com/api-keys', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 401 || res.status === 403) {
      console.error('\n❌ Invalid Resend API Key! Please verify the key copied from resend.com.');
      process.exit(1);
    }

    const data = await res.json();
    console.log(`✅ Resend API Key is valid! HTTP Status: ${res.status}`);
    console.log('✨ Resend configuration is verified and ready to dispatch booking emails!');
  } catch (err: any) {
    console.error('\n❌ Network or API error connecting to Resend:', err?.message || err);
    process.exit(1);
  }
}

testResend();
