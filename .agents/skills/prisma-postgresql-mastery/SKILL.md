---
name: prisma-postgresql-mastery
description: >-
  Expert guide for Prisma ORM with Neon Serverless PostgreSQL.
  Use when designing schemas, defining models, writing migrations, executing seeds,
  applying PostgreSQL check constraints, managing connection pooling, and writing type-safe high-performance queries.
---

# Prisma & Neon PostgreSQL Mastery Guide

This skill provides comprehensive patterns, best practices, and operational runbooks for integrating Prisma ORM with Neon Serverless PostgreSQL in Next.js applications.

---

## 1. Neon PostgreSQL Connection Architecture

Neon provides serverless PostgreSQL with autoscaling and connection pooling via PgBouncer.

### Connection String Configuration
In `.env`:
```env
# Direct connection (used for migrations and schema introspection)
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Pooled connection (used for application runtime, serverless functions, and API routes)
DATABASE_URL="postgresql://user:password@ep-sample-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=15"
```

### Prisma Client Singleton Pattern (Next.js App Router)
Prevent connection exhaustion during Hot Module Replacement (HMR) in development:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 2. Schema Modeling Standards

### Cents-Based Financial Integrity
Never store currency or monetary values in floating-point fields. Always store in integer cents or `Decimal`:
- `startingPriceCents Int` (e.g. `$120.00` -> `12000`)
- `costCents Int?`
- `profitCents Int?`
- `totalRevenueCents BigInt` (for monthly rollups)
- `commissionRate Decimal @db.Decimal(5, 4)` (e.g. `0.1500` for 15%)

### Text and JSON Columns
- Use `@db.Text` for unbounded strings (biographies, descriptions, notes, special requests).
- Use `Json` for structured variable documents (pricing tier breakdowns, highlight lists, social links).

### Multi-Operator Scalability
Always design models with an optional or required `operatorId String?` referencing `OperatorProfile`. Even when running single-operator in V1, all queries must be scoped to allow seamless multi-operator activation later.

---

## 3. Database Check Constraints (SQL Invariants)

Prisma does not natively define table check constraints in `schema.prisma`. Enforce critical invariants directly in PostgreSQL via migrations or idempotent SQL scripts:

### Booking Status Integrity Constraint
Enforce that a booking cannot be marked `CONFIRMED` unless `paymentStatus` is `PAID_IN_FULL`:

```sql
-- Custom migration SQL or initialization script
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_booking_confirmed_paid'
  ) THEN
    ALTER TABLE "Booking"
    ADD CONSTRAINT "chk_booking_confirmed_paid"
    CHECK ("status" != 'CONFIRMED' OR "paymentStatus" = 'PAID_IN_FULL');
  END IF;
END $$;
```

---

## 4. Idempotent Seeding Best Practices

1. **Upsert Everywhere**: Always use `prisma.model.upsert({ where: { slug / key / email }, update: {...}, create: {...} })` to make seeds safely re-runnable without duplicates.
2. **Password Hashing**: Always hash passwords using `bcrypt.hash(password, 10)` before storing in `passwordHash`.
3. **Relation Mapping**: Create parent models (e.g. `OperatorProfile`, `TourCategory`) first, store their generated IDs in an in-memory map, and reference them when creating child models (`Tour`, `AdminUser`, `Route`).
4. **Clean Cascade Handling**: Delete dependent join records (e.g. `TourImage`, `Route`) cleanly before re-populating during dev seed iterations.

---

## 5. Selective Query Projection (Confidential Data Isolation)

Ensure sensitive operator financials (`costCents`, `profitCents`, `paymentInstructions`, `operatorNotes`) are NEVER exposed to the public frontend:

```typescript
// Public Tourist Projection
export const publicTourSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  description: true,
  durationText: true,
  startingPriceCents: true,
  currency: true,
  highlights: true,
  inclusions: true,
  exclusions: true,
  isFeatured: true,
  images: {
    select: { url: true, alt: true, isHero: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
};

// Admin Private Projection
export const adminTourSelect = {
  ...publicTourSelect,
  pricingTiers: true, // Includes private cost & profit breakdowns
  operatorId: true,
  createdAt: true,
  updatedAt: true,
};
```

---

## 6. Migration Runbook

1. **Local / Dev Schema Changes**:
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```
2. **Generate Type-safe Client**:
   ```bash
   npx prisma generate
   ```
3. **Execute Seed**:
   ```bash
   npx prisma db seed
   ```
4. **Inspect Database via GUI**:
   ```bash
   npx prisma studio
   ```
