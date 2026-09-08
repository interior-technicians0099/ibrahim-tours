import React from 'react';
import Hero from '@/components/home/Hero';
import TrustIntro from '@/components/home/TrustIntro';
import FeaturedTours from '@/components/home/FeaturedTours';
import TourCategories from '@/components/home/TourCategories';
import TransportPreview from '@/components/home/TransportPreview';
import ReviewsPreview from '@/components/home/ReviewsPreview';
import WhyChooseOperator from '@/components/home/WhyChooseOperator';
import FinalCTA from '@/components/home/FinalCTA';
import { getPublicTours } from '@/lib/tours-db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allTours = await getPublicTours();
  const featured = allTours.filter((t) => t.featured).slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Full-Width Tropical Hero */}
      <Hero />

      {/* 2. Meet Ibrahim Trust Intro Card */}
      <TrustIntro />

      {/* 3. Grid of 8 Featured Packages with Dual CTAs */}
      <FeaturedTours tours={featured} />

      {/* 4. Tour Categories Explorer */}
      <TourCategories />

      {/* 5. Need a Transfer & Vehicle Fleet Preview */}
      <TransportPreview />

      {/* 6. Verified 5-Star Guest Reviews */}
      <ReviewsPreview />

      {/* 7. Why Choose Ibrahim (Trust Signals) */}
      <WhyChooseOperator />

      {/* 8. Blue Band Final Call To Action */}
      <FinalCTA />
    </div>
  );
}
