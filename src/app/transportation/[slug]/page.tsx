import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TRANSFER_ROUTES, OPERATOR } from '@/lib/constants';
import TransferDetail from '@/components/transport/TransferDetail';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all 12 transfer routes
export async function generateStaticParams() {
  return TRANSFER_ROUTES.map((route) => ({
    slug: route.id,
  }));
}

// Generate dynamic SEO metadata for each transfer route
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = TRANSFER_ROUTES.find((r) => r.id === slug);

  if (!route) {
    return {
      title: 'Transfer Route Not Found',
      description: 'The requested Zanzibar transfer route could not be found.',
    };
  }

  const routeTitle = `${route.origin} to ${route.destination}`;

  return {
    title: `${routeTitle} Private Transfer | ${OPERATOR.businessName}`,
    description: `Book direct private transfer from ${route.origin} to ${route.destination} (${route.distanceKm} km, ${route.durationEstimate}). Clean AC van & bus options with fixed transparent tiered pricing.`,
    keywords: [
      routeTitle,
      'Zanzibar Airport Transfer',
      'Zanzibar Taxi',
      'Private Transport Zanzibar',
      OPERATOR.businessName,
    ],
    openGraph: {
      title: `${routeTitle} - Private Zanzibar Transfer`,
      description: `Fixed-rate private transport from ${route.origin} to ${route.destination}. Free flight tracking and meet & greet included.`,
      url: `https://ibrahimtours.co.tz/transportation/${route.id}`,
      siteName: OPERATOR.businessName,
      type: 'article',
    },
  };
}

export default async function TransferDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const route = TRANSFER_ROUTES.find((r) => r.id === slug);

  if (!route) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${route.origin} to ${route.destination} Private Transfer`,
    description: `Private Zanzibar transfer between ${route.origin} and ${route.destination}`,
    provider: {
      '@type': 'TravelAgency',
      name: OPERATOR.businessName,
      telephone: OPERATOR.phone,
      email: OPERATOR.email,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Zanzibar, Tanzania',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TransferDetail route={route} />
    </>
  );
}
