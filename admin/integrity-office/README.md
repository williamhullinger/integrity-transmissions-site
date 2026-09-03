# Integrity Office

Integrity Office is the planned private operations application for remanufactured-transmission orders. It is intentionally **not** part of the public Netlify site and must not be deployed until staff authentication and a managed PostgreSQL database are configured.

## Deployment boundary

- Public storefront: `integritydrivetrain.com`
- Private operations app: `office.integritydrivetrain.com`
- Authentication: a dedicated Auth0 application and API audience with MFA for administrators
- Database: managed PostgreSQL with encrypted connections, automated backups, and point-in-time recovery
- Payments: Stripe remains the payment processor and source for card/payment events
- Supplier ordering: manual staff approval after payment and fitment review; the public checkout never places an ACE order automatically
- ShopOps: future event/API integration only; it must not share the Integrity Office database

## Non-negotiable controls

1. Never store card numbers, Stripe secret keys, ACE credentials, or passwords in the database.
2. Treat the core deposit and collected sales tax as liabilities, not sales revenue.
3. Require an immutable audit record for status, refund, core, price, supplier-cost, and role changes.
4. Verify Stripe webhook signatures and store each Stripe event ID exactly once before processing it.
5. Keep wholesale cost and margin fields out of all customer-facing API responses.
6. Require administrator approval for refunds, promotions below the configured margin floor, and role changes.
7. Do not hard-delete orders, financial entries, payment records, or audit events.

## Included foundation

- `db/001_initial.sql`: initial PostgreSQL schema with customer-bound foreign keys, immutable snapshots, role history, promotion reservations, margin enforcement, fitment/documents, idempotent commands, durable event/outbox leases, and balanced double-entry journals.
- `domain/order-state.mjs`: enforceable payment, fulfillment, core-return, promotion, margin, and journal rules.
- `test/order-state.test.mjs`: dependency-free tests for allowed and forbidden transitions, promotions, margin floors, and accounting treatment.
- `test/schema-controls.test.mjs`: regression checks for the non-negotiable database controls.
- `contracts/order-api.md`: first API boundary for the eventual office application.

## Production activation checklist

1. Provision managed PostgreSQL and create separate production/staging databases.
2. Create the dedicated Auth0 staff application and API; require MFA for administrator roles.
3. Store credentials in the office host's secret manager, never the repository or browser storage.
4. Apply migrations with a dedicated migration identity; the runtime identity must not own the schema.
5. Add a durable Stripe webhook consumer that writes `webhook_events` and `notification_outbox` in one transaction.
6. Backfill existing Stripe Checkout Sessions as read-only historical orders and reconcile totals.
7. Complete security review, role tests, backup-restore test, and staging user acceptance testing.
8. Only then point `office.integritydrivetrain.com` at the application.

Until this checklist is complete, Stripe Dashboard is the secure operational source for payments, refunds, tax, and customer receipts.
