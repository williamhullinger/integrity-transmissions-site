# ACE Reman Integration

Updated: September 2, 2026

## Implemented Architecture

Integrity uses one private server-side ACE connector with two controlled presentations:

1. `/staff/ace-quote` shows authorized staff the VIN matches, ACE account pricing, suggested retail, included items, warranty choices, stock warnings, per-upgrade availability and the Integrity selling price.
2. `/reman-transmissions` gives customers a separate allowlisted catalog response. It shows only the decoded vehicle, transmission application, offered upgrade levels, included-item descriptions, current Integrity price, refundable core deposit, stock/build-time status and customer-safe warnings.

The public page never receives the ACE username, password, session cookie, supplier account level, wholesale cost, suggested retail, vendor name, raw response or internal part UID. A regression test fails if common wholesale or internal-account labels appear in the public payload.

The current customer pricing rule is exact:

`Integrity transmission price = current ACE wholesale package cost + $500.00`

Freight, the refundable core deposit and applicable sales tax remain separate. No rounding or ACE suggested-retail floor is applied.

## Customer Flow

1. Customer enters a valid 17-character VIN.
2. The Netlify function signs in to ACE on the server and retrieves the current application.
3. Each offered Base/1000/2000/3000 upgrade is checked separately for pricing and stock.
4. The page displays the Integrity price and separate core deposit for each warranty package.
5. In-stock, build-to-order, unavailable and manual-review states are displayed distinctly.
6. If ACE provides a build window such as 7–10 days, the customer is told that this is remanufacturer build time and does not include freight transit.
7. Discontinued/unavailable applications cannot proceed as ordinary order selections.
8. After the customer selects a package and supplies a delivery address, the server requests current ACE freight rates and can display outbound or round-trip freight without exposing supplier-account data.
9. The selected package, freight choice, VIN, contact information and core acknowledgment are submitted for the final order review.

The ACE-supplied “How to Choose an Upgrade” chart is included on the public page with an attribution caption. William confirmed ACE supplied the image for authorized customer use.

## Core Policy Used in the Customer Copy

- The core deposit is collected with the order; a saved card or delayed charge is not treated as guaranteed payment.
- The customer has 30 days from delivery to return the correct, complete core in the supplied container.
- The deposit is refunded after the core is received, processed and accepted under the written core terms.
- A wrong, incomplete, disassembled, damaged or late core may receive reduced or no credit.
- Integrity's shorter customer deadline preserves operating time inside ACE's longer account deadline.

The checkout must itemize the core deposit separately so a later partial Stripe refund can be matched to the original charge.

## Required Netlify Variables

Store these as encrypted runtime values, never in Git:

- `ACE_CONNECTOR_MODE=staff`
- `ACE_USERNAME`
- `ACE_PASSWORD`
- `ACE_LOOKUP_TOKEN` with at least 24 random characters
- `ACE_PUBLIC_LOOKUP_ENABLED=true`
- `REMAN_MARKUP_FLAT=500`
- `REMAN_QUOTE_EXPIRY_DAYS=7`

The existing percentage, minimum-margin and round-to variables are no longer used.

## Availability Rules

- **In stock:** show the returned quantity and warehouse/location name, then refresh immediately before payment.
- **Build to order:** show zero finished units, the returned build lead time and a separate statement that carrier transit begins after shipment.
- **Unavailable/discontinued:** block ordinary ordering and direct the customer to Integrity for another solution.
- **No reliable lead time:** allow a manual request but do not promise a ship date or open instant payment.
- **Non-returnable/special order:** require assisted confirmation before payment.

ACE remains the source of truth. The connector does not invent warehouse quantities, build times, upgrade descriptions, package contents or warranty coverage.

## Payment and Fulfillment Boundary

Integrity is the customer-facing merchant. Customers pay Integrity; Integrity manually places the supplier order after:

- Stripe confirms payment;
- fitment, pricing, availability and freight have been refreshed;
- any production split or tag ambiguity has been resolved; and
- the order terms are accepted.

Automatic ACE cart/order submission is intentionally excluded from the first checkout release. It should be considered only after ACE/TAS provides written integration authorization, supported order semantics, duplicate-order protection, cancellation rules and order-status tracking.

## Checkout Work Still Gated

The hosted Stripe Checkout implementation requires:

- a restricted Stripe secret key stored in Netlify;
- a Stripe webhook endpoint and signing secret;
- confirmed sales-tax registrations/calculation mode;
- final core, cancellation, freight-damage, returns and privacy terms; and
- a tested staff notification/order record.

Until those items are complete, the customer can retrieve live options and submit the selected package for final confirmation, but the public page must not imply that supplier fulfillment has begun.

## Validation

Run from the repository root:

```bash
node projects/hullinger-transmission/scripts/test-ace-integration.mjs
node projects/hullinger-transmission/scripts/audit-seo.mjs
node projects/hullinger-transmission/scripts/test-production-routes.mjs
```

The integration test covers staff authorization, VIN matching, $500 public pricing, per-upgrade stock, build lead-time extraction, public-data redaction and round-trip freight normalization without placing an ACE or Stripe order.
