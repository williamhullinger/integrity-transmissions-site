# Integrity Office Activation Runbook

## 1. Provision isolated environments

Create separate staging and production Netlify sites from the same repository. In each Office site's build settings, leave the base directory at the repository root and set the package directory to `/admin/integrity-office`. Netlify will then select `admin/integrity-office/netlify.toml` without changing the public site's root configuration. Use `office-staging.integritydrivetrain.com` for staging and reserve `office.integritydrivetrain.com` for the approved production deployment.

Provision separate managed PostgreSQL databases with encrypted connections, automated daily backups and point-in-time recovery. The production database must not share credentials or a schema owner with staging.

Use a migration identity to apply `db/001_initial.sql`, `db/002_office_runtime.sql`, `db/003_operational_controls.sql`, and `db/004_policy_acceptance.sql` in order. Create a different runtime identity with only the table, sequence and function permissions required by the application. The runtime identity must not own the database or schema.

## 2. Configure Auth0

Create a regular web SPA and a dedicated API audience of `https://office.integritydrivetrain.com/api`.

Allowed callback, logout and web origins must be exact HTTPS Office origins. Do not add wildcards.

Require MFA for every Office user. Add an Auth0 Action that places a boolean MFA result in the access token claim configured by `OFFICE_AUTH0_MFA_CLAIM`. The backend also accepts standard `amr` or `acr` multi-factor evidence, but the explicit claim is the clearest production contract.

Set the Office API access-token lifetime to no more than 15 minutes. Use an Auth0 tenant domain ending in `.auth0.com`; if a custom authentication domain is introduced later, update and review the Office Content Security Policy before cutover.

Bootstrap one administrator directly in `staff_users` using the exact Auth0 `sub`, then grant the administrator role in `user_roles`. After the first secure sign-in, use the Staff access screen for every subsequent account and role change. A valid Auth0 account without an active database record receives no Office access.

Recommended role assignment:

| Role | Use |
|---|---|
| viewer | Read customer, order and non-wholesale workflow information |
| operations | Fitment, supplier, freight, fulfillment, notes and core work |
| finance | Wholesale cost, margin, payments, reconciliation and reports |
| administrator | Staff access, promotion approval and all operational controls |

## 3. Configure secrets

Set the values listed in `admin/integrity-office/.env.example` in each Netlify site's protected environment settings. Never commit populated environment files.

Use a Stripe restricted key with read access to Checkout Sessions, PaymentIntents, Charges, Customers, Refunds, Disputes and Balance Transactions. No Stripe write access is required because refunds and dispute responses remain Stripe Dashboard actions. Restrict the key to the Office deployment's egress addresses when the hosting plan supports stable egress.

Generate `OFFICE_INTERNAL_INGEST_SECRET` from at least 32 random bytes. Store the same value in the public storefront and Office protected environments. Set the public storefront's `OFFICE_ORDER_INGEST_URL` to:

`https://office.integritydrivetrain.com/.netlify/functions/internal-ingest`

Set `OFFICE_FREIGHT_INGEST_URL` to:

`https://office.integritydrivetrain.com/.netlify/functions/internal-freight`

Set `OFFICE_PROMOTION_RESERVE_URL` to:

`https://office.integritydrivetrain.com/.netlify/functions/internal-promotion`

Do not configure the storefront ingestion values until the Office database, ingestion endpoints and monitoring are healthy. Once configured, checkout fails closed if its immutable Office record cannot be written; customers are never sent to payment with an untracked order. A freight callback is written to both the Office recovery queue and the existing Netlify form channel so one downstream outage does not lose the customer's request.

Configure `OFFICE_NOTIFICATION_WEBHOOK_URL` to a dedicated HTTPS receiver owned by Integrity, and generate `OFFICE_NOTIFICATION_WEBHOOK_SECRET` from at least 32 random bytes. The receiver must verify the signed timestamp and exact raw request body before sending email, text or team alerts. Do not point this setting at an unsigned generic form endpoint.

## 4. Configure Stripe events

Create a dedicated Stripe webhook destination:

`https://office.integritydrivetrain.com/.netlify/functions/stripe-webhook`

Subscribe only to the events processed by the Office deployment:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `refund.created`
- `refund.updated`
- `charge.succeeded`
- `charge.updated`
- `charge.dispute.created`
- `charge.dispute.updated`
- `charge.dispute.closed`
- `charge.dispute.funds_withdrawn`
- `charge.dispute.funds_reinstated`

Store its signing secret as `OFFICE_STRIPE_WEBHOOK_SECRET`. Keep the existing storefront webhook active until the paid-order email path and Office notification worker have both passed a real canary.

## 5. Stage and verify

1. Apply all four migrations to staging and verify the runtime identity cannot alter the schema.
2. Add one staging administrator and confirm that an unlisted Auth0 user is rejected.
3. Confirm login fails without MFA and succeeds with a passkey or authenticator app.
4. Run a test-mode VIN-to-freight-to-Checkout flow and complete payment with a Stripe test card.
5. Confirm exactly one customer, vehicle, quote, order, Checkout Session, payment transaction and balanced journal entry exist.
6. Replay the same checkout snapshot and Stripe event; both must report duplicates without adding records.
7. Create and separately approve a staging promotion. Confirm an eligible checkout receives the exact discount, a second use respects its limits, and an expired Checkout Session releases its reservation.
8. Verify viewer, operations and finance accounts cannot access administrator actions.
9. Force one event-processing failure, confirm retry scheduling, resolve it and confirm processing succeeds.
10. Run seven-day reconciliation and confirm no unmatched sessions or amount differences.
11. Confirm a Stripe processing fee is posted from its Balance Transaction and a refund cannot post until its allocations exactly match the Stripe total.
12. Create a test-mode dispute, confirm its evidence deadline appears, and verify the withdrawal posts to dispute expense and Stripe clearing. Close the dispute in the merchant's favor and verify the reinstatement reverses that entry. Replay the events out of order and confirm the resolved state does not regress.
13. Configure the receiver to persist and deduplicate each notification `id`, then force a delivery failure, confirm bounded retry scheduling and redacted system-health visibility, requeue it with a reason, and verify a signed successful delivery plus audit event.
14. Restore staging from a backup into a temporary database and document the recovery time.

## 6. Production cutover

Deploy the same tested commit to the production Office site, apply migrations, add the production administrator, and validate authentication before enabling storefront ingestion. Add the Office Stripe webhook, complete one low-risk live order, verify the customer email and Office accounting, and then mark the deployment operational.

Keep Stripe Dashboard as the final payment authority. Office should make discrepancies visible; it must never silently rewrite Stripe history to make its own totals appear correct.
