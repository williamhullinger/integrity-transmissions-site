import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const sql = `${await readFile(path.resolve(testRoot, "../db/001_initial.sql"), "utf8")}\n${await readFile(path.resolve(testRoot, "../db/002_office_runtime.sql"), "utf8")}\n${await readFile(path.resolve(testRoot, "../db/003_operational_controls.sql"), "utf8")}`;
const repository = await readFile(path.resolve(testRoot, "../server/repository.mjs"), "utf8");

for (const requiredControl of [
  "CREATE EXTENSION IF NOT EXISTS citext",
  "CREATE TABLE idempotency_requests",
  "CREATE TABLE webhook_events",
  "CREATE TABLE notification_outbox",
  "CREATE TABLE ledger_accounts",
  "CREATE TABLE journal_entries",
  "CREATE TABLE journal_lines",
  "journal_entries_must_balance",
  "promotion_codes",
  "promotion_redemptions",
  "promotion_reservations",
  "promotion_redemption_guard",
  "quote_promotion_math",
  "minimum_margin_cents",
  "fitment_reviews",
  "order_documents",
  "freight_quote_requests",
  "stripe_reconciliation_runs",
  "amount_mismatches",
  "request_sha256",
  "manual_requeues",
  "stripe_created_at",
  "refund_allocations",
  "payment_disputes",
  "payment_disputes_no_delete",
  "last_event_created_at",
  "Dispute losses and fees",
  "refund_allocations_must_balance",
  "promotion_separation_of_duties",
  "supplier_orders_one_per_order_idx",
  "role_revocation_reason_complete",
  "refund_allocations_one_core_per_order_idx",
  "vehicles_customer_vin_idx",
  "reject_record_change",
  "REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC",
]) {
  assert(sql.includes(requiredControl), `Office schema is missing control: ${requiredControl}`);
}

assert(!sql.includes("CREATE TABLE financial_entries"), "Single-entry financial table must not return");
assert.match(sql, /CREATE UNIQUE INDEX user_roles_active_idx[\s\S]+WHERE revoked_at IS NULL/);
assert.match(sql, /code citext NOT NULL UNIQUE/);
assert.match(sql, /locked_by text,[\s\S]+locked_until timestamptz/);
assert.match(sql, /freight_quote_requests_no_delete[\s\S]+reject_record_delete/);
assert.match(sql, /stripe_reconciliation_runs_append_only[\s\S]+reject_record_change/);
assert.match(sql, /promotion_reservations_no_delete[\s\S]+reject_record_delete/);
assert.match(sql, /promotion can be applied only from a reserved redemption/i);
assert.match(sql, /promotion_redemptions[\s\S]+status IN \('reserved', 'applied'\)/);
assert.match(repository, /FROM promotion_redemptions[\s\S]+status IN \('reserved', 'applied'\)[\s\S]+FROM promotion_reservations[\s\S]+reserved_until > now\(\)/);
assert.doesNotMatch(repository, /status = 'applied' OR \(status = 'reserved' AND (?:pr\.)?reserved_until > now\(\)\)/);
assert.match(sql, /Promotion creator cannot approve the same promotion/i);
assert.match(sql, /Refund allocations must exactly match the refund transaction and order/i);
assert.match(sql, /refund_allocations_append_only[\s\S]+reject_record_change/);
assert.equal((repository.match(/ur\.role::text/g) || []).length, 3, "Every custom staff-role array query must cast enum values to text");
assert.match(repository, /pg_advisory_xact_lock[\s\S]+staff-admin-guard/);
assert.match(repository, /JOIN payment_transactions pt ON pt\.order_id = o\.id[\s\S]+pt\.transaction_type = 'payment' AND pt\.status = 'succeeded'/);
assert.match(repository, /WHERE cs\.stripe_created_at >= \$1 AND cs\.stripe_created_at < \$2/);

console.log("Integrity Office schema control test passed: durable events, RBAC history, promotion limits, and double-entry accounting are present.");
