BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

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
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL REFERENCES staff_users(id),
  role staff_role NOT NULL,
  granted_by uuid REFERENCES staff_users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES staff_users(id),
  revoked_at timestamptz,
  reason text NOT NULL,
  CONSTRAINT role_revocation_complete CHECK ((revoked_at IS NULL) = (revoked_by IS NULL)),
  CONSTRAINT role_revocation_order CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
CREATE UNIQUE INDEX user_roles_active_idx ON user_roles (staff_user_id, role) WHERE revoked_at IS NULL;

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
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, id)
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
  CONSTRAINT vehicles_vin_format CHECK (vin ~ '^[A-HJ-NPR-Z0-9]{17}$'),
  UNIQUE (customer_id, id)
);
CREATE INDEX vehicles_vin_idx ON vehicles (vin);

CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  current_version integer NOT NULL DEFAULT 1 CHECK (current_version > 0),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, customer_id, vehicle_id),
  FOREIGN KEY (customer_id, vehicle_id) REFERENCES vehicles(customer_id, id)
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
ALTER TABLE quotes ADD CONSTRAINT quotes_current_version_fk
  FOREIGN KEY (id, current_version) REFERENCES quote_versions(quote_id, version)
  DEFERRABLE INITIALLY DEFERRED;

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
  UNIQUE (customer_id, id),
  FOREIGN KEY (quote_id, quote_version) REFERENCES quote_versions(quote_id, version),
  FOREIGN KEY (customer_id, vehicle_id) REFERENCES vehicles(customer_id, id),
  FOREIGN KEY (customer_id, delivery_address_id) REFERENCES addresses(customer_id, id),
  FOREIGN KEY (quote_id, customer_id, vehicle_id) REFERENCES quotes(id, customer_id, vehicle_id)
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

CREATE TABLE ledger_accounts (
  code text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  account_type text NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  active boolean NOT NULL DEFAULT true
);

INSERT INTO ledger_accounts (code, name, account_type) VALUES
  ('1000', 'Stripe clearing', 'asset'),
  ('1010', 'Cash', 'asset'),
  ('2000', 'Sales tax payable', 'liability'),
  ('2010', 'Core deposits payable', 'liability'),
  ('4000', 'Transmission revenue', 'revenue'),
  ('4010', 'Freight revenue', 'revenue'),
  ('4020', 'Core forfeiture revenue', 'revenue'),
  ('5000', 'Transmission cost of goods', 'expense'),
  ('5010', 'Supplier freight cost', 'expense'),
  ('6100', 'Stripe processing fees', 'expense'),
  ('6200', 'Discounts and refunds', 'expense');

CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  source_type text NOT NULL,
  source_id text NOT NULL,
  description text NOT NULL,
  currency char(3) NOT NULL DEFAULT 'usd',
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id)
);
CREATE INDEX journal_entries_order_idx ON journal_entries (order_id, occurred_at);

CREATE TABLE journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES journal_entries(id),
  account_code text NOT NULL REFERENCES ledger_accounts(code),
  debit_cents bigint NOT NULL DEFAULT 0 CHECK (debit_cents >= 0),
  credit_cents bigint NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT journal_line_one_side CHECK ((debit_cents > 0) <> (credit_cents > 0))
);
CREATE INDEX journal_lines_entry_idx ON journal_lines (journal_entry_id);

CREATE FUNCTION enforce_balanced_journal_entry() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_id uuid := COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  debits bigint;
  credits bigint;
BEGIN
  SELECT COALESCE(sum(debit_cents), 0), COALESCE(sum(credit_cents), 0)
    INTO debits, credits
    FROM journal_lines
    WHERE journal_entry_id = target_id;
  IF debits = 0 OR debits <> credits THEN
    RAISE EXCEPTION 'Journal entry % is not balanced', target_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER journal_entries_must_balance
AFTER INSERT OR UPDATE OR DELETE ON journal_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_balanced_journal_entry();

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

CREATE TABLE fitment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  vin char(17) NOT NULL,
  transmission_family text NOT NULL,
  supplier_part_uid text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  reason text NOT NULL,
  reviewed_by uuid NOT NULL REFERENCES staff_users(id),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fitment_review_vin_format CHECK (vin ~ '^[A-HJ-NPR-Z0-9]{17}$')
);
CREATE INDEX fitment_reviews_order_idx ON fitment_reviews (order_id, reviewed_at DESC);

CREATE TABLE order_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  document_type text NOT NULL CHECK (document_type IN (
    'supplier_order', 'bill_of_lading', 'delivery_receipt', 'core_inspection',
    'core_return', 'invoice', 'refund', 'warranty', 'other'
  )),
  storage_key text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  media_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  uploaded_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE idempotency_requests (
  scope text NOT NULL,
  idempotency_key text NOT NULL,
  request_sha256 char(64) NOT NULL CHECK (request_sha256 ~ '^[a-f0-9]{64}$'),
  response_status integer CHECK (response_status BETWEEN 200 AND 599),
  response_body jsonb,
  locked_until timestamptz,
  completed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, idempotency_key),
  CONSTRAINT idempotency_response_complete CHECK (
    (completed_at IS NULL AND response_status IS NULL AND response_body IS NULL)
    OR (completed_at IS NOT NULL AND response_status IS NOT NULL AND response_body IS NOT NULL)
  )
);

CREATE TABLE promotion_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext NOT NULL UNIQUE,
  amount_off_cents bigint CHECK (amount_off_cents > 0),
  percent_off numeric(5,2) CHECK (percent_off > 0 AND percent_off <= 100),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  max_redemptions integer CHECK (max_redemptions > 0),
  max_redemptions_per_customer integer NOT NULL DEFAULT 1 CHECK (max_redemptions_per_customer > 0),
  minimum_margin_cents bigint NOT NULL DEFAULT 35000 CHECK (minimum_margin_cents >= 0),
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  approved_by uuid REFERENCES staff_users(id),
  approved_at timestamptz,
  disabled_by uuid REFERENCES staff_users(id),
  disabled_at timestamptz,
  disable_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotion_discount_mode CHECK ((amount_off_cents IS NULL) <> (percent_off IS NULL)),
  CONSTRAINT promotion_date_order CHECK (ends_at IS NULL OR ends_at > starts_at),
  CONSTRAINT promotion_approval_complete CHECK ((approved_at IS NULL) = (approved_by IS NULL)),
  CONSTRAINT promotion_disable_complete CHECK (
    (disabled_at IS NULL AND disabled_by IS NULL AND disable_reason IS NULL)
    OR (disabled_at IS NOT NULL AND disabled_by IS NOT NULL AND disable_reason IS NOT NULL)
  )
);

CREATE TABLE promotion_redemptions (
  promotion_id uuid NOT NULL REFERENCES promotion_codes(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL CHECK (status IN ('reserved', 'applied', 'released', 'reversed')),
  reserved_until timestamptz NOT NULL,
  applied_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (promotion_id, order_id),
  FOREIGN KEY (customer_id, order_id) REFERENCES orders(customer_id, id),
  CONSTRAINT redemption_timestamps CHECK (
    (status <> 'applied' OR applied_at IS NOT NULL)
    AND (status NOT IN ('released', 'reversed') OR released_at IS NOT NULL)
  )
);
CREATE INDEX promotion_redemptions_capacity_idx
  ON promotion_redemptions (promotion_id, status, reserved_until);

CREATE FUNCTION enforce_promotion_redemption() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  promotion promotion_codes%ROWTYPE;
  total_uses bigint;
  customer_uses bigint;
  merchandise_cents bigint;
  supplier_cost_cents bigint;
  expected_discount_cents bigint;
BEGIN
  IF NEW.status NOT IN ('reserved', 'applied') THEN
    RETURN NEW;
  END IF;
  IF NEW.status = 'reserved' AND NEW.reserved_until <= now() THEN
    RAISE EXCEPTION 'Promotion reservation must expire in the future';
  END IF;

  SELECT * INTO promotion FROM promotion_codes WHERE id = NEW.promotion_id FOR UPDATE;
  IF NOT FOUND OR NOT promotion.active OR promotion.approved_at IS NULL OR promotion.disabled_at IS NOT NULL THEN
    RAISE EXCEPTION 'Promotion is not approved and active';
  END IF;
  IF now() < promotion.starts_at OR (promotion.ends_at IS NOT NULL AND now() >= promotion.ends_at) THEN
    RAISE EXCEPTION 'Promotion is outside its active date range';
  END IF;

  SELECT count(*) INTO total_uses
    FROM promotion_redemptions
    WHERE promotion_id = NEW.promotion_id
      AND order_id <> NEW.order_id
      AND (status = 'applied' OR (status = 'reserved' AND reserved_until > now()));
  IF promotion.max_redemptions IS NOT NULL AND total_uses >= promotion.max_redemptions THEN
    RAISE EXCEPTION 'Promotion redemption limit has been reached';
  END IF;

  SELECT count(*) INTO customer_uses
    FROM promotion_redemptions
    WHERE promotion_id = NEW.promotion_id
      AND customer_id = NEW.customer_id
      AND order_id <> NEW.order_id
      AND (status = 'applied' OR (status = 'reserved' AND reserved_until > now()));
  IF customer_uses >= promotion.max_redemptions_per_customer THEN
    RAISE EXCEPTION 'Customer promotion redemption limit has been reached';
  END IF;

  SELECT qv.customer_unit_price_cents + qv.freight_charged_cents,
         qv.supplier_unit_cost_cents + qv.supplier_freight_cost_cents
    INTO merchandise_cents, supplier_cost_cents
    FROM orders o
    JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
    WHERE o.id = NEW.order_id AND o.customer_id = NEW.customer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promotion order and customer do not match';
  END IF;

  expected_discount_cents := CASE
    WHEN promotion.amount_off_cents IS NOT NULL THEN promotion.amount_off_cents
    ELSE round(merchandise_cents * promotion.percent_off / 100)
  END;
  IF NEW.amount_cents <> least(expected_discount_cents, merchandise_cents) THEN
    RAISE EXCEPTION 'Promotion discount amount does not match its rule';
  END IF;
  IF merchandise_cents - NEW.amount_cents - supplier_cost_cents < promotion.minimum_margin_cents THEN
    RAISE EXCEPTION 'Promotion would reduce the order below its minimum margin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_redemption_guard
  BEFORE INSERT OR UPDATE ON promotion_redemptions
  FOR EACH ROW EXECUTE FUNCTION enforce_promotion_redemption();

CREATE TABLE webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  api_version text,
  payload jsonb NOT NULL,
  processing_status text NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processing', 'processed', 'retry', 'dead_letter')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_by text,
  locked_until timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error text,
  CONSTRAINT webhook_lock_complete CHECK ((locked_by IS NULL) = (locked_until IS NULL))
);
CREATE INDEX webhook_events_ready_idx ON webhook_events (next_attempt_at, received_at)
  WHERE processing_status IN ('received', 'retry');

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
  locked_by text,
  locked_until timestamptz,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_lock_complete CHECK ((locked_by IS NULL) = (locked_until IS NULL))
);
CREATE INDEX notification_outbox_ready_idx ON notification_outbox (available_at, created_at)
  WHERE delivered_at IS NULL;

CREATE FUNCTION reject_record_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% records are append-only', TG_TABLE_NAME;
END;
$$;

CREATE FUNCTION reject_record_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% records cannot be deleted', TG_TABLE_NAME;
END;
$$;

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER quote_versions_append_only
  BEFORE UPDATE OR DELETE ON quote_versions
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER payment_transactions_append_only
  BEFORE UPDATE OR DELETE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER journal_entries_append_only
  BEFORE UPDATE OR DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER journal_lines_append_only
  BEFORE UPDATE OR DELETE ON journal_lines
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER fitment_reviews_append_only
  BEFORE UPDATE OR DELETE ON fitment_reviews
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER status_history_append_only
  BEFORE UPDATE OR DELETE ON status_history
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER order_notes_append_only
  BEFORE UPDATE OR DELETE ON order_notes
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER order_documents_append_only
  BEFORE UPDATE OR DELETE ON order_documents
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();

CREATE TRIGGER orders_no_delete
  BEFORE DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION reject_record_delete();
CREATE TRIGGER checkout_sessions_no_delete
  BEFORE DELETE ON checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION reject_record_delete();
CREATE TRIGGER webhook_events_no_delete
  BEFORE DELETE ON webhook_events
  FOR EACH ROW EXECUTE FUNCTION reject_record_delete();
CREATE TRIGGER notification_outbox_no_delete
  BEFORE DELETE ON notification_outbox
  FOR EACH ROW EXECUTE FUNCTION reject_record_delete();
CREATE TRIGGER promotion_redemptions_no_delete
  BEFORE DELETE ON promotion_redemptions
  FOR EACH ROW EXECUTE FUNCTION reject_record_delete();

CREATE TRIGGER staff_users_set_updated_at
  BEFORE UPDATE ON staff_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER supplier_orders_set_updated_at
  BEFORE UPDATE ON supplier_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER core_returns_set_updated_at
  BEFORE UPDATE ON core_returns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER promotion_redemptions_set_updated_at
  BEFORE UPDATE ON promotion_redemptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

COMMIT;
