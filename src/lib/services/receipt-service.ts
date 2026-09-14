import { prisma } from '@/lib/prisma';
import { PaymentMethod, Prisma } from '@prisma/client';
import QRCode from 'qrcode';
import crypto from 'crypto';

export interface IssueReceiptParams {
  bookingId: string;
  amountPaidCents: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
  issuedById?: string | null;
  notes?: string | null;
}

/**
 * Generates the next sequential receipt number in format: ZSH-YYYY-000001
 */
export async function generateNextReceiptNumber(tx?: any): Promise<string> {
  const db = tx || prisma;
  const currentYear = new Date().getFullYear();
  const prefix = `ZSH-${currentYear}-`;

  // Find the highest existing receipt number for the current year
  const latestReceipt = await db.receipt.findFirst({
    where: {
      receiptNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      receiptNumber: 'desc',
    },
    select: {
      receiptNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestReceipt && latestReceipt.receiptNumber) {
    const parts = latestReceipt.receiptNumber.split('-');
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq)) {
        nextSequence = seq + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(6, '0')}`;
}

/**
 * Generates a unique, non-confusing 6-character uppercase verification code (e.g. K9X2P7)
 * Excludes ambiguous characters: 0, O, 1, I
 */
export async function generateVerificationCode(tx?: any): Promise<string> {
  const db = tx || prisma;
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let attempts = 0;

  while (attempts < 15) {
    attempts++;
    let code = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += charset[bytes[i] % charset.length];
    }

    const existing = await db.receipt.findUnique({
      where: { verificationCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  // Fallback if collision persists
  return `Z${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

/**
 * Generates offline scannable QR Code as base64 PNG data URL
 */
export async function generateReceiptQrDataUrl(targetUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(targetUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('[ReceiptService] Error generating QR code:', err);
    return '';
  }
}

/**
 * Automatically creates or retrieves the official Receipt for a fully paid booking
 */
export async function issueBookingReceipt(params: IssueReceiptParams) {
  // 1. Check if receipt already issued
  const existingReceipt = await prisma.receipt.findUnique({
    where: { bookingId: params.bookingId },
  });

  if (existingReceipt) {
    return existingReceipt;
  }

  // 2. Transactionally create new Receipt with sequential number & unique code
  return await prisma.$transaction(async (tx) => {
    const receiptNumber = await generateNextReceiptNumber(tx);
    const verificationCode = await generateVerificationCode(tx);

    const receipt = await tx.receipt.create({
      data: {
        receiptNumber,
        verificationCode,
        bookingId: params.bookingId,
        amountCents: params.amountPaidCents,
        currency: 'USD',
        paymentMethod: params.paymentMethod,
        paymentReference: params.paymentReference || null,
        notes: params.notes || null,
        issuedById: params.issuedById || null,
        issuedAt: new Date(),
      },
      include: {
        booking: {
          include: {
            tour: true,
            route: true,
            operator: true,
          },
        },
      },
    });

    // Audit Log
    await tx.auditLog.create({
      data: {
        userId: params.issuedById || null,
        action: 'RECEIPT_ISSUED',
        entityType: 'Receipt',
        entityId: receipt.id,
        details: {
          receiptNumber: receipt.receiptNumber,
          verificationCode: receipt.verificationCode,
          bookingId: params.bookingId,
          referenceCode: receipt.booking?.referenceCode,
          amountCents: receipt.amountCents,
          paymentMethod: receipt.paymentMethod,
        },
      },
    });

    return receipt;
  });
}

/**
 * Verifies a 6-character Uhakiki code or Receipt number
 */
export async function verifyReceiptCode(rawCode: string) {
  const cleanCode = (rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { isValid: false, reason: 'Verification code cannot be empty.' };
  }

  const receipt = await prisma.receipt.findFirst({
    where: {
      OR: [
        { verificationCode: cleanCode },
        { receiptNumber: cleanCode },
      ],
    },
    include: {
      booking: {
        include: {
          tour: true,
          route: true,
          operator: true,
          checkedInBy: { select: { name: true, email: true } },
          payments: { orderBy: { paymentDate: 'desc' }, take: 1 },
        },
      },
      issuedBy: { select: { name: true, email: true } },
    },
  });

  if (!receipt || !receipt.booking) {
    return {
      isValid: false,
      reason: `No confirmed receipt found for verification code "${cleanCode}". Please verify spelling or payment status.`,
    };
  }

  const b = receipt.booking;
  const isPaidInFull = b.paymentStatus === 'PAID_IN_FULL';
  const isConfirmed = b.status === 'CONFIRMED' || b.status === 'COMPLETED';

  if (!isPaidInFull || !isConfirmed) {
    return {
      isValid: false,
      reason: `Receipt ${receipt.receiptNumber} exists but booking status is ${b.status} (Payment: ${b.paymentStatus}). Cannot verify unconfirmed bookings.`,
    };
  }

  const serviceTitle =
    b.serviceType === 'TOUR'
      ? b.tour?.title || 'Tour Excursion'
      : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`;

  return {
    isValid: true,
    receipt: {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      verificationCode: receipt.verificationCode,
      amountCents: receipt.amountCents,
      currency: receipt.currency,
      paymentMethod: receipt.paymentMethod,
      paymentReference: receipt.paymentReference,
      issuedAt: receipt.issuedAt,
      notes: receipt.notes,
    },
    booking: {
      id: b.id,
      referenceCode: b.referenceCode,
      status: b.status,
      paymentStatus: b.paymentStatus,
      customerName: b.customerName,
      customerCountry: b.customerCountry || 'International',
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail,
      locale: b.locale || 'en',
      serviceType: b.serviceType,
      serviceTitle,
      tourDate: new Date(b.bookingDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      bookingTime: b.bookingTime || 'Morning',
      numAdults: b.numAdults,
      numChildren: b.numChildren,
      pickupLocation: b.pickupLocation || 'Stone Town / Hotel lobby',
      specialRequests: b.specialRequests,
      checkedInAt: b.checkedInAt,
      checkedInByName: b.checkedInBy?.name || b.checkedInBy?.email || null,
      guideName: b.guideName,
      guidePhone: b.guidePhone,
      guideNotes: b.guideNotes,
    },
  };
}

/**
 * Marks a booking as Checked-In by verification code or receipt number
 */
export async function markBookingCheckedIn(rawCode: string, adminUserId: string) {
  const verified = await verifyReceiptCode(rawCode);
  if (!verified.isValid || !verified.booking) {
    throw new Error(verified.reason || 'Verification code invalid.');
  }

  if (verified.booking.checkedInAt) {
    return {
      success: true,
      alreadyCheckedIn: true,
      checkedInAt: verified.booking.checkedInAt,
      checkedInByName: verified.booking.checkedInByName,
      message: `Guest already checked in on ${new Date(verified.booking.checkedInAt).toLocaleString('en-US')}.`,
      booking: verified.booking,
      receipt: verified.receipt,
    };
  }

  const now = new Date();
  const updatedBooking = await prisma.booking.update({
    where: { id: verified.booking.id },
    data: {
      checkedInAt: now,
      checkedInById: adminUserId,
    },
    include: {
      checkedInBy: { select: { name: true, email: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'TOURIST_CHECKED_IN',
      entityType: 'Booking',
      entityId: updatedBooking.id,
      details: {
        referenceCode: updatedBooking.referenceCode,
        receiptNumber: verified.receipt?.receiptNumber,
        verificationCode: verified.receipt?.verificationCode,
        touristName: updatedBooking.customerName,
        checkedInAt: now.toISOString(),
      },
    },
  });

  return {
    success: true,
    alreadyCheckedIn: false,
    checkedInAt: now,
    checkedInByName: updatedBooking.checkedInBy?.name || 'Platform Admin',
    message: `Guest ${updatedBooking.customerName} successfully checked in for ${verified.booking.serviceTitle}.`,
    booking: {
      ...verified.booking,
      checkedInAt: now,
      checkedInByName: updatedBooking.checkedInBy?.name || 'Platform Admin',
    },
    receipt: verified.receipt,
  };
}

/**
 * Updates offline refund or reconciliation notes on a receipt
 */
export async function updateReceiptNotes(receiptId: string, notes: string, adminUserId: string) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: { booking: true },
  });

  if (!receipt) {
    throw new Error('Receipt not found.');
  }

  const updatedReceipt = await prisma.receipt.update({
    where: { id: receiptId },
    data: {
      notes: notes ? notes.trim() : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'RECEIPT_NOTE_UPDATED',
      entityType: 'Receipt',
      entityId: receipt.id,
      details: {
        receiptNumber: receipt.receiptNumber,
        previousNotes: receipt.notes,
        newNotes: updatedReceipt.notes,
      },
    },
  });

  return updatedReceipt;
}
