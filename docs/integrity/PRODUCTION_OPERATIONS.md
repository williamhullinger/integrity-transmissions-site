# Integrity Reman Commerce — Production Operations

This is the current source of truth for the public remanufactured-transmission storefront.

## Customer order flow

1. Customer searches by transmission family or submits a 17-character VIN.
2. The server signs in to ACE with protected Netlify environment variables and returns a scrubbed catalog response.
3. The server displays current eligible packages, inventory/build status, warranty details, and retail price.
4. Retail price is the current ACE wholesale package cost plus exactly $500. Missing or malformed wholesale price fails closed and cannot be purchased.
5. Customer enters delivery details; the server obtains the current ACE freight quote. Transient errors and empty-rate responses receive bounded automatic retries. One-way and prepaid core-return selections are priced separately.
6. Before Stripe Checkout opens, the server repeats the supplier catalog and freight lookups and compares the new values with the customer's screen.
7. Stripe collects transmission price, core deposit, freight, and automatic sales tax. No wholesale price or supplier credential enters the browser or Stripe receipt.
8. A completed payment enters paid/risk/fitment review. It does not automatically place an ACE supplier order.
9. Staff confirms payment, VIN fitment, availability, and delivery details before placing the supplier order manually.
10. Core deposit is refunded only after the correct core is returned within the stated period and accepted.

## Live systems and sources of truth

| Concern | Current source of truth |
|---|---|
| Card payment, refunds, receipts | Stripe Dashboard |
| Sales-tax calculation and collection | Stripe Tax |
| Transmission catalog and freight | Live ACE account lookup through server-only functions |
| Customer form submissions | Netlify Forms |
| Public code and release history | GitHub `main` |
| Public deployment | Netlify production site |
| Supplier order | ACE portal, placed manually by authorized staff |

## Daily paid-order checklist

1. Confirm Stripe Checkout is `paid`; do not act on `processing`.
2. Review Stripe risk signals and confirm the customer contact and shipping address.
3. Reconfirm VIN/application, selected package, availability, wholesale price, core, and freight in ACE.
4. Contact the customer before ordering if any fitment, availability, price, delivery, installer, programming, or core detail changed.
5. Place the ACE order only after the review is complete.
6. Record the supplier order reference and send the customer confirmed timing/tracking when available.
7. Track the 30-day core deadline and refund only after supplier acceptance.

## Incident rules

- Supplier or price lookup failure: stop online checkout and offer assisted service.
- Freight lookup failure: retry automatically within a bounded window. If no valid rate arrives, stop checkout, preserve the request reference, confirm the customer's callback number, and route the request for personal follow-up. Never guess or invent freight.
- Unit becomes unavailable after payment: contact customer and issue a full refund to the original method.
- Webhook notification fails: the payment still exists in Stripe; review Stripe payments manually.
- Wrong or uncertain fitment: do not place the supplier order.
- Suspected credential exposure: rotate the affected Netlify secret and supplier/Stripe credential immediately, then redeploy.

## Required production secrets

- `ACE_USERNAME` and `ACE_PASSWORD`: supplier portal credentials
- `REMAN_SIGNING_SECRET`: dedicated high-entropy signing material for public selection and freight tokens
- `STRIPE_RESTRICTED_KEY`: restricted live Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Stripe signature-verification secret

Rotate `REMAN_SIGNING_SECRET` independently of ACE credentials. A rotation invalidates existing browser selections, so deploy it during a controlled window and verify a fresh VIN-to-checkout path afterward.

## Current administrative boundary

The public site has no custom staff dashboard. That is deliberate: a safe order office requires durable database-backed webhook processing, staff authentication, role permissions, audit logs, and backups. The foundation in `admin/integrity-office` now defines durable event leases, idempotent commands, promotion reservations and margin floors, fitment records, protected documents, role history, immutable operational records, and balanced double-entry journals. It remains undeployed until managed PostgreSQL, Auth0 MFA, runtime services, backups, and acceptance tests exist. Stripe Dashboard is the secure interim console.
