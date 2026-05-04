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

let groups = [];

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

  const deposit = subtotal * 0.5;
  const balance = subtotal - deposit;

  TOTAL_QTY.textContent = totalQty;
  SUBTOTAL.textContent = `$${subtotal.toFixed(2)}`;
  DEPOSIT.textContent = `$${deposit.toFixed(2)}`;
  BALANCE.textContent = `$${balance.toFixed(2)}`;

  REVIEW_MESSAGE.hidden = !requiresReview;
}

ADD_GROUP_BTN.addEventListener("click", createGroup);

// INITIAL STATE
createGroup();

// ACTION BUTTONS (stub for now)
document.getElementById("reserve-order-button").addEventListener("click", () => {
  alert("Next step: connect to Square checkout.");
});

document.getElementById("request-review-button").addEventListener("click", () => {
  alert("Next step: submit form for manual review.");
});