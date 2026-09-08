import { v2 as cloudinary } from 'cloudinary';
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

async function testCloudinary() {
  console.log('--- CLOUDINARY CONFIGURATION TEST ---');
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log('Checking Environment Variables:');
  console.log(`- CLOUDINARY_CLOUD_NAME: ${cloudName ? 'Present (' + cloudName + ')' : 'MISSING'}`);
  console.log(`- CLOUDINARY_API_KEY: ${apiKey ? 'Present (' + apiKey.slice(0, 4) + '...)' : 'MISSING'}`);
  console.log(`- CLOUDINARY_API_SECRET: ${apiSecret ? 'Present (length: ' + apiSecret.length + ')' : 'MISSING'}`);

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('\n❌ ERROR: Cloudinary credentials are missing or empty in .env / .env.local!');
    console.error('Please make sure you saved the file in the editor (Ctrl + S).');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  console.log('\nTesting upload with a 1x1 transparent PNG test buffer...');
  // 1x1 transparent PNG buffer
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  try {
    const uploadResult = await cloudinary.uploader.upload(sampleBase64, {
      folder: 'ibrahim_tours/test',
      public_id: `test_ping_${Date.now()}`,
      tags: ['test', 'ping'],
    });

    console.log('✅ Upload Successful!');
    console.log(`- Public ID: ${uploadResult.public_id}`);
    console.log(`- Secure URL: ${uploadResult.secure_url}`);
    console.log(`- Format: ${uploadResult.format}`);
    console.log(`- Bytes: ${uploadResult.bytes}`);

    console.log('\nTesting asset deletion (signed destroy)...');
    const deleteResult = await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log(`✅ Delete Result: ${deleteResult.result}`);

    console.log('\n✨ Cloudinary configuration is 100% verified and operational!');
  } catch (error: any) {
    console.error('\n❌ Cloudinary API Error:', error?.message || error);
    process.exit(1);
  }
}

testCloudinary();
