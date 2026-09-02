# Reman Transmission Commerce Roadmap

Updated: September 2, 2026

## Business Objective

Let a customer or repair shop anywhere in the United States start with a VIN, receive a verified remanufactured transmission option, pay Integrity, and have the approved unit shipped to the correct destination through the supplier fulfillment process.

The system must prevent an attractive but dangerous failure: taking payment for a transmission that does not match the exact application, production split, calibration, converter, electronics, or installer requirements.

## Recommended Model

Use a customer-facing live catalog with a controlled fulfillment gate:

1. Customer enters the 17-digit VIN and receives current matching reman options.
2. The site shows the Integrity price, separate core deposit, upgrade choices, package contents, inventory/build-time state, and warranty choices without exposing wholesale data.
3. Customer selects the package, supplies the delivery address, and receives available freight choices.
4. The server refreshes fitment, inventory, price and freight before secure payment.
5. Full payment, including the refundable core deposit, is collected by Integrity.
6. Integrity performs the final production-split review, manually places the supplier order, and records the supplier order number.
7. Shipment and tracking are communicated to the customer/installer.
8. Core return and warranty documentation are tracked through completion.

This creates a national sales path while keeping the high-risk supplier-order step under staff control.

## Phase 1: VIN-Assisted Quote Intake

Status: deployed and production-tested.

Implemented:

- top navigation tab labeled **Reman Transmissions**;
- national landing page at `/reman-transmissions`;
- 17-character VIN validation;
- live VIN/application matching through Integrity's protected server-side remanufacturer connector;
- manual fitment disclaimer before quote or order;
- fields for engine, drive type, transmission, mileage, vehicle use/modifications, destination ZIP, delivery type, core, installer, and symptoms/codes;
- public Integrity pricing calculated as current wholesale package cost plus $500;
- live offered-upgrade, package-content, warehouse/quantity, build-time and unavailable-state display;
- current outbound or round-trip freight lookup after address entry;
- Netlify form capture for the selected option and final review;
- no automated supplier order placement;
- written boundaries for freight, expedited delivery, core return, programming, warranty, and installer responsibility;
- original nationwide-reman hero image, FAQ content, structured data, internal links, sitemap entry, and `.html` redirect.

Supplier credentials, account pricing, raw response data and wholesale cost remain server-side. Final fitment is still refreshed before payment and supplier ordering.

## Phase 2: Verified Quote and Payment

Status: the ACE-assisted staff lookup, customer catalog, freight lookup and quote-building portions are implemented. Payment and persistent order-state records remain pending.

Implemented in the current release:

- private staff quote desk at `/staff/ace-quote`;
- server-side login to the existing ACE account;
- live VIN, application, part/tag, wholesale pricing, core, warranty, included-item, warning, non-returnable and per-upgrade stock retrieval;
- exact $500 Integrity unit margin;
- customer quote calculator with unit, freight, core, other approved items and tax separated;
- fitment and terms confirmation required before customer quote text can be copied;
- customer-safe public options with an allowlisted response and regression test against wholesale-data leakage;
- ACE-supplied Base/1000/2000/3000 upgrade-selection chart;
- current carrier freight retrieval and round-trip normalization;
- no supplier credentials or wholesale prices in public browser code; and
- no ACE cart or order-placement method.

Remaining Phase 2 work:

- internal quote record with a unique quote ID;
- exact VIN and confirmed transmission/application fields;
- supplier SKU or order reference;
- itemized unit, converter, fluid/parts, freight, liftgate/limited-access fees, core, tax, and optional installation;
- attached warranty, installation, programming, and core-return terms;
- customer acceptance checkbox and timestamp;
- Stripe Checkout or a Stripe Payment Link generated only after manual approval;
- paid/unpaid/expired quote states;
- full-payment rule before the supplier order button becomes available;
- confirmation email to Integrity and the customer;
- supplier order number and tracking fields.

Do not accept an unrestricted dollar amount or create Checkout from client-supplied prices. Every Checkout Session must come from a fresh server-side selection and freight verification.

## Phase 3: Fulfillment and Core Tracking

Add an order dashboard or lightweight operations record with these states:

- New VIN request
- Needs customer information
- Fitment review
- Supplier quote pending
- Written quote sent
- Customer approved
- Paid in full
- Supplier order placed
- Shipped / tracking available
- Delivered
- Core pickup scheduled
- Core received/accepted
- Warranty documents complete
- Closed, canceled, or refunded

Record every handoff so the customer, installer, Integrity, and supplier are working from the same VIN and written terms.

## Phase 4: Selective Catalog Automation

The current account connector can support public pricing and instant availability through a customer-safe server response. A supported supplier API or written authorization is still preferred before relying on it as a permanent production contract for:

- VIN/application interchange;
- current SKU and package contents;
- real inventory and lead time;
- wholesale cost and price changes;
- freight class, origin, destination rules, and surcharges;
- core eligibility, charge, return label/process, and deadline;
- warranty by application and installer type;
- converter, fluid, cooler, programming, relearn, and documentation requirements;
- exclusions for modified, commercial, towing, fleet, RV, or other duty cycles.

No public ACE catalog or ordering API was identified during the initial review. The authenticated wholesale portal was reviewed directly on September 2, 2026; it did not expose API documentation, API keys, webhooks, OAuth, CSV export, catalog export, or a data-feed workflow. Its live price and vehicle lookups are private, session-authenticated portal functions and must not be treated as a supported third-party API without written ACE authorization.

## Authenticated ACE Portal Findings

The read-only review confirmed that the portal can:

- identify applications by VIN, year/make/model/engine, or RMA;
- return tag, part number, transmission family, engine and OEM identifiers;
- show stock status, warehouse quantity, non-returnable status, and estimated lead-time notices;
- itemize the transmission, core charge, required installation-kit contents, fluid, warranty tier, optional labor coverage, freight, and total;
- quote freight by destination and accessorial needs such as residential delivery, liftgate, inside delivery, and round trip;
- retain lookup history with vehicle, transmission family, VIN, and resulting order;
- track orders, status, serial number, production estimate, tracking number, transactions, outstanding cores, warranty claims, and reports; and
- provide installation documents and account policies.

The portal is an excellent source for staff verification and ordering. Integrity's connector now performs customer-requested read-only lookups through a protected Netlify function; public browser code receives only allowlisted retail data. Keep supplier ordering manual until ACE or TAS supplies supported order semantics or written integration permission.

## ACE Policy Findings to Reflect in Quotes

The account documents reviewed September 2, 2026 state, subject to ACE's current written terms:

- distributor orders are placed through the portal, and drop shipping is available when the shipping address is changed on the order;
- freight varies by destination and selected terms;
- cores for orders purchased on or after May 1, 2026 generally must be returned within 90 days to preserve available core credit, and unpaid or late core obligations can affect warranty status;
- full core credit depends on an assembled, matching unit and torque converter plus required brackets and the correct shipping tote; damage, missing parts, disassembly, a wrong core, or missing packaging can reduce or eliminate credit;
- a unit marked non-returnable is paid up front, cannot be canceled after a hot build begins, and cannot be returned for credit; an in-stock unit may be cancelable only before it leaves the warehouse;
- current portal options include 18-month/18,000-mile and three-year/unlimited-mile coverage, with optional labor/programming upgrades; and
- warranty work requires prior authorization, documented installation and cooler procedures, required programming or relearn evidence, and adherence to the exact written warranty.

Integrity's customer-facing quote must summarize these obligations and attach the controlling current documents. Do not promise a core refund, cancellation, freight timing, warranty payment, or return eligibility until the exact order is verified.

## Recommended Pricing Formula

Keep ACE wholesale cost private and calculate customer pricing only in a secure quote record:

`customer total = approved unit/package + Integrity margin + freight/accessorials + core deposit + applicable tax`

Approved margin logic:

- add exactly $500 to the current wholesale transmission/package cost;
- show freight and accessorials as verified line items rather than advertising free or guaranteed overnight shipping;
- show the core deposit separately and explain that any later credit depends on ACE inspection and deadlines;
- calculate tax from the destination and the final taxable items; and
- generate payment only from the approved server-side quote so the customer cannot alter the amount.

The $500 margin is approved for launch and may be changed later if operating results justify it. Do not calculate it in browser JavaScript.

## Supplier Information Needed

Ask ACE for:

1. Written permission and approved wording for reseller/fulfillment claims.
2. Whether wholesale ordering offers an API, inventory feed, CSV export, saved quote, or deep link.
3. Exact application matching workflow and what identifiers supplement the VIN.
4. Price tiers, price protection, minimum advertised price, and retail/resale restrictions.
5. Freight timing and cutoff rules, including when expedited or overnight service is actually available.
6. Commercial, residential, liftgate, limited-access, Alaska/Hawaii, and remote-area rules.
7. Core charges, eligibility, return freight, deadline, damage criteria, and dispute process.
8. Warranty documents, registration, labor terms, claim process, and installer qualifications.
9. Torque converter, fluid, cooler, programming, relearn, and documentation requirements by unit.
10. Cancellation, reroute, refused delivery, freight damage, return, and refund policies.
11. Blind shipping, packing slips, branded documents, and customer communication rules.
12. Supplier order, shipment, tracking, delivery, core, and warranty status data available to Integrity.

## Integrity Business Decisions Needed

- retail margin or pricing formula — **decided: current wholesale package cost plus $500**;
- whether quotes expire and after how many days;
- who is authorized to approve exact fitment;
- supported vehicle classes and exclusions;
- whether Integrity sells to consumers, repair shops, or both;
- delivery destinations allowed;
- local installation quoting workflow;
- customer support hours and escalation owner;
- refund/cancellation policy before and after supplier order;
- sales-tax registration and calculation approach;
- written terms, privacy notice, and customer consent language;
- chargeback evidence and document retention policy.

## Technical Architecture

The current static Netlify site can support Phase 1. Phase 2 should add server-side functions or a small secure backend for quote IDs, payment creation, webhook verification, and order-state records.

Recommended boundaries:

- keep supplier credentials and Stripe secret keys server-side;
- never place ACE portal credentials, wholesale costs, or private API keys in browser JavaScript;
- validate VIN and quote ID again on the server;
- create Stripe Checkout only from the approved server-side quote amount;
- verify Stripe webhooks before marking a quote paid;
- log consent to the exact warranty/core/freight terms shown at payment;
- restrict staff access to customer VIN, address, and order records;
- define retention and deletion rules for personal information.

## Launch Acceptance Criteria

Phase 1 can launch when:

- the new page and form work on desktop and mobile;
- VIN service failure falls back to manual review;
- Netlify captures the new form in production;
- confirmation routing and notification recipients are verified;
- all wording matches real supplier and business capabilities;
- the canonical URL, sitemap, redirects, schema, and analytics are verified live.

Phase 2 can launch when:

- a test quote cannot be altered by the customer;
- payment equals the approved quote total;
- webhook and order-state transitions are verified;
- taxes, refund/cancellation, freight, core, installer, and warranty terms are approved;
- a complete test order can be traced from VIN request through core completion;
- no supplier or payment credentials are exposed in the client.

## Immediate Next Step

Deploy and production-test the public VIN catalog and freight flow with a non-customer VIN. Then complete hosted Stripe Checkout, webhook-confirmed payment, tax configuration, final terms and staff notification. Keep the ACE supplier order manual until the full payment-to-core workflow has been proven.
