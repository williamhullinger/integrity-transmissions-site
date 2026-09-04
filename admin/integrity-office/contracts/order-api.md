# Integrity Office API Boundary

This contract describes the first private API surface. All routes require a validated Auth0 access token for the dedicated Integrity Office audience. Customer-facing storefront functions are separate and may not call these endpoints.

## Roles

| Role | Access |
|---|---|
| `viewer` | Read orders, customers, fulfillment, core status, and financial summaries without wholesale details |
| `operations` | Viewer access plus fitment, supplier, fulfillment, notes, documents, and core workflow changes |
| `finance` | Viewer access plus refunds, tax, reconciliation, wholesale costs, margin, and exports |
| `administrator` | All access plus staff roles, workflow settings, and promotion approval |

## Commands

| Method and path | Purpose | Required role |
|---|---|---|
| `GET /api/orders` | Filtered, paginated order list | viewer |
| `GET /api/orders/:id` | Order, snapshots, timeline, customer, fulfillment, and core detail | viewer |
| `POST /api/orders/:id/fitment-approval` | Record VIN/application approval | operations |
| `POST /api/orders/:id/fulfillment-transition` | Apply a valid fulfillment state transition | operations |
| `POST /api/orders/:id/core-transition` | Apply a valid core state transition | operations |
| `POST /api/orders/:id/refunds` | Request/refund against Stripe with an idempotency key | finance |
| `POST /api/orders/:id/notes` | Add an append-only operational note | operations |
| `POST /api/orders/:id/documents` | Create a private upload intent | operations |
| `GET /api/reports/order-margin` | Revenue, liability, cost, fee, refund, and margin report | finance |
| `GET /api/reports/tax` | Stripe tax reconciliation by jurisdiction/period | finance |
| `GET /api/reconciliation` | Compare paid reman Checkout Sessions with Office payment records | finance |
| `GET /api/freight-exceptions` | Customer recovery queue for unavailable freight rates | operations |
| `POST /api/freight-exceptions/:id` | Assign, schedule, resolve or convert a freight request | operations |
| `GET /api/promotions` | Promotion rules, status, limits and redemption totals | finance |
| `POST /api/promotions` | Create constrained promotion | administrator |
| `POST /api/promotions/:id/approve` | Approve a promotion for customer use | administrator |
| `POST /api/promotions/:id/disable` | Disable a promotion with a permanent reason | administrator |
| `GET /api/audit` | Immutable security and business-change history | administrator |
| `POST /api/staff/:id/roles` | Change staff access | administrator |

## Command requirements

Every modifying command must include:

- `Idempotency-Key`
- the order's current `version` when the command changes an order
- a permitted state transition
- a reason for refunds, cancellations, rejected cores, manual price changes, or role changes

The server writes the business change, status history, audit event, and outbox event in one PostgreSQL transaction. External Stripe/notification calls happen from the outbox worker and must be safe to retry.

## Internal storefront ingestion

`POST /.netlify/functions/internal-ingest` accepts the server-verified checkout snapshot from the public storefront. It is not a browser API. The storefront signs the exact request body and a five-minute timestamp with `OFFICE_INTERNAL_INGEST_SECRET`. Integrity Office validates that HMAC before creating the customer, vehicle, immutable quote, order, Checkout Session link, initial workflow history, and audit record in one transaction.

`POST /.netlify/functions/internal-freight` accepts a separately signed callback request after automatic freight retries are exhausted. It idempotently creates one `freight_quote_requests` queue record keyed by the customer-visible lead reference. The browser cannot call or sign this endpoint directly; the public `reman-freight-assistance` function validates and forwards the request while the existing Netlify form submission remains a redundant notification channel.

`POST /.netlify/functions/internal-promotion` validates an approved code against its schedule, global limit, per-customer limit, immutable server-side price and minimum post-discount margin. It reserves capacity against the checkout attempt before Stripe Checkout is created. Order ingestion consumes that reservation, a successful Stripe event applies it, and an expired or failed Checkout Session releases it. Promotion input is shown to customers only after this signed Office connection is configured.

Stripe webhooks are received at `POST /.netlify/functions/stripe-webhook`. A valid Stripe signature is required. Each event ID is persisted exactly once before the endpoint acknowledges it; a scheduled worker claims events with leases, applies payment state and journal entries transactionally, retries transient failures, and dead-letters repeated failures for staff review.

## Customer-data rule

Customer-facing responses may include retail prices, core deposit, tax, freight, availability, warranty, and application information. They may never include ACE credentials, wholesale prices, raw supplier responses, internal margin, staff notes, or risk-review details.
