# Stripe Reman Order Operations

Updated: September 2, 2026

## Checkout Boundary

The customer pays Integrity Transmission & Drivetrain through Stripe-hosted Checkout. The website never creates an ACE order.

Immediately before Checkout opens, the Netlify function:

1. signs in to the protected ACE portal on the server;
2. reloads the VIN match and selected package;
3. confirms that the option is still orderable;
4. compares the current transmission and core amounts with what the customer reviewed;
5. reloads freight for the exact delivery address and accessorial selections;
6. verifies the signed freight-rate selection; and
7. creates the Stripe Customer and Checkout Session from server-confirmed amounts only.

If price, core, availability or freight changed, the customer is returned to the page to review the updated information. Browser-supplied dollar amounts are never used to create the charge.

## Stripe Line Items and Tax

Checkout contains three separately identifiable lines:

| Line | Stripe tax code | Treatment |
|---|---|---|
| Remanufactured transmission | `txcd_99999999` | General tangible goods; tax-exclusive |
| Refundable transmission core deposit | `txcd_99999999` | Conservatively treated as tangible goods; tax-exclusive |
| Transmission freight | `txcd_92010001` | Shipping with a physical-goods sale; tax-exclusive |

`automatic_tax.enabled` is true. Stripe uses the locked delivery address stored on the Checkout Customer and calculates tax only in jurisdictions where Integrity has an active Stripe Tax registration. Do not hard-code a rate from a Missouri letter.

The core classification should be confirmed with Integrity's Missouri tax adviser. Until then, collecting tax and refunding the exact associated tax with an accepted core is the conservative operational treatment.

## Environment Variables

Configure these only in Netlify, never in Git:

- `REMAN_CHECKOUT_ENABLED=true`
- `STRIPE_RESTRICTED_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_TRANSMISSION_TAX_CODE=txcd_99999999`
- `STRIPE_CORE_TAX_CODE=txcd_99999999`
- `STRIPE_FREIGHT_TAX_CODE=txcd_92010001`

Keep `REMAN_CHECKOUT_ENABLED=false` until the code is deployed, the webhook secret is present, and a test-mode checkout has passed.

The restricted key needs only the permissions used by this release:

- Customers: write;
- Checkout Sessions: write;
- Checkout Sessions: read; and
- Invoices: read.

The webhook updates Checkout Session metadata after sending the paid-order notification, so Checkout Sessions must allow both create and update operations.

## Webhook

Endpoint:

`https://integritydrivetrain.com/api/stripe-webhook`

Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

The function verifies the Stripe signature before doing anything. A completed order is reported to the Netlify form `reman-paid-order` only when Stripe reports `payment_status=paid`. Supplier fulfillment remains manual.

After the first production deploy registers that form in Netlify, add a form-submission email notification for `reman-paid-order`. This notification is the immediate paid-order alert; Stripe Dashboard remains the source of truth for payment status.

## Paid Order Procedure

1. Confirm the Stripe payment is `Paid` and the website notification matches the Stripe Checkout Session.
2. Verify the complete VIN, vehicle configuration, production split, selected upgrade, warranty and included items.
3. Refresh ACE availability and confirm the freight destination and accessorials.
4. If the exact unit cannot be supplied, refund the full Stripe payment before placing any ACE order.
5. If everything is correct, manually place the ACE order using the delivery address from Stripe.
6. Record the ACE order number, expected build/ship date and tracking information with the Stripe payment or the future ShopOps order record.
7. Send the customer the confirmed order and delivery update.

## Core Return and Refund

The Checkout Session creates a post-purchase Stripe invoice. The core is a distinct invoice line with `order_component=refundable_core_deposit`.

After ACE receives, processes and accepts the correct core:

1. Open the paid Stripe invoice.
2. Create a credit note for the **Refundable transmission core deposit** line only.
3. Refund that credit-note total to the original payment method.
4. Confirm the credit note includes the tax adjustment calculated for that line.
5. Record the ACE core acceptance and Stripe refund date.

Do not enter an arbitrary partial refund against the overall payment. A general partial refund can distribute tax proportionally across all items; the invoice-line credit note keeps the core and its tax adjustment tied together.

## Failure Rules

- **ACE unavailable:** do not open Checkout; ask the customer to try again or call.
- **Price/core changed:** require a new VIN lookup and customer review.
- **Freight changed:** show fresh signed rates and require a new selection.
- **Unavailable, discontinued or manual-review unit:** do not open instant Checkout.
- **Stripe Session creation fails:** show an error and state that no payment was taken.
- **Payment pending:** do not place the ACE order.
- **Paid but fitment fails:** refund the complete payment.
- **Webhook notification fails:** return an error so Stripe retries the webhook; also monitor Stripe Dashboard events.

## Verification Commands

Run from the repository root:

```bash
node projects/hullinger-transmission/scripts/test-ace-integration.mjs
node projects/hullinger-transmission/scripts/test-reman-checkout.mjs
node projects/hullinger-transmission/scripts/audit-seo.mjs
node projects/hullinger-transmission/scripts/test-production-routes.mjs
```
