function initRemanOrderResult() {
  const root = document.querySelector("[data-order-result]");
  if (!root) return;

  const get = (selector) => root.querySelector(selector);
  const icon = get("[data-order-icon]");
  const eyebrow = get("[data-order-eyebrow]");
  const title = get("[data-order-title]");
  const message = get("[data-order-message]");
  const summary = get("[data-order-summary]");
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const sessionId = new URLSearchParams(window.location.search).get("session_id") || "";

  const showProblem = (copy) => {
    icon.textContent = "!";
    eyebrow.textContent = "Order Status";
    title.textContent = "Check your email.";
    message.textContent = copy;
  };

  if (!sessionId) {
    showProblem("The Stripe order reference is missing. Check your payment email or call Integrity at (417) 815-3315 for help.");
    return;
  }

  fetch(`/api/reman-order-status?session_id=${encodeURIComponent(sessionId)}`, {
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We could not display the order status.");
      return data;
    })
    .then((data) => {
      const paid = data.paymentStatus === "paid";
      icon.textContent = paid ? "✓" : "…";
      eyebrow.textContent = paid ? "Payment Received" : "Payment Processing";
      title.textContent = paid ? "Your order is in." : "Payment is processing.";
      message.textContent = paid
        ? "Your payment was received by Integrity. We are completing the final VIN and fitment review before placing the transmission order."
        : "Stripe has not marked this payment as complete yet. We will begin final fitment review after payment is confirmed.";
      get("[data-order-package]").textContent = [data.application, data.upgrade, data.warranty].filter(Boolean).join(" • ");
      get("[data-order-total]").textContent = currency.format((data.amountTotal || 0) / 100);
      get("[data-order-tax]").textContent = currency.format((data.amountTax || 0) / 100);
      get("[data-order-email]").textContent = data.email || "Sent by Stripe";
      get("[data-order-reference]").textContent = String(data.orderReference || "").slice(-18);
      summary.hidden = false;
      const invoice = get("[data-order-invoice]");
      if (data.invoiceUrl && /^https:\/\/(?:invoice|pay)\.stripe\.com\//i.test(data.invoiceUrl)) {
        invoice.href = data.invoiceUrl;
        invoice.hidden = false;
      }
    })
    .catch((error) => showProblem(`${error.message} No additional payment is needed on this page. Check your Stripe email or call Integrity at (417) 815-3315.`));
}

document.addEventListener("DOMContentLoaded", initRemanOrderResult);
