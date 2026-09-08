# Ibrahim Tours Zanzibar v3.0 — Production Deployment Guide & Checklist

Enterprise production deployment protocol for **Ibrahim Tours Zanzibar v3.0** hosted on **Vercel** with **Neon Serverless PostgreSQL**.

---

## 1. Environment Variables Configuration (Vercel Project Settings)

Navigate to **Vercel Dashboard** $\rightarrow$ **Project** $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables** and configure the following:

| Variable Name | Description | Environment | Sensitive? | Production Example / Default |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection URI with `?sslmode=require` | Production, Preview, Dev | **Yes** | `postgresql://user:pass@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | 32-byte base64 secret (`openssl rand -base64 32`) | Production, Preview, Dev | **Yes** | `d4e5f6...` |
| `NEXTAUTH_SECRET` | Same value as `AUTH_SECRET` for Auth.js v5 compatibility | Production, Preview, Dev | **Yes** | `d4e5f6...` |
| `NEXTAUTH_URL` | Canonical production domain | Production | No | `https://ibrahimtours.co.tz` |
| `NEXT_PUBLIC_APP_URL` | Public web application URL | Production | No | `https://ibrahimtours.co.tz` |
| `RESEND_API_KEY` | Resend transactional email API key | Production | **Yes** | `re_123456789...` |
| `RESEND_FROM_EMAIL` | Verified sender domain email | Production | No | `Ibrahim Tours Zanzibar <bookings@ibrahimtours.co.tz>` |
| `PLATFORM_ADMIN_EMAIL`| Destination for security alerts & confirmed booking notifications | Production | No | `admin@ibrahimtours.co.tz` |
| `OPERATOR_ALERT_EMAIL`| Destination for new booking request notifications | Production | No | `ibrahim@ibrahimtours.co.tz` |
| `OPERATOR_WHATSAPP_PHONE` | Ibrahim's direct WhatsApp number without + or spaces | Production | No | `255777123456` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier for responsive images | Production | No | `ibrahim-tours` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Production | **Yes** | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | Production | **Yes** | `abcdef...` |
| `CRON_SECRET` | Secret token for securing Vercel Cron routes | Production | **Yes** | `openssl rand -hex 24` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry client ingestion DSN | Production | No | `https://xxx@yyy.ingest.sentry.io/zzz` |
| `SENTRY_DSN` | Sentry server ingestion DSN | Production | **Yes** | `https://xxx@yyy.ingest.sentry.io/zzz` |

---

## 2. Vercel Build & Database Migration Setup

In **Vercel Project Settings** $\rightarrow$ **General** $\rightarrow$ **Build & Development Settings**:

1. **Build Command**:
   Toggle **Override** and specify:
   ```bash
   npx prisma generate && npx prisma migrate deploy && next build
   ```
   *Rationale*: This guarantees that Prisma Client is generated, database schema migrations are applied to Neon before the Next.js bundle compiles, and zero runtime schema drift occurs.

2. **Output Directory**:
   Leave as default (`.next`).

3. **Install Command**:
   Toggle **Override** and specify:
   ```bash
   npm install --legacy-peer-deps
   ```

---

## 3. Production Database Seeding & Maintenance

To provision Ibrahim's initial operator profile, tours catalog, transport routes, and platform superadmin account:

From your local terminal connected to the Neon production database:
```bash
# 1. Ensure production DATABASE_URL is active in your terminal session
export DATABASE_URL="postgresql://user:password@ep-prod-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 2. Run migrations
npx prisma migrate deploy

# 3. Seed production catalog & initial accounts
npx tsx prisma/seed.ts
```

Default credentials provisioned:
- **Platform SuperAdmin**: `admin@ibrahimtours.co.tz` (Must change password upon initial login)
- **Operator (Ibrahim)**: `ibrahim@ibrahimtours.co.tz`

---

## 4. Neon PostgreSQL Automated Backups & PITR Restore

Neon provides continuous automated Point-In-Time Recovery (PITR) and branch snapshots:

### A. Point-in-Time Restore (PITR) via Neon CLI / Console
In the event of accidental data corruption or disaster recovery:
1. Navigate to **Neon Console** $\rightarrow$ **Project** $\rightarrow$ **Branches** $\rightarrow$ **Create Branch**.
2. Select **Restore from time** and input the timestamp prior to the incident (e.g. `2026-09-08T06:00:00Z`).
3. Name the branch `recovery-20260908` and click **Create**.
4. Update `DATABASE_URL` in Vercel to point to the new recovery branch pooler URI.
5. Alternatively, run via Neon CLI:
   ```bash
   neon branches create --project-id <PROJECT_ID> --name recovery-branch --point-in-time "2026-09-08T06:00:00Z"
   ```

### B. Daily pg_dump Backup (Cold Storage)
Run an automated nightly pg_dump off-site backup:
```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file="backup_ibrahimtours_$(date +%Y%m%d_%H%M%S).dump"
```

---

## 5. Security & Compliance Architecture

1. **Security Headers (`next.config.ts`)**:
   - `Content-Security-Policy`: Restricts scripts, objects, frames; whitelists Cloudinary images (`res.cloudinary.com`).
   - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` (enforced via HTTPS 301 redirect in middleware).
   - `X-Frame-Options`: `DENY` (clickjacking prevention).
   - `X-Content-Type-Options`: `nosniff`.
   - `Referrer-Policy`: `strict-origin-when-cross-origin`.
   - `Permissions-Policy`: Disabled unused browser APIs (camera, microphone, geolocation).

2. **Rate Limiting & Spam Prevention**:
   - Public Bookings: 10 requests / hour / IP (`/api/bookings`).
   - Public Inquiries: 5 requests / 15 minutes / IP (`/api/contact`).
   - Authentication: 5 attempts / 15 minutes / IP (`/login`).
   - Operator Media Uploads: 30 uploads / hour / user (`/api/operator/media/upload`).
   - Honeypot fields present on all public forms (`/book`, `/contact`).

3. **Input & Output Hardening**:
   - Zod schema validation across all API routes and Server Actions.
   - Magic byte inspection for image uploads (strictly JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF...WEBP`).
   - Safe HTML whitelist sanitizer (`src/lib/sanitize.ts`) for rich descriptions.
   - Public DTO serialization (`src/lib/serialization.ts`) stripping private margins (`costCents`, `profitCents`, `commission*`).

4. **GDPR & Tanzanian TRA Regulatory Compliance**:
   - Customer anonymization replaces PII (`customerName`, `customerEmail`, `customerPhone`) with pseudonyms (`DELETED-<id>`).
   - Financial totals (`amountPaidCents`, `quotedPriceCents`, `costCents`) are retained permanently in compliance with the Tanzanian Tax Administration Act (Sec. 35) and GDPR Art. 17(3)(b).
   - Full documentation at `docs/gdpr-retention.md`.

5. **Monitoring & Health Check**:
   - Live endpoint: `/api/health` returns HTTP 200 with DB ping latency, version, and uptime.
   - Sentry error logging integrated across client and server with email delivery exception alerting.

---

## 6. Pre-Launch Production Verification Checklist

| Phase / Requirement | Verification Item | Status |
| :--- | :--- | :--- |
| **B6.1 Transport & Headers** | HTTPS 301 redirect active in production | **PASS** |
| **B6.1 Transport & Headers** | HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff | **PASS** |
| **B6.2 Rate Limiting** | `/api/bookings` IP rate limit (10/hr) & honeypot | **PASS** |
| **B6.2 Rate Limiting** | `/api/contact` IP rate limit (5/15min) & honeypot | **PASS** |
| **B6.2 Rate Limiting** | `/login` brute-force limit (5/15min) & security alert to PLATFORM_ADMIN | **PASS** |
| **B6.2 Rate Limiting** | Media upload rate limit (30/hr) | **PASS** |
| **B6.3 Input & Output** | Magic byte validation for media uploads (rejects disguised files) | **PASS** |
| **B6.3 Input & Output** | HTML rich text sanitizer blocks `<script>`, `onerror`, `javascript:` | **PASS** |
| **B6.4 Auth & Isolation** | NextAuth secure cookies (`httpOnly`, `sameSite: "lax"`, `secure` in prod) | **PASS** |
| **B6.4 Auth & Isolation** | Public DTO serialization strips private financial metrics | **PASS** |
| **B6.5 Audit & GDPR** | Anonymize customer scrubs PII while preserving financial totals | **PASS** |
| **B6.5 Audit & GDPR** | `docs/gdpr-retention.md` accounting trade-off documented | **PASS** |
| **B6.5 Audit & GDPR** | Live `/privacy` and `/terms` pages accessible | **PASS** |
| **B6.5 Audit & GDPR** | Consent checkbox required on `/book` and `/contact` | **PASS** |
| **B6.6 Monitoring** | Sentry exception capture on email delivery failure | **PASS** |
| **B6.6 Monitoring** | `/api/health` returns healthy DB ping & latency | **PASS** |
| **Regression Suites** | TypeScript compiler clean (`npx tsc --noEmit`) | **PASS** |
| **Regression Suites** | B0, B4, B5 automated suites pass | **PASS** |
