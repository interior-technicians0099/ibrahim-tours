import { execSync } from 'child_process';
import { PrismaClient, Role } from '@prisma/client';
import { hash } from '@node-rs/argon2';

console.log('🚀 [deploy-db] Initializing database synchronization...');

// 1. Push schema to database (applies new tables like CompanyProfile, Receipt, etc.)
try {
  console.log('📦 [deploy-db] Running prisma db push...');
  const pushEnv = {
    ...process.env,
    DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
  };
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    env: pushEnv,
  });
  console.log('✅ [deploy-db] Prisma schema successfully pushed.');
} catch (err) {
  console.error('⚠️ [deploy-db] Warning during prisma db push:', err?.message || err);
}

// 2. Seed & sync users and CompanyProfile
async function seedUsersAndCompany() {
  const prisma = new PrismaClient();
  try {
    // 2.0 Directly ensure required columns exist in PostgreSQL
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guideNotes" TEXT;
        ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "operatorId" TEXT;
      `);
      console.log('✅ [deploy-db] Verified Booking columns via raw SQL.');
    } catch (rawErr) {
      console.warn('⚠️ [deploy-db] Raw SQL alter note:', rawErr?.message || rawErr);
    }
    console.log('🌱 [deploy-db] Upserting CompanyProfile...');
    const companyData = {
      id: 'operator-ibrahim',
      companyName: 'Zansafari Horizon',
      tagline: 'Spice • Culture • Wildlife',
      name: 'Zansafari Horizon Operations',
      businessName: 'Zansafari Horizon Tours & Safaris Ltd',
      logoUrl: '/branding/zansafari-logo.png',
      faviconUrl: '/branding/favicon.png',
      officialPhone: '+255 618 769 150',
      officialEmail: 'info@zansafarihorizon.com',
      officialWhatsapp: '+255 618 769 150',
      registrationNumber: 'ZNZ-BR-2024-00892',
      traLicenseNumber: 'TRA-ZNZ-2024-8841',
      traLicenseExpiry: new Date('2026-12-31T23:59:59Z'),
      traLicenseUrl: '/licenses/tra-license.pdf',
      biography:
        'Zansafari Horizon is a premier registered Zanzibari tour and safari company based in Stone Town. Guided by native island professionals with over a decade of verified experience, we deliver authentic, sustainable, and personalized cultural excursions, marine safaris, and island transfers across Zanzibar and East Africa.',
      shortBio: 'Registered Zanzibari tour and safari company specializing in authentic cultural journeys and marine safaris.',
      profilePhotoUrl: '/branding/zansafari-logo.png',
      yearsExperience: 10,
      languages: ['English', 'Swahili', 'Italian', 'French', 'German', 'Spanish'],
      phone: '+255 618 769 150',
      whatsapp: '255618769150',
      email: 'info@zansafarihorizon.com',
      socials: {
        facebook: 'https://facebook.com/zansafarihorizon',
        instagram: 'https://instagram.com/zansafarihorizon',
      },
      paymentInstructions:
        'Your booking request has been reviewed and confirmed. To secure your reservation, please send the full payment to the M-Pesa number or Bank Account provided below. Your booking is confirmed only when full payment is received.',
      paymentNotes: 'Always verify the payment reference number before sending the final confirmation voucher.',
      mpesaNumber: '+255 618 769 150 (Zansafari Horizon)',
      bankName: 'CRDB Bank Zanzibar',
      bankAccount: '0150 0000 0000 0',
      commissionRate: null,
      leadGuideName: 'Ibrahim',
      leadGuidePhone: '+255 618 769 150',
      leadGuideWhatsApp: '+255 618 769 150',
      leadGuideEmail: 'info@zansafarihorizon.com',
    };

    await prisma.companyProfile.upsert({
      where: { id: 'operator-ibrahim' },
      update: companyData,
      create: companyData,
    });
    console.log('✅ [deploy-db] CompanyProfile synced.');

    console.log('🔐 [deploy-db] Hashing credentials...');
    const defaultAdminHash = await hash('AdminPass123!');
    const defaultZansafariHash = await hash('Zansafari2026!');
    const defaultIbrahimHash = await hash('IbrahimTour2026!');

    // 1. Platform SuperAdmin
    await prisma.adminUser.upsert({
      where: { email: 'admin@zansafarihorizon.com' },
      update: {
        name: 'Platform SuperAdmin',
        passwordHash: defaultAdminHash,
        role: Role.PLATFORM_ADMIN,
        isActive: true,
        mustChangePassword: false,
      },
      create: {
        email: 'admin@zansafarihorizon.com',
        name: 'Platform SuperAdmin',
        passwordHash: defaultAdminHash,
        role: Role.PLATFORM_ADMIN,
        isActive: true,
        mustChangePassword: false,
      },
    });

    // 2. Company Manager (COMPANY_ADMIN)
    await prisma.adminUser.upsert({
      where: { email: 'manager@zansafarihorizon.com' },
      update: {
        name: 'Company Manager',
        passwordHash: defaultZansafariHash,
        role: Role.COMPANY_ADMIN,
        operatorId: 'operator-ibrahim',
        isActive: true,
        mustChangePassword: false,
      },
      create: {
        email: 'manager@zansafarihorizon.com',
        name: 'Company Manager',
        passwordHash: defaultZansafariHash,
        role: Role.COMPANY_ADMIN,
        operatorId: 'operator-ibrahim',
        isActive: true,
        mustChangePassword: false,
      },
    });

    // 3. Field Operator (OPERATOR)
    await prisma.adminUser.upsert({
      where: { email: 'operator@zansafarihorizon.com' },
      update: {
        name: 'Zansafari Operations',
        passwordHash: defaultZansafariHash,
        role: Role.OPERATOR,
        operatorId: 'operator-ibrahim',
        isActive: true,
        mustChangePassword: false,
      },
      create: {
        email: 'operator@zansafarihorizon.com',
        name: 'Zansafari Operations',
        passwordHash: defaultZansafariHash,
        role: Role.OPERATOR,
        operatorId: 'operator-ibrahim',
        isActive: true,
        mustChangePassword: false,
      },
    });

    // 4. Preserve existing legacy accounts
    await prisma.adminUser.upsert({
      where: { email: 'admin@ibrahimtours.co.tz' },
      update: {
        name: 'Platform SuperAdmin',
        passwordHash: defaultAdminHash,
        role: Role.PLATFORM_ADMIN,
        isActive: true,
        mustChangePassword: false,
      },
      create: {
        email: 'admin@ibrahimtours.co.tz',
        name: 'Platform SuperAdmin',
        passwordHash: defaultAdminHash,
        role: Role.PLATFORM_ADMIN,
        isActive: true,
        mustChangePassword: false,
      },
    });

    await prisma.adminUser.upsert({
      where: { email: 'ibrahim@ibrahimtours.co.tz' },
      update: {
        name: 'Ibrahim (Operator)',
        passwordHash: defaultIbrahimHash,
        role: Role.OPERATOR,
        operatorId: 'operator-ibrahim',
        isActive: true,
        mustChangePassword: false,
      },
      create: {
        email: 'ibrahim@ibrahimtours.co.tz',
        name: 'Ibrahim (Operator)',
        passwordHash: defaultIbrahimHash,
        role: Role.OPERATOR,
        operatorId: 'operator-ibrahim',
        isActive: true,
        mustChangePassword: false,
      },
    });

    console.log('✅ [deploy-db] All 5 admin and operator user accounts successfully synchronized.');
  } catch (err) {
    console.error('⚠️ [deploy-db] Error syncing users and profile:', err?.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsersAndCompany().then(() => {
  console.log('🎉 [deploy-db] Database synchronization finished.');
});
