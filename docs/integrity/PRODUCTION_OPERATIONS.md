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

Optional measurement configuration:

- `GA4_MEASUREMENT_ID`: optional Google Analytics 4 stream override; production defaults to the public Integrity stream `G-7395FMBNE9`
- `MICROSOFT_CLARITY_PROJECT_ID`: Microsoft Clarity project ID

The public `/api/analytics-config` endpoint exposes only validated public project identifiers. Analytics and Clarity remain disabled until the visitor grants optional analytics consent. VINs, customer contact details, delivery addresses, payment details, free-form messages, and full order identifiers are excluded from the event allowlist.

## Analytics activation and verification

1. The Integrity-owned GA4 property and `Integrity Production Website` data stream are already created for `https://integritydrivetrain.com`.
2. Production uses `G-7395FMBNE9` by default; use `GA4_MEASUREMENT_ID` only when staging needs a different stream.
3. Create or select an Integrity-owned Microsoft Clarity project for the production domain.
4. Add its project ID to Netlify as `MICROSOFT_CLARITY_PROJECT_ID` for Production and Deploy Previews.
5. Trigger a production deploy, then confirm `/api/analytics-config` returns the GA4 ID and, after Clarity activation, the Clarity project ID—never a secret.
6. In a private browser session, allow analytics and confirm page views plus `view_product_category`, `buying_guide_link_click`, `quote_cta_click`, `quote_form_start`, `generate_lead`, `freight_quote_success`, `checkout_redirect`, and `order_payment_confirmed` in the vendor real-time/debug views.
7. Decline analytics in a separate session and confirm no Google Analytics or Clarity request loads while quote, phone, text, and checkout functions remain usable.
8. Mark `generate_lead`, `freight_quote_success`, `checkout_redirect`, and `order_payment_confirmed` as key business events; do not mark page views or scroll depth as conversions.

Rotate `REMAN_SIGNING_SECRET` independently of ACE credentials. A rotation invalidates existing browser selections, so deploy it during a controlled window and verify a fresh VIN-to-checkout path afterward.

## Current administrative boundary

Integrity Office is implemented as a separate private application in `admin/integrity-office`. It includes database-backed staff authentication and roles, order and exception workflows, audit history, durable Stripe event processing, notification recovery, promotion controls and a balanced commerce subledger. It is intentionally not activated until managed PostgreSQL, Auth0 MFA, private runtime services, backups and acceptance tests exist. The public build excludes all Office files, and Stripe Dashboard remains the secure interim authority for payments, refunds, tax, receipts and disputes.
