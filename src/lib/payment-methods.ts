import { prisma } from '@/lib/prisma';
import { getDictionary, resolveEmailLocale, Locale } from '@/lib/email-i18n';
import { getCompanyProfile } from '@/lib/company';

/**
 * P1 — Super-admin configurable checkout methods.
 * Details shape per code:
 *   MPESA | MIXX_BY_YAS | AIRTEL_MONEY → { number: string }
 *   BANK → { bankName, accountName, accountNumber }
 *   CASH → { note: string }
 */

export const PAYMENT_METHOD_CODES = ['MPESA', 'MIXX_BY_YAS', 'AIRTEL_MONEY', 'BANK', 'CASH'] as const;
export type PaymentMethodCode = (typeof PAYMENT_METHOD_CODES)[number];

export interface PaymentMethodRecord {
  id: string;
  code: string;
  enabled: boolean;
  label: string | null;
  details: Record<string, string>;
  sortOrder: number;
}

export interface ResolvedPaymentMethod {
  code: string;
  label: string;
  lines: string[];
}

function asRecord(details: unknown): Record<string, string> {
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(details as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  }
  return {};
}

/**
 * Seeds the table from legacy CompanyProfile fields on first use
 * (MPESA ← mpesaNumber, BANK ← bankName/bankAccount, CASH ← note).
 */
export async function ensurePaymentMethodsSeeded(): Promise<void> {
  const count = await prisma.paymentMethodConfig.count();
  if (count > 0) return;

  let legacy: Record<string, string | null> = {};
  try {
    const company = await getCompanyProfile();
    legacy = {
      mpesaNumber: company.mpesaNumber,
      bankName: company.bankName,
      bankAccount: company.bankAccount,
      paymentNotes: company.paymentNotes,
    };
  } catch {
    legacy = {};
  }

  const seeds: Array<{ code: string; enabled: boolean; details: Record<string, string>; sortOrder: number }> = [
    { code: 'MPESA', enabled: Boolean(legacy.mpesaNumber), details: legacy.mpesaNumber ? { number: legacy.mpesaNumber } : {}, sortOrder: 0 },
    { code: 'MIXX_BY_YAS', enabled: false, details: {}, sortOrder: 1 },
    { code: 'AIRTEL_MONEY', enabled: false, details: {}, sortOrder: 2 },
    {
      code: 'BANK',
      enabled: Boolean(legacy.bankName || legacy.bankAccount),
      details: {
        ...(legacy.bankName ? { bankName: legacy.bankName } : {}),
        ...(legacy.bankAccount ? { accountNumber: legacy.bankAccount } : {}),
      },
      sortOrder: 3,
    },
    { code: 'CASH', enabled: false, details: legacy.paymentNotes ? { note: legacy.paymentNotes } : {}, sortOrder: 4 },
  ];

  for (const s of seeds) {
    await prisma.paymentMethodConfig.upsert({
      where: { code: s.code },
      update: {},
      create: { code: s.code, enabled: s.enabled, details: s.details, sortOrder: s.sortOrder },
    });
  }
}

export async function listPaymentMethods(): Promise<PaymentMethodRecord[]> {
  await ensurePaymentMethodsSeeded();
  const rows = await prisma.paymentMethodConfig.findMany({ orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    enabled: r.enabled,
    label: r.label,
    details: asRecord(r.details),
    sortOrder: r.sortOrder,
  }));
}

/**
 * Enabled methods only, with localized labels + detail lines for the
 * tourist confirmation page and tourist emails.
 */
export async function getEnabledPaymentMethods(rawLocale?: string | null): Promise<ResolvedPaymentMethod[]> {
  const locale: Locale = resolveEmailLocale(rawLocale || 'en');
  const dict = getDictionary(locale);
  const pm = (dict as any).paymentMethods as Record<string, string> | undefined;

  const labelFor = (code: string, adminLabel: string | null): string => {
    if (adminLabel?.trim()) return adminLabel.trim();
    switch (code) {
      case 'MPESA':
        return 'M-Pesa';
      case 'MIXX_BY_YAS':
        return 'Mixx by Yas';
      case 'AIRTEL_MONEY':
        return 'Airtel Money';
      case 'BANK':
        return pm?.bankLabel || 'Bank Transfer';
      case 'CASH':
        return pm?.cashLabel || 'Cash';
      default:
        return code;
    }
  };

  const all = await listPaymentMethods();
  const out: ResolvedPaymentMethod[] = [];

  for (const m of all) {
    if (!m.enabled) continue;
    const lines: string[] = [];
    const d = m.details;
    if (m.code === 'BANK') {
      if (d.bankName) lines.push(`${pm?.bankNameLabel || 'Bank'}: ${d.bankName}`);
      if (d.accountName) lines.push(`${pm?.accountNameLabel || 'Account name'}: ${d.accountName}`);
      if (d.accountNumber) lines.push(`${pm?.accountNumberLabel || 'Account number'}: ${d.accountNumber}`);
    } else if (m.code === 'CASH') {
      if (d.note) lines.push(d.note);
    } else {
      if (d.number) lines.push(`${pm?.numberLabel || 'Number'}: ${d.number}`);
    }
    if (lines.length === 0) continue; // enabled but unconfigured → hide
    out.push({ code: m.code, label: labelFor(m.code, m.label), lines });
  }

  return out;
}
