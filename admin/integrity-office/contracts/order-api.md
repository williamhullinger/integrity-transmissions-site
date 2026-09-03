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
| `POST /api/promotions` | Create constrained promotion | administrator |
| `POST /api/staff/:id/roles` | Change staff access | administrator |

## Command requirements

Every modifying command must include:

- `Idempotency-Key`
- the order's current `version`
- a permitted state transition
- a reason for refunds, cancellations, rejected cores, manual price changes, or role changes

The server writes the business change, status history, audit event, and outbox event in one PostgreSQL transaction. External Stripe/notification calls happen from the outbox worker and must be safe to retry.

## Customer-data rule

Customer-facing responses may include retail prices, core deposit, tax, freight, availability, warranty, and application information. They may never include ACE credentials, wholesale prices, raw supplier responses, internal margin, staff notes, or risk-review details.
