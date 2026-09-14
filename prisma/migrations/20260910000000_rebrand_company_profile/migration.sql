-- AlterEnum: Add COMPANY_ADMIN to Role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COMPANY_ADMIN';

-- AlterTable: Rename OperatorProfile to CompanyProfile if it exists, or create CompanyProfile
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'OperatorProfile') THEN
    ALTER TABLE "OperatorProfile" RENAME TO "CompanyProfile";
  END IF;
END $$;

-- CreateTable if CompanyProfile does not exist
CREATE TABLE IF NOT EXISTS "CompanyProfile" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Zansafari Horizon',
    "tagline" TEXT NOT NULL DEFAULT 'Spice • Culture • Wildlife',
    "logoUrl" TEXT DEFAULT '/branding/zansafari-logo.png',
    "faviconUrl" TEXT DEFAULT '/branding/favicon.png',
    "officialPhone" TEXT NOT NULL DEFAULT '+255 777 000 000',
    "officialEmail" TEXT NOT NULL DEFAULT 'info@zansafarihorizon.com',
    "officialWhatsapp" TEXT NOT NULL DEFAULT '+255 777 000 000',
    "registrationNumber" TEXT DEFAULT 'ZNZ-BR-2024-00892',
    "traLicenseNumber" TEXT DEFAULT 'TRA-ZNZ-2024-8841',
    "traLicenseExpiry" TIMESTAMP(3),
    "traLicenseUrl" TEXT,
    "mpesaNumber" TEXT DEFAULT '+255 777 000 000 (Zansafari Horizon)',
    "bankName" TEXT DEFAULT 'CRDB Bank Zanzibar',
    "bankAccount" TEXT DEFAULT '0150 0000 0000 0',
    "paymentInstructions" TEXT NOT NULL DEFAULT 'Your booking request has been reviewed and confirmed. To secure your reservation, please send the full payment to the M-Pesa number or Bank Account provided below.',
    "paymentNotes" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Zansafari Horizon Operations',
    "businessName" TEXT NOT NULL DEFAULT 'Zansafari Horizon Tours & Safaris Ltd',
    "biography" TEXT NOT NULL DEFAULT 'Zansafari Horizon is a premier registered Zanzibari tour and safari company based in Stone Town.',
    "shortBio" TEXT,
    "profilePhotoUrl" TEXT,
    "yearsExperience" INTEGER NOT NULL DEFAULT 10,
    "languages" TEXT[] DEFAULT ARRAY['English', 'Swahili', 'Italian', 'French', 'German', 'Spanish']::TEXT[],
    "phone" TEXT NOT NULL DEFAULT '+255 777 000 000',
    "whatsapp" TEXT NOT NULL DEFAULT '+255 777 000 000',
    "email" TEXT NOT NULL DEFAULT 'info@zansafarihorizon.com',
    "socials" JSONB,
    "commissionRate" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- Add new columns if table already existed and was renamed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CompanyProfile' AND column_name='companyName') THEN
    ALTER TABLE "CompanyProfile" ADD COLUMN "companyName" TEXT NOT NULL DEFAULT 'Zansafari Horizon';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CompanyProfile' AND column_name='logoUrl') THEN
    ALTER TABLE "CompanyProfile" ADD COLUMN "logoUrl" TEXT DEFAULT '/branding/zansafari-logo.png';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CompanyProfile' AND column_name='faviconUrl') THEN
    ALTER TABLE "CompanyProfile" ADD COLUMN "faviconUrl" TEXT DEFAULT '/branding/favicon.png';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CompanyProfile' AND column_name='officialPhone') THEN
    ALTER TABLE "CompanyProfile" ADD COLUMN "officialPhone" TEXT NOT NULL DEFAULT '+255 777 000 000';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CompanyProfile' AND column_name='officialEmail') THEN
    ALTER TABLE "CompanyProfile" ADD COLUMN "officialEmail" TEXT NOT NULL DEFAULT 'info@zansafarihorizon.com';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CompanyProfile' AND column_name='officialWhatsapp') THEN
    ALTER TABLE "CompanyProfile" ADD COLUMN "officialWhatsapp" TEXT NOT NULL DEFAULT '+255 777 000 000';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CompanyProfile' AND column_name='registrationNumber') THEN
    ALTER TABLE "CompanyProfile" ADD COLUMN "registrationNumber" TEXT DEFAULT 'ZNZ-BR-2024-00892';
  END IF;
END $$;
