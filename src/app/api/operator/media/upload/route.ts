import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Rate limiting: 30 uploads / hour / user
const uploadRateLimitStore = new Map<string, { count: number; windowStart: number }>();
const MAX_UPLOADS_PER_HOUR = 30;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

function checkUploadRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = uploadRateLimitStore.get(identifier);
  if (!record || now - record.windowStart > UPLOAD_WINDOW_MS) {
    uploadRateLimitStore.set(identifier, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= MAX_UPLOADS_PER_HOUR) {
    return false;
  }
  record.count += 1;
  return true;
}

/**
 * Validates file magic bytes to ensure file is genuinely a JPEG, PNG, or WebP image.
 */
export function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // WebP: 'RIFF' at 0..3 and 'WEBP' at 8..11
  const riff = buffer.subarray(0, 4).toString('ascii');
  const webp = buffer.subarray(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Server-side Authentication & Operator Scoping
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }
    if (user.role !== Role.OPERATOR && user.role !== Role.PLATFORM_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 });
    }
    const scopedOperatorId = user.role === Role.OPERATOR ? user.operatorId : null;

    // 2. Upload Rate Limiting Check (~30 / hr)
    const rateLimitKey = user.id || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!checkUploadRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Media upload rate limit reached (30 images/hour). Please wait before uploading more assets.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const entityType = (formData.get('entityType') as string) || 'GENERAL';
    const entityId = (formData.get('entityId') as string) || null;
    const alt = (formData.get('alt') as string) || '';
    const isHero = formData.get('isHero') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
    }

    // 3. Validation: MIME Type & File Size
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Magic Bytes Inspection (prevents malicious payload disguise)
    if (!isValidImageMagicBytes(buffer)) {
      return NextResponse.json(
        { error: 'Security validation failed: File binary header does not match a valid image format.' },
        { status: 400 }
      );
    }

    // 5. Upload to Cloudinary securely (never write to local disk)
    const effectiveOperatorId = scopedOperatorId || 'operator-ibrahim';
    const folder = `ibrahim_tours/${effectiveOperatorId}/${entityType.toLowerCase()}`;

    const uploadResult = await uploadBufferToCloudinary(buffer, folder, {
      tags: [entityType, effectiveOperatorId],
    });

    // 6. Save to Database: MediaAsset
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        operatorId: effectiveOperatorId,
        publicId: uploadResult.publicId,
        url: uploadResult.secureUrl || uploadResult.url,
        secureUrl: uploadResult.secureUrl,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        alt: alt || file.name.replace(/\.[^/.]+$/, ''),
        entityType,
        entityId,
        isHero,
      },
    });

    // If entityType is TOUR and entityId is provided, also create a TourImage record
    let tourImageRecord = null;
    if (entityType === 'TOUR' && entityId) {
      const lastImage = await prisma.tourImage.findFirst({
        where: { tourId: entityId },
        orderBy: { sortOrder: 'desc' },
      });
      const nextSortOrder = (lastImage?.sortOrder ?? -1) + 1;

      if (isHero) {
        await prisma.tourImage.updateMany({
          where: { tourId: entityId, isHero: true },
          data: { isHero: false },
        });
      }

      tourImageRecord = await prisma.tourImage.create({
        data: {
          tourId: entityId,
          publicId: uploadResult.publicId,
          url: uploadResult.secureUrl || uploadResult.url,
          alt: alt || file.name.replace(/\.[^/.]+$/, ''),
          sortOrder: nextSortOrder,
          isHero,
        },
      });
    }

    // 7. Write to AuditLog
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPLOAD_MEDIA',
        entityType: 'MediaAsset',
        entityId: mediaAsset.id,
        details: {
          publicId: uploadResult.publicId,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          entityType,
          entityId,
          isHero,
        },
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      id: mediaAsset.id,
      tourImageId: tourImageRecord?.id || null,
      publicId: uploadResult.publicId,
      url: uploadResult.secureUrl || uploadResult.url,
      secureUrl: uploadResult.secureUrl,
      width: uploadResult.width,
      height: uploadResult.height,
      alt: mediaAsset.alt,
      isHero: mediaAsset.isHero,
    });
  } catch (error: any) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media asset.' },
      { status: 500 }
    );
  }
}
