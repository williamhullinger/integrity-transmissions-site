# Reman Commerce Delivery Status

Updated: September 3, 2026

The customer storefront and live Stripe Checkout are deployed. Current operating procedures live in `docs/integrity/PRODUCTION_OPERATIONS.md`; the private-office activation gate lives in `admin/integrity-office/README.md`.

## Delivered

- Server-only ACE VIN/application, package, inventory, availability, build-time, and freight lookups
- Retail transmission price recalculated as current ACE wholesale plus exactly $500
- Separate transmission, freight, refundable core deposit, and Stripe Tax line items
- VIN-linked package, warranty, installer, programming, core, and delivery selections
- Fresh catalog and freight revalidation before Stripe Checkout
- Stable checkout idempotency for safe retries
- Automatic bounded freight retries with a customer callback path when ACE cannot return a valid rate
- Stripe-signed payment webhook, customer order-status page, invoice link, and manual supplier-order gate
- Seven searchable reman family pages plus technical guide cross-links

Checkout never invents a rate or accepts a client-supplied price. ACE credentials, wholesale values, raw supplier responses, and signing material never enter the browser.

## Operational limits

- ACE remains a private, session-authenticated supplier portal rather than a documented public API. Supplier ordering stays manual.
- Freight is available only when ACE returns a positive current rate. Customers can request a callback after automatic retries.
- Missouri is the currently active Stripe Tax registration. Stripe calculates only jurisdictions where Integrity is registered.
- Staff must confirm a real successful-order notification while reconciling the payment directly in Stripe.
- Approved exact-unit product photography is still required; generic parts must not be represented as the precise unit for sale.

## Integrity Office gate

The repository includes a private data and domain foundation for orders, status history, promotions, customer limits, margin floors, fitment review, documents, double-entry accounting, idempotent commands, durable Stripe events, notification outbox delivery, role history, and immutable audit records.

Do not deploy the Office until all of the following are complete:

1. Managed PostgreSQL with separate staging and production databases, encrypted connections, automated backups, and a successful restore test.
2. Dedicated Auth0 application/API with MFA and tested viewer, operations, finance, and administrator roles.
3. Transactional API and outbox worker using a non-owner runtime database role.
4. Durable Stripe webhook cutover and historical Stripe order reconciliation.
5. Security, concurrency, promotion, refund, backup, and staff acceptance tests.

Until then, Stripe Dashboard is the authority for payments, refunds, tax, receipts, and disputes.
