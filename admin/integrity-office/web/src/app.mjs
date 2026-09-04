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
  const [dashboard, orders, freight] = await Promise.all([
    api("/dashboard"),
    api("/orders?pageSize=6"),
    can("operations") ? api("/freight-exceptions?pageSize=5&status=open") : Promise.resolve(null),
  ]);
  $("#content").innerHTML = `
    <section class="metric-grid" aria-label="Current operating summary">
      <article class="metric good"><span>Collected · 30 days</span><strong>${escapeHtml(formatMoney(dashboard.collected30dCents))}</strong><small>Confirmed payment transactions</small></article>
      <article class="metric"><span>Active orders</span><strong>${dashboard.activeOrders}</strong><small>Not closed or canceled</small></article>
      <article class="metric ${dashboard.freightExceptions ? "attention" : ""}"><span>Freight follow-up</span><strong>${dashboard.freightExceptions}</strong><small>Open customer recovery requests</small></article>
      <article class="metric ${dashboard.webhookExceptions ? "attention" : "good"}"><span>Event exceptions</span><strong>${dashboard.webhookExceptions}</strong><small>Retries and dead letters</small></article>
    </section>
    <div class="section-heading"><div><h2>Current workload</h2><p>Orders requiring payment, fitment, fulfillment or core activity.</p></div></div>
    <div class="split-grid">
      <section class="panel"><div class="panel-header"><h3>Recent orders</h3><a href="#orders">View all orders</a></div>${orderTable(orders.items, { compact: true })}</section>
      <section class="panel"><div class="panel-header"><h3>Control totals</h3></div><div class="panel-body">
        <div class="detail-grid">
          <div class="detail-item"><span>Orders · 30 days</span><strong>${dashboard.orders30d}</strong></div>
          <div class="detail-item"><span>Paid orders</span><strong>${dashboard.paidOrders}</strong></div>
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
  return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Reference</th><th>Customer</th><th>Destination</th><th>Issue</th><th>Status</th><th>Follow-up</th></tr></thead><tbody>
    ${items.map((item) => `<tr><td><button class="row-button" data-freight-id="${escapeHtml(item.id)}" type="button">${escapeHtml(item.reference)}</button><small>${escapeHtml(formatDate(item.createdAt))}</small></td><td><strong>${escapeHtml(item.customer.name)}</strong><small>${escapeHtml(item.customer.phone)}</small></td><td><strong>${escapeHtml(item.destination)}</strong><small>${escapeHtml(item.locationType)}</small></td><td><strong>${escapeHtml(label(item.failureCode))}</strong><small>${escapeHtml(item.supplierRequestId || "No supplier reference")}</small></td><td>${badge(item.status)}</td><td>${escapeHtml(formatDate(item.nextFollowUpAt))}</td></tr>`).join("")}
  </tbody></table></div>`;
};

const renderFreight = async (status = state.freightStatus) => {
  state.freightStatus = String(status || "");
  const qs = new URLSearchParams({ page: state.freightPage, pageSize: 25, ...(status ? { status } : {}) });
  const data = await api(`/freight-exceptions?${qs}`);
  $("#content").innerHTML = `<form class="filter-bar" id="freight-filter"><div class="field"><label for="freight-status">Queue status</label><select id="freight-status" name="status"><option value="">All active and completed</option><option value="open">Open</option><option value="contacted">Contacted</option><option value="quoted">Quoted</option><option value="converted">Converted</option><option value="closed">Closed</option></select></div><button class="button" type="submit">Apply filter</button></form><section class="panel">${freightTable(data.items)}</section><div class="pagination"><span>Page ${data.page} · ${data.total} requests</span><button class="button button-small" data-freight-page="${data.page - 1}" ${data.page <= 1 ? "disabled" : ""}>Previous</button><button class="button button-small" data-freight-page="${data.page + 1}" ${(data.page * data.pageSize) >= data.total ? "disabled" : ""}>Next</button></div>`;
  state.freightItems = data.items;
  $("#freight-status").value = state.freightStatus;
};

const promotionTable = (items) => {
  if (!items.length) return emptyState("No promotions have been created.", "Administrators can create margin-protected codes when a campaign is ready.");
  return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Discount</th><th>Schedule</th><th>Uses</th><th>Margin floor</th><th>Status</th><th>Action</th></tr></thead><tbody>${items.map((item) => {
    const status = item.disabledAt ? "disabled" : item.approvedAt && item.active ? "active" : "pending";
    const discount = item.amountOffCents !== null ? formatMoney(item.amountOffCents) : `${item.percentOff}%`;
    return `<tr><td><strong>${escapeHtml(item.code)}</strong></td><td>${escapeHtml(discount)}</td><td><strong>${escapeHtml(formatDate(item.startsAt))}</strong><small>${item.endsAt ? `Ends ${escapeHtml(formatDate(item.endsAt))}` : "No end date"}</small></td><td>${item.redemptionCount}${item.maxRedemptions ? ` / ${item.maxRedemptions}` : ""}</td><td>${escapeHtml(formatMoney(item.minimumMarginCents))}</td><td>${badge(status)}</td><td>${can("administrator") && status === "pending" ? `<button class="button button-small" data-promotion-action="approve" data-promotion-id="${escapeHtml(item.id)}">Approve</button>` : ""}${can("administrator") && status !== "disabled" ? ` <button class="button button-small button-danger" data-promotion-action="disable" data-promotion-id="${escapeHtml(item.id)}">Disable</button>` : ""}</td></tr>`;
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
  $("#content").innerHTML = `<div class="page-actions"><p>Ledger balances remain separate from Stripe settlement reconciliation. Supplier cost and projected margin are shown on each order; only posted entries appear here.</p><button class="button" id="run-reconciliation" type="button">Reconcile Stripe</button></div><section class="metric-grid"><article class="metric good"><span>Revenue · period</span><strong>${escapeHtml(formatMoney(revenue))}</strong><small>Posted journal entries</small></article><article class="metric"><span>Expenses · period</span><strong>${escapeHtml(formatMoney(expenses))}</strong><small>Posted discounts and refunds</small></article><article class="metric"><span>Net before liabilities</span><strong>${escapeHtml(formatMoney(revenue - expenses))}</strong><small>Revenue less recorded expenses</small></article><article class="metric"><span>Liabilities</span><strong>${escapeHtml(formatMoney(liabilities))}</strong><small>Tax and refundable core deposits</small></article></section><div class="section-heading"><div><h2>Account activity</h2><p>${escapeHtml(formatDate(report.startAt))} through ${escapeHtml(formatDate(report.endAt))}</p></div></div><section class="panel"><div class="panel-body account-list">${balances.map((account) => `<div class="account-row"><strong>${escapeHtml(account.code)} · ${escapeHtml(account.name)}</strong><div class="account-bar" aria-hidden="true"><span style="width:${Math.round(Math.abs(account.balance) / scale * 100)}%"></span></div><em>${escapeHtml(formatMoney(account.balance))}</em></div>`).join("")}</div></section><section id="reconciliation-result" aria-live="polite"></section>`;
};

const renderAudit = async () => {
  const data = await api("/audit?pageSize=50");
  $("#content").innerHTML = `<section class="panel">${data.items.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Time</th><th>Action</th><th>Record</th><th>Actor</th><th>Reason</th><th>Request</th></tr></thead><tbody>${data.items.map((item) => `<tr><td>${escapeHtml(formatDate(item.createdAt))}</td><td><strong>${escapeHtml(label(item.action))}</strong></td><td>${escapeHtml(item.entityType)}<small>${escapeHtml(item.entityId)}</small></td><td>${escapeHtml(item.actor)}</td><td>${escapeHtml(item.reason || "—")}</td><td><small>${escapeHtml(item.requestId)}</small></td></tr>`).join("")}</tbody></table></div>` : emptyState("No audit events yet.", "Security-sensitive changes will be recorded here permanently.")}</section>`;
};

const renderers = { dashboard: renderDashboard, orders: renderOrders, freight: renderFreight, promotions: renderPromotions, finance: renderFinance, audit: renderAudit };

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

const fulfillmentTargets = Object.freeze({ fitment_review: ["ready_for_supplier", "canceled"], ready_for_supplier: ["supplier_ordered", "canceled"], supplier_ordered: ["building", "shipped"], building: ["shipped"], shipped: ["delivered"], delivered: ["closed"], canceled: ["closed"], closed: [] });
const coreTargets = Object.freeze({ awaiting_return: ["pickup_scheduled", "in_transit", "received", "forfeited"], pickup_scheduled: ["awaiting_return", "in_transit", "received", "forfeited"], in_transit: ["received", "forfeited"], received: ["accepted", "rejected"], accepted: ["refund_due"], rejected: ["awaiting_return", "forfeited"], refund_due: ["refunded"], not_required: [], refunded: [], forfeited: [] });

const transitionForm = (order, workflow, targets) => targets.length ? `<form class="workflow-form" data-order-workflow="${escapeHtml(workflow)}" data-order-id="${escapeHtml(order.id)}" data-order-version="${escapeHtml(order.version)}"><div class="form-grid"><div class="field"><label for="${escapeHtml(workflow)}-target">Next ${escapeHtml(workflow)} status</label><select id="${escapeHtml(workflow)}-target" name="target">${targets.map((target) => `<option value="${escapeHtml(target)}">${escapeHtml(label(target))}</option>`).join("")}</select></div><div class="field wide"><label for="${escapeHtml(workflow)}-reason">Reason</label><input id="${escapeHtml(workflow)}-reason" name="reason" maxlength="1000" required placeholder="Document why this status is changing"></div></div><div class="form-actions"><button class="button" type="submit">Update ${escapeHtml(workflow)}</button></div></form>` : `<p class="access-help">No further ${escapeHtml(workflow)} transitions are available.</p>`;

const openOrder = async (id) => {
  openDialog({ kicker: "Order", title: "Loading…", html: '<div class="loading">Loading order details…</div>' });
  try {
    const order = await api(`/orders/${encodeURIComponent(id)}`);
    $("#dialog-title").textContent = `Order #${order.orderNumber}`;
    const availableCoreTargets = order.coreStatus === "refund_due" && !can("finance") ? [] : (coreTargets[order.coreStatus] || []);
    $("#dialog-content").innerHTML = `<div class="detail-grid"><div class="detail-item"><span>Customer</span><strong>${escapeHtml(order.customer.name)}</strong></div><div class="detail-item"><span>Phone</span><strong>${escapeHtml(order.customer.phone)}</strong></div><div class="detail-item"><span>VIN</span><strong>${escapeHtml(order.vehicle.vin)}</strong></div><div class="detail-item"><span>Transmission</span><strong>${escapeHtml(order.application)}</strong></div><div class="detail-item"><span>Package</span><strong>${escapeHtml(order.packageName)}</strong></div><div class="detail-item"><span>Collected</span><strong>${escapeHtml(formatMoney(order.collectedCents))}</strong></div>${order.promotionCode ? `<div class="detail-item"><span>Promotion</span><strong>${escapeHtml(order.promotionCode)} · ${escapeHtml(formatMoney(order.promotionDiscountCents))} off</strong></div>` : ""}</div>
      ${can("operations") ? `<div class="section-heading"><div><h2>Fulfillment</h2><p>Current status: ${escapeHtml(label(order.fulfillmentStatus))}</p></div></div>${transitionForm(order, "fulfillment", fulfillmentTargets[order.fulfillmentStatus] || [])}<div class="section-heading"><div><h2>Core return</h2><p>Current status: ${escapeHtml(label(order.coreStatus))}</p></div></div>${transitionForm(order, "core", availableCoreTargets)}<div class="section-heading"><div><h2>Add note</h2><p>Operational notes are permanent.</p></div></div><form id="note-form" data-order-id="${escapeHtml(order.id)}"><div class="field"><label for="order-note">Note</label><textarea id="order-note" name="note" maxlength="5000" required></textarea></div><div class="form-actions"><button class="button" type="submit">Save note</button></div></form>` : ""}
      <div class="section-heading"><div><h2>Timeline</h2></div></div>${order.timeline.length ? `<ol class="timeline">${order.timeline.map((item) => `<li><strong>${escapeHtml(label(item.workflow))}: ${escapeHtml(label(item.from || "created"))} → ${escapeHtml(label(item.to))}</strong><span>${escapeHtml(item.reason || "No reason recorded")} · ${escapeHtml(formatDate(item.createdAt))}</span></li>`).join("")}</ol>` : emptyState("No workflow history yet.", "Status changes will appear here.")}`;
  } catch (error) {
    $("#dialog-content").innerHTML = emptyState("Order could not be loaded.", error.message);
  }
};

const openFreight = (item) => openDialog({
  kicker: "Freight recovery",
  title: item.reference,
  html: `<div class="detail-grid"><div class="detail-item"><span>Customer</span><strong>${escapeHtml(item.customer.name)}</strong></div><div class="detail-item"><span>Phone</span><strong>${escapeHtml(item.customer.phone)}</strong></div><div class="detail-item"><span>Destination</span><strong>${escapeHtml(item.destination)}</strong></div><div class="detail-item"><span>VIN</span><strong>${escapeHtml(item.vin || "Not captured")}</strong></div><div class="detail-item"><span>Issue</span><strong>${escapeHtml(label(item.failureCode))}</strong></div><div class="detail-item"><span>Supplier request</span><strong>${escapeHtml(item.supplierRequestId || "—")}</strong></div></div><div class="section-heading"><div><h2>Update request</h2><p>Document contact attempts and the final resolution.</p></div></div><form id="freight-update-form" data-freight-id="${item.id}"><div class="form-grid"><div class="field"><label for="freight-update-status">Status</label><select id="freight-update-status" name="status"><option value="open">Open</option><option value="contacted">Contacted</option><option value="quoted">Quoted</option><option value="converted">Converted</option><option value="closed">Closed</option></select></div><div class="field"><label for="next-follow-up">Next follow-up</label><input id="next-follow-up" name="nextFollowUpAt" type="datetime-local"></div><div class="field wide"><label for="resolution-note">Resolution note</label><textarea id="resolution-note" name="resolutionNote" maxlength="2000"></textarea></div><div class="field wide"><label for="freight-reason">Change reason</label><input id="freight-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Save update</button></div></form>`,
});

const openPromotionForm = () => openDialog({
  kicker: "Promotion control",
  title: "Create promotion",
  html: `<form id="promotion-form"><div class="form-grid"><div class="field"><label for="promotion-code">Code</label><input id="promotion-code" name="code" maxlength="32" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" required></div><div class="field"><label for="promotion-kind">Discount type</label><select id="promotion-kind" name="kind"><option value="amount">Fixed amount</option><option value="percent">Percentage</option></select></div><div class="field"><label for="promotion-value">Discount value</label><input id="promotion-value" name="value" type="number" min="0.01" step="0.01" required></div><div class="field"><label for="promotion-margin">Minimum margin after discount</label><input id="promotion-margin" name="minimumMargin" type="number" min="0" step="0.01" value="350.00" required></div><div class="field"><label for="promotion-start">Starts</label><input id="promotion-start" name="startsAt" type="datetime-local" required></div><div class="field"><label for="promotion-end">Ends (optional)</label><input id="promotion-end" name="endsAt" type="datetime-local"></div><div class="field"><label for="promotion-total-limit">Total use limit</label><input id="promotion-total-limit" name="maxRedemptions" type="number" min="1" step="1"></div><div class="field"><label for="promotion-customer-limit">Per-customer limit</label><input id="promotion-customer-limit" name="maxRedemptionsPerCustomer" type="number" min="1" max="100" step="1" value="1" required></div><div class="field wide"><label for="promotion-reason">Business reason</label><input id="promotion-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create for approval</button></div></form>`,
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
        await api(`/freight-exceptions/${form.dataset.freightId}`, mutationOptions({ status: data.get("status"), nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null, resolutionNote: data.get("resolutionNote") || null, reason: data.get("reason") }));
        $("#record-dialog").close();
        await renderFreight();
      });
    } else if (form.matches("[data-order-workflow]")) {
      await submitWithButton(form, async (data) => {
        await api(`/orders/${form.dataset.orderId}/${form.dataset.orderWorkflow}-transition`, mutationOptions({ target: data.get("target"), version: Number(form.dataset.orderVersion), reason: data.get("reason") }));
        $("#record-dialog").close();
        setNotice("Order status updated and written to the permanent audit trail.");
        await navigate();
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
  if (event.target.closest("#run-reconciliation")) {
    const button = event.target.closest("#run-reconciliation");
    button.disabled = true;
    button.textContent = "Reconciling…";
    try {
      const data = await api("/reconciliation?days=7");
      $("#reconciliation-result").innerHTML = `<div class="section-heading"><div><h2>Stripe reconciliation</h2><p>Last seven days · ${data.balanced ? "No differences found" : "Review required"}</p></div>${badge(data.balanced ? "balanced" : "attention")}</div><section class="panel"><div class="panel-body"><div class="detail-grid"><div class="detail-item"><span>Stripe</span><strong>${data.stripe.count} · ${escapeHtml(formatMoney(data.stripe.totalCents))}</strong></div><div class="detail-item"><span>Office</span><strong>${data.office.count} · ${escapeHtml(formatMoney(data.office.totalCents))}</strong></div><div class="detail-item"><span>Exceptions</span><strong>${data.unmatchedStripe.length + data.unmatchedOffice.length + data.amountMismatches.length}</strong></div></div></div></section>`;
    } catch (error) { setNotice(error.message); }
    finally { button.disabled = false; button.textContent = "Reconcile Stripe"; }
  } else if (orderButton) await openOrder(orderButton.dataset.orderId);
  else if (freightButton) {
    const item = state.freightItems?.find((candidate) => candidate.id === freightButton.dataset.freightId);
    if (item) openFreight(item);
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

initialize();
