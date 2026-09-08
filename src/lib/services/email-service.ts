import { prisma } from '@/lib/prisma';
import { NotificationRecipient, NotificationChannel } from '@prisma/client';
import { getDictionary, isSupportedLocale, DEFAULT_LOCALE, Locale } from '@/lib/i18n';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

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
  mpesaNumber?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  paymentNotes?: string | null;
  locale?: string;
  operatorWhatsApp?: string;
  costFormatted?: string;
  profitFormatted?: string;
  tierName?: string;
}

/**
 * Generates HTML email for the tourist receiving their booking request confirmation.
 * Fully localized across all 6 supported languages (EN, FR, ES, IT, DE, AR).
 */
export function generateTouristEmailHtml(details: EmailBookingDetails): string {
  const userLocale: Locale = isSupportedLocale(details.locale || '')
    ? (details.locale as Locale)
    : DEFAULT_LOCALE;
  const dict = getDictionary(userLocale);
  const isRtl = userLocale === 'ar';
  const textAlign = isRtl ? 'right' : 'left';

  const operatorPhone = details.operatorWhatsApp || '+255 777 123 456';
  const cleanOperatorPhone = operatorPhone.replace(/[^0-9]/g, '');

  const whatsAppText = encodeURIComponent(
    `Hello Ibrahim! I have submitted a booking request:\n• Ref: ${details.referenceCode}\n• Service: ${details.title}\n• Date: ${details.date} (${details.time})\n• Name: ${details.customerName}\n\nPlease confirm availability and payment details!`
  );
  const whatsAppUrl = `https://wa.me/${cleanOperatorPhone || '255777123456'}?text=${whatsAppText}`;

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
              <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">IBRAHIM TOURS ZANZIBAR</h1>
              <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Trusted Guide to Paradise Island</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:35px 30px;text-align:${textAlign};">
              <div style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:12px 18px;text-align:center;margin-bottom:24px;">
                <span style="color:#065f46;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">✓ ${dict.confirmation.badgeLogged}</span>
              </div>

              <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;font-weight:700;">${dict.confirmation.greeting}, ${details.customerName}!</h2>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">
                ${dict.confirmation.alertDesc}
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
                <div style="background-color:#ffffff;border:1px solid #dcfce7;border-radius:10px;padding:14px;font-size:12px;line-height:1.7;color:#1e293b;">
                  <div><strong>📱 M-Pesa Number:</strong> <span style="color:#047857;font-family:monospace;font-weight:700;">${details.mpesaNumber || '+255 777 123 456 (Ibrahim Tours)'}</span></div>
                  <div><strong>🏦 Bank Name:</strong> <span style="color:#0f172a;font-weight:600;">${details.bankName || 'CRDB Bank Zanzibar'}</span></div>
                  <div><strong>💳 Account Number:</strong> <span style="color:#047857;font-family:monospace;font-weight:700;">${details.bankAccount || '0150244488800 (USD / TZS)'}</span></div>
                  ${details.paymentNotes ? `<div style="margin-top:6px;color:#64748b;font-style:italic;">Note: ${details.paymentNotes}</div>` : ''}
                </div>
              </div>

              <!-- WhatsApp CTA Button -->
              <div style="text-align:center;margin:30px 0 10px 0;">
                <a href="${whatsAppUrl}" target="_blank" style="display:inline-block;background-color:#25d366;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:30px;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(37,211,102,0.35);">
                  💬 ${dict.booking.chatWhatsAppNow}
                </a>
                <p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">Prefills reference: ${details.referenceCode}</p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 30px;text-align:center;color:#64748b;font-size:12px;">
              <p style="margin:0 0 4px 0;"><strong>Ibrahim Tours Zanzibar</strong> • TRA Licensed Local Guide</p>
              <p style="margin:0;">Stone Town, Zanzibar, Tanzania • WhatsApp: ${operatorPhone} • info@ibrahimtours.co.tz</p>
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
 * Generates HTML email alert for operator (Ibrahim) when a new booking is requested.
 */
export function generateOperatorAlertEmailHtml(details: EmailBookingDetails, baseUrl: string): string {
  const operatorPortalUrl = `${baseUrl}/operator`;
  const cleanPhone = details.customerPhone.replace(/[^0-9]/g, '');
  const guestWhatsAppUrl = `https://wa.me/${cleanPhone}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking Request — ${details.referenceCode}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;">
          
          <!-- Alert Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f766e,#047857);padding:25px 30px;text-align:center;color:#ffffff;">
              <span style="background-color:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">New Website Booking Alert</span>
              <h1 style="margin:10px 0 0 0;font-size:22px;font-weight:800;">Ref: ${details.referenceCode}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 16px 0;font-size:18px;color:#0f172a;">Customer Details:</h2>
              <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:13px;margin-bottom:24px;background-color:#f8fafc;border-radius:10px;">
                <tr><td style="color:#64748b;width:35%;">Guest Name:</td><td style="font-weight:700;color:#0f172a;">${details.customerName}</td></tr>
                <tr><td style="color:#64748b;">WhatsApp / Phone:</td><td><a href="${guestWhatsAppUrl}" style="color:#0284c7;font-weight:700;text-decoration:none;">${details.customerPhone} (Open WhatsApp)</a></td></tr>
                <tr><td style="color:#64748b;">Email:</td><td><a href="mailto:${details.customerEmail}" style="color:#0284c7;text-decoration:none;">${details.customerEmail}</a></td></tr>
                <tr><td style="color:#64748b;">Country:</td><td style="color:#0f172a;">${details.customerCountry}</td></tr>
              </table>

              <h2 style="margin:0 0 16px 0;font-size:18px;color:#0f172a;">Booking Specifications:</h2>
              <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:13px;margin-bottom:24px;background-color:#f8fafc;border-radius:10px;">
                <tr><td style="color:#64748b;width:35%;">Service:</td><td style="font-weight:700;color:#0f172a;">${details.title} (${details.serviceType})</td></tr>
                <tr><td style="color:#64748b;">Date & Time:</td><td style="font-weight:700;color:#047857;">${details.date} at ${details.time}</td></tr>
                <tr><td style="color:#64748b;">Guests/Pax:</td><td style="color:#0f172a;">${details.guestsText}</td></tr>
                <tr><td style="color:#64748b;">Pickup Area:</td><td style="color:#0f172a;">${details.pickupLocation}</td></tr>
                ${details.dropoffLocation ? `<tr><td style="color:#64748b;">Drop-off:</td><td style="color:#0f172a;">${details.dropoffLocation}</td></tr>` : ''}
                <tr><td style="color:#64748b;">Estimated Gross:</td><td style="font-weight:800;color:#0f766e;">${details.totalPriceFormatted}</td></tr>
                <tr><td style="color:#64748b;">Special Requests:</td><td style="color:#475569;">${details.specialRequests || 'None'}</td></tr>
              </table>

              <!-- Quick Action Buttons -->
              <div style="text-align:center;margin-top:25px;">
                <a href="${operatorPortalUrl}" target="_blank" style="display:inline-block;background-color:#0f766e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:700;margin-right:8px;">
                  View in Operator Portal →
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
 * Dispatches emails via Resend API or records local simulated notification.
 */
export async function sendBookingNotifications(details: EmailBookingDetails, baseUrl: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const operatorEmail = process.env.OPERATOR_ALERT_EMAIL || 'info@ibrahimtours.co.tz';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Ibrahim Tours Zanzibar <onboarding@resend.dev>';

  const userLocale: Locale = isSupportedLocale(details.locale || '')
    ? (details.locale as Locale)
    : DEFAULT_LOCALE;
  const dict = getDictionary(userLocale);
  const touristSubject = `${dict.booking.successTitle} — ${details.referenceCode} | Ibrahim Tours Zanzibar`;

  const touristHtml = generateTouristEmailHtml(details);
  const operatorHtml = generateOperatorAlertEmailHtml(details, baseUrl);

  if (resendApiKey) {
    try {
      // 1. Send Tourist Confirmation Email
      const resTourist = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [details.customerEmail],
          subject: touristSubject,
          html: touristHtml,
        }),
      });
      if (!resTourist.ok) {
        const errorText = await resTourist.text().catch(() => '');
        throw new Error(`Resend tourist email failed HTTP ${resTourist.status}: ${errorText}`);
      }

      // 2. Send Operator Alert Email
      const resOperator = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [operatorEmail],
          subject: `🚨 New Booking Request Alert — ${details.referenceCode} (${details.customerName})`,
          html: operatorHtml,
        }),
      });
      if (!resOperator.ok) {
        const errorText = await resOperator.text().catch(() => '');
        throw new Error(`Resend operator email failed HTTP ${resOperator.status}: ${errorText}`);
      }
    } catch (err) {
      logger.error('Failed to send booking request Resend emails:', err, {
        referenceCode: details.referenceCode,
        recipient: details.customerEmail,
      });
      Sentry.captureException(err, {
        tags: { service: 'email-service', action: 'sendBookingNotifications' },
        extra: { referenceCode: details.referenceCode, recipient: details.customerEmail },
      });
    }
  } else {
    console.log(`[EmailService] Resend API key not found. Simulating email dispatch for ${details.referenceCode}`);
  }

  // Record notifications in database for audit trail
  try {
    await prisma.notification.create({
      data: {
        bookingId: details.id,
        recipient: NotificationRecipient.TOURIST,
        channel: NotificationChannel.EMAIL,
        type: 'BOOKING_REQUEST_TOURIST',
        payload: { referenceCode: details.referenceCode, to: details.customerEmail },
        sentAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        bookingId: details.id,
        recipient: NotificationRecipient.OPERATOR,
        channel: NotificationChannel.EMAIL,
        type: 'BOOKING_REQUEST_OPERATOR_ALERT',
        payload: { referenceCode: details.referenceCode, to: operatorEmail },
        sentAt: new Date(),
      },
    });
  } catch (err) {
    console.warn('Failed to record notification log:', err);
  }
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
}

/**
 * HTML email sent to tourist when booking is fully paid and officially CONFIRMED.
 */
export function generateConfirmedTouristEmailHtml(details: ConfirmedNotificationDetails): string {
  const whatsAppText = encodeURIComponent(
    `Hello Ibrahim! My booking ${details.referenceCode} is confirmed. Looking forward to our tour on ${details.bookingDate}!`
  );
  const whatsAppUrl = `https://wa.me/255700000000?text=${whatsAppText}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmed — ${details.referenceCode}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#0d9488);padding:35px 30px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:24px;font-weight:800;">BOOKING OFFICIALLY CONFIRMED</h1>
              <p style="margin:6px 0 0 0;font-size:13px;opacity:0.95;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Ibrahim Tours Zanzibar</p>
            </td>
          </tr>
          <tr>
            <td style="padding:35px 30px;">
              <div style="background-color:#ecfdf5;border:2px solid #10b981;border-radius:14px;padding:16px;text-align:center;margin-bottom:24px;">
                <span style="display:block;font-size:12px;font-weight:800;color:#047857;text-transform:uppercase;letter-spacing:1px;">Payment Recorded & Verified</span>
                <span style="display:block;font-size:24px;font-weight:900;color:#065f46;margin-top:4px;">${details.referenceCode}</span>
              </div>

              <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">Jambo ${details.customerName}!</h2>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">
                Great news! Your payment of <strong>${details.amountPaidFormatted}</strong> via <strong>${details.paymentMethod}</strong> has been received by ${details.operatorName}. Your booking is now <strong>PAID IN FULL & CONFIRMED</strong>.
              </p>

              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size:13px;margin-bottom:24px;background-color:#f8fafc;border-radius:12px;border-collapse:collapse;">
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;width:35%;font-weight:600;">Excursion / Route:</td><td style="font-weight:700;color:#0f172a;">${details.serviceTitle}</td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;font-weight:600;">Date & Time:</td><td style="font-weight:700;color:#047857;">${details.bookingDate} at ${details.bookingTime}</td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;font-weight:600;">Pickup Location:</td><td style="color:#0f172a;">${details.pickupLocation}</td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;font-weight:600;">Amount Paid:</td><td style="font-weight:800;color:#047857;">${details.amountPaidFormatted} (PAID IN FULL)</td></tr>
                ${details.paymentReference ? `<tr><td style="color:#64748b;font-weight:600;">Payment Reference:</td><td style="color:#0f172a;font-family:monospace;">${details.paymentReference}</td></tr>` : ''}
              </table>

              <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px;text-align:left;">
                <strong style="color:#166534;font-size:13px;display:block;margin-bottom:4px;">Arrival Instructions</strong>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#14532d;">
                  Your private guide / driver will meet you promptly at the pickup location. If you need any adjustments or assistance, reach out directly to Ibrahim on WhatsApp anytime.
                </p>
              </div>

              <div style="text-align:center;margin-top:24px;">
                <a href="${whatsAppUrl}" target="_blank" style="display:inline-block;background-color:#25d366;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:30px;font-size:14px;font-weight:700;">
                  💬 Open WhatsApp with Ibrahim
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
  baseUrl: string
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@ibrahimtours.co.tz';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Ibrahim Tours Zanzibar <bookings@ibrahimtours.co.tz>';

  const touristHtml = generateConfirmedTouristEmailHtml(details);
  const adminHtml = generateConfirmedPlatformAdminEmailHtml(details, baseUrl);

  if (resendApiKey) {
    try {
      // 1. Tourist Confirmation
      const resTourist = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [details.customerEmail],
          subject: `Your Booking is CONFIRMED — ${details.referenceCode} | Ibrahim Tours Zanzibar`,
          html: touristHtml,
        }),
      });
      if (!resTourist.ok) {
        const errorText = await resTourist.text().catch(() => '');
        throw new Error(`Resend confirmed tourist email failed HTTP ${resTourist.status}: ${errorText}`);
      }

      // 2. Platform Admin Alert
      const resAdmin = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [platformAdminEmail],
          subject: `💰 Booking Fully Paid & Confirmed — ${details.referenceCode} (${details.customerName})`,
          html: adminHtml,
        }),
      });
      if (!resAdmin.ok) {
        const errorText = await resAdmin.text().catch(() => '');
        throw new Error(`Resend confirmed admin email failed HTTP ${resAdmin.status}: ${errorText}`);
      }
    } catch (err) {
      logger.error('Failed to send confirmation emails via Resend:', err, {
        bookingId: details.bookingId,
        referenceCode: details.referenceCode,
      });
      Sentry.captureException(err, {
        tags: { service: 'email-service', action: 'sendBookingConfirmedNotifications' },
        extra: { bookingId: details.bookingId, referenceCode: details.referenceCode },
      });
    }
  } else {
    console.log(`[EmailService] Resend API key not found. Simulating CONFIRMED emails for ${details.referenceCode}`);
  }

  // Record Notification audit rows
  try {
    await prisma.notification.create({
      data: {
        bookingId: details.bookingId,
        recipient: NotificationRecipient.TOURIST,
        channel: NotificationChannel.EMAIL,
        type: 'BOOKING_CONFIRMED_TOURIST',
        payload: { referenceCode: details.referenceCode, amount: details.amountPaidFormatted },
        sentAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        bookingId: details.bookingId,
        recipient: NotificationRecipient.PLATFORM_ADMIN,
        channel: NotificationChannel.EMAIL,
        type: 'BOOKING_CONFIRMED_PLATFORM_ADMIN',
        payload: { referenceCode: details.referenceCode, amount: details.amountPaidFormatted },
        sentAt: new Date(),
      },
    });
  } catch (err) {
    console.warn('Failed to record notification log:', err);
  }
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
}

export function generateCancelledTouristEmailHtml(details: CancelledNotificationDetails): string {
  const userLocale: Locale = isSupportedLocale(details.locale || '')
    ? (details.locale as Locale)
    : DEFAULT_LOCALE;
  const isRtl = userLocale === 'ar';
  const textAlign = isRtl ? 'right' : 'left';

  const operatorPhone = details.operatorWhatsApp || '+255 777 123 456';
  const cleanPhone = operatorPhone.replace(/[^0-9]/g, '') || '255777123456';

  const whatsAppText = encodeURIComponent(
    `Hello Ibrahim! Regarding my booking ${details.referenceCode} (${details.serviceTitle}): I would like to discuss alternative options.`
  );
  const whatsAppUrl = `https://wa.me/${cleanPhone}?text=${whatsAppText}`;

  const isRejected = details.status === 'REJECTED';
  const badgeTitle = isRejected ? 'Booking Request Declined' : 'Booking Request Cancelled';

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
              <p style="margin:6px 0 0 0;font-size:13px;opacity:0.95;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Ibrahim Tours Zanzibar</p>
            </td>
          </tr>
          <tr>
            <td style="padding:35px 30px;text-align:${textAlign};">
              <div style="background-color:#fef2f2;border:2px solid #ef4444;border-radius:14px;padding:16px;text-align:center;margin-bottom:24px;">
                <span style="display:block;font-size:12px;font-weight:800;color:#b91c1c;text-transform:uppercase;letter-spacing:1px;">Booking Reference</span>
                <span style="display:block;font-size:24px;font-weight:900;color:#991b1b;margin-top:4px;">${details.referenceCode}</span>
              </div>

              <h2 style="margin:0 0 12px 0;font-size:18px;color:#0f172a;">Jambo ${details.customerName},</h2>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">
                Thank you for your interest in Ibrahim Tours Zanzibar. We regret to inform you that your booking request for <strong>${details.serviceTitle}</strong> on <strong>${details.bookingDate}</strong> could not be scheduled as requested.
              </p>

              <div style="background-color:#fff1f2;border-left:4px solid #f43f5e;border-radius:8px;padding:16px;margin-bottom:24px;">
                <strong style="color:#9f1239;font-size:13px;display:block;margin-bottom:6px;">Message from Ibrahim:</strong>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#881337;">
                  ${details.reason}
                </p>
              </div>

              <p style="margin:0 0 24px 0;font-size:13px;line-height:1.6;color:#64748b;">
                If your dates are flexible or you would like to explore alternative excursions, please reach out to Ibrahim directly on WhatsApp. We will gladly help customize a wonderful itinerary for you!
              </p>

              <div style="text-align:center;margin-top:24px;">
                <a href="${whatsAppUrl}" target="_blank" style="display:inline-block;background-color:#25d366;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:30px;font-size:14px;font-weight:700;">
                  💬 Discuss Alternatives on WhatsApp
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

export async function sendBookingCancelledNotification(
  details: CancelledNotificationDetails
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Ibrahim Tours Zanzibar <onboarding@resend.dev>';

  const subject = `Update on Booking Request ${details.referenceCode} | Ibrahim Tours Zanzibar`;
  const html = generateCancelledTouristEmailHtml(details);

  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [details.customerEmail],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Resend cancellation email failed HTTP ${res.status}: ${errorText}`);
      }
    } catch (err) {
      logger.error('Failed to send cancellation email via Resend:', err, {
        bookingId: details.bookingId,
        referenceCode: details.referenceCode,
      });
      Sentry.captureException(err, {
        tags: { service: 'email-service', action: 'sendBookingCancelledNotification' },
        extra: { bookingId: details.bookingId, referenceCode: details.referenceCode, status: details.status },
      });
    }
  } else {
    console.log(`[EmailService] Resend API key not found. Simulating ${details.status} email for ${details.referenceCode}`);
  }

  // Record Notification audit row
  try {
    await prisma.notification.create({
      data: {
        bookingId: details.bookingId,
        recipient: NotificationRecipient.TOURIST,
        channel: NotificationChannel.EMAIL,
        type: details.status === 'REJECTED' ? 'BOOKING_REJECTED_TOURIST' : 'BOOKING_CANCELLED_TOURIST',
        payload: { referenceCode: details.referenceCode, reason: details.reason },
        sentAt: new Date(),
      },
    });
  } catch (err) {
    console.warn('Failed to record notification log:', err);
  }
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
  baseUrl: string = process.env.NEXTAUTH_URL || 'http://localhost:3000'
): string {
  const dashboardUrl = `${baseUrl}/platform/settlements`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Statement for ${details.month} — Ibrahim Tours Zanzibar</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #047857 0%, #065f46 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Ibrahim Tours Zanzibar</h1>
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
              <p style="margin: 0 0 4px 0;">This automated statement was generated by Ibrahim Tours Zanzibar Platform.</p>
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
  baseUrl?: string
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || 'Ibrahim Tours Zanzibar <onboarding@resend.dev>';

  const subject = `Monthly statement for ${details.month} is ready | Ibrahim Tours Zanzibar`;
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
    console.warn('[EmailService] No recipients found for monthly statement notification.');
    return;
  }

  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: recipientEmails,
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Resend settlement statement email failed HTTP ${res.status}: ${errorText}`);
      }
    } catch (err) {
      logger.error('Failed to send settlement email via Resend:', err, {
        month: details.month,
        operatorId: details.operatorId,
      });
      Sentry.captureException(err, {
        tags: { service: 'email-service', action: 'sendSettlementStatementNotification' },
        extra: { month: details.month, operatorId: details.operatorId },
      });
    }
  } else {
    console.log(
      `[EmailService] Resend API key not found. Simulating monthly statement notification for ${details.month} to:`,
      recipientEmails
    );
  }

  // 2. Persist Notification rows for audit trail
  try {
    // Record for Operator
    await prisma.notification.create({
      data: {
        recipient: NotificationRecipient.OPERATOR,
        channel: NotificationChannel.EMAIL,
        type: 'SETTLEMENT_STATEMENT_READY',
        payload: {
          operatorId: details.operatorId,
          month: details.month,
          totalBookings: details.totalBookings,
          commissionDue: details.commissionDueFormatted,
        },
        sentAt: new Date(),
      },
    });

    // Record for Platform Admin
    await prisma.notification.create({
      data: {
        recipient: NotificationRecipient.PLATFORM_ADMIN,
        channel: NotificationChannel.EMAIL,
        type: 'SETTLEMENT_STATEMENT_READY',
        payload: {
          operatorId: details.operatorId,
          month: details.month,
          totalBookings: details.totalBookings,
          commissionDue: details.commissionDueFormatted,
        },
        sentAt: new Date(),
      },
    });
  } catch (err) {
    console.warn('Failed to record settlement notification logs:', err);
  }
}


