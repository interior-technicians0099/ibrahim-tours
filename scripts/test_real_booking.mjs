const BASE_URL = 'https://ibrahim-tours-beige.vercel.app';

async function testRealBooking() {
  // 1. Fetch tours from home or tours page to find a slug
  const pageRes = await fetch(`${BASE_URL}/tours`);
  const html = await pageRes.text();
  const slugMatch = html.match(/\/tours\/([a-z0-9-]+)/);
  const slug = slugMatch ? slugMatch[1] : 'safari-blue';
  console.log('Found tour slug on Vercel:', slug);

  // 2. Submit booking exactly as BookingForm does
  const payload = {
    serviceType: 'TOUR',
    tourSlug: slug,
    tourDate: '2026-09-25',
    tourTime: '08:30',
    numAdults: 2,
    numChildren: 0,
    pickupLocation: 'Stone Town Hotel',
    fullName: 'Hamadi Hamadi',
    email: 'hamadi@example.com',
    phone: '+255712345678',
    country: 'Tanzania',
    specialRequests: 'Online Vercel test booking',
    locale: 'en',
    preferredLanguage: 'English',
    honeypot: '',
  };

  const res = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log('Booking submit status:', res.status);
  const data = await res.json();
  console.log('Booking response data:', data);

  if (data.referenceCode) {
    console.log('Fetching confirmation page for:', data.referenceCode);
    const confRes = await fetch(`${BASE_URL}/book/confirmation/${data.referenceCode}`);
    console.log('Confirmation page HTTP status:', confRes.status);
    const confHtml = await confRes.text();
    if (confHtml.includes('Page Unavailable')) {
      console.log('💥 CONFIRMATION PAGE SHOWS: Page Unavailable!');
      const digestMatch = confHtml.match(/Code:\s*([0-9a-zA-Z_-]+)/);
      console.log('Error Digest:', digestMatch ? digestMatch[1] : 'none');
    } else if (confHtml.includes('Asante Sana') || confHtml.includes('Thank you') || confHtml.includes('REQUEST SUCCESSFULLY LOGGED')) {
      console.log('🎉 Confirmation page rendered successfully!');
    } else {
      console.log('Confirmation HTML snippet:', confHtml.slice(0, 400));
    }
  }
}

testRealBooking();
