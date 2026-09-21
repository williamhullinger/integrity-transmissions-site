# Integrity Office — Nationwide Operations Model

Updated: September 21, 2026

## Scope

Integrity Office is the private system of record for sales and fulfillment work that is not safely handled by a public storefront or by Stripe alone. The first implementation supports the current paid reman-transmission flow. Migration `005_nationwide_operations.sql` adds the durable data foundation for engines, transmissions, transfer cases, differentials, leads, quotes, tasks, multiple suppliers, purchasing, shipments, core adjustments, warranty claims, communications, documents and supplier invoices.

The new records are additive. Existing production activation remains blocked until the infrastructure and acceptance checklist in `ACTIVATION.md` is complete.

## Primary navigation

| Area | Main decisions | Required records |
|---|---|---|
| Today | What needs attention now, who owns it, and what is overdue? | Tasks, new leads, holds, deadlines, exceptions |
| Sales | Which inquiries are qualified, quoted, won or lost? | Leads, activities, quote versions, attribution, loss reasons |
| Orders | What did the customer buy and what is blocking completion? | Orders, items, risk, fitment, payment, timelines |
| Customers | What is the complete relationship and unresolved obligation? | Contacts, vehicles, orders, communications, documents |
| Purchasing | What has been ordered from each supplier and at what actual cost? | Suppliers, catalog, purchase orders, acknowledgements, invoices |
| Logistics & Cores | Where are every outbound, replacement and return shipment and refundable liability? | Shipments, tracking, delivery exceptions, core inspection and credit |
| Warranty | What evidence is due and what remedy/recovery is in progress? | Claims, evidence, authorization, replacement, labor/freight reimbursement |
| Finance | What was collected, refunded, disputed, owed, paid and earned? | Payments, supplier invoices, COGS, tax/core liabilities, fees, journal entries |
| Tasks & Notifications | What work is assigned and what communication failed? | Tasks, SLA dates, communication events, outbox and dead letters |
| Administration | Who can act and are integrations/recovery controls healthy? | Staff roles, settings, integrations, audit, retention and security |

## Today dashboard

The default screen should optimize action, not decoration. It should show:

1. My tasks due today and overdue.
2. New or unassigned leads.
3. Paid orders waiting for risk or fitment review.
4. Approved orders waiting for purchase-order placement.
5. Supplier acknowledgements, backorders and ETA checks due.
6. Shipment exceptions and deliveries requiring confirmation.
7. Core pickup, deadline, inspection and refund work.
8. Warranty and dispute evidence deadlines.
9. Failed webhooks, notifications or integration work.
10. Aging totals by owner and queue.

No dashboard metric should be labeled profit until actual supplier cost, supplier credits, payment fees, refunds and other included costs are posted. “Projected margin” and “operating contribution before supplier cost” must remain distinct.

## Record relationships

- A lead may exist before a customer account and can be assigned, contacted, qualified, quoted, won or lost.
- A sales quote is versioned. A sent or accepted version is immutable, and a change produces a new version.
- A customer order contains one or more order items. Each item snapshots the Integrity SKU, supplier SKU, product type, fitment, configuration, warranty, retail price, core deposit and known supplier cost.
- An order can produce multiple supplier purchase orders and multiple shipments. A replacement or split shipment must not overwrite the original record.
- A task can point to a lead, quote, order, customer, purchase order, shipment, core return, warranty claim, dispute or system exception.
- Communications are append-only timeline events and record channel, direction, purpose, delivery status and consent basis without storing card data or secrets.
- Documents live in private object storage; the database stores a hash, scan status, retention class and link to the related record.

## Product and fitment evidence

Every offer uses an internal Integrity SKU and retains the real supplier SKU privately. Product-specific fitment evidence includes:

| Product | Minimum evidence before release |
|---|---|
| Transmission | VIN, family/tag or build code when required, engine, drive type, production split, connector/calibration details, use/modifications |
| Engine | VIN, engine code/VIN digit, displacement, emissions configuration, fuel system, induction, drive configuration and included components |
| Transfer case | VIN, case tag/model, RPO or build code, shift type, drivetrain and input/output configuration |
| Differential | VIN, axle code, ratio, ring-gear/application details, locker/limited-slip type and drive position |

Fitment approval is separate from fraud/risk approval, supplier availability and customer acceptance of any substitution or price change.

## Automated task rules

Activation should create idempotent tasks for these events:

| Event | Task | Initial SLA |
|---|---|---|
| New website/phone lead | Assign and make first contact | Same business day |
| Quote sent | Follow up | Configurable, normally 1–2 business days |
| Paid order | Review payment/risk | Before supplier commitment |
| Risk approved | Complete fitment review | Before supplier commitment |
| Fitment approved | Place/approve purchase order | Same business day when supplier is open |
| PO submitted | Obtain acknowledgement/ETA | Configurable by supplier |
| Shipment exception | Contact carrier/supplier/customer as applicable | Immediate working queue |
| Delivery confirmed | Start core-return clock and instructions | Same day |
| Core deadline approaching | Customer reminder | Configurable intervals |
| Core accepted | Verify/refund approved credit | Within published terms |
| Warranty intake | Gather required evidence | Deadline from applicable warranty |
| Dispute opened | Preserve records and review evidence deadline | Immediate finance queue |
| Integration failure | Retry or escalate | Based on retry/dead-letter policy |

SLA values belong in configuration, not hard-coded customer promises. A missed internal target must not silently change written contractual timing.

## Finance definitions

- **Collected sales:** confirmed customer payment transactions.
- **Net sales activity:** recognized merchandise/freight revenue less discounts and classified refunds for the period.
- **Actual COGS:** approved supplier merchandise, freight and nonrefundable cost allocated to delivered items.
- **Gross profit:** net sales less actual COGS. It excludes overhead and must not be labeled net profit.
- **Projected margin:** quote/order retail price less the supplier cost snapshot before actual invoice reconciliation.
- **Core liability:** refundable customer core deposits still owed or unresolved.
- **Tax liability:** collected sales tax not yet remitted or otherwise resolved.
- **Accounts payable:** approved supplier invoices not fully paid.
- **Accounts receivable:** accepted customer charges or balances not fully collected, if non-Stripe/manual terms are later enabled.

Reports should support product type, family, supplier, state, customer/account, lead source, campaign, owner and date filters. Exports must preserve cents, currency, timestamps and source identifiers.

## Safe staging data

Staging may use clearly labeled fixture companies, products, customers, quotes and orders generated only in the staging database. Fixture identifiers must never enter production, accounting exports, customer communications, public pages, schema markup or merchant feeds. Production empty states should be complete and useful without pretending activity exists.

## Remaining implementation sequence

1. Apply migrations to a disposable PostgreSQL staging database and add repository integration/concurrency tests.
2. Wire lead intake for all public quote forms and safe manual entry.
3. ~~Build Today, Sales and Tasks APIs and interface.~~ Completed September 21, 2026: lead and task APIs, role controls, audit history, dashboard workload metrics and staff screens are implemented.
4. Migrate the current single-product checkout into `order_items` without changing the public checkout contract.
5. Build supplier catalog, purchase orders, multi-shipment and actual-cost workflows.
6. Complete partial core-credit and warranty-claim workflows.
7. Add the signed customer/staff communication receiver and templates.
8. Provision private object storage with signed access and malware scanning.
9. Add supplier invoices, actual COGS, payout/bank reconciliation and accounting export.
10. Run Auth0, Stripe test-mode, backup restore, browser accessibility and controlled live-order acceptance.
