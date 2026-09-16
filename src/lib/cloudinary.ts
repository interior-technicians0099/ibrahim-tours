import { v2 as cloudinary } from 'cloudinary';

function getCloudinaryConfig() {
  const rawCloudName = (
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    'jxqc0kdh'
  )
    .trim()
    .replace(/^["']|["']$/g, '');

  const rawApiKey = (process.env.CLOUDINARY_API_KEY || '174962212225453')
    .trim()
    .replace(/^["']|["']$/g, '');

  const rawApiSecret = (
    process.env.CLOUDINARY_API_SECRET || '6yps1h07urDX2E2EIN0FqhDS_qQ'
  )
    .trim()
    .replace(/^["']|["']$/g, '');

  return {
    cloudName: rawCloudName || 'jxqc0kdh',
    apiKey: rawApiKey || '174962212225453',
    apiSecret: rawApiSecret || '6yps1h07urDX2E2EIN0FqhDS_qQ',
  };
}

// Initial top-level config
const initialConfig = getCloudinaryConfig();
if (initialConfig.cloudName && initialConfig.apiKey && initialConfig.apiSecret) {
  cloudinary.config({
    cloud_name: initialConfig.cloudName,
    api_key: initialConfig.apiKey,
    api_secret: initialConfig.apiSecret,
    secure: true,
  });
}

export { cloudinary };

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Uploads a file buffer directly to Cloudinary using a stream.
 * Secrets never reach the browser.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string = 'zansafari_horizon',
  options: {
    publicId?: string;
    tags?: string[];
  } = {}
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error('Cloudinary environment credentials are not configured.');
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: options.publicId,
        tags: options.tags,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed with empty result.'));
        }
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an asset permanently from Cloudinary using signed destroy.
 */
export async function deleteFromCloudinary(publicId: string): Promise<{ result: string }> {
  const config = getCloudinaryConfig();

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error('Cloudinary environment credentials are not configured.');
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
  });

  return result;
}
