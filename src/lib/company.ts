import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { revalidateTag, revalidatePath } from 'next/cache';

export interface CompanyProfileData {
  id: string;
  companyName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  officialPhone: string;
  officialEmail: string;
  officialWhatsapp: string;
  registrationNumber: string;
  traLicenseNumber: string;
  traLicenseExpiry: string | null;
  traLicenseUrl: string | null;
  mpesaNumber: string;
  bankName: string;
  bankAccount: string;
  paymentInstructions: string;
  paymentNotes: string | null;
  name: string;
  businessName: string;
  biography: string;
  shortBio: string | null;
  profilePhotoUrl: string | null;
  yearsExperience: number;
  languages: string[];
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  trustPoints: string[];
  // Lead Guide Operations (Ibrahim)
  leadGuideName: string;
  leadGuidePhone: string;
  leadGuideWhatsApp: string;
  leadGuideEmail: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfileData = {
  id: 'company-zansafari',
  companyName: 'Zansafari Horizon',
  tagline: 'Spice • Culture • Wildlife',
  logoUrl: '/branding/zansafari-logo.png',
  faviconUrl: '/branding/favicon.png',
  officialPhone: '+255 618 769 150',
  officialEmail: 'info@zansafarihorizon.com',
  officialWhatsapp: '+255 618 769 150',
  registrationNumber: 'ZNZ-BR-2024-00892',
  traLicenseNumber: 'TRA-ZNZ-2024-8841',
  traLicenseExpiry: '2026-12-31',
  traLicenseUrl: '/licenses/tra-license.pdf',
  mpesaNumber: '+255 618 769 150 (Zansafari Horizon)',
  bankName: 'CRDB Bank Zanzibar',
  bankAccount: '0150 0000 0000 0',
  paymentInstructions:
    'Your booking request has been reviewed and confirmed. To secure your reservation, please send the full payment to the M-Pesa number or Bank Account provided below. Your booking is confirmed only when full payment is received.',
  paymentNotes: 'Always verify the payment reference number upon completing your transfer.',
  name: 'Zansafari Horizon Operations',
  businessName: 'Zansafari Horizon Tours & Safaris Ltd',
  biography:
    'Zansafari Horizon is a premier registered Zanzibari tour and safari company based in Stone Town. Guided by native island professionals with over a decade of verified experience, we deliver authentic, sustainable, and personalized cultural excursions, marine safaris, and island transfers across Zanzibar and East Africa.',
  shortBio: 'Registered Zanzibari tour and safari company specializing in authentic cultural journeys and marine safaris.',
  profilePhotoUrl: '/branding/zansafari-logo.png',
  yearsExperience: 10,
  languages: ['English', 'Swahili', 'Italian', 'French', 'German', 'Spanish'],
  phone: '+255 618 769 150',
  whatsapp: '255618769150',
  email: 'info@zansafarihorizon.com',
  location: 'Stone Town, Zanzibar, Tanzania',
  trustPoints: [
    'Registered Tanzanian Tour & Safari Company',
    'TRA Certified & Zanzibar Tourism Commission Licensed',
    '100% Private Excursions & Modern AC Fleet',
    'Native Multilingual Zanzibari Guides (EN / SW / IT / FR / DE / ES)',
    'Transparent Direct Pricing with Zero Intermediary Markups',
  ],
  leadGuideName: 'Ibrahim',
  leadGuidePhone: '+255 618 769 150',
  leadGuideWhatsApp: '+255 618 769 150',
  leadGuideEmail: 'info@zansafarihorizon.com',
};

/**
 * Fetch company profile with Next.js cache and on-demand ISR revalidation tags.
 */
async function fetchCompanyProfileFromDb(): Promise<CompanyProfileData> {
  try {
    const profile =
      (await prisma.companyProfile.findUnique({ where: { id: 'operator-ibrahim' } })) ||
      (await prisma.companyProfile.findFirst({ orderBy: { updatedAt: 'desc' } }));
    if (!profile) {
      return DEFAULT_COMPANY_PROFILE;
    }

    return {
      id: profile.id,
      companyName: profile.companyName || DEFAULT_COMPANY_PROFILE.companyName,
      tagline: profile.tagline || DEFAULT_COMPANY_PROFILE.tagline,
      logoUrl: profile.logoUrl || DEFAULT_COMPANY_PROFILE.logoUrl,
      faviconUrl: profile.faviconUrl || DEFAULT_COMPANY_PROFILE.faviconUrl,
      officialPhone: profile.officialPhone || profile.phone || DEFAULT_COMPANY_PROFILE.officialPhone,
      officialEmail: profile.officialEmail || profile.email || DEFAULT_COMPANY_PROFILE.officialEmail,
      officialWhatsapp: profile.officialWhatsapp || profile.whatsapp || DEFAULT_COMPANY_PROFILE.officialWhatsapp,
      registrationNumber: profile.registrationNumber || DEFAULT_COMPANY_PROFILE.registrationNumber,
      traLicenseNumber: profile.traLicenseNumber || DEFAULT_COMPANY_PROFILE.traLicenseNumber,
      traLicenseExpiry: profile.traLicenseExpiry ? profile.traLicenseExpiry.toISOString().split('T')[0] : null,
      traLicenseUrl: profile.traLicenseUrl || DEFAULT_COMPANY_PROFILE.traLicenseUrl,
      mpesaNumber: profile.mpesaNumber || DEFAULT_COMPANY_PROFILE.mpesaNumber,
      bankName: profile.bankName || DEFAULT_COMPANY_PROFILE.bankName,
      bankAccount: profile.bankAccount || DEFAULT_COMPANY_PROFILE.bankAccount,
      paymentInstructions: profile.paymentInstructions || DEFAULT_COMPANY_PROFILE.paymentInstructions,
      paymentNotes: profile.paymentNotes || null,
      name: profile.name || DEFAULT_COMPANY_PROFILE.name,
      businessName: profile.businessName || DEFAULT_COMPANY_PROFILE.businessName,
      biography: profile.biography || DEFAULT_COMPANY_PROFILE.biography,
      shortBio: profile.shortBio || DEFAULT_COMPANY_PROFILE.shortBio,
      profilePhotoUrl: profile.profilePhotoUrl || DEFAULT_COMPANY_PROFILE.profilePhotoUrl,
      yearsExperience: profile.yearsExperience || DEFAULT_COMPANY_PROFILE.yearsExperience,
      languages: profile.languages && profile.languages.length > 0 ? profile.languages : DEFAULT_COMPANY_PROFILE.languages,
      phone: profile.officialPhone || profile.phone || DEFAULT_COMPANY_PROFILE.phone,
      whatsapp: profile.officialWhatsapp || profile.whatsapp || DEFAULT_COMPANY_PROFILE.whatsapp,
      email: profile.officialEmail || profile.email || DEFAULT_COMPANY_PROFILE.email,
      location: DEFAULT_COMPANY_PROFILE.location,
      trustPoints: DEFAULT_COMPANY_PROFILE.trustPoints,
      leadGuideName: profile.leadGuideName || DEFAULT_COMPANY_PROFILE.leadGuideName,
      leadGuidePhone: profile.leadGuidePhone || profile.officialPhone || DEFAULT_COMPANY_PROFILE.leadGuidePhone,
      leadGuideWhatsApp: profile.leadGuideWhatsApp || profile.officialWhatsapp || DEFAULT_COMPANY_PROFILE.leadGuideWhatsApp,
      leadGuideEmail: profile.leadGuideEmail || profile.officialEmail || DEFAULT_COMPANY_PROFILE.leadGuideEmail,
    };
  } catch (error) {
    console.error('Failed to load CompanyProfile from DB, using defaults:', error);
    return DEFAULT_COMPANY_PROFILE;
  }
}

export const getCompanyProfile = unstable_cache(
  fetchCompanyProfileFromDb,
  ['company-profile-cache'],
  {
    tags: ['company-profile', 'branding'],
    revalidate: 3600, // Background revalidation every hour or immediate via revalidateCompanyProfile()
  }
);

/**
 * Triggers immediate, site-wide ISR revalidation for company branding.
 */
export async function revalidateCompanyProfile() {
  try {
    revalidateTag('company-profile', 'max');
    revalidateTag('branding', 'max');
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/about');
    revalidatePath('/contact');
    revalidatePath('/tours');
    revalidatePath('/transportation');
    revalidatePath('/reviews');
    revalidatePath('/faq');
  } catch (err) {
    console.warn('revalidateCompanyProfile error:', err);
  }
}
