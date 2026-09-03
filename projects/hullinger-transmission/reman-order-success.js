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
  let attempts = 0;

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

  window.history.replaceState({}, "", window.location.pathname);

  const loadStatus = () => fetch(`/api/reman-order-status?session_id=${encodeURIComponent(sessionId)}`, {
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We could not display the order status.");
      return data;
    })
    .then((data) => {
      const paid = data.paymentStatus === "paid" || data.paymentStatus === "no_payment_required";
      const expired = data.checkoutStatus === "expired";
      const incomplete = data.checkoutStatus === "complete" && !paid;
      const processing = !paid && !expired && !incomplete;
      icon.textContent = paid ? "✓" : processing ? "…" : "!";
      eyebrow.textContent = paid ? "Payment Received" : processing ? "Payment Processing" : "Payment Not Completed";
      title.textContent = paid ? "Payment received—fitment review is next." : processing ? "Payment is still processing." : "Your payment was not completed.";
      message.textContent = paid
        ? "Integrity received your payment. We are verifying the VIN, fitment, availability and payment risk before we place the transmission order."
        : processing
          ? "Stripe has not marked this payment as complete. We will begin final review only after payment is confirmed."
          : expired
            ? "This checkout session expired without a completed payment. Return to the reman page to refresh the price and start again."
            : "Stripe did not confirm a completed payment. Check your Stripe email or return to the reman page before trying again.";
      get("[data-order-package]").textContent = [data.application, data.upgrade, data.warranty].filter(Boolean).join(" • ");
      get("[data-order-total-label]").textContent = paid ? "Amount paid" : "Checkout total";
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
      if (processing && attempts < 4) {
        attempts += 1;
        window.setTimeout(loadStatus, 3_000);
      }
    })
    .catch((error) => showProblem(`${error.message} Check your Stripe email or call Integrity at (417) 815-3315 before making another payment.`));

  loadStatus();
}

document.addEventListener("DOMContentLoaded", initRemanOrderResult);
