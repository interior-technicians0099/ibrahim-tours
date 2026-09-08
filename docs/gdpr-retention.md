# GDPR Customer Data Anonymization & Financial Retention Policy

## Overview & Legal Basis
Under the EU General Data Protection Regulation (GDPR, Article 17 — *Right to Erasure*) and the Tanzanian Personal Data Protection Act (2022), data subjects have the right to request permanent deletion of their personal identifiable information (PII).

Simultaneously, under the **Tanzanian Tax Administration Act (2015)** and Zanzibar Revenue Authority (TRA) commercial tourism licensing mandates, tour operators and platforms are legally obligated to maintain accurate financial accounting records for a minimum statutory period of **5 years**.

To fulfill both privacy rights and statutory tax obligations without conflict, Ibrahim Tours Zanzibar implements **GDPR Pseudonymization & Financial Record Preservation**.

---

## 1. How the Anonymization Engine Operates
When a Platform Administrator executes an **Anonymize Customer** action (`POST /api/platform/bookings/[id]/anonymize`):

### Fields Permanently Scrubbed & Replaced:
| Original Field | Anonymized Value | Purpose |
| :--- | :--- | :--- |
| `customerName` | `DELETED-<bookingId>` | Erases full personal name |
| `customerEmail` | `deleted-<shortId>@anonymized.local` | Invalidates email contact |
| `customerPhone` | `DELETED-<shortId>` | Removes phone & WhatsApp numbers |
| `customerCountry` | `DELETED` | Removes geographic identifier |
| `pickupLocation` | `DELETED` | Erases hotel/villa address |
| `dropoffLocation` | `DELETED` | Erases drop-off address |
| `specialRequests` | `DELETED` | Erases dietary/medical/child notes |

### Financial Fields Strictly Preserved:
| Preserved Field | Reason for Preservation |
| :--- | :--- |
| `referenceCode` | Unique identifier for accounting, tax verification, and receipts |
| `serviceType` & `tier` | Necessary for operator performance and vehicle service logs |
| `bookingDate` | Identifies the tax month and settlement period |
| `quotedPriceCents` | Gross agreed contract price for auditing |
| `amountPaidCents` | Actual revenue collected (M-Pesa / Cash / Bank) |
| `costCents` | Direct operating cost (park permits, marine conservation fees) |
| `profitCents` | Gross commercial operating margin |
| `commissionRate` | Contracted platform revenue share |
| `commissionAmountCents` | Platform commission payout |
| `status` & `paymentStatus` | Confirms lifecycle completion and ledger balancing |

---

## 2. Why Financial Fields Must Be Preserved (The Accounting Trade-Off)
If booking financial totals were deleted or nulled out upon a customer erasure request:
1. Historical **Monthly Settlements** (`MonthlySettlement`) would become unbalanced and contradict closed bank payouts.
2. Operator commissions already disbursed to Ibrahim Mohamed or the platform team would show mathematical discrepancies.
3. Tax filings submitted to the Zanzibar Revenue Authority (TRA) would not match database totals during statutory audits.

By converting the customer entity into an anonymous pseudonym (`DELETED-<bookingId>`), the booking becomes completely disassociated from any living individual, achieving compliance with GDPR Recital 26 (*principles of data protection do not apply to anonymous information*) while protecting accounting ledger integrity.

---

## 3. Audit Trail & Verification
Every execution of this action is permanently recorded in the immutable `AuditLog` table with:
- `action`: `GDPR_ANONYMIZE_CUSTOMER`
- `entityType`: `Booking`
- `entityId`: `<bookingId>`
- `userId`: ID of the Platform Administrator who authorized the deletion
- `details.reason`: `Right to erasure request (GDPR Art. 17 / Tanzanian PDPA)`
- `details.timestamp`: ISO timestamp
- `ipAddress`: Client IP address of the administrator
