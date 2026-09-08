import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }
    if (user.role !== Role.OPERATOR && user.role !== Role.PLATFORM_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 });
    }
    const scopedOperatorId = user.role === Role.OPERATOR ? user.operatorId : null;

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required.' }, { status: 400 });
    }

    // 1. Look for asset by ID or publicId in MediaAsset or TourImage
    const mediaAsset = await prisma.mediaAsset.findFirst({
      where: {
        OR: [{ id }, { publicId: id }],
        ...(user.role === Role.OPERATOR && scopedOperatorId
          ? { operatorId: scopedOperatorId }
          : {}),
      },
    });

    const tourImage = !mediaAsset
      ? await prisma.tourImage.findFirst({
          where: { OR: [{ id }, { publicId: id }] },
          include: { tour: true },
        })
      : null;

    if (!mediaAsset && !tourImage) {
      return NextResponse.json({ error: 'Asset not found or access denied.' }, { status: 404 });
    }

    const targetPublicId = mediaAsset?.publicId || tourImage?.publicId;
    const tourSlug = tourImage?.tour?.slug;

    // 2. Remove DB records
    if (mediaAsset) {
      await prisma.mediaAsset.delete({ where: { id: mediaAsset.id } });
      // Also delete corresponding TourImage if publicId matches
      if (mediaAsset.publicId) {
        await prisma.tourImage.deleteMany({ where: { publicId: mediaAsset.publicId } });
      }
    } else if (tourImage) {
      await prisma.tourImage.delete({ where: { id: tourImage.id } });
    }

    // 3. Destroy Cloudinary asset (signed destroy)
    let destroyResult = null;
    if (targetPublicId) {
      try {
        destroyResult = await deleteFromCloudinary(targetPublicId);
      } catch (err: any) {
        console.warn(`Cloudinary destroy warning for ${targetPublicId}:`, err.message);
      }
    }

    // 4. Record to AuditLog
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_MEDIA',
        entityType: 'MediaAsset',
        entityId: mediaAsset?.id || tourImage?.id,
        details: {
          publicId: targetPublicId,
          destroyResult,
        },
        ipAddress: clientIp,
      },
    });

    // 5. ISR Revalidation
    if (tourSlug) {
      revalidatePath(`/tours/${tourSlug}`);
      revalidatePath('/tours');
      revalidatePath('/');
    }

    return NextResponse.json({
      success: true,
      message: 'Asset removed from database and Cloudinary successfully.',
      publicId: targetPublicId,
    });
  } catch (error: any) {
    console.error('Media delete error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete media asset.' },
      { status: 500 }
    );
  }
}
