# Integrity Nationwide Growth Roadmap

Updated: September 21, 2026

## Purpose

This is the master execution tracker for turning Integrity Transmission & Drivetrain into a credible nationwide powertrain sales business while continuing to support the Springfield-area repair shop.

The website is the primary publishing and conversion platform. Technical articles live in the website's `/guides` knowledge hub, link to the relevant transmission, engine, transfer-case or service page, and can then be adapted into social posts, short videos, email material and partner outreach. The original website article remains the canonical source.

No public page, case study, testimonial, inventory statement, warranty claim, price, supplier relationship or business result may be fabricated. Structures and drafts may be prepared before evidence is available, but they must remain non-public or be clearly labeled as examples until verified.

## Outcome map

| Workstream | Business outcome | Current status | Next controlled step |
|---|---|---|---|
| Technical search foundation | Google and Bing can discover, understand and rank the correct pages | Complete and monitored | Review indexing, query positions and CTR monthly |
| National product discovery | Buyers find supported reman transmissions, engines and transfer cases | Transmission foundation live; engines and transfer cases quote-first | Import verified Jasper or other supplier catalog data before creating family pages |
| Conversion system | Visitors can move from research to VIN verification, freight and payment | Transmission checkout live with safe freight recovery | Measure each funnel stage and remove verified abandonment points |
| Trust and education | Buyers understand quality, fitment, warranty, freight, core and installation | Core buying-guide cluster live | Publish symptom guides and evidence-backed case studies |
| Authority and links | Relevant businesses and publications cite Integrity's useful resources | Campaign plan prepared | Verify targets and sender identity before outreach |
| Measurement | Search, engagement, leads and orders can be evaluated without exposing customer data | GA4 active; privacy-safe commerce events implemented | Mark key events and connect monthly Search Console/GA4 review |
| Operations | Staff can safely manage national orders and exceptions | Integrity Office built but not activated | Provision managed PostgreSQL, Auth0 MFA and private hosting |
| Supplier expansion | Verified inventory and offer terms expand beyond the current supplier | Awaiting supplier account/catalog | Map catalog, terms, warranties and fulfillment rules privately first |

## Execution order

### 1. Protect and measure the current funnel

- [x] Server-controlled retail pricing and current supplier revalidation
- [x] Bounded freight retries and assisted-quote recovery
- [x] Stripe Checkout with unit, freight, core and tax separated
- [x] Consent-controlled GA4 implementation with customer identifiers excluded
- [x] Paid-order and quote-form notification routing
- [x] Customer terms, privacy, core, warranty and electronic-consent records
- [x] Confirm GA4 receives production activity and treats `purchase` as a key event
- [ ] After genuine activity first emits them, mark `generate_lead`, `freight_quote_success`, `checkout_redirect` and `order_payment_confirmed` as GA4 key events
- [ ] Confirm the first genuine paid-order email and accounting path with a controlled live transaction

### 2. Convert existing search visibility into qualified traffic

- [x] Fifty-three canonical indexable pages, XML sitemap and IndexNow support
- [x] Unique metadata, social cards, breadcrumbs, structured data and internal links
- [x] Thirteen transmission-family sales pages
- [x] Seven-page transmission buying-guide cluster
- [x] National engine and transfer-case quote pages
- [x] Confirm the canonical sitemap URL is successfully submitted in Google Search Console
- [ ] Monitor Search Console until its discovered-page count catches up to the 53-URL live sitemap
- [ ] Improve titles and snippets for queries already ranking in positions 5–20 with low CTR
- [ ] Add only validated product/offer structured data when price, availability and landing-page claims are current
- [ ] Create additional family pages only from verified, currently supported catalog applications

### 3. Build the technical publishing engine

- [x] `/guides` website knowledge hub
- [x] Editorial quality, privacy and case-study rules
- [x] Initial buying-guide and symptom content
- [x] Publish the first symptom series: slipping, delayed engagement, shudder versus misfire and no reverse
- [ ] Add make-specific CVT guides only after application details and technical review are documented
- [ ] Capture real jobs through the case-study intake process
- [ ] Repurpose each published guide into an approved social/video/email package that links to the canonical page
- [x] Maintain an editorial calendar with owner, evidence status, technical reviewer, publication state and performance review date

### 4. Expand national commerce responsibly

- [x] VIN-first transmission shopping and quote flow
- [x] Engine and transfer-case quote intake with application details
- [x] Clear core, freight, delivery, installer and warranty expectations
- [ ] Obtain the new supplier's private catalog, wholesale terms, availability method, freight rules, core policy and written warranty documents
- [ ] Create a private normalized catalog that does not expose supplier identity or wholesale cost
- [ ] Decide which engine, transmission, transfer-case and differential families have stable nationwide support
- [ ] Publish category/family pages only after the offer, images, warranty and availability claims are verified
- [ ] Add online purchase only where live pricing, fitment, freight, tax and order controls all fail safely

### 5. Build authority without manufactured proof

- [x] Backlink campaign framework
- [x] Case-study capture and redaction workflow
- [ ] Create useful reference assets that can earn links: fitment checklist, freight receiving checklist, core-return checklist and warranty-document checklist
- [ ] Verify legitimate supplier/dealer, industry, local-business, chamber, trade-school, fleet and automotive-publication opportunities
- [ ] Send individualized outreach only from an approved business account to verified recipients
- [ ] Record contact, source, relevance, status, response and live-link URL; never buy bulk links or fabricate placements

### 6. Activate Integrity Office

- [x] Private application boundary and deterministic separate build
- [x] Auth0 JWT/MFA enforcement and database-backed staff roles
- [x] Orders, fitment, supplier ordering, shipping, cores, refunds and notes
- [x] Freight exceptions, assignments, follow-up and conversion tracking
- [x] Promotions with separation of duties, limits and margin protection
- [x] Double-entry commerce subledger, Stripe fees, refunds and disputes
- [x] Stripe reconciliation, durable webhooks, retry workers and dead-letter recovery
- [x] Notification outbox, audit history and staff administration
- [x] Additive nationwide data model for supplier-neutral products, multi-item orders, leads, versioned quotes, tasks, risk review, multiple purchase orders/shipments, warranty claims, communications, private documents and supplier invoices
- [x] Build and connect Sales Leads and Tasks, including Today-dashboard workload metrics, to the nationwide data model
- [ ] Build and connect Purchasing, Logistics, Warranty and unified Customer screens to the nationwide data model
- [ ] Provision separate staging and production PostgreSQL databases with backup and restore testing
- [ ] Configure separate Auth0 applications/APIs with enforced MFA
- [ ] Create private Netlify Office sites, domain and protected environment values
- [ ] Supply exact staff identities and least-privilege role assignments
- [ ] Configure the Stripe restricted read key and dedicated Office webhook
- [ ] Connect an Integrity-owned notification receiver
- [ ] Run staging acceptance tests and one controlled live-order canary before operational cutover

### 7. Establish the operating cadence

| Cadence | Review | Responsible role |
|---|---|---|
| Daily after activation | Paid orders, fitment holds, supplier orders, shipments, freight exceptions, notification failures and disputes | Operations |
| Weekly | Open cores, overdue follow-ups, reconciliation exceptions, promotion capacity, refunds and unassigned work | Operations + finance |
| Monthly | Search visibility, indexed pages, guide performance, funnel conversion, revenue activity, fees, refunds and outstanding liabilities | Owner + marketing + finance |
| Quarterly | Supplier performance, warranty/return patterns, content refreshes, access review, backup restore and incident readiness | Owner + administrators |

## Dependencies that require William or an outside account

1. Jasper or other supplier onboarding, catalog access and written commercial terms.
2. Managed database, Auth0 and private hosting billing/account ownership.
3. Initial staff names, email addresses, Auth0 subjects and roles.
4. A real paid-order canary and confirmation of the resulting customer/staff communications.
5. Rights-approved exact-unit product photographs where representative renderings are not sufficient.
6. Real job evidence and customer permission for case studies or attributed testimonials.
7. A verified business sending account and reviewed recipients for outreach.
8. Tax and accounting decisions outside the existing Missouri setup.

## Supporting records

- `SEO_CAMPAIGN_STATUS.md` — current public search/release baseline
- `SEO_CONTENT_ROADMAP.md` — demand, editorial queue and measurement
- `CASE_STUDY_WORKFLOW.md` — evidence capture, redaction and publication controls
- `BACKLINK_CAMPAIGN.md` — authority-building process
- `REMAN_COMMERCE_ROADMAP.md` — storefront delivery and operating limits
- `STRIPE_REMAN_OPERATIONS.md` — payment and order handling
- `ACE_INTEGRATION.md` — current supplier integration boundary
- `admin/integrity-office/README.md` — implemented Office capabilities and controls
- `admin/integrity-office/docs/ACTIVATION.md` — activation gate
- `docs/integrity/PRODUCTION_OPERATIONS.md` — live commerce operating source of truth
