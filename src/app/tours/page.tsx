import React from 'react';
import type { Metadata } from 'next';
import { getPublicTours } from '@/lib/tours-db';
import ToursCatalogClient from '@/components/tours/ToursCatalogClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'All Zanzibar Tours & Excursions | Zansafari Horizon',
  description:
    'Explore our collection of private Zanzibar tours, marine safaris, cultural walks, and full-day combos. Book directly with Zansafari Horizon.',
};

export default async function ToursPage() {
  const tours = await getPublicTours();

  return <ToursCatalogClient initialTours={tours} />;
}
