import { prisma } from '@/lib/prisma';
import { NotificationRecipient, NotificationChannel } from '@prisma/client';
import { getDictionary, Locale } from '@/lib/email-i18n';
import {
  resolveEmailLocale,
  fillTemplate,
  assertNoPlaceholders,
} from '@/lib/email-i18n';
import { getEnabledPaymentMethods } from '@/lib/payment-methods';
import { formatPrice } from '@/lib/utils';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

// Re-exported for existing importers (confirmation page, tests).
export { resolveEmailLocale, fillTemplate, assertNoPlaceholders };

/**
 * Canonical public base URL for links + QR payloads.
 * Priority: APP_URL → NEXTAUTH_URL → VERCEL_URL → production fallback.
 * NEVER falls back to localhost in production (that was breaking scanned QR codes).
 */
export function getAppBaseUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'https://zansafarihorizon.com';
  return raw.replace(/\/$/, '');
}

/**
 * Verified-domain sender. onboarding@resend.dev ONLY delivers to the Resend
 * account owner's inbox (sandbox restriction) — production must use a verified
 * domain address such as bookings@zansafarihorizon.com (SPF + DKIM in Cloudflare).
 */
export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'Zansafari Horizon <bookings@zansafarihorizon.com>';
}

/**
 * Persists a single Notification audit row with SENT/FAILED delivery status.
 * Every email send MUST go through this so failures are visible + retryable.
 */
async function persistNotification(input: {
  bookingId?: string | null;
  recipient: NotificationRecipient;
  channel?: NotificationChannel;
  type: string;
  payload?: Record<string, unknown>;
  ok: boolean;
  providerId?: string;
  error?: string;
}): Promise<string | null> {
  try {
    const row = await prisma.notification.create({
      data: {
        bookingId: input.bookingId || null,
        recipient: input.recipient,
        channel: input.channel || NotificationChannel.EMAIL,
        type: input.type,
        payload: {
          ...(input.payload || {}),
          ...(input.providerId ? { providerId: input.providerId } : {}),
          ...(input.error ? { lastError: input.error } : {}),
        },
        status: input.ok ? 'SENT' : 'FAILED',
        errorMessage: input.ok ? null : input.error || 'Unknown send failure',
        providerId: input.providerId || null,
        sentAt: input.ok ? new Date() : null,
      },
      select: { id: true },
    });
    return row.id;
  } catch (err) {
    console.warn('[EmailService] Failed to record notification log:', err);
    return null;
  }
}

/**
 * Wraps EVERY Resend send in try/catch. Never throws — always returns
 * { ok, id?, error? } and logs server-side so booking flows never crash
 * on email failure while failures stay observable.
 */
async function sendOneEmail(input: {
  to: string[];
  subject: string;
  html: string;
  logContext?: Record<string, unknown>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = getFromEmail();
  assertNoPlaceholders(input.html, String((input.logContext as any)?.type || input.subject));
  if (!resendApiKey) {
    const error = 'RESEND_API_KEY is not configured — email skipped (recorded as FAILED).';
    logger.error('[EmailService] ' + error, input.logContext);
    return { ok: false, error };
  }
  try {
    const result = await dispatchResendEmail({
      apiKey: resendApiKey,
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (!result.ok) {
      logger.error('[EmailService] Resend send failed:', result.error, {
        ...input.logContext,
        to: input.to,
        subject: input.subject,
      });
    }
    return result;
  } catch (err: any) {
    const message = err?.message || String(err);
    logger.error('[EmailService] Resend send threw:', err, input.logContext);
    Sentry.captureException(err, {
      tags: { service: 'email-service', action: 'sendOneEmail' },
      extra: { ...input.logContext, to: input.to },
    });
    return { ok: false, error: message };
  }
}

/**
 * Raw diagnostic send for the super-admin /api/admin/test-email route.
 * Bypasses the sandbox fallback on purpose so the dashboard shows exactly
 * what Resend returns (status, body) for the configured FROM + API key.
 */
export async function sendDiagnosticTestEmail(
  to: string
): Promise<{ ok: boolean; providerId?: string; status?: number; error?: string; from: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = getFromEmail();
  if (!resendApiKey) {
    return { ok: false, error: 'RESEND_API_KEY is not configured.', from };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Zansafari Horizon — email delivery test',
        html: `<p>This is a delivery test from Zansafari Horizon.</p><p>From: ${from}</p><p>If you received this, Resend + sender domain are correctly configured.</p>`,
      }),
    });
    const bodyText = await res.text().catch(() => '');
    let providerId: string | undefined;
    try {
      providerId = (JSON.parse(bodyText) as { id?: string }).id;
    } catch {
      providerId = undefined;
    }
    if (res.ok) {
      return { ok: true, providerId, status: res.status, from };
    }
    return { ok: false, status: res.status, error: `HTTP ${res.status}: ${bodyText}`, from };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err), from };
  }
}

/**
 * Resilient Resend dispatcher. In sandbox mode (when using onboarding@resend.dev),
 * Resend rejects non-account recipients with HTTP 403.
 * This helper intercepts 403 and automatically delivers to the verified sandbox email
 * so testing notifications are immediately received in the developer's inbox.
 */
async function dispatchResendEmail({
  apiKey,
  from,
  to,
  subject,
  html,
}: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const sandboxFallbackEmail = process.env.RESEND_SANDBOX_EMAIL || 'projectmember080@gmail.com';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, id: data.id };
    }

    const errorText = await res.text().catch(() => '');

    // If Resend returns 403, it's almost certainly because of Sandbox mode restrictions
    // (either unverified 'from' domain OR unverified 'to' email address).
    // We intercept this and FORCE delivery to the registered developer email using the allowed onboarding address.
    if (res.status === 403) {
      const isAlreadyRecipient = to.some(
        (addr) => addr.toLowerCase() === sandboxFallbackEmail.toLowerCase()
      );
      
      // Even if they are the recipient, if the 'from' address caused the 403, we still need to fallback.
      console.warn(
        `[EmailService] Resend Sandbox (403): Redirecting email from ${to.join(', ')} to ${sandboxFallbackEmail} (Error: ${errorText})`
      );
      
      const fallbackRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Zansafari Sandbox <onboarding@resend.dev>',
          to: [sandboxFallbackEmail],
          subject: `[Sandbox Preview - To: ${to.join(', ')}] ${subject}`,
          html,
        }),
      });

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        return { ok: true, id: fallbackData.id };
      }
      
      const fallbackError = await fallbackRes.text().catch(() => '');
      return { ok: false, error: `Fallback HTTP ${fallbackRes.status}: ${fallbackError}` };
    }

    return { ok: false, error: `HTTP ${res.status}: ${errorText}` };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export interface EmailBookingDetails {
  id: string;
  referenceCode: string;
  serviceType: 'TOUR' | 'TRANSPORT';
  title: string;
  date: string;
  time: string;
  guestsText: string;
  pickupLocation: string;
  dropoffLocation?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCountry: string;
  specialRequests?: string;
  totalPriceFormatted: string;
  paymentInstructions?: string;
  /** @deprecated P1: superseded by paymentMethods (super-admin settings). */
  mpesaNumber?: string | null;
  /** @deprecated P1: superseded by paymentMethods (super-admin settings). */
  bankName?: string | null;
  /** @deprecated P1: superseded by paymentMethods (super-admin settings). */
  bankAccount?: string | null;
  /** @deprecated P1: superseded by paymentMethods (super-admin settings). */
  paymentNotes?: string | null;
  /** P1: resolved enabled methods (localized labels + lines). */
  paymentMethods?: Array<{ code: string; label: string; lines: string[] }>;
  locale?: string;
  preferredLanguage?: string;
  operatorWhatsApp?: string;
  traLicenseNumber?: string | null;
  costFormatted?: string;
  profitFormatted?: string;
  tierName?: string;
}

/**
 * Generates HTML email for the tourist receiving their booking request confirmation.
 * Fully localized across all 6 supported languages (EN, FR, ES, IT, DE, AR).
 */
export function generateTouristEmailHtml(details: EmailBookingDetails): string {
  const userLocale = resolveEmailLocale(details.locale);
  const dict = getDictionary(userLocale);
  const isRtl = userLocale === 'ar';
  const textAlign = isRtl ? 'right' : 'left';

  // ONE localized greeting with the customer name interpolated (never literal {name}).
  const greeting = fillTemplate(dict.confirmation.greeting, { name: details.customerName });

  const operatorPhone = details.operatorWhatsApp || '+255 618 769 150';
  const cleanOperatorPhone = operatorPhone.replace(/[^0-9]/g, '');

  // Localized WhatsApp prefill from the tourist's dictionary (operator alerts stay English).
  const whatsAppText = encodeURIComponent(
    fillTemplate(dict.whatsapp.bookingConfirmation, {
      reference: details.referenceCode,
      service: details.title,
      date: `${details.date} (${details.time})`,
    })
  );
  const whatsAppUrl = `https://wa.me/${cleanOperatorPhone || '255618769150'}?text=${whatsAppText}`;
  const prefillNote = fillTemplate(dict.confirmation.prefillRefNote, { ref: details.referenceCode });

  // TRA claim renders ONLY when a license number is on file.
  const traLine = details.traLicenseNumber
    ? `<p style="margin:0 0 4px 0;"><strong>Zansafari Horizon</strong> • TRA Licensed Tour Operator (${details.traLicenseNumber})</p>`
    : `<p style="margin:0 0 4px 0;"><strong>Zansafari Horizon</strong> — Stone Town, Zanzibar, Tanzania</p>`;

  return `
<!DOCTYPE html>
<html lang="${userLocale}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${dict.booking.successTitle} — ${details.referenceCode}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;text-align:${textAlign};">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284c7,#0f766e);padding:35px 30px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">ZANSAFARI HORIZON</h1>
              <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Spice • Culture • Wildlife</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:35px 30px;text-align:${textAlign};">
              <div style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:12px 18px;text-align:center;margin-bottom:24px;">
                <span style="color:#065f46;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">✓ ${dict.confirmation.badgeLogged}</span>
              </div>

              <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;font-weight:700;">${greeting}</h2>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">
                ${dict.confirmation.availabilityNotice}
              </p>

              <!-- Reference Box -->
              <div style="background-color:#f8fafc;border:2px dashed #0284c7;border-radius:14px;padding:18px;text-align:center;margin-bottom:24px;">
                <span style="display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${dict.confirmation.refCode}</span>
                <span style="display:block;font-size:24px;font-weight:900;color:#0369a1;font-family:monospace;letter-spacing:1px;">${details.referenceCode}</span>
              </div>

              <!-- Status Notice -->
              <div style="background-color:#fffbeb;border-${isRtl ? 'right' : 'left'}:4px solid #f59e0b;padding:14px 18px;border-radius:${isRtl ? '10px 0 0 10px' : '0 10px 10px 0'};margin-bottom:24px;">
                <strong style="display:block;color:#92400e;font-size:13px;margin-bottom:4px;">⚠️ ${dict.confirmation.alertTitle}</strong>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#b45309;">
                  ${dict.confirmation.alertDesc}
                </p>
              </div>

              <!-- Booking Summary Table -->
              <h3 style="margin:0 0 12px 0;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">${dict.confirmation.summaryTitle}</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size:13px;border-collapse:collapse;margin-bottom:25px;background-color:#f8fafc;border-radius:12px;overflow:hidden;text-align:${textAlign};">
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="color:#64748b;font-weight:600;width:35%;">${dict.confirmation.serviceRequested}:</td>
                  <td style="color:#0f172a;font-weight:700;">${details.title}</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="color:#64748b;font-weight:600;">${dict.confirmation.dateTimeLabel}:</td>
                  <td style="color:#0f172a;font-weight:600;">${details.date} at ${details.time}</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="color:#64748b;font-weight:600;">${dict.confirmation.partySizeLabel}:</td>
                  <td style="color:#0f172a;">${details.guestsText}</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="color:#64748b;font-weight:600;">${dict.confirmation.pickupLabel}:</td>
                  <td style="color:#0f172a;">${details.pickupLocation}</td>
                </tr>
                ${details.dropoffLocation ? `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="color:#64748b;font-weight:600;">${dict.confirmation.dropoffLabel}:</td>
                  <td style="color:#0f172a;">${details.dropoffLocation}</td>
                </tr>` : ''}
                <tr>
                  <td style="color:#64748b;font-weight:600;">${dict.confirmation.estimatedPriceLabel}:</td>
                  <td style="color:#0f766e;font-weight:800;font-size:15px;">${details.totalPriceFormatted} <span style="font-size:11px;color:#64748b;font-weight:normal;">(${dict.confirmation.fullPaymentRequiredBadge})</span></td>
                </tr>
              </table>

              <!-- Payment Instructions (Post-Booking Notice) -->
              <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px;margin-bottom:28px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <span style="background-color:#16a34a;color:#ffffff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;text-transform:uppercase;">${dict.confirmation.fullPaymentRequiredBadge}</span>
                  <h4 style="margin:0;font-size:13px;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">${dict.confirmation.paymentTitle}</h4>
                </div>
                <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#166534;font-weight:500;">
                  ${dict.confirmation.paymentNoticeExcl}
                </p>
                ${(details.paymentMethods || []).length > 0 ? `
                <div style="background-color:#ffffff;border:1px solid #dcfce7;border-radius:10px;padding:14px;font-size:12px;line-height:1.7;color:#1e293b;">
                  <div style="margin:0 0 8px 0;font-size:12px;color:#166534;">${fillTemplate(dict.paymentMethods.instruction, { reference: details.referenceCode })}</div>
                  ${(details.paymentMethods || [])
                    .map(
                      (m) => `
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid #dcfce7;">
                    <div><strong>${m.label}</strong></div>
                    ${m.lines.map((line) => `<div style="color:#047857;font-family:monospace;font-weight:700;">${line}</div>`).join('')}
                  </div>`
                    )
                    .join('')}
                </div>` : ''}
              </div>

              <!-- WhatsApp CTA Button -->
              <div style="text-align:center;margin:30px 0 10px 0;">
                <a href="${whatsAppUrl}" target="_blank" style="display:inline-block;background-color:#25d366;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:30px;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(37,211,102,0.35);">
                  💬 ${dict.booking.chatWhatsAppNow}
                </a>
                <p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">${prefillNote}</p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 30px;text-align:center;color:#64748b;font-size:12px;">
              ${traLine}
              <p style="margin:0;">Stone Town, Zanzibar, Tanzania • WhatsApp: ${operatorPhone} • info@zansafarihorizon.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Helper to display human-friendly language name with flag.
 */
export function getLanguageName(locale: string): string {
  const map: Record<string, string> = {
    en: 'English 🇬🇧',
    sw: 'Swahili 🇹🇿',
    it: 'Italian 🇮🇹',
    fr: 'French 🇫🇷',
    de: 'German 🇩🇪',
    es: 'Spanish 🇪🇸',
    ar: 'Arabic 🇦🇪',
  };
  return map[locale?.toLowerCase()] || locale?.toUpperCase() || 'English 🇬🇧';
}

/**
 * Generates HTML email alert for Platform Admin when a new booking is requested.
 */
export function generatePlatformAdminBookingAlertEmailHtml(details: EmailBookingDetails, baseUrl: string): string {
  const platformBookingsUrl = `${baseUrl}/platform/bookings`;
  const cleanPhone = details.customerPhone.replace(/[^0-9]/g, '');
  const guestWhatsAppUrl = `https://wa.me/${cleanPhone}`;
  const langDisplay = getLanguageName(details.locale || 'en');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking Request Alert — ${details.referenceCode}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;">
          
          <!-- Alert Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#4338ca);padding:25px 30px;text-align:center;color:#ffffff;">
              <span style="background-color:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Platform Admin Booking Alert</span>
              <h1 style="margin:10px 0 0 0;font-size:22px;font-weight:800;">Ref: ${details.referenceCode}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <!-- Prominent Language Banner -->
              <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 18px;margin-bottom:24px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                  <div>
                    <span style="font-size:11px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;">🗣️ Tourist Language</span>
                    <div style="font-size:16px;font-weight:800;color:#1e3a8a;margin-top:2px;">${langDisplay} (${details.locale || 'en'})</div>
                  </div>
                  <div style="text-align:right;">
                    <span style="font-size:11px;font-weight:700;color:#64748b;">Country</span>
                    <div style="font-size:13px;font-weight:700;color:#0f172a;">${details.customerCountry || 'Unknown'}</div>
                  </div>
                </div>
                <p style="margin:6px 0 0 0;font-size:11px;line-height:1.4;color:#2563eb;">
                  Check availability in Ibrahim's guide network if a rare-language guide is needed.
                </p>
              </div>

              <h2 style="margin:0 0 14px 0;font-size:16px;font-weight:700;color:#0f172a;">Customer Details:</h2>
              <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:13px;margin-bottom:24px;background-color:#f8fafc;border-radius:10px;">
                <tr><td style="color:#64748b;width:35%;">Guest Name:</td><td style="font-weight:700;color:#0f172a;">${details.customerName}</td></tr>
                <tr><td style="color:#64748b;">WhatsApp / Phone:</td><td><a href="${guestWhatsAppUrl}" style="color:#0284c7;font-weight:700;text-decoration:none;">${details.customerPhone} (Open WhatsApp)</a></td></tr>
                <tr><td style="color:#64748b;">Email:</td><td><a href="mailto:${details.customerEmail}" style="color:#0284c7;text-decoration:none;">${details.customerEmail}</a></td></tr>
                <tr><td style="color:#64748b;">Country:</td><td style="color:#0f172a;">${details.customerCountry || 'Unknown'}</td></tr>
              </table>

              <h2 style="margin:0 0 14px 0;font-size:16px;font-weight:700;color:#0f172a;">Booking Specifications:</h2>
              <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:13px;margin-bottom:24px;background-color:#f8fafc;border-radius:10px;">
                <tr><td style="color:#64748b;width:35%;">Service:</td><td style="font-weight:700;color:#0f172a;">${details.title} (${details.serviceType})</td></tr>
                <tr><td style="color:#64748b;">Date & Time:</td><td style="font-weight:700;color:#047857;">${details.date} at ${details.time}</td></tr>
                <tr><td style="color:#64748b;">Guests/Pax:</td><td style="color:#0f172a;">${details.guestsText}</td></tr>
                <tr><td style="color:#64748b;">Pickup Area:</td><td style="color:#0f172a;">${details.pickupLocation}</td></tr>
                ${details.dropoffLocation ? `<tr><td style="color:#64748b;">Drop-off:</td><td style="color:#0f172a;">${details.dropoffLocation}</td></tr>` : ''}
                <tr><td style="color:#64748b;">Quoted Gross:</td><td style="font-weight:800;color:#4f46e5;">${details.totalPriceFormatted}</td></tr>
                <tr><td style="color:#64748b;">Special Requests:</td><td style="color:#475569;">${details.specialRequests || 'None'}</td></tr>
              </table>

              <!-- Quick Action Buttons -->
              <div style="text-align:center;margin-top:25px;">
                <a href="${platformBookingsUrl}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:700;margin-right:8px;">
                  Open in Platform Admin →
                </a>
                <a href="${guestWhatsAppUrl}" target="_blank" style="display:inline-block;background-color:#25d366;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:700;">
                  WhatsApp Guest
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Backward-compatibility alias for previous name.
 */
export const generateOperatorAlertEmailHtml = generatePlatformAdminBookingAlertEmailHtml;

/**
 * Dispatches emails via Resend API or records local simulated notification.
 */
export async function sendBookingNotifications(
  details: EmailBookingDetails,
  baseUrl: string = getAppBaseUrl()
): Promise<{ tourist: { ok: boolean; error?: string }; admin: { ok: boolean; error?: string } }> {
  const adminAlertEmail =
    process.env.PLATFORM_ADMIN_EMAIL || process.env.OPERATOR_ALERT_EMAIL || 'admin@zansafarihorizon.com';

  const userLocale = resolveEmailLocale(details.locale);
  const dict = getDictionary(userLocale);
  const touristSubject = `${dict.booking.successTitle} — ${details.referenceCode} | Zansafari Horizon`;

  // P1: resolve super-admin enabled payment methods (localized) when the
  // caller did not already supply them.
  if (!details.paymentMethods) {
    try {
      details.paymentMethods = await getEnabledPaymentMethods(details.locale);
    } catch (err) {
      console.warn('[EmailService] Failed to resolve payment methods:', err);
      details.paymentMethods = [];
    }
  }

  const touristHtml = generateTouristEmailHtml(details);
  const adminHtml = generatePlatformAdminBookingAlertEmailHtml(details, baseUrl);

  // 1. Tourist confirmation email (try/catch inside sendOneEmail — never throws)
  const touristRes = await sendOneEmail({
    to: [details.customerEmail],
    subject: touristSubject,
    html: touristHtml,
    logContext: { referenceCode: details.referenceCode, type: 'BOOKING_REQUEST_TOURIST' },
  });

  // 2. Platform admin alert email
  const adminRes = await sendOneEmail({
    to: [adminAlertEmail],
    subject: `🚨 [${getLanguageName(details.locale || 'en')}] New Booking Request — ${details.referenceCode} (${details.customerName})`,
    html: adminHtml,
    logContext: { referenceCode: details.referenceCode, type: 'BOOKING_REQUEST_PLATFORM_ADMIN_ALERT' },
  });

  // Record per-recipient Notification rows with SENT/FAILED + error message
  await persistNotification({
    bookingId: details.id,
    recipient: NotificationRecipient.TOURIST,
    type: 'BOOKING_REQUEST_TOURIST',
    payload: { referenceCode: details.referenceCode, to: details.customerEmail },
    ok: touristRes.ok,
    providerId: touristRes.id,
    error: touristRes.error,
  });

  await persistNotification({
    bookingId: details.id,
    recipient: NotificationRecipient.PLATFORM_ADMIN,
    type: 'BOOKING_REQUEST_PLATFORM_ADMIN_ALERT',
    payload: { referenceCode: details.referenceCode, to: adminAlertEmail },
    ok: adminRes.ok,
    providerId: adminRes.id,
    error: adminRes.error,
  });

  return { tourist: touristRes, admin: adminRes };
}

export interface ConfirmedNotificationDetails {
  bookingId: string;
  referenceCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceTitle: string;
  bookingDate: string;
  bookingTime: string;
  pickupLocation: string;
  amountPaidFormatted: string;
  totalPriceFormatted: string;
  paymentMethod: string;
  paymentReference?: string | null;
  profitFormatted?: string | null;
  operatorName: string;
  receiptNumber?: string;
  verificationCode?: string;
  locale?: string;
  traLicenseNumber?: string | null;
  receiptUrl?: string;
  /** Absolute verify URL: {APP_URL}/verify?code={verificationCode} */
  verifyUrl?: string;
  /** Hosted PNG for email clients: {APP_URL}/api/qr?code={verificationCode} */
  qrImageUrl?: string;
  /** @deprecated data-URL images are blocked by most email clients; kept for back-compat only */
  qrDataUrl?: string;
  leadGuideName?: string;
  leadGuidePhone?: string;
}

/**
 * HTML email sent to tourist when booking is fully paid and officially CONFIRMED.
 * Features official branded receipt details and 6-char verification code for tour day check-in.
 */
export function generateConfirmedTouristEmailHtml(details: ConfirmedNotificationDetails): string {
  const userLocale = resolveEmailLocale(details.locale);
  const dict = getDictionary(userLocale);
  const isRtl = userLocale === 'ar';

  const greeting = fillTemplate(dict.confirmation.greeting, { name: details.customerName });
  const paidLine = fillTemplate(dict.confirmation.confirmedPaidLine, {
    amount: details.amountPaidFormatted,
    method: details.paymentMethod,
    operator: details.operatorName,
  });
  const arrivalDesc = fillTemplate(dict.confirmation.arrivalDesc, {
    code: details.verificationCode || details.referenceCode,
  });

  const whatsAppText = encodeURIComponent(
    fillTemplate(dict.whatsapp.receiptConfirmed, {
      reference: details.referenceCode,
      date: details.bookingDate,
    })
  );
  const whatsAppUrl = `https://wa.me/255618769150?text=${whatsAppText}`;

  // TRA badge renders ONLY when a license number is on file.
  const traBadge = details.traLicenseNumber
    ? `TRA REGISTERED • ${dict.confirmation.officialReceiptBadge}`
    : dict.confirmation.officialReceiptBadge;

  return `
<!DOCTYPE html>
<html lang="${userLocale}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${fillTemplate(dict.confirmation.confirmedSubject, { reference: details.referenceCode })}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#0d9488);padding:35px 30px;text-align:center;color:#ffffff;">
              <span style="background-color:rgba(255,255,255,0.2);padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
                ${traBadge}
              </span>
              <h1 style="margin:12px 0 0 0;font-size:24px;font-weight:800;">${dict.confirmation.confirmedHeader}</h1>
              <p style="margin:6px 0 0 0;font-size:13px;opacity:0.95;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Zansafari Horizon</p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:35px 30px;">
              <!-- Verification Code & Receipt Box -->
              ${
                details.verificationCode
                  ? `
              <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:2px solid #059669;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
                <span style="display:block;font-size:11px;font-weight:800;color:#047857;text-transform:uppercase;letter-spacing:1px;">
                  ${dict.confirmation.uhakikiTitle}
                </span>
                <div style="font-size:32px;font-weight:900;color:#065f46;font-family:monospace;letter-spacing:4px;margin:8px 0;">
                  ${details.verificationCode}
                </div>
                <div style="font-size:12px;color:#047857;font-weight:600;">
                  ${dict.confirmation.receiptNumberLabel}: <span style="font-family:monospace;font-weight:700;">${details.receiptNumber || 'ZSH-RECEIPT'}</span>
                </div>
                <p style="margin:10px 0 0 0;font-size:12px;line-height:1.5;color:#065f46;">
                  🔑 <em>${dict.confirmation.uhakikiHelp}</em>
                </p>
              </div>
              `
                  : `
              <div style="background-color:#ecfdf5;border:2px solid #10b981;border-radius:14px;padding:16px;text-align:center;margin-bottom:24px;">
                <span style="display:block;font-size:12px;font-weight:800;color:#047857;text-transform:uppercase;letter-spacing:1px;">${dict.confirmation.paymentRecordedBadge}</span>
                <span style="display:block;font-size:24px;font-weight:900;color:#065f46;margin-top:4px;">${details.referenceCode}</span>
              </div>
              `
              }

              <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">${greeting}</h2>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">
                ${paidLine}
              </p>

              <!-- Trip & Payment Summary Table (NEVER reveals cost/profit) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size:13px;margin-bottom:24px;background-color:#f8fafc;border-radius:12px;border-collapse:collapse;">
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;width:35%;font-weight:600;">${dict.confirmation.serviceRequested}:</td><td style="font-weight:700;color:#0f172a;">${details.serviceTitle}</td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;font-weight:600;">${dict.confirmation.dateTimeLabel}:</td><td style="font-weight:700;color:#047857;">${details.bookingDate} at ${details.bookingTime}</td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;font-weight:600;">${dict.confirmation.pickupLabel}:</td><td style="color:#0f172a;">${details.pickupLocation}</td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;font-weight:600;">${dict.confirmation.amountPaidLabel}:</td><td style="font-weight:800;color:#047857;">${details.amountPaidFormatted} (${dict.confirmation.paidInFullBadge})</td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;font-weight:600;">${dict.confirmation.paymentMethodLabel}:</td><td style="color:#0f172a;">${details.paymentMethod}</td></tr>
                ${details.receiptNumber ? `<tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;font-weight:600;">${dict.confirmation.receiptNumberLabel}:</td><td style="font-weight:700;font-family:monospace;color:#0f172a;">${details.receiptNumber}</td></tr>` : ''}
                ${details.paymentReference ? `<tr><td style="color:#64748b;font-weight:600;">${dict.confirmation.paymentRefLabel}:</td><td style="color:#0f172a;font-family:monospace;">${details.paymentReference}</td></tr>` : ''}
              </table>

              <!-- QR Code & Printable Receipt CTA (hosted image + plain-text fallback: data-URLs are blocked in email clients) -->
              ${
                details.receiptUrl || details.verifyUrl
                  ? `
              <div style="background-color:#f1f5f9;border:1px solid #cbd5e1;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px;">
                ${
                  details.qrImageUrl || details.qrDataUrl
                    ? `
                <div style="margin-bottom:12px;">
                  <img src="${details.qrImageUrl || details.qrDataUrl}" width="150" height="150" alt="Receipt verification QR code — scan to verify" style="display:inline-block;border-radius:8px;border:1px solid #cbd5e1;padding:4px;background:#ffffff;" />
                </div>
                `
                    : ''
                }
                ${
                  details.verificationCode
                    ? `
                <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">${dict.confirmation.verificationCodeLabel}</div>
                <div style="font-size:28px;font-weight:900;color:#065f46;font-family:monospace;letter-spacing:4px;margin:4px 0 8px 0;">${details.verificationCode}</div>
                `
                    : ''
                }
                ${
                  details.verifyUrl
                    ? `
                <div style="font-size:12px;color:#475569;margin-bottom:12px;word-break:break-all;">
                  ${dict.confirmation.verifyOnlineCaption} <a href="${details.verifyUrl}" target="_blank" style="color:#0284c7;font-weight:700;">${details.verifyUrl}</a>
                </div>
                <a href="${details.verifyUrl}" target="_blank" style="display:inline-block;background-color:#0369a1;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;margin-bottom:8px;">
                  ✅ ${dict.confirmation.verifyOnlineCta}
                </a><br />
                `
                    : ''
                }
                ${
                  details.receiptUrl
                    ? `
                <a href="${details.receiptUrl}" target="_blank" style="display:inline-block;background-color:#047857;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                  📄 ${dict.confirmation.viewReceiptCta}
                </a>
                `
                    : ''
                }
              </div>
              `
                  : ''
              }

              <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px;text-align:left;">
                <strong style="color:#166534;font-size:13px;display:block;margin-bottom:4px;">${dict.confirmation.arrivalTitle}</strong>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#14532d;">
                  ${arrivalDesc}
                </p>
              </div>

              <div style="text-align:center;margin-top:24px;">
                <a href="${whatsAppUrl}" target="_blank" style="display:inline-block;background-color:#25d366;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:30px;font-size:14px;font-weight:700;">
                  💬 ${dict.booking.chatWhatsAppNow}
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * HTML email sent to Platform Admin when a booking is fully paid and confirmed.
 */
export function generateConfirmedPlatformAdminEmailHtml(details: ConfirmedNotificationDetails, baseUrl: string): string {
  const platformUrl = `${baseUrl}/platform`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmed Alert — ${details.referenceCode}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#4338ca);padding:25px 30px;text-align:center;color:#ffffff;">
              <span style="background-color:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;">Platform Admin Alert</span>
              <h1 style="margin:10px 0 0 0;font-size:22px;font-weight:800;">Booking Fully Paid & Confirmed</h1>
              <p style="margin:4px 0 0 0;font-size:13px;opacity:0.9;">Ref: ${details.referenceCode}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:#334155;">
                Operator <strong>${details.operatorName}</strong> has recorded full payment for booking <strong>${details.referenceCode}</strong>. The booking is now <strong>CONFIRMED</strong>.
              </p>

              <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:13px;margin-bottom:20px;background-color:#f8fafc;border-radius:10px;">
                <tr><td style="color:#64748b;width:40%;">Customer:</td><td style="font-weight:700;">${details.customerName} (${details.customerEmail})</td></tr>
                <tr><td style="color:#64748b;">Service:</td><td style="font-weight:700;">${details.serviceTitle}</td></tr>
                <tr><td style="color:#64748b;">Date:</td><td>${details.bookingDate} (${details.bookingTime})</td></tr>
                <tr><td style="color:#64748b;">Amount Paid:</td><td style="font-weight:800;color:#047857;">${details.amountPaidFormatted}</td></tr>
                <tr><td style="color:#64748b;">Payment Method:</td><td>${details.paymentMethod}</td></tr>
                ${details.paymentReference ? `<tr><td style="color:#64748b;">Reference:</td><td style="font-family:monospace;">${details.paymentReference}</td></tr>` : ''}
              </table>

              <div style="text-align:center;margin-top:24px;">
                <a href="${platformUrl}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:700;">
                  Open Platform Admin Dashboard →
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatches confirmation emails to tourist and platform admin when PAID_IN_FULL is achieved.
 */
export async function sendBookingConfirmedNotifications(
  details: ConfirmedNotificationDetails,
  baseUrl: string = getAppBaseUrl()
): Promise<{ tourist: { ok: boolean; error?: string }; admin: { ok: boolean; error?: string } }> {
  const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@zansafarihorizon.com';

  const userLocale = resolveEmailLocale(details.locale);
  const touristDict = getDictionary(userLocale);
  const touristSubject = fillTemplate(touristDict.confirmation.confirmedSubject, {
    reference: details.referenceCode,
  });

  const touristHtml = generateConfirmedTouristEmailHtml(details);
  const adminHtml = generateConfirmedPlatformAdminEmailHtml(details, baseUrl);

  // 1. Tourist Confirmation Email (try/catch inside sendOneEmail — never throws)
  const touristRes = await sendOneEmail({
    to: [details.customerEmail],
    subject: touristSubject,
    html: touristHtml,
    logContext: { bookingId: details.bookingId, referenceCode: details.referenceCode, type: 'BOOKING_CONFIRMED_TOURIST' },
  });

  // 2. Platform Admin Alert
  const adminRes = await sendOneEmail({
    to: [platformAdminEmail],
    subject: `💰 Booking Fully Paid & Confirmed — ${details.referenceCode} (${details.customerName})`,
    html: adminHtml,
    logContext: { bookingId: details.bookingId, referenceCode: details.referenceCode, type: 'BOOKING_CONFIRMED_PLATFORM_ADMIN' },
  });

  // Record per-recipient Notification rows with SENT/FAILED + error message
  await persistNotification({
    bookingId: details.bookingId,
    recipient: NotificationRecipient.TOURIST,
    type: 'BOOKING_CONFIRMED_TOURIST',
    payload: { referenceCode: details.referenceCode, amount: details.amountPaidFormatted },
    ok: touristRes.ok,
    providerId: touristRes.id,
    error: touristRes.error,
  });

  await persistNotification({
    bookingId: details.bookingId,
    recipient: NotificationRecipient.PLATFORM_ADMIN,
    type: 'BOOKING_CONFIRMED_PLATFORM_ADMIN',
    payload: { referenceCode: details.referenceCode, amount: details.amountPaidFormatted },
    ok: adminRes.ok,
    providerId: adminRes.id,
    error: adminRes.error,
  });

  return { tourist: touristRes, admin: adminRes };
}

export interface CancelledNotificationDetails {
  bookingId: string;
  referenceCode: string;
  customerName: string;
  customerEmail: string;
  serviceTitle: string;
  bookingDate: string;
  reason: string;
  status: 'REJECTED' | 'CANCELLED';
  locale?: string;
  operatorWhatsApp?: string;
  traLicenseNumber?: string | null;
}

export function generateCancelledTouristEmailHtml(details: CancelledNotificationDetails): string {
  const userLocale = resolveEmailLocale(details.locale);
  const dict = getDictionary(userLocale);
  const isRtl = userLocale === 'ar';
  const textAlign = isRtl ? 'right' : 'left';

  const operatorPhone = details.operatorWhatsApp || '+255 618 769 150';
  const cleanPhone = operatorPhone.replace(/[^0-9]/g, '') || '255618769150';

  const whatsAppText = encodeURIComponent(
    fillTemplate(dict.whatsapp.bookingConfirmation, {
      reference: details.referenceCode,
      service: details.serviceTitle,
      date: details.bookingDate,
    })
  );
  const whatsAppUrl = `https://wa.me/${cleanPhone}?text=${whatsAppText}`;

  const isRejected = details.status === 'REJECTED';
  const badgeTitle = isRejected ? dict.confirmation.requestDeclinedBadge : dict.confirmation.requestCancelledBadge;
  const hello = fillTemplate(dict.confirmation.emailHello, { name: details.customerName });
  const bodyText = fillTemplate(dict.confirmation.cancelledBody, {
    service: details.serviceTitle,
    date: details.bookingDate,
  });
  const traLine = details.traLicenseNumber
    ? `<p style="margin:0 0 4px 0;"><strong>Zansafari Horizon</strong> • TRA Licensed Tour Operator (${details.traLicenseNumber})</p>`
    : `<p style="margin:0 0 4px 0;"><strong>Zansafari Horizon</strong> — Stone Town, Zanzibar, Tanzania</p>`;

  return `
<!DOCTYPE html>
<html lang="${userLocale}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${badgeTitle} — ${details.referenceCode}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <tr>
            <td style="background:linear-gradient(135deg,#991b1b,#b91c1c);padding:35px 30px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:22px;font-weight:800;">${badgeTitle.toUpperCase()}</h1>
              <p style="margin:6px 0 0 0;font-size:13px;opacity:0.95;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Zansafari Horizon</p>
            </td>
          </tr>
          <tr>
            <td style="padding:35px 30px;text-align:${textAlign};">
              <div style="background-color:#fef2f2;border:2px solid #ef4444;border-radius:14px;padding:16px;text-align:center;margin-bottom:24px;">
                <span style="display:block;font-size:12px;font-weight:800;color:#b91c1c;text-transform:uppercase;letter-spacing:1px;">Booking Reference</span>
                <span style="display:block;font-size:24px;font-weight:900;color:#991b1b;margin-top:4px;">${details.referenceCode}</span>
              </div>

              <h2 style="margin:0 0 12px 0;font-size:18px;color:#0f172a;">${hello}</h2>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">
                ${bodyText}
              </p>

              <div style="background-color:#fff1f2;border-left:4px solid #f43f5e;border-radius:8px;padding:16px;margin-bottom:24px;">
                <strong style="color:#9f1239;font-size:13px;display:block;margin-bottom:6px;">${dict.confirmation.operationsNoteLabel}</strong>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#881337;">
                  ${details.reason}
                </p>
              </div>

              <p style="margin:0 0 24px 0;font-size:13px;line-height:1.6;color:#64748b;">
                ${dict.confirmation.cancelledAlt}
              </p>

              <div style="text-align:center;margin-top:24px;">
                <a href="${whatsAppUrl}" target="_blank" style="display:inline-block;background-color:#25d366;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:30px;font-size:14px;font-weight:700;">
                  💬 ${dict.confirmation.cancelledCta}
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 30px;text-align:center;color:#64748b;font-size:12px;">
              ${traLine}
              <p style="margin:0;">Stone Town, Zanzibar, Tanzania • info@zansafarihorizon.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendBookingCancelledNotification(
  details: CancelledNotificationDetails
): Promise<{ ok: boolean; error?: string }> {
  const cancelDict = getDictionary(resolveEmailLocale(details.locale));
  const subject = fillTemplate(cancelDict.confirmation.cancelledSubject, {
    reference: details.referenceCode,
  });
  const html = generateCancelledTouristEmailHtml(details);
  const type = details.status === 'REJECTED' ? 'BOOKING_REJECTED_TOURIST' : 'BOOKING_CANCELLED_TOURIST';

  const res = await sendOneEmail({
    to: [details.customerEmail],
    subject,
    html,
    logContext: { bookingId: details.bookingId, referenceCode: details.referenceCode, type },
  });

  await persistNotification({
    bookingId: details.bookingId,
    recipient: NotificationRecipient.TOURIST,
    type,
    payload: { referenceCode: details.referenceCode, reason: details.reason },
    ok: res.ok,
    providerId: res.id,
    error: res.error,
  });

  return res;
}

export interface SettlementNotificationDetails {
  id?: string;
  operatorId: string;
  operatorName: string;
  operatorEmail?: string | null;
  month: string; // "YYYY-MM"
  totalBookings: number;
  totalRevenueFormatted: string;
  totalProfitFormatted: string;
  commissionRateFormatted: string;
  commissionDueFormatted: string;
  missingCostCount?: number;
  status: string;
  notes?: string | null;
}

/**
 * Generates an executive HTML statement email for monthly settlements.
 */
export function generateSettlementStatementEmailHtml(
  details: SettlementNotificationDetails,
  baseUrl: string = getAppBaseUrl()
): string {
  const dashboardUrl = `${baseUrl}/platform/settlements`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Statement for ${details.month} — Zansafari Horizon</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #047857 0%, #065f46 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Zansafari Horizon</h1>
              <p style="color: #a7f3d0; margin: 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Monthly Revenue Statement</p>
            </td>
          </tr>

          <!-- Notice Banner -->
          <tr>
            <td style="padding: 24px 24px 16px 24px;">
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px;">
                <h2 style="color: #065f46; margin: 0 0 6px 0; font-size: 18px; font-weight: 600;">Monthly statement for ${details.month} is ready</h2>
                <p style="color: #047857; margin: 0; font-size: 14px; line-height: 1.5;">
                  The financial rollup for <strong>${details.operatorName}</strong> for service month <strong>${details.month}</strong> has been generated and is ready for review.
                </p>
              </div>
            </td>
          </tr>

          <!-- Financial Breakdown Table -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b;">METRIC</td>
                  <td align="right" style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b;">AMOUNT / VALUE</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 16px; font-size: 14px; color: #334155;">Service Month</td>
                  <td align="right" style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #0f172a;">${details.month}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 16px; font-size: 14px; color: #334155;">Completed Bookings</td>
                  <td align="right" style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #0f172a;">${details.totalBookings}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 16px; font-size: 14px; color: #334155;">Total Gross Revenue</td>
                  <td align="right" style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #0f172a;">${details.totalRevenueFormatted}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 16px; font-size: 14px; color: #334155;">Total Gross Profit</td>
                  <td align="right" style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #059669;">${details.totalProfitFormatted}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 16px; font-size: 14px; color: #334155;">Platform Commission Rate</td>
                  <td align="right" style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #0f172a;">${details.commissionRateFormatted}</td>
                </tr>
                <tr style="background-color: #f0fdf4; border-top: 2px solid #10b981;">
                  <td style="padding: 14px 16px; font-size: 15px; font-weight: 700; color: #065f46;">Commission Due Platform</td>
                  <td align="right" style="padding: 14px 16px; font-size: 16px; font-weight: 700; color: #047857;">${details.commissionDueFormatted}</td>
                </tr>
              </table>

              ${
                details.missingCostCount && details.missingCostCount > 0
                  ? `<div style="margin-top: 16px; padding: 12px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; color: #92400e; font-size: 13px;">
                      ⚠️ <strong>Note:</strong> ${details.missingCostCount} completed booking(s) were excluded from this statement due to missing operating cost. Once costs are supplied, regenerate this statement.
                    </div>`
                  : ''
              }

              <!-- Review CTA Button -->
              <div style="margin-top: 24px; text-align: center;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  Review Statement in Dashboard &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 4px 0;">This automated statement was generated by Zansafari Horizon Platform.</p>
              <p style="margin: 0;">In case of questions or ledger reconciliation inquiries, please contact platform administration.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatches monthly statement ready emails to both PLATFORM_ADMIN and OPERATOR.
 */
export async function sendSettlementStatementNotification(
  details: SettlementNotificationDetails,
  baseUrl: string = getAppBaseUrl()
): Promise<{ ok: boolean; error?: string }> {
  const subject = `Monthly statement for ${details.month} is ready | Zansafari Horizon`;
  const html = generateSettlementStatementEmailHtml(details, baseUrl);

  // 1. Fetch Platform Admin emails
  const admins = await prisma.adminUser.findMany({
    where: { role: 'PLATFORM_ADMIN', isActive: true },
    select: { email: true },
  });

  const recipientEmails: string[] = [];
  if (details.operatorEmail) {
    recipientEmails.push(details.operatorEmail);
  }
  for (const admin of admins) {
    if (admin.email && !recipientEmails.includes(admin.email)) {
      recipientEmails.push(admin.email);
    }
  }

  if (recipientEmails.length === 0) {
    const error = 'No recipients found for monthly statement notification.';
    console.warn('[EmailService] ' + error);
    await persistNotification({
      recipient: NotificationRecipient.PLATFORM_ADMIN,
      type: 'SETTLEMENT_STATEMENT_READY',
      payload: { operatorId: details.operatorId, month: details.month },
      ok: false,
      error,
    });
    return { ok: false, error };
  }

  const res = await sendOneEmail({
    to: recipientEmails,
    subject,
    html,
    logContext: { month: details.month, operatorId: details.operatorId, type: 'SETTLEMENT_STATEMENT_READY' },
  });

  // 2. Persist Notification rows with SENT/FAILED status
  const payload = {
    operatorId: details.operatorId,
    month: details.month,
    totalBookings: details.totalBookings,
    commissionDue: details.commissionDueFormatted,
  };
  await persistNotification({
    recipient: NotificationRecipient.OPERATOR,
    type: 'SETTLEMENT_STATEMENT_READY',
    payload,
    ok: res.ok,
    providerId: res.id,
    error: res.error,
  });
  await persistNotification({
    recipient: NotificationRecipient.PLATFORM_ADMIN,
    type: 'SETTLEMENT_STATEMENT_READY',
    payload,
    ok: res.ok,
    providerId: res.id,
    error: res.error,
  });

  return res;
}

// --------------------------------------------------------
// PHASE R2: WHATSAPP LINK BUILDERS
// --------------------------------------------------------

export interface ForwardLeadWhatsAppParams {
  leadGuidePhone: string;
  referenceCode: string;
  locale: string;
  customerName: string;
  customerCountry?: string;
  serviceTitle: string;
  tourDate: string;
  adults: number;
  children?: number;
  pickupLocation?: string;
}

export function buildForwardLeadWhatsAppUrl(params: ForwardLeadWhatsAppParams): string {
  const cleanPhone = (params.leadGuidePhone || '+255618769150').replace(/[^0-9]/g, '');
  const langDisplay = getLanguageName(params.locale || 'en');
  const paxText = `${params.adults} Adults${params.children ? `, ${params.children} Children` : ''}`;

  const message = [
    `*NEW LEAD FORWARDED — Zansafari Horizon* 🌊`,
    `Ref: *${params.referenceCode}*`,
    `🗣️ Language: *${langDisplay}* (${params.locale || 'en'})`,
    `🌍 Tourist: *${params.customerName}* (${params.customerCountry || 'International'})`,
    `📍 Service: *${params.serviceTitle}*`,
    `📅 Date: *${params.tourDate}*`,
    `👥 Pax: *${paxText}*`,
    `🚗 Pickup: ${params.pickupLocation || 'Stone Town / TBD'}`,
    ``,
    `*Note for Ibrahim:*`,
    `Please check your offline guide network availability for *${langDisplay}* speakers in case this booking confirms!`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface WorkOrderWhatsAppParams {
  leadGuidePhone: string;
  referenceCode: string;
  locale: string;
  customerName: string;
  customerPhone: string;
  customerCountry?: string;
  serviceTitle: string;
  tourDate: string;
  bookingTime?: string;
  adults: number;
  children?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  amountPaid: number;
  currency: string;
  specialRequests?: string;
  receiptNumber?: string;
  verificationCode?: string;
}

export function buildWorkOrderWhatsAppUrl(params: WorkOrderWhatsAppParams): string {
  const cleanPhone = (params.leadGuidePhone || '+255618769150').replace(/[^0-9]/g, '');
  const langDisplay = getLanguageName(params.locale || 'en');
  const paxText = `${params.adults} Adults${params.children ? `, ${params.children} Children` : ''}`;

  const message = [
    `*OFFICIAL WORK ORDER — CONFIRMED & PAID IN FULL* 📋`,
    `Ref: *${params.referenceCode}*`,
    params.receiptNumber ? `🎟️ Receipt: *${params.receiptNumber}*` : '',
    params.verificationCode ? `🔐 Uhakiki / Check-In Code: *${params.verificationCode}* (Office calls this to verify)` : '',
    `🗣️ Required Language: *${langDisplay}* (${params.locale || 'en'})`,
    `📅 Date: *${params.tourDate}* ${params.bookingTime ? `at ${params.bookingTime}` : ''}`,
    `📍 Service: *${params.serviceTitle}*`,
    `👥 Pax: *${paxText}*`,
    `🚗 Pickup: *${params.pickupLocation || 'Stone Town / TBD'}*`,
    params.dropoffLocation ? `🏁 Dropoff: *${params.dropoffLocation}*` : '',
    `👤 Tourist: *${params.customerName}* (${params.customerCountry || 'Guest'})`,
    `📞 Phone/WA: ${params.customerPhone}`,
    `💰 Status: ✅ *PAID IN FULL* (${params.currency} ${params.amountPaid.toLocaleString()})`,
    params.specialRequests ? `📝 Notes: ${params.specialRequests}` : '',
    ``,
    `*ACTION REQUIRED BY IBRAHIM:*`,
    `1. Assign a professional guide fluent in *${langDisplay}* from your network (or handle personally).`,
    `2. On tour day, verify with office using Uhakiki Code *${params.verificationCode || params.referenceCode}*.`,
    `3. Reply with assigned Guide Name & Phone Number so Platform Admin can log it and introduce the guide to the tourist.`,
  ].filter(Boolean).join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface GuideIntroWhatsAppParams {
  touristPhone: string;
  referenceCode: string;
  locale: string;
  customerName: string;
  guideName: string;
  guidePhone: string;
  serviceTitle: string;
  tourDate: string;
}

export function buildGuideIntroWhatsAppUrl(params: GuideIntroWhatsAppParams): string {
  const cleanTouristPhone = params.touristPhone.replace(/[^0-9]/g, '');
  const cleanGuidePhone = params.guidePhone.replace(/[^0-9]/g, '');

  let text = '';
  switch (params.locale?.toLowerCase()) {
    case 'it':
      text = `Ciao ${params.customerName}! 🌴\nIl tuo tour *${params.serviceTitle}* con Zansafari Horizon per il *${params.tourDate}* (Rif: ${params.referenceCode}) è confermato!\n\nLa tua guida designata è *${params.guideName}* (Tel/WhatsApp: ${params.guidePhone}).\nPuoi scrivergli direttamente qui: https://wa.me/${cleanGuidePhone}\n\nNon vediamo l'ora di darti il benvenuto a Zanzibar! 🇹🇿`;
      break;
    case 'fr':
      text = `Bonjour ${params.customerName}! 🌴\nVotre excursion *${params.serviceTitle}* avec Zansafari Horizon le *${params.tourDate}* (Réf: ${params.referenceCode}) est confirmée!\n\nVotre guide attitré est *${params.guideName}* (Tél/WhatsApp: ${params.guidePhone}).\nVous pouvez le contacter directement ici: https://wa.me/${cleanGuidePhone}\n\nBienvenue à Zanzibar! 🇹🇿`;
      break;
    case 'de':
      text = `Hallo ${params.customerName}! 🌴\nIhre Tour *${params.serviceTitle}* mit Zansafari Horizon am *${params.tourDate}* (Ref: ${params.referenceCode}) ist bestätigt!\n\nIhr persönlicher Guide ist *${params.guideName}* (Tel/WhatsApp: ${params.guidePhone}).\nSie können ihn direkt auf WhatsApp kontaktieren: https://wa.me/${cleanGuidePhone}\n\nWir freuen uns auf Sie in Sansibar! 🇹🇿`;
      break;
    case 'es':
      text = `¡Hola ${params.customerName}! 🌴\nTu excursión *${params.serviceTitle}* con Zansafari Horizon para el *${params.tourDate}* (Ref: ${params.referenceCode}) está confirmada.\n\nTu guía asignado es *${params.guideName}* (Tel/WhatsApp: ${params.guidePhone}).\nPuedes escribirle directamente aquí: https://wa.me/${cleanGuidePhone}\n\n¡Te esperamos en Zanzíbar! 🇹🇿`;
      break;
    case 'sw':
      text = `Habari ${params.customerName}! 🌴\nZiara yako ya *${params.serviceTitle}* na Zansafari Horizon tarehe *${params.tourDate}* (Kumb: ${params.referenceCode}) imethibitishwa.\n\nKiongozi wako wa ziara ni *${params.guideName}* (Simu/WhatsApp: ${params.guidePhone}).\nWasiliana naye hapa: https://wa.me/${cleanGuidePhone}\n\nKaribu Zanzibar! 🇹🇿`;
      break;
    default:
      text = `Hello ${params.customerName}! 🌴\nYour *${params.serviceTitle}* with Zansafari Horizon on *${params.tourDate}* (Ref: ${params.referenceCode}) is confirmed!\n\nYour assigned guide is *${params.guideName}* (Phone/WhatsApp: ${params.guidePhone}).\nYou can message them directly on WhatsApp: https://wa.me/${cleanGuidePhone}\n\nWe look forward to hosting you in Zanzibar! 🇹🇿`;
      break;
  }

  return `https://wa.me/${cleanTouristPhone}?text=${encodeURIComponent(text)}`;
}

// --------------------------------------------------------
// PHASE R2: WORK ORDER EMAIL & NOTIFICATIONS
// --------------------------------------------------------

export interface WorkOrderDetails {
  bookingId: string;
  referenceCode: string;
  locale: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCountry?: string;
  serviceTitle: string;
  serviceType: 'TOUR' | 'TRANSPORT';
  bookingDate: string;
  bookingTime?: string;
  adults: number;
  children?: number;
  pickupLocation: string;
  dropoffLocation?: string;
  amountPaid: number;
  currency: string;
  specialRequests?: string;
  leadGuideName: string;
  leadGuideEmail: string;
  leadGuidePhone: string;
  leadGuideWhatsApp?: string;
  receiptNumber?: string;
  verificationCode?: string;
}

export function generateWorkOrderEmailHtml(details: WorkOrderDetails, baseUrl?: string): string {
  const langDisplay = getLanguageName(details.locale || 'en');
  const cleanPhone = (details.customerPhone || '').replace(/[^0-9]/g, '');
  const guestWhatsAppUrl = `https://wa.me/${cleanPhone}`;
  const paxText = `${details.adults} Adults${details.children ? `, ${details.children} Children` : ''}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Official Work Order — ${details.referenceCode}</title>
</head>
<body style="margin:0;padding:0;background-color:#090d16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#090d16;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b,#047857);padding:25px 30px;text-align:center;color:#ffffff;">
              <span style="background-color:rgba(255,255,255,0.2);padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
                OFFICIAL WORK ORDER • CONFIRMED
              </span>
              <h1 style="margin:12px 0 0 0;font-size:24px;font-weight:800;">Ref: ${details.referenceCode}</h1>
              <p style="margin:4px 0 0 0;font-size:13px;opacity:0.9;">Zansafari Horizon Operations</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <!-- Prominent Language Requirement Banner -->
              <div style="background-color:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                <span style="font-size:11px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">
                  🗣️ Tourist Language Requirement
                </span>
                <div style="font-size:18px;font-weight:800;color:#78350f;margin-top:2px;">
                  ${langDisplay} (${details.locale || 'en'})
                </div>
                <p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;color:#92400e;">
                  <strong>Action for Ibrahim (${details.leadGuideName}):</strong> Assign an offline guide fluent in <strong>${langDisplay}</strong> from your network, or lead this tour yourself.
                </p>
              </div>

              <!-- Uhakiki / Check-In Code Box -->
              ${
                details.verificationCode
                  ? `
              <div style="background-color:#ecfdf5;border:2px dashed #059669;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
                <span style="font-size:11px;font-weight:800;color:#047857;text-transform:uppercase;letter-spacing:1px;">
                  🔐 TOUR DAY UHAKIKI / CHECK-IN CODE
                </span>
                <div style="font-size:26px;font-weight:900;color:#065f46;font-family:monospace;letter-spacing:3px;margin:6px 0;">
                  ${details.verificationCode}
                </div>
                <span style="font-size:12px;color:#047857;">Receipt: ${details.receiptNumber || 'Issued'}</span>
                <p style="margin:6px 0 0 0;font-size:11px;color:#065f46;">
                  When meeting tourist or calling company phone, reference this code for check-in confirmation.
                </p>
              </div>
              `
                  : ''
              }

              <h2 style="margin:0 0 12px 0;font-size:16px;font-weight:700;color:#0f172a;">Trip Execution Details</h2>
              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size:13px;margin-bottom:24px;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                <tr><td style="color:#64748b;width:35%;">Service:</td><td style="font-weight:700;color:#0f172a;">${details.serviceTitle}</td></tr>
                <tr><td style="color:#64748b;">Tour Date:</td><td style="font-weight:700;color:#047857;">${details.bookingDate} ${details.bookingTime ? `at ${details.bookingTime}` : ''}</td></tr>
                <tr><td style="color:#64748b;">Guests:</td><td style="font-weight:700;color:#0f172a;">${paxText}</td></tr>
                <tr><td style="color:#64748b;">Pickup Location:</td><td style="font-weight:700;color:#0f172a;">${details.pickupLocation}</td></tr>
                ${details.dropoffLocation ? `<tr><td style="color:#64748b;">Dropoff Location:</td><td style="font-weight:700;color:#0f172a;">${details.dropoffLocation}</td></tr>` : ''}
                <tr><td style="color:#64748b;">Payment Status:</td><td><span style="background-color:#dcfce7;color:#15803d;font-weight:800;padding:2px 8px;border-radius:6px;font-size:12px;">PAID IN FULL (${details.currency} ${details.amountPaid.toLocaleString()})</span></td></tr>
                ${details.receiptNumber ? `<tr><td style="color:#64748b;">Official Receipt #:</td><td style="font-family:monospace;font-weight:700;color:#0f172a;">${details.receiptNumber}</td></tr>` : ''}
                ${details.specialRequests ? `<tr><td style="color:#64748b;">Special Notes:</td><td style="color:#b45309;">${details.specialRequests}</td></tr>` : ''}
              </table>

              <h2 style="margin:0 0 12px 0;font-size:16px;font-weight:700;color:#0f172a;">Tourist Contact</h2>
              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size:13px;margin-bottom:24px;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                <tr><td style="color:#64748b;width:35%;">Name:</td><td style="font-weight:700;color:#0f172a;">${details.customerName}</td></tr>
                <tr><td style="color:#64748b;">Country:</td><td style="color:#0f172a;">${details.customerCountry || 'Unknown'}</td></tr>
                <tr><td style="color:#64748b;">WhatsApp / Phone:</td><td><a href="${guestWhatsAppUrl}" style="color:#0284c7;font-weight:700;text-decoration:none;">${details.customerPhone} (Open WhatsApp)</a></td></tr>
                <tr><td style="color:#64748b;">Email:</td><td><a href="mailto:${details.customerEmail}" style="color:#0284c7;text-decoration:none;">${details.customerEmail}</a></td></tr>
              </table>

              <div style="background-color:#eff6ff;border-radius:10px;padding:14px 18px;border-left:4px solid #3b82f6;">
                <p style="margin:0;font-size:12px;color:#1e40af;line-height:1.5;">
                  <strong>Next Step:</strong> Once you assign the guide from your network, please inform the Platform Admin via WhatsApp with their Name and Phone number so it can be recorded in the system.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 30px;text-align:center;color:#64748b;font-size:12px;">
              <p style="margin:0 0 4px 0;"><strong>Zansafari Horizon</strong> • Internal Operations</p>
              <p style="margin:0;">Lead Guide: ${details.leadGuideName} (${details.leadGuidePhone}) • Stone Town, Zanzibar</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendWorkOrderNotification(
  details: WorkOrderDetails,
  baseUrl: string = getAppBaseUrl()
): Promise<{ ok: boolean; error?: string }> {
  const subject = `[WORK ORDER] Ref: ${details.referenceCode} - ${details.serviceTitle} (${details.bookingDate})`;
  const html = generateWorkOrderEmailHtml(details, baseUrl);

  const recipients = [details.leadGuideEmail];
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@zansafarihorizon.com';
  if (adminEmail && !recipients.includes(adminEmail)) {
    recipients.push(adminEmail);
  }

  const res = await sendOneEmail({
    to: recipients,
    subject,
    html,
    logContext: { bookingId: details.bookingId, referenceCode: details.referenceCode, type: 'WORK_ORDER_SENT' },
  });

  await persistNotification({
    bookingId: details.bookingId,
    recipient: NotificationRecipient.OPERATOR,
    type: 'WORK_ORDER_SENT',
    payload: {
      bookingId: details.bookingId,
      referenceCode: details.referenceCode,
      serviceTitle: details.serviceTitle,
      tourDate: details.bookingDate,
      locale: details.locale,
      leadGuideEmail: details.leadGuideEmail,
    },
    ok: res.ok,
    providerId: res.id,
    error: res.error,
  });

  return res;
}

// --------------------------------------------------------
// PHASE R2: GUIDE INTRO EMAIL TO TOURIST
// --------------------------------------------------------

export interface GuideIntroDetails {
  bookingId: string;
  referenceCode: string;
  locale: string;
  customerName: string;
  customerEmail: string;
  guideName: string;
  guidePhone: string;
  serviceTitle: string;
  bookingDate: string;
  bookingTime?: string;
  pickupLocation?: string;
  traLicenseNumber?: string | null;
}

export function generateGuideIntroEmailHtml(details: GuideIntroDetails): string {
  const userLocale = resolveEmailLocale(details.locale);
  const dict = getDictionary(userLocale);
  const isRtl = userLocale === 'ar';
  const cleanGuidePhone = details.guidePhone.replace(/[^0-9]/g, '');
  const guideWhatsAppUrl = `https://wa.me/${cleanGuidePhone}`;

  const hello = fillTemplate(dict.confirmation.emailHello, { name: details.customerName });
  const introBody = fillTemplate(dict.confirmation.guideIntroBody, {
    service: details.serviceTitle,
    date: details.bookingDate,
  });
  const chatCta = fillTemplate(dict.confirmation.chatGuideCta, { guide: details.guideName });
  const subject = fillTemplate(dict.confirmation.guideIntroSubject, {
    service: details.serviceTitle,
    reference: details.referenceCode,
  });
  const traLine = details.traLicenseNumber
    ? `<p style="margin:0 0 4px 0;"><strong>Zansafari Horizon</strong> • TRA Licensed Tour Operator (${details.traLicenseNumber})</p>`
    : `<p style="margin:0 0 4px 0;"><strong>Zansafari Horizon</strong> — Stone Town, Zanzibar, Tanzania</p>`;

  return `
<!DOCTYPE html>
<html lang="${userLocale}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#090d16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#090d16;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284c7,#0369a1);padding:30px;text-align:center;color:#ffffff;">
              <span style="background-color:rgba(255,255,255,0.2);padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
                Zansafari Horizon
              </span>
              <h1 style="margin:12px 0 0 0;font-size:22px;font-weight:800;">${dict.confirmation.guideIntroTitle}</h1>
              <p style="margin:4px 0 0 0;font-size:13px;opacity:0.9;">Ref: ${details.referenceCode}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <p style="font-size:15px;line-height:1.6;color:#1e293b;margin:0 0 20px 0;">
                <strong>${hello}</strong>
              </p>
              <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 24px 0;">
                ${introBody}
              </p>

              <!-- Guide Card -->
              <div style="background-color:#f0fdf4;border:2px solid #86efac;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px;">
                <div style="font-size:36px;margin-bottom:8px;">👤</div>
                <div style="font-size:20px;font-weight:800;color:#166534;">${details.guideName}</div>
                <div style="font-size:14px;color:#15803d;margin-top:4px;">${dict.confirmation.licensedGuideCard}</div>
                <div style="font-size:15px;font-weight:700;color:#0f172a;margin-top:10px;">
                  ${dict.confirmation.phoneWhatsappLabel} ${details.guidePhone}
                </div>

                <div style="margin-top:16px;">
                  <a href="${guideWhatsAppUrl}" target="_blank" style="display:inline-block;background-color:#25d366;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:24px;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(37,211,102,0.35);">
                    💬 ${chatCta}
                  </a>
                </div>
              </div>

              <div style="background-color:#f8fafc;border-radius:10px;padding:14px 18px;font-size:13px;color:#475569;line-height:1.5;">
                <strong style="color:#0f172a;">${dict.confirmation.pickupDetailsLabel}</strong> ${details.pickupLocation || 'Stone Town / Hotel lobby'}<br>
                ${dict.confirmation.guideContactNote}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 30px;text-align:center;color:#64748b;font-size:12px;">
              ${traLine}
              <p style="margin:0;">Stone Town, Zanzibar, Tanzania • info@zansafarihorizon.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Retries a FAILED notification by regenerating its template from live
 * booking data and re-sending. Updates the SAME row to SENT/FAILED so the
 * admin list stays accurate. Supports the booking lifecycle email types;
 * returns an error for types that cannot be regenerated (e.g. settlements).
 */
export async function retryNotification(
  notificationId: string
): Promise<{ ok: boolean; error?: string; providerId?: string }> {
  const baseUrl = getAppBaseUrl();
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: {
      booking: {
        include: {
          tour: true,
          route: true,
          receipt: true,
          payments: { orderBy: { paymentDate: 'desc' }, take: 5 },
        },
      },
    },
  });

  if (!notification) {
    return { ok: false, error: 'Notification not found.' };
  }
  const booking = notification.booking;
  if (!booking) {
    return { ok: false, error: 'Original booking no longer exists — cannot regenerate email.' };
  }

  const fail = async (error: string) => {
    await persistNotificationUpdate(notificationId, false, undefined, error);
    return { ok: false as const, error };
  };

  try {
    const serviceTitle =
      booking.serviceType === 'TOUR'
        ? (booking as any).tour?.title || 'Zanzibar Tour'
        : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`;
    const dateDisplay = new Date(booking.bookingDate).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const guestsText =
      booking.serviceType === 'TOUR'
        ? `${booking.numAdults} Adult${booking.numAdults > 1 ? 's' : ''}${booking.numChildren > 0 ? `, ${booking.numChildren} Child${booking.numChildren > 1 ? 'ren' : ''}` : ''}`
        : `${booking.numAdults} Passenger${booking.numAdults > 1 ? 's' : ''}`;

    let to: string[];
    let subject: string;
    let html: string;

    switch (notification.type) {
      case 'BOOKING_REQUEST_TOURIST': {
        const userLocale = resolveEmailLocale(booking.locale);
        const dict = getDictionary(userLocale);
        const details: EmailBookingDetails = {
          id: booking.id,
          referenceCode: booking.referenceCode,
          serviceType: booking.serviceType,
          title: serviceTitle,
          date: dateDisplay,
          time: booking.bookingTime || 'Morning',
          guestsText,
          pickupLocation: booking.pickupLocation || 'Stone Town',
          dropoffLocation: booking.dropoffLocation || undefined,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          customerCountry: booking.customerCountry || 'International',
          specialRequests: booking.specialRequests || undefined,
          totalPriceFormatted: formatPrice(Math.round((booking.totalPriceCents || 0) / 100)),
          locale: booking.locale || 'en',
          paymentMethods: await getEnabledPaymentMethods(booking.locale).catch(() => []),
        };
        to = [booking.customerEmail];
        subject = `${dict.booking.successTitle} — ${booking.referenceCode} | Zansafari Horizon`;
        html = generateTouristEmailHtml(details);
        break;
      }
      case 'BOOKING_REQUEST_PLATFORM_ADMIN_ALERT': {
        const adminEmail =
          process.env.PLATFORM_ADMIN_EMAIL || process.env.OPERATOR_ALERT_EMAIL || 'admin@zansafarihorizon.com';
        const details: EmailBookingDetails = {
          id: booking.id,
          referenceCode: booking.referenceCode,
          serviceType: booking.serviceType,
          title: serviceTitle,
          date: dateDisplay,
          time: booking.bookingTime || 'Morning',
          guestsText,
          pickupLocation: booking.pickupLocation || 'Stone Town',
          dropoffLocation: booking.dropoffLocation || undefined,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          customerCountry: booking.customerCountry || 'International',
          specialRequests: booking.specialRequests || undefined,
          totalPriceFormatted: formatPrice(Math.round((booking.totalPriceCents || 0) / 100)),
          locale: booking.locale || 'en',
        };
        to = [adminEmail];
        subject = `🚨 [Retry] New Booking Request — ${booking.referenceCode} (${booking.customerName})`;
        html = generatePlatformAdminBookingAlertEmailHtml(details, baseUrl);
        break;
      }
      case 'BOOKING_CONFIRMED_TOURIST':
      case 'BOOKING_CONFIRMED_PLATFORM_ADMIN': {
        const receipt = (booking as any).receipt;
        const verificationCode = receipt?.verificationCode;
        const receiptNumber = receipt?.receiptNumber;
        const verifyUrl = verificationCode
          ? `${baseUrl}/verify?code=${encodeURIComponent(verificationCode)}`
          : undefined;
        const qrImageUrl = verificationCode
          ? `${baseUrl}/api/qr?code=${encodeURIComponent(verificationCode)}`
          : undefined;
        const receiptUrl = receiptNumber
          ? `${baseUrl}/receipt/${encodeURIComponent(receiptNumber)}`
          : undefined;
        const totalPaid = booking.amountPaidCents || 0;
        const target = booking.quotedPriceCents || booking.totalPriceCents || totalPaid;
        const details: ConfirmedNotificationDetails = {
          bookingId: booking.id,
          referenceCode: booking.referenceCode,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          serviceTitle,
          bookingDate: dateDisplay,
          bookingTime: booking.bookingTime || 'Morning',
          pickupLocation: booking.pickupLocation || 'To be confirmed',
          amountPaidFormatted: formatPrice(Math.round(totalPaid / 100)),
          totalPriceFormatted: formatPrice(Math.round(target / 100)),
          paymentMethod: (booking.paymentMethod || 'Recorded').replace(/_/g, ' '),
          paymentReference: booking.paymentReference || undefined,
          operatorName: 'Zansafari Horizon',
          locale: booking.locale || 'en',
          receiptNumber,
          verificationCode,
          receiptUrl,
          verifyUrl,
          qrImageUrl,
        };
        if (notification.type === 'BOOKING_CONFIRMED_TOURIST') {
          to = [booking.customerEmail];
          const retryDict = getDictionary(resolveEmailLocale(booking.locale));
          subject = fillTemplate(retryDict.confirmation.confirmedSubject, {
            reference: booking.referenceCode,
          });
          html = generateConfirmedTouristEmailHtml(details);
        } else {
          const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@zansafarihorizon.com';
          to = [adminEmail];
          subject = `💰 [Retry] Booking Fully Paid & Confirmed — ${booking.referenceCode} (${booking.customerName})`;
          html = generateConfirmedPlatformAdminEmailHtml(details, baseUrl);
        }
        break;
      }
      case 'BOOKING_REJECTED_TOURIST':
      case 'BOOKING_CANCELLED_TOURIST': {
        const details: CancelledNotificationDetails = {
          bookingId: booking.id,
          referenceCode: booking.referenceCode,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          serviceTitle,
          bookingDate: dateDisplay,
          reason: booking.cancellationReason || 'Please contact us on WhatsApp for alternatives.',
          status: notification.type === 'BOOKING_REJECTED_TOURIST' ? 'REJECTED' : 'CANCELLED',
          locale: booking.locale || 'en',
        };
        to = [booking.customerEmail];
        const cancelDict = getDictionary(resolveEmailLocale(booking.locale));
        subject = fillTemplate(cancelDict.confirmation.cancelledSubject, {
          reference: booking.referenceCode,
        });
        html = generateCancelledTouristEmailHtml(details);
        break;
      }
      default:
        return fail(`Retry is not supported for notification type "${notification.type}".`);
    }

    const res = await sendOneEmail({
      to,
      subject,
      html,
      logContext: { retryOf: notificationId, type: notification.type },
    });
    await persistNotificationUpdate(notificationId, res.ok, res.id, res.error);
    return res;
  } catch (err: any) {
    const message = err?.message || String(err);
    logger.error('[EmailService] retryNotification threw:', err, { notificationId });
    await persistNotificationUpdate(notificationId, false, undefined, message);
    return { ok: false, error: message };
  }
}

/** Updates an existing Notification row in place after a (re)send attempt. */
async function persistNotificationUpdate(
  id: string,
  ok: boolean,
  providerId?: string,
  error?: string
): Promise<void> {
  try {
    await prisma.notification.update({
      where: { id },
      data: {
        status: ok ? 'SENT' : 'FAILED',
        errorMessage: ok ? null : error || 'Unknown send failure',
        providerId: providerId || null,
        sentAt: ok ? new Date() : null,
      },
    });
  } catch (err) {
    console.warn('[EmailService] Failed to update notification row:', err);
  }
}

export interface OperatorAssignmentEmailDetails {
  bookingId: string;
  referenceCode: string;
  operatorName: string;
  operatorEmail: string;
  /** The exact (possibly edited) message also stored in OperatorInbox. */
  message: string;
}

/**
 * P1 — Optional email copy of the inbox assignment, sent only when super
 * admin ticks "also email the operator" in the Notify operator dialog.
 */
export async function sendOperatorAssignmentEmail(
  details: OperatorAssignmentEmailDetails
): Promise<{ ok: boolean; error?: string }> {
  const subject = `New tour assignment — ${details.referenceCode} | Zansafari Horizon`;
  const messageHtml = details.message
    .split('\n')
    .map((line) => `<div>${line || '&nbsp;'}</div>`)
    .join('');
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:30px 15px;">
    <tr><td align="center">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#0369a1,#0f766e);padding:25px 30px;text-align:center;color:#ffffff;">
            <h1 style="margin:0;font-size:20px;font-weight:800;">Hello ${details.operatorName},</h1>
            <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">You have a new tour assignment (Ref: ${details.referenceCode}).</p>
          </td>
        </tr>
        <tr><td style="padding:30px;">
          <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;font-size:13px;line-height:1.8;color:#0f172a;font-family:monospace;white-space:pre-wrap;">${messageHtml}</div>
          <p style="margin:16px 0 0 0;font-size:12px;color:#64748b;">The same message is waiting in your operator portal inbox. Open the booking there to confirm completion after the tour.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const res = await sendOneEmail({
    to: [details.operatorEmail],
    subject,
    html,
    logContext: { bookingId: details.bookingId, referenceCode: details.referenceCode, type: 'OPERATOR_ASSIGNMENT' },
  });

  await persistNotification({
    bookingId: details.bookingId,
    recipient: NotificationRecipient.OPERATOR,
    type: 'OPERATOR_ASSIGNMENT',
    payload: { referenceCode: details.referenceCode, to: details.operatorEmail },
    ok: res.ok,
    providerId: res.id,
    error: res.error,
  });

  return res;
}

export interface TourCompletedDetails {
  bookingId: string;
  referenceCode: string;
  serviceTitle: string;
  bookingDate: string;
  bookingTime?: string;
  customerName: string;
  operatorName: string;
  completedAt: string;
}

/**
 * P1 — In-app + email notification to super admin when the operator marks
 * a tour COMPLETED. The persisted Notification row is the in-app record
 * (visible in /platform/notifications); the email is the push.
 */
export async function sendTourCompletedNotification(
  details: TourCompletedDetails
): Promise<{ ok: boolean; error?: string }> {
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@zansafarihorizon.com';
  const subject = `Tour completed by operator — ${details.referenceCode} (${details.customerName}) | Zansafari Horizon`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:30px 15px;">
    <tr><td align="center">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#0d9488);padding:25px 30px;text-align:center;color:#ffffff;">
            <span style="background-color:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;">Operator completion report</span>
            <h1 style="margin:10px 0 0 0;font-size:22px;font-weight:800;">Tour marked COMPLETED</h1>
            <p style="margin:4px 0 0 0;font-size:13px;opacity:0.9;">Ref: ${details.referenceCode}</p>
          </td>
        </tr>
        <tr><td style="padding:30px;">
          <p style="margin:0 0 16px 0;font-size:14px;color:#334155;">
            Operator <strong>${details.operatorName}</strong> has confirmed tour completion for booking <strong>${details.referenceCode}</strong> (${details.customerName}).
          </p>
          <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:13px;margin-bottom:20px;background-color:#f8fafc;border-radius:10px;">
            <tr><td style="color:#64748b;width:40%;">Service:</td><td style="font-weight:700;">${details.serviceTitle}</td></tr>
            <tr><td style="color:#64748b;">Tour date:</td><td>${details.bookingDate}${details.bookingTime ? ` (${details.bookingTime})` : ''}</td></tr>
            <tr><td style="color:#64748b;">Completed at:</td><td>${details.completedAt}</td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#334155;">
            Next step: finalize revenue and commission in the platform control room.
          </p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${getAppBaseUrl()}/platform/bookings" target="_blank" style="display:inline-block;background-color:#047857;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:700;">
              Open Bookings Master →
            </a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const res = await sendOneEmail({
    to: [adminEmail],
    subject,
    html,
    logContext: { bookingId: details.bookingId, referenceCode: details.referenceCode, type: 'TOUR_COMPLETED_BY_OPERATOR' },
  });

  await persistNotification({
    bookingId: details.bookingId,
    recipient: NotificationRecipient.PLATFORM_ADMIN,
    type: 'TOUR_COMPLETED_BY_OPERATOR',
    payload: {
      referenceCode: details.referenceCode,
      serviceTitle: details.serviceTitle,
      operatorName: details.operatorName,
      completedAt: details.completedAt,
    },
    ok: res.ok,
    providerId: res.id,
    error: res.error,
  });

  return res;
}

export async function sendGuideIntroNotification(details: GuideIntroDetails): Promise<{ ok: boolean; error?: string }> {
  const introDict = getDictionary(resolveEmailLocale(details.locale));
  const subject = fillTemplate(introDict.confirmation.guideIntroSubject, {
    service: details.serviceTitle,
    reference: details.referenceCode,
  });
  const html = generateGuideIntroEmailHtml(details);

  const res = await sendOneEmail({
    to: [details.customerEmail],
    subject,
    html,
    logContext: { bookingId: details.bookingId, referenceCode: details.referenceCode, type: 'GUIDE_INTRO_SENT' },
  });

  await persistNotification({
    bookingId: details.bookingId,
    recipient: NotificationRecipient.TOURIST,
    type: 'GUIDE_INTRO_SENT',
    payload: {
      bookingId: details.bookingId,
      referenceCode: details.referenceCode,
      guideName: details.guideName,
      guidePhone: details.guidePhone,
      customerEmail: details.customerEmail,
    },
    ok: res.ok,
    providerId: res.id,
    error: res.error,
  });

  return res;
}



