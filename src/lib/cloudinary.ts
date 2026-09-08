import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side with credentials
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

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
  folder: string = 'ibrahim_tours',
  options: {
    publicId?: string;
    tags?: string[];
  } = {}
): Promise<CloudinaryUploadResult> {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment credentials are not configured.');
  }

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
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment credentials are not configured.');
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
  });

  return result;
}
