# Integrity Transmission & Drivetrain

Production source for [integritydrivetrain.com](https://integritydrivetrain.com), including the customer website, VIN-matched remanufactured-transmission storefront, protected Netlify functions, automated release checks, and the undeployed Integrity Office foundation.

## Production architecture

| Component | Location | Responsibility |
|---|---|---|
| Public website | `projects/hullinger-transmission` | Customer pages, sales flow, terms, and search content |
| Server functions | `netlify/functions` | ACE catalog/freight lookups, Stripe Checkout, order status, and signed webhooks |
| Production builder | `scripts/build-integrity-site.mjs` | Manifest-driven public bundle with referenced assets only |
| Integrity Office | `admin/integrity-office` | Private order, promotion, accounting, audit, and workflow foundation; not deployed |
| Operations runbook | `docs/integrity/PRODUCTION_OPERATIONS.md` | Current fulfillment, incident, and source-of-truth procedures |

Netlify publishes `dist/integrity` from `main`. The build intentionally excludes repository notes, source generators, staff material, credentials, unrelated projects, and unreferenced assets.

## Local verification

Use Node.js 22 and install from the lockfile:

```bash
npm ci --ignore-scripts
npm test
npm run build
```

The test suite covers JavaScript syntax, production-language and security rules, ACE response normalization, server-enforced pricing, freight recovery, Stripe Checkout contracts, Office state/accounting controls, generated-page drift, SEO/schema requirements, the production manifest, redirect behavior, and dependency vulnerabilities.

## Commerce controls

- ACE credentials and wholesale costs remain server-side.
- Customer transmission price is recalculated as current wholesale plus exactly $500.
- Freight, core deposit, transmission, and tax are presented as separate amounts.
- Checkout fails closed when price, fitment, availability, or freight cannot be revalidated.
- A successful Stripe payment does not place a supplier order automatically.
- Staff must verify payment, VIN fitment, availability, and delivery before ordering from ACE.

Stripe Dashboard remains the operational authority until Integrity Office has managed PostgreSQL, dedicated Auth0 authentication with MFA, a durable webhook/outbox worker, backups, and completed security testing.

## Repository boundary

Older exercises remain in other `projects` subdirectories for history only. They are outside the Integrity build manifest and are not part of the production deployment.
