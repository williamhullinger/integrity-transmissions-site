BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE payment_state AS ENUM (
  'checkout_open', 'processing', 'paid', 'failed', 'expired',
  'partially_refunded', 'refunded', 'disputed'
);
CREATE TYPE fulfillment_state AS ENUM (
  'fitment_review', 'ready_for_supplier', 'supplier_ordered', 'building',
  'shipped', 'delivered', 'canceled', 'closed'
);
CREATE TYPE core_state AS ENUM (
  'not_required', 'awaiting_return', 'pickup_scheduled', 'in_transit',
  'received', 'accepted', 'rejected', 'refund_due', 'refunded', 'forfeited'
);
CREATE TYPE staff_role AS ENUM ('viewer', 'operations', 'finance', 'administrator');

CREATE TABLE staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_subject text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  staff_user_id uuid NOT NULL REFERENCES staff_users(id),
  role staff_role NOT NULL,
  granted_by uuid REFERENCES staff_users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (staff_user_id, role)
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id text UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customers_email_idx ON customers (lower(email));

CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  region text NOT NULL,
  postal_code text NOT NULL,
  country_code char(2) NOT NULL DEFAULT 'US',
  location_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  vin char(17) NOT NULL,
  year smallint,
  make text,
  model text,
  engine text,
  drive_type text,
  mileage integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_vin_format CHECK (vin ~ '^[A-HJ-NPR-Z0-9]{17}$')
);
CREATE INDEX vehicles_vin_idx ON vehicles (vin);

CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  current_version integer NOT NULL DEFAULT 1 CHECK (current_version > 0),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quote_versions (
  quote_id uuid NOT NULL REFERENCES quotes(id),
  version integer NOT NULL CHECK (version > 0),
  selection_id text NOT NULL,
  transmission_family text NOT NULL,
  package_name text NOT NULL,
  warranty_text text NOT NULL,
  availability_code text NOT NULL,
  availability_text text NOT NULL,
  supplier_unit_cost_cents bigint NOT NULL CHECK (supplier_unit_cost_cents >= 0),
  customer_unit_price_cents bigint NOT NULL CHECK (customer_unit_price_cents >= 0),
  core_deposit_cents bigint NOT NULL CHECK (core_deposit_cents >= 0),
  freight_charged_cents bigint NOT NULL CHECK (freight_charged_cents >= 0),
  supplier_freight_cost_cents bigint NOT NULL CHECK (supplier_freight_cost_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'usd',
  supplier_snapshot jsonb NOT NULL,
  freight_snapshot jsonb NOT NULL,
  terms_version text NOT NULL,
  terms_sha256 char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quote_id, version),
  CONSTRAINT customer_price_margin CHECK (customer_unit_price_cents >= supplier_unit_cost_cents)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_order_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  customer_id uuid NOT NULL REFERENCES customers(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  delivery_address_id uuid NOT NULL REFERENCES addresses(id),
  quote_id uuid NOT NULL,
  quote_version integer NOT NULL,
  payment_status payment_state NOT NULL DEFAULT 'checkout_open',
  fulfillment_status fulfillment_state NOT NULL DEFAULT 'fitment_review',
  core_status core_state NOT NULL DEFAULT 'awaiting_return',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  paid_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (quote_id, quote_version) REFERENCES quote_versions(quote_id, version)
);
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX orders_work_queue_idx ON orders (fulfillment_status, core_status, created_at);

CREATE TABLE checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  stripe_checkout_session_id text NOT NULL UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  stripe_object_id text NOT NULL UNIQUE,
  transaction_type text NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'usd',
  status text NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  entry_type text NOT NULL CHECK (entry_type IN (
    'merchandise_revenue', 'freight_revenue', 'discount', 'sales_tax_liability',
    'core_deposit_liability', 'supplier_unit_cost', 'supplier_freight_cost',
    'stripe_fee', 'refund', 'core_refund', 'core_forfeiture'
  )),
  amount_cents bigint NOT NULL,
  currency char(3) NOT NULL DEFAULT 'usd',
  source_id text NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_type, source_id)
);
CREATE INDEX financial_entries_order_idx ON financial_entries (order_id, occurred_at);

CREATE TABLE supplier_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  supplier_name text NOT NULL,
  supplier_order_reference text,
  approved_by uuid REFERENCES staff_users(id),
  approved_at timestamptz,
  ordered_at timestamptz,
  estimated_ship_at timestamptz,
  shipped_at timestamptz,
  carrier text,
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
  due_at timestamptz NOT NULL,
  received_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  refund_due_cents bigint CHECK (refund_due_cents >= 0),
  stripe_refund_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE promotion_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  amount_off_cents bigint CHECK (amount_off_cents > 0),
  percent_off numeric(5,2) CHECK (percent_off > 0 AND percent_off <= 100),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  max_redemptions integer CHECK (max_redemptions > 0),
  minimum_margin_cents bigint NOT NULL DEFAULT 50000 CHECK (minimum_margin_cents >= 0),
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotion_discount_mode CHECK ((amount_off_cents IS NULL) <> (percent_off IS NULL))
);

CREATE TABLE promotion_redemptions (
  promotion_id uuid NOT NULL REFERENCES promotion_codes(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (promotion_id, order_id)
);

CREATE TABLE webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  api_version text,
  payload jsonb NOT NULL,
  processing_status text NOT NULL DEFAULT 'received',
  attempts integer NOT NULL DEFAULT 0,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error text
);

CREATE TABLE status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  workflow text NOT NULL CHECK (workflow IN ('payment', 'fulfillment', 'core')),
  from_state text,
  to_state text NOT NULL,
  reason text,
  actor_staff_user_id uuid REFERENCES staff_users(id),
  source_event_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX status_history_order_idx ON status_history (order_id, created_at);

CREATE TABLE order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  note text NOT NULL,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_subject text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  request_id text NOT NULL,
  reason text,
  before_value jsonb,
  after_value jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_entity_idx ON audit_log (entity_type, entity_id, created_at);

CREATE TABLE notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  deduplication_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  available_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_outbox_ready_idx ON notification_outbox (available_at)
  WHERE delivered_at IS NULL;

COMMIT;
