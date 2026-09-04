import { conflict, forbidden, notFound } from "./errors.mjs";
import { normalizeRoles } from "./permissions.mjs";
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
  collectedCents: asInteger(row.collected_cents),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ...(includeFinancials ? {
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

  async dashboard() {
    const { rows } = await this.pool.query(`
      SELECT
        (SELECT count(*) FROM orders WHERE created_at >= now() - interval '30 days') AS orders_30d,
        (SELECT count(*) FROM orders WHERE payment_status IN ('paid', 'partially_refunded')) AS paid_orders,
        (SELECT count(*) FROM orders WHERE payment_status = 'disputed') AS disputed_orders,
        (SELECT count(*) FROM orders WHERE fulfillment_status NOT IN ('closed', 'canceled')) AS active_orders,
        (SELECT count(*) FROM orders WHERE core_status IN ('awaiting_return', 'pickup_scheduled', 'in_transit', 'received', 'accepted', 'refund_due')) AS open_cores,
        (SELECT count(*) FROM freight_quote_requests WHERE status IN ('open', 'contacted', 'quoted')) AS freight_exceptions,
        (SELECT count(*) FROM webhook_events WHERE processing_status IN ('retry', 'dead_letter')) AS webhook_exceptions,
        (SELECT count(*) FROM notification_outbox
          WHERE delivered_at IS NULL AND attempts >= 10
            AND (locked_until IS NULL OR locked_until < now())) AS notification_exceptions,
        (SELECT COALESCE(sum(amount_cents), 0) FROM payment_transactions WHERE transaction_type IN ('charge', 'payment') AND status IN ('paid', 'succeeded') AND occurred_at >= now() - interval '30 days') AS collected_30d,
        (SELECT COALESCE(sum(amount_cents), 0) FROM payment_transactions WHERE transaction_type = 'refund' AND status IN ('paid', 'succeeded') AND occurred_at >= now() - interval '30 days') AS refunds_30d
    `);
    const row = rows[0];
    return {
      orders30d: asInteger(row.orders_30d),
      paidOrders: asInteger(row.paid_orders),
      disputedOrders: asInteger(row.disputed_orders),
      activeOrders: asInteger(row.active_orders),
      openCores: asInteger(row.open_cores),
      freightExceptions: asInteger(row.freight_exceptions),
      webhookExceptions: asInteger(row.webhook_exceptions),
      notificationExceptions: asInteger(row.notification_exceptions),
      collected30dCents: asInteger(row.collected_30d),
      refunds30dCents: asInteger(row.refunds_30d),
    };
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
    const [history, notes, disputes, supplier, core, fitment, refunds] = await Promise.all([
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
    ]);
    return {
      ...orderDto(list.rows[0], includeFinancials),
      version: list.rows[0].version,
      timeline: history.rows.map((row) => ({ workflow: row.workflow, from: row.from_state, to: row.to_state, reason: row.reason, createdAt: row.created_at })),
      notes: notes.rows.map((row) => ({ id: row.id, note: row.note, authorName: row.author_name, createdAt: row.created_at })),
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

  async listAssignableStaff() {
    const { rows } = await this.pool.query(`
      SELECT DISTINCT su.id, su.display_name
      FROM staff_users su
      JOIN user_roles ur ON ur.staff_user_id = su.id
      WHERE su.disabled_at IS NULL AND ur.revoked_at IS NULL
        AND ur.role IN ('operations', 'administrator')
      ORDER BY su.display_name, su.id
    `);
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
