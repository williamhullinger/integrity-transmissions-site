import { badRequest, notFound } from "./errors.mjs";
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
  freightStatusInput,
  instant,
  pageOptions,
  positiveInteger,
  promotionInput,
  uuid,
} from "./validation.mjs";
import { reconcileStripe as reconcileStripePayments } from "./reconciliation.mjs";
import { createStripeClient } from "./stripe-client.mjs";

const mutation = async ({ event, repository, principal, id, scope, action }) => {
  assertOfficeOrigin(event);
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
    if (method === "GET" && path === "/promotions") {
      requireRole(principal, "finance");
      return response(200, { data: await repository.listPromotions(), meta: { requestId: id } }, id);
    }
    if (method === "POST" && path === "/promotions") {
      requireRole(principal, "administrator");
      return await mutation({ event, repository, principal, id, scope: "promotion:create", action: async (client, body) => {
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
      return await mutation({ event, repository, principal, id, scope: `promotion:${verb}:${promotionId}`, action: async (client, body) => {
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
      return await mutation({ event, repository, principal, id, scope: `freight:update:${freightId}`, action: async (client, body) => {
        const input = freightStatusInput(body);
        const updated = await repository.updateFreightException(client, freightId, input);
        return { statusCode: 200, body: updated, audit: { action: "freight_request.updated", entityType: "freight_request", entityId: freightId, reason: input.reason, afterValue: updated } };
      } });
    }
    const transitionMatch = /^\/orders\/([0-9a-f-]+)\/(fulfillment|core)-transition$/.exec(path);
    if (method === "POST" && transitionMatch) {
      requireRole(principal, "operations");
      const orderId = uuid(transitionMatch[1], "order id");
      const workflow = transitionMatch[2];
      return await mutation({ event, repository, principal, id, scope: `order:${workflow}:${orderId}`, action: async (client, body) => {
        const input = {
          id: orderId,
          workflow,
          target: boundedText(body.target, "target", 40),
          version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }),
          reason: boundedText(body.reason, "reason", 1_000),
        };
        if (workflow === "core" && input.target === "refunded") requireRole(principal, "finance");
        const updated = await repository.transitionOrder(client, input, principal);
        return { statusCode: 200, body: updated, audit: { action: `order.${workflow}_transition`, entityType: "order", entityId: orderId, reason: input.reason, afterValue: updated } };
      } });
    }
    const noteMatch = /^\/orders\/([0-9a-f-]+)\/notes$/.exec(path);
    if (method === "POST" && noteMatch) {
      requireRole(principal, "operations");
      const orderId = uuid(noteMatch[1], "order id");
      return await mutation({ event, repository, principal, id, scope: `order:note:${orderId}`, action: async (client, body) => {
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
    if (method === "GET" && path === "/reconciliation") {
      requireRole(principal, "finance");
      const days = positiveInteger(params.days || 7, "days", { minimum: 1, maximum: 30 });
      const endAt = new Date().toISOString();
      const startAt = new Date(Date.now() - days * 86_400_000).toISOString();
      const data = await reconcileStripe({ stripe: stripeFactory(env), repository, startAt, endAt });
      return response(200, { data, meta: { requestId: id, generatedAt: endAt } }, id);
    }
    if (method === "GET" && path === "/audit") {
      requireRole(principal, "administrator");
      return response(200, { data: await repository.recentAudit(pageOptions(params)), meta: { requestId: id } }, id);
    }
    throw notFound("Office API route not found.");
  } catch (error) {
    return errorResponse(error, id, logger);
  }
};

export const _internals = { mutation, publicConfig };
