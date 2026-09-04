BEGIN;

CREATE UNIQUE INDEX vehicles_customer_vin_idx ON vehicles (customer_id, vin);

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

REVOKE ALL ON freight_quote_requests, stripe_reconciliation_runs FROM PUBLIC;

COMMIT;
