BEGIN;

ALTER TABLE promotion_codes ALTER COLUMN minimum_margin_cents SET DEFAULT 35000;

CREATE UNIQUE INDEX vehicles_customer_vin_idx ON vehicles (customer_id, vin);

ALTER TABLE quote_versions ADD COLUMN list_unit_price_cents bigint;
UPDATE quote_versions SET list_unit_price_cents = customer_unit_price_cents;
ALTER TABLE quote_versions ALTER COLUMN list_unit_price_cents SET NOT NULL;
ALTER TABLE quote_versions ADD COLUMN promotion_code citext REFERENCES promotion_codes(code);
ALTER TABLE quote_versions ADD COLUMN promotion_discount_cents bigint NOT NULL DEFAULT 0
  CHECK (promotion_discount_cents >= 0);
ALTER TABLE quote_versions ADD CONSTRAINT quote_promotion_math CHECK (
  list_unit_price_cents = customer_unit_price_cents + promotion_discount_cents
);
ALTER TABLE quote_versions ADD CONSTRAINT quote_promotion_presence CHECK (
  (promotion_code IS NULL AND promotion_discount_cents = 0)
  OR (promotion_code IS NOT NULL AND promotion_discount_cents > 0)
);

CREATE TABLE promotion_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES promotion_codes(id),
  checkout_attempt_key text NOT NULL UNIQUE,
  customer_email citext NOT NULL,
  list_unit_price_cents bigint NOT NULL CHECK (list_unit_price_cents > 0),
  freight_charged_cents bigint NOT NULL CHECK (freight_charged_cents >= 0),
  supplier_unit_cost_cents bigint NOT NULL CHECK (supplier_unit_cost_cents > 0),
  supplier_freight_cost_cents bigint NOT NULL CHECK (supplier_freight_cost_cents >= 0),
  discount_cents bigint NOT NULL CHECK (discount_cents > 0),
  status text NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'consumed', 'released')),
  reserved_until timestamptz NOT NULL,
  consumed_order_id uuid REFERENCES orders(id),
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotion_reservation_outcome CHECK (
    (status = 'reserved' AND consumed_order_id IS NULL AND released_at IS NULL)
    OR (status = 'consumed' AND consumed_order_id IS NOT NULL AND released_at IS NULL)
    OR (status = 'released' AND consumed_order_id IS NULL AND released_at IS NOT NULL)
  )
);
CREATE INDEX promotion_reservations_capacity_idx
  ON promotion_reservations (promotion_id, status, reserved_until);
CREATE INDEX promotion_reservations_customer_idx
  ON promotion_reservations (promotion_id, customer_email, status, reserved_until);

CREATE OR REPLACE FUNCTION enforce_promotion_redemption() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  promotion promotion_codes%ROWTYPE;
  total_uses bigint;
  customer_uses bigint;
  merchandise_cents bigint;
  supplier_cost_cents bigint;
  expected_discount_cents bigint;
  evaluation_at timestamptz := COALESCE(NEW.applied_at, now());
BEGIN
  IF NEW.status NOT IN ('reserved', 'applied') THEN RETURN NEW; END IF;
  IF NEW.status = 'reserved' THEN
    IF NEW.reserved_until <= now() THEN
      RAISE EXCEPTION 'Promotion reservation must expire in the future';
    END IF;
  ELSE
    IF TG_OP <> 'UPDATE' OR OLD.status <> 'reserved' THEN
      RAISE EXCEPTION 'A promotion can be applied only from a reserved redemption';
    END IF;
  END IF;
  SELECT * INTO promotion FROM promotion_codes WHERE id = NEW.promotion_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Promotion does not exist'; END IF;
  IF NEW.status = 'reserved'
     AND (NOT promotion.active OR promotion.approved_at IS NULL OR promotion.disabled_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Promotion is not approved and active';
  END IF;
  IF NEW.status = 'reserved'
     AND (evaluation_at < promotion.starts_at OR (promotion.ends_at IS NOT NULL AND evaluation_at >= promotion.ends_at)) THEN
    RAISE EXCEPTION 'Promotion is outside its active date range';
  END IF;
  SELECT count(*) INTO total_uses FROM promotion_redemptions
    WHERE promotion_id = NEW.promotion_id AND order_id <> NEW.order_id
      AND status IN ('reserved', 'applied');
  IF promotion.max_redemptions IS NOT NULL AND total_uses >= promotion.max_redemptions THEN
    RAISE EXCEPTION 'Promotion redemption limit has been reached';
  END IF;
  SELECT count(*) INTO customer_uses FROM promotion_redemptions
    WHERE promotion_id = NEW.promotion_id AND customer_id = NEW.customer_id AND order_id <> NEW.order_id
      AND status IN ('reserved', 'applied');
  IF customer_uses >= promotion.max_redemptions_per_customer THEN
    RAISE EXCEPTION 'Customer promotion redemption limit has been reached';
  END IF;
  SELECT qv.list_unit_price_cents + qv.freight_charged_cents,
         qv.supplier_unit_cost_cents + qv.supplier_freight_cost_cents
    INTO merchandise_cents, supplier_cost_cents
    FROM orders o JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
    WHERE o.id = NEW.order_id AND o.customer_id = NEW.customer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Promotion order and customer do not match'; END IF;
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

CREATE TABLE freight_quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id),
  order_id uuid REFERENCES orders(id),
  vin char(17),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  destination_postal_code text NOT NULL,
  destination_region text NOT NULL,
  location_type text NOT NULL,
  requested_selection_id text,
  requested_package text,
  failure_code text NOT NULL,
  failure_request_id text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'contacted', 'quoted', 'converted', 'closed')),
  assigned_to uuid REFERENCES staff_users(id),
  next_follow_up_at timestamptz,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT freight_request_vin_format CHECK (vin IS NULL OR vin ~ '^[A-HJ-NPR-Z0-9]{17}$'),
  CONSTRAINT freight_request_resolution CHECK (
    (status IN ('converted', 'closed') AND resolved_at IS NOT NULL AND resolution_note IS NOT NULL)
    OR (status NOT IN ('converted', 'closed') AND resolved_at IS NULL)
  )
);
CREATE INDEX freight_quote_requests_queue_idx
  ON freight_quote_requests (status, next_follow_up_at NULLS FIRST, created_at);
CREATE INDEX freight_quote_requests_contact_idx
  ON freight_quote_requests (lower(email), phone);

CREATE TABLE stripe_reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  stripe_payment_count integer NOT NULL CHECK (stripe_payment_count >= 0),
  stripe_payment_cents bigint NOT NULL CHECK (stripe_payment_cents >= 0),
  office_payment_count integer NOT NULL CHECK (office_payment_count >= 0),
  office_payment_cents bigint NOT NULL CHECK (office_payment_cents >= 0),
  unmatched_stripe_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  unmatched_office_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  initiated_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reconciliation_period_order CHECK (period_end > period_start),
  CONSTRAINT reconciliation_stripe_ids_array CHECK (jsonb_typeof(unmatched_stripe_ids) = 'array'),
  CONSTRAINT reconciliation_office_ids_array CHECK (jsonb_typeof(unmatched_office_ids) = 'array')
);
CREATE INDEX stripe_reconciliation_runs_created_idx
  ON stripe_reconciliation_runs (created_at DESC);

CREATE TRIGGER freight_quote_requests_set_updated_at
  BEFORE UPDATE ON freight_quote_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER freight_quote_requests_no_delete
  BEFORE DELETE ON freight_quote_requests
  FOR EACH ROW EXECUTE FUNCTION reject_record_delete();

CREATE TRIGGER stripe_reconciliation_runs_append_only
  BEFORE UPDATE OR DELETE ON stripe_reconciliation_runs
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();

CREATE TRIGGER promotion_reservations_set_updated_at
  BEFORE UPDATE ON promotion_reservations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER promotion_reservations_no_delete
  BEFORE DELETE ON promotion_reservations
  FOR EACH ROW EXECUTE FUNCTION reject_record_delete();

REVOKE ALL ON freight_quote_requests, stripe_reconciliation_runs, promotion_reservations FROM PUBLIC;

COMMIT;
