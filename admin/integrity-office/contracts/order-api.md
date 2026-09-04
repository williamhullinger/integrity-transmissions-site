# Integrity Office API Boundary

This contract describes the private Integrity Office API. Every staff-data route requires a validated Auth0 access token for the dedicated Integrity Office audience. `GET /api/config` returns only the non-secret Auth0 browser configuration needed to begin sign-in. Customer-facing storefront functions are separate and may not call staff endpoints.

## Roles

| Role | Access |
|---|---|
| `viewer` | Read orders, customers, fulfillment, core status, and financial summaries without wholesale details |
| `operations` | Viewer access plus fitment, supplier, fulfillment, notes, freight and core workflow changes |
| `finance` | Viewer access plus refund classification, reconciliation, wholesale costs, projected margin, and ledger reports |
| `administrator` | All access plus staff roles, promotion approval, and system-exception recovery |

## Commands

| Method and path | Purpose | Required role |
|---|---|---|
| `GET /api/config` | Return non-secret Auth0 browser configuration | public bootstrap |
| `GET /api/session` | Return the database-authorized staff principal and roles | authenticated staff |
| `GET /api/dashboard` | Return current workload, collection, refund, dispute, freight, and system-exception totals | viewer |
| `GET /api/orders` | Filtered, paginated order list | viewer |
| `GET /api/orders/:id` | Order, snapshots, timeline, customer, fulfillment, and core detail | viewer |
| `POST /api/orders/:id/fitment-review` | Record VIN/application evidence and atomically approve or reject fitment | operations |
| `POST /api/orders/:id/supplier-order` | Record the supplier order reference and advance fulfillment | operations |
| `POST /api/orders/:id/shipment` | Record carrier/tracking evidence and advance fulfillment | operations |
| `POST /api/orders/:id/fulfillment-transition` | Apply a valid fulfillment state transition | operations |
| `POST /api/orders/:id/core-transition` | Apply a valid core state transition; refund completion and forfeiture require finance | operations / finance |
| `POST /api/orders/:id/refunds/:stripeRefundId/classification` | Allocate a confirmed Stripe refund and post its balanced journal entry | finance |
| `POST /api/orders/:id/notes` | Add an append-only operational note | operations |
| `GET /api/reports/finance` | Period income activity plus cumulative asset/liability balances through period end | finance |
| `POST /api/reconciliation` | Compare paid reman Checkout Sessions with Office payments and persist the run | finance |
| `GET /api/freight-exceptions` | Customer recovery queue for unavailable freight rates | operations |
| `POST /api/freight-exceptions/:id` | Assign, schedule, resolve or convert a freight request | operations |
| `GET /api/promotions` | Promotion rules, status, limits and redemption totals | finance |
| `POST /api/promotions` | Create constrained promotion | administrator |
| `POST /api/promotions/:id/approve` | Approve a promotion for customer use | administrator |
| `POST /api/promotions/:id/disable` | Disable a promotion with a permanent reason | administrator |
| `GET /api/audit` | Immutable security and business-change history | administrator |
| `GET /api/staff` | List staff identities, active roles and status | administrator |
| `GET /api/staff/assignees` | List active operations staff eligible for freight assignment | operations |
| `POST /api/staff` | Create an allowlisted staff identity with least-privilege roles | administrator |
| `POST /api/staff/:id/access` | Grant/revoke roles or enable/disable a staff identity | administrator |
| `GET /api/system-exceptions` | List payload-redacted Stripe and notification delivery failures | administrator |
| `POST /api/system-exceptions/requeue` | Requeue a failed delivery after recording a recovery reason | administrator |

## Command requirements

Every modifying command must include:

- `Idempotency-Key`
- the order's current `version` when the command changes an order
- a permitted state transition
- a reason for refunds, cancellations, rejected cores, manual price changes, or role changes

The server writes the business change, status history, audit event, and outbox event in one PostgreSQL transaction. External Stripe/notification calls happen from the outbox worker and must be safe to retry.

Promotion creation and approval must be performed by different administrator identities. The database enforces this even if a client bypasses the Office interface. Staff members cannot change their own access, and the last active administrator cannot be removed or disabled.

Refunds remain Stripe-authoritative. A successful Stripe refund event creates an unclassified finance task. A finance user must allocate the exact refund total among transmission revenue, freight revenue, sales-tax liability, core-deposit liability, and other expense before Office posts it. Core status cannot advance to `refunded` without a successful Stripe refund allocated to the full recorded core amount.

## Internal storefront ingestion

`POST /.netlify/functions/internal-ingest` accepts the server-verified checkout snapshot from the public storefront. It is not a browser API. The storefront signs the exact request body and a five-minute timestamp with `OFFICE_INTERNAL_INGEST_SECRET`. Integrity Office validates that HMAC before creating the customer, vehicle, immutable quote, order, Checkout Session link, initial workflow history, and audit record in one transaction. The immutable quote also stores the accepted policy-bundle version, SHA-256 fingerprint, public archive URL, acceptance timestamp, clickwrap method, and separate affirmative purchase-terms, core/warranty, and electronic-record consent flags.

`POST /.netlify/functions/internal-freight` accepts a separately signed callback request after automatic freight retries are exhausted. It idempotently creates one `freight_quote_requests` queue record keyed by the customer-visible lead reference. The browser cannot call or sign this endpoint directly; the public `reman-freight-assistance` function validates and forwards the request while the existing Netlify form submission remains a redundant notification channel.

`POST /.netlify/functions/internal-promotion` validates an approved code against its schedule, global limit, per-customer limit, immutable server-side price and minimum post-discount margin. It reserves capacity against the checkout attempt before Stripe Checkout is created. Order ingestion consumes that reservation, a successful Stripe event applies it, and an expired or failed Checkout Session releases it. Promotion input is shown to customers only after this signed Office connection is configured.

Stripe webhooks are received at `POST /.netlify/functions/stripe-webhook`. A valid Stripe signature is required. Each event ID is persisted exactly once before the endpoint acknowledges it; a scheduled worker claims events with leases, applies payment state and journal entries transactionally, retries transient failures, and dead-letters repeated failures for staff review. For dispute events, the worker retrieves the current Stripe Dispute and its authoritative balance transactions before applying state. This prevents out-of-order webhooks from reopening a resolved dispute. Dispute evidence stays in Stripe; Office stores status, reason, evidence deadline and the withdrawal or reinstatement accounting entries.

The scheduled notification worker claims `notification_outbox` records with leases and signs the exact JSON body with `OFFICE_NOTIFICATION_WEBHOOK_SECRET`. Receivers validate `X-Office-Notification-Timestamp` and `X-Office-Notification-Signature` before forwarding operational alerts. Failed deliveries use bounded exponential retries; ten failed attempts are surfaced as an Office exception.

Notification delivery is at least once. Receivers must persist and deduplicate the notification `id` before performing side effects; a successful HTTP response confirms that specific delivery. Redirects are never followed, and a worker may finalize or reschedule a delivery only while it owns an unexpired lease.

The administrator system-health queue never returns stored webhook or notification payloads. Manual recovery resets the automated-attempt counter, increments a permanent recovery counter and writes the actor, reason and affected event identifier to the audit log.

## Customer-data rule

Customer-facing responses may include retail prices, core deposit, tax, freight, availability, warranty, and application information. They may never include ACE credentials, wholesale prices, raw supplier responses, internal margin, staff notes, or risk-review details.
