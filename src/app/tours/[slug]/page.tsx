import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_TOURS, OPERATOR } from '@/lib/constants';
import TourDetail from '@/components/tours/TourDetail';

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
  const tour = ALL_TOURS.find((t) => t.slug === slug);

  if (!tour) {
    return {
      title: 'Tour Not Found',
      description: 'The requested Zanzibar tour could not be found.',
    };
  }

  return {
    title: `${tour.title} | ${OPERATOR.businessName}`,
    description: `${tour.tagline}. ${tour.description.slice(0, 150)}... Book private tour with Ibrahim. Zero prepayment required.`,
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
      type: 'article',
    },
  };
}

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = ALL_TOURS.find((t) => t.slug === slug);

  if (!tour) {
    notFound();
  }

  return <TourDetail tour={tour} />;
}
