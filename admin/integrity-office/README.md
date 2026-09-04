# Integrity Office

Integrity Office is the private operations application for Integrity Transmission & Drivetrain's remanufactured-transmission storefront. It is built and deployed separately from the public website.

## Current application

The implemented staff application includes:

- Auth0 access-token validation with an exact issuer and audience, RS256-only signatures, short token age, required MFA evidence, and a database allowlist
- PostgreSQL-backed staff provisioning, disable controls, revocable role history, last-administrator protection, and viewer, operations, finance, and administrator access
- Current operating metrics and workload totals
- Searchable and paginated orders with customer, vehicle, payment, fulfillment, and core-return status
- Structured fitment decisions, supplier-order references and shipment evidence with atomic state changes and optimistic version checks
- Core-return deadlines, inspection outcomes, verified-refund gates and forfeiture accounting
- Append-only operational notes and audit events
- HMAC-authenticated freight-recovery intake with idempotent queueing, assignment, follow-up, resolution, and conversion tracking
- Promotion creation, enforced second-administrator approval, disable controls, signed checkout reservations, redemption limits, and minimum-margin enforcement
- Quote-level supplier cost and margin visibility plus double-entry reporting for revenue, tax liability, refundable core liability, discounts, classified refunds, Stripe processing fees and dispute balance movements
- Read-only Stripe-to-Office payment reconciliation
- Period revenue/expense activity, cumulative tax/core liabilities, Stripe fees and immutable projected order margin, with supplier invoices and bank settlement explicitly outside the Office subledger boundary
- HMAC-authenticated storefront checkout ingestion
- Signature-verified, database-deduplicated Stripe webhooks
- Stripe-authoritative dispute status, evidence deadlines and idempotent withdrawal/reinstatement accounting without storing evidence contents
- Leased background event processing with bounded retries and a dead-letter state
- HMAC-signed notification delivery with leases, bounded retries, redacted dead-letter visibility and audited manual recovery
- A responsive, keyboard-accessible staff interface with no synthetic production records

## Deployment boundary

| Surface | Host | Authority |
|---|---|---|
| Public storefront | `integritydrivetrain.com` | VIN lookup, verified pricing, freight and Stripe Checkout |
| Private Office | `office.integritydrivetrain.com` | Staff workflows, order records, accounting and audit history |
| Payments | Stripe | Card payments, refunds, tax calculations and payment events |
| Supplier | ACE | Fitment, inventory, wholesale price and freight rates |

The public Netlify build uses the repository-root `netlify.toml` and never includes `admin/`. The Office site uses `admin/integrity-office/netlify.toml` and publishes only the compiled Office interface and Office functions. Configure the Office Netlify project's package directory as `/admin/integrity-office` and leave its base directory at the repository root so Netlify selects the private configuration without changing the public deployment.

## Source layout

- `db/001_initial.sql` — orders, immutable quotes, customers, vehicles, staff roles, promotions, payment records, double-entry journals, durable webhooks, outbox and audit controls
- `db/002_office_runtime.sql` — promotion reservations, immutable retail discount snapshots, freight-recovery queue, reconciliation history and runtime indexes
- `db/003_operational_controls.sql` — separation of duties, supplier-record integrity, Stripe session timestamps, refund allocations, payment-dispute tracking, access-revocation history, retry recovery counters and accounting controls
- `domain/order-state.mjs` — enforceable payment, fulfillment, core, promotion, margin and journal rules
- `server/` — authentication, authorization, HTTP validation, database repositories, Office APIs, checkout ingestion, Stripe reconciliation and event processing
- `functions/` — isolated Netlify entry points for the staff API, signed internal intake, Stripe webhooks, scheduled event processing and signed notification delivery
- `web/` — private staff interface source and restrictive response policies
- `scripts/build-office.mjs` — deterministic private bundle build
- `test/` — security, role, idempotency, accounting, schema, integration and build-boundary tests

## Non-negotiable controls

1. Card numbers, passwords, Stripe keys, ACE credentials and database credentials never enter source code, browser storage, the database or application logs.
2. Staff authorization comes from active database role grants, not from hidden navigation or an unverified browser claim.
3. Administrators must use MFA. Passkeys or authenticator apps are preferred over SMS.
4. The core deposit and collected sales tax remain liabilities until the applicable obligation is resolved.
5. Status, payment, journal, quote, fitment, document and audit records are append-only where business history must be preserved.
6. Every modifying staff command uses a durable idempotency key and records the actor, reason and request reference.
7. Stripe events are acknowledged only after signature verification and durable database insertion.
8. Wholesale cost and margin fields never appear in customer-facing responses.
9. Supplier ordering still requires staff fitment approval; a public checkout never places an ACE order automatically.
10. Production and staging use different databases, Auth0 applications, Stripe keys and webhook secrets.
11. Refunds are initiated in Stripe; Office records only confirmed Stripe events and posts their finance-approved allocation.
12. Dispute evidence and responses remain in Stripe; Office refreshes current dispute state and records only status, deadlines and authoritative balance movements.

## Build and validation

`npm run build:office` creates the private bundle in `dist/integrity-office`.

`npm run test:office` validates domain rules, schema controls, authentication, origin checks, API roles, idempotency, signed checkout ingestion, webhook handling, reconciliation and private bundle policies.

The root `npm test` includes the Office suite while continuing to validate the public storefront independently.

## Activation

Do not publish the Office site until every item in `docs/ACTIVATION.md` is complete. Until then, Stripe Dashboard remains the operational authority for payments, refunds, tax and receipts.
