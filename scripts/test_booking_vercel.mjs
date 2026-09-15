const BASE_URL = 'https://ibrahim-tours-beige.vercel.app';

async function testBookingSubmit() {
  console.log('Testing booking submit on Vercel...');
  const payload = {
    serviceType: 'TOUR',
    tier: 'standard',
    customerName: 'Hamadi Test',
    customerEmail: 'hamaditest@example.com',
    customerPhone: '+255712345678',
    customerCountry: 'Tanzania',
    bookingDate: '2026-09-25',
    numAdults: 2,
    numChildren: 0,
    pickupLocation: 'Stone Town Hotel',
    specialRequests: 'Test booking from CLI',
    selectedLanguage: 'sw',
  };

  try {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Submit status:', res.status);
    const data = await res.json();
    console.log('Response data:', data);

    if (data.referenceCode) {
      console.log('Testing confirmation page fetch for:', data.referenceCode);
      const confRes = await fetch(`${BASE_URL}/book/confirmation/${data.referenceCode}`);
      console.log('Confirmation page status:', confRes.status);
      const text = await confRes.text();
      if (confRes.status !== 200 || text.includes('Page Unavailable')) {
        console.log('CONFIRMATION PAGE FAILED! Preview:', text.slice(0, 500));
      } else {
        console.log('CONFIRMATION PAGE SUCCESS! Content length:', text.length);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testBookingSubmit();
