import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const sql = await readFile(path.resolve(testRoot, "../db/001_initial.sql"), "utf8");

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
  "promotion_redemption_guard",
  "minimum_margin_cents",
  "fitment_reviews",
  "order_documents",
  "reject_record_change",
  "REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC",
]) {
  assert(sql.includes(requiredControl), `Office schema is missing control: ${requiredControl}`);
}

assert(!sql.includes("CREATE TABLE financial_entries"), "Single-entry financial table must not return");
assert.match(sql, /CREATE UNIQUE INDEX user_roles_active_idx[\s\S]+WHERE revoked_at IS NULL/);
assert.match(sql, /code citext NOT NULL UNIQUE/);
assert.match(sql, /locked_by text,[\s\S]+locked_until timestamptz/);

console.log("Integrity Office schema control test passed: durable events, RBAC history, promotion limits, and double-entry accounting are present.");
