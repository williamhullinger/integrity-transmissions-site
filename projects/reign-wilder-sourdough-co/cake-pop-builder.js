const GROUP_TEMPLATE = document.getElementById("cake-pop-group-template");
const GROUPS_CONTAINER = document.getElementById("cake-pop-groups");

const ADD_GROUP_BTN = document.getElementById("add-group-button");

const SUMMARY_GROUPS = document.getElementById("summary-groups");
const SUMMARY_EMPTY = document.getElementById("summary-empty-state");

const TOTAL_QTY = document.getElementById("summary-total-quantity");
const SUBTOTAL = document.getElementById("summary-subtotal");
const DEPOSIT = document.getElementById("summary-deposit");
const BALANCE = document.getElementById("summary-balance");

const REVIEW_MESSAGE = document.getElementById("quote-review-message");

const ADD_TO_CART_BUTTON = document.getElementById("add-cake-pops-to-cart-button");
const SUMMARY_NOTE = document.getElementById("cake-builder-summary-note");

const DEPOSIT_ROW = document.querySelector(".cake-builder-summary__deposit-row");
const BALANCE_ROW = document.querySelector(".cake-builder-summary__balance-row");

const PAY_FULL_BUTTON = document.getElementById("pay-full-button");

const EDIT_ID = new URLSearchParams(window.location.search).get("edit");

let groups = [];
let editingCartItemId = null;

const BASE_PRICE = 3;

function createGroup() {
  const clone = GROUP_TEMPLATE.content.cloneNode(true);
  const groupEl = clone.querySelector(".cake-builder-group");

  const groupData = {
    id: Date.now() + Math.random(),
    quantity: 12,
    flavor: "vanilla",
    coating: "milk",
    theme: "",
    finish1: "plain",
    finish2: "",
    complexity: "basic",
    packaging: "no",
    note: ""
  };

  groupEl.dataset.id = groupData.id;

  attachEvents(groupEl, groupData);

  GROUPS_CONTAINER.appendChild(groupEl);
  groups.push(groupData);

  updateGroupNumbers();
  updateSummary();
}

function attachEvents(groupEl, groupData) {
  const inputs = groupEl.querySelectorAll("input, select, textarea");

  inputs.forEach(input => {
    input.addEventListener("input", () => {
      groupData.quantity = parseInt(groupEl.querySelector(".group-quantity").value) || 0;
      groupData.flavor = groupEl.querySelector(".group-flavor").value;
      groupData.coating = groupEl.querySelector(".group-coating").value;
      groupData.theme = groupEl.querySelector(".group-theme").value;
      groupData.finish1 = groupEl.querySelector(".group-finish-1").value;
      groupData.finish2 = groupEl.querySelector(".group-finish-2").value;
      groupData.complexity = groupEl.querySelector(".group-complexity").value;
      groupData.packaging = groupEl.querySelector(".group-packaging").value;
      groupData.note = groupEl.querySelector(".group-note").value;

      updateGroupTotal(groupEl, groupData);
      updateSummary();
    });
  });

  groupEl.querySelector(".cake-builder-group__remove").addEventListener("click", () => {
    groups = groups.filter(g => g.id !== groupData.id);
    groupEl.remove();
    updateGroupNumbers();
    updateSummary();
  });

  updateGroupTotal(groupEl, groupData);
}

function updateGroupNumbers() {
  const all = document.querySelectorAll(".cake-builder-group");
  all.forEach((el, i) => {
    el.querySelector(".group-number").textContent = i + 1;
  });
}

function calculateGroupTotal(group) {
  let price = BASE_PRICE;

  if (group.finish2) price += 0.5;
  if (group.coating === "premium") price += 0.5;
  if (group.packaging === "yes") price += 0.25;

  if (group.complexity === "enhanced") price += 0.5;
  if (group.complexity === "premium") price += 1;
  if (group.complexity === "luxury") price += 2;

  return group.quantity * price;
}

function updateGroupTotal(groupEl, groupData) {
  const total = calculateGroupTotal(groupData);
  groupEl.querySelector(".group-total").textContent = `$${total.toFixed(2)}`;
}

function updateSummary() {
  if (groups.length === 0) {
    SUMMARY_EMPTY.style.display = "block";
    SUMMARY_GROUPS.innerHTML = "";
    TOTAL_QTY.textContent = "0";
    SUBTOTAL.textContent = "$0.00";
    DEPOSIT.textContent = "$0.00";
    BALANCE.textContent = "$0.00";
    REVIEW_MESSAGE.hidden = true;
    return;
  }

  SUMMARY_EMPTY.style.display = "none";

  let totalQty = 0;
  let subtotal = 0;
  let requiresReview = false;

  SUMMARY_GROUPS.innerHTML = "";

  groups.forEach((g, index) => {
    const total = calculateGroupTotal(g);

    totalQty += g.quantity;
    subtotal += total;

    if (g.complexity === "luxury" || g.quantity > 100) {
      requiresReview = true;      
    }



    const div = document.createElement("div");
    div.className = "cake-builder-summary__group";

    div.innerHTML = `
      <h4>Group ${index + 1} — ${g.quantity} pops</h4>
      <p>${g.flavor} • ${g.coating}</p>
      ${g.theme ? `<p>Theme: ${g.theme}</p>` : ""}
      ${g.note ? `<p><strong>Note:</strong> ${g.note}</p>` : ""}
      <p><strong>$${total.toFixed(2)}</strong></p>
    `;

    SUMMARY_GROUPS.appendChild(div);
  });

  const isEverydayOrder = totalQty <= 48 && !requiresReview;
const isDepositOrder = totalQty > 48 && !requiresReview;

if (ADD_TO_CART_BUTTON) {
  ADD_TO_CART_BUTTON.hidden = !isEverydayOrder;
}

if (document.getElementById("reserve-order-button")) {
  document.getElementById("reserve-order-button").hidden = !isDepositOrder;
}

if (PAY_FULL_BUTTON) {
  PAY_FULL_BUTTON.hidden = !isDepositOrder;
}

if (document.getElementById("request-review-button")) {
  document.getElementById("request-review-button").hidden = !requiresReview;
}

if (SUMMARY_NOTE) {
  if (isEverydayOrder) {
    SUMMARY_NOTE.textContent = "This looks like a smaller everyday cake pop order. Add it to your cart and checkout normally.";
  } else if (isDepositOrder) {
    SUMMARY_NOTE.textContent = "This looks like a larger event order. A 50% deposit reserves your date, with the remaining balance due before pickup or delivery.";
  } else {
    SUMMARY_NOTE.textContent = "This order may need review because of quantity, timeline, or design complexity. Submit it for review and we will follow up to confirm details.";
  }
  if (DEPOSIT_ROW) {
  DEPOSIT_ROW.hidden = !isDepositOrder;
}

if (BALANCE_ROW) {
  BALANCE_ROW.hidden = !isDepositOrder;
}
}

  const deposit = subtotal * 0.5;
  const balance = subtotal - deposit;

  TOTAL_QTY.textContent = totalQty;
  SUBTOTAL.textContent = `$${subtotal.toFixed(2)}`;
  DEPOSIT.textContent = `$${deposit.toFixed(2)}`;
  BALANCE.textContent = `$${balance.toFixed(2)}`;

  REVIEW_MESSAGE.hidden = !requiresReview;
}

ADD_GROUP_BTN.addEventListener("click", createGroup);

function populateGroupFields(groupEl, groupData) {
  groupEl.querySelector(".group-quantity").value = groupData.quantity;
  groupEl.querySelector(".group-flavor").value = groupData.flavor;
  groupEl.querySelector(".group-coating").value = groupData.coating;
  groupEl.querySelector(".group-theme").value = groupData.theme;
  groupEl.querySelector(".group-finish-1").value = groupData.finish1;
  groupEl.querySelector(".group-finish-2").value = groupData.finish2;
  groupEl.querySelector(".group-complexity").value = groupData.complexity;
  groupEl.querySelector(".group-packaging").value = groupData.packaging;
  groupEl.querySelector(".group-note").value = groupData.note;

  updateGroupTotal(groupEl, groupData);
}

function loadEditOrder() {
  const editData = localStorage.getItem("editCakeOrder");
  if (!editData) return false;

  const parsed = JSON.parse(editData);
  editingCartItemId = parsed.id;

  if (!parsed.builderData) return false;

  groups = [];

  GROUPS_CONTAINER.innerHTML = "";

  parsed.builderData.forEach(groupData => {
    const clone = GROUP_TEMPLATE.content.cloneNode(true);
    const groupEl = clone.querySelector(".cake-builder-group");

    groupEl.dataset.id = groupData.id;

    populateGroupFields(groupEl, groupData);
    attachEvents(groupEl, groupData);

    GROUPS_CONTAINER.appendChild(groupEl);
    groups.push(groupData);
  });

  updateSummary();

  localStorage.removeItem("editCakeOrder");

  return true;
}

// INITIAL STATE
if (!loadEditOrder()) {
  createGroup();
}

// ACTION BUTTONS (stub for now)
document.getElementById("reserve-order-button").addEventListener("click", () => {
  const cart = JSON.parse(localStorage.getItem("reignWilderCart")) || [];

  const subtotal = groups.reduce((total, group) => {
    return total + calculateGroupTotal(group);
  }, 0);

  const deposit = subtotal * 0.5;
  const remainingBalance = subtotal - deposit;

  const totalQty = groups.reduce((total, group) => {
    return total + Number(group.quantity || 0);
  }, 0);

  const orderDetails = groups.map((group, index) => {
    return `Group ${index + 1}: ${group.quantity} pops, Flavor: ${group.flavor}, Coating: ${group.coating}, Theme: ${group.theme || "None"}, Finish: ${group.finish1}${group.finish2 ? " + " + group.finish2 : ""}, Complexity: ${group.complexity}, Wrapped: ${group.packaging}, Note: ${group.note || "None"}`;
  }).join("<br>");

  if (editingCartItemId) {
  const existingIndex = cart.findIndex((item) => item.id === editingCartItemId);

  if (existingIndex !== -1) {
    cart.splice(existingIndex, 1);
  }
}

  cart.push({
    id: `cake-pop-deposit-${Date.now()}`,
    name: `Cake Pop Order (Deposit) - ${totalQty} pops`,
    price: deposit,
    image: "images/cake-pops-assorted.jpg",
    quantity: 1,
    details: `${orderDetails}<br>Full Order Total: $${subtotal.toFixed(2)}<br>Deposit Paid Today: $${deposit.toFixed(2)}<br>Remaining Balance Due: $${remainingBalance.toFixed(2)}`,
    builderData: JSON.parse(JSON.stringify(groups)),
  });

  localStorage.setItem("reignWilderCart", JSON.stringify(cart));

  window.location.href = "cart.html";
});

document.getElementById("request-review-button").addEventListener("click", () => {
  alert("Next step: submit form for manual review.");
});

if (ADD_TO_CART_BUTTON) {
  ADD_TO_CART_BUTTON.addEventListener("click", () => {
    const cart = JSON.parse(localStorage.getItem("reignWilderCart")) || [];

    const subtotal = groups.reduce((total, group) => {
      return total + calculateGroupTotal(group);
    }, 0);

    const totalQty = groups.reduce((total, group) => {
      return total + Number(group.quantity || 0);
    }, 0);

    const orderDetails = groups.map((group, index) => {
      return `Group ${index + 1}: ${group.quantity} pops, Flavor: ${group.flavor}, Coating: ${group.coating}, Theme: ${group.theme || "None"}, Finish: ${group.finish1}${group.finish2 ? " + " + group.finish2 : ""}, Complexity: ${group.complexity}, Wrapped: ${group.packaging}, Note: ${group.note || "None"}`;
    }).join("<br>");

    if (editingCartItemId) {
  const existingIndex = cart.findIndex((item) => item.id === editingCartItemId);

  if (existingIndex !== -1) {
    cart.splice(existingIndex, 1);
  }
}

    cart.push({
      id: `cake-pops-${Date.now()}`,
      name: `Custom Cake Pops - ${totalQty} pops`,
      price: subtotal,
      image: "images/cake-pops-assorted.jpg",
      quantity: 1,
      details: orderDetails,
      builderData: JSON.parse(JSON.stringify(groups))
    });

    localStorage.setItem("reignWilderCart", JSON.stringify(cart));

    window.location.href = "cart.html";
  });
}

if (PAY_FULL_BUTTON) {
  PAY_FULL_BUTTON.addEventListener("click", () => {
    const cart = JSON.parse(localStorage.getItem("reignWilderCart")) || [];

    const subtotal = groups.reduce((total, group) => {
      return total + calculateGroupTotal(group);
    }, 0);

    const totalQty = groups.reduce((total, group) => {
      return total + Number(group.quantity || 0);
    }, 0);

    const orderDetails = groups.map((group, index) => {
      return `Group ${index + 1}: ${group.quantity} pops, Flavor: ${group.flavor}, Coating: ${group.coating}, Theme: ${group.theme || "None"}, Finish: ${group.finish1}${group.finish2 ? " + " + group.finish2 : ""}, Complexity: ${group.complexity}, Wrapped: ${group.packaging}, Note: ${group.note || "None"}`;
    }).join(" | ");

    if (editingCartItemId) {
  const existingIndex = cart.findIndex((item) => item.id === editingCartItemId);

  if (existingIndex !== -1) {
    cart.splice(existingIndex, 1);
  }
}

    cart.push({
      id: `cake-pops-paid-full-${Date.now()}`,
      name: `Cake Pops Paid in Full - ${totalQty} pops`,
      price: subtotal,
      image: "images/cake-pops-assorted.jpg",
      quantity: 1,
      details: `${orderDetails} | Paid in Full: $${subtotal.toFixed(2)}`,
      builderData: JSON.parse(JSON.stringify(groups))
    });

    localStorage.setItem("reignWilderCart", JSON.stringify(cart));

    editingCartItemId = null;
    localStorage.removeItem("editCakeOrder");

    window.location.href = "cart.html";
  });
}