BEGIN;

-- Migration 005 introduced the nationwide domains. This migration makes them
-- safe for concurrent staff workflows without rewriting the published history.

ALTER TABLE suppliers
  ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE catalog_products
  ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE supplier_purchase_orders
  ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  ADD COLUMN created_by uuid REFERENCES staff_users(id);
ALTER TABLE supplier_purchase_orders
  ADD CONSTRAINT supplier_purchase_order_separation_of_duties
    CHECK (approved_by IS NULL OR created_by IS NULL OR approved_by <> created_by);
ALTER TABLE fulfillment_shipments
  ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE warranty_claims
  ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  ADD COLUMN authorized_replacement_quantity integer NOT NULL DEFAULT 0
    CHECK (authorized_replacement_quantity >= 0 AND authorized_replacement_quantity <= 100);

ALTER TABLE order_items
  ADD COLUMN catalog_price_version_id uuid REFERENCES catalog_price_versions(id),
  ADD COLUMN supplier_id_snapshot uuid REFERENCES suppliers(id),
  ADD CONSTRAINT order_items_order_id_id_unique UNIQUE (order_id, id),
  ADD CONSTRAINT order_items_single_core_unit CHECK (core_deposit_cents = 0 OR quantity = 1);

-- Existing storefront checkouts are one-unit orders. Materialize their immutable
-- quote snapshot as the first order item so purchasing and fulfillment have a
-- line-level authority after activation.
INSERT INTO order_items (
  order_id, line_number, kind, integrity_sku_snapshot, supplier_sku_snapshot,
  title_snapshot, quantity, unit_retail_cents, unit_supplier_cost_cents,
  core_deposit_cents, fitment_snapshot, warranty_snapshot, configuration_snapshot
)
SELECT
  o.id, 1, 'transmission'::product_kind, qv.selection_id,
  NULLIF(qv.supplier_snapshot ->> 'partUid', ''),
  concat_ws(' · ', qv.transmission_family, qv.package_name), 1,
  qv.customer_unit_price_cents, qv.supplier_unit_cost_cents,
  qv.core_deposit_cents,
  jsonb_build_object('vin', v.vin, 'application', qv.transmission_family),
  jsonb_build_object('description', qv.warranty_text),
  qv.supplier_snapshot
FROM orders o
JOIN vehicles v ON v.id = o.vehicle_id
JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
ON CONFLICT (order_id, line_number) DO NOTHING;

ALTER TABLE supplier_purchase_orders
  ADD CONSTRAINT supplier_purchase_orders_id_order_supplier_unique
    UNIQUE (id, order_id, supplier_id),
  ADD CONSTRAINT supplier_purchase_orders_id_order_unique UNIQUE (id, order_id);

ALTER TABLE supplier_purchase_order_lines
  ADD COLUMN order_id uuid,
  ADD COLUMN supplier_id uuid;
UPDATE supplier_purchase_order_lines pol
SET order_id = po.order_id, supplier_id = po.supplier_id
FROM supplier_purchase_orders po
WHERE po.id = pol.purchase_order_id;
ALTER TABLE supplier_purchase_order_lines
  ALTER COLUMN order_id SET NOT NULL,
  ALTER COLUMN supplier_id SET NOT NULL,
  ADD CONSTRAINT supplier_purchase_order_lines_po_scope_fk
    FOREIGN KEY (purchase_order_id, order_id, supplier_id)
    REFERENCES supplier_purchase_orders(id, order_id, supplier_id),
  ADD CONSTRAINT supplier_purchase_order_lines_item_scope_fk
    FOREIGN KEY (order_id, order_item_id) REFERENCES order_items(order_id, id),
  ADD CONSTRAINT supplier_purchase_order_lines_one_item_per_po
    UNIQUE (purchase_order_id, order_item_id),
  ADD CONSTRAINT supplier_purchase_order_lines_provenance_unique
    UNIQUE (id, purchase_order_id, order_item_id, order_id);

CREATE TABLE purchase_order_state_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES supplier_purchase_orders(id),
  from_state purchase_order_state,
  to_state purchase_order_state NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX purchase_order_state_history_po_idx
  ON purchase_order_state_history (purchase_order_id, created_at DESC);

ALTER TABLE fulfillment_shipments
  ADD CONSTRAINT fulfillment_shipments_id_order_unique UNIQUE (id, order_id),
  ADD CONSTRAINT fulfillment_shipments_id_order_po_unique UNIQUE (id, order_id, purchase_order_id),
  ADD CONSTRAINT fulfillment_shipments_po_scope_fk
    FOREIGN KEY (purchase_order_id, order_id)
    REFERENCES supplier_purchase_orders(id, order_id);

ALTER TABLE shipment_items
  ADD COLUMN order_id uuid,
  ADD COLUMN purchase_order_id uuid,
  ADD COLUMN purchase_order_line_id uuid;
UPDATE shipment_items si
SET order_id = fs.order_id, purchase_order_id = fs.purchase_order_id
FROM fulfillment_shipments fs
WHERE fs.id = si.shipment_id;
UPDATE shipment_items si
SET purchase_order_line_id = pol.id
FROM supplier_purchase_order_lines pol
WHERE si.purchase_order_id = pol.purchase_order_id
  AND si.order_item_id = pol.order_item_id
  AND si.order_id = pol.order_id;
ALTER TABLE shipment_items
  ALTER COLUMN order_id SET NOT NULL,
  ADD CONSTRAINT shipment_items_shipment_scope_fk
    FOREIGN KEY (shipment_id, order_id, purchase_order_id)
    REFERENCES fulfillment_shipments(id, order_id, purchase_order_id),
  ADD CONSTRAINT shipment_items_order_item_scope_fk
    FOREIGN KEY (order_id, order_item_id) REFERENCES order_items(order_id, id),
  ADD CONSTRAINT shipment_items_po_line_provenance_fk
    FOREIGN KEY (purchase_order_line_id, purchase_order_id, order_item_id, order_id)
    REFERENCES supplier_purchase_order_lines(id, purchase_order_id, order_item_id, order_id);

ALTER TABLE warranty_claims
  DROP CONSTRAINT warranty_claims_order_item_id_fkey,
  ADD CONSTRAINT warranty_claims_order_item_scope_fk
    FOREIGN KEY (order_id, order_item_id) REFERENCES order_items(order_id, id),
  ADD CONSTRAINT warranty_claims_id_order_unique UNIQUE (id, order_id);

ALTER TABLE fulfillment_shipments
  ADD COLUMN warranty_claim_id uuid,
  ADD CONSTRAINT fulfillment_shipments_warranty_scope_fk
    FOREIGN KEY (warranty_claim_id, order_id) REFERENCES warranty_claims(id, order_id);

CREATE TABLE shipment_state_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES fulfillment_shipments(id),
  from_state text,
  to_state text NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shipment_state_history_shipment_idx
  ON shipment_state_history (shipment_id, created_at DESC);

CREATE TABLE warranty_claim_state_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_claim_id uuid NOT NULL REFERENCES warranty_claims(id),
  from_state warranty_claim_state,
  to_state warranty_claim_state NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX warranty_claim_state_history_claim_idx
  ON warranty_claim_state_history (warranty_claim_id, created_at DESC);

CREATE TABLE order_item_core_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  deposit_cents bigint NOT NULL CHECK (deposit_cents >= 0),
  state core_state NOT NULL DEFAULT 'awaiting_return',
  due_at timestamptz,
  received_quantity integer NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  accepted_quantity integer NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
  refunded_cents bigint NOT NULL DEFAULT 0 CHECK (refunded_cents >= 0),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_item_id),
  FOREIGN KEY (order_id, order_item_id) REFERENCES order_items(order_id, id),
  CONSTRAINT core_obligation_quantities
    CHECK (accepted_quantity <= received_quantity AND received_quantity <= quantity),
  CONSTRAINT core_obligation_refund_cap CHECK (refunded_cents <= deposit_cents)
);
CREATE INDEX order_item_core_obligations_queue_idx
  ON order_item_core_obligations (state, due_at, updated_at);
CREATE TRIGGER order_item_core_obligations_set_updated_at
BEFORE UPDATE ON order_item_core_obligations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO order_item_core_obligations (
  order_id, order_item_id, quantity, deposit_cents, state, due_at,
  received_quantity, accepted_quantity, refunded_cents
)
SELECT
  oi.order_id, oi.id, oi.quantity, oi.core_deposit_cents, o.core_status, cr.due_at,
  CASE WHEN cr.received_at IS NULL THEN 0 ELSE oi.quantity END,
  CASE WHEN cr.accepted_at IS NULL THEN 0 ELSE oi.quantity END,
  CASE WHEN o.core_status = 'refunded' THEN oi.core_deposit_cents ELSE 0 END
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
LEFT JOIN core_returns cr ON cr.order_id = oi.order_id
WHERE oi.core_deposit_cents > 0
ON CONFLICT (order_item_id) DO NOTHING;

CREATE FUNCTION enforce_purchase_order_line_quantity() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  ordered_quantity integer;
  allocated_quantity integer;
BEGIN
  SELECT quantity INTO ordered_quantity
  FROM order_items
  WHERE id = NEW.order_item_id AND order_id = NEW.order_id
  FOR UPDATE;

  SELECT COALESCE(sum(pol.quantity), 0) INTO allocated_quantity
  FROM supplier_purchase_order_lines pol
  JOIN supplier_purchase_orders po ON po.id = pol.purchase_order_id
  WHERE pol.order_item_id = NEW.order_item_id
    AND pol.id <> NEW.id
    AND po.state <> 'canceled';

  IF ordered_quantity IS NULL OR allocated_quantity + NEW.quantity > ordered_quantity THEN
    RAISE EXCEPTION 'purchase order quantity exceeds the order item quantity';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER supplier_purchase_order_line_quantity
BEFORE INSERT OR UPDATE ON supplier_purchase_order_lines
FOR EACH ROW EXECUTE FUNCTION enforce_purchase_order_line_quantity();

CREATE FUNCTION enforce_shipment_item_integrity() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  shipment_direction text;
  shipment_status text;
  shipment_po uuid;
  shipment_claim uuid;
  ordered_quantity integer;
  shipped_quantity integer;
  authorized_quantity integer;
BEGIN
  SELECT direction, status, purchase_order_id, warranty_claim_id
    INTO shipment_direction, shipment_status, shipment_po, shipment_claim
  FROM fulfillment_shipments
  WHERE id = NEW.shipment_id AND order_id = NEW.order_id
  FOR UPDATE;

  SELECT quantity INTO ordered_quantity
  FROM order_items
  WHERE id = NEW.order_item_id AND order_id = NEW.order_id
  FOR UPDATE;

  IF shipment_direction IS NULL OR ordered_quantity IS NULL THEN
    RAISE EXCEPTION 'shipment item does not belong to the shipment order';
  END IF;

  IF shipment_direction = 'outbound' THEN
    IF shipment_po IS NULL OR NEW.purchase_order_line_id IS NULL OR NEW.purchase_order_id IS DISTINCT FROM shipment_po THEN
      RAISE EXCEPTION 'outbound shipment item requires exact purchase order line provenance';
    END IF;
    SELECT COALESCE(sum(si.quantity), 0) INTO shipped_quantity
    FROM shipment_items si
    JOIN fulfillment_shipments fs ON fs.id = si.shipment_id
    WHERE si.order_item_id = NEW.order_item_id
      AND (si.shipment_id, si.order_item_id) <> (NEW.shipment_id, NEW.order_item_id)
      AND fs.direction = 'outbound' AND fs.status <> 'canceled';
    IF shipped_quantity + NEW.quantity > ordered_quantity THEN
      RAISE EXCEPTION 'outbound shipment quantity exceeds the order item quantity';
    END IF;
  ELSIF shipment_direction = 'replacement' THEN
    IF shipment_claim IS NULL THEN
      RAISE EXCEPTION 'replacement shipment requires an authorized warranty claim';
    END IF;
    SELECT authorized_replacement_quantity INTO authorized_quantity
    FROM warranty_claims
    WHERE id = shipment_claim AND order_id = NEW.order_id
      AND order_item_id = NEW.order_item_id
      AND state IN ('authorized', 'repairing', 'replacement_shipping', 'reimbursing', 'resolved');
    SELECT COALESCE(sum(si.quantity), 0) INTO shipped_quantity
    FROM shipment_items si
    JOIN fulfillment_shipments fs ON fs.id = si.shipment_id
    WHERE si.order_item_id = NEW.order_item_id
      AND (si.shipment_id, si.order_item_id) <> (NEW.shipment_id, NEW.order_item_id)
      AND fs.direction = 'replacement' AND fs.status <> 'canceled';
    IF authorized_quantity IS NULL OR shipped_quantity + NEW.quantity > authorized_quantity THEN
      RAISE EXCEPTION 'replacement shipment quantity exceeds warranty authorization';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER shipment_item_integrity
BEFORE INSERT OR UPDATE ON shipment_items
FOR EACH ROW EXECUTE FUNCTION enforce_shipment_item_integrity();

CREATE FUNCTION enforce_warranty_provenance() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_item_id IS NOT NULL THEN
    PERFORM 1 FROM order_items
    WHERE id = NEW.order_item_id AND order_id = NEW.order_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'warranty item does not belong to the claim order';
    END IF;
  END IF;

  IF NEW.order_item_id IS NOT NULL AND NEW.supplier_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM supplier_purchase_order_lines pol
    JOIN supplier_purchase_orders po ON po.id = pol.purchase_order_id
    WHERE pol.order_id = NEW.order_id AND pol.order_item_id = NEW.order_item_id
      AND po.supplier_id = NEW.supplier_id AND po.state <> 'canceled'
  ) THEN
    RAISE EXCEPTION 'warranty supplier does not match purchase provenance';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER warranty_claim_provenance
BEFORE INSERT OR UPDATE OF order_id, order_item_id, supplier_id ON warranty_claims
FOR EACH ROW EXECUTE FUNCTION enforce_warranty_provenance();

ALTER TABLE office_tasks
  ADD COLUMN customer_id uuid REFERENCES customers(id),
  ADD COLUMN order_id uuid REFERENCES orders(id),
  ADD COLUMN required_capability staff_role NOT NULL DEFAULT 'operations',
  ADD COLUMN deduplication_key text;
CREATE UNIQUE INDEX office_tasks_active_deduplication_idx
  ON office_tasks (deduplication_key)
  WHERE deduplication_key IS NOT NULL AND state NOT IN ('completed', 'canceled');

CREATE TABLE office_task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_task_id uuid NOT NULL REFERENCES office_tasks(id),
  from_state office_task_state,
  to_state office_task_state NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX office_task_history_task_idx ON office_task_history (office_task_id, created_at DESC);

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

COMMIT;
