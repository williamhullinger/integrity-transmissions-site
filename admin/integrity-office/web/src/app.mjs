import { createAuth0Client } from "@auth0/auth0-spa-js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const titles = Object.freeze({
  dashboard: ["Operations", "Overview"],
  orders: ["Sales & fulfillment", "Orders"],
  freight: ["Customer recovery", "Freight queue"],
  promotions: ["Controlled discounts", "Promotions"],
  finance: ["Accounting", "Financials"],
  staff: ["Identity & access", "Staff access"],
  system: ["Operations control", "System health"],
  audit: ["Security & controls", "Audit log"],
});

const roleCapabilities = Object.freeze({
  viewer: new Set(["viewer"]),
  operations: new Set(["viewer", "operations"]),
  finance: new Set(["viewer", "finance"]),
  administrator: new Set(["viewer", "operations", "finance", "administrator"]),
});

const state = {
  auth: null,
  principal: null,
  route: "dashboard",
  ordersPage: 1,
  freightPage: 1,
  orderSearch: "",
  orderStatus: "",
  freightStatus: "",
};

const can = (role) => (state.principal?.roles || []).some((owned) => roleCapabilities[owned]?.has(role));
const formatMoney = (cents) => money.format(Number(cents || 0) / 100);
const formatDate = (value) => value ? dateTime.format(new Date(value)) : "—";
const inputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const formatAddress = (address) => address ? [address.line1, address.line2, [address.city, address.region, address.postalCode].filter(Boolean).join(", "), address.countryCode].filter(Boolean).join(" · ") : "—";
const label = (value) => String(value || "—").replaceAll("_", " ");
const badge = (value) => `<span class="badge ${escapeHtml(String(value || "").toLowerCase())}">${escapeHtml(label(value))}</span>`;

const setNotice = (message = "", tone = "attention") => {
  const node = $("#notice");
  node.hidden = !message;
  node.textContent = message;
  node.dataset.tone = tone;
};

const api = async (path, options = {}) => {
  const token = await state.auth.getTokenSilently();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const result = await fetch(`/api${path}`, { ...options, headers, credentials: "same-origin" });
  const payload = await result.json().catch(() => ({}));
  if (result.status === 401) {
    await state.auth.loginWithRedirect({ authorizationParams: { redirect_uri: location.origin } });
    throw new Error("Your session expired.");
  }
  if (!result.ok) {
    const error = new Error(payload.error?.message || "The request could not be completed.");
    error.requestId = payload.requestId;
    error.status = result.status;
    throw error;
  }
  return payload.data;
};

const mutationOptions = (body) => ({
  method: "POST",
  headers: { "Idempotency-Key": crypto.randomUUID() },
  body: JSON.stringify(body),
});

const showLoading = () => {
  const content = $("#content");
  content.setAttribute("aria-busy", "true");
  content.innerHTML = '<div class="loading">Loading current Office records…</div>';
};

const showRouteError = (error) => {
  $("#content").innerHTML = `<div class="panel empty-state"><strong>This section could not be loaded.</strong><p>${escapeHtml(error.message)}${error.requestId ? ` Reference: ${escapeHtml(error.requestId)}` : ""}</p></div>`;
  $("#content").setAttribute("aria-busy", "false");
};

const emptyState = (title, detail) => `<div class="empty-state"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>`;

const orderTable = (orders, { compact = false } = {}) => {
  if (!orders.length) return emptyState("No orders match this view.", "New paid orders will appear after Stripe confirmation and Office synchronization.");
  return `<div class="data-table-wrap"><table class="data-table">
    <thead><tr><th>Order</th><th>Customer</th><th>Unit</th><th>Payment</th><th>Fulfillment</th>${compact ? "" : "<th>Core</th>"}<th class="money">Collected</th></tr></thead>
    <tbody>${orders.map((order) => `<tr>
      <td><button class="row-button" type="button" data-order-id="${escapeHtml(order.id)}">#${escapeHtml(order.orderNumber)}</button><small>${escapeHtml(formatDate(order.createdAt))}</small></td>
      <td><strong>${escapeHtml(order.customer.name)}</strong><small>${escapeHtml(order.vehicle.vin)}</small></td>
      <td><strong>${escapeHtml(order.application)}</strong><small>${escapeHtml(order.packageName)}</small></td>
      <td>${badge(order.paymentStatus)}</td><td>${badge(order.fulfillmentStatus)}</td>${compact ? "" : `<td>${badge(order.coreStatus)}</td>`}<td class="money"><strong>${escapeHtml(formatMoney(order.collectedCents))}</strong></td>
    </tr>`).join("")}</tbody>
  </table></div>`;
};

const renderDashboard = async () => {
  const [dashboard, orders, freight, assignees] = await Promise.all([
    api("/dashboard"),
    api("/orders?pageSize=6"),
    can("operations") ? api("/freight-exceptions?pageSize=5&status=active") : Promise.resolve(null),
    can("operations") ? api("/staff/assignees") : Promise.resolve([]),
  ]);
  if (freight) state.freightItems = freight.items;
  state.freightAssignees = assignees;
  const systemExceptions = dashboard.webhookExceptions + dashboard.notificationExceptions;
  $("#content").innerHTML = `
    <section class="metric-grid" aria-label="Current operating summary">
      <article class="metric good"><span>Collected · 30 days</span><strong>${escapeHtml(formatMoney(dashboard.collected30dCents))}</strong><small>Confirmed payment transactions</small></article>
      <article class="metric"><span>Active orders</span><strong>${dashboard.activeOrders}</strong><small>Not closed or canceled</small></article>
      <article class="metric ${dashboard.freightExceptions ? "attention" : ""}"><span>Freight follow-up</span><strong>${dashboard.freightExceptions}</strong><small>Open customer recovery requests</small></article>
      <article class="metric ${systemExceptions ? "attention" : "good"}"><span>System exceptions</span><strong>${systemExceptions}</strong><small>Event retries and notification dead letters</small></article>
    </section>
    <div class="section-heading"><div><h2>Current workload</h2><p>Orders requiring payment, fitment, fulfillment or core activity.</p></div></div>
    <div class="split-grid">
      <section class="panel"><div class="panel-header"><h3>Recent orders</h3><a href="#orders">View all orders</a></div>${orderTable(orders.items, { compact: true })}</section>
      <section class="panel"><div class="panel-header"><h3>Control totals</h3></div><div class="panel-body">
        <div class="detail-grid">
          <div class="detail-item"><span>Orders · 30 days</span><strong>${dashboard.orders30d}</strong></div>
          <div class="detail-item"><span>Paid orders</span><strong>${dashboard.paidOrders}</strong></div>
          <div class="detail-item"><span>Disputed orders</span><strong>${dashboard.disputedOrders}</strong></div>
          <div class="detail-item"><span>Open cores</span><strong>${dashboard.openCores}</strong></div>
          <div class="detail-item"><span>Refunds · 30 days</span><strong>${escapeHtml(formatMoney(dashboard.refunds30dCents))}</strong></div>
        </div>
      </div></section>
    </div>
    ${freight ? `<div class="section-heading"><div><h2>Freight recovery</h2><p>Customers waiting for a verified delivery rate.</p></div><a class="button button-small" href="#freight">Open queue</a></div><section class="panel">${freightTable(freight.items)}</section>` : ""}
  `;
};

const ordersFilters = () => `<form class="filter-bar" id="orders-filter">
  <div class="filter-fields">
    <div class="field"><label for="order-search">Search</label><input id="order-search" name="search" type="search" maxlength="120" placeholder="Order, customer, email or VIN"></div>
    <div class="field"><label for="order-status">Status</label><select id="order-status" name="status"><option value="">All statuses</option><option value="paid">Paid</option><option value="fitment_review">Fitment review</option><option value="supplier_ordered">Supplier ordered</option><option value="shipped">Shipped</option><option value="awaiting_return">Awaiting core</option><option value="refund_due">Core refund due</option><option value="closed">Closed</option></select></div>
  </div><button class="button" type="submit">Apply filters</button>
</form>`;

const renderOrders = async (search = state.orderSearch, status = state.orderStatus) => {
  state.orderSearch = String(search || "");
  state.orderStatus = String(status || "");
  const qs = new URLSearchParams({ page: state.ordersPage, pageSize: 25, ...(search ? { search } : {}), ...(status ? { status } : {}) });
  const data = await api(`/orders?${qs}`);
  $("#content").innerHTML = `${ordersFilters()}<section class="panel">${orderTable(data.items)}</section>
    <div class="pagination"><span>Page ${data.page} · ${data.total} orders</span><button class="button button-small" data-orders-page="${data.page - 1}" ${data.page <= 1 ? "disabled" : ""}>Previous</button><button class="button button-small" data-orders-page="${data.page + 1}" ${(data.page * data.pageSize) >= data.total ? "disabled" : ""}>Next</button></div>`;
  $("#order-search").value = state.orderSearch;
  $("#order-status").value = state.orderStatus;
};

const freightTable = (items) => {
  if (!items.length) return emptyState("Freight queue is clear.", "New assisted-rate requests will appear here automatically after Office ingestion is enabled.");
  return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Reference</th><th>Customer</th><th>Destination</th><th>Issue</th><th>Status</th><th>Assignee</th><th>Follow-up</th></tr></thead><tbody>
    ${items.map((item) => `<tr><td><button class="row-button" data-freight-id="${escapeHtml(item.id)}" type="button">${escapeHtml(item.reference)}</button><small>${escapeHtml(formatDate(item.createdAt))}</small></td><td><strong>${escapeHtml(item.customer.name)}</strong><small>${escapeHtml(item.customer.phone)}</small></td><td><strong>${escapeHtml(item.destination)}</strong><small>${escapeHtml(item.locationType)}</small></td><td><strong>${escapeHtml(label(item.failureCode))}</strong><small>${escapeHtml(item.supplierRequestId || "No supplier reference")}</small></td><td>${badge(item.status)}</td><td>${escapeHtml(item.assigneeName || "Unassigned")}</td><td>${escapeHtml(formatDate(item.nextFollowUpAt))}</td></tr>`).join("")}
  </tbody></table></div>`;
};

const renderFreight = async (status = state.freightStatus) => {
  state.freightStatus = String(status || "");
  const qs = new URLSearchParams({ page: state.freightPage, pageSize: 25, ...(status ? { status } : {}) });
  const [data, assignees] = await Promise.all([api(`/freight-exceptions?${qs}`), api("/staff/assignees")]);
  $("#content").innerHTML = `<form class="filter-bar" id="freight-filter"><div class="field"><label for="freight-status">Queue status</label><select id="freight-status" name="status"><option value="">All active and completed</option><option value="active">All active</option><option value="open">Open</option><option value="contacted">Contacted</option><option value="quoted">Quoted</option><option value="converted">Converted</option><option value="closed">Closed</option></select></div><button class="button" type="submit">Apply filter</button></form><section class="panel">${freightTable(data.items)}</section><div class="pagination"><span>Page ${data.page} · ${data.total} requests</span><button class="button button-small" data-freight-page="${data.page - 1}" ${data.page <= 1 ? "disabled" : ""}>Previous</button><button class="button button-small" data-freight-page="${data.page + 1}" ${(data.page * data.pageSize) >= data.total ? "disabled" : ""}>Next</button></div>`;
  state.freightItems = data.items;
  state.freightAssignees = assignees;
  $("#freight-status").value = state.freightStatus;
};

const promotionTable = (items) => {
  if (!items.length) return emptyState("No promotions have been created.", "Administrators can create margin-protected codes when a campaign is ready.");
  return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Discount</th><th>Schedule</th><th>Uses</th><th>Margin floor</th><th>Status</th><th>Action</th></tr></thead><tbody>${items.map((item) => {
    const status = item.disabledAt ? "disabled" : item.approvedAt && item.active ? "active" : "pending";
    const discount = item.amountOffCents !== null ? formatMoney(item.amountOffCents) : `${item.percentOff}%`;
    const mayApprove = can("administrator") && status === "pending" && item.createdBy !== state.principal.id;
    return `<tr><td><strong>${escapeHtml(item.code)}</strong></td><td>${escapeHtml(discount)}</td><td><strong>${escapeHtml(formatDate(item.startsAt))}</strong><small>${item.endsAt ? `Ends ${escapeHtml(formatDate(item.endsAt))}` : "No end date"}</small></td><td>${item.redemptionCount}${item.maxRedemptions ? ` / ${item.maxRedemptions}` : ""}</td><td>${escapeHtml(formatMoney(item.minimumMarginCents))}</td><td>${badge(status)}</td><td>${mayApprove ? `<button class="button button-small" data-promotion-action="approve" data-promotion-id="${escapeHtml(item.id)}">Approve</button>` : status === "pending" && item.createdBy === state.principal.id ? "<small>Second admin required</small>" : ""}${can("administrator") && status !== "disabled" ? ` <button class="button button-small button-danger" data-promotion-action="disable" data-promotion-id="${escapeHtml(item.id)}">Disable</button>` : ""}</td></tr>`;
  }).join("")}</tbody></table></div>`;
};

const renderPromotions = async () => {
  const items = await api("/promotions");
  state.promotionItems = items;
  $("#content").innerHTML = `<div class="page-actions"><p>Every code is server-validated against dates, redemption limits and the minimum order margin.</p>${can("administrator") ? '<button class="button button-primary" id="new-promotion" type="button">Create promotion</button>' : ""}</div><section class="panel">${promotionTable(items)}</section>`;
};

const renderFinance = async () => {
  const report = await api("/reports/finance");
  const balances = report.accounts.map((account) => ({ ...account, balance: ["asset", "expense"].includes(account.type) ? account.debitCents - account.creditCents : account.creditCents - account.debitCents }));
  const scale = Math.max(...balances.map((account) => Math.abs(account.balance)), 1);
  const revenue = balances.filter((a) => a.type === "revenue").reduce((sum, a) => sum + a.balance, 0);
  const expenses = balances.filter((a) => a.type === "expense").reduce((sum, a) => sum + a.balance, 0);
  const liabilities = balances.filter((a) => a.type === "liability").reduce((sum, a) => sum + a.balance, 0);
  $("#content").innerHTML = `<div class="page-actions"><p>Income and expense accounts show period activity. Asset and liability accounts show cumulative balances through the period end. Supplier cost and projected margin are shown on each order; supplier invoices and bank settlement appear only after dedicated posting is activated.</p><button class="button" id="run-reconciliation" type="button">Reconcile Stripe</button></div><section class="metric-grid"><article class="metric good"><span>Revenue · period</span><strong>${escapeHtml(formatMoney(revenue))}</strong><small>Net posted sales and freight revenue</small></article><article class="metric"><span>Expenses · period</span><strong>${escapeHtml(formatMoney(expenses))}</strong><small>Posted discounts, other refunds and Stripe fees</small></article><article class="metric"><span>Operating contribution · period</span><strong>${escapeHtml(formatMoney(revenue - expenses))}</strong><small>Before supplier costs and bank settlement</small></article><article class="metric"><span>Outstanding liabilities</span><strong>${escapeHtml(formatMoney(liabilities))}</strong><small>Tax and refundable core deposits through period end</small></article></section><div class="section-heading"><div><h2>Account activity</h2><p>${escapeHtml(formatDate(report.startAt))} through ${escapeHtml(formatDate(report.endAt))}</p></div></div><section class="panel"><div class="panel-body account-list">${balances.map((account) => `<div class="account-row"><strong>${escapeHtml(account.code)} · ${escapeHtml(account.name)}</strong><div class="account-bar" aria-hidden="true"><span style="width:${Math.round(Math.abs(account.balance) / scale * 100)}%"></span></div><em>${escapeHtml(formatMoney(account.balance))}<small>${account.basis === "through_end" ? " through end" : " in period"}</small></em></div>`).join("")}</div></section><section id="reconciliation-result" aria-live="polite"></section>`;
};

const roleChoices = (selected = []) => ["viewer", "operations", "finance", "administrator"]
  .map((role) => `<label class="check-option"><input type="checkbox" name="roles" value="${role}" ${selected.includes(role) ? "checked" : ""}><span>${escapeHtml(label(role))}</span></label>`)
  .join("");

const renderStaff = async () => {
  const items = await api("/staff");
  state.staffItems = items;
  const table = items.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Staff member</th><th>Auth0 identity</th><th>Roles</th><th>Status</th><th>Action</th></tr></thead><tbody>${items.map((item) => `<tr><td><strong>${escapeHtml(item.displayName)}</strong><small>${escapeHtml(item.email)}</small></td><td><small>${escapeHtml(item.auth0Subject)}</small></td><td>${item.roles.map(badge).join(" ") || "—"}</td><td>${badge(item.active ? "active" : "disabled")}</td><td>${item.id === state.principal.id ? "<small>Current account</small>" : `<button class="button button-small" type="button" data-staff-id="${escapeHtml(item.id)}">Manage</button>`}</td></tr>`).join("")}</tbody></table></div>` : emptyState("No staff accounts found.", "Create the first managed account after the bootstrap administrator signs in.");
  $("#content").innerHTML = `<div class="page-actions"><p>Access is enforced from active database grants. Changes are permanent audit events and require another administrator for self-service restrictions.</p><button class="button button-primary" id="new-staff" type="button">Add staff member</button></div><section class="panel">${table}</section>`;
};

const renderAudit = async () => {
  const data = await api("/audit?pageSize=50");
  $("#content").innerHTML = `<section class="panel">${data.items.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Time</th><th>Action</th><th>Record</th><th>Actor</th><th>Reason</th><th>Request</th></tr></thead><tbody>${data.items.map((item) => `<tr><td>${escapeHtml(formatDate(item.createdAt))}</td><td><strong>${escapeHtml(label(item.action))}</strong></td><td>${escapeHtml(item.entityType)}<small>${escapeHtml(item.entityId)}</small></td><td>${escapeHtml(item.actor)}</td><td>${escapeHtml(item.reason || "—")}</td><td><small>${escapeHtml(item.requestId)}</small></td></tr>`).join("")}</tbody></table></div>` : emptyState("No audit events yet.", "Security-sensitive changes will be recorded here permanently.")}</section>`;
};

const renderSystem = async () => {
  const data = await api("/system-exceptions?pageSize=100");
  state.systemExceptions = data.items;
  const table = data.items.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Source</th><th>Event</th><th>Status</th><th>Attempts</th><th>Last error</th><th>Action</th></tr></thead><tbody>${data.items.map((item) => `<tr><td>${escapeHtml(label(item.kind))}<small>${escapeHtml(formatDate(item.occurredAt))}</small></td><td><strong>${escapeHtml(item.type)}</strong><small>${escapeHtml(item.id)}</small></td><td>${badge(item.status)}<small>Manual recoveries: ${item.manualRequeues}</small></td><td>${item.attempts}<small>Next: ${escapeHtml(formatDate(item.nextAttemptAt))}</small></td><td>${escapeHtml(item.lastError || "No error detail recorded")}</td><td><button class="button button-small" type="button" data-system-exception-kind="${escapeHtml(item.kind)}" data-system-exception-id="${escapeHtml(item.id)}">Requeue</button></td></tr>`).join("")}</tbody></table></div>` : emptyState("No system exceptions.", "Stripe events and staff notifications are processing normally.");
  $("#content").innerHTML = `<div class="page-actions"><p>Only redacted delivery metadata is shown. A manual recovery resets the retry counter and creates a permanent audit event.</p></div><section class="panel">${table}</section>`;
};

const renderers = { dashboard: renderDashboard, orders: renderOrders, freight: renderFreight, promotions: renderPromotions, finance: renderFinance, staff: renderStaff, system: renderSystem, audit: renderAudit };

const routeAllowed = (route) => {
  const node = $(`[data-route="${route}"]`);
  return node && !node.hidden;
};

const navigate = async () => {
  const requested = location.hash.replace(/^#/, "") || "dashboard";
  state.route = titles[requested] && routeAllowed(requested) ? requested : "dashboard";
  const [kicker, title] = titles[state.route];
  $("#page-kicker").textContent = kicker;
  $("#page-title").textContent = title;
  document.title = `${title} | Integrity Office`;
  $$("[data-route]").forEach((link) => link.setAttribute("aria-current", link.dataset.route === state.route ? "page" : "false"));
  $("#sidebar").classList.remove("open");
  $("#menu-button").setAttribute("aria-expanded", "false");
  setNotice();
  showLoading();
  try {
    await renderers[state.route]();
    $("#content").setAttribute("aria-busy", "false");
  } catch (error) {
    showRouteError(error);
  }
};

const openDialog = ({ kicker, title, html }) => {
  $("#dialog-kicker").textContent = kicker;
  $("#dialog-title").textContent = title;
  $("#dialog-content").innerHTML = html;
  $("#record-dialog").showModal();
};

const fulfillmentTargets = Object.freeze({ fitment_review: ["canceled"], ready_for_supplier: ["canceled"], supplier_ordered: ["building"], building: [], shipped: ["delivered"], delivered: ["closed"], canceled: ["closed"], closed: [] });
const coreTargets = Object.freeze({ awaiting_return: ["pickup_scheduled", "in_transit", "received", "forfeited"], pickup_scheduled: ["awaiting_return", "in_transit", "received", "forfeited"], in_transit: ["received", "forfeited"], received: ["accepted", "rejected"], accepted: ["refund_due"], rejected: ["awaiting_return", "forfeited"], refund_due: ["refunded"], not_required: [], refunded: [], forfeited: [] });

const transitionForm = (order, workflow, targets) => targets.length ? `<form class="workflow-form" data-order-workflow="${escapeHtml(workflow)}" data-order-id="${escapeHtml(order.id)}" data-order-version="${escapeHtml(order.version)}"><div class="form-grid"><div class="field"><label for="${escapeHtml(workflow)}-target">Next ${escapeHtml(workflow)} status</label><select id="${escapeHtml(workflow)}-target" name="target">${targets.map((target) => `<option value="${escapeHtml(target)}">${escapeHtml(label(target))}</option>`).join("")}</select></div><div class="field wide"><label for="${escapeHtml(workflow)}-reason">Reason</label><input id="${escapeHtml(workflow)}-reason" name="reason" maxlength="1000" required placeholder="Document why this status is changing"></div></div><div class="form-actions"><button class="button" type="submit">Update ${escapeHtml(workflow)}</button></div></form>` : `<p class="access-help">No further ${escapeHtml(workflow)} transitions are available.</p>`;

const fulfillmentControl = (order) => {
  const version = escapeHtml(order.version);
  const id = escapeHtml(order.id);
  let requiredRecord = "";
  if (order.fulfillmentStatus === "fitment_review") {
    requiredRecord = `<form id="fitment-review-form" data-order-id="${id}" data-order-version="${version}"><div class="form-grid"><div class="field"><label for="fitment-decision">Decision</label><select id="fitment-decision" name="decision"><option value="approved">Approve exact fitment</option><option value="rejected">Reject and cancel fulfillment</option></select></div><div class="field"><label for="supplier-part-uid">ACE part UID</label><input id="supplier-part-uid" name="supplierPartUid" maxlength="160" required></div><div class="field wide"><label for="fitment-reason">Verification record</label><input id="fitment-reason" name="reason" maxlength="1000" required placeholder="Document VIN, application and catalog evidence reviewed"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Record fitment decision</button></div></form>`;
  } else if (order.fulfillmentStatus === "ready_for_supplier") {
    requiredRecord = `<form id="supplier-order-form" data-order-id="${id}" data-order-version="${version}"><div class="form-grid"><div class="field"><label for="supplier-name">Supplier</label><input id="supplier-name" name="supplierName" maxlength="160" value="ACE Transmission" required></div><div class="field"><label for="supplier-order-reference">Supplier order reference</label><input id="supplier-order-reference" name="supplierOrderReference" maxlength="160" required></div><div class="field"><label for="estimated-ship-at">Estimated ship date</label><input id="estimated-ship-at" name="estimatedShipAt" type="datetime-local"></div><div class="field wide"><label for="supplier-order-reason">Ordering record</label><input id="supplier-order-reason" name="reason" maxlength="1000" required placeholder="Document supplier confirmation and ordering context"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Record supplier order</button></div></form>`;
  } else if (["supplier_ordered", "building"].includes(order.fulfillmentStatus) && !order.supplier?.shippedAt) {
    requiredRecord = `<form id="shipment-form" data-order-id="${id}" data-order-version="${version}"><div class="form-grid"><div class="field"><label for="shipment-carrier">Carrier</label><input id="shipment-carrier" name="carrier" maxlength="120" required></div><div class="field"><label for="tracking-number">Tracking or PRO number</label><input id="tracking-number" name="trackingNumber" maxlength="200" required></div><div class="field wide"><label for="shipment-reason">Shipment record</label><input id="shipment-reason" name="reason" maxlength="1000" required placeholder="Document supplier shipment confirmation"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Record shipment</button></div></form>`;
  }
  const otherTransitions = transitionForm(order, "fulfillment", fulfillmentTargets[order.fulfillmentStatus] || []);
  return `${requiredRecord}${requiredRecord && (fulfillmentTargets[order.fulfillmentStatus] || []).length ? '<div class="subsection-rule"><span>Other permitted action</span></div>' : ""}${otherTransitions}`;
};

const orderRecords = (order) => {
  const fitment = order.fitment ? `<div class="detail-item"><span>Fitment</span><strong>${escapeHtml(label(order.fitment.decision))}</strong><small>${escapeHtml(order.fitment.supplierPartUid)}</small></div>` : "";
  const supplier = order.supplier ? `<div class="detail-item"><span>Supplier order</span><strong>${escapeHtml(order.supplier.orderReference || "Not placed")}</strong><small>${escapeHtml(order.supplier.carrier || "")}${order.supplier.trackingNumber ? ` · ${escapeHtml(order.supplier.trackingNumber)}` : ""}</small></div>` : "";
  const core = order.core ? `<div class="detail-item"><span>Core deadline</span><strong>${escapeHtml(formatDate(order.core.dueAt))}</strong><small>${order.core.refundDueCents === null ? "No refund due recorded" : `${escapeHtml(formatMoney(order.core.refundDueCents))} refund due`}</small></div>` : "";
  return fitment || supplier || core ? `<div class="section-heading"><div><h2>Controlled records</h2><p>Structured evidence required by workflow gates.</p></div></div><div class="detail-grid">${fitment}${supplier}${core}</div>` : "";
};

const orderNotes = (order) => order.notes?.length ? `<div class="section-heading"><div><h2>Operational notes</h2><p>Permanent staff record.</p></div></div><ol class="timeline">${order.notes.map((note) => `<li><strong>${escapeHtml(note.authorName || "Staff member")} · ${escapeHtml(formatDate(note.createdAt))}</strong><span>${escapeHtml(note.note)}</span></li>`).join("")}</ol>` : "";

const orderDisputes = (order) => {
  if (!can("finance") || !order.disputes?.length) return "";
  return `<div class="section-heading"><div><h2>Payment disputes</h2><p>Stripe status and evidence deadlines; submit evidence in Stripe.</p></div></div>${order.disputes.map((dispute) => `<section class="record-summary"><strong>${escapeHtml(dispute.stripeDisputeId)} · ${escapeHtml(formatMoney(dispute.amountCents))} · ${badge(dispute.status)}</strong><span>Reason: ${escapeHtml(label(dispute.reason || "not provided"))} · Evidence due: ${escapeHtml(formatDate(dispute.evidenceDueAt))} · Updated: ${escapeHtml(formatDate(dispute.updatedAt))}</span></section>`).join("")}`;
};

const refundControls = (order) => {
  if (!can("finance") || !order.refunds?.length) return "";
  return `<div class="section-heading"><div><h2>Stripe refunds</h2><p>Allocate every successful refund before it enters the ledger.</p></div></div>${order.refunds.map((refund) => {
    if (refund.allocations.length) return `<section class="record-summary"><strong>${escapeHtml(refund.stripeRefundId)} · ${escapeHtml(formatMoney(refund.amountCents))}</strong><span>${refund.allocations.map((allocation) => `${escapeHtml(label(allocation.category))}: ${escapeHtml(formatMoney(allocation.amountCents))}`).join(" · ")}</span></section>`;
    const amount = (refund.amountCents / 100).toFixed(2);
    const fieldId = `refund-${refund.id}`;
    return `<form class="refund-classification-form" data-order-id="${escapeHtml(order.id)}" data-refund-id="${escapeHtml(refund.stripeRefundId)}"><p><strong>${escapeHtml(refund.stripeRefundId)}</strong> · ${escapeHtml(formatMoney(refund.amountCents))} unclassified</p><div class="form-grid refund-grid"><div class="field"><label for="${fieldId}-transmission">Transmission</label><input id="${fieldId}-transmission" name="transmission" type="number" min="0" step="0.01" value="${amount}"></div><div class="field"><label for="${fieldId}-freight">Freight</label><input id="${fieldId}-freight" name="freight" type="number" min="0" step="0.01" value="0.00"></div><div class="field"><label for="${fieldId}-sales-tax">Sales tax</label><input id="${fieldId}-sales-tax" name="sales_tax" type="number" min="0" step="0.01" value="0.00"></div><div class="field"><label for="${fieldId}-core">Core deposit</label><input id="${fieldId}-core" name="core_deposit" type="number" min="0" step="0.01" value="0.00"></div><div class="field"><label for="${fieldId}-other">Other</label><input id="${fieldId}-other" name="other" type="number" min="0" step="0.01" value="0.00"></div><div class="field wide"><label for="${fieldId}-reason">Classification reason</label><input id="${fieldId}-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button" type="submit">Post refund classification</button></div></form>`;
  }).join("")}`;
};

const openOrder = async (id) => {
  openDialog({ kicker: "Order", title: "Loading…", html: '<div class="loading">Loading order details…</div>' });
  try {
    const order = await api(`/orders/${encodeURIComponent(id)}`);
    $("#dialog-title").textContent = `Order #${order.orderNumber}`;
    const availableCoreTargets = (coreTargets[order.coreStatus] || [])
      .filter((target) => ["refunded", "forfeited"].includes(target) ? can("finance") : can("operations"));
    const financials = can("finance") && order.supplierUnitCostCents !== undefined ? `<div class="section-heading"><div><h2>Pricing and projected margin</h2><p>Immutable checkout snapshot; excludes payment fees and later supplier adjustments.</p></div></div><div class="detail-grid"><div class="detail-item"><span>List unit price</span><strong>${escapeHtml(formatMoney(order.listUnitPriceCents))}</strong></div><div class="detail-item"><span>Promotion discount</span><strong>${escapeHtml(formatMoney(order.promotionDiscountCents))}</strong></div><div class="detail-item"><span>Customer unit price</span><strong>${escapeHtml(formatMoney(order.unitPriceCents))}</strong></div><div class="detail-item"><span>Freight revenue</span><strong>${escapeHtml(formatMoney(order.freightCents))}</strong></div><div class="detail-item"><span>Supplier unit cost</span><strong>${escapeHtml(formatMoney(order.supplierUnitCostCents))}</strong></div><div class="detail-item"><span>Supplier freight cost</span><strong>${escapeHtml(formatMoney(order.supplierFreightCostCents))}</strong></div><div class="detail-item"><span>Projected gross profit</span><strong>${escapeHtml(formatMoney(order.grossProfitBeforeFeesCents))}</strong><small>Before payment fees</small></div></div>` : "";
    $("#dialog-content").innerHTML = `<div class="detail-grid"><div class="detail-item"><span>Customer</span><strong>${escapeHtml(order.customer.name)}</strong><small>${escapeHtml(order.customer.email)}</small></div><div class="detail-item"><span>Phone</span><strong>${escapeHtml(order.customer.phone)}</strong></div><div class="detail-item"><span>Ship to</span><strong>${escapeHtml(formatAddress(order.deliveryAddress))}</strong><small>${escapeHtml(order.deliveryAddress?.locationType || "Delivery location")}</small></div><div class="detail-item"><span>VIN</span><strong>${escapeHtml(order.vehicle.vin)}</strong></div><div class="detail-item"><span>Transmission</span><strong>${escapeHtml(order.application)}</strong></div><div class="detail-item"><span>Package</span><strong>${escapeHtml(order.packageName)}</strong></div><div class="detail-item"><span>Collected</span><strong>${escapeHtml(formatMoney(order.collectedCents))}</strong></div><div class="detail-item"><span>Payment</span><strong>${escapeHtml(label(order.paymentStatus))}</strong></div><div class="detail-item"><span>Fulfillment</span><strong>${escapeHtml(label(order.fulfillmentStatus))}</strong></div><div class="detail-item"><span>Core</span><strong>${escapeHtml(label(order.coreStatus))}</strong></div>${order.promotionCode ? `<div class="detail-item"><span>Promotion</span><strong>${escapeHtml(order.promotionCode)} · ${escapeHtml(formatMoney(order.promotionDiscountCents))} off</strong></div>` : ""}</div>${financials}${orderDisputes(order)}${orderRecords(order)}${orderNotes(order)}
      ${can("operations") ? `<div class="section-heading"><div><h2>Fulfillment</h2><p>Current status: ${escapeHtml(label(order.fulfillmentStatus))}</p></div></div>${fulfillmentControl(order)}` : ""}${availableCoreTargets.length ? `<div class="section-heading"><div><h2>Core return</h2><p>Current status: ${escapeHtml(label(order.coreStatus))}</p></div></div>${transitionForm(order, "core", availableCoreTargets)}` : ""}${can("operations") ? `<div class="section-heading"><div><h2>Add note</h2><p>Operational notes are permanent.</p></div></div><form id="note-form" data-order-id="${escapeHtml(order.id)}"><div class="field"><label for="order-note">Note</label><textarea id="order-note" name="note" maxlength="5000" required></textarea></div><div class="form-actions"><button class="button" type="submit">Save note</button></div></form>` : ""}${refundControls(order)}
      <div class="section-heading"><div><h2>Timeline</h2></div></div>${order.timeline.length ? `<ol class="timeline">${order.timeline.map((item) => `<li><strong>${escapeHtml(label(item.workflow))}: ${escapeHtml(label(item.from || "created"))} → ${escapeHtml(label(item.to))}</strong><span>${escapeHtml(item.reason || "No reason recorded")} · ${escapeHtml(formatDate(item.createdAt))}</span></li>`).join("")}</ol>` : emptyState("No workflow history yet.", "Status changes will appear here.")}`;
  } catch (error) {
    $("#dialog-content").innerHTML = emptyState("Order could not be loaded.", error.message);
  }
};

const openFreight = (item) => openDialog({
  kicker: "Freight recovery",
  title: item.reference,
  html: `<div class="detail-grid"><div class="detail-item"><span>Customer</span><strong>${escapeHtml(item.customer.name)}</strong></div><div class="detail-item"><span>Email</span><strong>${escapeHtml(item.customer.email)}</strong></div><div class="detail-item"><span>Phone</span><strong>${escapeHtml(item.customer.phone)}</strong></div><div class="detail-item"><span>Destination</span><strong>${escapeHtml(item.destination)}</strong></div><div class="detail-item"><span>VIN</span><strong>${escapeHtml(item.vin || "Not captured")}</strong></div><div class="detail-item"><span>Requested unit</span><strong>${escapeHtml(item.selectionId || "Not captured")}</strong><small>${escapeHtml(item.packageName || "No package recorded")}</small></div><div class="detail-item"><span>Issue</span><strong>${escapeHtml(label(item.failureCode))}</strong></div><div class="detail-item"><span>Assigned to</span><strong>${escapeHtml(item.assigneeName || "Unassigned")}</strong><small>${escapeHtml(item.supplierRequestId || "No supplier request")}</small></div></div><div class="section-heading"><div><h2>Update request</h2><p>Document contact attempts and the final resolution.</p></div></div><form id="freight-update-form" data-freight-id="${escapeHtml(item.id)}"><div class="form-grid"><div class="field"><label for="freight-update-status">Status</label><select id="freight-update-status" name="status">${["open", "contacted", "quoted", "converted", "closed"].map((status) => `<option value="${status}" ${item.status === status ? "selected" : ""}>${escapeHtml(label(status))}</option>`).join("")}</select></div><div class="field"><label for="freight-assignee">Assigned to</label><select id="freight-assignee" name="assignedTo"><option value="">Unassigned</option>${item.assignedTo && !(state.freightAssignees || []).some((staff) => staff.id === item.assignedTo) ? `<option value="${escapeHtml(item.assignedTo)}" selected>${escapeHtml(item.assigneeName || "Inactive assignee")} (inactive)</option>` : ""}${(state.freightAssignees || []).map((staff) => `<option value="${escapeHtml(staff.id)}" ${item.assignedTo === staff.id ? "selected" : ""}>${escapeHtml(staff.displayName)}</option>`).join("")}</select></div><div class="field"><label for="next-follow-up">Next follow-up</label><input id="next-follow-up" name="nextFollowUpAt" type="datetime-local" value="${escapeHtml(inputDateTime(item.nextFollowUpAt))}"></div><div class="field wide"><label for="resolution-note">Resolution note</label><textarea id="resolution-note" name="resolutionNote" maxlength="2000">${escapeHtml(item.resolutionNote || "")}</textarea></div><div class="field wide"><label for="freight-reason">Change reason</label><input id="freight-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Save update</button></div></form>`,
});

const openPromotionForm = () => openDialog({
  kicker: "Promotion control",
  title: "Create promotion",
  html: `<form id="promotion-form"><div class="form-grid"><div class="field"><label for="promotion-code">Code</label><input id="promotion-code" name="code" maxlength="32" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" required></div><div class="field"><label for="promotion-kind">Discount type</label><select id="promotion-kind" name="kind"><option value="amount">Fixed amount</option><option value="percent">Percentage</option></select></div><div class="field"><label for="promotion-value">Discount value</label><input id="promotion-value" name="value" type="number" min="0.01" step="0.01" required></div><div class="field"><label for="promotion-margin">Minimum margin after discount</label><input id="promotion-margin" name="minimumMargin" type="number" min="0" step="0.01" value="350.00" required></div><div class="field"><label for="promotion-start">Starts</label><input id="promotion-start" name="startsAt" type="datetime-local" required></div><div class="field"><label for="promotion-end">Ends (optional)</label><input id="promotion-end" name="endsAt" type="datetime-local"></div><div class="field"><label for="promotion-total-limit">Total use limit</label><input id="promotion-total-limit" name="maxRedemptions" type="number" min="1" step="1"></div><div class="field"><label for="promotion-customer-limit">Per-customer limit</label><input id="promotion-customer-limit" name="maxRedemptionsPerCustomer" type="number" min="1" max="100" step="1" value="1" required></div><div class="field wide"><label for="promotion-reason">Business reason</label><input id="promotion-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create for approval</button></div></form>`,
});

const openStaffForm = () => openDialog({
  kicker: "Identity & access",
  title: "Add staff member",
  html: `<form id="staff-create-form"><div class="form-grid"><div class="field"><label for="staff-display-name">Display name</label><input id="staff-display-name" name="displayName" maxlength="160" required></div><div class="field"><label for="staff-email">Work email</label><input id="staff-email" name="email" type="email" maxlength="320" required></div><div class="field wide"><label for="staff-auth0-subject">Exact Auth0 subject</label><input id="staff-auth0-subject" name="auth0Subject" maxlength="255" required placeholder="auth0|…"></div><fieldset class="field wide"><legend>Least-privilege roles</legend><div class="check-grid">${roleChoices(["viewer"])}</div></fieldset><div class="field wide"><label for="staff-create-reason">Access reason</label><input id="staff-create-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create staff access</button></div></form>`,
});

const openStaffAccess = (item) => openDialog({
  kicker: "Identity & access",
  title: item.displayName,
  html: `<div class="detail-grid"><div class="detail-item"><span>Email</span><strong>${escapeHtml(item.email)}</strong></div><div class="detail-item"><span>Auth0 identity</span><strong>${escapeHtml(item.auth0Subject)}</strong></div><div class="detail-item"><span>Status</span><strong>${escapeHtml(item.active ? "Active" : "Disabled")}</strong></div></div><div class="section-heading"><div><h2>Access grants</h2><p>Removing a role revokes its active grant but preserves its history.</p></div></div><form id="staff-access-form" data-staff-id="${escapeHtml(item.id)}"><fieldset class="field"><legend>Roles</legend><div class="check-grid">${roleChoices(item.roles)}</div></fieldset><label class="check-option access-toggle"><input type="checkbox" name="active" ${item.active ? "checked" : ""}><span>Account is active</span></label><div class="field"><label for="staff-access-reason">Change reason</label><input id="staff-access-reason" name="reason" maxlength="500" required></div><div class="form-actions"><button class="button button-primary" type="submit">Save access</button></div></form>`,
});

const openSystemRecovery = (item) => openDialog({
  kicker: "System recovery",
  title: `Requeue ${label(item.kind)}`,
  html: `<div class="detail-grid"><div class="detail-item"><span>Event</span><strong>${escapeHtml(item.type)}</strong><small>${escapeHtml(item.id)}</small></div><div class="detail-item"><span>Failed attempts</span><strong>${item.attempts}</strong><small>${item.manualRequeues} prior manual recoveries</small></div></div><form id="system-requeue-form" data-system-exception-kind="${escapeHtml(item.kind)}" data-system-exception-id="${escapeHtml(item.id)}"><div class="field"><label for="system-requeue-reason">Recovery reason</label><input id="system-requeue-reason" name="reason" maxlength="500" required placeholder="Document the verified fix or reason to retry"></div><div class="form-actions"><button class="button button-primary" type="submit">Confirm requeue</button></div></form>`,
});

const submitWithButton = async (form, callback) => {
  const button = $("button[type=submit]", form);
  button.disabled = true;
  const previous = button.textContent;
  button.textContent = "Saving…";
  try { await callback(new FormData(form)); } finally { button.disabled = false; button.textContent = previous; }
};

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  try {
    if (form.id === "orders-filter") {
      state.ordersPage = 1;
      const data = new FormData(form);
      await renderOrders(data.get("search"), data.get("status"));
    } else if (form.id === "freight-filter") {
      state.freightPage = 1;
      await renderFreight(new FormData(form).get("status"));
    } else if (form.id === "promotion-form") {
      await submitWithButton(form, async (data) => {
        const kind = data.get("kind");
        const value = Number(data.get("value"));
        const body = { code: data.get("code"), startsAt: new Date(data.get("startsAt")).toISOString(), endsAt: data.get("endsAt") ? new Date(data.get("endsAt")).toISOString() : null, maxRedemptions: data.get("maxRedemptions") || null, maxRedemptionsPerCustomer: Number(data.get("maxRedemptionsPerCustomer")), minimumMarginCents: Math.round(Number(data.get("minimumMargin")) * 100), reason: data.get("reason"), ...(kind === "amount" ? { amountOffCents: Math.round(value * 100) } : { percentOff: value }) };
        await api("/promotions", mutationOptions(body));
        $("#record-dialog").close();
        setNotice("Promotion created. A separate administrator approval is required before customers can use it.");
        await renderPromotions();
      });
    } else if (form.id === "freight-update-form") {
      await submitWithButton(form, async (data) => {
        const followUp = data.get("nextFollowUpAt");
        await api(`/freight-exceptions/${form.dataset.freightId}`, mutationOptions({ status: data.get("status"), assignedTo: data.get("assignedTo") || null, nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null, resolutionNote: data.get("resolutionNote") || null, reason: data.get("reason") }));
        $("#record-dialog").close();
        await renderFreight();
      });
    } else if (form.id === "staff-create-form") {
      await submitWithButton(form, async (data) => {
        await api("/staff", mutationOptions({ auth0Subject: data.get("auth0Subject"), email: data.get("email"), displayName: data.get("displayName"), roles: data.getAll("roles"), reason: data.get("reason") }));
        $("#record-dialog").close();
        setNotice("Staff account created with database-enforced access grants.");
        await renderStaff();
      });
    } else if (form.id === "staff-access-form") {
      await submitWithButton(form, async (data) => {
        await api(`/staff/${form.dataset.staffId}/access`, mutationOptions({ roles: data.getAll("roles"), active: data.has("active"), reason: data.get("reason") }));
        $("#record-dialog").close();
        setNotice("Staff access updated and written to the audit trail.");
        await renderStaff();
      });
    } else if (form.id === "system-requeue-form") {
      await submitWithButton(form, async (data) => {
        await api("/system-exceptions/requeue", mutationOptions({ kind: form.dataset.systemExceptionKind, id: form.dataset.systemExceptionId, reason: data.get("reason") }));
        $("#record-dialog").close();
        setNotice("System exception requeued and recorded in the audit log.");
        await renderSystem();
      });
    } else if (form.id === "fitment-review-form") {
      await submitWithButton(form, async (data) => {
        await api(`/orders/${form.dataset.orderId}/fitment-review`, mutationOptions({ version: Number(form.dataset.orderVersion), decision: data.get("decision"), supplierPartUid: data.get("supplierPartUid"), reason: data.get("reason") }));
        $("#record-dialog").close();
        await navigate();
        setNotice("Fitment decision recorded and the fulfillment gate advanced.");
      });
    } else if (form.id === "supplier-order-form") {
      await submitWithButton(form, async (data) => {
        const estimatedShipAt = data.get("estimatedShipAt");
        await api(`/orders/${form.dataset.orderId}/supplier-order`, mutationOptions({ version: Number(form.dataset.orderVersion), supplierName: data.get("supplierName"), supplierOrderReference: data.get("supplierOrderReference"), estimatedShipAt: estimatedShipAt ? new Date(estimatedShipAt).toISOString() : null, reason: data.get("reason") }));
        $("#record-dialog").close();
        await navigate();
        setNotice("Supplier order and reference recorded together.");
      });
    } else if (form.id === "shipment-form") {
      await submitWithButton(form, async (data) => {
        await api(`/orders/${form.dataset.orderId}/shipment`, mutationOptions({ version: Number(form.dataset.orderVersion), carrier: data.get("carrier"), trackingNumber: data.get("trackingNumber"), reason: data.get("reason") }));
        $("#record-dialog").close();
        await navigate();
        setNotice("Shipment evidence recorded and fulfillment advanced.");
      });
    } else if (form.classList.contains("refund-classification-form")) {
      await submitWithButton(form, async (data) => {
        const allocations = ["transmission", "freight", "sales_tax", "core_deposit", "other"]
          .map((category) => ({ category, amountCents: Math.round(Number(data.get(category) || 0) * 100) }))
          .filter((allocation) => allocation.amountCents > 0);
        await api(`/orders/${form.dataset.orderId}/refunds/${form.dataset.refundId}/classification`, mutationOptions({ allocations, reason: data.get("reason") }));
        $("#record-dialog").close();
        await navigate();
        setNotice("Stripe refund classified and posted as a balanced ledger entry.");
      });
    } else if (form.matches("[data-order-workflow]")) {
      await submitWithButton(form, async (data) => {
        await api(`/orders/${form.dataset.orderId}/${form.dataset.orderWorkflow}-transition`, mutationOptions({ target: data.get("target"), version: Number(form.dataset.orderVersion), reason: data.get("reason") }));
        $("#record-dialog").close();
        await navigate();
        setNotice("Order status updated and written to the permanent audit trail.");
      });
    } else if (form.id === "note-form") {
      await submitWithButton(form, async (data) => {
        await api(`/orders/${form.dataset.orderId}/notes`, mutationOptions({ note: data.get("note") }));
        $("#record-dialog").close();
        setNotice("Operational note saved.");
      });
    }
  } catch (error) {
    setNotice(`${error.message}${error.requestId ? ` Reference: ${error.requestId}` : ""}`);
  }
});

document.addEventListener("click", async (event) => {
  const orderButton = event.target.closest("[data-order-id]");
  const freightButton = event.target.closest("[data-freight-id]");
  const pageButton = event.target.closest("[data-orders-page], [data-freight-page]");
  const promotionAction = event.target.closest("[data-promotion-action]");
  const staffButton = event.target.closest("[data-staff-id]");
  const systemButton = event.target.closest("[data-system-exception-id]");
  if (event.target.closest("#run-reconciliation")) {
    const button = event.target.closest("#run-reconciliation");
    button.disabled = true;
    button.textContent = "Reconciling…";
    try {
      const data = await api("/reconciliation", mutationOptions({ days: 7 }));
      const exceptionCount = data.unmatchedStripe.length + data.unmatchedOffice.length + data.amountMismatches.length;
      const exceptions = data.balanced
        ? emptyState("No reconciliation exceptions.", "Stripe and Office paid-session totals agree for this period.")
        : `<div class="detail-grid"><div class="detail-item"><span>Stripe only</span><strong>${data.unmatchedStripe.length}</strong><small>${data.unmatchedStripe.map(escapeHtml).join(" · ") || "None"}</small></div><div class="detail-item"><span>Office only</span><strong>${data.unmatchedOffice.length}</strong><small>${data.unmatchedOffice.map(escapeHtml).join(" · ") || "None"}</small></div></div>${data.amountMismatches.map((item) => `<section class="record-summary"><strong>${escapeHtml(item.stripeSessionId)}</strong><span>Stripe ${escapeHtml(formatMoney(item.stripeCents))} · Office ${escapeHtml(formatMoney(item.officeCents))}</span></section>`).join("")}`;
      $("#reconciliation-result").innerHTML = `<div class="section-heading"><div><h2>Stripe reconciliation</h2><p>Last seven days · ${data.balanced ? "No differences found" : "Review required"}</p></div>${badge(data.balanced ? "balanced" : "attention")}</div><section class="panel"><div class="panel-body"><div class="detail-grid"><div class="detail-item"><span>Stripe</span><strong>${data.stripe.count} · ${escapeHtml(formatMoney(data.stripe.totalCents))}</strong></div><div class="detail-item"><span>Office</span><strong>${data.office.count} · ${escapeHtml(formatMoney(data.office.totalCents))}</strong></div><div class="detail-item"><span>Exceptions</span><strong>${exceptionCount}</strong></div></div>${exceptions}</div></section>`;
    } catch (error) { setNotice(error.message); }
    finally { button.disabled = false; button.textContent = "Reconcile Stripe"; }
  } else if (systemButton) {
    const item = state.systemExceptions?.find((candidate) => candidate.kind === systemButton.dataset.systemExceptionKind && candidate.id === systemButton.dataset.systemExceptionId);
    if (item) openSystemRecovery(item);
  } else if (orderButton) await openOrder(orderButton.dataset.orderId);
  else if (freightButton) {
    const item = state.freightItems?.find((candidate) => candidate.id === freightButton.dataset.freightId);
    if (item) openFreight(item);
  } else if (staffButton) {
    const item = state.staffItems?.find((candidate) => candidate.id === staffButton.dataset.staffId);
    if (item) openStaffAccess(item);
  } else if (pageButton && !pageButton.disabled) {
    if (pageButton.dataset.ordersPage) { state.ordersPage = Number(pageButton.dataset.ordersPage); await renderOrders(state.orderSearch, state.orderStatus); }
    if (pageButton.dataset.freightPage) { state.freightPage = Number(pageButton.dataset.freightPage); await renderFreight(state.freightStatus); }
  } else if (promotionAction) {
    const reason = promotionAction.dataset.promotionAction === "approve" ? "Reviewed and approved for customer use" : "Disabled by administrator";
    try {
      await api(`/promotions/${promotionAction.dataset.promotionId}/${promotionAction.dataset.promotionAction}`, mutationOptions({ reason }));
      await renderPromotions();
      setNotice(`Promotion ${promotionAction.dataset.promotionAction === "approve" ? "approved" : "disabled"}.`);
    } catch (error) { setNotice(error.message); }
  }
});

const initialize = async () => {
  const gate = $("#access-gate");
  const gateMessage = $("#access-message");
  const loginButton = $("#login-button");
  try {
    const configResponse = await fetch("/api/config", { headers: { Accept: "application/json" }, cache: "no-store" });
    const configPayload = await configResponse.json();
    if (!configPayload.data?.configured) {
      gateMessage.textContent = "The private Office environment has not been connected to Auth0 yet. No staff or customer data is exposed.";
      return;
    }
    state.auth = await createAuth0Client({
      domain: configPayload.data.auth.domain,
      clientId: configPayload.data.auth.clientId,
      authorizationParams: { audience: configPayload.data.auth.audience, redirect_uri: location.origin },
      cacheLocation: "memory",
      useRefreshTokens: false,
    });
    const params = new URLSearchParams(location.search);
    if (params.has("code") && params.has("state")) {
      await state.auth.handleRedirectCallback();
      history.replaceState({}, "", `${location.pathname}${location.hash || "#dashboard"}`);
    }
    if (!await state.auth.isAuthenticated()) {
      gateMessage.textContent = "Sign in with your authorized staff account to continue.";
      loginButton.hidden = false;
      loginButton.addEventListener("click", () => state.auth.loginWithRedirect({ authorizationParams: { redirect_uri: location.origin } }), { once: true });
      return;
    }
    state.principal = await api("/session");
    $$("[data-role]").forEach((node) => { node.hidden = !can(node.dataset.role); });
    $("#user-name").textContent = state.principal.name;
    $("#user-role").textContent = state.principal.roles.map(label).join(" · ");
    $("#user-avatar").textContent = (state.principal.name || state.principal.email || "I").trim().charAt(0).toUpperCase();
    gate.hidden = true;
    $("#office-shell").hidden = false;
    await navigate();
  } catch (error) {
    gateMessage.textContent = error.message || "Integrity Office could not start securely.";
    loginButton.hidden = !state.auth;
  }
};

window.addEventListener("hashchange", navigate);
$("#menu-button").addEventListener("click", () => {
  const open = $("#sidebar").classList.toggle("open");
  $("#menu-button").setAttribute("aria-expanded", String(open));
  $(".sr-only", $("#menu-button")).textContent = `${open ? "Close" : "Open"} navigation`;
});
$("#logout-button").addEventListener("click", () => state.auth?.logout({ logoutParams: { returnTo: location.origin } }));
$("#dialog-close").addEventListener("click", () => $("#record-dialog").close());
$("#record-dialog").addEventListener("click", (event) => { if (event.target === $("#record-dialog")) $("#record-dialog").close(); });
document.addEventListener("click", (event) => { if (event.target.closest("#new-promotion")) openPromotionForm(); });
document.addEventListener("click", (event) => { if (event.target.closest("#new-staff")) openStaffForm(); });

initialize();
