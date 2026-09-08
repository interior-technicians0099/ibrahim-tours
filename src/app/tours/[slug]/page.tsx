import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_TOURS, OPERATOR } from '@/lib/constants';
import { getPublicTourBySlug } from '@/lib/tours-db';
import TourDetail from '@/components/tours/TourDetail';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all 14 detailed tours
export async function generateStaticParams() {
  return ALL_TOURS.map((tour) => ({
    slug: tour.slug,
  }));
}

// Generate dynamic SEO metadata for each tour
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getPublicTourBySlug(slug);

  if (!tour) {
    return {
      title: 'Tour Not Found',
      description: 'The requested Zanzibar tour could not be found.',
    };
  }

  return {
    title: `${tour.title} | ${OPERATOR.businessName}`,
    description: `${tour.tagline}. ${tour.description.slice(0, 150)}... Book private tour with Ibrahim with direct transparent pricing.`,
    keywords: [
      tour.title,
      'Zanzibar Tours',
      tour.category,
      'Ibrahim Tours Zanzibar',
      'Private Island Tour',
    ],
    openGraph: {
      title: `${tour.title} - Private Zanzibar Tour`,
      description: tour.tagline,
      url: `https://ibrahimtours.co.tz/tours/${tour.slug}`,
      siteName: OPERATOR.businessName,
      images: tour.image ? [{ url: tour.image }] : undefined,
      type: 'article',
    },
  };
}

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = await getPublicTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.description,
    touristType: ['Travelers', 'Couples', 'Families'],
    offers: {
      '@type': 'Offer',
      price: (tour.pricing?.single || 120).toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: '2026-01-01',
    },
    provider: {
      '@type': 'TravelAgency',
      name: OPERATOR.businessName,
      telephone: OPERATOR.phone,
      email: OPERATOR.email,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TourDetail tour={tour} />
    </>
  );
}

