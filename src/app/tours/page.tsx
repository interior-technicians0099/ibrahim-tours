import React from 'react';
import type { Metadata } from 'next';
import { getPublicTours } from '@/lib/tours-db';
import ToursCatalogClient from '@/components/tours/ToursCatalogClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'All Zanzibar Tours & Excursions | Ibrahim Tours',
  description:
    'Explore our collection of private Zanzibar tours, marine safaris, cultural walks, and full-day combos. No upfront payment required.',
};

export default async function ToursPage() {
  const tours = await getPublicTours();

  return <ToursCatalogClient initialTours={tours} />;
}
