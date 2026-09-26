import { NextRequest, NextResponse } from 'next/server';
import {
  generateReceiptQrPngBuffer,
  buildVerifyUrl,
  getReceiptBaseUrl,
} from '@/lib/services/receipt-service';

/**
 * P0 — Hosted QR image for receipt emails + on-page rendering.
 * GET /api/qr?code=K9X2P7 → PNG (300px) encoding the absolute verify URL.
 *
 * Public (no auth): the code itself is the capability, and email clients
 * must fetch the image without a session. Hosted <img> is required because
 * data-URL images are stripped by Gmail/Outlook.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawCode = (searchParams.get('code') || '').trim().toUpperCase();

  if (!rawCode) {
    return NextResponse.json({ error: 'Missing ?code= verification code.' }, { status: 400 });
  }

  if (!/^[A-Z0-9-]{4,32}$/.test(rawCode)) {
    return NextResponse.json({ error: 'Invalid verification code format.' }, { status: 400 });
  }

  try {
    const verifyUrl = buildVerifyUrl(rawCode, getReceiptBaseUrl());
    const png = await generateReceiptQrPngBuffer(verifyUrl);

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // QR payload is immutable per code → cache hard at edge + clients.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(png.length),
      },
    });
  } catch (err: any) {
    console.error('[api/qr] Failed to generate QR PNG:', err);
    return NextResponse.json(
      { error: 'Failed to generate QR code.' },
      { status: 500 }
    );
  }
}
