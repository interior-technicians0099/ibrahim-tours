---
name: nextjs-fullstack-architecture
description: >-
  Best practices for full-stack Next.js App Router applications with TypeScript, Server Actions,
  Route Handlers, Zod validation, and role-based access control (RBAC). Use when implementing secure API endpoints,
  separating public vs private tourist/operator DTOs, handling database mutations, and managing admin sessions.
---

# Next.js Full-Stack Architecture Guide

Comprehensive patterns for building secure, high-performance, full-stack Next.js applications with App Router, TypeScript, and Prisma.

---

## 1. Data Flow & Boundary Isolation

```
[ Tourist Web Client ]   [ Admin/Operator Portal ]
         |                           |
    (Public DTO)               (Privileged DTO)
         |                           |
         v                           v
  [ Route Handlers / Server Actions (Zod Validation) ]
                     |
           [ Business Services ]
                     |
            [ Prisma ORM Client ]
                     |
       [ Neon PostgreSQL Database ]
```

### Critical Rule: Zero Leakage of Cost & Profit
Tourist-facing endpoints (tours list, tour detail, booking quote) must **never** receive raw database objects. They must pass through a strict Public DTO mapper:

```typescript
// src/lib/dto/tour.dto.ts
import { z } from 'zod';

export const PublicTourSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  shortDescription: z.string().nullable(),
  description: z.string(),
  durationText: z.string(),
  startingPriceCents: z.number().int(),
  currency: z.string(),
  highlights: z.array(z.string()),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()).optional(),
  isFeatured: z.boolean(),
  images: z.array(
    z.object({
      url: z.string(),
      alt: z.string().nullable(),
      isHero: z.boolean(),
    })
  ),
});

export type PublicTourDTO = z.infer<typeof PublicTourSchema>;
```

---

## 2. Server Action & Mutation Safety

1. **Always Validate Input with Zod**:
   Never trust client payloads. Validate types, string lengths, and date formats.
2. **Execute in Database Transactions (`prisma.$transaction`)**:
   Wrap multi-entity writes (e.g. recording a payment + updating booking status + writing audit log) in atomic transactions.
3. **Audit Logging**:
   Log all state changes to `AuditLog` with the acting user's ID, action name, target entity, and IP address.

---

## 3. Role-Based Access Control (RBAC)

Two distinct administrative roles:
1. `PLATFORM_ADMIN`: Global oversight. Manages platform settings, configures commission rates, reviews all operators, triggers monthly settlements.
2. `OPERATOR`: Scoped strictly to `operatorId`. Views own bookings, records received payments, adds operator notes, updates tour costs.
