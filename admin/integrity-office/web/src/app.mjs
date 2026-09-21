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
  leads: ["Sales pipeline", "Sales leads"],
  tasks: ["Work management", "Tasks"],
  customers: ["Customer history", "Customers"],
  catalog: ["Product operations", "Supplier catalog"],
  purchasing: ["Supply chain", "Purchasing"],
  logistics: ["Fulfillment", "Logistics"],
  warranty: ["Customer care", "Warranty"],
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
  leadsPage: 1,
  tasksPage: 1,
  orderSearch: "",
  orderStatus: "",
  freightStatus: "",
  leadSearch: "",
  leadStatus: "",
  taskStatus: "",
  customerSearch: "",
  catalogSearch: "",
  catalogStatus: "",
  purchaseStatus: "",
  shipmentStatus: "",
  warrantyStatus: "",
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
    <thead><tr><th>Order</th><th>Customer</th><th>Unit</th><th>Payment</th><th>Fulfillment</th>${compact ? "" : "<th>Core</th>"}${can("finance") ? '<th class="money">Collected</th>' : ""}</tr></thead>
    <tbody>${orders.map((order) => `<tr>
      <td><button class="row-button" type="button" data-order-id="${escapeHtml(order.id)}">#${escapeHtml(order.orderNumber)}</button><small>${escapeHtml(formatDate(order.createdAt))}</small></td>
      <td><strong>${escapeHtml(order.customer.name)}</strong><small>${escapeHtml(order.vehicle.vin)}</small></td>
      <td><strong>${escapeHtml(order.application)}</strong><small>${escapeHtml(order.packageName)}</small></td>
      <td>${badge(order.paymentStatus)}</td><td>${badge(order.fulfillmentStatus)}</td>${compact ? "" : `<td>${badge(order.coreStatus)}</td>`}${can("finance") ? `<td class="money"><strong>${escapeHtml(formatMoney(order.collectedCents))}</strong></td>` : ""}
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
      ${can("finance") ? `<article class="metric good"><span>Collected · 30 days</span><strong>${escapeHtml(formatMoney(dashboard.collected30dCents))}</strong><small>Confirmed payment transactions</small></article>` : ""}
      <article class="metric"><span>Active orders</span><strong>${dashboard.activeOrders}</strong><small>Not closed or canceled</small></article>
      <article class="metric ${dashboard.freightExceptions ? "attention" : ""}"><span>Freight follow-up</span><strong>${dashboard.freightExceptions}</strong><small>Open customer recovery requests</small></article>
      <article class="metric ${systemExceptions ? "attention" : "good"}"><span>System exceptions</span><strong>${systemExceptions}</strong><small>Event retries and notification dead letters</small></article>
      ${can("operations") ? `<article class="metric ${dashboard.newLeads ? "attention" : "good"}"><span>New leads</span><strong>${dashboard.newLeads}</strong><small>${dashboard.unassignedLeads} currently unassigned</small></article>
      <article class="metric ${dashboard.overdueTasks ? "attention" : "good"}"><span>Overdue tasks</span><strong>${dashboard.overdueTasks}</strong><small>${dashboard.tasksDue24h} due in the next 24 hours</small></article>` : ""}
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
          ${can("finance") ? `<div class="detail-item"><span>Refunds · 30 days</span><strong>${escapeHtml(formatMoney(dashboard.refunds30dCents))}</strong></div>` : ""}
        </div>
      </div></section>
    </div>
    ${freight ? `<div class="section-heading"><div><h2>Freight recovery</h2><p>Customers waiting for a verified delivery rate.</p></div><a class="button button-small" href="#freight">Open queue</a></div><section class="panel">${freightTable(freight.items)}</section>` : ""}
  `;
};

const leadTable = (items) => {
  if (!items.length) return emptyState("No leads match this view.", "Website, phone, text and manually entered inquiries will appear here after lead ingestion is activated.");
  return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Lead</th><th>Contact</th><th>Interest</th><th>Source</th><th>Status</th><th>Owner</th><th>Follow-up</th></tr></thead><tbody>${items.map((item) => `<tr><td><button class="row-button" type="button" data-lead-id="${escapeHtml(item.id)}">${escapeHtml(item.reference)}</button><small>${escapeHtml(formatDate(item.createdAt))}</small></td><td><strong>${escapeHtml(item.contact.name)}</strong><small>${escapeHtml(item.contact.organization || item.contact.email || item.contact.phone || "—")}</small></td><td><strong>${escapeHtml(label(item.productInterest))}</strong><small>${escapeHtml(Object.values(item.vehicleSummary || {}).filter(Boolean).join(" · ") || "Application not recorded")}</small></td><td>${escapeHtml(item.source)}</td><td>${badge(item.state)} ${badge(item.priority)}</td><td>${escapeHtml(item.assigneeName || "Unassigned")}</td><td>${escapeHtml(formatDate(item.nextFollowUpAt))}</td></tr>`).join("")}</tbody></table></div>`;
};

const renderLeads = async (search = state.leadSearch, status = state.leadStatus) => {
  state.leadSearch = String(search || "");
  state.leadStatus = String(status || "");
  const qs = new URLSearchParams({ page: state.leadsPage, pageSize: 25, ...(search ? { search } : {}), ...(status ? { status } : {}) });
  const [data, assignees] = await Promise.all([api(`/leads?${qs}`), api("/staff/assignees")]);
  state.leadItems = data.items;
  state.workAssignees = assignees;
  $("#content").innerHTML = `<div class="page-actions"><p>Track every inquiry from first contact through quote, order or a documented lost reason.</p><button class="button button-primary" id="new-lead" type="button">Add lead</button></div><form class="filter-bar" id="leads-filter"><div class="filter-fields"><div class="field"><label for="lead-search">Search</label><input id="lead-search" name="search" type="search" maxlength="120" value="${escapeHtml(state.leadSearch)}" placeholder="Reference, name, email or phone"></div><div class="field"><label for="lead-status">Status</label><select id="lead-status" name="status"><option value="">All statuses</option>${["new", "assigned", "contacted", "qualified", "quoted", "won", "lost", "closed"].map((value) => `<option value="${value}" ${state.leadStatus === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div></div><button class="button" type="submit">Apply filters</button></form><section class="panel">${leadTable(data.items)}</section><div class="pagination"><span>Page ${data.page} · ${data.total} leads</span><button class="button button-small" data-leads-page="${data.page - 1}" ${data.page <= 1 ? "disabled" : ""}>Previous</button><button class="button button-small" data-leads-page="${data.page + 1}" ${(data.page * data.pageSize) >= data.total ? "disabled" : ""}>Next</button></div>`;
};

const taskTable = (items) => {
  if (!items.length) return emptyState("No tasks match this view.", "Automated and manually created work will appear here with an owner, priority and due date.");
  return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Task</th><th>Related record</th><th>Status</th><th>Priority</th><th>Owner</th><th>Due</th></tr></thead><tbody>${items.map((item) => `<tr><td><button class="row-button" type="button" data-task-id="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button><small>${escapeHtml(label(item.taskType))}</small></td><td><strong>${escapeHtml(label(item.entityType))}</strong><small>${escapeHtml(item.entityId || "General queue")}</small></td><td>${badge(item.state)}</td><td>${badge(item.priority)}</td><td>${escapeHtml(item.assigneeName || "Unassigned")}</td><td>${escapeHtml(formatDate(item.dueAt))}</td></tr>`).join("")}</tbody></table></div>`;
};

const renderTasks = async (status = state.taskStatus) => {
  state.taskStatus = String(status || "");
  const qs = new URLSearchParams({ page: state.tasksPage, pageSize: 25, ...(status ? { status } : {}) });
  const [data, assignees] = await Promise.all([api(`/tasks?${qs}`), api("/staff/assignees")]);
  state.taskItems = data.items;
  state.workAssignees = assignees;
  $("#content").innerHTML = `<div class="page-actions"><p>Use one queue for sales follow-up, order gates, purchasing, logistics, cores, warranties and system work.</p><button class="button button-primary" id="new-task" type="button">Create task</button></div><form class="filter-bar" id="tasks-filter"><div class="field"><label for="task-status">Status</label><select id="task-status" name="status"><option value="">All statuses</option>${["open", "in_progress", "blocked", "completed", "canceled"].map((value) => `<option value="${value}" ${state.taskStatus === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div><button class="button" type="submit">Apply filter</button></form><section class="panel">${taskTable(data.items)}</section><div class="pagination"><span>Page ${data.page} · ${data.total} tasks</span><button class="button button-small" data-tasks-page="${data.page - 1}" ${data.page <= 1 ? "disabled" : ""}>Previous</button><button class="button button-small" data-tasks-page="${data.page + 1}" ${(data.page * data.pageSize) >= data.total ? "disabled" : ""}>Next</button></div>`;
};

const renderCustomers = async (search = state.customerSearch) => {
  state.customerSearch = String(search || "");
  const data = await api(`/customers?${new URLSearchParams({ pageSize: 50, ...(search ? { search } : {}) })}`);
  state.customerItems = data.items;
  const table = data.items.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Contact</th><th>Vehicles</th><th>Orders</th><th>Open tasks</th><th>Updated</th></tr></thead><tbody>${data.items.map((item) => `<tr><td><button class="row-button" type="button" data-customer-id="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button></td><td>${escapeHtml(item.email)}<small>${escapeHtml(item.phone)}</small></td><td>${item.vehicleCount}</td><td>${item.orderCount}</td><td>${item.openTaskCount}</td><td>${escapeHtml(formatDate(item.updatedAt))}</td></tr>`).join("")}</tbody></table></div>` : emptyState("No customers match this view.", "Customers appear after a verified checkout or staff-authorized import.");
  $("#content").innerHTML = `<form class="filter-bar" id="customers-filter"><div class="field"><label for="customer-search">Search</label><input id="customer-search" name="search" type="search" maxlength="120" value="${escapeHtml(state.customerSearch)}" placeholder="Name, email or phone"></div><button class="button" type="submit">Search</button></form><section class="panel">${table}</section>`;
};

const renderCatalog = async (search = state.catalogSearch, status = state.catalogStatus) => {
  state.catalogSearch = String(search || ""); state.catalogStatus = String(status || "");
  const qs = new URLSearchParams({ pageSize: 50, ...(search ? { search } : {}), ...(status ? { status } : {}) });
  const [products, suppliers] = await Promise.all([api(`/catalog-products?${qs}`), api("/suppliers?pageSize=100")]);
  state.catalogItems = products.items; state.supplierItems = suppliers.items;
  const productTable = products.items.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Integrity SKU</th><th>Product</th><th>Supplier record</th><th>Status</th><th>Verified</th>${can("finance") ? '<th class="money">Wholesale</th>' : ""}</tr></thead><tbody>${products.items.map((item) => `<tr><td><button class="row-button" type="button" data-catalog-id="${escapeHtml(item.id)}">${escapeHtml(item.integritySku)}</button><small>${escapeHtml(label(item.kind))}</small></td><td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.manufacturerPartNumber || item.supplierSku)}</small></td><td>${escapeHtml(item.supplier.name)}</td><td>${badge(item.status)}</td><td>${escapeHtml(formatDate(item.lastVerifiedAt))}<small>${escapeHtml(item.latestPrice?.availabilityText || "No verified price")}</small></td>${can("finance") ? `<td class="money">${item.latestPrice ? escapeHtml(formatMoney(item.latestPrice.supplierUnitCostCents)) : "—"}</td>` : ""}</tr>`).join("")}</tbody></table></div>` : emptyState("No catalog products match this view.", "Create verified supplier records before adding products.");
  const supplierCards = suppliers.items.length ? suppliers.items.map((item) => `<article class="record-summary"><strong>${escapeHtml(item.displayName)}</strong><span>${escapeHtml(item.code)} · ${item.productCount} products · ${item.active ? "Active" : "Paused"}</span></article>`).join("") : emptyState("No suppliers configured.", "An administrator can add the first approved supplier record.");
  $("#content").innerHTML = `<div class="page-actions"><p>Supplier identities, fitment, warranty, shipping and price provenance remain private to staff.</p><div>${can("administrator") ? '<button class="button" id="new-supplier" type="button">Add supplier</button>' : ""} <button class="button button-primary" id="new-catalog-product" type="button">Add draft product</button></div></div><form class="filter-bar" id="catalog-filter"><div class="filter-fields"><div class="field"><label for="catalog-search">Search</label><input id="catalog-search" name="search" type="search" maxlength="120" value="${escapeHtml(state.catalogSearch)}"></div><div class="field"><label for="catalog-status">Status</label><select id="catalog-status" name="status"><option value="">All</option>${["draft","active","paused","retired"].map((value) => `<option value="${value}" ${state.catalogStatus === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div></div><button class="button" type="submit">Apply</button></form><section class="panel">${productTable}</section><div class="section-heading"><div><h2>Suppliers</h2><p>Internal sourcing records; never published as storefront endorsements.</p></div></div><section class="panel"><div class="panel-body">${supplierCards}</div></section>`;
  $("#new-catalog-product")?.toggleAttribute("hidden", !can("operations"));
};

const renderPurchasing = async (status = state.purchaseStatus) => {
  state.purchaseStatus = String(status || "");
  const data = await api(`/purchase-orders?${new URLSearchParams({ pageSize: 50, ...(status ? { status } : {}) })}`);
  state.purchaseItems = data.items;
  const table = data.items.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Purchase order</th><th>Customer order</th><th>Supplier</th><th>Status</th><th>Lines</th><th>ETA</th>${can("finance") ? '<th class="money">Commitment</th>' : ""}</tr></thead><tbody>${data.items.map((item) => `<tr><td><button class="row-button" type="button" data-purchase-id="${escapeHtml(item.id)}">${escapeHtml(item.purchaseOrderNumber)}</button><small>${escapeHtml(item.supplierOrderReference || "Not submitted")}</small></td><td>#${escapeHtml(item.orderNumber)}</td><td>${escapeHtml(item.supplier.name)}</td><td>${badge(item.state)}</td><td>${item.lineCount}</td><td>${escapeHtml(formatDate(item.estimatedShipAt))}</td>${can("finance") ? `<td class="money">${escapeHtml(formatMoney(item.totalCents))}</td>` : ""}</tr>`).join("")}</tbody></table></div>` : emptyState("No purchase orders match this view.", "Approved sourcing commitments will appear here with supplier acknowledgement and ETA tracking.");
  $("#content").innerHTML = `<div class="page-actions"><p>Financial commitments require finance approval; operations records acknowledgements, backorders and receipt.</p></div><form class="filter-bar" id="purchasing-filter"><div class="field"><label for="purchase-status">Status</label><select id="purchase-status" name="status"><option value="">All</option>${["draft","approved","submitted","acknowledged","backordered","partially_shipped","shipped","received","canceled","closed"].map((value) => `<option value="${value}" ${state.purchaseStatus === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div><button class="button" type="submit">Apply</button></form><section class="panel">${table}</section>`;
};

const renderLogistics = async (status = state.shipmentStatus) => {
  state.shipmentStatus = String(status || "");
  const data = await api(`/shipments?${new URLSearchParams({ pageSize: 50, ...(status ? { status } : {}) })}`);
  state.shipmentItems = data.items;
  const table = data.items.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Shipment</th><th>Order</th><th>Direction</th><th>Status</th><th>Carrier</th><th>Tracking / PRO</th><th>Dates</th></tr></thead><tbody>${data.items.map((item) => `<tr><td><button class="row-button" type="button" data-shipment-id="${escapeHtml(item.id)}">${escapeHtml(item.id.slice(0,8))}</button><small>${item.itemCount} line(s)</small></td><td>#${escapeHtml(item.orderNumber)}</td><td>${escapeHtml(label(item.direction))}</td><td>${badge(item.status)}</td><td>${escapeHtml(item.carrier || "Not booked")}</td><td>${escapeHtml(item.trackingNumber || item.bolOrProNumber || "—")}</td><td>${escapeHtml(formatDate(item.shippedAt))}<small>${item.deliveredAt ? `Delivered ${escapeHtml(formatDate(item.deliveredAt))}` : ""}</small></td></tr>`).join("")}</tbody></table></div>` : emptyState("No shipments match this view.", "Planned, in-transit, exception and return shipments will be tracked here.");
  $("#content").innerHTML = `<div class="page-actions"><p>Outbound units must trace to exact purchase-order lines; replacements require warranty authorization.</p></div><form class="filter-bar" id="logistics-filter"><div class="field"><label for="shipment-status">Status</label><select id="shipment-status" name="status"><option value="">All</option>${["planned","booked","in_transit","delivered","exception","canceled"].map((value) => `<option value="${value}" ${state.shipmentStatus === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div><button class="button" type="submit">Apply</button></form><section class="panel">${table}</section>`;
};

const renderWarranty = async (status = state.warrantyStatus) => {
  state.warrantyStatus = String(status || "");
  const data = await api(`/warranty-claims?${new URLSearchParams({ pageSize: 50, ...(status ? { status } : {}) })}`);
  state.warrantyItems = data.items;
  const table = data.items.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Claim</th><th>Order / unit</th><th>Status</th><th>Supplier reference</th><th>Owner</th><th>Evidence deadline</th>${can("finance") ? '<th class="money">Approved</th>' : ""}</tr></thead><tbody>${data.items.map((item) => `<tr><td><button class="row-button" type="button" data-warranty-id="${escapeHtml(item.id)}">WC-${escapeHtml(item.claimNumber)}</button><small>${escapeHtml(formatDate(item.createdAt))}</small></td><td>#${escapeHtml(item.orderNumber)}<small>${escapeHtml(item.itemTitle || "Order-level claim")}</small></td><td>${badge(item.state)}</td><td>${escapeHtml(item.supplierClaimReference || "Not submitted")}</td><td>${escapeHtml(item.assigneeName || "Unassigned")}</td><td>${escapeHtml(formatDate(item.evidenceDeadline))}</td>${can("finance") ? `<td class="money">${escapeHtml(formatMoney((item.approvedPartsCents || 0)+(item.approvedLaborCents || 0)+(item.approvedFreightCents || 0)))}</td>` : ""}</tr>`).join("")}</tbody></table></div>` : emptyState("No warranty claims match this view.", "Intake, evidence, supplier decisions, replacement and reimbursement will appear here.");
  $("#content").innerHTML = `<div class="page-actions"><p>Operations owns evidence and customer communication; finance alone records approved monetary decisions.</p></div><form class="filter-bar" id="warranty-filter"><div class="field"><label for="warranty-status">Status</label><select id="warranty-status" name="status"><option value="">All</option>${["intake","evidence_needed","submitted","authorized","denied","repairing","replacement_shipping","reimbursing","resolved","closed"].map((value) => `<option value="${value}" ${state.warrantyStatus === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div><button class="button" type="submit">Apply</button></form><section class="panel">${table}</section>`;
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

const renderers = { dashboard: renderDashboard, leads: renderLeads, tasks: renderTasks, customers: renderCustomers, orders: renderOrders, catalog: renderCatalog, purchasing: renderPurchasing, logistics: renderLogistics, warranty: renderWarranty, freight: renderFreight, promotions: renderPromotions, finance: renderFinance, staff: renderStaff, system: renderSystem, audit: renderAudit };

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
    requiredRecord = `<form id="fitment-review-form" data-order-id="${id}" data-order-version="${version}"><div class="form-grid"><div class="field"><label for="fitment-decision">Decision</label><select id="fitment-decision" name="decision"><option value="approved">Approve exact fitment</option><option value="rejected">Reject and cancel fulfillment</option></select></div><div class="field"><label for="supplier-part-uid">Supplier part reference</label><input id="supplier-part-uid" name="supplierPartUid" maxlength="160" required></div><div class="field wide"><label for="fitment-reason">Verification record</label><input id="fitment-reason" name="reason" maxlength="1000" required placeholder="Document VIN, application and catalog evidence reviewed"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Record fitment decision</button></div></form>`;
  } else if (order.fulfillmentStatus === "ready_for_supplier") {
    requiredRecord = `<p class="access-help">A finance-authorized purchase-order draft is required below. Submitting the approved PO advances this order automatically.</p>`;
  } else if (["supplier_ordered", "building"].includes(order.fulfillmentStatus) && !order.supplier?.shippedAt) {
    requiredRecord = `<p class="access-help">Plan and update the exact purchase-order shipment from the Purchasing or Logistics queue. In-transit evidence advances this order automatically.</p>`;
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
    const [order, supplierData] = await Promise.all([
      api(`/orders/${encodeURIComponent(id)}`),
      (can("operations") || can("finance")) ? api("/suppliers?pageSize=100") : Promise.resolve({ items: [] }),
    ]);
    $("#dialog-title").textContent = `Order #${order.orderNumber}`;
    const availableCoreTargets = (coreTargets[order.coreStatus] || [])
      .filter((target) => ["refunded", "forfeited"].includes(target) ? can("finance") : can("operations"));
    const financials = can("finance") && order.supplierUnitCostCents !== undefined ? `<div class="section-heading"><div><h2>Pricing and projected margin</h2><p>Immutable checkout snapshot; excludes payment fees and later supplier adjustments.</p></div></div><div class="detail-grid"><div class="detail-item"><span>List unit price</span><strong>${escapeHtml(formatMoney(order.listUnitPriceCents))}</strong></div><div class="detail-item"><span>Promotion discount</span><strong>${escapeHtml(formatMoney(order.promotionDiscountCents))}</strong></div><div class="detail-item"><span>Customer unit price</span><strong>${escapeHtml(formatMoney(order.unitPriceCents))}</strong></div><div class="detail-item"><span>Freight revenue</span><strong>${escapeHtml(formatMoney(order.freightCents))}</strong></div><div class="detail-item"><span>Supplier unit cost</span><strong>${escapeHtml(formatMoney(order.supplierUnitCostCents))}</strong></div><div class="detail-item"><span>Supplier freight cost</span><strong>${escapeHtml(formatMoney(order.supplierFreightCostCents))}</strong></div><div class="detail-item"><span>Projected gross profit</span><strong>${escapeHtml(formatMoney(order.grossProfitBeforeFeesCents))}</strong><small>Before payment fees</small></div></div>` : "";
    $("#dialog-content").innerHTML = `<div class="detail-grid"><div class="detail-item"><span>Customer</span><strong>${escapeHtml(order.customer.name)}</strong><small>${escapeHtml(order.customer.email)}</small></div><div class="detail-item"><span>Phone</span><strong>${escapeHtml(order.customer.phone)}</strong></div><div class="detail-item"><span>Ship to</span><strong>${escapeHtml(formatAddress(order.deliveryAddress))}</strong><small>${escapeHtml(order.deliveryAddress?.locationType || "Delivery location")}</small></div><div class="detail-item"><span>VIN</span><strong>${escapeHtml(order.vehicle.vin)}</strong></div><div class="detail-item"><span>Transmission</span><strong>${escapeHtml(order.application)}</strong></div><div class="detail-item"><span>Package</span><strong>${escapeHtml(order.packageName)}</strong></div><div class="detail-item"><span>Collected</span><strong>${escapeHtml(formatMoney(order.collectedCents))}</strong></div><div class="detail-item"><span>Payment</span><strong>${escapeHtml(label(order.paymentStatus))}</strong></div><div class="detail-item"><span>Fulfillment</span><strong>${escapeHtml(label(order.fulfillmentStatus))}</strong></div><div class="detail-item"><span>Core</span><strong>${escapeHtml(label(order.coreStatus))}</strong></div>${order.promotionCode ? `<div class="detail-item"><span>Promotion</span><strong>${escapeHtml(order.promotionCode)} · ${escapeHtml(formatMoney(order.promotionDiscountCents))} off</strong></div>` : ""}</div>${financials}${orderDisputes(order)}${orderRecords(order)}${orderNotes(order)}
      ${can("operations") ? `<div class="section-heading"><div><h2>Fulfillment</h2><p>Current status: ${escapeHtml(label(order.fulfillmentStatus))}</p></div></div>${fulfillmentControl(order)}` : ""}${availableCoreTargets.length ? `<div class="section-heading"><div><h2>Core return</h2><p>Current status: ${escapeHtml(label(order.coreStatus))}</p></div></div>${transitionForm(order, "core", availableCoreTargets)}` : ""}${can("operations") ? `<div class="section-heading"><div><h2>Add note</h2><p>Operational notes are permanent.</p></div></div><form id="note-form" data-order-id="${escapeHtml(order.id)}"><div class="field"><label for="order-note">Note</label><textarea id="order-note" name="note" maxlength="5000" required></textarea></div><div class="form-actions"><button class="button" type="submit">Save note</button></div></form>` : ""}${refundControls(order)}
      <div class="section-heading"><div><h2>Timeline</h2></div></div>${order.timeline.length ? `<ol class="timeline">${order.timeline.map((item) => `<li><strong>${escapeHtml(label(item.workflow))}: ${escapeHtml(label(item.from || "created"))} → ${escapeHtml(label(item.to))}</strong><span>${escapeHtml(item.reason || "No reason recorded")} · ${escapeHtml(formatDate(item.createdAt))}</span></li>`).join("")}</ol>` : emptyState("No workflow history yet.", "Status changes will appear here.")}`;
    if (!can("finance")) $$(".detail-item > span", $("#dialog-content")).find((node) => node.textContent === "Collected")?.closest(".detail-item")?.remove();
    if (can("finance") && order.fulfillmentStatus === "ready_for_supplier" && order.items?.length && supplierData.items.length) {
      const item = order.items[0];
      $("#dialog-content").insertAdjacentHTML("beforeend", `<div class="section-heading"><div><h2>Create purchase-order draft</h2><p>Financial commitment remains a draft until separately approved.</p></div></div><form id="purchase-create-form" data-order-id="${escapeHtml(order.id)}" data-order-item-id="${escapeHtml(item.id)}"><div class="form-grid"><div class="field"><label for="po-number-new">Integrity PO number</label><input id="po-number-new" name="purchaseOrderNumber" maxlength="80" required></div><div class="field"><label for="po-supplier-new">Supplier</label><select id="po-supplier-new" name="supplierId" required>${supplierData.items.filter((supplier) => supplier.active).map((supplier) => `<option value="${escapeHtml(supplier.id)}">${escapeHtml(supplier.displayName)}</option>`).join("")}</select></div><div class="field wide"><label for="po-description-new">Line</label><input id="po-description-new" name="description" maxlength="500" value="${escapeHtml(item.title)}" required></div><div class="field"><label for="po-supplier-sku-new">Supplier SKU</label><input id="po-supplier-sku-new" name="supplierSku" maxlength="160" value="${escapeHtml(item.supplierSku || item.integritySku)}" required></div><div class="field"><label for="po-unit-cost-new">Unit cost</label><input id="po-unit-cost-new" name="unitCost" type="number" min="0" step="0.01" value="${item.unitSupplierCostCents === null || item.unitSupplierCostCents === undefined ? "" : (item.unitSupplierCostCents/100).toFixed(2)}" required></div><div class="field"><label for="po-core-cost-new">Supplier core charge</label><input id="po-core-cost-new" name="coreCharge" type="number" min="0" step="0.01" value="0.00"></div><div class="field"><label for="po-freight-new">Supplier freight</label><input id="po-freight-new" name="freight" type="number" min="0" step="0.01" value="0.00"></div><div class="field"><label for="po-tax-new">Supplier tax</label><input id="po-tax-new" name="tax" type="number" min="0" step="0.01" value="0.00"></div><div class="field wide"><label for="po-create-reason">Creation reason</label><input id="po-create-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create PO draft</button></div></form>`);
    }
    const warrantyItems = (order.items || []).filter((item) => item.supplier?.id);
    if (can("operations") && warrantyItems.length) {
      $("#dialog-content").insertAdjacentHTML("beforeend", `<div class="section-heading"><div><h2>Warranty intake</h2><p>Create only from a documented customer complaint and the purchased item provenance.</p></div></div><form id="warranty-create-form" data-order-id="${escapeHtml(order.id)}"><div class="form-grid"><div class="field wide"><label for="warranty-item-new">Purchased item</label><select id="warranty-item-new" name="item" required>${warrantyItems.map((item) => `<option value="${escapeHtml(item.id)}" data-supplier-id="${escapeHtml(item.supplier.id)}">${escapeHtml(item.title)} · ${escapeHtml(item.supplier.name)}</option>`).join("")}</select></div><div class="field wide"><label for="warranty-complaint-new">Customer complaint</label><textarea id="warranty-complaint-new" name="complaint" maxlength="5000" required></textarea></div><div class="field"><label for="warranty-installed-new">Installed date</label><input id="warranty-installed-new" name="installedAt" type="date"></div><div class="field"><label for="warranty-install-mileage-new">Mileage at install</label><input id="warranty-install-mileage-new" name="mileageAtInstall" type="number" min="0"></div><div class="field"><label for="warranty-claim-mileage-new">Mileage at claim</label><input id="warranty-claim-mileage-new" name="mileageAtClaim" type="number" min="0"></div><div class="field"><label for="warranty-installer-new">Installer</label><input id="warranty-installer-new" name="installerName" maxlength="240"></div><div class="field wide"><label for="warranty-intake-reason">Intake evidence</label><input id="warranty-intake-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button" type="submit">Open warranty intake</button></div></form>`);
    }
  } catch (error) {
    $("#dialog-content").innerHTML = emptyState("Order could not be loaded.", error.message);
  }
};

const openFreight = (item) => openDialog({
  kicker: "Freight recovery",
  title: item.reference,
  html: `<div class="detail-grid"><div class="detail-item"><span>Customer</span><strong>${escapeHtml(item.customer.name)}</strong></div><div class="detail-item"><span>Email</span><strong>${escapeHtml(item.customer.email)}</strong></div><div class="detail-item"><span>Phone</span><strong>${escapeHtml(item.customer.phone)}</strong></div><div class="detail-item"><span>Destination</span><strong>${escapeHtml(item.destination)}</strong></div><div class="detail-item"><span>VIN</span><strong>${escapeHtml(item.vin || "Not captured")}</strong></div><div class="detail-item"><span>Requested unit</span><strong>${escapeHtml(item.selectionId || "Not captured")}</strong><small>${escapeHtml(item.packageName || "No package recorded")}</small></div><div class="detail-item"><span>Issue</span><strong>${escapeHtml(label(item.failureCode))}</strong></div><div class="detail-item"><span>Assigned to</span><strong>${escapeHtml(item.assigneeName || "Unassigned")}</strong><small>${escapeHtml(item.supplierRequestId || "No supplier request")}</small></div></div><div class="section-heading"><div><h2>Update request</h2><p>Document contact attempts and the final resolution.</p></div></div><form id="freight-update-form" data-freight-id="${escapeHtml(item.id)}"><div class="form-grid"><div class="field"><label for="freight-update-status">Status</label><select id="freight-update-status" name="status">${["open", "contacted", "quoted", "converted", "closed"].map((status) => `<option value="${status}" ${item.status === status ? "selected" : ""}>${escapeHtml(label(status))}</option>`).join("")}</select></div><div class="field"><label for="freight-assignee">Assigned to</label><select id="freight-assignee" name="assignedTo"><option value="">Unassigned</option>${item.assignedTo && !(state.freightAssignees || []).some((staff) => staff.id === item.assignedTo) ? `<option value="${escapeHtml(item.assignedTo)}" selected>${escapeHtml(item.assigneeName || "Inactive assignee")} (inactive)</option>` : ""}${(state.freightAssignees || []).map((staff) => `<option value="${escapeHtml(staff.id)}" ${item.assignedTo === staff.id ? "selected" : ""}>${escapeHtml(staff.displayName)}</option>`).join("")}</select></div><div class="field"><label for="next-follow-up">Next follow-up</label><input id="next-follow-up" name="nextFollowUpAt" type="datetime-local" value="${escapeHtml(inputDateTime(item.nextFollowUpAt))}"></div><div class="field wide"><label for="resolution-note">Resolution note</label><textarea id="resolution-note" name="resolutionNote" maxlength="2000">${escapeHtml(item.resolutionNote || "")}</textarea></div><div class="field wide"><label for="freight-reason">Change reason</label><input id="freight-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Save update</button></div></form>`,
});

const openCustomer = async (id) => {
  openDialog({ kicker: "Customer history", title: "Loading…", html: '<div class="loading">Loading unified customer record…</div>' });
  try {
    const item = await api(`/customers/${id}`);
    $("#dialog-title").textContent = item.name;
    $("#dialog-content").innerHTML = `<div class="detail-grid"><div class="detail-item"><span>Email</span><strong>${escapeHtml(item.email)}</strong></div><div class="detail-item"><span>Phone</span><strong>${escapeHtml(item.phone)}</strong></div><div class="detail-item"><span>Vehicles</span><strong>${item.vehicles.length}</strong><small>${item.vehicles.map((v) => `${v.year || ""} ${v.make || ""} ${v.model || ""}`).join(" · ") || "None"}</small></div><div class="detail-item"><span>Orders</span><strong>${item.orders.length}</strong><small>${item.orders.map((o) => `#${o.orderNumber} ${label(o.fulfillmentStatus)}`).join(" · ") || "None"}</small></div></div><div class="section-heading"><div><h2>Open work and history</h2><p>Sales, orders, warranty and communications linked to this customer.</p></div></div>${item.tasks.length ? `<ol class="timeline">${item.tasks.map((task) => `<li><strong>${escapeHtml(task.title)} · ${escapeHtml(label(task.state))}</strong><span>${escapeHtml(formatDate(task.dueAt))}</span></li>`).join("")}</ol>` : emptyState("No linked tasks.", "New work appears here when it is tied to this customer.")}${item.communications.length ? `<ol class="timeline">${item.communications.map((entry) => `<li><strong>${escapeHtml(label(entry.channel))} · ${escapeHtml(label(entry.direction))} · ${escapeHtml(formatDate(entry.occurredAt))}</strong><span>${escapeHtml(entry.summary)}</span></li>`).join("")}</ol>` : ""}`;
  } catch (error) { $("#dialog-content").innerHTML = emptyState("Customer could not be loaded.", error.message); }
};

const openSupplierForm = () => openDialog({
  kicker: "Supplier control", title: "Add supplier",
  html: `<form id="supplier-create-form"><div class="form-grid"><div class="field"><label for="supplier-code">Internal code</label><input id="supplier-code" name="code" maxlength="40" required></div><div class="field"><label for="supplier-name-new">Display name</label><input id="supplier-name-new" name="displayName" maxlength="160" required></div><div class="field wide"><label for="supplier-ordering">Ordering method</label><input id="supplier-ordering" name="orderingMethod" maxlength="500"></div><div class="field wide"><label for="supplier-warranty-ref">Warranty terms reference</label><input id="supplier-warranty-ref" name="warrantyTermsReference" maxlength="1000"></div><div class="field wide"><label for="supplier-core-ref">Core terms reference</label><input id="supplier-core-ref" name="coreTermsReference" maxlength="1000"></div><div class="field wide"><label for="supplier-reason">Approval reason</label><input id="supplier-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create supplier</button></div></form>`,
});

const openCatalogForm = () => openDialog({
  kicker: "Product operations", title: "Add draft product",
  html: `<form id="catalog-create-form"><div class="form-grid"><div class="field"><label for="catalog-sku-new">Integrity SKU</label><input id="catalog-sku-new" name="integritySku" maxlength="80" required></div><div class="field"><label for="catalog-supplier-new">Supplier</label><select id="catalog-supplier-new" name="supplierId" required><option value="">Select supplier</option>${(state.supplierItems || []).filter((s) => s.active).map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.displayName)}</option>`).join("")}</select></div><div class="field"><label for="catalog-supplier-sku">Supplier SKU</label><input id="catalog-supplier-sku" name="supplierSku" maxlength="160" required></div><div class="field"><label for="catalog-kind-new">Product kind</label><select id="catalog-kind-new" name="kind">${["transmission","engine","transfer_case","differential","accessory","service"].map((value) => `<option value="${value}">${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field wide"><label for="catalog-title-new">Product title</label><input id="catalog-title-new" name="title" maxlength="240" required></div><div class="field"><label for="catalog-brand-new">Manufacturer brand</label><input id="catalog-brand-new" name="manufacturerBrand" maxlength="160"></div><div class="field"><label for="catalog-mpn-new">Manufacturer part number</label><input id="catalog-mpn-new" name="manufacturerPartNumber" maxlength="160"></div><div class="field wide"><label for="catalog-application-new">Verified application summary</label><input id="catalog-application-new" name="applicationSummary" maxlength="500" required></div><div class="field wide"><label for="catalog-reason-new">Creation reason</label><input id="catalog-reason-new" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create draft</button></div></form>`,
});

const openCatalogDetail = (item) => openDialog({
  kicker: "Supplier catalog", title: item.integritySku,
  html: `<div class="detail-grid"><div class="detail-item"><span>Product</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(label(item.kind))} · ${escapeHtml(item.condition)}</small></div><div class="detail-item"><span>Supplier record</span><strong>${escapeHtml(item.supplier.name)}</strong><small>${escapeHtml(item.supplierSku)}</small></div><div class="detail-item"><span>Status</span><strong>${escapeHtml(label(item.status))}</strong><small>Version ${item.version}</small></div><div class="detail-item"><span>Last verified</span><strong>${escapeHtml(formatDate(item.lastVerifiedAt))}</strong><small>${escapeHtml(item.latestPrice?.availabilityText || "No price verification")}</small></div>${can("finance") && item.latestPrice ? `<div class="detail-item"><span>Wholesale / core</span><strong>${escapeHtml(formatMoney(item.latestPrice.supplierUnitCostCents))}</strong><small>${escapeHtml(formatMoney(item.latestPrice.supplierCoreDepositCents))} core · ${escapeHtml(item.latestPrice.sourceReference)}</small></div>` : ""}</div>${can("finance") ? `<div class="section-heading"><div><h2>Append verified price</h2><p>Price history is immutable; corrections create a new version.</p></div></div><form id="catalog-price-form" data-catalog-id="${escapeHtml(item.id)}"><div class="form-grid"><div class="field"><label for="price-cost">Wholesale cost</label><input id="price-cost" name="supplierUnitCost" type="number" min="0" step="0.01" required></div><div class="field"><label for="price-core">Supplier core</label><input id="price-core" name="supplierCoreDeposit" type="number" min="0" step="0.01" value="0"></div><div class="field"><label for="price-retail">Suggested retail</label><input id="price-retail" name="suggestedRetail" type="number" min="0" step="0.01"></div><div class="field"><label for="price-code">Availability code</label><input id="price-code" name="availabilityCode" maxlength="80" required></div><div class="field wide"><label for="price-text">Availability detail</label><input id="price-text" name="availabilityText" maxlength="500" required></div><div class="field"><label for="price-verified">Verified at</label><input id="price-verified" name="verifiedAt" type="datetime-local" required></div><div class="field"><label for="price-valid">Valid through</label><input id="price-valid" name="validThrough" type="datetime-local"></div><div class="field wide"><label for="price-source">Private source reference</label><input id="price-source" name="sourceReference" maxlength="500" required></div><div class="field wide"><label for="price-reason">Recording reason</label><input id="price-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Record price version</button></div></form>` : ""}`,
});

const openCatalogProduct = (item) => {
  openCatalogDetail(item);
  if (!can("administrator")) return;
  $("#dialog-content").insertAdjacentHTML("beforeend", `<div class="section-heading"><div><h2>Publication status</h2><p>Activation requires an active supplier and a currently valid verified price.</p></div></div><form id="catalog-status-form" data-catalog-id="${escapeHtml(item.id)}" data-catalog-version="${item.version}"><div class="form-grid"><div class="field"><label for="catalog-status-update">Status</label><select id="catalog-status-update" name="status">${["draft","active","paused","retired"].map((value) => `<option value="${value}" ${item.status===value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="catalog-verified-update">Last verified</label><input id="catalog-verified-update" name="lastVerifiedAt" type="datetime-local" value="${escapeHtml(inputDateTime(item.lastVerifiedAt))}"></div><div class="field wide"><label for="catalog-status-reason">Change reason</label><input id="catalog-status-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Save catalog status</button></div></form>`);
};

const openPurchaseOrder = (item) => {
  const allowed = { draft: ["approved","canceled"], approved: ["submitted","canceled"], submitted: ["acknowledged","backordered","canceled"], acknowledged: ["backordered","partially_shipped","shipped","received","canceled"], backordered: ["acknowledged","partially_shipped","shipped","canceled"], partially_shipped: ["shipped","received","canceled"], shipped: ["received"], received: ["closed"] }[item.state] || [];
  const permitted = allowed.filter((target) => (["approved","submitted","canceled"].includes(target) ? can("finance") : can("operations")));
  openDialog({ kicker: "Purchasing", title: item.purchaseOrderNumber, html: `<div class="detail-grid"><div class="detail-item"><span>Customer order</span><strong>#${escapeHtml(item.orderNumber)}</strong></div><div class="detail-item"><span>Supplier</span><strong>${escapeHtml(item.supplier.name)}</strong></div><div class="detail-item"><span>Status</span><strong>${escapeHtml(label(item.state))}</strong><small>Version ${item.version}</small></div><div class="detail-item"><span>ETA</span><strong>${escapeHtml(formatDate(item.estimatedShipAt))}</strong></div>${can("finance") ? `<div class="detail-item"><span>Commitment</span><strong>${escapeHtml(formatMoney(item.totalCents))}</strong></div>` : ""}</div>${permitted.length ? `<form id="purchase-update-form" data-purchase-id="${escapeHtml(item.id)}" data-purchase-version="${item.version}"><div class="form-grid"><div class="field"><label for="purchase-next-state">Next status</label><select id="purchase-next-state" name="state">${permitted.map((value) => `<option value="${value}">${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="purchase-supplier-reference">Supplier reference</label><input id="purchase-supplier-reference" name="supplierOrderReference" maxlength="160" value="${escapeHtml(item.supplierOrderReference || "")}"></div><div class="field"><label for="purchase-eta">Estimated ship</label><input id="purchase-eta" name="estimatedShipAt" type="datetime-local" value="${escapeHtml(inputDateTime(item.estimatedShipAt))}"></div><div class="field wide"><label for="purchase-cancel-reason">Cancellation reason (when canceled)</label><input id="purchase-cancel-reason" name="cancellationReason" maxlength="500"></div><div class="field wide"><label for="purchase-reason">Transition evidence</label><input id="purchase-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Record transition</button></div></form>` : '<p class="access-help">No permitted transition is available for your role.</p>'}` });
};

const openPurchaseOrderDetail = async (summary) => {
  openPurchaseOrder(summary);
  try {
    const item = await api(`/purchase-orders/${summary.id}`);
    openPurchaseOrder(item);
    if (can("operations") && ["acknowledged", "backordered", "partially_shipped", "shipped"].includes(item.state) && item.lines.length) {
      $("#dialog-content").insertAdjacentHTML("beforeend", `<div class="section-heading"><div><h2>Plan outbound shipment</h2><p>Every shipment line remains tied to the exact supplier purchase-order line.</p></div></div><form id="shipment-create-form" data-order-id="${escapeHtml(item.orderId)}" data-purchase-id="${escapeHtml(item.id)}"><div class="form-grid"><div class="field wide"><label for="shipment-po-line">Purchase-order line</label><select id="shipment-po-line" name="line" required>${item.lines.map((line) => `<option value="${escapeHtml(line.id)}" data-order-item-id="${escapeHtml(line.orderItemId)}" data-quantity="${line.quantity}">${escapeHtml(line.title)} · ${escapeHtml(line.supplierSku)} · qty ${line.quantity}</option>`).join("")}</select></div><div class="field"><label for="shipment-create-quantity">Quantity</label><input id="shipment-create-quantity" name="quantity" type="number" min="1" max="100" value="1" required></div><div class="field wide"><label for="shipment-create-reason">Planning reason</label><input id="shipment-create-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create planned shipment</button></div></form>`);
    }
  } catch (error) { setNotice(error.message); }
};

const openShipment = (item) => {
  const allowed = { planned:["booked","canceled"], booked:["in_transit","exception","canceled"], in_transit:["delivered","exception"], exception:["booked","in_transit","canceled"] }[item.status] || [];
  openDialog({ kicker: "Logistics", title: `Shipment ${item.id.slice(0,8)}`, html: `<div class="detail-grid"><div class="detail-item"><span>Order</span><strong>#${escapeHtml(item.orderNumber)}</strong></div><div class="detail-item"><span>Direction</span><strong>${escapeHtml(label(item.direction))}</strong></div><div class="detail-item"><span>Status</span><strong>${escapeHtml(label(item.status))}</strong><small>Version ${item.version}</small></div><div class="detail-item"><span>Tracking</span><strong>${escapeHtml(item.trackingNumber || item.bolOrProNumber || "—")}</strong></div></div>${allowed.length ? `<form id="shipment-update-record-form" data-shipment-id="${escapeHtml(item.id)}" data-shipment-version="${item.version}"><div class="form-grid"><div class="field"><label for="shipment-next-state">Next status</label><select id="shipment-next-state" name="status">${allowed.map((value) => `<option value="${value}">${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="shipment-carrier-update">Carrier</label><input id="shipment-carrier-update" name="carrier" maxlength="120" value="${escapeHtml(item.carrier || "")}"></div><div class="field"><label for="shipment-service-update">Service level</label><input id="shipment-service-update" name="serviceLevel" maxlength="120" value="${escapeHtml(item.serviceLevel || "")}"></div><div class="field"><label for="shipment-tracking-update">Tracking</label><input id="shipment-tracking-update" name="trackingNumber" maxlength="200" value="${escapeHtml(item.trackingNumber || "")}"></div><div class="field"><label for="shipment-pro-update">BOL / PRO</label><input id="shipment-pro-update" name="bolOrProNumber" maxlength="200" value="${escapeHtml(item.bolOrProNumber || "")}"></div><div class="field"><label for="shipment-shipped-update">Shipped</label><input id="shipment-shipped-update" name="shippedAt" type="datetime-local" value="${escapeHtml(inputDateTime(item.shippedAt))}"></div><div class="field"><label for="shipment-delivered-update">Delivered</label><input id="shipment-delivered-update" name="deliveredAt" type="datetime-local" value="${escapeHtml(inputDateTime(item.deliveredAt))}"></div><div class="field wide"><label for="shipment-exception-update">Exception reason</label><input id="shipment-exception-update" name="exceptionReason" maxlength="1000" value="${escapeHtml(item.exceptionReason || "")}"></div><div class="field wide"><label for="shipment-reason-update">Transition evidence</label><input id="shipment-reason-update" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Record shipment update</button></div></form>` : '<p class="access-help">This shipment has reached a terminal state.</p>'}` });
};

const openWarranty = (item) => {
  const allowed = { intake:["evidence_needed","submitted","closed"], evidence_needed:["submitted","closed"], submitted:["authorized","denied","evidence_needed"], authorized:["repairing","replacement_shipping","reimbursing","resolved"], denied:["closed"], repairing:["resolved"], replacement_shipping:["resolved"], reimbursing:["resolved"], resolved:["closed"] }[item.state] || [];
  openDialog({ kicker: "Warranty", title: `WC-${item.claimNumber}`, html: `<div class="detail-grid"><div class="detail-item"><span>Order</span><strong>#${escapeHtml(item.orderNumber)}</strong><small>${escapeHtml(item.itemTitle || "Order-level claim")}</small></div><div class="detail-item"><span>Complaint</span><strong>${escapeHtml(item.complaint)}</strong></div><div class="detail-item"><span>Status</span><strong>${escapeHtml(label(item.state))}</strong><small>Version ${item.version}</small></div><div class="detail-item"><span>Supplier reference</span><strong>${escapeHtml(item.supplierClaimReference || "Not submitted")}</strong></div></div>${allowed.length ? `<form id="warranty-update-form" data-warranty-id="${escapeHtml(item.id)}" data-warranty-version="${item.version}"><div class="form-grid"><div class="field"><label for="warranty-next-state">Next status</label><select id="warranty-next-state" name="state">${allowed.map((value) => `<option value="${value}">${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="warranty-supplier-reference">Supplier claim reference</label><input id="warranty-supplier-reference" name="supplierClaimReference" maxlength="160" value="${escapeHtml(item.supplierClaimReference || "")}"></div><div class="field"><label for="warranty-evidence-deadline">Evidence deadline</label><input id="warranty-evidence-deadline" name="evidenceDeadline" type="datetime-local" value="${escapeHtml(inputDateTime(item.evidenceDeadline))}"></div><div class="field"><label for="warranty-replacement-qty">Authorized replacement quantity</label><input id="warranty-replacement-qty" name="authorizedReplacementQuantity" type="number" min="0" max="100" value="${item.authorizedReplacementQuantity || 0}"></div>${can("finance") ? `<div class="field"><label for="warranty-parts-approved">Approved parts</label><input id="warranty-parts-approved" name="approvedParts" type="number" min="0" step="0.01"></div><div class="field"><label for="warranty-labor-approved">Approved labor</label><input id="warranty-labor-approved" name="approvedLabor" type="number" min="0" step="0.01"></div><div class="field"><label for="warranty-freight-approved">Approved freight</label><input id="warranty-freight-approved" name="approvedFreight" type="number" min="0" step="0.01"></div>` : ""}<div class="field wide"><label for="warranty-decision-reason">Decision / resolution reason</label><input id="warranty-decision-reason" name="decisionReason" maxlength="2000"></div><div class="field wide"><label for="warranty-change-reason">Transition evidence</label><input id="warranty-change-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Record claim update</button></div></form>` : '<p class="access-help">This claim has reached a terminal state.</p>'}` });
};

const openPromotionForm = () => openDialog({
  kicker: "Promotion control",
  title: "Create promotion",
  html: `<form id="promotion-form"><div class="form-grid"><div class="field"><label for="promotion-code">Code</label><input id="promotion-code" name="code" maxlength="32" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" required></div><div class="field"><label for="promotion-kind">Discount type</label><select id="promotion-kind" name="kind"><option value="amount">Fixed amount</option><option value="percent">Percentage</option></select></div><div class="field"><label for="promotion-value">Discount value</label><input id="promotion-value" name="value" type="number" min="0.01" step="0.01" required></div><div class="field"><label for="promotion-margin">Minimum margin after discount</label><input id="promotion-margin" name="minimumMargin" type="number" min="0" step="0.01" value="350.00" required></div><div class="field"><label for="promotion-start">Starts</label><input id="promotion-start" name="startsAt" type="datetime-local" required></div><div class="field"><label for="promotion-end">Ends (optional)</label><input id="promotion-end" name="endsAt" type="datetime-local"></div><div class="field"><label for="promotion-total-limit">Total use limit</label><input id="promotion-total-limit" name="maxRedemptions" type="number" min="1" step="1"></div><div class="field"><label for="promotion-customer-limit">Per-customer limit</label><input id="promotion-customer-limit" name="maxRedemptionsPerCustomer" type="number" min="1" max="100" step="1" value="1" required></div><div class="field wide"><label for="promotion-reason">Business reason</label><input id="promotion-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create for approval</button></div></form>`,
});

const assigneeOptions = (selected = null) => `<option value="">Unassigned</option>${(state.workAssignees || []).map((staff) => `<option value="${escapeHtml(staff.id)}" ${selected === staff.id ? "selected" : ""}>${escapeHtml(staff.displayName)}</option>`).join("")}`;

const openLeadForm = () => openDialog({
  kicker: "Sales pipeline",
  title: "Add lead",
  html: `<form id="lead-create-form"><div class="form-grid"><div class="field"><label for="lead-name">Contact name</label><input id="lead-name" name="contactName" maxlength="160" autocomplete="name" required></div><div class="field"><label for="lead-organization">Organization (optional)</label><input id="lead-organization" name="organizationName" maxlength="160" autocomplete="organization"></div><div class="field"><label for="lead-email">Email</label><input id="lead-email" name="contactEmail" type="email" maxlength="320" autocomplete="email"></div><div class="field"><label for="lead-phone">Phone</label><input id="lead-phone" name="contactPhone" type="tel" maxlength="40" autocomplete="tel"></div><div class="field"><label for="lead-product">Product interest</label><select id="lead-product" name="productInterest"><option value="">Not confirmed</option>${["transmission", "engine", "transfer_case", "differential", "accessory", "service"].map((value) => `<option value="${value}">${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="lead-source">Source</label><input id="lead-source" name="source" maxlength="120" value="manual" required></div><div class="field"><label for="lead-priority">Priority</label><select id="lead-priority" name="priority">${["normal", "high", "urgent", "low"].map((value) => `<option value="${value}">${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="lead-owner">Owner</label><select id="lead-owner" name="assignedTo">${assigneeOptions()}</select></div><div class="field"><label for="lead-year">Vehicle year</label><input id="lead-year" name="year" type="number" min="1900" max="2100"></div><div class="field"><label for="lead-make">Vehicle make</label><input id="lead-make" name="make" maxlength="80"></div><div class="field"><label for="lead-model">Vehicle model</label><input id="lead-model" name="model" maxlength="120"></div><div class="field"><label for="lead-follow-up">Next follow-up</label><input id="lead-follow-up" name="nextFollowUpAt" type="datetime-local"></div><div class="field wide"><label for="lead-reason">Intake record</label><input id="lead-reason" name="reason" maxlength="500" required placeholder="How the inquiry arrived and what the customer needs"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create lead</button></div></form>`,
});

const openLeadUpdate = (item) => openDialog({
  kicker: "Sales pipeline",
  title: item.reference,
  html: `<div class="detail-grid"><div class="detail-item"><span>Contact</span><strong>${escapeHtml(item.contact.name)}</strong><small>${escapeHtml(item.contact.email || item.contact.phone || "—")}</small></div><div class="detail-item"><span>Interest</span><strong>${escapeHtml(label(item.productInterest))}</strong><small>${escapeHtml(item.source)}</small></div></div><form id="lead-update-form" data-lead-id="${escapeHtml(item.id)}" data-lead-version="${escapeHtml(item.version)}"><div class="form-grid"><div class="field"><label for="lead-update-state">Status</label><select id="lead-update-state" name="state">${["new", "assigned", "contacted", "qualified", "quoted", "won", "lost", "closed"].map((value) => `<option value="${value}" ${item.state === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="lead-update-priority">Priority</label><select id="lead-update-priority" name="priority">${["low", "normal", "high", "urgent"].map((value) => `<option value="${value}" ${item.priority === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="lead-update-owner">Owner</label><select id="lead-update-owner" name="assignedTo">${assigneeOptions(item.assignedTo)}</select></div><div class="field"><label for="lead-update-follow-up">Next follow-up</label><input id="lead-update-follow-up" name="nextFollowUpAt" type="datetime-local" value="${escapeHtml(inputDateTime(item.nextFollowUpAt))}"></div><div class="field"><label for="lead-lost-reason">Lost reason (required when lost)</label><input id="lead-lost-reason" name="lostReason" maxlength="500" value="${escapeHtml(item.lostReason || "")}"></div><div class="field"><label for="lead-won-order">Order ID (required when won)</label><input id="lead-won-order" name="wonOrderId" maxlength="36" value="${escapeHtml(item.wonOrderId || "")}"></div><div class="field wide"><label for="lead-update-reason">Change reason</label><input id="lead-update-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Save lead</button></div></form>`,
});

const openTaskForm = () => openDialog({
  kicker: "Work management",
  title: "Create task",
  html: `<form id="task-create-form"><div class="form-grid"><div class="field"><label for="task-type">Task type</label><input id="task-type" name="taskType" maxlength="80" placeholder="lead_follow_up" required></div><div class="field wide"><label for="task-title">Title</label><input id="task-title" name="title" maxlength="240" required></div><div class="field"><label for="task-entity-type">Related record type</label><select id="task-entity-type" name="entityType">${["lead", "quote", "order", "customer", "purchase_order", "shipment", "core_return", "warranty_claim", "dispute", "system"].map((value) => `<option value="${value}">${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="task-entity-id">Related record ID (optional)</label><input id="task-entity-id" name="entityId" maxlength="36"></div><div class="field"><label for="task-capability">Required capability</label><select id="task-capability" name="requiredCapability">${[...(can("operations") ? ["operations"] : []), ...(can("finance") ? ["finance"] : []), ...(can("administrator") ? ["administrator"] : [])].map((value) => `<option value="${value}">${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="task-priority">Priority</label><select id="task-priority" name="priority">${["normal", "high", "urgent", "low"].map((value) => `<option value="${value}">${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="task-owner">Owner</label><select id="task-owner" name="assignedTo">${assigneeOptions()}</select></div><div class="field"><label for="task-due">Due</label><input id="task-due" name="dueAt" type="datetime-local"></div><div class="field wide"><label for="task-reason">Creation reason</label><input id="task-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Create task</button></div></form>`,
});

const openTaskUpdate = (item) => openDialog({
  kicker: "Work management",
  title: item.title,
  html: `<div class="record-summary"><strong>${escapeHtml(label(item.taskType))} · ${escapeHtml(label(item.entityType))}</strong><span>${escapeHtml(item.entityId || "General queue")}</span></div><form id="task-update-form" data-task-id="${escapeHtml(item.id)}" data-task-version="${escapeHtml(item.version)}"><div class="form-grid"><div class="field"><label for="task-update-state">Status</label><select id="task-update-state" name="state">${["open", "in_progress", "blocked", "completed", "canceled"].map((value) => `<option value="${value}" ${item.state === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="task-update-priority">Priority</label><select id="task-update-priority" name="priority">${["low", "normal", "high", "urgent"].map((value) => `<option value="${value}" ${item.priority === value ? "selected" : ""}>${escapeHtml(label(value))}</option>`).join("")}</select></div><div class="field"><label for="task-update-owner">Owner</label><select id="task-update-owner" name="assignedTo">${assigneeOptions(item.assignedTo)}</select></div><div class="field"><label for="task-update-due">Due</label><input id="task-update-due" name="dueAt" type="datetime-local" value="${escapeHtml(inputDateTime(item.dueAt))}"></div><div class="field wide"><label for="task-blocked-reason">Blocked reason (required when blocked)</label><input id="task-blocked-reason" name="blockedReason" maxlength="500" value="${escapeHtml(item.blockedReason || "")}"></div><div class="field wide"><label for="task-completion">Completion evidence (required when completed)</label><textarea id="task-completion" name="completionEvidence" maxlength="1000">${escapeHtml(item.completionEvidence || "")}</textarea></div><div class="field wide"><label for="task-update-reason">Change reason</label><input id="task-update-reason" name="reason" maxlength="500" required></div></div><div class="form-actions"><button class="button button-primary" type="submit">Save task</button></div></form>`,
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
    } else if (form.id === "leads-filter") {
      state.leadsPage = 1;
      const data = new FormData(form);
      await renderLeads(data.get("search"), data.get("status"));
    } else if (form.id === "tasks-filter") {
      state.tasksPage = 1;
      await renderTasks(new FormData(form).get("status"));
    } else if (form.id === "customers-filter") {
      await renderCustomers(new FormData(form).get("search"));
    } else if (form.id === "catalog-filter") {
      const data = new FormData(form);
      await renderCatalog(data.get("search"), data.get("status"));
    } else if (form.id === "purchasing-filter") {
      await renderPurchasing(new FormData(form).get("status"));
    } else if (form.id === "logistics-filter") {
      await renderLogistics(new FormData(form).get("status"));
    } else if (form.id === "warranty-filter") {
      await renderWarranty(new FormData(form).get("status"));
    } else if (form.id === "supplier-create-form") {
      await submitWithButton(form, async (data) => {
        await api("/suppliers", mutationOptions({ code: data.get("code"), displayName: data.get("displayName"), orderingMethod: data.get("orderingMethod") || null, warrantyTermsReference: data.get("warrantyTermsReference") || null, coreTermsReference: data.get("coreTermsReference") || null, active: true, reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Supplier record created for private operations use."); await renderCatalog();
      });
    } else if (form.id === "catalog-create-form") {
      await submitWithButton(form, async (data) => {
        await api("/catalog-products", mutationOptions({ integritySku: data.get("integritySku"), supplierId: data.get("supplierId"), supplierSku: data.get("supplierSku"), kind: data.get("kind"), title: data.get("title"), manufacturerBrand: data.get("manufacturerBrand") || null, manufacturerPartNumber: data.get("manufacturerPartNumber") || null, condition: "remanufactured", applicationData: { summary: data.get("applicationSummary") }, packageContents: [], warrantyData: {}, shippingData: {}, imageProvenance: [], status: "draft", reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Draft catalog product created. It remains inactive until price and application verification are complete."); await renderCatalog();
      });
    } else if (form.id === "catalog-price-form") {
      await submitWithButton(form, async (data) => {
        await api(`/catalog-products/${form.dataset.catalogId}/prices`, mutationOptions({ supplierUnitCostCents: Math.round(Number(data.get("supplierUnitCost"))*100), supplierCoreDepositCents: Math.round(Number(data.get("supplierCoreDeposit") || 0)*100), suggestedRetailCents: data.get("suggestedRetail") ? Math.round(Number(data.get("suggestedRetail"))*100) : null, availabilityCode: data.get("availabilityCode"), availabilityText: data.get("availabilityText"), sourceReference: data.get("sourceReference"), verifiedAt: new Date(data.get("verifiedAt")).toISOString(), validThrough: data.get("validThrough") ? new Date(data.get("validThrough")).toISOString() : null, reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Immutable catalog price version recorded."); await renderCatalog();
      });
    } else if (form.id === "catalog-status-form") {
      await submitWithButton(form, async (data) => {
        const item = state.catalogItems.find((candidate) => candidate.id === form.dataset.catalogId);
        await api(`/catalog-products/${form.dataset.catalogId}`, mutationOptions({ version: Number(form.dataset.catalogVersion), supplierSku: item.supplierSku, kind: item.kind, title: item.title, manufacturerBrand: item.manufacturerBrand, manufacturerPartNumber: item.manufacturerPartNumber, gtin: item.gtin, condition: item.condition, applicationData: item.applicationData, packageContents: item.packageContents, warrantyData: item.warrantyData, shippingData: item.shippingData, imageProvenance: item.imageProvenance, status: data.get("status"), lastVerifiedAt: data.get("lastVerifiedAt") ? new Date(data.get("lastVerifiedAt")).toISOString() : null, reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Catalog status updated with a permanent audit record."); await renderCatalog();
      });
    } else if (form.id === "purchase-create-form") {
      await submitWithButton(form, async (data) => {
        const cents = (name) => Math.round(Number(data.get(name) || 0)*100);
        await api("/purchase-orders", mutationOptions({ orderId: form.dataset.orderId, supplierId: data.get("supplierId"), purchaseOrderNumber: data.get("purchaseOrderNumber"), freightCents: cents("freight"), taxCents: cents("tax"), lines: [{ orderItemId: form.dataset.orderItemId, supplierSku: data.get("supplierSku"), description: data.get("description"), quantity: 1, unitCostCents: cents("unitCost"), coreChargeCents: cents("coreCharge") }], reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Purchase-order draft created. A different finance-capable staff member must approve it."); location.hash = "#purchasing";
      });
    } else if (form.id === "purchase-update-form") {
      await submitWithButton(form, async (data) => {
        const eta = data.get("estimatedShipAt");
        await api(`/purchase-orders/${form.dataset.purchaseId}`, mutationOptions({ version: Number(form.dataset.purchaseVersion), state: data.get("state"), supplierOrderReference: data.get("supplierOrderReference") || null, estimatedShipAt: eta ? new Date(eta).toISOString() : null, cancellationReason: data.get("cancellationReason") || null, reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Purchase-order transition recorded."); await renderPurchasing();
      });
    } else if (form.id === "shipment-create-form") {
      await submitWithButton(form, async (data) => {
        const selected = $("#shipment-po-line", form).selectedOptions[0];
        await api("/shipments", mutationOptions({ orderId: form.dataset.orderId, purchaseOrderId: form.dataset.purchaseId, direction: "outbound", status: "planned", items: [{ orderItemId: selected.dataset.orderItemId, purchaseOrderLineId: data.get("line"), quantity: Number(data.get("quantity")) }], reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Planned shipment created with exact purchase-order provenance."); await renderLogistics();
      });
    } else if (form.id === "shipment-update-record-form") {
      await submitWithButton(form, async (data) => {
        await api(`/shipments/${form.dataset.shipmentId}`, mutationOptions({ version: Number(form.dataset.shipmentVersion), status: data.get("status"), carrier: data.get("carrier") || null, serviceLevel: data.get("serviceLevel") || null, trackingNumber: data.get("trackingNumber") || null, bolOrProNumber: data.get("bolOrProNumber") || null, shippedAt: data.get("shippedAt") ? new Date(data.get("shippedAt")).toISOString() : null, deliveredAt: data.get("deliveredAt") ? new Date(data.get("deliveredAt")).toISOString() : null, exceptionReason: data.get("exceptionReason") || null, reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Shipment transition recorded with evidence."); await renderLogistics();
      });
    } else if (form.id === "warranty-update-form") {
      await submitWithButton(form, async (data) => {
        const cents = (name) => data.get(name) ? Math.round(Number(data.get(name))*100) : null;
        await api(`/warranty-claims/${form.dataset.warrantyId}`, mutationOptions({ version: Number(form.dataset.warrantyVersion), state: data.get("state"), supplierClaimReference: data.get("supplierClaimReference") || null, evidenceDeadline: data.get("evidenceDeadline") ? new Date(data.get("evidenceDeadline")).toISOString() : null, decisionReason: data.get("decisionReason") || null, approvedPartsCents: cents("approvedParts"), approvedLaborCents: cents("approvedLabor"), approvedFreightCents: cents("approvedFreight"), authorizedReplacementQuantity: Number(data.get("authorizedReplacementQuantity") || 0), reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Warranty workflow transition recorded."); await renderWarranty();
      });
    } else if (form.id === "warranty-create-form") {
      await submitWithButton(form, async (data) => {
        const selected = $("#warranty-item-new", form).selectedOptions[0];
        await api("/warranty-claims", mutationOptions({ orderId: form.dataset.orderId, orderItemId: data.get("item"), supplierId: selected.dataset.supplierId, complaint: data.get("complaint"), installedAt: data.get("installedAt") || null, mileageAtInstall: data.get("mileageAtInstall") || null, mileageAtClaim: data.get("mileageAtClaim") || null, installerName: data.get("installerName") || null, state: "intake", reason: data.get("reason") }));
        $("#record-dialog").close(); setNotice("Warranty intake opened and linked to the purchased item."); location.hash = "#warranty";
      });
    } else if (form.id === "lead-create-form") {
      await submitWithButton(form, async (data) => {
        const followUp = data.get("nextFollowUpAt");
        const vehicleSummary = Object.fromEntries(["year", "make", "model"].map((key) => [key, String(data.get(key) || "").trim()]).filter(([, value]) => value));
        await api("/leads", mutationOptions({ contactName: data.get("contactName"), contactEmail: data.get("contactEmail") || null, contactPhone: data.get("contactPhone") || null, organizationName: data.get("organizationName") || null, productInterest: data.get("productInterest") || null, source: data.get("source"), priority: data.get("priority"), assignedTo: data.get("assignedTo") || null, nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null, vehicleSummary, reason: data.get("reason") }));
        $("#record-dialog").close();
        setNotice("Lead created with a permanent intake record.");
        await renderLeads();
      });
    } else if (form.id === "lead-update-form") {
      await submitWithButton(form, async (data) => {
        const followUp = data.get("nextFollowUpAt");
        await api(`/leads/${form.dataset.leadId}`, mutationOptions({ version: Number(form.dataset.leadVersion), state: data.get("state"), priority: data.get("priority"), assignedTo: data.get("assignedTo") || null, nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null, lostReason: data.get("lostReason") || null, wonOrderId: data.get("wonOrderId") || null, reason: data.get("reason") }));
        $("#record-dialog").close();
        setNotice("Lead status and ownership updated.");
        await renderLeads();
      });
    } else if (form.id === "task-create-form") {
      await submitWithButton(form, async (data) => {
        const dueAt = data.get("dueAt");
        await api("/tasks", mutationOptions({ taskType: data.get("taskType"), title: data.get("title"), entityType: data.get("entityType"), entityId: data.get("entityId") || null, priority: data.get("priority"), assignedTo: data.get("assignedTo") || null, requiredCapability: data.get("requiredCapability"), dueAt: dueAt ? new Date(dueAt).toISOString() : null, reason: data.get("reason") }));
        $("#record-dialog").close();
        setNotice("Task created and added to the team queue.");
        await renderTasks();
      });
    } else if (form.id === "task-update-form") {
      await submitWithButton(form, async (data) => {
        const dueAt = data.get("dueAt");
        await api(`/tasks/${form.dataset.taskId}`, mutationOptions({ version: Number(form.dataset.taskVersion), state: data.get("state"), priority: data.get("priority"), assignedTo: data.get("assignedTo") || null, dueAt: dueAt ? new Date(dueAt).toISOString() : null, blockedReason: data.get("blockedReason") || null, completionEvidence: data.get("completionEvidence") || null, reason: data.get("reason") }));
        $("#record-dialog").close();
        setNotice("Task updated and recorded in the audit trail.");
        await renderTasks();
      });
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
  const leadButton = event.target.closest("[data-lead-id]");
  const taskButton = event.target.closest("[data-task-id]");
  const freightButton = event.target.closest("[data-freight-id]");
  const customerButton = event.target.closest("[data-customer-id]");
  const catalogButton = event.target.closest("[data-catalog-id]");
  const purchaseButton = event.target.closest("[data-purchase-id]");
  const shipmentRecordButton = event.target.closest("[data-shipment-id]");
  const warrantyButton = event.target.closest("[data-warranty-id]");
  const pageButton = event.target.closest("[data-orders-page], [data-freight-page], [data-leads-page], [data-tasks-page]");
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
  } else if (leadButton) {
    const item = state.leadItems?.find((candidate) => candidate.id === leadButton.dataset.leadId);
    if (item) openLeadUpdate(item);
  } else if (taskButton) {
    const item = state.taskItems?.find((candidate) => candidate.id === taskButton.dataset.taskId);
    if (item) openTaskUpdate(item);
  } else if (customerButton) await openCustomer(customerButton.dataset.customerId);
  else if (catalogButton) {
    const item = state.catalogItems?.find((candidate) => candidate.id === catalogButton.dataset.catalogId);
    if (item) openCatalogProduct(item);
  } else if (purchaseButton) {
    const item = state.purchaseItems?.find((candidate) => candidate.id === purchaseButton.dataset.purchaseId);
    if (item) await openPurchaseOrderDetail(item);
  } else if (shipmentRecordButton) {
    const item = state.shipmentItems?.find((candidate) => candidate.id === shipmentRecordButton.dataset.shipmentId);
    if (item) openShipment(item);
  } else if (warrantyButton) {
    const item = state.warrantyItems?.find((candidate) => candidate.id === warrantyButton.dataset.warrantyId);
    if (item) openWarranty(item);
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
    if (pageButton.dataset.leadsPage) { state.leadsPage = Number(pageButton.dataset.leadsPage); await renderLeads(state.leadSearch, state.leadStatus); }
    if (pageButton.dataset.tasksPage) { state.tasksPage = Number(pageButton.dataset.tasksPage); await renderTasks(state.taskStatus); }
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
    $$("[data-roles]").forEach((node) => { node.hidden = !node.dataset.roles.split(",").some((role) => can(role.trim())); });
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
document.addEventListener("click", (event) => { if (event.target.closest("#new-lead")) openLeadForm(); });
document.addEventListener("click", (event) => { if (event.target.closest("#new-task")) openTaskForm(); });
document.addEventListener("click", (event) => { if (event.target.closest("#new-supplier")) openSupplierForm(); });
document.addEventListener("click", (event) => { if (event.target.closest("#new-catalog-product")) openCatalogForm(); });

initialize();
