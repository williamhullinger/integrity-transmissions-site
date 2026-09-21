BEGIN;

-- Generalized product, sales and operations records for nationwide powertrain sales.
-- Existing ACE checkout records remain valid while new product categories are introduced.

CREATE TYPE product_kind AS ENUM (
  'transmission', 'engine', 'transfer_case', 'differential', 'accessory', 'service'
);
CREATE TYPE catalog_record_status AS ENUM ('draft', 'active', 'paused', 'retired');
CREATE TYPE lead_state AS ENUM ('new', 'assigned', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'closed');
CREATE TYPE sales_quote_state AS ENUM ('draft', 'pending_review', 'sent', 'accepted', 'declined', 'expired', 'converted', 'canceled');
CREATE TYPE office_task_state AS ENUM ('open', 'in_progress', 'blocked', 'completed', 'canceled');
CREATE TYPE office_task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE purchase_order_state AS ENUM ('draft', 'approved', 'submitted', 'acknowledged', 'backordered', 'partially_shipped', 'shipped', 'received', 'canceled', 'closed');
CREATE TYPE warranty_claim_state AS ENUM ('intake', 'evidence_needed', 'submitted', 'authorized', 'denied', 'repairing', 'replacement_shipping', 'reimbursing', 'resolved', 'closed');
CREATE TYPE risk_review_decision AS ENUM ('pending', 'approved', 'held', 'rejected', 'canceled');

CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext NOT NULL UNIQUE,
  display_name text NOT NULL,
  ordering_method text,
  warranty_terms_reference text,
  core_terms_reference text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_code_format CHECK (code::text ~ '^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$')
);

CREATE TABLE supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  contact_type text NOT NULL CHECK (contact_type IN ('sales', 'orders', 'freight', 'cores', 'warranty', 'accounting', 'other')),
  name text,
  email text,
  phone text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_contact_method CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integrity_sku citext NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  supplier_sku text NOT NULL,
  kind product_kind NOT NULL,
  title text NOT NULL,
  manufacturer_brand text,
  manufacturer_part_number text,
  gtin text,
  condition text NOT NULL DEFAULT 'remanufactured' CHECK (condition IN ('remanufactured', 'new', 'used')),
  application_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(application_data) = 'object'),
  package_contents jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(package_contents) = 'array'),
  warranty_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(warranty_data) = 'object'),
  shipping_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(shipping_data) = 'object'),
  image_provenance jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(image_provenance) = 'array'),
  status catalog_record_status NOT NULL DEFAULT 'draft',
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, supplier_sku),
  CONSTRAINT catalog_product_gtin_format CHECK (gtin IS NULL OR gtin ~ '^[0-9]{8,14}$'),
  CONSTRAINT active_catalog_product_verified CHECK (status <> 'active' OR last_verified_at IS NOT NULL)
);

CREATE TABLE catalog_price_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_product_id uuid NOT NULL REFERENCES catalog_products(id),
  supplier_unit_cost_cents bigint NOT NULL CHECK (supplier_unit_cost_cents >= 0),
  supplier_core_deposit_cents bigint NOT NULL DEFAULT 0 CHECK (supplier_core_deposit_cents >= 0),
  suggested_retail_cents bigint CHECK (suggested_retail_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'usd',
  availability_code text NOT NULL,
  availability_text text NOT NULL,
  source_reference text NOT NULL,
  verified_at timestamptz NOT NULL,
  valid_through timestamptz,
  recorded_by uuid REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_price_validity CHECK (valid_through IS NULL OR valid_through > verified_at)
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  line_number integer NOT NULL CHECK (line_number > 0),
  catalog_product_id uuid REFERENCES catalog_products(id),
  kind product_kind NOT NULL,
  integrity_sku_snapshot text NOT NULL,
  supplier_sku_snapshot text,
  title_snapshot text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 100),
  unit_retail_cents bigint NOT NULL CHECK (unit_retail_cents >= 0),
  unit_supplier_cost_cents bigint CHECK (unit_supplier_cost_cents >= 0),
  core_deposit_cents bigint NOT NULL DEFAULT 0 CHECK (core_deposit_cents >= 0),
  fitment_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(fitment_snapshot) = 'object'),
  warranty_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(warranty_snapshot) = 'object'),
  configuration_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(configuration_snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, line_number)
);

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id),
  contact_name text NOT NULL,
  contact_email text,
  contact_phone text,
  organization_name text,
  product_interest product_kind,
  vehicle_summary jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(vehicle_summary) = 'object'),
  source text NOT NULL,
  landing_page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer_host text,
  state lead_state NOT NULL DEFAULT 'new',
  priority office_task_priority NOT NULL DEFAULT 'normal',
  estimated_value_cents bigint CHECK (estimated_value_cents >= 0),
  assigned_to uuid REFERENCES staff_users(id),
  next_follow_up_at timestamptz,
  lost_reason text,
  won_order_id uuid REFERENCES orders(id),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_contact_method CHECK (contact_email IS NOT NULL OR contact_phone IS NOT NULL),
  CONSTRAINT lead_lost_reason CHECK ((state = 'lost') = (lost_reason IS NOT NULL)),
  CONSTRAINT lead_won_order CHECK ((state = 'won') = (won_order_id IS NOT NULL))
);

CREATE TABLE lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id),
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'assigned', 'call', 'email', 'text', 'note', 'status_change', 'quote', 'converted', 'closed')),
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_by uuid REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sales_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_quote_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  lead_id uuid REFERENCES leads(id),
  customer_id uuid REFERENCES customers(id),
  current_version integer NOT NULL DEFAULT 1 CHECK (current_version > 0),
  state sales_quote_state NOT NULL DEFAULT 'draft',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  converted_order_id uuid REFERENCES orders(id),
  created_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_quote_party CHECK (lead_id IS NOT NULL OR customer_id IS NOT NULL),
  CONSTRAINT sales_quote_acceptance CHECK ((state IN ('accepted', 'converted')) = (accepted_at IS NOT NULL)),
  CONSTRAINT sales_quote_conversion CHECK ((state = 'converted') = (converted_order_id IS NOT NULL))
);

CREATE TABLE sales_quote_versions (
  sales_quote_id uuid NOT NULL REFERENCES sales_quotes(id),
  version integer NOT NULL CHECK (version > 0),
  currency char(3) NOT NULL DEFAULT 'usd',
  freight_cents bigint NOT NULL DEFAULT 0 CHECK (freight_cents >= 0),
  tax_estimate_cents bigint NOT NULL DEFAULT 0 CHECK (tax_estimate_cents >= 0),
  discount_cents bigint NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  terms_reference text NOT NULL,
  terms_sha256 char(64) NOT NULL CHECK (terms_sha256 ~ '^[a-f0-9]{64}$'),
  customer_message text,
  internal_reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sales_quote_id, version)
);
ALTER TABLE sales_quotes ADD CONSTRAINT sales_quotes_current_version_fk
  FOREIGN KEY (id, current_version) REFERENCES sales_quote_versions(sales_quote_id, version)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE sales_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_quote_id uuid NOT NULL,
  version integer NOT NULL,
  line_number integer NOT NULL CHECK (line_number > 0),
  catalog_product_id uuid REFERENCES catalog_products(id),
  kind product_kind NOT NULL,
  sku_snapshot text NOT NULL,
  title_snapshot text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 100),
  unit_retail_cents bigint NOT NULL CHECK (unit_retail_cents >= 0),
  unit_supplier_cost_cents bigint CHECK (unit_supplier_cost_cents >= 0),
  core_deposit_cents bigint NOT NULL DEFAULT 0 CHECK (core_deposit_cents >= 0),
  fitment_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(fitment_snapshot) = 'object'),
  warranty_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(warranty_snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (sales_quote_id, version) REFERENCES sales_quote_versions(sales_quote_id, version),
  UNIQUE (sales_quote_id, version, line_number)
);

CREATE TABLE office_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL,
  title text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'quote', 'order', 'customer', 'purchase_order', 'shipment', 'core_return', 'warranty_claim', 'dispute', 'system')),
  entity_id uuid,
  state office_task_state NOT NULL DEFAULT 'open',
  priority office_task_priority NOT NULL DEFAULT 'normal',
  assigned_to uuid REFERENCES staff_users(id),
  due_at timestamptz,
  blocked_reason text,
  completion_evidence text,
  completed_by uuid REFERENCES staff_users(id),
  completed_at timestamptz,
  created_by uuid REFERENCES staff_users(id),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT office_task_completion CHECK (
    (state = 'completed') = (completed_at IS NOT NULL AND completed_by IS NOT NULL AND completion_evidence IS NOT NULL)
  ),
  CONSTRAINT office_task_block CHECK ((state = 'blocked') = (blocked_reason IS NOT NULL))
);

CREATE TABLE risk_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  stripe_risk_level text,
  stripe_risk_score integer CHECK (stripe_risk_score BETWEEN 0 AND 100),
  signals jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(signals) = 'array'),
  decision risk_review_decision NOT NULL,
  reason text NOT NULL,
  reviewed_by uuid NOT NULL REFERENCES staff_users(id),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE supplier_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  purchase_order_number text NOT NULL UNIQUE,
  supplier_order_reference text,
  state purchase_order_state NOT NULL DEFAULT 'draft',
  currency char(3) NOT NULL DEFAULT 'usd',
  merchandise_cents bigint NOT NULL DEFAULT 0 CHECK (merchandise_cents >= 0),
  freight_cents bigint NOT NULL DEFAULT 0 CHECK (freight_cents >= 0),
  tax_cents bigint NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  approved_by uuid REFERENCES staff_users(id),
  approved_at timestamptz,
  submitted_at timestamptz,
  acknowledged_at timestamptz,
  estimated_ship_at timestamptz,
  canceled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_po_approval CHECK ((approved_at IS NULL) = (approved_by IS NULL)),
  CONSTRAINT supplier_po_cancel CHECK ((state = 'canceled') = (canceled_at IS NOT NULL AND cancellation_reason IS NOT NULL))
);

CREATE TABLE supplier_purchase_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES supplier_purchase_orders(id),
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  line_number integer NOT NULL CHECK (line_number > 0),
  supplier_sku_snapshot text NOT NULL,
  description text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 100),
  unit_cost_cents bigint NOT NULL CHECK (unit_cost_cents >= 0),
  core_charge_cents bigint NOT NULL DEFAULT 0 CHECK (core_charge_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (purchase_order_id, line_number)
);

CREATE TABLE fulfillment_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  purchase_order_id uuid REFERENCES supplier_purchase_orders(id),
  direction text NOT NULL CHECK (direction IN ('outbound', 'replacement', 'core_return', 'customer_return')),
  carrier text,
  service_level text,
  tracking_number text,
  bol_or_pro_number text,
  status text NOT NULL CHECK (status IN ('planned', 'booked', 'in_transit', 'delivered', 'exception', 'canceled')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  exception_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipment_identification CHECK (status = 'planned' OR carrier IS NOT NULL),
  CONSTRAINT shipment_exception_reason CHECK ((status = 'exception') = (exception_reason IS NOT NULL))
);

CREATE TABLE shipment_items (
  shipment_id uuid NOT NULL REFERENCES fulfillment_shipments(id),
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_serial_number text,
  PRIMARY KEY (shipment_id, order_item_id)
);

ALTER TABLE core_returns
  ADD COLUMN return_authorization text,
  ADD COLUMN carrier text,
  ADD COLUMN tracking_number text,
  ADD COLUMN pickup_scheduled_at timestamptz,
  ADD COLUMN original_due_at timestamptz,
  ADD COLUMN extension_reason text,
  ADD COLUMN supplier_received_at timestamptz,
  ADD COLUMN supplier_decision text CHECK (supplier_decision IN ('pending', 'accepted', 'partial_credit', 'rejected')),
  ADD COLUMN approved_credit_cents bigint CHECK (approved_credit_cents >= 0),
  ADD COLUMN deduction_cents bigint CHECK (deduction_cents >= 0),
  ADD COLUMN deduction_reason text;

CREATE TABLE warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_claim_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  order_id uuid NOT NULL REFERENCES orders(id),
  order_item_id uuid REFERENCES order_items(id),
  supplier_id uuid REFERENCES suppliers(id),
  supplier_claim_reference text,
  state warranty_claim_state NOT NULL DEFAULT 'intake',
  installed_at date,
  mileage_at_install integer CHECK (mileage_at_install >= 0),
  mileage_at_claim integer CHECK (mileage_at_claim >= 0),
  installer_name text,
  complaint text NOT NULL,
  evidence_deadline timestamptz,
  decision_reason text,
  approved_parts_cents bigint CHECK (approved_parts_cents >= 0),
  approved_labor_cents bigint CHECK (approved_labor_cents >= 0),
  approved_freight_cents bigint CHECK (approved_freight_cents >= 0),
  assigned_to uuid REFERENCES staff_users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT warranty_mileage_order CHECK (
    mileage_at_install IS NULL OR mileage_at_claim IS NULL OR mileage_at_claim >= mileage_at_install
  )
);

CREATE TABLE communication_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  lead_id uuid REFERENCES leads(id),
  order_id uuid REFERENCES orders(id),
  warranty_claim_id uuid REFERENCES warranty_claims(id),
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'phone', 'portal', 'in_person')),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  purpose text NOT NULL CHECK (purpose IN ('sales', 'transactional', 'fitment', 'freight', 'core', 'warranty', 'dispute', 'service')),
  subject text,
  summary text NOT NULL,
  external_message_id text,
  delivery_status text CHECK (delivery_status IN ('queued', 'sent', 'delivered', 'failed', 'received')),
  consent_basis text,
  occurred_at timestamptz NOT NULL,
  recorded_by uuid REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communication_related_record CHECK (
    customer_id IS NOT NULL OR lead_id IS NOT NULL OR order_id IS NOT NULL OR warranty_claim_id IS NOT NULL
  )
);

CREATE TABLE document_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_provider text NOT NULL,
  storage_key text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  media_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  scan_status text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'quarantined', 'failed')),
  retention_class text NOT NULL,
  uploaded_by uuid REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE document_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_asset_id uuid NOT NULL REFERENCES document_assets(id),
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'quote', 'order', 'purchase_order', 'shipment', 'core_return', 'warranty_claim', 'supplier_invoice')),
  entity_id uuid NOT NULL,
  document_type text NOT NULL,
  created_by uuid NOT NULL REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_asset_id, entity_type, entity_id)
);

CREATE TABLE supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  purchase_order_id uuid REFERENCES supplier_purchase_orders(id),
  supplier_invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  currency char(3) NOT NULL DEFAULT 'usd',
  subtotal_cents bigint NOT NULL CHECK (subtotal_cents >= 0),
  freight_cents bigint NOT NULL DEFAULT 0 CHECK (freight_cents >= 0),
  core_charge_cents bigint NOT NULL DEFAULT 0 CHECK (core_charge_cents >= 0),
  tax_cents bigint NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  credit_cents bigint NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
  status text NOT NULL CHECK (status IN ('received', 'approved', 'partially_paid', 'paid', 'disputed', 'void')),
  approved_by uuid REFERENCES staff_users(id),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, supplier_invoice_number)
);

CREATE INDEX catalog_products_kind_status_idx ON catalog_products (kind, status, updated_at DESC);
CREATE INDEX catalog_price_versions_product_idx ON catalog_price_versions (catalog_product_id, verified_at DESC);
CREATE INDEX order_items_order_idx ON order_items (order_id, line_number);
CREATE INDEX leads_queue_idx ON leads (state, priority DESC, next_follow_up_at, created_at);
CREATE INDEX leads_assignee_idx ON leads (assigned_to, state, next_follow_up_at);
CREATE INDEX lead_activities_lead_idx ON lead_activities (lead_id, created_at DESC);
CREATE INDEX sales_quotes_queue_idx ON sales_quotes (state, expires_at, created_at);
CREATE INDEX office_tasks_my_work_idx ON office_tasks (assigned_to, state, due_at, priority DESC);
CREATE INDEX office_tasks_team_queue_idx ON office_tasks (state, due_at, priority DESC, created_at);
CREATE INDEX risk_reviews_order_idx ON risk_reviews (order_id, reviewed_at DESC);
CREATE INDEX supplier_purchase_orders_queue_idx ON supplier_purchase_orders (state, estimated_ship_at, created_at);
CREATE INDEX fulfillment_shipments_queue_idx ON fulfillment_shipments (status, shipped_at, created_at);
CREATE INDEX warranty_claims_queue_idx ON warranty_claims (state, evidence_deadline, created_at);
CREATE INDEX communication_events_order_idx ON communication_events (order_id, occurred_at DESC);
CREATE INDEX communication_events_lead_idx ON communication_events (lead_id, occurred_at DESC);
CREATE INDEX supplier_invoices_queue_idx ON supplier_invoices (status, due_date, created_at);

CREATE TRIGGER suppliers_set_updated_at BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER supplier_contacts_set_updated_at BEFORE UPDATE ON supplier_contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER catalog_products_set_updated_at BEFORE UPDATE ON catalog_products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER leads_set_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER sales_quotes_set_updated_at BEFORE UPDATE ON sales_quotes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER office_tasks_set_updated_at BEFORE UPDATE ON office_tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER supplier_purchase_orders_set_updated_at BEFORE UPDATE ON supplier_purchase_orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER fulfillment_shipments_set_updated_at BEFORE UPDATE ON fulfillment_shipments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER warranty_claims_set_updated_at BEFORE UPDATE ON warranty_claims
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER supplier_invoices_set_updated_at BEFORE UPDATE ON supplier_invoices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER catalog_price_versions_append_only
BEFORE UPDATE OR DELETE ON catalog_price_versions FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER order_items_append_only
BEFORE UPDATE OR DELETE ON order_items FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER lead_activities_append_only
BEFORE UPDATE OR DELETE ON lead_activities FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER sales_quote_versions_append_only
BEFORE UPDATE OR DELETE ON sales_quote_versions FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER sales_quote_items_append_only
BEFORE UPDATE OR DELETE ON sales_quote_items FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER risk_reviews_append_only
BEFORE UPDATE OR DELETE ON risk_reviews FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER communication_events_append_only
BEFORE UPDATE OR DELETE ON communication_events FOR EACH ROW EXECUTE FUNCTION reject_record_change();
CREATE TRIGGER document_assets_no_delete
BEFORE DELETE ON document_assets FOR EACH ROW EXECUTE FUNCTION reject_record_delete();
CREATE TRIGGER document_links_append_only
BEFORE UPDATE OR DELETE ON document_links FOR EACH ROW EXECUTE FUNCTION reject_record_change();

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

COMMIT;
