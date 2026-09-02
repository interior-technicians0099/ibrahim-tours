export type TourCategory =
  | 'Sea & Water'
  | 'City & Cultural'
  | 'Nature & Wildlife'
  | 'Island Experiences'
  | 'Beach & Island'
  | 'Full Day Combos';

export interface TourPricingTier {
  single: number;
  couple: number;
  group5to10: number; // per person
  group20?: number;   // per person (optional where not specified)
}

export interface FeaturedTour {
  id: string;
  title: string;
  price: number; // Starting price in USD
  category: TourCategory;
  tagline: string;
  duration: 'Full Day' | 'Half Day';
  image?: string;
  slug: string;
}

export interface Tour {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  duration: 'Full Day' | 'Half Day';
  category: TourCategory;
  tagline: string;
  description: string;
  pricing: TourPricingTier;
  inclusions: string[];
  exclusions?: string[];
  highlights?: string[];
  image?: string;
  featured?: boolean;
}

export interface TransferPricingTier {
  van1to3: number;     // 1–3 pax Van ($ USD)
  van4to6: number;     // 4–6 pax Van ($ USD)
  miniBus7to12: number;// 7–12 pax Mini Bus ($ USD)
  bigBus13to25: number;// 13–25 pax Big Bus ($ USD)
}

export interface TransferRoute {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationEstimate: string;
  pricing: TransferPricingTier;
}

export interface Vehicle {
  id: string;
  name: string;
  capacity: string;
  features: string[];
  image?: string;
}

export interface Operator {
  name: string;
  businessName: string;
  tagline: string;
  experience: string;
  languages: string[];
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  trustPoints: string[];
}

export interface Review {
  id: string;
  author: string;
  country: string;
  rating: number;
  tourTitle: string;
  content: string;
  date: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}
