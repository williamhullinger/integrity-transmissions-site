import { conflict, forbidden, notFound } from "./errors.mjs";
import { can, normalizeRoles } from "./permissions.mjs";
import { withTransaction } from "./db.mjs";
import { assertOperationalTransition, calculatePromotionDiscount } from "../domain/order-state.mjs";

const asInteger = (value) => {
  const parsed = Number(value || 0);
  if (!Number.isSafeInteger(parsed)) throw new RangeError("Database integer exceeds the safe JavaScript range");
  return parsed;
};

const promotionDto = (row) => ({
  id: row.id,
  code: row.code,
  amountOffCents: row.amount_off_cents === null ? null : asInteger(row.amount_off_cents),
  percentOff: row.percent_off === null ? null : Number(row.percent_off),
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  maxRedemptions: row.max_redemptions,
  maxRedemptionsPerCustomer: row.max_redemptions_per_customer,
  minimumMarginCents: asInteger(row.minimum_margin_cents),
  active: row.active,
  approvedAt: row.approved_at,
  disabledAt: row.disabled_at,
  redemptionCount: asInteger(row.redemption_count),
  createdBy: row.created_by,
  approvedBy: row.approved_by,
  createdAt: row.created_at,
});

const staffDto = (row) => ({
  id: row.id,
  auth0Subject: row.auth0_subject,
  email: row.email,
  displayName: row.display_name,
  roles: normalizeRoles(row.roles),
  active: !row.disabled_at,
  disabledAt: row.disabled_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const reconciliationDto = (row) => ({
  id: row.id,
  startAt: row.period_start,
  endAt: row.period_end,
  stripe: { count: row.stripe_payment_count, totalCents: asInteger(row.stripe_payment_cents) },
  office: { count: row.office_payment_count, totalCents: asInteger(row.office_payment_cents) },
  unmatchedStripe: row.unmatched_stripe_ids,
  unmatchedOffice: row.unmatched_office_ids,
  amountMismatches: row.amount_mismatches,
  balanced: row.unmatched_stripe_ids.length === 0
    && row.unmatched_office_ids.length === 0
    && row.amount_mismatches.length === 0,
  createdAt: row.created_at,
});

const leadDto = (row) => ({
  id: row.id,
  reference: row.public_reference,
  contact: { name: row.contact_name, email: row.contact_email, phone: row.contact_phone, organization: row.organization_name },
  productInterest: row.product_interest,
  vehicleSummary: row.vehicle_summary || {},
  source: row.source,
  state: row.state,
  priority: row.priority,
  estimatedValueCents: row.estimated_value_cents === null ? null : asInteger(row.estimated_value_cents),
  assignedTo: row.assigned_to,
  assigneeName: row.assignee_name,
  nextFollowUpAt: row.next_follow_up_at,
  lostReason: row.lost_reason,
  wonOrderId: row.won_order_id,
  version: row.version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const taskDto = (row) => ({
  id: row.id,
  taskType: row.task_type,
  title: row.title,
  entityType: row.entity_type,
  entityId: row.entity_id,
  customerId: row.customer_id,
  orderId: row.order_id,
  requiredCapability: row.required_capability,
  state: row.state,
  priority: row.priority,
  assignedTo: row.assigned_to,
  assigneeName: row.assignee_name,
  dueAt: row.due_at,
  blockedReason: row.blocked_reason,
  completionEvidence: row.completion_evidence,
  completedAt: row.completed_at,
  version: row.version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const supplierDto = (row) => ({
  id: row.id,
  code: row.code,
  displayName: row.display_name,
  orderingMethod: row.ordering_method,
  warrantyTermsReference: row.warranty_terms_reference,
  coreTermsReference: row.core_terms_reference,
  active: row.active,
  productCount: asInteger(row.product_count || 0),
  version: row.version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const catalogProductDto = (row, includeFinancials = false) => ({
  id: row.id,
  integritySku: row.integrity_sku,
  supplier: { id: row.supplier_id, name: row.supplier_name, active: row.supplier_active },
  supplierSku: row.supplier_sku,
  kind: row.kind,
  title: row.title,
  manufacturerBrand: row.manufacturer_brand,
  manufacturerPartNumber: row.manufacturer_part_number,
  gtin: row.gtin,
  condition: row.condition,
  applicationData: row.application_data || {},
  packageContents: row.package_contents || [],
  warrantyData: row.warranty_data || {},
  shippingData: row.shipping_data || {},
  imageProvenance: row.image_provenance || [],
  status: row.status,
  lastVerifiedAt: row.last_verified_at,
  version: row.version,
  latestPrice: row.price_version_id ? {
    id: row.price_version_id,
    suggestedRetailCents: row.suggested_retail_cents === null ? null : asInteger(row.suggested_retail_cents),
    availabilityCode: row.availability_code,
    availabilityText: row.availability_text,
    verifiedAt: row.price_verified_at,
    validThrough: row.valid_through,
    ...(includeFinancials ? {
      supplierUnitCostCents: asInteger(row.supplier_unit_cost_cents),
      supplierCoreDepositCents: asInteger(row.supplier_core_deposit_cents),
      sourceReference: row.source_reference,
    } : {}),
  } : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const purchaseOrderDto = (row, includeFinancials = false) => ({
  id: row.id,
  orderId: row.order_id,
  orderNumber: row.public_order_number ? String(row.public_order_number) : null,
  supplier: { id: row.supplier_id, name: row.supplier_name },
  purchaseOrderNumber: row.purchase_order_number,
  supplierOrderReference: row.supplier_order_reference,
  state: row.state,
  estimatedShipAt: row.estimated_ship_at,
  approvedAt: row.approved_at,
  submittedAt: row.submitted_at,
  acknowledgedAt: row.acknowledged_at,
  canceledAt: row.canceled_at,
  cancellationReason: row.cancellation_reason,
  lineCount: asInteger(row.line_count || 0),
  version: row.version,
  ...(includeFinancials ? {
    merchandiseCents: asInteger(row.merchandise_cents),
    freightCents: asInteger(row.freight_cents),
    taxCents: asInteger(row.tax_cents),
    totalCents: asInteger(row.merchandise_cents) + asInteger(row.freight_cents) + asInteger(row.tax_cents),
  } : {}),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const shipmentDto = (row) => ({
  id: row.id,
  orderId: row.order_id,
  orderNumber: row.public_order_number ? String(row.public_order_number) : null,
  purchaseOrderId: row.purchase_order_id,
  warrantyClaimId: row.warranty_claim_id,
  direction: row.direction,
  carrier: row.carrier,
  serviceLevel: row.service_level,
  trackingNumber: row.tracking_number,
  bolOrProNumber: row.bol_or_pro_number,
  status: row.status,
  shippedAt: row.shipped_at,
  deliveredAt: row.delivered_at,
  exceptionReason: row.exception_reason,
  itemCount: asInteger(row.item_count || 0),
  version: row.version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const warrantyClaimDto = (row, includeFinancials = false) => ({
  id: row.id,
  claimNumber: String(row.public_claim_number),
  orderId: row.order_id,
  orderNumber: row.public_order_number ? String(row.public_order_number) : null,
  orderItemId: row.order_item_id,
  itemTitle: row.item_title,
  supplier: row.supplier_id ? { id: row.supplier_id, name: row.supplier_name } : null,
  supplierClaimReference: row.supplier_claim_reference,
  state: row.state,
  installedAt: row.installed_at,
  mileageAtInstall: row.mileage_at_install,
  mileageAtClaim: row.mileage_at_claim,
  installerName: row.installer_name,
  complaint: row.complaint,
  evidenceDeadline: row.evidence_deadline,
  decisionReason: row.decision_reason,
  assignedTo: row.assigned_to,
  assigneeName: row.assignee_name,
  authorizedReplacementQuantity: row.authorized_replacement_quantity,
  resolvedAt: row.resolved_at,
  version: row.version,
  ...(includeFinancials ? {
    approvedPartsCents: row.approved_parts_cents === null ? null : asInteger(row.approved_parts_cents),
    approvedLaborCents: row.approved_labor_cents === null ? null : asInteger(row.approved_labor_cents),
    approvedFreightCents: row.approved_freight_cents === null ? null : asInteger(row.approved_freight_cents),
  } : {}),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const orderDto = (row, includeFinancials) => ({
  id: row.id,
  orderNumber: String(row.public_order_number),
  customer: { name: row.customer_name, email: row.customer_email, phone: row.customer_phone },
  vehicle: { vin: row.vin, year: row.year, make: row.make, model: row.model },
  deliveryAddress: {
    line1: row.delivery_line1,
    line2: row.delivery_line2,
    city: row.delivery_city,
    region: row.delivery_region,
    postalCode: row.delivery_postal_code,
    countryCode: row.delivery_country_code,
    locationType: row.delivery_location_type,
  },
  application: row.transmission_family,
  packageName: row.package_name,
  listUnitPriceCents: asInteger(row.list_unit_price_cents ?? row.customer_unit_price_cents),
  paymentStatus: row.payment_status,
  fulfillmentStatus: row.fulfillment_status,
  coreStatus: row.core_status,
  unitPriceCents: asInteger(row.customer_unit_price_cents),
  promotionCode: row.promotion_code || null,
  promotionDiscountCents: asInteger(row.promotion_discount_cents || 0),
  freightCents: asInteger(row.freight_charged_cents),
  coreDepositCents: asInteger(row.core_deposit_cents),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ...(includeFinancials ? {
    collectedCents: asInteger(row.collected_cents),
    supplierUnitCostCents: asInteger(row.supplier_unit_cost_cents),
    supplierFreightCostCents: asInteger(row.supplier_freight_cost_cents),
    grossProfitBeforeFeesCents: asInteger(row.customer_unit_price_cents)
      + asInteger(row.freight_charged_cents)
      - asInteger(row.supplier_unit_cost_cents)
      - asInteger(row.supplier_freight_cost_cents),
  } : {}),
});

export class PostgresOfficeRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async getStaffPrincipal(identity) {
    const { rows } = await this.pool.query(`
      SELECT su.id, su.auth0_subject, su.email, su.display_name,
             COALESCE(array_agg(ur.role::text) FILTER (WHERE ur.revoked_at IS NULL), ARRAY[]::text[]) AS roles
      FROM staff_users su
      LEFT JOIN user_roles ur ON ur.staff_user_id = su.id
      WHERE su.auth0_subject = $1 AND su.disabled_at IS NULL
      GROUP BY su.id
    `, [identity.subject]);
    if (!rows[0]) throw forbidden("Your account is not authorized for Integrity Office.");
    return Object.freeze({
      id: rows[0].id,
      subject: rows[0].auth0_subject,
      email: rows[0].email,
      name: rows[0].display_name,
      roles: normalizeRoles(rows[0].roles),
    });
  }

  async dashboard({ includeFinancials = false, capabilities = ["viewer"] } = {}) {
    const { rows } = await this.pool.query(`
      SELECT
        (SELECT count(*) FROM orders WHERE created_at >= now() - interval '30 days') AS orders_30d,
        (SELECT count(*) FROM orders WHERE payment_status IN ('paid', 'partially_refunded')) AS paid_orders,
        (SELECT count(*) FROM orders WHERE payment_status = 'disputed') AS disputed_orders,
        (SELECT count(*) FROM orders WHERE fulfillment_status NOT IN ('closed', 'canceled')) AS active_orders,
        (SELECT count(*) FROM orders WHERE core_status IN ('awaiting_return', 'pickup_scheduled', 'in_transit', 'received', 'accepted', 'refund_due')) AS open_cores,
        (SELECT count(*) FROM freight_quote_requests WHERE status IN ('open', 'contacted', 'quoted')) AS freight_exceptions,
        (SELECT count(*) FROM leads WHERE state = 'new') AS new_leads,
        (SELECT count(*) FROM leads WHERE state NOT IN ('won', 'lost', 'closed') AND assigned_to IS NULL) AS unassigned_leads,
        (SELECT count(*) FROM office_tasks WHERE state NOT IN ('completed', 'canceled') AND due_at < now() AND required_capability=ANY($1::staff_role[])) AS overdue_tasks,
        (SELECT count(*) FROM office_tasks WHERE state NOT IN ('completed', 'canceled') AND due_at >= now() AND due_at < now() + interval '24 hours' AND required_capability=ANY($1::staff_role[])) AS tasks_due_24h,
        (SELECT count(*) FROM webhook_events WHERE processing_status IN ('retry', 'dead_letter')) AS webhook_exceptions,
        (SELECT count(*) FROM notification_outbox
          WHERE delivered_at IS NULL AND attempts >= 10
            AND (locked_until IS NULL OR locked_until < now())) AS notification_exceptions,
        (SELECT COALESCE(sum(amount_cents), 0) FROM payment_transactions WHERE transaction_type IN ('charge', 'payment') AND status IN ('paid', 'succeeded') AND occurred_at >= now() - interval '30 days') AS collected_30d,
        (SELECT COALESCE(sum(amount_cents), 0) FROM payment_transactions WHERE transaction_type = 'refund' AND status IN ('paid', 'succeeded') AND occurred_at >= now() - interval '30 days') AS refunds_30d
    `, [capabilities]);
    const row = rows[0];
    return {
      orders30d: asInteger(row.orders_30d),
      paidOrders: asInteger(row.paid_orders),
      disputedOrders: asInteger(row.disputed_orders),
      activeOrders: asInteger(row.active_orders),
      openCores: asInteger(row.open_cores),
      freightExceptions: asInteger(row.freight_exceptions),
      newLeads: asInteger(row.new_leads),
      unassignedLeads: asInteger(row.unassigned_leads),
      overdueTasks: asInteger(row.overdue_tasks),
      tasksDue24h: asInteger(row.tasks_due_24h),
      webhookExceptions: asInteger(row.webhook_exceptions),
      notificationExceptions: asInteger(row.notification_exceptions),
      ...(includeFinancials ? {
        collected30dCents: asInteger(row.collected_30d),
        refunds30dCents: asInteger(row.refunds_30d),
      } : {}),
    };
  }

  async listLeads({ page, pageSize, search = "", status = "" }) {
    const offset = (page - 1) * pageSize;
    const { rows } = await this.pool.query(`
      SELECT l.*, su.display_name AS assignee_name, count(*) OVER() AS total_count
      FROM leads l
      LEFT JOIN staff_users su ON su.id = l.assigned_to
      WHERE ($3 = '' OR l.public_reference ILIKE '%' || $3 || '%' OR l.contact_name ILIKE '%' || $3 || '%'
        OR COALESCE(l.contact_email, '') ILIKE '%' || $3 || '%' OR COALESCE(l.contact_phone, '') ILIKE '%' || $3 || '%')
        AND ($4 = '' OR l.state::text = $4)
      ORDER BY
        CASE l.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
        l.next_follow_up_at NULLS LAST, l.created_at DESC
      LIMIT $1 OFFSET $2
    `, [pageSize, offset, search.trim(), status.trim()]);
    return { items: rows.map(leadDto), page, pageSize, total: rows[0] ? asInteger(rows[0].total_count) : 0 };
  }

  async createLead(client, input, principal) {
    if (input.assignedTo) {
      const assignee = await client.query(`
        SELECT 1 FROM staff_users su JOIN user_roles ur ON ur.staff_user_id=su.id
        WHERE su.id=$1 AND su.disabled_at IS NULL AND ur.revoked_at IS NULL
          AND ur.role IN ('operations','administrator')
      `, [input.assignedTo]);
      if (!assignee.rows[0]) throw conflict("The lead assignee is not an active operations staff member.");
    }
    const { rows } = await client.query(`
      INSERT INTO leads (
        public_reference, contact_name, contact_email, contact_phone, organization_name,
        product_interest, vehicle_summary, source, priority, estimated_value_cents,
        assigned_to, next_follow_up_at, state
      ) VALUES (
        'LD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
        $1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,
        CASE WHEN $10::uuid IS NULL THEN 'new'::lead_state ELSE 'assigned'::lead_state END
      )
      RETURNING *
    `, [input.contactName, input.contactEmail, input.contactPhone, input.organizationName,
      input.productInterest, JSON.stringify(input.vehicleSummary), input.source, input.priority,
      input.estimatedValueCents, input.assignedTo, input.nextFollowUpAt]);
    await client.query(`
      INSERT INTO lead_activities (lead_id, activity_type, summary, metadata, created_by)
      VALUES ($1, 'created', $2, $3::jsonb, $4)
    `, [rows[0].id, input.reason, JSON.stringify({ source: input.source, priority: input.priority }), principal.id]);
    return leadDto(rows[0]);
  }

  async updateLead(client, id, input, principal) {
    const existing = await client.query("SELECT * FROM leads WHERE id = $1 FOR UPDATE", [id]);
    if (!existing.rows[0]) throw notFound("Lead not found.");
    if (existing.rows[0].version !== input.version) throw conflict("This lead changed after it was opened. Refresh and try again.");
    const allowed = {
      new: ["assigned", "contacted", "qualified", "lost", "closed"],
      assigned: ["contacted", "qualified", "lost", "closed"],
      contacted: ["qualified", "quoted", "lost", "closed"],
      qualified: ["quoted", "lost", "closed"], quoted: ["won", "lost", "closed"],
      lost: ["contacted", "closed"], won: ["closed"], closed: [],
    };
    if (input.state !== existing.rows[0].state && !allowed[existing.rows[0].state]?.includes(input.state)) {
      throw conflict("That lead transition is not allowed.");
    }
    const assignedTo = input.assignedTo === undefined ? existing.rows[0].assigned_to : input.assignedTo;
    if (assignedTo) {
      const assignee = await client.query(`
        SELECT 1 FROM staff_users su JOIN user_roles ur ON ur.staff_user_id=su.id
        WHERE su.id=$1 AND su.disabled_at IS NULL AND ur.revoked_at IS NULL
          AND ur.role IN ('operations','administrator')
      `, [assignedTo]);
      if (!assignee.rows[0]) throw conflict("The lead assignee is not an active operations staff member.");
    }
    let wonCustomerId = existing.rows[0].customer_id;
    if (input.state === "won") {
      const wonOrder = await client.query("SELECT customer_id FROM orders WHERE id=$1 FOR UPDATE", [input.wonOrderId]);
      if (!wonOrder.rows[0] || (wonCustomerId && wonCustomerId !== wonOrder.rows[0].customer_id)) {
        throw conflict("The won order must belong to the lead customer.");
      }
      wonCustomerId = wonOrder.rows[0].customer_id;
    }
    const { rows } = await client.query(`
      UPDATE leads SET state = $2, priority = $3, assigned_to = $4, next_follow_up_at = $5,
        lost_reason = $6, won_order_id = $7, customer_id=$8, version = version + 1
      WHERE id = $1
      RETURNING *
    `, [id, input.state, input.priority, assignedTo, input.nextFollowUpAt, input.lostReason, input.wonOrderId, wonCustomerId]);
    await client.query(`
      INSERT INTO lead_activities (lead_id, activity_type, summary, metadata, created_by)
      VALUES ($1, 'status_change', $2, $3::jsonb, $4)
    `, [id, input.reason, JSON.stringify({ from: existing.rows[0].state, to: input.state, priority: input.priority }), principal.id]);
    const assignee = assignedTo ? await client.query("SELECT display_name FROM staff_users WHERE id = $1", [assignedTo]) : { rows: [] };
    return leadDto({ ...rows[0], assignee_name: assignee.rows[0]?.display_name || null });
  }

  async listTasks({ page, pageSize, status = "", assignedTo = null, capabilities = ["operations"] }) {
    const offset = (page - 1) * pageSize;
    const { rows } = await this.pool.query(`
      SELECT t.*, su.display_name AS assignee_name, count(*) OVER() AS total_count
      FROM office_tasks t
      LEFT JOIN staff_users su ON su.id = t.assigned_to
      WHERE ($3 = '' OR t.state::text = $3)
        AND ($4::uuid IS NULL OR t.assigned_to = $4)
        AND t.required_capability = ANY($5::staff_role[])
      ORDER BY
        CASE WHEN t.state NOT IN ('completed', 'canceled') AND t.due_at < now() THEN 0 ELSE 1 END,
        CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
        t.due_at NULLS LAST, t.created_at DESC
      LIMIT $1 OFFSET $2
    `, [pageSize, offset, status.trim(), assignedTo, capabilities]);
    return { items: rows.map(taskDto), page, pageSize, total: rows[0] ? asInteger(rows[0].total_count) : 0 };
  }

  async createTask(client, input, principal) {
    const entityTables = { lead: "leads", quote: "sales_quotes", order: "orders", customer: "customers",
      purchase_order: "supplier_purchase_orders", shipment: "fulfillment_shipments", core_return: "core_returns",
      warranty_claim: "warranty_claims", dispute: "payment_disputes" };
    if (input.entityId && input.entityType !== "system") {
      const table = entityTables[input.entityType];
      const entity = table ? await client.query(`SELECT 1 FROM ${table} WHERE id=$1`, [input.entityId]) : { rows: [] };
      if (!entity.rows[0]) throw conflict("The related record does not exist.");
    }
    if (input.customerId && !(await client.query("SELECT 1 FROM customers WHERE id=$1", [input.customerId])).rows[0]) throw conflict("The task customer does not exist.");
    if (input.orderId && !(await client.query("SELECT 1 FROM orders WHERE id=$1", [input.orderId])).rows[0]) throw conflict("The task order does not exist.");
    if (input.assignedTo) {
      const assigneeAccess = await client.query(`
        SELECT 1 FROM staff_users su JOIN user_roles ur ON ur.staff_user_id=su.id
        WHERE su.id=$1 AND su.disabled_at IS NULL AND ur.revoked_at IS NULL
          AND (ur.role=$2::staff_role OR ur.role='administrator')
      `, [input.assignedTo, input.requiredCapability]);
      if (!assigneeAccess.rows[0]) throw conflict("The assignee is not active with the required capability.");
    }
    const { rows } = await client.query(`
      INSERT INTO office_tasks (
        task_type, title, entity_type, entity_id, priority, assigned_to, due_at, created_by,
        customer_id, order_id, required_capability, deduplication_key
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [input.taskType, input.title, input.entityType, input.entityId, input.priority, input.assignedTo,
      input.dueAt, principal.id, input.customerId, input.orderId, input.requiredCapability, input.deduplicationKey]);
    await client.query(`
      INSERT INTO office_task_history (office_task_id, to_state, reason, created_by)
      VALUES ($1,'open',$2,$3)
    `, [rows[0].id, input.reason, principal.id]);
    const assignee = input.assignedTo ? await client.query("SELECT display_name FROM staff_users WHERE id = $1", [input.assignedTo]) : { rows: [] };
    return taskDto({ ...rows[0], assignee_name: assignee.rows[0]?.display_name || null });
  }

  async updateTask(client, id, input, principal) {
    const existing = await client.query("SELECT * FROM office_tasks WHERE id = $1 FOR UPDATE", [id]);
    if (!existing.rows[0]) throw notFound("Task not found.");
    if (!can(principal, existing.rows[0].required_capability)) throw forbidden();
    if (existing.rows[0].version !== input.version) throw conflict("This task changed after it was opened. Refresh and try again.");
    const assignedTo = input.assignedTo === undefined ? existing.rows[0].assigned_to : input.assignedTo;
    if (assignedTo) {
      const assigneeAccess = await client.query(`
        SELECT 1 FROM staff_users su JOIN user_roles ur ON ur.staff_user_id=su.id
        WHERE su.id=$1 AND su.disabled_at IS NULL AND ur.revoked_at IS NULL
          AND (ur.role=$2::staff_role OR ur.role='administrator')
      `, [assignedTo, existing.rows[0].required_capability]);
      if (!assigneeAccess.rows[0]) throw conflict("The assignee is not active with the required capability.");
    }
    const completed = input.state === "completed";
    const { rows } = await client.query(`
      UPDATE office_tasks SET state = $2, priority = $3, assigned_to = $4, due_at = $5,
        blocked_reason = $6, completion_evidence = $7,
        completed_by = CASE WHEN $8 THEN $9 ELSE NULL END,
        completed_at = CASE WHEN $8 THEN now() ELSE NULL END,
        version = version + 1
      WHERE id = $1
      RETURNING *
    `, [id, input.state, input.priority, assignedTo, input.dueAt, input.blockedReason,
      input.completionEvidence, completed, principal.id]);
    await client.query(`
      INSERT INTO office_task_history (office_task_id, from_state, to_state, reason, created_by)
      VALUES ($1,$2,$3,$4,$5)
    `, [id, existing.rows[0].state, input.state, input.reason, principal.id]);
    const assignee = assignedTo ? await client.query("SELECT display_name FROM staff_users WHERE id = $1", [assignedTo]) : { rows: [] };
    return taskDto({ ...rows[0], assignee_name: assignee.rows[0]?.display_name || null });
  }

  async listCustomers({ page, pageSize, search = "" }) {
    const offset = (page - 1) * pageSize;
    const { rows } = await this.pool.query(`
      SELECT c.*,
        (SELECT count(*) FROM vehicles v WHERE v.customer_id = c.id) AS vehicle_count,
        (SELECT count(*) FROM orders o WHERE o.customer_id = c.id) AS order_count,
        (SELECT count(*) FROM office_tasks t WHERE t.customer_id = c.id AND t.state NOT IN ('completed', 'canceled')) AS open_task_count,
        count(*) OVER() AS total_count
      FROM customers c
      WHERE $3 = '' OR c.name ILIKE '%' || $3 || '%' OR c.email ILIKE '%' || $3 || '%' OR c.phone ILIKE '%' || $3 || '%'
      ORDER BY c.updated_at DESC, c.id
      LIMIT $1 OFFSET $2
    `, [pageSize, offset, search.trim()]);
    return {
      items: rows.map((row) => ({
        id: row.id, name: row.name, email: row.email, phone: row.phone,
        vehicleCount: asInteger(row.vehicle_count), orderCount: asInteger(row.order_count),
        openTaskCount: asInteger(row.open_task_count), createdAt: row.created_at, updatedAt: row.updated_at,
      })),
      page, pageSize, total: rows[0] ? asInteger(rows[0].total_count) : 0,
    };
  }

  async getCustomer(id) {
    const customer = await this.pool.query("SELECT id, name, email, phone, created_at, updated_at FROM customers WHERE id = $1", [id]);
    if (!customer.rows[0]) throw notFound("Customer not found.");
    const [vehicles, orders, leads, tasks, communications, claims] = await Promise.all([
      this.pool.query("SELECT id, vin, year, make, model, engine, drive_type, mileage, created_at FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC", [id]),
      this.pool.query("SELECT id, public_order_number, payment_status, fulfillment_status, core_status, created_at FROM orders WHERE customer_id = $1 ORDER BY created_at DESC", [id]),
      this.pool.query("SELECT id, public_reference, product_interest, state, priority, next_follow_up_at, created_at FROM leads WHERE customer_id = $1 ORDER BY created_at DESC", [id]),
      this.pool.query("SELECT id, title, state, priority, due_at, entity_type, entity_id FROM office_tasks WHERE customer_id = $1 ORDER BY created_at DESC", [id]),
      this.pool.query("SELECT id, channel, direction, purpose, subject, summary, delivery_status, occurred_at FROM communication_events WHERE customer_id = $1 ORDER BY occurred_at DESC LIMIT 100", [id]),
      this.pool.query(`
        SELECT wc.id, wc.public_claim_number, wc.state, wc.complaint, wc.evidence_deadline, wc.created_at
        FROM warranty_claims wc JOIN orders o ON o.id = wc.order_id
        WHERE o.customer_id = $1 ORDER BY wc.created_at DESC
      `, [id]),
    ]);
    const row = customer.rows[0];
    return {
      id: row.id, name: row.name, email: row.email, phone: row.phone,
      createdAt: row.created_at, updatedAt: row.updated_at,
      vehicles: vehicles.rows.map((item) => ({ id: item.id, vin: item.vin, year: item.year, make: item.make, model: item.model, engine: item.engine, driveType: item.drive_type, mileage: item.mileage, createdAt: item.created_at })),
      orders: orders.rows.map((item) => ({ id: item.id, orderNumber: String(item.public_order_number), paymentStatus: item.payment_status, fulfillmentStatus: item.fulfillment_status, coreStatus: item.core_status, createdAt: item.created_at })),
      leads: leads.rows.map((item) => ({ id: item.id, reference: item.public_reference, productInterest: item.product_interest, state: item.state, priority: item.priority, nextFollowUpAt: item.next_follow_up_at, createdAt: item.created_at })),
      tasks: tasks.rows.map((item) => ({ id: item.id, title: item.title, state: item.state, priority: item.priority, dueAt: item.due_at, entityType: item.entity_type, entityId: item.entity_id })),
      communications: communications.rows.map((item) => ({ id: item.id, channel: item.channel, direction: item.direction, purpose: item.purpose, subject: item.subject, summary: item.summary, deliveryStatus: item.delivery_status, occurredAt: item.occurred_at })),
      warrantyClaims: claims.rows.map((item) => ({ id: item.id, claimNumber: String(item.public_claim_number), state: item.state, complaint: item.complaint, evidenceDeadline: item.evidence_deadline, createdAt: item.created_at })),
    };
  }

  async listSuppliers({ page, pageSize, search = "" }) {
    const offset = (page - 1) * pageSize;
    const { rows } = await this.pool.query(`
      SELECT s.*, count(cp.id) AS product_count, count(*) OVER() AS total_count
      FROM suppliers s LEFT JOIN catalog_products cp ON cp.supplier_id = s.id
      WHERE $3 = '' OR s.code::text ILIKE '%' || $3 || '%' OR s.display_name ILIKE '%' || $3 || '%'
      GROUP BY s.id ORDER BY s.active DESC, s.display_name, s.id LIMIT $1 OFFSET $2
    `, [pageSize, offset, search.trim()]);
    return { items: rows.map(supplierDto), page, pageSize, total: rows[0] ? asInteger(rows[0].total_count) : 0 };
  }

  async createSupplier(client, input) {
    const { rows } = await client.query(`
      INSERT INTO suppliers (code, display_name, ordering_method, warranty_terms_reference, core_terms_reference, active)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *, 0 AS product_count
    `, [input.code, input.displayName, input.orderingMethod, input.warrantyTermsReference, input.coreTermsReference, input.active]);
    return supplierDto(rows[0]);
  }

  async updateSupplier(client, id, input) {
    const existing = await client.query("SELECT * FROM suppliers WHERE id = $1 FOR UPDATE", [id]);
    if (!existing.rows[0]) throw notFound("Supplier not found.");
    if (existing.rows[0].version !== input.version) throw conflict("This supplier changed after it was opened. Refresh and try again.");
    const { rows } = await client.query(`
      UPDATE suppliers SET display_name=$2, ordering_method=$3, warranty_terms_reference=$4,
        core_terms_reference=$5, active=$6, version=version+1 WHERE id=$1
      RETURNING *, (SELECT count(*) FROM catalog_products WHERE supplier_id=$1) AS product_count
    `, [id, input.displayName, input.orderingMethod, input.warrantyTermsReference, input.coreTermsReference, input.active]);
    return supplierDto(rows[0]);
  }

  async listCatalogProducts({ page, pageSize, search = "", status = "", kind = "", includeFinancials = false }) {
    const offset = (page - 1) * pageSize;
    const { rows } = await this.pool.query(`
      SELECT cp.*, s.display_name AS supplier_name, s.active AS supplier_active,
        price.id AS price_version_id, price.supplier_unit_cost_cents, price.supplier_core_deposit_cents,
        price.suggested_retail_cents, price.availability_code, price.availability_text,
        price.source_reference, price.verified_at AS price_verified_at, price.valid_through,
        count(*) OVER() AS total_count
      FROM catalog_products cp JOIN suppliers s ON s.id = cp.supplier_id
      LEFT JOIN LATERAL (
        SELECT * FROM catalog_price_versions cpv
        WHERE cpv.catalog_product_id = cp.id ORDER BY cpv.verified_at DESC, cpv.created_at DESC LIMIT 1
      ) price ON true
      WHERE ($3 = '' OR cp.integrity_sku::text ILIKE '%' || $3 || '%' OR cp.supplier_sku ILIKE '%' || $3 || '%' OR cp.title ILIKE '%' || $3 || '%')
        AND ($4 = '' OR cp.status::text = $4) AND ($5 = '' OR cp.kind::text = $5)
      ORDER BY cp.updated_at DESC, cp.id LIMIT $1 OFFSET $2
    `, [pageSize, offset, search.trim(), status.trim(), kind.trim()]);
    return { items: rows.map((row) => catalogProductDto(row, includeFinancials)), page, pageSize, total: rows[0] ? asInteger(rows[0].total_count) : 0 };
  }

  async createCatalogProduct(client, input) {
    if (input.status !== "draft") throw conflict("New catalog products must begin as drafts and be activated after price verification.");
    const { rows } = await client.query(`
      INSERT INTO catalog_products (
        integrity_sku, supplier_id, supplier_sku, kind, title, manufacturer_brand,
        manufacturer_part_number, gtin, condition, application_data, package_contents,
        warranty_data, shipping_data, image_provenance, status, last_verified_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16)
      RETURNING *
    `, [input.integritySku, input.supplierId, input.supplierSku, input.kind, input.title,
      input.manufacturerBrand, input.manufacturerPartNumber, input.gtin, input.condition,
      JSON.stringify(input.applicationData), JSON.stringify(input.packageContents), JSON.stringify(input.warrantyData),
      JSON.stringify(input.shippingData), JSON.stringify(input.imageProvenance), input.status, input.lastVerifiedAt]);
    const supplier = await client.query("SELECT display_name, active FROM suppliers WHERE id=$1", [input.supplierId]);
    return catalogProductDto({ ...rows[0], supplier_name: supplier.rows[0]?.display_name, supplier_active: supplier.rows[0]?.active }, false);
  }

  async updateCatalogProduct(client, id, input, { includeFinancials = false } = {}) {
    const existing = await client.query("SELECT * FROM catalog_products WHERE id=$1 FOR UPDATE", [id]);
    if (!existing.rows[0]) throw notFound("Catalog product not found.");
    if (existing.rows[0].version !== input.version) throw conflict("This catalog product changed after it was opened. Refresh and try again.");
    if (input.status === "active") {
      const eligible = await client.query(`
        SELECT 1 FROM suppliers s
        WHERE s.id=$1 AND s.active AND EXISTS (
          SELECT 1 FROM catalog_price_versions p WHERE p.catalog_product_id=$2
            AND p.verified_at <= now() AND (p.valid_through IS NULL OR p.valid_through > now())
        )
      `, [existing.rows[0].supplier_id, id]);
      if (!eligible.rows[0]) throw conflict("An active supplier and a currently valid verified price are required before activation.");
    }
    const { rows } = await client.query(`
      UPDATE catalog_products SET supplier_sku=$2, kind=$3, title=$4, manufacturer_brand=$5,
        manufacturer_part_number=$6, gtin=$7, condition=$8, application_data=$9::jsonb,
        package_contents=$10::jsonb, warranty_data=$11::jsonb, shipping_data=$12::jsonb,
        image_provenance=$13::jsonb, status=$14, last_verified_at=$15, version=version+1
      WHERE id=$1 RETURNING *
    `, [id, input.supplierSku, input.kind, input.title, input.manufacturerBrand,
      input.manufacturerPartNumber, input.gtin, input.condition, JSON.stringify(input.applicationData),
      JSON.stringify(input.packageContents), JSON.stringify(input.warrantyData), JSON.stringify(input.shippingData),
      JSON.stringify(input.imageProvenance), input.status, input.lastVerifiedAt]);
    const detail = await client.query(`
      SELECT s.display_name AS supplier_name, s.active AS supplier_active,
        p.id AS price_version_id, p.supplier_unit_cost_cents, p.supplier_core_deposit_cents,
        p.suggested_retail_cents, p.availability_code, p.availability_text, p.source_reference,
        p.verified_at AS price_verified_at, p.valid_through
      FROM suppliers s LEFT JOIN LATERAL (
        SELECT * FROM catalog_price_versions WHERE catalog_product_id=$1 ORDER BY verified_at DESC, created_at DESC LIMIT 1
      ) p ON true WHERE s.id=$2
    `, [id, rows[0].supplier_id]);
    return catalogProductDto({ ...rows[0], ...detail.rows[0] }, includeFinancials);
  }

  async appendCatalogPrice(client, id, input, principal) {
    const product = await client.query("SELECT id FROM catalog_products WHERE id=$1 FOR UPDATE", [id]);
    if (!product.rows[0]) throw notFound("Catalog product not found.");
    const { rows } = await client.query(`
      INSERT INTO catalog_price_versions (
        catalog_product_id, supplier_unit_cost_cents, supplier_core_deposit_cents,
        suggested_retail_cents, availability_code, availability_text, source_reference,
        verified_at, valid_through, recorded_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [id, input.supplierUnitCostCents, input.supplierCoreDepositCents, input.suggestedRetailCents,
      input.availabilityCode, input.availabilityText, input.sourceReference, input.verifiedAt,
      input.validThrough, principal.id]);
    return { id: rows[0].id, supplierUnitCostCents: asInteger(rows[0].supplier_unit_cost_cents),
      supplierCoreDepositCents: asInteger(rows[0].supplier_core_deposit_cents),
      suggestedRetailCents: rows[0].suggested_retail_cents === null ? null : asInteger(rows[0].suggested_retail_cents),
      availabilityCode: rows[0].availability_code, availabilityText: rows[0].availability_text,
      sourceReference: rows[0].source_reference, verifiedAt: rows[0].verified_at, validThrough: rows[0].valid_through };
  }

  async listPurchaseOrders({ page, pageSize, status = "", includeFinancials = false }) {
    const offset = (page - 1) * pageSize;
    const { rows } = await this.pool.query(`
      SELECT po.*, o.public_order_number, s.display_name AS supplier_name,
        count(pol.id) AS line_count, count(*) OVER() AS total_count
      FROM supplier_purchase_orders po
      JOIN orders o ON o.id=po.order_id JOIN suppliers s ON s.id=po.supplier_id
      LEFT JOIN supplier_purchase_order_lines pol ON pol.purchase_order_id=po.id
      WHERE $3='' OR po.state::text=$3
      GROUP BY po.id, o.public_order_number, s.display_name
      ORDER BY CASE po.state WHEN 'draft' THEN 1 WHEN 'approved' THEN 2 WHEN 'backordered' THEN 3 ELSE 4 END,
        po.estimated_ship_at NULLS LAST, po.created_at DESC LIMIT $1 OFFSET $2
    `, [pageSize, offset, status.trim()]);
    return { items: rows.map((row) => purchaseOrderDto(row, includeFinancials)), page, pageSize, total: rows[0] ? asInteger(rows[0].total_count) : 0 };
  }

  async getPurchaseOrder(id, { includeFinancials = false } = {}) {
    const header = await this.pool.query(`
      SELECT po.*, o.public_order_number, s.display_name AS supplier_name,
        (SELECT count(*) FROM supplier_purchase_order_lines WHERE purchase_order_id=po.id) AS line_count
      FROM supplier_purchase_orders po JOIN orders o ON o.id=po.order_id
      JOIN suppliers s ON s.id=po.supplier_id WHERE po.id=$1
    `, [id]);
    if (!header.rows[0]) throw notFound("Purchase order not found.");
    const [lines, history] = await Promise.all([
      this.pool.query(`
        SELECT pol.id, pol.order_item_id, pol.line_number, pol.supplier_sku_snapshot,
          pol.description, pol.quantity, pol.unit_cost_cents, pol.core_charge_cents,
          oi.title_snapshot
        FROM supplier_purchase_order_lines pol JOIN order_items oi ON oi.id=pol.order_item_id
        WHERE pol.purchase_order_id=$1 ORDER BY pol.line_number
      `, [id]),
      this.pool.query(`
        SELECT from_state, to_state, reason, created_at
        FROM purchase_order_state_history WHERE purchase_order_id=$1 ORDER BY created_at DESC
      `, [id]),
    ]);
    return {
      ...purchaseOrderDto(header.rows[0], includeFinancials),
      lines: lines.rows.map((row) => ({
        id: row.id, orderItemId: row.order_item_id, lineNumber: row.line_number,
        supplierSku: row.supplier_sku_snapshot, description: row.description,
        title: row.title_snapshot, quantity: row.quantity,
        ...(includeFinancials ? { unitCostCents: asInteger(row.unit_cost_cents), coreChargeCents: asInteger(row.core_charge_cents) } : {}),
      })),
      history: history.rows.map((row) => ({ from: row.from_state, to: row.to_state, reason: row.reason, createdAt: row.created_at })),
    };
  }

  async createPurchaseOrder(client, input, principal) {
    const itemIds = input.lines.map((line) => line.orderItemId);
    const items = await client.query("SELECT id FROM order_items WHERE order_id=$1 AND id=ANY($2::uuid[]) FOR UPDATE", [input.orderId, itemIds]);
    if (items.rows.length !== itemIds.length) throw conflict("Every purchase order line must belong to the selected order.");
    const merchandiseCents = input.lines.reduce((sum, line) => sum + line.quantity * (line.unitCostCents + line.coreChargeCents), 0);
    const { rows } = await client.query(`
      INSERT INTO supplier_purchase_orders (
        order_id, supplier_id, purchase_order_number, supplier_order_reference, state,
        merchandise_cents, freight_cents, tax_cents, estimated_ship_at, created_by
      ) VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$8,$9) RETURNING *
    `, [input.orderId, input.supplierId, input.purchaseOrderNumber, input.supplierOrderReference,
      merchandiseCents, input.freightCents, input.taxCents, input.estimatedShipAt, principal.id]);
    for (const [index, line] of input.lines.entries()) {
      await client.query(`
        INSERT INTO supplier_purchase_order_lines (
          purchase_order_id, order_id, supplier_id, order_item_id, line_number,
          supplier_sku_snapshot, description, quantity, unit_cost_cents, core_charge_cents
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `, [rows[0].id, input.orderId, input.supplierId, line.orderItemId, index + 1,
        line.supplierSku, line.description, line.quantity, line.unitCostCents, line.coreChargeCents]);
    }
    await client.query(`
      INSERT INTO purchase_order_state_history (purchase_order_id, to_state, reason, created_by)
      VALUES ($1,'draft',$2,$3)
    `, [rows[0].id, input.reason, principal.id]);
    const detail = await client.query("SELECT public_order_number FROM orders WHERE id=$1", [input.orderId]);
    const supplier = await client.query("SELECT display_name FROM suppliers WHERE id=$1", [input.supplierId]);
    return purchaseOrderDto({ ...rows[0], public_order_number: detail.rows[0]?.public_order_number,
      supplier_name: supplier.rows[0]?.display_name, line_count: input.lines.length }, true);
  }

  async updatePurchaseOrder(client, id, input, principal, { includeFinancials = false } = {}) {
    const existing = await client.query("SELECT * FROM supplier_purchase_orders WHERE id=$1 FOR UPDATE", [id]);
    if (!existing.rows[0]) throw notFound("Purchase order not found.");
    if (existing.rows[0].version !== input.version) throw conflict("This purchase order changed after it was opened. Refresh and try again.");
    const allowed = {
      draft: ["approved", "canceled"], approved: ["submitted", "canceled"],
      submitted: ["acknowledged", "backordered", "canceled"],
      acknowledged: ["backordered", "partially_shipped", "shipped", "received", "canceled"],
      backordered: ["acknowledged", "partially_shipped", "shipped", "canceled"],
      partially_shipped: ["shipped", "received", "canceled"], shipped: ["received"],
      received: ["closed"], canceled: [], closed: [],
    };
    if (!allowed[existing.rows[0].state]?.includes(input.state)) throw conflict("That purchase order transition is not allowed.");
    if (input.state === "approved" && existing.rows[0].created_by === principal.id) {
      throw conflict("A different finance-capable staff member must approve this purchase order.");
    }
    const { rows } = await client.query(`
      UPDATE supplier_purchase_orders SET state=$2, supplier_order_reference=$3, estimated_ship_at=$4,
        approved_by=CASE WHEN $2='approved' THEN $5 ELSE approved_by END,
        approved_at=CASE WHEN $2='approved' THEN now() ELSE approved_at END,
        submitted_at=CASE WHEN $2='submitted' THEN now() ELSE submitted_at END,
        acknowledged_at=CASE WHEN $2='acknowledged' THEN now() ELSE acknowledged_at END,
        canceled_at=CASE WHEN $2='canceled' THEN now() ELSE NULL END,
        cancellation_reason=CASE WHEN $2='canceled' THEN $6 ELSE NULL END,
        version=version+1 WHERE id=$1 RETURNING *
    `, [id, input.state, input.supplierOrderReference, input.estimatedShipAt, principal.id, input.cancellationReason]);
    await client.query(`
      INSERT INTO purchase_order_state_history (purchase_order_id, from_state, to_state, reason, created_by)
      VALUES ($1,$2,$3,$4,$5)
    `, [id, existing.rows[0].state, input.state, input.reason, principal.id]);
    if (input.state === "submitted") {
      const advanced = await client.query(`
        UPDATE orders SET fulfillment_status='supplier_ordered', version=version+1
        WHERE id=$1 AND fulfillment_status='ready_for_supplier'
        RETURNING id
      `, [rows[0].order_id]);
      if (advanced.rows[0]) {
        await client.query(`
          INSERT INTO status_history (order_id,workflow,from_state,to_state,reason,actor_staff_user_id)
          VALUES ($1,'fulfillment','ready_for_supplier','supplier_ordered',$2,$3)
        `, [rows[0].order_id, `Purchase order ${rows[0].purchase_order_number} submitted`, principal.id]);
      }
    }
    const detail = await client.query(`
      SELECT o.public_order_number, s.display_name AS supplier_name,
        (SELECT count(*) FROM supplier_purchase_order_lines WHERE purchase_order_id=$1) AS line_count
      FROM orders o JOIN suppliers s ON s.id=$2 WHERE o.id=$3
    `, [id, rows[0].supplier_id, rows[0].order_id]);
    return purchaseOrderDto({ ...rows[0], ...detail.rows[0] }, includeFinancials);
  }

  async listShipments({ page, pageSize, status = "" }) {
    const offset = (page - 1) * pageSize;
    const { rows } = await this.pool.query(`
      SELECT fs.*, o.public_order_number, count(si.order_item_id) AS item_count, count(*) OVER() AS total_count
      FROM fulfillment_shipments fs JOIN orders o ON o.id=fs.order_id
      LEFT JOIN shipment_items si ON si.shipment_id=fs.id
      WHERE $3='' OR fs.status=$3
      GROUP BY fs.id, o.public_order_number
      ORDER BY CASE fs.status WHEN 'exception' THEN 1 WHEN 'planned' THEN 2 WHEN 'booked' THEN 3 ELSE 4 END,
        fs.created_at DESC LIMIT $1 OFFSET $2
    `, [pageSize, offset, status.trim()]);
    return { items: rows.map(shipmentDto), page, pageSize, total: rows[0] ? asInteger(rows[0].total_count) : 0 };
  }

  async createShipment(client, input, principal) {
    const { rows } = await client.query(`
      INSERT INTO fulfillment_shipments (
        order_id, purchase_order_id, warranty_claim_id, direction, carrier, service_level,
        tracking_number, bol_or_pro_number, status, shipped_at, delivered_at, exception_reason
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [input.orderId, input.purchaseOrderId, input.warrantyClaimId || null, input.direction,
      input.carrier, input.serviceLevel, input.trackingNumber, input.bolOrProNumber,
      input.status, input.shippedAt, input.deliveredAt, input.exceptionReason]);
    for (const item of input.items) {
      await client.query(`
        INSERT INTO shipment_items (
          shipment_id, order_id, purchase_order_id, purchase_order_line_id,
          order_item_id, quantity, unit_serial_number
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [rows[0].id, input.orderId, input.purchaseOrderId, item.purchaseOrderLineId || null,
        item.orderItemId, item.quantity, item.unitSerialNumber]);
    }
    await client.query(`
      INSERT INTO shipment_state_history (shipment_id, to_state, reason, created_by)
      VALUES ($1,$2,$3,$4)
    `, [rows[0].id, input.status, input.reason, principal.id]);
    const order = await client.query("SELECT public_order_number FROM orders WHERE id=$1", [input.orderId]);
    return shipmentDto({ ...rows[0], public_order_number: order.rows[0]?.public_order_number, item_count: input.items.length });
  }

  async updateShipment(client, id, input, principal) {
    const existing = await client.query("SELECT * FROM fulfillment_shipments WHERE id=$1 FOR UPDATE", [id]);
    if (!existing.rows[0]) throw notFound("Shipment not found.");
    if (existing.rows[0].version !== input.version) throw conflict("This shipment changed after it was opened. Refresh and try again.");
    const allowed = { planned: ["booked", "canceled"], booked: ["in_transit", "exception", "canceled"],
      in_transit: ["delivered", "exception"], exception: ["booked", "in_transit", "canceled"], delivered: [], canceled: [] };
    if (!allowed[existing.rows[0].status]?.includes(input.status)) throw conflict("That shipment transition is not allowed.");
    if (input.status === "in_transit" && (!input.shippedAt || (!input.trackingNumber && !input.bolOrProNumber))) {
      throw conflict("In-transit shipments require a shipped time and tracking or PRO evidence.");
    }
    if (input.status === "delivered" && !input.deliveredAt) throw conflict("Delivered shipments require a delivery time.");
    const { rows } = await client.query(`
      UPDATE fulfillment_shipments SET carrier=$2, service_level=$3, tracking_number=$4,
        bol_or_pro_number=$5, status=$6, shipped_at=$7, delivered_at=$8,
        exception_reason=$9, version=version+1 WHERE id=$1 RETURNING *
    `, [id, input.carrier, input.serviceLevel, input.trackingNumber, input.bolOrProNumber,
      input.status, input.shippedAt, input.deliveredAt, input.exceptionReason]);
    await client.query(`
      INSERT INTO shipment_state_history (shipment_id, from_state, to_state, reason, created_by)
      VALUES ($1,$2,$3,$4,$5)
    `, [id, existing.rows[0].status, input.status, input.reason, principal.id]);
    if (input.status === "in_transit") {
      const orderState = await client.query("SELECT fulfillment_status FROM orders WHERE id=$1 FOR UPDATE", [rows[0].order_id]);
      const fromState = orderState.rows[0]?.fulfillment_status;
      const advanced = await client.query(`
        UPDATE orders SET fulfillment_status='shipped', version=version+1
        WHERE id=$1 AND fulfillment_status IN ('supplier_ordered','building') RETURNING id
      `, [rows[0].order_id]);
      if (advanced.rows[0]) {
        await client.query(`
          INSERT INTO status_history (order_id,workflow,from_state,to_state,reason,actor_staff_user_id)
          VALUES ($1,'fulfillment',$2,'shipped',$3,$4)
        `, [rows[0].order_id, fromState, `Shipment ${id} entered transit`, principal.id]);
      }
    } else if (input.status === "delivered") {
      const advanced = await client.query(`
        UPDATE orders SET fulfillment_status='delivered', version=version+1
        WHERE id=$1 AND fulfillment_status='shipped' RETURNING id
      `, [rows[0].order_id]);
      if (advanced.rows[0]) {
        await client.query(`
          INSERT INTO status_history (order_id,workflow,from_state,to_state,reason,actor_staff_user_id)
          VALUES ($1,'fulfillment','shipped','delivered',$2,$3)
        `, [rows[0].order_id, `Shipment ${id} delivered`, principal.id]);
      }
    }
    const detail = await client.query(`
      SELECT o.public_order_number, (SELECT count(*) FROM shipment_items WHERE shipment_id=$1) AS item_count
      FROM orders o WHERE o.id=$2
    `, [id, rows[0].order_id]);
    return shipmentDto({ ...rows[0], ...detail.rows[0] });
  }

  async listWarrantyClaims({ page, pageSize, status = "", includeFinancials = false }) {
    const offset = (page - 1) * pageSize;
    const { rows } = await this.pool.query(`
      SELECT wc.*, o.public_order_number, oi.title_snapshot AS item_title,
        s.display_name AS supplier_name, su.display_name AS assignee_name, count(*) OVER() AS total_count
      FROM warranty_claims wc JOIN orders o ON o.id=wc.order_id
      LEFT JOIN order_items oi ON oi.id=wc.order_item_id
      LEFT JOIN suppliers s ON s.id=wc.supplier_id LEFT JOIN staff_users su ON su.id=wc.assigned_to
      WHERE $3='' OR wc.state::text=$3
      ORDER BY CASE WHEN wc.evidence_deadline < now() AND wc.state IN ('intake','evidence_needed') THEN 0 ELSE 1 END,
        wc.evidence_deadline NULLS LAST, wc.created_at DESC LIMIT $1 OFFSET $2
    `, [pageSize, offset, status.trim()]);
    return { items: rows.map((row) => warrantyClaimDto(row, includeFinancials)), page, pageSize, total: rows[0] ? asInteger(rows[0].total_count) : 0 };
  }

  async createWarrantyClaim(client, input, principal) {
    const { rows } = await client.query(`
      INSERT INTO warranty_claims (
        order_id, order_item_id, supplier_id, supplier_claim_reference, state,
        installed_at, mileage_at_install, mileage_at_claim, installer_name, complaint,
        evidence_deadline, decision_reason, assigned_to
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [input.orderId, input.orderItemId, input.supplierId, input.supplierClaimReference,
      input.state, input.installedAt, input.mileageAtInstall, input.mileageAtClaim,
      input.installerName, input.complaint, input.evidenceDeadline, input.decisionReason,
      input.assignedTo === undefined ? null : input.assignedTo]);
    await client.query(`
      INSERT INTO warranty_claim_state_history (warranty_claim_id, to_state, reason, created_by)
      VALUES ($1,$2,$3,$4)
    `, [rows[0].id, input.state, input.reason, principal.id]);
    const detail = await client.query(`
      SELECT o.public_order_number, oi.title_snapshot AS item_title, s.display_name AS supplier_name,
        su.display_name AS assignee_name FROM orders o
      LEFT JOIN order_items oi ON oi.id=$2 LEFT JOIN suppliers s ON s.id=$3
      LEFT JOIN staff_users su ON su.id=$4 WHERE o.id=$1
    `, [input.orderId, input.orderItemId, input.supplierId, input.assignedTo || null]);
    return warrantyClaimDto({ ...rows[0], ...detail.rows[0] }, false);
  }

  async updateWarrantyClaim(client, id, input, principal, { includeFinancials = false } = {}) {
    const existing = await client.query("SELECT * FROM warranty_claims WHERE id=$1 FOR UPDATE", [id]);
    if (!existing.rows[0]) throw notFound("Warranty claim not found.");
    if (existing.rows[0].version !== input.version) throw conflict("This warranty claim changed after it was opened. Refresh and try again.");
    const allowed = { intake: ["evidence_needed", "submitted", "closed"], evidence_needed: ["submitted", "closed"],
      submitted: ["authorized", "denied", "evidence_needed"], authorized: ["repairing", "replacement_shipping", "reimbursing", "resolved"],
      denied: ["closed"], repairing: ["resolved"], replacement_shipping: ["resolved"], reimbursing: ["resolved"],
      resolved: ["closed"], closed: [] };
    if (!allowed[existing.rows[0].state]?.includes(input.state)) throw conflict("That warranty transition is not allowed.");
    const assignedTo = input.assignedTo === undefined ? existing.rows[0].assigned_to : input.assignedTo;
    const { rows } = await client.query(`
      UPDATE warranty_claims SET state=$2, supplier_claim_reference=$3, installed_at=$4,
        mileage_at_install=$5, mileage_at_claim=$6, installer_name=$7, evidence_deadline=$8,
        decision_reason=$9, approved_parts_cents=COALESCE($10,approved_parts_cents),
        approved_labor_cents=COALESCE($11,approved_labor_cents),
        approved_freight_cents=COALESCE($12,approved_freight_cents),
        authorized_replacement_quantity=COALESCE($13, authorized_replacement_quantity),
        assigned_to=$14, resolved_at=CASE WHEN $2 IN ('resolved','closed') THEN COALESCE(resolved_at,now()) ELSE NULL END,
        version=version+1 WHERE id=$1 RETURNING *
    `, [id, input.state, input.supplierClaimReference, input.installedAt, input.mileageAtInstall,
      input.mileageAtClaim, input.installerName, input.evidenceDeadline, input.decisionReason,
      input.approvedPartsCents, input.approvedLaborCents, input.approvedFreightCents,
      input.authorizedReplacementQuantity, assignedTo]);
    await client.query(`
      INSERT INTO warranty_claim_state_history (warranty_claim_id, from_state, to_state, reason, created_by)
      VALUES ($1,$2,$3,$4,$5)
    `, [id, existing.rows[0].state, input.state, input.reason, principal.id]);
    const detail = await client.query(`
      SELECT o.public_order_number, oi.title_snapshot AS item_title, s.display_name AS supplier_name,
        su.display_name AS assignee_name FROM orders o
      LEFT JOIN order_items oi ON oi.id=$2 LEFT JOIN suppliers s ON s.id=$3
      LEFT JOIN staff_users su ON su.id=$4 WHERE o.id=$1
    `, [rows[0].order_id, rows[0].order_item_id, rows[0].supplier_id, rows[0].assigned_to]);
    return warrantyClaimDto({ ...rows[0], ...detail.rows[0] }, includeFinancials);
  }

  async listOrders({ page, pageSize, search = "", status = "", includeFinancials = false }) {
    const offset = (page - 1) * pageSize;
    const values = [pageSize, offset, search.trim(), status.trim()];
    const { rows } = await this.pool.query(`
      SELECT o.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
             v.vin, v.year, v.make, v.model,
             a.line1 AS delivery_line1, a.line2 AS delivery_line2, a.city AS delivery_city,
             a.region AS delivery_region, a.postal_code AS delivery_postal_code,
             a.country_code AS delivery_country_code, a.location_type AS delivery_location_type,
             qv.transmission_family, qv.package_name, qv.customer_unit_price_cents,
             qv.list_unit_price_cents, qv.promotion_code, qv.promotion_discount_cents,
             qv.core_deposit_cents, qv.freight_charged_cents,
             qv.supplier_unit_cost_cents, qv.supplier_freight_cost_cents,
             COALESCE((SELECT sum(pt.amount_cents) FROM payment_transactions pt
               WHERE pt.order_id = o.id AND pt.transaction_type IN ('charge', 'payment')
                 AND pt.status IN ('paid', 'succeeded')), 0) AS collected_cents,
             count(*) OVER() AS total_count
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN vehicles v ON v.id = o.vehicle_id
      JOIN addresses a ON a.id = o.delivery_address_id
      JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
      WHERE ($3 = '' OR c.name ILIKE '%' || $3 || '%' OR c.email ILIKE '%' || $3 || '%'
        OR v.vin ILIKE '%' || $3 || '%' OR o.public_order_number::text = $3)
        AND ($4 = '' OR o.payment_status::text = $4 OR o.fulfillment_status::text = $4 OR o.core_status::text = $4)
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT $1 OFFSET $2
    `, values);
    return {
      items: rows.map((row) => orderDto(row, includeFinancials)),
      page,
      pageSize,
      total: rows[0] ? asInteger(rows[0].total_count) : 0,
    };
  }

  async getOrder(id, { includeFinancials = false } = {}) {
    const list = await this.pool.query(`
      SELECT o.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
             v.vin, v.year, v.make, v.model,
             a.line1 AS delivery_line1, a.line2 AS delivery_line2, a.city AS delivery_city,
             a.region AS delivery_region, a.postal_code AS delivery_postal_code,
             a.country_code AS delivery_country_code, a.location_type AS delivery_location_type,
             qv.transmission_family, qv.package_name, qv.customer_unit_price_cents,
             qv.list_unit_price_cents, qv.promotion_code, qv.promotion_discount_cents,
             qv.core_deposit_cents, qv.freight_charged_cents,
             qv.supplier_unit_cost_cents, qv.supplier_freight_cost_cents,
             COALESCE((SELECT sum(pt.amount_cents) FROM payment_transactions pt
               WHERE pt.order_id = o.id AND pt.transaction_type IN ('charge', 'payment')
                 AND pt.status IN ('paid', 'succeeded')), 0) AS collected_cents
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN vehicles v ON v.id = o.vehicle_id
      JOIN addresses a ON a.id = o.delivery_address_id
      JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
      WHERE o.id = $1
    `, [id]);
    if (!list.rows[0]) throw notFound("Order not found.");
    const [history, notes, disputes, supplier, core, fitment, refunds, items] = await Promise.all([
      this.pool.query("SELECT workflow, from_state, to_state, reason, created_at FROM status_history WHERE order_id = $1 ORDER BY created_at DESC", [id]),
      this.pool.query(`
        SELECT note.id, note.note, note.created_at, staff.display_name AS author_name
        FROM order_notes note
        JOIN staff_users staff ON staff.id = note.created_by
        WHERE note.order_id = $1
        ORDER BY note.created_at DESC
      `, [id]),
      includeFinancials ? this.pool.query(`
        SELECT stripe_dispute_id, stripe_charge_id, amount_cents, currency, status,
               reason, evidence_due_at, opened_at, closed_at, updated_at
        FROM payment_disputes
        WHERE order_id = $1
        ORDER BY opened_at DESC
      `, [id]) : Promise.resolve({ rows: [] }),
      this.pool.query("SELECT supplier_name, supplier_order_reference, ordered_at, estimated_ship_at, shipped_at, carrier, tracking_number FROM supplier_orders WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1", [id]),
      this.pool.query("SELECT due_at, received_at, accepted_at, rejected_at, rejection_reason, refund_due_cents, stripe_refund_id FROM core_returns WHERE order_id = $1", [id]),
      this.pool.query("SELECT supplier_part_uid, decision, reason, reviewed_at FROM fitment_reviews WHERE order_id = $1 ORDER BY reviewed_at DESC LIMIT 1", [id]),
      this.pool.query(`
        SELECT pt.id, pt.stripe_object_id, pt.amount_cents, pt.currency, pt.occurred_at,
               COALESCE(jsonb_agg(jsonb_build_object('category', ra.category, 'amountCents', ra.amount_cents))
                 FILTER (WHERE ra.id IS NOT NULL), '[]'::jsonb) AS allocations
        FROM payment_transactions pt
        LEFT JOIN refund_allocations ra ON ra.payment_transaction_id = pt.id
        WHERE pt.order_id = $1 AND pt.transaction_type = 'refund' AND pt.status = 'succeeded'
        GROUP BY pt.id
        ORDER BY pt.occurred_at DESC
      `, [id]),
      this.pool.query(`
        SELECT oi.id, oi.line_number, oi.kind, oi.integrity_sku_snapshot, oi.supplier_sku_snapshot,
          oi.title_snapshot, oi.quantity, oi.unit_retail_cents, oi.unit_supplier_cost_cents,
          oi.core_deposit_cents, oi.fitment_snapshot, oi.warranty_snapshot,
          po.supplier_id, s.display_name AS supplier_name, pol.id AS purchase_order_line_id,
          po.id AS purchase_order_id
        FROM order_items oi
        LEFT JOIN LATERAL (
          SELECT line.* FROM supplier_purchase_order_lines line
          JOIN supplier_purchase_orders candidate ON candidate.id=line.purchase_order_id
          WHERE line.order_item_id=oi.id AND candidate.state <> 'canceled'
          ORDER BY candidate.created_at DESC LIMIT 1
        ) pol ON true
        LEFT JOIN supplier_purchase_orders po ON po.id=pol.purchase_order_id
        LEFT JOIN suppliers s ON s.id=po.supplier_id
        WHERE oi.order_id=$1 ORDER BY oi.line_number
      `, [id]),
    ]);
    return {
      ...orderDto(list.rows[0], includeFinancials),
      version: list.rows[0].version,
      timeline: history.rows.map((row) => ({ workflow: row.workflow, from: row.from_state, to: row.to_state, reason: row.reason, createdAt: row.created_at })),
      notes: notes.rows.map((row) => ({ id: row.id, note: row.note, authorName: row.author_name, createdAt: row.created_at })),
      items: items.rows.map((row) => ({
        id: row.id, lineNumber: row.line_number, kind: row.kind,
        integritySku: row.integrity_sku_snapshot, supplierSku: row.supplier_sku_snapshot,
        title: row.title_snapshot, quantity: row.quantity,
        unitRetailCents: asInteger(row.unit_retail_cents), coreDepositCents: asInteger(row.core_deposit_cents),
        fitment: row.fitment_snapshot, warranty: row.warranty_snapshot,
        purchaseOrderId: row.purchase_order_id, purchaseOrderLineId: row.purchase_order_line_id,
        supplier: row.supplier_id ? { id: row.supplier_id, name: row.supplier_name } : null,
        ...(includeFinancials ? { unitSupplierCostCents: row.unit_supplier_cost_cents === null ? null : asInteger(row.unit_supplier_cost_cents) } : {}),
      })),
      fitment: fitment.rows[0] ? {
        supplierPartUid: fitment.rows[0].supplier_part_uid,
        decision: fitment.rows[0].decision,
        reason: fitment.rows[0].reason,
        reviewedAt: fitment.rows[0].reviewed_at,
      } : null,
      supplier: supplier.rows[0] ? {
        name: supplier.rows[0].supplier_name,
        orderReference: supplier.rows[0].supplier_order_reference,
        orderedAt: supplier.rows[0].ordered_at,
        estimatedShipAt: supplier.rows[0].estimated_ship_at,
        shippedAt: supplier.rows[0].shipped_at,
        carrier: supplier.rows[0].carrier,
        trackingNumber: supplier.rows[0].tracking_number,
      } : null,
      core: core.rows[0] ? {
        dueAt: core.rows[0].due_at,
        receivedAt: core.rows[0].received_at,
        acceptedAt: core.rows[0].accepted_at,
        rejectedAt: core.rows[0].rejected_at,
        rejectionReason: core.rows[0].rejection_reason,
        refundDueCents: core.rows[0].refund_due_cents === null ? null : asInteger(core.rows[0].refund_due_cents),
        stripeRefundId: core.rows[0].stripe_refund_id,
      } : null,
      ...(includeFinancials ? { refunds: refunds.rows.map((row) => ({
          id: row.id,
          stripeRefundId: row.stripe_object_id,
          amountCents: asInteger(row.amount_cents),
          currency: row.currency,
          occurredAt: row.occurred_at,
          allocations: row.allocations.map((allocation) => ({ ...allocation, amountCents: asInteger(allocation.amountCents) })),
        })), disputes: disputes.rows.map((row) => ({
          stripeDisputeId: row.stripe_dispute_id,
          stripeChargeId: row.stripe_charge_id,
          amountCents: asInteger(row.amount_cents),
          currency: row.currency,
          status: row.status,
          reason: row.reason,
          evidenceDueAt: row.evidence_due_at,
          openedAt: row.opened_at,
          closedAt: row.closed_at,
          updatedAt: row.updated_at,
        })) } : {}),
    };
  }

  async listStaff(client = this.pool) {
    const { rows } = await client.query(`
      SELECT su.*,
             COALESCE(array_agg(ur.role::text) FILTER (WHERE ur.revoked_at IS NULL), ARRAY[]::text[]) AS roles
      FROM staff_users su
      LEFT JOIN user_roles ur ON ur.staff_user_id = su.id
      GROUP BY su.id
      ORDER BY su.disabled_at NULLS FIRST, su.display_name, su.id
    `);
    return rows.map(staffDto);
  }

  async listPromotions() {
    const { rows } = await this.pool.query(`
      SELECT pc.*, count(pr.order_id) FILTER (WHERE pr.status = 'applied') AS redemption_count
      FROM promotion_codes pc
      LEFT JOIN promotion_redemptions pr ON pr.promotion_id = pc.id
      GROUP BY pc.id
      ORDER BY pc.created_at DESC
    `);
    return rows.map(promotionDto);
  }

  async reservePromotion(request) {
    return withTransaction(this.pool, async (client) => {
      const existing = await client.query(`
        SELECT pr.*, pc.code
        FROM promotion_reservations pr
        JOIN promotion_codes pc ON pc.id = pr.promotion_id
        WHERE pr.checkout_attempt_key = $1
        FOR UPDATE OF pr
      `, [request.checkoutAttemptKey]);
      if (existing.rows[0]) {
        const row = existing.rows[0];
        const sameRequest = String(row.code).toUpperCase() === request.code
          && String(row.customer_email).toLowerCase() === request.customerEmail
          && asInteger(row.list_unit_price_cents) === request.listUnitPriceCents
          && asInteger(row.freight_charged_cents) === request.freightChargedCents
          && asInteger(row.supplier_unit_cost_cents) === request.supplierUnitCostCents
          && asInteger(row.supplier_freight_cost_cents) === request.supplierFreightCostCents;
        if (!sameRequest) throw conflict("This checkout attempt already reserved a different promotion.");
        if (row.status === "released"
          || (row.status === "reserved" && new Date(row.reserved_until) <= new Date())) {
          throw conflict("This promotion reservation expired. Refresh the order and try again.");
        }
        return {
          id: row.id,
          code: String(row.code).toUpperCase(),
          discountCents: asInteger(row.discount_cents),
          reservedUntil: row.reserved_until,
          repeated: true,
        };
      }

      const promotionResult = await client.query(`
        SELECT * FROM promotion_codes WHERE code = $1 FOR UPDATE
      `, [request.code]);
      const promotion = promotionResult.rows[0];
      if (!promotion) throw notFound("That promotion code is not valid.");
      const counts = await client.query(`
        SELECT
          (SELECT count(*) FROM promotion_redemptions
            WHERE promotion_id = $1
              AND status IN ('reserved', 'applied'))
          + (SELECT count(*) FROM promotion_reservations
            WHERE promotion_id = $1 AND status = 'reserved' AND reserved_until > now()) AS total_uses,
          (SELECT count(*) FROM promotion_redemptions pr
            JOIN customers c ON c.id = pr.customer_id
            WHERE pr.promotion_id = $1 AND lower(c.email) = lower($2)
              AND pr.status IN ('reserved', 'applied'))
          + (SELECT count(*) FROM promotion_reservations
            WHERE promotion_id = $1 AND lower(customer_email) = lower($2)
              AND status = 'reserved' AND reserved_until > now()) AS customer_uses
      `, [promotion.id, request.customerEmail]);
      let discount;
      try {
        discount = calculatePromotionDiscount({
          code: promotion.code,
          active: promotion.active && !promotion.disabled_at,
          approved: Boolean(promotion.approved_at),
          startsAt: promotion.starts_at,
          endsAt: promotion.ends_at,
          amountOffCents: promotion.amount_off_cents === null ? null : asInteger(promotion.amount_off_cents),
          percentOff: promotion.percent_off === null ? null : Number(promotion.percent_off),
          merchandiseCents: request.listUnitPriceCents + request.freightChargedCents,
          supplierCostCents: request.supplierUnitCostCents + request.supplierFreightCostCents,
          minimumMarginCents: asInteger(promotion.minimum_margin_cents),
          redemptionCount: asInteger(counts.rows[0].total_uses),
          maxRedemptions: promotion.max_redemptions,
          customerRedemptionCount: asInteger(counts.rows[0].customer_uses),
          maxRedemptionsPerCustomer: promotion.max_redemptions_per_customer,
        });
      } catch (error) {
        throw conflict(error.message);
      }
      if (discount.discountCents >= request.listUnitPriceCents) {
        throw conflict("That promotion cannot be applied to this transmission.");
      }
      const { rows } = await client.query(`
        INSERT INTO promotion_reservations (
          promotion_id, checkout_attempt_key, customer_email, list_unit_price_cents,
          freight_charged_cents, supplier_unit_cost_cents, supplier_freight_cost_cents,
          discount_cents, reserved_until
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id, reserved_until
      `, [promotion.id, request.checkoutAttemptKey, request.customerEmail, request.listUnitPriceCents,
        request.freightChargedCents, request.supplierUnitCostCents, request.supplierFreightCostCents,
        discount.discountCents, request.reservedUntil]);
      return {
        id: rows[0].id,
        code: discount.code,
        discountCents: discount.discountCents,
        reservedUntil: rows[0].reserved_until,
        repeated: false,
      };
    });
  }

  async consumePromotionReservation(client, snapshot, customerId, orderId) {
    if (!snapshot.promotionReservationId) {
      if (snapshot.promotionCode || snapshot.promotionDiscountCents) throw conflict("The promotion snapshot is incomplete.");
      return;
    }
    const { rows } = await client.query(`
      SELECT pr.*, pc.code
      FROM promotion_reservations pr
      JOIN promotion_codes pc ON pc.id = pr.promotion_id
      WHERE pr.id = $1
      FOR UPDATE OF pr
    `, [snapshot.promotionReservationId]);
    const reservation = rows[0];
    const valid = reservation
      && reservation.status === "reserved"
      && new Date(reservation.reserved_until) > new Date()
      && reservation.checkout_attempt_key === snapshot.checkoutAttemptKey
      && String(reservation.customer_email).toLowerCase() === snapshot.customer.email
      && String(reservation.code).toUpperCase() === snapshot.promotionCode
      && asInteger(reservation.list_unit_price_cents) === snapshot.listUnitPriceCents
      && asInteger(reservation.freight_charged_cents) === snapshot.freightChargedCents
      && asInteger(reservation.supplier_unit_cost_cents) === snapshot.supplierUnitCostCents
      && asInteger(reservation.supplier_freight_cost_cents) === snapshot.supplierFreightCostCents
      && asInteger(reservation.discount_cents) === snapshot.promotionDiscountCents;
    if (!valid) throw conflict("The promotion reservation is invalid or expired.");
    await client.query(`
      INSERT INTO promotion_redemptions (
        promotion_id, order_id, customer_id, amount_cents, status, reserved_until
      ) VALUES ($1,$2,$3,$4,'reserved',$5)
    `, [reservation.promotion_id, orderId, customerId, snapshot.promotionDiscountCents, reservation.reserved_until]);
    await client.query(`
      UPDATE promotion_reservations SET status = 'consumed', consumed_order_id = $2
      WHERE id = $1
    `, [reservation.id, orderId]);
  }

  async listFreightExceptions({ page, pageSize, status = "" }) {
    const { rows } = await this.pool.query(`
      SELECT fqr.*, su.display_name AS assignee_name, count(*) OVER() AS total_count
      FROM freight_quote_requests fqr
      LEFT JOIN staff_users su ON su.id = fqr.assigned_to
      WHERE ($3 = '' OR ($3 = 'active' AND fqr.status IN ('open', 'contacted', 'quoted')) OR fqr.status = $3)
      ORDER BY CASE WHEN fqr.next_follow_up_at IS NULL THEN 0 ELSE 1 END,
               fqr.next_follow_up_at, fqr.created_at
      LIMIT $1 OFFSET $2
    `, [pageSize, (page - 1) * pageSize, status]);
    return {
      items: rows.map((row) => ({
        id: row.id,
        reference: row.public_reference,
        customer: { name: row.name, email: row.email, phone: row.phone },
        vin: row.vin,
        destination: `${row.destination_region} ${row.destination_postal_code}`,
        locationType: row.location_type,
        selectionId: row.requested_selection_id,
        packageName: row.requested_package,
        failureCode: row.failure_code,
        supplierRequestId: row.failure_request_id,
        status: row.status,
        assignedTo: row.assigned_to,
        assigneeName: row.assignee_name,
        nextFollowUpAt: row.next_follow_up_at,
        resolutionNote: row.resolution_note,
        createdAt: row.created_at,
      })),
      page,
      pageSize,
      total: rows[0] ? asInteger(rows[0].total_count) : 0,
    };
  }

  async listAssignableStaff(capabilities = ["operations"]) {
    const { rows } = await this.pool.query(`
      SELECT DISTINCT su.id, su.display_name
      FROM staff_users su
      JOIN user_roles ur ON ur.staff_user_id = su.id
      WHERE su.disabled_at IS NULL AND ur.revoked_at IS NULL
        AND (ur.role = ANY($1::staff_role[]) OR ur.role = 'administrator')
      ORDER BY su.display_name, su.id
    `, [capabilities]);
    return rows.map((row) => ({ id: row.id, displayName: row.display_name }));
  }

  async listSystemExceptions({ page, pageSize }) {
    const { rows } = await this.pool.query(`
      SELECT exception_kind, exception_id, event_type, status, attempts, manual_requeues,
             next_attempt_at, occurred_at, last_error, count(*) OVER() AS total_count
      FROM (
        SELECT 'stripe_event'::text AS exception_kind, stripe_event_id AS exception_id,
               event_type, processing_status AS status, attempts, manual_requeues,
               next_attempt_at, received_at AS occurred_at, last_error
        FROM webhook_events
        WHERE processing_status IN ('retry', 'dead_letter')
        UNION ALL
        SELECT 'notification'::text AS exception_kind, id::text AS exception_id,
               topic AS event_type,
               CASE WHEN attempts >= 10 THEN 'dead_letter' ELSE 'retry' END AS status,
               attempts, manual_requeues, available_at AS next_attempt_at,
               created_at AS occurred_at, last_error
        FROM notification_outbox
        WHERE delivered_at IS NULL AND attempts >= 10
          AND (locked_until IS NULL OR locked_until < now())
      ) exceptions
      ORDER BY occurred_at, exception_kind, exception_id
      LIMIT $1 OFFSET $2
    `, [pageSize, (page - 1) * pageSize]);
    return {
      items: rows.map((row) => ({
        kind: row.exception_kind,
        id: row.exception_id,
        type: row.event_type,
        status: row.status,
        attempts: asInteger(row.attempts),
        manualRequeues: asInteger(row.manual_requeues),
        nextAttemptAt: row.next_attempt_at,
        occurredAt: row.occurred_at,
        lastError: row.last_error,
      })),
      page,
      pageSize,
      total: rows[0] ? asInteger(rows[0].total_count) : 0,
    };
  }

  async requeueSystemException(client, { kind, id }) {
    if (kind === "stripe_event") {
      const existing = await client.query(`
        SELECT processing_status AS status, attempts, manual_requeues,
               next_attempt_at, last_error
        FROM webhook_events
        WHERE stripe_event_id = $1 AND processing_status IN ('retry', 'dead_letter')
        FOR UPDATE
      `, [id]);
      if (!existing.rows[0]) throw conflict("That Stripe event is no longer waiting for recovery.");
      const { rows } = await client.query(`
        UPDATE webhook_events
        SET processing_status = 'retry', attempts = 0, manual_requeues = manual_requeues + 1,
            next_attempt_at = now(), locked_by = NULL, locked_until = NULL, last_error = NULL
        WHERE stripe_event_id = $1 AND processing_status IN ('retry', 'dead_letter')
        RETURNING stripe_event_id AS id, event_type AS type, processing_status AS status,
                  attempts, manual_requeues, next_attempt_at
      `, [id]);
      const data = {
        kind,
        id: rows[0].id,
        type: rows[0].type,
        status: rows[0].status,
        attempts: asInteger(rows[0].attempts),
        manualRequeues: asInteger(rows[0].manual_requeues),
        nextAttemptAt: rows[0].next_attempt_at,
      };
      const previous = existing.rows[0];
      return { data, beforeValue: {
        status: previous.status,
        attempts: asInteger(previous.attempts),
        manualRequeues: asInteger(previous.manual_requeues),
        nextAttemptAt: previous.next_attempt_at,
        lastError: previous.last_error,
      } };
    }
    const existing = await client.query(`
      SELECT CASE WHEN attempts >= 10 THEN 'dead_letter' ELSE 'retry' END AS status,
             attempts, manual_requeues, available_at AS next_attempt_at, last_error
      FROM notification_outbox
      WHERE id = $1 AND delivered_at IS NULL AND attempts >= 10
        AND (locked_until IS NULL OR locked_until < now())
      FOR UPDATE
    `, [id]);
    if (!existing.rows[0]) throw conflict("That notification is no longer waiting for recovery.");
    const { rows } = await client.query(`
      UPDATE notification_outbox
      SET attempts = 0, manual_requeues = manual_requeues + 1, available_at = now(),
          locked_by = NULL, locked_until = NULL, last_error = NULL
      WHERE id = $1 AND delivered_at IS NULL AND attempts >= 10
        AND (locked_until IS NULL OR locked_until < now())
      RETURNING id, topic AS type, attempts, manual_requeues, available_at AS next_attempt_at
    `, [id]);
    const data = {
      kind,
      id: rows[0].id,
      type: rows[0].type,
      status: "retry",
      attempts: asInteger(rows[0].attempts),
      manualRequeues: asInteger(rows[0].manual_requeues),
      nextAttemptAt: rows[0].next_attempt_at,
    };
    const previous = existing.rows[0];
    return { data, beforeValue: {
      status: previous.status,
      attempts: asInteger(previous.attempts),
      manualRequeues: asInteger(previous.manual_requeues),
      nextAttemptAt: previous.next_attempt_at,
      lastError: previous.last_error,
    } };
  }

  async financeReport({ startAt, endAt }) {
    const { rows } = await this.pool.query(`
      SELECT la.code, la.name, la.account_type,
             COALESCE(totals.debits, 0) AS debits,
             COALESCE(totals.credits, 0) AS credits
      FROM ledger_accounts la
      LEFT JOIN (
        SELECT jl.account_code, sum(jl.debit_cents) AS debits, sum(jl.credit_cents) AS credits
        FROM journal_lines jl
        JOIN journal_entries je ON je.id = jl.journal_entry_id
        JOIN ledger_accounts activity_account ON activity_account.code = jl.account_code
        WHERE je.occurred_at < $2
          AND (activity_account.account_type IN ('asset', 'liability', 'equity') OR je.occurred_at >= $1)
        GROUP BY jl.account_code
      ) totals ON totals.account_code = la.code
      WHERE la.active
      ORDER BY la.code
    `, [startAt, endAt]);
    return {
      startAt,
      endAt,
      accounts: rows.map((row) => ({
        code: row.code,
        name: row.name,
        type: row.account_type,
        basis: ["asset", "liability", "equity"].includes(row.account_type) ? "through_end" : "period",
        debitCents: asInteger(row.debits),
        creditCents: asInteger(row.credits),
      })),
    };
  }

  async getReconciliationByKey(key) {
    const { rows } = await this.pool.query("SELECT * FROM stripe_reconciliation_runs WHERE idempotency_key = $1", [key]);
    return rows[0] ? { data: reconciliationDto(rows[0]), requestHash: rows[0].request_sha256 } : null;
  }

  async recordReconciliation(data, { key, requestHash, principal, requestId }) {
    return withTransaction(this.pool, async (client) => {
      const inserted = await client.query(`
        INSERT INTO stripe_reconciliation_runs (
          period_start, period_end, stripe_payment_count, stripe_payment_cents,
          office_payment_count, office_payment_cents, unmatched_stripe_ids,
          unmatched_office_ids, amount_mismatches, initiated_by, idempotency_key, request_sha256
        ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12)
        ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
        RETURNING *
      `, [data.startAt, data.endAt, data.stripe.count, data.stripe.totalCents,
        data.office.count, data.office.totalCents, JSON.stringify(data.unmatchedStripe),
        JSON.stringify(data.unmatchedOffice), JSON.stringify(data.amountMismatches), principal.id, key, requestHash]);
      if (inserted.rows[0]) {
        const result = reconciliationDto(inserted.rows[0]);
        await client.query(`
          INSERT INTO audit_log (actor_subject, action, entity_type, entity_id, request_id, reason, after_value)
          VALUES ($1,'stripe.reconciliation_completed','stripe_reconciliation',$2,$3,$4,$5)
        `, [principal.subject, result.id, requestId, `Reconciled ${result.startAt} through ${result.endAt}`, {
          stripe: result.stripe,
          office: result.office,
          balanced: result.balanced,
          exceptionCount: result.unmatchedStripe.length + result.unmatchedOffice.length + result.amountMismatches.length,
        }]);
        return { repeated: false, data: result };
      }
      const existing = await client.query("SELECT * FROM stripe_reconciliation_runs WHERE idempotency_key = $1", [key]);
      if (!existing.rows[0]) throw new Error("Reconciliation idempotency conflict could not be resolved");
      if (existing.rows[0].request_sha256 !== requestHash) {
        throw conflict("That idempotency key was already used for a different request.");
      }
      return { repeated: true, data: reconciliationDto(existing.rows[0]) };
    });
  }

  async recentAudit({ page, pageSize }) {
    const { rows } = await this.pool.query(`
      SELECT id, actor_subject, action, entity_type, entity_id, request_id, reason, created_at,
             count(*) OVER() AS total_count
      FROM audit_log
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [pageSize, (page - 1) * pageSize]);
    return {
      items: rows.map((row) => ({ id: row.id, actor: row.actor_subject, action: row.action, entityType: row.entity_type, entityId: row.entity_id, requestId: row.request_id, reason: row.reason, createdAt: row.created_at })),
      page,
      pageSize,
      total: rows[0] ? asInteger(rows[0].total_count) : 0,
    };
  }

  async localStripePayments({ startAt, endAt }) {
    const { rows } = await this.pool.query(`
      SELECT cs.stripe_checkout_session_id, sum(pt.amount_cents) AS amount_cents
      FROM checkout_sessions cs
      JOIN orders o ON o.id = cs.order_id
      JOIN payment_transactions pt ON pt.order_id = o.id
        AND pt.transaction_type = 'payment' AND pt.status = 'succeeded'
      WHERE cs.stripe_created_at >= $1 AND cs.stripe_created_at < $2
      GROUP BY cs.stripe_checkout_session_id
      ORDER BY cs.stripe_checkout_session_id
    `, [startAt, endAt]);
    return rows.map((row) => ({ stripeSessionId: row.stripe_checkout_session_id, amountCents: asInteger(row.amount_cents) }));
  }

  async ingestCheckout(snapshot) {
    return withTransaction(this.pool, async (client) => {
      const existing = await client.query(`
        SELECT o.id, o.public_order_number
        FROM checkout_sessions cs JOIN orders o ON o.id = cs.order_id
        WHERE cs.stripe_checkout_session_id = $1
      `, [snapshot.stripeSessionId]);
      if (existing.rows[0]) return { id: existing.rows[0].id, orderNumber: String(existing.rows[0].public_order_number), repeated: true };

      const customer = await client.query(`
        INSERT INTO customers (stripe_customer_id, name, email, phone)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (stripe_customer_id) DO UPDATE
          SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone
        RETURNING id
      `, [snapshot.stripeCustomerId, snapshot.customer.name, snapshot.customer.email, snapshot.customer.phone]);
      const customerId = customer.rows[0].id;
      const vehicle = await client.query(`
        INSERT INTO vehicles (customer_id, vin, year, make, model, engine, drive_type, mileage)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (customer_id, vin) DO UPDATE
          SET year = COALESCE(EXCLUDED.year, vehicles.year), make = COALESCE(EXCLUDED.make, vehicles.make),
              model = COALESCE(EXCLUDED.model, vehicles.model), engine = COALESCE(EXCLUDED.engine, vehicles.engine),
              drive_type = COALESCE(EXCLUDED.drive_type, vehicles.drive_type), mileage = COALESCE(EXCLUDED.mileage, vehicles.mileage)
        RETURNING id
      `, [customerId, snapshot.vin, snapshot.vehicle.year, snapshot.vehicle.make, snapshot.vehicle.model,
        snapshot.vehicle.engine, snapshot.vehicle.driveType, snapshot.vehicle.mileage]);
      const address = await client.query(`
        INSERT INTO addresses (customer_id, line1, line2, city, region, postal_code, country_code, location_type)
        VALUES ($1,$2,$3,$4,$5,$6,'US',$7) RETURNING id
      `, [customerId, snapshot.address.line1, snapshot.address.line2, snapshot.address.city,
        snapshot.address.region, snapshot.address.postalCode, snapshot.address.locationType]);
      const quote = await client.query(`
        INSERT INTO quotes (customer_id, vehicle_id, current_version, expires_at)
        VALUES ($1,$2,1,$3) RETURNING id
      `, [customerId, vehicle.rows[0].id, snapshot.expiresAt]);
      await client.query(`
        INSERT INTO quote_versions (
          quote_id, version, selection_id, transmission_family, package_name, warranty_text,
          availability_code, availability_text, supplier_unit_cost_cents, customer_unit_price_cents,
          core_deposit_cents, freight_charged_cents, supplier_freight_cost_cents, currency,
          supplier_snapshot, freight_snapshot, terms_version, terms_sha256,
          policy_accepted_at, policy_acceptance,
          list_unit_price_cents, promotion_code, promotion_discount_cents
        ) VALUES ($1,1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      `, [quote.rows[0].id, snapshot.selectionId, snapshot.application, snapshot.packageName,
        snapshot.warranty, snapshot.availability.code, snapshot.availability.text,
        snapshot.supplierUnitCostCents, snapshot.customerUnitPriceCents, snapshot.coreDepositCents,
        snapshot.freightChargedCents, snapshot.supplierFreightCostCents, snapshot.currency,
        snapshot.supplierSnapshot, snapshot.freightSnapshot, snapshot.termsVersion, snapshot.termsSha256,
        snapshot.policyAcceptedAt, snapshot.policyAcceptance,
        snapshot.listUnitPriceCents, snapshot.promotionCode, snapshot.promotionDiscountCents]);
      const order = await client.query(`
        INSERT INTO orders (
          customer_id, vehicle_id, delivery_address_id, quote_id, quote_version, core_status
        ) VALUES ($1,$2,$3,$4,1,$5)
        RETURNING id, public_order_number
      `, [customerId, vehicle.rows[0].id, address.rows[0].id, quote.rows[0].id,
        snapshot.coreDepositCents > 0 ? "awaiting_return" : "not_required"]);
      const orderItem = await client.query(`
        INSERT INTO order_items (
          order_id, line_number, kind, integrity_sku_snapshot, supplier_sku_snapshot,
          title_snapshot, quantity, unit_retail_cents, unit_supplier_cost_cents,
          core_deposit_cents, fitment_snapshot, warranty_snapshot, configuration_snapshot
        ) VALUES (
          $1, 1, 'transmission', $2, $3, $4, 1, $5, $6, $7,
          $8::jsonb, $9::jsonb, $10::jsonb
        )
        RETURNING id
      `, [order.rows[0].id, snapshot.selectionId, snapshot.supplierSnapshot?.partUid || null,
        `${snapshot.application} · ${snapshot.packageName}`, snapshot.customerUnitPriceCents,
        snapshot.supplierUnitCostCents, snapshot.coreDepositCents,
        JSON.stringify({ vin: snapshot.vin, application: snapshot.application }),
        JSON.stringify({ description: snapshot.warranty }), JSON.stringify(snapshot.supplierSnapshot || {})]);
      if (snapshot.coreDepositCents > 0) {
        await client.query(`
          INSERT INTO order_item_core_obligations (
            order_id, order_item_id, quantity, deposit_cents, state
          ) VALUES ($1, $2, 1, $3, 'awaiting_return')
        `, [order.rows[0].id, orderItem.rows[0].id, snapshot.coreDepositCents]);
      }
      await this.consumePromotionReservation(client, snapshot, customerId, order.rows[0].id);
      await client.query(`
        INSERT INTO checkout_sessions (
          order_id, stripe_checkout_session_id, stripe_created_at,
          stripe_payment_intent_id, idempotency_key, expires_at
        ) VALUES ($1,$2,$3,$4,$5,$6)
      `, [order.rows[0].id, snapshot.stripeSessionId, snapshot.stripeSessionCreatedAt,
        snapshot.stripePaymentIntentId, snapshot.checkoutAttemptKey, snapshot.expiresAt]);
      await client.query(`
        INSERT INTO status_history (order_id, workflow, to_state, reason, source_event_id)
        VALUES ($1, 'payment', 'checkout_open', 'Stripe Checkout Session created', $2),
               ($1, 'fulfillment', 'fitment_review', 'Awaiting final fitment approval', $2),
               ($1, 'core', $3, 'Core-return obligation established from checkout', $2)
      `, [order.rows[0].id, snapshot.stripeSessionId, snapshot.coreDepositCents > 0 ? "awaiting_return" : "not_required"]);
      await client.query(`
        INSERT INTO audit_log (actor_subject, action, entity_type, entity_id, request_id, reason, after_value)
        VALUES ('system:storefront', 'order.checkout_created', 'order', $1, $2, 'Server-verified storefront checkout', $3)
      `, [order.rows[0].id, snapshot.requestId, { stripeSessionId: snapshot.stripeSessionId, selectionId: snapshot.selectionId }]);
      return { id: order.rows[0].id, orderNumber: String(order.rows[0].public_order_number), repeated: false };
    });
  }

  async ingestFreightRequest(request) {
    return withTransaction(this.pool, async (client) => {
      const { rows } = await client.query(`
        INSERT INTO freight_quote_requests (
          public_reference, vin, name, email, phone, destination_postal_code,
          destination_region, location_type, requested_selection_id,
          requested_package, failure_code, failure_request_id, next_follow_up_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now())
        ON CONFLICT (public_reference) DO NOTHING
        RETURNING id, public_reference
      `, [request.publicReference, request.vin, request.name, request.email, request.phone,
        request.destinationPostalCode, request.destinationRegion, request.locationType,
        request.requestedSelectionId, request.requestedPackage, request.failureCode,
        request.failureRequestId]);
      if (rows[0]) {
        await client.query(`
          INSERT INTO notification_outbox (topic, deduplication_key, payload)
          VALUES ('freight.assistance.requested', $1, $2)
          ON CONFLICT (deduplication_key) DO NOTHING
        `, [`freight-assistance:${rows[0].id}`, { freightRequestId: rows[0].id, reference: rows[0].public_reference }]);
        return { id: rows[0].id, reference: rows[0].public_reference, repeated: false };
      }
      const existing = await client.query(
        "SELECT id, public_reference FROM freight_quote_requests WHERE public_reference = $1",
        [request.publicReference],
      );
      if (!existing.rows[0]) throw new Error("Freight request conflict could not be resolved");
      return { id: existing.rows[0].id, reference: existing.rows[0].public_reference, repeated: true };
    });
  }

  async executeIdempotent({ scope, key, requestHash, principal, requestId, action }) {
    return withTransaction(this.pool, async (client) => {
      const inserted = await client.query(`
        INSERT INTO idempotency_requests (scope, idempotency_key, request_sha256, locked_until, expires_at)
        VALUES ($1, $2, $3, now() + interval '30 seconds', now() + interval '24 hours')
        ON CONFLICT DO NOTHING
        RETURNING scope
      `, [scope, key, requestHash]);
      if (!inserted.rowCount) {
        const existing = await client.query("SELECT request_sha256, response_status, response_body, completed_at FROM idempotency_requests WHERE scope = $1 AND idempotency_key = $2 FOR UPDATE", [scope, key]);
        const row = existing.rows[0];
        if (!row || row.request_sha256 !== requestHash) throw conflict("That idempotency key was already used for a different request.");
        if (row.completed_at) return { repeated: true, statusCode: row.response_status, body: row.response_body };
        throw conflict("The same request is already being processed. Try again shortly.");
      }
      const result = await action(client);
      await client.query(`
        UPDATE idempotency_requests
        SET response_status = $3, response_body = $4, completed_at = now(), locked_until = NULL
        WHERE scope = $1 AND idempotency_key = $2
      `, [scope, key, result.statusCode, result.body]);
      await client.query(`
        INSERT INTO audit_log (actor_subject, action, entity_type, entity_id, request_id, reason, before_value, after_value)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [principal.subject, result.audit.action, result.audit.entityType, result.audit.entityId, requestId,
        result.audit.reason, result.audit.beforeValue || null, result.audit.afterValue || null]);
      return { repeated: false, ...result };
    });
  }

  async createPromotion(client, input, principal) {
    try {
      const { rows } = await client.query(`
        INSERT INTO promotion_codes (
          code, amount_off_cents, percent_off, starts_at, ends_at, max_redemptions,
          max_redemptions_per_customer, minimum_margin_cents, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *, 0::bigint AS redemption_count
      `, [input.code, input.amountOffCents, input.percentOff, input.startsAt, input.endsAt,
        input.maxRedemptions, input.maxRedemptionsPerCustomer, input.minimumMarginCents, principal.id]);
      return promotionDto(rows[0]);
    } catch (error) {
      if (error.code === "23505") throw conflict("That promotion code already exists.");
      throw error;
    }
  }

  async approvePromotion(client, id, principal) {
    const { rows } = await client.query(`
      UPDATE promotion_codes
      SET approved_by = $2, approved_at = now()
      WHERE id = $1 AND approved_at IS NULL AND disabled_at IS NULL AND created_by <> $2
      RETURNING *, (SELECT count(*) FROM promotion_redemptions WHERE promotion_id = $1 AND status = 'applied')::bigint AS redemption_count
    `, [id, principal.id]);
    if (!rows[0]) throw conflict("A different administrator must approve an active, unapproved promotion.");
    return promotionDto(rows[0]);
  }

  async disablePromotion(client, id, principal, reason) {
    const { rows } = await client.query(`
      UPDATE promotion_codes
      SET active = false, disabled_by = $2, disabled_at = now(), disable_reason = $3
      WHERE id = $1 AND disabled_at IS NULL
      RETURNING *, (SELECT count(*) FROM promotion_redemptions WHERE promotion_id = $1 AND status = 'applied')::bigint AS redemption_count
    `, [id, principal.id, reason]);
    if (!rows[0]) throw conflict("The promotion is missing or already disabled.");
    return promotionDto(rows[0]);
  }

  async createStaff(client, input, principal) {
    try {
      const created = await client.query(`
        INSERT INTO staff_users (auth0_subject, email, display_name)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [input.auth0Subject, input.email, input.displayName]);
      for (const role of input.roles) {
        await client.query(`
          INSERT INTO user_roles (staff_user_id, role, granted_by, reason)
          VALUES ($1, $2, $3, $4)
        `, [created.rows[0].id, role, principal.id, input.reason]);
      }
      const rows = await this.listStaff(client);
      return rows.find((row) => row.id === created.rows[0].id);
    } catch (error) {
      if (error.code === "23505") throw conflict("That Auth0 identity or work email is already assigned to a staff account.");
      throw error;
    }
  }

  async updateStaffAccess(client, id, input, principal) {
    if (id === principal.id) throw conflict("Use another administrator to change your own Office access.");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('integrity-office:staff-admin-guard', 0))");
    const targetResult = await client.query(`
      SELECT su.id, su.disabled_at,
             ARRAY(
               SELECT ur.role::text FROM user_roles ur
               WHERE ur.staff_user_id = su.id AND ur.revoked_at IS NULL
             ) AS roles
      FROM staff_users su
      WHERE su.id = $1
      FOR UPDATE OF su
    `, [id]);
    const target = targetResult.rows[0];
    if (!target) throw notFound("Staff account not found.");
    const currentRoles = normalizeRoles(target.roles);
    if (currentRoles.includes("administrator") && (!input.active || !input.roles.includes("administrator"))) {
      const remaining = await client.query(`
        SELECT count(DISTINCT su.id) AS count
        FROM staff_users su
        JOIN user_roles ur ON ur.staff_user_id = su.id
        WHERE su.id <> $1 AND su.disabled_at IS NULL
          AND ur.role = 'administrator' AND ur.revoked_at IS NULL
      `, [id]);
      if (asInteger(remaining.rows[0].count) < 1) throw conflict("The last active administrator cannot be removed or disabled.");
    }
    await client.query(`
      UPDATE user_roles
      SET revoked_by = $2, revoked_at = now(), revocation_reason = $3
      WHERE staff_user_id = $1 AND revoked_at IS NULL AND NOT (role = ANY($4::staff_role[]))
    `, [id, principal.id, input.reason, input.roles]);
    for (const role of input.roles) {
      await client.query(`
        INSERT INTO user_roles (staff_user_id, role, granted_by, reason)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (
          SELECT 1 FROM user_roles WHERE staff_user_id = $1 AND role = $2 AND revoked_at IS NULL
        )
      `, [id, role, principal.id, input.reason]);
    }
    await client.query("UPDATE staff_users SET disabled_at = CASE WHEN $2 THEN NULL ELSE now() END WHERE id = $1", [id, input.active]);
    const rows = await this.listStaff(client);
    return rows.find((row) => row.id === id);
  }

  async recordFitmentReview(client, { id, version, decision, supplierPartUid, reason }, principal) {
    const locked = await client.query(`
      SELECT o.id, o.version, o.fulfillment_status::text AS fulfillment_status,
             v.vin, qv.transmission_family
      FROM orders o
      JOIN vehicles v ON v.id = o.vehicle_id
      JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
      WHERE o.id = $1
      FOR UPDATE OF o
    `, [id]);
    const order = locked.rows[0];
    if (!order) throw notFound("Order not found.");
    if (order.version !== version) throw conflict("This order changed after it was opened. Refresh it before trying again.", { currentVersion: order.version });
    if (order.fulfillment_status !== "fitment_review") throw conflict("Fitment can be reviewed only while the order is awaiting fitment review.");
    const review = await client.query(`
      INSERT INTO fitment_reviews (
        order_id, vin, transmission_family, supplier_part_uid, decision, reason, reviewed_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, supplier_part_uid, decision, reason, reviewed_at
    `, [id, order.vin, order.transmission_family, supplierPartUid, decision, reason, principal.id]);
    const transition = await this.transitionOrder(client, {
      id,
      workflow: "fulfillment",
      target: decision === "approved" ? "ready_for_supplier" : "canceled",
      version,
      reason,
    }, principal);
    return {
      id: review.rows[0].id,
      supplierPartUid: review.rows[0].supplier_part_uid,
      decision: review.rows[0].decision,
      reason: review.rows[0].reason,
      reviewedAt: review.rows[0].reviewed_at,
      order: transition,
    };
  }

  async recordSupplierOrder(client, { id, version, supplierName, supplierOrderReference, estimatedShipAt, reason }, principal) {
    const exists = await client.query("SELECT id FROM orders WHERE id = $1", [id]);
    if (!exists.rowCount) throw notFound("Order not found.");
    let supplier;
    try {
      supplier = await client.query(`
        INSERT INTO supplier_orders (
          order_id, supplier_name, supplier_order_reference, approved_by, approved_at,
          ordered_at, estimated_ship_at
        ) VALUES ($1,$2,$3,$4,now(),now(),$5)
        RETURNING id, supplier_name, supplier_order_reference, ordered_at, estimated_ship_at
      `, [id, supplierName, supplierOrderReference, principal.id, estimatedShipAt]);
    } catch (error) {
      if (error.code === "23505") throw conflict("A supplier order is already recorded for this order.");
      throw error;
    }
    const transition = await this.transitionOrder(client, {
      id, workflow: "fulfillment", target: "supplier_ordered", version, reason,
    }, principal);
    return {
      id: supplier.rows[0].id,
      name: supplier.rows[0].supplier_name,
      orderReference: supplier.rows[0].supplier_order_reference,
      orderedAt: supplier.rows[0].ordered_at,
      estimatedShipAt: supplier.rows[0].estimated_ship_at,
      order: transition,
    };
  }

  async recordShipment(client, { id, version, carrier, trackingNumber, reason }, principal) {
    const supplier = await client.query(`
      UPDATE supplier_orders
      SET shipped_at = now(), carrier = $2, tracking_number = $3
      WHERE order_id = $1 AND shipped_at IS NULL
      RETURNING id, shipped_at, carrier, tracking_number
    `, [id, carrier, trackingNumber]);
    if (!supplier.rows[0]) throw conflict("Record the supplier order before recording shipment, or refresh if shipment is already present.");
    const transition = await this.transitionOrder(client, {
      id, workflow: "fulfillment", target: "shipped", version, reason,
    }, principal);
    return {
      id: supplier.rows[0].id,
      shippedAt: supplier.rows[0].shipped_at,
      carrier: supplier.rows[0].carrier,
      trackingNumber: supplier.rows[0].tracking_number,
      order: transition,
    };
  }

  async classifyRefund(client, { id, stripeRefundId, allocations, reason }, principal) {
    const financialResult = await client.query(`
      SELECT o.fulfillment_status::text AS fulfillment_status,
             o.core_status::text AS core_status, qv.customer_unit_price_cents,
             qv.freight_charged_cents, qv.core_deposit_cents, cr.refund_due_cents,
             COALESCE((
               SELECT sum(pt.amount_cents) FROM payment_transactions pt
               WHERE pt.order_id = o.id AND pt.transaction_type = 'payment' AND pt.status = 'succeeded'
             ), 0) AS captured_cents
      FROM orders o
      JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
      LEFT JOIN core_returns cr ON cr.order_id = o.id
      WHERE o.id = $1
      FOR UPDATE OF o
    `, [id]);
    const financial = financialResult.rows[0];
    if (!financial) throw notFound("Order not found.");
    const refundResult = await client.query(`
      SELECT id, order_id, amount_cents, currency, occurred_at
      FROM payment_transactions
      WHERE order_id = $1 AND stripe_object_id = $2
        AND transaction_type = 'refund' AND status = 'succeeded'
      FOR UPDATE
    `, [id, stripeRefundId]);
    const refund = refundResult.rows[0];
    if (!refund) throw notFound("Successful Stripe refund not found for this order.");
    const existing = await client.query("SELECT 1 FROM refund_allocations WHERE payment_transaction_id = $1", [refund.id]);
    if (existing.rowCount) throw conflict("That Stripe refund is already classified.");
    const total = allocations.reduce((sum, allocation) => sum + allocation.amountCents, 0);
    if (!Number.isSafeInteger(total) || total !== asInteger(refund.amount_cents)) {
      throw conflict("Refund allocations must equal the exact Stripe refund amount.");
    }
    const taxCents = asInteger(financial.captured_cents)
      - asInteger(financial.customer_unit_price_cents)
      - asInteger(financial.freight_charged_cents)
      - asInteger(financial.core_deposit_cents);
    if (taxCents < 0) throw conflict("The captured payment does not reconcile to the order snapshot.");
    const priorResult = await client.query(`
      SELECT category, sum(amount_cents) AS amount_cents
      FROM refund_allocations
      WHERE order_id = $1
      GROUP BY category
    `, [id]);
    const prior = Object.fromEntries(priorResult.rows.map((row) => [row.category, asInteger(row.amount_cents)]));
    const caps = {
      transmission: asInteger(financial.customer_unit_price_cents),
      freight: asInteger(financial.freight_charged_cents),
      sales_tax: taxCents,
      core_deposit: asInteger(financial.core_deposit_cents),
      other: asInteger(financial.captured_cents),
    };
    for (const allocation of allocations) {
      if ((prior[allocation.category] || 0) + allocation.amountCents > caps[allocation.category]) {
        throw conflict(`${allocation.category.replaceAll("_", " ")} refunds exceed the original order amount.`);
      }
    }
    const coreAllocation = allocations.find((allocation) => allocation.category === "core_deposit");
    let linkCoreRefund = false;
    if (coreAllocation) {
      const amountMatches = asInteger(financial.core_deposit_cents) === coreAllocation.amountCents;
      const activeCoreRefund = amountMatches
        && financial.core_status === "refund_due"
        && financial.refund_due_cents !== null
        && asInteger(financial.refund_due_cents) === coreAllocation.amountCents;
      const canceledOrderRefund = amountMatches
        && financial.fulfillment_status === "canceled"
        && financial.core_status === "not_required";
      if (!activeCoreRefund && !canceledOrderRefund) {
        throw conflict("The core-deposit allocation must equal a refund due or a canceled order's core deposit.");
      }
      linkCoreRefund = activeCoreRefund;
    }
    for (const allocation of allocations) {
      await client.query(`
        INSERT INTO refund_allocations (
          payment_transaction_id, order_id, category, amount_cents, classified_by, reason
        ) VALUES ($1,$2,$3,$4,$5,$6)
      `, [refund.id, id, allocation.category, allocation.amountCents, principal.id, reason]);
    }
    const entry = await client.query(`
      INSERT INTO journal_entries (order_id, source_type, source_id, description, currency, occurred_at)
      VALUES ($1, 'stripe_refund', $2, 'Stripe refund classified', $3, $4)
      RETURNING id
    `, [id, stripeRefundId, refund.currency, refund.occurred_at]);
    const accountByCategory = {
      transmission: "4000",
      freight: "4010",
      sales_tax: "2000",
      core_deposit: "2010",
      other: "6200",
    };
    for (const allocation of allocations) {
      await client.query(`
        INSERT INTO journal_lines (journal_entry_id, account_code, debit_cents, credit_cents)
        VALUES ($1,$2,$3,0)
      `, [entry.rows[0].id, accountByCategory[allocation.category], allocation.amountCents]);
    }
    await client.query(`
      INSERT INTO journal_lines (journal_entry_id, account_code, debit_cents, credit_cents)
      VALUES ($1,'1000',0,$2)
    `, [entry.rows[0].id, total]);
    if (linkCoreRefund) await client.query("UPDATE core_returns SET stripe_refund_id = $2 WHERE order_id = $1", [id, stripeRefundId]);
    return { orderId: id, stripeRefundId, amountCents: total, allocations };
  }

  async transitionOrder(client, { id, workflow, target, version, reason }, principal) {
    const column = workflow === "fulfillment" ? "fulfillment_status" : "core_status";
    const cancellationTimestamp = workflow === "fulfillment" && target === "canceled"
      ? ", canceled_at = COALESCE(canceled_at, now())"
      : "";
    const locked = await client.query(`
      SELECT o.id, o.version, o.${column}::text AS current_state,
             o.payment_status::text AS payment_status, o.fulfillment_status::text AS fulfillment_status,
             o.core_status::text AS core_status, qv.core_deposit_cents, qv.currency
      FROM orders o
      JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
      WHERE o.id = $1 FOR UPDATE OF o
    `, [id]);
    const order = locked.rows[0];
    if (!order) throw notFound("Order not found.");
    if (order.version !== version) throw conflict("This order changed after it was opened. Refresh it before trying again.", { currentVersion: order.version });

    try {
      assertOperationalTransition({
        workflow,
        from: order.current_state,
        to: target,
        paymentStatus: order.payment_status,
        coreStatus: order.core_status,
      });
    } catch (error) {
      throw conflict(error.message);
    }
    if (workflow === "fulfillment" && target === "ready_for_supplier") {
      const fitment = await client.query("SELECT decision FROM fitment_reviews WHERE order_id = $1 ORDER BY reviewed_at DESC LIMIT 1", [id]);
      if (fitment.rows[0]?.decision !== "approved") throw conflict("A recorded fitment approval is required before supplier ordering.");
    }
    if (workflow === "fulfillment" && target === "supplier_ordered") {
      const supplier = await client.query("SELECT 1 FROM supplier_orders WHERE order_id = $1 AND ordered_at IS NOT NULL AND supplier_order_reference IS NOT NULL", [id]);
      if (!supplier.rowCount) throw conflict("A supplier order reference is required before marking the order placed.");
    }
    if (workflow === "fulfillment" && target === "shipped") {
      const shipment = await client.query("SELECT 1 FROM supplier_orders WHERE order_id = $1 AND shipped_at IS NOT NULL AND carrier IS NOT NULL AND tracking_number IS NOT NULL", [id]);
      if (!shipment.rowCount) throw conflict("Carrier and tracking details are required before marking the order shipped.");
    }
    if (workflow === "core") {
      await client.query(`
        INSERT INTO core_returns (order_id, due_at)
        VALUES ($1, now() + interval '30 days')
        ON CONFLICT (order_id) DO NOTHING
      `, [id]);
      if (target === "refunded") {
        const verified = await client.query(`
          SELECT 1
          FROM core_returns cr
          JOIN payment_transactions pt ON pt.stripe_object_id = cr.stripe_refund_id
            AND pt.order_id = cr.order_id AND pt.transaction_type = 'refund' AND pt.status = 'succeeded'
          JOIN refund_allocations ra ON ra.payment_transaction_id = pt.id
            AND ra.category = 'core_deposit' AND ra.amount_cents = cr.refund_due_cents
          WHERE cr.order_id = $1
        `, [id]);
        if (!verified.rowCount) throw conflict("A successful Stripe refund classified to the full core deposit is required first.");
      }
      if (target === "forfeited") {
        const core = await client.query("SELECT due_at, accepted_at, stripe_refund_id FROM core_returns WHERE order_id = $1 FOR UPDATE", [id]);
        const record = core.rows[0];
        if (!["delivered", "closed"].includes(order.fulfillment_status)) {
          throw conflict("A core deposit cannot be forfeited before the replacement unit is delivered.");
        }
        if (!record || new Date(record.due_at) > new Date()) {
          throw conflict("The documented core-return deadline has not passed.");
        }
        if (record.accepted_at || record.stripe_refund_id) {
          throw conflict("An accepted or refunded core deposit cannot be forfeited.");
        }
      }
    }
    const updated = await client.query(`
      UPDATE orders SET ${column} = $2, version = version + 1${cancellationTimestamp} WHERE id = $1
      RETURNING id, version, ${column}::text AS state, updated_at
    `, [id, target]);
    await client.query(`
      INSERT INTO status_history (order_id, workflow, from_state, to_state, reason, actor_staff_user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, workflow, order.current_state, target, reason, principal.id]);
    if (workflow === "fulfillment" && target === "canceled" && order.core_status !== "not_required") {
      const cancellation = await client.query(
        "UPDATE orders SET core_status = 'not_required', version = version + 1 WHERE id = $1 RETURNING version, updated_at",
        [id],
      );
      await client.query(`
        INSERT INTO status_history (order_id, workflow, from_state, to_state, reason, actor_staff_user_id)
        VALUES ($1, 'core', $2, 'not_required', 'Core obligation removed because fulfillment was canceled', $3)
      `, [id, order.core_status, principal.id]);
      updated.rows[0].version = cancellation.rows[0].version;
      updated.rows[0].updated_at = cancellation.rows[0].updated_at;
    }
    if (workflow === "fulfillment" && target === "delivered" && order.core_status !== "not_required") {
      await client.query(`
        INSERT INTO core_returns (order_id, due_at)
        VALUES ($1, now() + interval '30 days')
        ON CONFLICT (order_id) DO UPDATE SET due_at = EXCLUDED.due_at
        WHERE core_returns.received_at IS NULL
      `, [id]);
    }
    if (workflow === "core") {
      if (target === "received") await client.query("UPDATE core_returns SET received_at = COALESCE(received_at, now()) WHERE order_id = $1", [id]);
      if (target === "accepted") await client.query("UPDATE core_returns SET accepted_at = COALESCE(accepted_at, now()), refund_due_cents = $2 WHERE order_id = $1", [id, order.core_deposit_cents]);
      if (target === "rejected") await client.query("UPDATE core_returns SET rejected_at = now(), rejection_reason = $2 WHERE order_id = $1", [id, reason]);
      if (target === "forfeited" && asInteger(order.core_deposit_cents) > 0) {
        const entry = await client.query(`
          INSERT INTO journal_entries (order_id, source_type, source_id, description, currency, occurred_at)
          VALUES ($1, 'core_forfeiture', $1, 'Core deposit forfeited', $2, now())
          ON CONFLICT (source_type, source_id) DO NOTHING
          RETURNING id
        `, [id, order.currency]);
        if (entry.rowCount) {
          await client.query("INSERT INTO journal_lines (journal_entry_id, account_code, debit_cents, credit_cents) VALUES ($1,'2010',$2,0)", [entry.rows[0].id, order.core_deposit_cents]);
          await client.query("INSERT INTO journal_lines (journal_entry_id, account_code, debit_cents, credit_cents) VALUES ($1,'4020',0,$2)", [entry.rows[0].id, order.core_deposit_cents]);
        }
      }
    }
    if (workflow === "fulfillment" && target === "canceled" && ["paid", "partially_refunded"].includes(order.payment_status)) {
      await client.query(`
        INSERT INTO notification_outbox (topic, deduplication_key, payload)
        VALUES ('finance.canceled_paid_order_requires_refund', $1, $2)
        ON CONFLICT (deduplication_key) DO NOTHING
      `, [`canceled-paid:${id}`, { orderId: id, paymentStatus: order.payment_status }]);
    }
    await client.query(`
      INSERT INTO notification_outbox (topic, deduplication_key, payload)
      VALUES ('order.status.changed', $1, $2)
    `, [`${workflow}:${id}:${updated.rows[0].version}`, {
      orderId: id,
      workflow,
      from: order.current_state,
      to: target,
      version: updated.rows[0].version,
    }]);
    return { id, workflow, previousState: order.current_state, state: target, version: updated.rows[0].version, updatedAt: updated.rows[0].updated_at };
  }

  async addOrderNote(client, { id, note }, principal) {
    const exists = await client.query("SELECT id FROM orders WHERE id = $1", [id]);
    if (!exists.rowCount) throw notFound("Order not found.");
    const { rows } = await client.query(`
      INSERT INTO order_notes (order_id, note, created_by)
      VALUES ($1, $2, $3)
      RETURNING id, note, created_at
    `, [id, note, principal.id]);
    return { id: rows[0].id, orderId: id, note: rows[0].note, createdAt: rows[0].created_at };
  }

  async updateFreightException(client, id, input) {
    if (input.assignedTo) {
      const assignee = await client.query(`
        SELECT 1
        FROM staff_users su
        JOIN user_roles ur ON ur.staff_user_id = su.id
        WHERE su.id = $1 AND su.disabled_at IS NULL AND ur.revoked_at IS NULL
          AND ur.role IN ('operations', 'administrator')
      `, [input.assignedTo]);
      if (!assignee.rowCount) throw conflict("Freight requests can be assigned only to active operations staff.");
    }
    const resolvedAt = ["converted", "closed"].includes(input.status) ? new Date().toISOString() : null;
    const { rows } = await client.query(`
      UPDATE freight_quote_requests
      SET status = $2, assigned_to = CASE WHEN $7 THEN $3 ELSE assigned_to END, next_follow_up_at = $4,
          resolution_note = $5, resolved_at = $6
      WHERE id = $1
      RETURNING id, public_reference, status, assigned_to, next_follow_up_at, resolution_note, resolved_at, updated_at
    `, [id, input.status, input.assignedTo ?? null, input.nextFollowUpAt, input.resolutionNote, resolvedAt, input.assignedTo !== undefined]);
    if (!rows[0]) throw notFound("Freight request not found.");
    const row = rows[0];
    return { id: row.id, reference: row.public_reference, status: row.status, assignedTo: row.assigned_to, nextFollowUpAt: row.next_follow_up_at, resolutionNote: row.resolution_note, resolvedAt: row.resolved_at, updatedAt: row.updated_at };
  }
}

export const _internals = { asInteger, orderDto, promotionDto, reconciliationDto, staffDto };
