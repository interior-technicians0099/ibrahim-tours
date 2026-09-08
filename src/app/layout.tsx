import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileStickyBar from '@/components/layout/MobileStickyBar';
import { OPERATOR } from '@/lib/constants';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { isSupportedLocale, Locale, DEFAULT_LOCALE } from '@/lib/i18n';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://ibrahimtours.co.tz'),
  title: {
    default: `${OPERATOR.businessName} | Private Tours, Excursions & Airport Transfers in Zanzibar`,
    template: `%s | ${OPERATOR.businessName}`,
  },
  description:
    'Book authentic private tours, dolphin safaris, spice farm visits, and reliable airport transfers in Zanzibar with Ibrahim. Local licensed guide with 10+ years experience, transparent USD pricing, and flexible WhatsApp booking with no online prepayment required.',
  keywords: [
    'Zanzibar Tours',
    'Ibrahim Tours Zanzibar',
    'Stone Town Tour',
    'Mnemba Island Snorkeling',
    'Safari Blue Zanzibar',
    'Zanzibar Airport Transfer',
    'Private Tour Guide Zanzibar',
    'Prison Island Giant Tortoises',
    'Jozani Forest Red Colobus',
  ],
  authors: [{ name: OPERATOR.name, url: 'https://ibrahimtours.co.tz' }],
  creator: OPERATOR.businessName,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ibrahimtours.co.tz',
    siteName: OPERATOR.businessName,
    title: `${OPERATOR.businessName} | Your Trusted Local Guide in Zanzibar`,
    description:
      'Private island tours, dhow cruises, and airport transfers across Zanzibar. Certified local guide, clear pricing, and instant WhatsApp booking.',
    images: [
      {
        url: '/images/safari-blue.webp',
        width: 1200,
        height: 630,
        alt: `${OPERATOR.businessName} - Zanzibar Island Tours`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${OPERATOR.businessName} | Zanzibar Private Tours`,
    description:
      'Explore Zanzibar with licensed local guide Ibrahim. Book private tours and transfers directly on WhatsApp.',
    images: ['/images/safari-blue.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  const initialLocale: Locale = isSupportedLocale(localeCookie || '')
    ? (localeCookie as Locale)
    : DEFAULT_LOCALE;
  const initialDir = initialLocale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={initialLocale}
      dir={initialDir}
      className={`${inter.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-sky-500 selection:text-white"
        suppressHydrationWarning
      >
        <LanguageProvider initialLocale={initialLocale}>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
          <MobileStickyBar />
        </LanguageProvider>
      </body>
    </html>
  );
}
