# ACE Reman Integration

Updated: September 2, 2026

## What Is Implemented

Integrity now has a private, server-side ACE staff connector and quote desk:

- customer VIN and order details enter through `/reman-transmissions`;
- the intake now collects the full freight destination, warranty preference, warranty-labor preference, programming capability, delivery type, core condition, and core-return freight preference;
- staff opens `/staff/ace-quote`, enters a private staff token and the customer VIN, and runs the ACE lookup;
- the Netlify function signs into the existing ACE account on the server;
- ACE returns the decoded application, matching tag/part candidates, current account pricing, core charge, included line items, warranty choices, suggested list price, base inventory signal, non-returnable status, and warnings;
- the connector keeps the ACE username, password, session cookies, and supplier traffic out of browser JavaScript;
- the staff desk applies Integrity's configured retail floor and prepares customer-facing quote text without including ACE wholesale prices;
- staff must confirm exact fitment, availability, freight, core, warranty, programming, and installer requirements before copying the quote; and
- the connector has no order-placement method and cannot add anything to the ACE cart.

## Pricing Rule

The default customer unit price is the highest of:

1. ACE's current suggested retail price;
2. ACE wholesale package cost plus 35%; or
3. ACE wholesale package cost plus a $1,000 minimum gross-margin floor.

The result rounds up to the next $25. Core, freight/accessorials, other approved items, and tax remain separate line items. All four pricing settings are runtime variables and can be changed without editing the connector.

## Required Netlify Variables

Configure these as encrypted runtime values, never in Git:

- `ACE_CONNECTOR_MODE=staff`
- `ACE_USERNAME`
- `ACE_PASSWORD`
- `ACE_LOOKUP_TOKEN` with at least 24 random characters
- `REMAN_MARKUP_PERCENT=35`
- `REMAN_MIN_MARGIN=1000`
- `REMAN_PRICE_ROUND_TO=25`
- `REMAN_QUOTE_EXPIRY_DAYS=7`

The connector returns `503` until staff mode and the required account values are configured. It returns `401` unless the separate staff token matches.

## Safety Boundaries

- The public reman page continues to use NHTSA only for basic vehicle information.
- Wholesale cost is available only through the authenticated staff endpoint.
- The private staff page is unlinked, noindexed, uncached, and blocked in `robots.txt`; the API still requires the staff token because obscurity is not security.
- The connector performs read-only catalog, pricing, and stock checks.
- It does not expose ACE cookies, credentials, anti-forgery tokens, raw responses, or order controls.
- It does not promise final fitment when ACE returns multiple tag or production-split candidates.
- It does not calculate freight automatically because ACE's freight quote depends on the exact address, accessorials, selected unit, account freight terms, and current carrier response.
- It does not collect payment or place a supplier order.

## Supplier Integration Status

No public ACE or TAS API documentation, OAuth flow, API key, webhook, inventory feed, catalog export, or CSV price feed was found. The existing TAS portal exposes private session-authenticated calls for VIN, application, pricing, freight, inventory, and ordering.

The staff connector uses those account functions only for Integrity's own read-only workflow. Before customer-facing instant pricing or automatic supplier ordering is enabled, ACE or TAS should provide written approval and preferably a supported API/feed or dedicated integration credential.

Official contacts verified September 2, 2026:

- ACE Sales Support: `salessupport@acetransmissionservice.com`, (800) 821-6552
- TAS: `sales@tasreman.com`, (417) 366-5890

## Next Automation Gate

Automatic ACE ordering should be added only after the supplier confirms:

- approved authentication and rate limits;
- fitment and production-split decision rules;
- live inventory and lead-time semantics;
- price, promotion, warranty, and suggested-retail fields;
- freight, residential, liftgate, inside-delivery, pickup, and core-return rules;
- order creation, idempotency, cancellation, status, tracking, and webhook behavior;
- warranty and core status access; and
- resale, branding, drop-ship, and customer-document rules.

Even with an approved API, customer payment should create a **paid, awaiting supplier order** record. The final supplier order should require one staff confirmation until duplicate-order prevention, freight, tax, fitment, cancellation, and refund handling have been proven in production.

## Validation

Run from `projects/hullinger-transmission`:

```bash
node scripts/test-ace-integration.mjs
node scripts/audit-seo.mjs
node scripts/test-production-routes.mjs
```

The ACE integration test covers the staff authorization guard, VIN response, YMME fitment submission, candidate parser, current-pricing normalization, stock response, warranty packages, core charge, suggested retail, and Integrity margin floor without connecting to or ordering from ACE. Netlify loads the function from the repository-level `netlify/functions` directory configured for this project.
