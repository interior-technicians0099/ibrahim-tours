export type Locale = 'en' | 'fr' | 'es' | 'it' | 'de' | 'ar';

export type Direction = 'ltr' | 'rtl';

export interface LanguageMeta {
  code: Locale;
  name: string;
  nativeName: string;
  dir: Direction;
  flag: string;
}

export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'es', 'it', 'de', 'ar'];

export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr', flag: '🇮🇹' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇹🇿' },
];

export interface Dictionary {
  nav: {
    home: string;
    about: string;
    tours: string;
    transportation: string;
    reviews: string;
    faq: string;
    contact: string;
    bookRequest: string;
    whatsAppUs: string;
  };
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    exploreTours: string;
    bookTransfer: string;
    chatWhatsApp: string;
    statTours: string;
    statRating: string;
    statPayment: string;
    badgePrivate: string;
    badgePrivateSub: string;
    badgeBooking: string;
    badgeBookingSub: string;
  };
  whyChoose: {
    badge: string;
    title: string;
    subtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature1Badge: string;
    feature2Title: string;
    feature2Desc: string;
    feature2Badge: string;
    feature3Title: string;
    feature3Desc: string;
    feature3Badge: string;
    feature4Title: string;
    feature4Desc: string;
    feature4Badge: string;
  };
  featuredTours: {
    badge: string;
    title: string;
    subtitle: string;
    viewAll: string;
    startingFrom: string;
    duration: string;
    securePayment: string;
    bookNow: string;
  };
  finalCta: {
    title: string;
    description: string;
    bookOnline: string;
    chatWhatsApp: string;
    orCall: string;
  };
  booking: {
    title: string;
    subtitle: string;
    tabTours: string;
    tabTransfers: string;
    step1Tour: string;
    step1Transfer: string;
    step2Contact: string;
    selectTour: string;
    selectRoute: string;
    pickupLocation: string;
    dropoffDestination: string;
    bookingDate: string;
    preferredTime: string;
    adults: string;
    children: string;
    passengers: string;
    luggage: string;
    hotelPickup: string;
    contactDetails: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    country: string;
    specialRequests: string;
    specialRequestsPlaceholder: string;
    summaryTitle: string;
    estimatedPrice: string;
    secureNotice: string;
    fullPaymentNotice: string;
    gdprConsent: string;
    submitTour: string;
    submitTransfer: string;
    submitting: string;
    successTitle: string;
    referenceLabel: string;
    copyCode: string;
    copied: string;
    reviewTime: string;
    instantChatNotice: string;
    chatWhatsAppNow: string;
    viewConfirmation: string;
    returnHome: string;
  };
  confirmation: {
    breadcrumbHome: string;
    breadcrumbBook: string;
    breadcrumbConfirmation: string;
    badgeLogged: string;
    greeting: string;
    refCode: string;
    alertTitle: string;
    alertDesc: string;
    summaryTitle: string;
    serviceRequested: string;
    tourTypeLabel: string;
    transferTypeLabel: string;
    dateTimeLabel: string;
    partySizeLabel: string;
    adultsCount: string;
    childrenCount: string;
    estimatedPriceLabel: string;
    settleNote: string;
    pickupLabel: string;
    pickupDefault: string;
    dropoffLabel: string;
    specialRequestsLabel: string;
    paymentTitle: string;
    paymentNoticeExcl: string;
    fullPaymentRequiredBadge: string;
    mpesaLabel: string;
    bankTransferTitle: string;
    bankNameLabel: string;
    accountNumberLabel: string;
    whatsAppCardTitle: string;
    whatsAppCardDesc: string;
    chatWithIbrahim: string;
    prefillRefNote: string;
    contactProvidedTitle: string;
    browseMore: string;
    notFoundTitle: string;
    notFoundDesc: string;
    returnToBook: string;
  };
  faq: {
    badge: string;
    title: string;
    subtitle: string;
    stillHaveQuestionsTitle: string;
    stillHaveQuestionsDesc: string;
    chatWhatsApp: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
    q5: string;
    a5: string;
    q6: string;
    a6: string;
    q7: string;
    a7: string;
  };
  footer: {
    tagline: string;
    licensedBadge: string;
    experienceBadge: string;
    exploreTitle: string;
    experiencesTitle: string;
    contactTitle: string;
    home: string;
    meetIbrahim: string;
    tours: string;
    transfers: string;
    reviews: string;
    faqs: string;
    contact: string;
    requestBooking: string;
    languagesSpoken: string;
    chatWhatsApp: string;
    allRightsReserved: string;
    madeWithLove: string;
  };
  mobileBar: {
    bookNow: string;
    whatsApp: string;
    callGuide: string;
  };
  whatsapp: {
    defaultGreeting: string;
    tourInquiry: string;
    transferInquiry: string;
    bookingConfirmation: string;
    faqQuestion: string;
  };
  common: {
    selectLanguage: string;
    language: string;
    close: string;
    back: string;
    licensedGuide: string;
    securePaymentBadge: string;
  };
}
