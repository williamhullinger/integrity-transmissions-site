import { badRequest, conflict, notFound } from "./errors.mjs";
import {
  assertOfficeOrigin,
  errorResponse,
  idempotencyKey,
  parseJson,
  query,
  requestId,
  response,
  routePath,
  stableJsonHash,
} from "./http.mjs";
import { mayViewFinancials, requireRole } from "./permissions.mjs";
import {
  boundedText,
  fitmentReviewInput,
  freightStatusInput,
  instant,
  pageOptions,
  positiveInteger,
  promotionInput,
  refundClassificationInput,
  shipmentInput,
  staffAccessInput,
  staffInput,
  supplierOrderInput,
  uuid,
} from "./validation.mjs";
import { reconcileStripe as reconcileStripePayments } from "./reconciliation.mjs";
import { createStripeClient } from "./stripe-client.mjs";

const mutation = async ({ event, env, repository, principal, id, scope, action }) => {
  assertOfficeOrigin(event, env);
  const body = parseJson(event);
  const key = idempotencyKey(event);
  const result = await repository.executeIdempotent({
    scope,
    key,
    requestHash: stableJsonHash(body),
    principal,
    requestId: id,
    action: (client) => action(client, body),
  });
  return response(result.statusCode, { data: result.body, meta: { requestId: id, repeated: result.repeated } }, id);
};

const publicConfig = (env) => {
  const domain = String(env.OFFICE_AUTH0_DOMAIN || "").trim();
  const clientId = String(env.OFFICE_AUTH0_CLIENT_ID || "").trim();
  const audience = String(env.OFFICE_AUTH0_AUDIENCE || "").trim();
  return {
    configured: Boolean(domain && clientId && audience),
    auth: domain && clientId && audience ? { domain, clientId, audience } : null,
  };
};

export const createOfficeApi = ({
  authenticate,
  repository,
  env = process.env,
  logger = console,
  stripeFactory = createStripeClient,
  reconcileStripe = reconcileStripePayments,
} = {}) => async (event) => {
  const id = requestId(event);
  try {
    const method = String(event?.httpMethod || "GET").toUpperCase();
    const path = routePath(event);
    if (method === "OPTIONS") {
      assertOfficeOrigin(event, env);
      return response(204, {}, id, { Allow: "GET, POST, OPTIONS" });
    }
    if (method === "GET" && path === "/config") return response(200, { data: publicConfig(env), meta: { requestId: id } }, id);
    if (!authenticate || !repository) throw new Error("Office API dependencies are unavailable");

    const identity = await authenticate(event);
    const principal = await repository.getStaffPrincipal(identity);
    const params = query(event);

    if (method === "GET" && path === "/session") {
      return response(200, { data: principal, meta: { requestId: id } }, id);
    }
    if (method === "GET" && path === "/dashboard") {
      requireRole(principal, "viewer");
      return response(200, { data: await repository.dashboard(), meta: { requestId: id, generatedAt: new Date().toISOString() } }, id);
    }
    if (method === "GET" && path === "/staff") {
      requireRole(principal, "administrator");
      return response(200, { data: await repository.listStaff(), meta: { requestId: id } }, id);
    }
    if (method === "GET" && path === "/staff/assignees") {
      requireRole(principal, "operations");
      return response(200, { data: await repository.listAssignableStaff(), meta: { requestId: id } }, id);
    }
    if (method === "POST" && path === "/staff") {
      requireRole(principal, "administrator");
      return await mutation({ event, env, repository, principal, id, scope: "staff:create", action: async (client, body) => {
        const input = staffInput(body);
        const created = await repository.createStaff(client, input, principal);
        return { statusCode: 201, body: created, audit: { action: "staff.created", entityType: "staff_user", entityId: created.id, reason: input.reason, afterValue: created } };
      } });
    }
    const staffAccessMatch = /^\/staff\/([0-9a-f-]+)\/access$/.exec(path);
    if (method === "POST" && staffAccessMatch) {
      requireRole(principal, "administrator");
      const staffId = uuid(staffAccessMatch[1], "staff id");
      return await mutation({ event, env, repository, principal, id, scope: `staff:access:${staffId}`, action: async (client, body) => {
        const input = staffAccessInput(body);
        const updated = await repository.updateStaffAccess(client, staffId, input, principal);
        return { statusCode: 200, body: updated, audit: { action: "staff.access_changed", entityType: "staff_user", entityId: staffId, reason: input.reason, afterValue: updated } };
      } });
    }
    if (method === "GET" && path === "/orders") {
      requireRole(principal, "viewer");
      const paging = pageOptions(params);
      const data = await repository.listOrders({
        ...paging,
        search: boundedText(params.search, "search", 120, { required: false }) || "",
        status: boundedText(params.status, "status", 40, { required: false }) || "",
        includeFinancials: mayViewFinancials(principal),
      });
      return response(200, { data, meta: { requestId: id } }, id);
    }
    const orderMatch = /^\/orders\/([0-9a-f-]+)$/.exec(path);
    if (method === "GET" && orderMatch) {
      requireRole(principal, "viewer");
      const data = await repository.getOrder(uuid(orderMatch[1]), { includeFinancials: mayViewFinancials(principal) });
      return response(200, { data, meta: { requestId: id } }, id);
    }
    const fitmentMatch = /^\/orders\/([0-9a-f-]+)\/fitment-review$/.exec(path);
    if (method === "POST" && fitmentMatch) {
      requireRole(principal, "operations");
      const orderId = uuid(fitmentMatch[1], "order id");
      return await mutation({ event, env, repository, principal, id, scope: `order:fitment:${orderId}`, action: async (client, body) => {
        const input = { id: orderId, ...fitmentReviewInput(body) };
        const recorded = await repository.recordFitmentReview(client, input, principal);
        return { statusCode: 201, body: recorded, audit: { action: "order.fitment_reviewed", entityType: "order", entityId: orderId, reason: input.reason, afterValue: recorded } };
      } });
    }
    const supplierOrderMatch = /^\/orders\/([0-9a-f-]+)\/supplier-order$/.exec(path);
    if (method === "POST" && supplierOrderMatch) {
      requireRole(principal, "operations");
      const orderId = uuid(supplierOrderMatch[1], "order id");
      return await mutation({ event, env, repository, principal, id, scope: `order:supplier-order:${orderId}`, action: async (client, body) => {
        const input = { id: orderId, ...supplierOrderInput(body) };
        const recorded = await repository.recordSupplierOrder(client, input, principal);
        return { statusCode: 201, body: recorded, audit: { action: "order.supplier_ordered", entityType: "order", entityId: orderId, reason: input.reason, afterValue: recorded } };
      } });
    }
    const shipmentMatch = /^\/orders\/([0-9a-f-]+)\/shipment$/.exec(path);
    if (method === "POST" && shipmentMatch) {
      requireRole(principal, "operations");
      const orderId = uuid(shipmentMatch[1], "order id");
      return await mutation({ event, env, repository, principal, id, scope: `order:shipment:${orderId}`, action: async (client, body) => {
        const input = { id: orderId, ...shipmentInput(body) };
        const recorded = await repository.recordShipment(client, input, principal);
        return { statusCode: 201, body: recorded, audit: { action: "order.shipment_recorded", entityType: "order", entityId: orderId, reason: input.reason, afterValue: recorded } };
      } });
    }
    const refundClassificationMatch = /^\/orders\/([0-9a-f-]+)\/refunds\/(re_[A-Za-z0-9_]+)\/classification$/.exec(path);
    if (method === "POST" && refundClassificationMatch) {
      requireRole(principal, "finance");
      const orderId = uuid(refundClassificationMatch[1], "order id");
      const stripeRefundId = boundedText(refundClassificationMatch[2], "Stripe refund id", 255);
      return await mutation({ event, env, repository, principal, id, scope: `refund:classify:${stripeRefundId}`, action: async (client, body) => {
        const input = { id: orderId, stripeRefundId, ...refundClassificationInput(body) };
        const classified = await repository.classifyRefund(client, input, principal);
        return { statusCode: 200, body: classified, audit: { action: "refund.classified", entityType: "order", entityId: orderId, reason: input.reason, afterValue: classified } };
      } });
    }
    if (method === "GET" && path === "/promotions") {
      requireRole(principal, "finance");
      return response(200, { data: await repository.listPromotions(), meta: { requestId: id } }, id);
    }
    if (method === "POST" && path === "/promotions") {
      requireRole(principal, "administrator");
      return await mutation({ event, env, repository, principal, id, scope: "promotion:create", action: async (client, body) => {
        const input = promotionInput(body);
        const created = await repository.createPromotion(client, input, principal);
        return { statusCode: 201, body: created, audit: { action: "promotion.created", entityType: "promotion", entityId: created.id, reason: input.reason, afterValue: created } };
      } });
    }
    const promotionAction = /^\/promotions\/([0-9a-f-]+)\/(approve|disable)$/.exec(path);
    if (method === "POST" && promotionAction) {
      requireRole(principal, "administrator");
      const promotionId = uuid(promotionAction[1], "promotion id");
      const verb = promotionAction[2];
      return await mutation({ event, env, repository, principal, id, scope: `promotion:${verb}:${promotionId}`, action: async (client, body) => {
        const reason = boundedText(body.reason, "reason", 500);
        const updated = verb === "approve"
          ? await repository.approvePromotion(client, promotionId, principal)
          : await repository.disablePromotion(client, promotionId, principal, reason);
        return { statusCode: 200, body: updated, audit: { action: `promotion.${verb}d`, entityType: "promotion", entityId: promotionId, reason, afterValue: updated } };
      } });
    }
    if (method === "GET" && path === "/freight-exceptions") {
      requireRole(principal, "operations");
      const paging = pageOptions(params);
      const data = await repository.listFreightExceptions({
        ...paging,
        status: boundedText(params.status, "status", 32, { required: false }) || "",
      });
      return response(200, { data, meta: { requestId: id } }, id);
    }
    const freightMatch = /^\/freight-exceptions\/([0-9a-f-]+)$/.exec(path);
    if (method === "POST" && freightMatch) {
      requireRole(principal, "operations");
      const freightId = uuid(freightMatch[1], "freight request id");
      return await mutation({ event, env, repository, principal, id, scope: `freight:update:${freightId}`, action: async (client, body) => {
        const input = freightStatusInput(body);
        const updated = await repository.updateFreightException(client, freightId, input);
        return { statusCode: 200, body: updated, audit: { action: "freight_request.updated", entityType: "freight_request", entityId: freightId, reason: input.reason, afterValue: updated } };
      } });
    }
    const transitionMatch = /^\/orders\/([0-9a-f-]+)\/(fulfillment|core)-transition$/.exec(path);
    if (method === "POST" && transitionMatch) {
      const orderId = uuid(transitionMatch[1], "order id");
      const workflow = transitionMatch[2];
      requireRole(principal, workflow === "fulfillment" ? "operations" : "viewer");
      return await mutation({ event, env, repository, principal, id, scope: `order:${workflow}:${orderId}`, action: async (client, body) => {
        const input = {
          id: orderId,
          workflow,
          target: boundedText(body.target, "target", 40),
          version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }),
          reason: boundedText(body.reason, "reason", 1_000),
        };
        if (workflow === "core") {
          requireRole(principal, ["refunded", "forfeited"].includes(input.target) ? "finance" : "operations");
        }
        const updated = await repository.transitionOrder(client, input, principal);
        return { statusCode: 200, body: updated, audit: { action: `order.${workflow}_transition`, entityType: "order", entityId: orderId, reason: input.reason, afterValue: updated } };
      } });
    }
    const noteMatch = /^\/orders\/([0-9a-f-]+)\/notes$/.exec(path);
    if (method === "POST" && noteMatch) {
      requireRole(principal, "operations");
      const orderId = uuid(noteMatch[1], "order id");
      return await mutation({ event, env, repository, principal, id, scope: `order:note:${orderId}`, action: async (client, body) => {
        const note = boundedText(body.note, "note", 5_000);
        const created = await repository.addOrderNote(client, { id: orderId, note }, principal);
        return { statusCode: 201, body: created, audit: { action: "order.note_added", entityType: "order", entityId: orderId, reason: "Operational note added" } };
      } });
    }
    if (method === "GET" && path === "/reports/finance") {
      requireRole(principal, "finance");
      const endAt = params.endAt ? instant(params.endAt, "endAt") : new Date().toISOString();
      const startAt = params.startAt ? instant(params.startAt, "startAt") : new Date(Date.now() - 30 * 86_400_000).toISOString();
      if (new Date(endAt) <= new Date(startAt)) throw badRequest("endAt must be later than startAt.");
      return response(200, { data: await repository.financeReport({ startAt, endAt }), meta: { requestId: id } }, id);
    }
    if (method === "POST" && path === "/reconciliation") {
      requireRole(principal, "finance");
      assertOfficeOrigin(event, env);
      const body = parseJson(event);
      const key = idempotencyKey(event);
      const requestHash = stableJsonHash(body);
      const existing = await repository.getReconciliationByKey(key);
      if (existing) {
        if (existing.requestHash !== requestHash) throw conflict("That idempotency key was already used for a different request.");
        return response(200, { data: existing.data, meta: { requestId: id, repeated: true } }, id);
      }
      const days = positiveInteger(body.days || 7, "days", { minimum: 1, maximum: 30 });
      const endAt = new Date().toISOString();
      const startAt = new Date(Date.now() - days * 86_400_000).toISOString();
      const data = await reconcileStripe({ stripe: stripeFactory(env), repository, startAt, endAt });
      const stored = await repository.recordReconciliation(data, { key, requestHash, principal, requestId: id });
      return response(stored.repeated ? 200 : 201, { data: stored.data, meta: { requestId: id, repeated: stored.repeated, generatedAt: endAt } }, id);
    }
    if (method === "GET" && path === "/audit") {
      requireRole(principal, "administrator");
      return response(200, { data: await repository.recentAudit(pageOptions(params)), meta: { requestId: id } }, id);
    }
    if (method === "GET" && path === "/system-exceptions") {
      requireRole(principal, "administrator");
      return response(200, { data: await repository.listSystemExceptions(pageOptions(params)), meta: { requestId: id } }, id);
    }
    if (method === "POST" && path === "/system-exceptions/requeue") {
      requireRole(principal, "administrator");
      return await mutation({ event, env, repository, principal, id, scope: "system-exception:requeue", action: async (client, body) => {
        const kind = boundedText(body.kind, "kind", 32);
        if (!["stripe_event", "notification"].includes(kind)) throw badRequest("kind must be stripe_event or notification.");
        const exceptionId = kind === "notification"
          ? uuid(body.id, "notification id")
          : boundedText(body.id, "Stripe event id", 255);
        if (kind === "stripe_event" && !/^evt_[A-Za-z0-9_]+$/.test(exceptionId)) throw badRequest("Stripe event id is invalid.");
        const reason = boundedText(body.reason, "reason", 500);
        const recovery = await repository.requeueSystemException(client, { kind, id: exceptionId });
        return { statusCode: 200, body: recovery.data, audit: { action: "system_exception.requeued", entityType: kind, entityId: exceptionId, reason, beforeValue: recovery.beforeValue, afterValue: recovery.data } };
      } });
    }
    throw notFound("Office API route not found.");
  } catch (error) {
    return errorResponse(error, id, logger);
  }
};

export const _internals = { mutation, publicConfig };
