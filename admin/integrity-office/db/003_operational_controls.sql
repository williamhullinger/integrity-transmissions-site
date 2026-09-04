BEGIN;

ALTER TABLE user_roles ADD COLUMN revocation_reason text;
UPDATE user_roles SET revocation_reason = reason WHERE revoked_at IS NOT NULL;
ALTER TABLE user_roles ADD CONSTRAINT role_revocation_reason_complete CHECK (
  (revoked_at IS NULL AND revocation_reason IS NULL)
  OR (revoked_at IS NOT NULL AND revocation_reason IS NOT NULL)
);

CREATE UNIQUE INDEX staff_users_email_idx ON staff_users (lower(email));

CREATE UNIQUE INDEX supplier_orders_one_per_order_idx ON supplier_orders (order_id);

ALTER TABLE checkout_sessions ADD COLUMN stripe_created_at timestamptz;
UPDATE checkout_sessions SET stripe_created_at = created_at;
ALTER TABLE checkout_sessions ALTER COLUMN stripe_created_at SET NOT NULL;

ALTER TABLE supplier_orders ADD CONSTRAINT supplier_order_approval_complete CHECK (
  (approved_at IS NULL AND approved_by IS NULL)
  OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)
);
ALTER TABLE supplier_orders ADD CONSTRAINT supplier_order_reference_complete CHECK (
  ordered_at IS NULL OR supplier_order_reference IS NOT NULL
);
ALTER TABLE supplier_orders ADD CONSTRAINT supplier_order_shipment_complete CHECK (
  (shipped_at IS NULL AND carrier IS NULL AND tracking_number IS NULL)
  OR (shipped_at IS NOT NULL AND carrier IS NOT NULL AND tracking_number IS NOT NULL)
);

CREATE FUNCTION enforce_promotion_separation_of_duties() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.approved_by IS NOT NULL AND NEW.approved_by = NEW.created_by THEN
    RAISE EXCEPTION 'Promotion creator cannot approve the same promotion';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_separation_of_duties
  BEFORE INSERT OR UPDATE OF approved_by, created_by ON promotion_codes
  FOR EACH ROW EXECUTE FUNCTION enforce_promotion_separation_of_duties();

CREATE TABLE refund_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid NOT NULL REFERENCES payment_transactions(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  category text NOT NULL CHECK (category IN (
    'transmission', 'freight', 'sales_tax', 'core_deposit', 'other'
  )),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  classified_by uuid NOT NULL REFERENCES staff_users(id),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_transaction_id, category)
);
CREATE INDEX refund_allocations_order_idx ON refund_allocations (order_id, created_at DESC);
CREATE UNIQUE INDEX refund_allocations_one_core_per_order_idx
  ON refund_allocations (order_id) WHERE category = 'core_deposit';

ALTER TABLE stripe_reconciliation_runs ADD COLUMN amount_mismatches jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE stripe_reconciliation_runs ADD COLUMN idempotency_key text;
ALTER TABLE stripe_reconciliation_runs ADD COLUMN request_sha256 char(64)
  CHECK (request_sha256 IS NULL OR request_sha256 ~ '^[a-f0-9]{64}$');
ALTER TABLE stripe_reconciliation_runs ADD CONSTRAINT reconciliation_amount_mismatches_array CHECK (
  jsonb_typeof(amount_mismatches) = 'array'
);
CREATE UNIQUE INDEX stripe_reconciliation_runs_idempotency_idx
  ON stripe_reconciliation_runs (idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE webhook_events ADD COLUMN manual_requeues integer NOT NULL DEFAULT 0
  CHECK (manual_requeues >= 0);
ALTER TABLE notification_outbox ADD COLUMN manual_requeues integer NOT NULL DEFAULT 0
  CHECK (manual_requeues >= 0);

CREATE TABLE payment_disputes (
  stripe_dispute_id text PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  stripe_charge_id text NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency char(3) NOT NULL,
  status text NOT NULL CHECK (status IN (
    'warning_needs_response', 'warning_under_review', 'warning_closed',
    'needs_response', 'under_review', 'won', 'lost', 'prevented'
  )),
  reason text,
  evidence_due_at timestamptz,
  opened_at timestamptz NOT NULL,
  closed_at timestamptz,
  last_event_id text NOT NULL,
  last_event_created_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_dispute_resolution CHECK (
    (status IN ('won', 'lost', 'warning_closed', 'prevented') AND closed_at IS NOT NULL)
    OR (status NOT IN ('won', 'lost', 'warning_closed', 'prevented') AND closed_at IS NULL)
  )
);
CREATE INDEX payment_disputes_order_idx ON payment_disputes (order_id, opened_at DESC);
CREATE INDEX payment_disputes_work_idx ON payment_disputes (status, evidence_due_at);
INSERT INTO ledger_accounts (code, name, account_type)
VALUES ('6300', 'Dispute losses and fees', 'expense')
ON CONFLICT (code) DO NOTHING;
CREATE TRIGGER payment_disputes_set_updated_at
  BEFORE UPDATE ON payment_disputes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payment_disputes_no_delete
  BEFORE DELETE ON payment_disputes
  FOR EACH ROW EXECUTE FUNCTION reject_record_delete();

CREATE FUNCTION enforce_refund_allocation_total() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_id uuid := COALESCE(NEW.payment_transaction_id, OLD.payment_transaction_id);
  refund_amount bigint;
  refund_order_id uuid;
  allocated_amount bigint;
  allocation_order_count bigint;
BEGIN
  SELECT amount_cents, order_id INTO refund_amount, refund_order_id
    FROM payment_transactions
    WHERE id = target_id AND transaction_type = 'refund' AND status = 'succeeded';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Refund allocations require a successful refund transaction';
  END IF;
  SELECT COALESCE(sum(amount_cents), 0), count(DISTINCT order_id)
    INTO allocated_amount, allocation_order_count
    FROM refund_allocations
    WHERE payment_transaction_id = target_id;
  IF allocated_amount <> refund_amount OR allocation_order_count <> 1
     OR EXISTS (
       SELECT 1 FROM refund_allocations
       WHERE payment_transaction_id = target_id AND order_id <> refund_order_id
     ) THEN
    RAISE EXCEPTION 'Refund allocations must exactly match the refund transaction and order';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER refund_allocations_must_balance
  AFTER INSERT OR UPDATE OR DELETE ON refund_allocations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION enforce_refund_allocation_total();

CREATE TRIGGER refund_allocations_append_only
  BEFORE UPDATE OR DELETE ON refund_allocations
  FOR EACH ROW EXECUTE FUNCTION reject_record_change();

REVOKE ALL ON refund_allocations FROM PUBLIC;
REVOKE ALL ON payment_disputes FROM PUBLIC;
REVOKE ALL ON FUNCTION enforce_promotion_separation_of_duties() FROM PUBLIC;
REVOKE ALL ON FUNCTION enforce_refund_allocation_total() FROM PUBLIC;

COMMIT;
