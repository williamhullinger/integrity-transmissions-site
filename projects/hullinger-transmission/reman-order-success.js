function initRemanOrderResult() {
  const root = document.querySelector("[data-order-result]");
  if (!root) return;

  const get = (selector) => root.querySelector(selector);
  const icon = get("[data-order-icon]");
  const eyebrow = get("[data-order-eyebrow]");
  const title = get("[data-order-title]");
  const message = get("[data-order-message]");
  const summary = get("[data-order-summary]");
  const retryButton = get("[data-order-retry]");
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const storageKey = "integrity-reman-checkout-session";
  const querySessionId = new URLSearchParams(window.location.search).get("session_id") || "";
  const readStoredSession = () => {
    try { return window.sessionStorage.getItem(storageKey) || ""; } catch { return ""; }
  };
  const storeSession = (value) => {
    try { window.sessionStorage.setItem(storageKey, value); } catch { /* The URL remains the recovery source. */ }
  };
  const forgetSession = () => {
    try { window.sessionStorage.removeItem(storageKey); } catch { /* No stored reference to remove. */ }
  };
  const sessionId = querySessionId || readStoredSession();
  let processingAttempts = 0;
  let requestFailures = 0;

  if (querySessionId) {
    storeSession(querySessionId);
    window.history.replaceState({}, "", window.location.pathname);
  }

  const showProblem = (copy) => {
    icon.textContent = "!";
    eyebrow.textContent = "Order Status";
    title.textContent = "Check your email.";
    message.textContent = copy;
    root.querySelector(".thank-you-card")?.setAttribute("aria-busy", "false");
    retryButton.hidden = false;
  };

  if (!sessionId) {
    showProblem("The Stripe order reference is missing. Check your payment email or call Integrity at (417) 815-3315 for help.");
    return;
  }

  const finishReferenceCleanup = () => {
    forgetSession();
  };

  const loadStatus = () => {
    retryButton.hidden = true;
    root.querySelector(".thank-you-card")?.setAttribute("aria-busy", "true");
    return fetch(`/api/reman-order-status?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Accept: "application/json" },
    })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We could not display the order status.");
      return data;
    })
    .then((data) => {
      requestFailures = 0;
      const paid = data.paymentStatus === "paid" || data.paymentStatus === "no_payment_required";
      const expired = data.checkoutStatus === "expired";
      const incomplete = data.checkoutStatus === "complete" && !paid;
      const processing = !paid && !expired && !incomplete;
      icon.textContent = paid ? "✓" : processing ? "…" : "!";
      eyebrow.textContent = paid ? "Payment Received" : processing ? "Payment Processing" : "Payment Not Completed";
      title.textContent = paid ? "Payment received—fitment review is next." : processing ? "Payment is still processing." : "Your payment was not completed.";
      message.textContent = paid
        ? "Integrity received your payment. We are confirming the VIN, fitment and availability before we place the transmission order."
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
      if (paid && typeof pushConversionEvent === "function") {
        const eventKey = `integrity-order-confirmed-${String(data.orderReference || "").slice(-18)}`;
        let alreadyTracked = false;
        try {
          alreadyTracked = window.sessionStorage.getItem(eventKey) === "true";
          if (!alreadyTracked) window.sessionStorage.setItem(eventKey, "true");
        } catch { /* An in-memory event is still privacy-safe when storage is unavailable. */ }
        if (!alreadyTracked) {
          pushConversionEvent("order_payment_confirmed", {
            page_path: window.location.pathname,
            value: (data.amountTotal || 0) / 100,
            currency: "USD",
            item_category: "reman_transmission",
          });
          if (data.analyticsTransactionId) {
            const items = [{
              item_id: String(data.application || "reman-transmission").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80),
              item_name: `${data.application || "Remanufactured"} transmission`,
              item_category: "reman_transmission",
              item_variant: [data.upgrade, data.warranty].filter(Boolean).join(" • "),
              price: Number(data.unitPrice || 0),
              quantity: 1,
            }];
            if (Number(data.coreDeposit || 0) > 0) items.push({
              item_id: "refundable_core_deposit",
              item_name: "Refundable transmission core deposit",
              item_category: "core_deposit",
              price: Number(data.coreDeposit),
              quantity: 1,
            });
            pushConversionEvent("purchase", {
              transaction_id: data.analyticsTransactionId,
              value: items.reduce((total, item) => total + (item.price * item.quantity), 0),
              tax: Number(data.amountTax || 0) / 100,
              shipping: Number(data.freight || 0),
              currency: String(data.currency || "usd").toUpperCase(),
              items,
            });
          }
        }
      }
      const invoice = get("[data-order-invoice]");
      if (data.invoiceUrl && /^https:\/\/(?:invoice|pay)\.stripe\.com\//i.test(data.invoiceUrl)) {
        invoice.href = data.invoiceUrl;
        invoice.hidden = false;
      }
      if (processing && processingAttempts < 4) {
        processingAttempts += 1;
        window.setTimeout(loadStatus, 3_000);
      } else {
        root.querySelector(".thank-you-card")?.setAttribute("aria-busy", "false");
        if (processing) retryButton.hidden = false;
        else finishReferenceCleanup();
      }
    })
    .catch((error) => {
      requestFailures += 1;
      if (requestFailures < 3) {
        window.setTimeout(loadStatus, requestFailures * 1_500);
        return;
      }
      showProblem(`${error.message} Check your Stripe email or call Integrity at (417) 815-3315 before making another payment.`);
    });
  };

  retryButton.addEventListener("click", () => {
    requestFailures = 0;
    processingAttempts = 0;
    loadStatus();
  });

  loadStatus();
}

document.addEventListener("DOMContentLoaded", initRemanOrderResult);
