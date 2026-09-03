/* =========================================================
  CUSTOMER REMAN LOOKUP
  Shows VIN-matched products, pricing, availability and freight.
========================================================= */

function initVinDecoder() {
  const form = document.querySelector("[data-reman-form]");
  const vinInput = document.querySelector("[data-vin-input]");
  const lookupButton = document.querySelector("[data-vin-decode]");
  const result = document.querySelector("[data-vin-result]");
  const catalog = document.querySelector("[data-reman-catalog]");

  if (!form || !vinInput || !lookupButton || !result || !catalog) return;

  const vehicleInput = form.querySelector("[name='vehicle']");
  const engineInput = form.querySelector("[name='engine']");
  const driveInput = form.querySelector("[name='drive-type']");
  const transmissionInput = form.querySelector("[name='transmission-details']");
  const decodedInput = form.querySelector("[name='decoded-vehicle']");
  const selectedIdInput = form.querySelector("[name='selected-option-id']");
  const selectedPackageInput = form.querySelector("[name='selected-package']");
  const unitPriceInput = form.querySelector("[name='catalog-unit-price']");
  const coreInput = form.querySelector("[name='catalog-core-deposit']");
  const availabilityInput = form.querySelector("[name='catalog-availability']");
  const checkedAtInput = form.querySelector("[name='catalog-checked-at']");
  const freightCarrierInput = form.querySelector("[name='catalog-freight-carrier']");
  const freightRateIdInput = form.querySelector("[name='catalog-freight-rate-id']");
  const freightTotalInput = form.querySelector("[name='catalog-freight-total']");
  const freightTransitInput = form.querySelector("[name='catalog-freight-transit']");
  const freightCheckedInput = form.querySelector("[name='catalog-freight-checked-at']");
  const freightButton = form.querySelector("[data-reman-freight]");
  const freightResults = form.querySelector("[data-reman-freight-results]");
  const checkoutButton = form.querySelector("[data-reman-checkout]");
  const assistButton = form.querySelector("[data-reman-assist]");
  const checkoutStatus = form.querySelector("[data-reman-checkout-status]");
  const assistanceReasonInput = form.querySelector("[name='assistance-reason']");
  const streetInput = form.querySelector("[name='shipping-street']");
  const street2Input = form.querySelector("[name='shipping-street-2']");
  const cityInput = form.querySelector("[name='shipping-city']");
  const stateInput = form.querySelector("[name='shipping-state']");
  const postalInput = form.querySelector("[name='shipping-zip']");
  const deliveryInput = form.querySelector("[name='delivery-location']");
  const coreFreightInput = form.querySelector("[name='core-return-freight']");
  const nameInput = form.querySelector("[name='name']");
  const phoneInput = form.querySelector("[name='phone']");
  const freightRetryStatusInput = form.querySelector("[name='freight-retry-status']");
  const freightRequestReferenceInput = form.querySelector("[name='freight-request-reference']");
  const callbackPhoneConfirmedInput = form.querySelector("[name='callback-phone-confirmed']");
  const leadReferenceInput = form.querySelector("[name='lead-reference']");
  const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const freightRetryLimit = 3;
  let lookupData = null;
  let selectedOption = null;
  let freightController = null;
  let assistanceSubmitted = false;
  let checkoutAttempt = null;

  const track = (eventName, details = {}) => {
    if (typeof pushConversionEvent === "function") pushConversionEvent(eventName, details);
  };

  const normalizeVin = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17);
  const phoneDigits = (value) => String(value || "").replace(/\D/g, "");
  const validPhone = (value) => phoneDigits(value).length >= 10;
  const displayPhone = (value) => {
    const digits = phoneDigits(value).slice(-10);
    return digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : String(value || "").trim();
  };
  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const waitForRetry = (milliseconds, signal) => new Promise((resolve, reject) => {
    if (signal.aborted) {
      const error = new Error("Delivery request canceled");
      error.name = "AbortError";
      reject(error);
      return;
    }
    const cancel = () => {
      clearTimeout(timeoutId);
      const error = new Error("Delivery request canceled");
      error.name = "AbortError";
      reject(error);
    };
    const timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", cancel, { once: true });
  });
  const newReference = () => globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const setResult = (state, title, message) => {
    result.dataset.state = state;
    result.replaceChildren(node("strong", "", title), node("span", "", message));
  };

  const setCheckoutStatus = (state, message) => {
    if (!checkoutStatus) return;
    checkoutStatus.hidden = !message;
    checkoutStatus.dataset.state = state;
    checkoutStatus.textContent = message || "";
  };

  const offerAssistance = (reason, message = "Send your VIN and contact information, and our team will verify the right option with you.") => {
    if (assistanceReasonInput) assistanceReasonInput.value = reason;
    setCheckoutStatus("ready", message);
  };

  const updateCheckoutButton = () => {
    if (!checkoutButton) return;
    checkoutButton.disabled = !selectedOption || !freightRateIdInput?.value;
  };

  const clearFreight = () => {
    checkoutAttempt = null;
    [freightCarrierInput, freightRateIdInput, freightTotalInput, freightTransitInput, freightCheckedInput]
      .filter(Boolean)
      .forEach((input) => { input.value = ""; });
    if (freightResults) {
      freightResults.hidden = true;
      freightResults.replaceChildren();
    }
    form.querySelector("[data-selected-summary] [data-order-total]")?.remove();
    if (freightRetryStatusInput) freightRetryStatusInput.value = "";
    if (freightRequestReferenceInput) freightRequestReferenceInput.value = "";
    if (callbackPhoneConfirmedInput) callbackPhoneConfirmedInput.value = "";
    setCheckoutStatus("", "");
    updateCheckoutButton();
  };

  const clearSelection = () => {
    selectedOption = null;
    [selectedIdInput, selectedPackageInput, unitPriceInput, coreInput, availabilityInput, checkedAtInput]
      .filter(Boolean)
      .forEach((input) => { input.value = ""; });
    catalog.querySelectorAll(".reman-package-card.is-selected").forEach((card) => card.classList.remove("is-selected"));
    catalog.querySelectorAll(".reman-package-card button[aria-pressed]").forEach((button) => button.setAttribute("aria-pressed", "false"));
    catalog.querySelector("[data-selected-summary]")?.remove();
    clearFreight();
    if (freightButton) freightButton.disabled = true;
    updateCheckoutButton();
  };

  const fillDrive = (value) => {
    if (!driveInput || !value) return;
    const drive = value.toLowerCase();
    if (drive.includes("awd") || drive.includes("all")) driveInput.value = "AWD";
    else if (drive.includes("4wd") || drive.includes("4x4") || drive.includes("four")) driveInput.value = "4WD";
    else if (drive.includes("fwd") || drive.includes("front")) driveInput.value = "FWD";
    else if (drive.includes("rwd") || drive.includes("2wd") || drive.includes("rear")) driveInput.value = "RWD / 2WD";
  };

  const fillVehicle = (vehicle) => {
    const vehicleName = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
    const engine = [vehicle.liter && `${vehicle.liter}L`, vehicle.cylinder && `${vehicle.cylinder}-cylinder`]
      .filter(Boolean)
      .join(" • ");
    if (vehicleInput) vehicleInput.value = vehicleName;
    if (engineInput) engineInput.value = engine;
    fillDrive(vehicle.driveType);
    if (decodedInput) {
      decodedInput.value = [
        vehicleName,
        engine && `Engine: ${engine}`,
        vehicle.driveType && `Drive: ${vehicle.driveType}`,
      ].filter(Boolean).join(" | ");
    }
    return { vehicleName, engine };
  };

  const availabilityClass = (code) => ({
    in_stock: "is-in-stock",
    build_to_order: "is-build-time",
    unavailable: "is-unavailable",
    manual_review: "is-review",
  }[code] || "is-review");

  const availabilityLabel = (code) => ({
    in_stock: "Available now",
    build_to_order: "Build required",
    unavailable: "Unavailable",
    manual_review: "Call for availability",
  }[code] || "Check availability");

  const renderIncludedItems = (items) => {
    if (!items?.length) return null;
    const details = node("details", "reman-included");
    details.append(node("summary", "", "See what is included"));
    const list = node("ul");
    items.forEach((item) => {
      list.append(node("li", "", `${item.quantity ? `${item.quantity} × ` : ""}${item.description}`));
    });
    details.append(list);
    return details;
  };

  const selectPackage = (card, candidate, upgrade, packageData) => {
    clearSelection();
    selectedOption = { candidate, upgrade, packageData };
    card.classList.add("is-selected");
    card.querySelector("button[aria-pressed]")?.setAttribute("aria-pressed", "true");

    if (selectedIdInput) selectedIdInput.value = packageData.selectionId;
    if (selectedPackageInput) selectedPackageInput.value = `${candidate.application} • ${upgrade.name} • ${packageData.warranty}`;
    if (unitPriceInput) unitPriceInput.value = packageData.customerPrice.toFixed(2);
    if (coreInput) coreInput.value = packageData.coreDeposit.toFixed(2);
    if (availabilityInput) availabilityInput.value = `${upgrade.availability.code}: ${upgrade.availability.title}`;
    if (checkedAtInput) checkedAtInput.value = lookupData.checkedAt;
    if (transmissionInput) transmissionInput.value = candidate.application;
    if (freightButton) freightButton.disabled = false;
    track("package_select", { transmission_family: candidate.application, upgrade_level: upgrade.name, warranty: packageData.warranty });

    const summary = node("section", "selected-reman-summary");
    summary.dataset.selectedSummary = "";
    const copy = node("div");
    copy.append(
      node("span", "selected-reman-summary__eyebrow", "Your selected option"),
      node("strong", "", `${candidate.application} • ${upgrade.name} • ${packageData.warranty}`),
      node("p", "", `${currency.format(packageData.customerPrice)} transmission price + ${currency.format(packageData.coreDeposit)} refundable core deposit. Delivery and applicable tax are calculated separately.`),
    );
    const change = node("button", "btn btn-dark", "Change Option");
    change.type = "button";
    change.addEventListener("click", () => {
      clearSelection();
      catalog.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    summary.append(copy, change);
    catalog.append(summary);

    form.querySelector("#reman-name")?.focus({ preventScroll: true });
    summary.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const renderPackage = (candidate, upgrade, packageData) => {
    const card = node("article", "reman-package-card");
    card.append(
      node("span", "reman-package-card__warranty", packageData.warranty),
      node("strong", "reman-package-card__price", currency.format(packageData.customerPrice)),
      node("span", "reman-package-card__label", "Transmission price"),
    );

    const core = node("div", "reman-core-line");
    core.append(
      node("span", "", "Refundable core deposit"),
      node("strong", "", currency.format(packageData.coreDeposit)),
    );
    card.append(core);
    card.append(node("p", "reman-package-card__subtotal", `${currency.format(packageData.subtotalBeforeFreightAndTax)} subtotal before delivery and applicable tax.`));

    const button = node("button", "btn btn-primary", packageData.orderable ? "Choose This Package" : "Ask About This Package");
    button.type = "button";
    button.setAttribute("aria-label", `${packageData.orderable ? "Choose" : "Ask about"} ${candidate.application}, ${upgrade.name}, ${packageData.warranty}, ${currency.format(packageData.customerPrice)}`);
    if (packageData.orderable) {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => selectPackage(card, candidate, upgrade, packageData));
    } else {
      button.addEventListener("click", () => {
        if (transmissionInput) transmissionInput.value = candidate.application;
        if (availabilityInput) availabilityInput.value = `${upgrade.availability.code}: ${upgrade.availability.title}`;
        offerAssistance("Selected package requires personal confirmation");
        form.querySelector("#reman-name")?.focus();
      });
    }
    card.append(button);
    return card;
  };

  const renderUpgrade = (candidate, upgrade) => {
    const card = node("article", "reman-upgrade-card");
    const header = node("div", "reman-upgrade-card__header");
    header.append(
      node("h4", "", upgrade.name),
      node("span", `reman-stock-pill ${availabilityClass(upgrade.availability.code)}`, availabilityLabel(upgrade.availability.code)),
    );
    card.append(header);
    if (upgrade.description) card.append(node("p", "reman-upgrade-description", upgrade.description));
    card.append(node("strong", "reman-availability-title", upgrade.availability.title));
    card.append(node("p", "reman-availability-detail", upgrade.availability.detail));

    const included = renderIncludedItems(upgrade.includedItems);
    if (included) card.append(included);
    if (upgrade.requiresAssistedOrder) {
      card.append(node("p", "reman-alert", "Please contact us before ordering this package because additional return requirements may apply."));
    }

    const packages = node("div", "reman-package-grid");
    (upgrade.packages || []).forEach((packageData) => packages.append(renderPackage(candidate, upgrade, packageData)));
    if (!packages.children.length) packages.append(node("p", "reman-alert", "Online pricing is not available for this package. Call (417) 815-3315 for help."));
    card.append(packages);
    return card;
  };

  const renderCatalog = (data) => {
    lookupData = data;
    clearSelection();
    catalog.hidden = false;
    catalog.replaceChildren();

    const intro = node("div", "reman-catalog__intro");
    intro.append(
      node("span", "reman-catalog__eyebrow", "Options for your VIN"),
      node("h3", "", "Choose your remanufactured transmission"),
      node("p", "", data.notice),
    );
    catalog.append(intro);

    if (!data.candidates?.length) {
      catalog.append(node("p", "reman-alert", "We could not match this VIN online. Complete the form or call (417) 815-3315 and we will help identify the correct transmission."));
      offerAssistance("No online VIN match");
      return;
    }

    data.candidates.forEach((candidate) => {
      const candidateCard = node("section", "reman-candidate-card");
      const heading = node("div", "reman-candidate-card__heading");
      heading.append(node("span", "", "Transmission matched to your VIN"), node("h3", "", candidate.application));
      if (candidate.description && candidate.description !== candidate.application) heading.append(node("p", "", candidate.description));
      candidateCard.append(heading);
      if (candidate.status === "manual_review" || candidate.status === "unavailable") {
        candidateCard.append(node("p", "reman-alert", candidate.message));
      } else {
        const upgradeGrid = node("div", "reman-upgrade-grid");
        (candidate.upgrades || []).forEach((upgrade) => upgradeGrid.append(renderUpgrade(candidate, upgrade)));
        candidateCard.append(upgradeGrid);
      }
      catalog.append(candidateCard);
    });

    catalog.append(node("p", "reman-catalog__checked", `Price and availability checked ${new Date(data.checkedAt).toLocaleString()}. We confirm both again before payment.`));
  };

  const chooseFreight = (card, rate, checkedAt) => {
    freightResults.querySelectorAll(".reman-freight-rate.is-selected").forEach((item) => item.classList.remove("is-selected"));
    freightResults.querySelectorAll(".reman-freight-rate[aria-pressed]").forEach((item) => item.setAttribute("aria-pressed", "false"));
    card.classList.add("is-selected");
    card.setAttribute("aria-pressed", "true");
    if (freightCarrierInput) freightCarrierInput.value = rate.carrier;
    if (freightRateIdInput) freightRateIdInput.value = rate.rateId;
    if (freightTotalInput) freightTotalInput.value = rate.customerFreightTotal.toFixed(2);
    if (freightTransitInput) freightTransitInput.value = rate.transitDays ? `${rate.transitDays} days after shipment` : "Confirm with carrier";
    if (freightCheckedInput) freightCheckedInput.value = checkedAt;

    const summary = form.querySelector("[data-selected-summary]");
    if (summary && selectedOption) {
      summary.querySelector("[data-order-total]")?.remove();
      const due = selectedOption.packageData.customerPrice + selectedOption.packageData.coreDeposit + rate.customerFreightTotal;
      const totalLine = node("p", "selected-reman-summary__total", `${currency.format(due)} before applicable tax, including delivery and the refundable core deposit.`);
      totalLine.dataset.orderTotal = "";
      summary.querySelector("div")?.append(totalLine);
    }
    setCheckoutStatus("ready", "Your package and delivery option are ready. Continue to Stripe to see applicable tax and the complete total.");
    updateCheckoutButton();
  };

  const renderFreight = (data) => {
    clearFreight();
    freightResults.hidden = false;
    freightResults.append(node("p", "reman-freight-notice", data.notice));
    const grid = node("div", "reman-freight-grid");

    data.rates.forEach((rate, index) => {
      const card = node("button", "reman-freight-rate");
      card.type = "button";
      card.setAttribute("aria-pressed", "false");
      card.setAttribute("aria-label", `Choose ${rate.carrier} delivery for ${currency.format(rate.customerFreightTotal)}${rate.transitDays ? `, estimated ${rate.transitDays} days after shipment` : ""}`);
      const transit = rate.transitDays ? `${rate.transitDays} ${rate.transitDays === 1 ? "day" : "days"} after shipment` : "Transit time to be confirmed";
      card.append(
        node("span", "", index === 0 ? "Lowest rate shown" : "Another delivery option"),
        node("strong", "", currency.format(rate.customerFreightTotal)),
        node("small", "", `${rate.carrier} • ${transit}`),
      );
      card.addEventListener("click", () => chooseFreight(card, rate, data.checkedAt));
      grid.append(card);
    });
    freightResults.append(grid);
  };

  const freightPayload = () => ({
    vin: vinInput.value,
    selectionId: selectedOption.packageData.selectionId,
    addressLine1: streetInput.value,
    addressLine2: street2Input?.value || "",
    city: cityInput.value,
    state: stateInput.value,
    postalCode: postalInput.value,
    deliveryLocation: deliveryInput.value,
    coreReturnFreight: coreFreightInput.value,
  });

  const loadFreightWithRetry = async (payload, controller) => {
    let lastError;

    for (let attempt = 1; attempt <= freightRetryLimit; attempt += 1) {
      if (controller.signal.aborted) {
        const error = new Error("Delivery request canceled");
        error.name = "AbortError";
        throw error;
      }
      if (attempt > 1) {
        const retryMessage = `The delivery service has not responded yet. Retrying automatically (${attempt} of ${freightRetryLimit})…`;
        freightResults.replaceChildren(node("p", "reman-freight-notice reman-freight-notice--pending", retryMessage));
        setCheckoutStatus("loading", retryMessage);
      }

      try {
        const attemptController = new AbortController();
        const abortForInputChange = () => attemptController.abort();
        const timeoutId = setTimeout(() => attemptController.abort(), 24_000);
        controller.signal.addEventListener("abort", abortForInputChange, { once: true });
        let response;
        try {
          response = await fetch("/api/reman-shipping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: attemptController.signal,
          });
        } catch (error) {
          if (controller.signal.aborted) throw error;
          if (attemptController.signal.aborted) {
            const timeoutError = new Error("The delivery service took too long to respond.");
            timeoutError.retryable = true;
            throw timeoutError;
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
          controller.signal.removeEventListener("abort", abortForInputChange);
        }
        const data = await response.json().catch(() => ({}));
        if (response.ok) return data;

        const error = new Error(data.message || data.error || "Delivery rates could not be loaded.");
        error.retryable = data.retryable === true;
        error.retryAfterSeconds = Number(data.retryAfterSeconds) || 3;
        error.requestId = data.requestId || "";
        error.serverAttempts = Number(data.attempts) || 1;
        lastError = error;

        if (!error.retryable || attempt === freightRetryLimit) throw error;
        await waitForRetry(Math.min(6_000, Math.max(1_500, error.retryAfterSeconds * 1_000)), controller.signal);
      } catch (error) {
        if (error.name === "AbortError") throw error;
        lastError = error;
        if (error.retryable === false || attempt === freightRetryLimit) throw error;
        await waitForRetry(2_000 * attempt, controller.signal);
      }
    }

    throw lastError || new Error("Delivery rates could not be loaded.");
  };

  const renderFreightAssistance = (error) => {
    const panel = node("section", "reman-freight-assistance");
    panel.setAttribute("role", "alert");
    panel.append(
      node("span", "reman-freight-assistance__eyebrow", "Delivery rate follow-up"),
      node("strong", "reman-freight-assistance__title", "We can keep your order moving."),
    );

    const hasPhone = validPhone(phoneInput?.value);
    const phonePrompt = node("p");
    const refreshPhonePrompt = () => {
      const currentHasPhone = validPhone(phoneInput?.value);
      phonePrompt.textContent = currentHasPhone
        ? `We could not confirm the live freight amount after several attempts. Is ${displayPhone(phoneInput.value)} the best number for a transmission specialist to reach you?`
        : "We could not confirm the live freight amount after several attempts. Enter the best phone number above and we will contact you to finish the delivery quote.";
    };
    refreshPhonePrompt();
    panel.append(phonePrompt);

    const actions = node("div", "reman-freight-assistance__actions");
    const confirm = node("button", "btn btn-primary", hasPhone ? "Yes, Contact Me at This Number" : "Enter My Phone Number");
    confirm.type = "button";
    confirm.addEventListener("click", async () => {
      if (!validPhone(phoneInput?.value)) {
        phoneInput?.focus();
        phoneInput?.reportValidity();
        return;
      }
      if (callbackPhoneConfirmedInput) callbackPhoneConfirmedInput.value = displayPhone(phoneInput.value);
      if (assistanceReasonInput) assistanceReasonInput.value = "Freight rate unavailable after automatic retries";
      await submitAssistedQuote({ source: "freight-recovery", triggerButton: confirm });
    });
    actions.append(confirm);

    phoneInput?.addEventListener("input", () => {
      if (!panel.isConnected) return;
      refreshPhonePrompt();
      confirm.textContent = validPhone(phoneInput.value) ? "Yes, Contact Me at This Number" : "Enter My Phone Number";
    });

    if (hasPhone) {
      const change = node("button", "btn btn-dark", "Use a Different Number");
      change.type = "button";
      change.addEventListener("click", () => {
        phoneInput.focus();
        phoneInput.select();
      });
      actions.append(change);
    }

    panel.append(actions, node("small", "", "No payment will be taken until the delivery price is confirmed and you complete secure checkout."));
    freightResults.replaceChildren(panel);
    if (freightRetryStatusInput) freightRetryStatusInput.value = `exhausted:${freightRetryLimit}`;
    if (freightRequestReferenceInput) freightRequestReferenceInput.value = error.requestId || "not-provided";
    offerAssistance(
      "Freight rate unavailable after automatic retries",
      hasPhone
        ? `Confirm ${displayPhone(phoneInput.value)} above and we will contact you to finish the delivery quote.`
        : "Enter your name and best phone number, then request a callback to finish the delivery quote.",
    );
  };

  freightButton?.addEventListener("click", async () => {
    if (!selectedOption) {
      setResult("error", "Choose a transmission option first", "Select a price and warranty package before calculating freight.");
      catalog.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const required = [streetInput, cityInput, stateInput, postalInput, deliveryInput, coreFreightInput];
    const missing = required.find((input) => !input?.value.trim());
    if (missing) {
      missing.reportValidity();
      missing.focus();
      return;
    }

    stateInput.value = stateInput.value.trim().toUpperCase();
    postalInput.value = postalInput.value.replace(/\D/g, "").slice(0, 5);
    if (!/^[A-Z]{2}$/.test(stateInput.value) || !/^\d{5}$/.test(postalInput.value)) {
      stateInput.setCustomValidity(/^[A-Z]{2}$/.test(stateInput.value) ? "" : "Use the two-letter state abbreviation, such as MO.");
      postalInput.setCustomValidity(/^\d{5}$/.test(postalInput.value) ? "" : "Enter a five-digit ZIP code.");
      form.reportValidity();
      return;
    }

    freightController?.abort();
    freightController = new AbortController();
    const controller = freightController;
    freightButton.disabled = true;
    freightButton.textContent = "Checking Freight…";
    clearFreight();
    freightResults.hidden = false;
    freightResults.append(node("p", "reman-freight-notice", "Checking current delivery rates for this address…"));

    try {
      const data = await loadFreightWithRetry(freightPayload(), controller);
      renderFreight(data);
      if (freightRetryStatusInput) freightRetryStatusInput.value = `completed:${data.attempts || 1}`;
      track("freight_quote_success", { rate_count: data.rates.length, round_trip: Boolean(data.roundTrip) });
    } catch (error) {
      if (error.name === "AbortError") return;
      renderFreightAssistance(error);
      track("freight_quote_error");
    } finally {
      if (freightController === controller) {
        freightController = null;
        freightButton.disabled = false;
        freightButton.textContent = "Check Freight Again";
      }
    }
  });

  [streetInput, street2Input, cityInput, stateInput, postalInput, deliveryInput, coreFreightInput].forEach((input) => {
    input?.addEventListener("input", () => {
      freightController?.abort();
      if (freightTotalInput?.value || !freightResults?.hidden) clearFreight();
    });
  });

  deliveryInput?.addEventListener("change", () => {
    const needsPersonalQuote = ["Local coordinated installation", "Not sure"].includes(deliveryInput.value);
    if (needsPersonalQuote) {
      clearFreight();
      if (freightButton) freightButton.disabled = true;
      offerAssistance(
        deliveryInput.value === "Local coordinated installation"
          ? "Springfield-area installation requested"
          : "Delivery location needs confirmation",
        "This delivery choice needs a personal quote. Complete your contact information and request help from our team.",
      );
    } else if (selectedOption && freightButton) {
      freightButton.disabled = false;
    }
  });

  stateInput?.addEventListener("input", () => {
    stateInput.value = stateInput.value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2);
    stateInput.setCustomValidity("");
  });

  postalInput?.addEventListener("input", () => {
    postalInput.value = postalInput.value.replace(/\D/g, "").slice(0, 5);
    postalInput.setCustomValidity("");
  });

  vinInput.addEventListener("input", () => {
    const normalized = normalizeVin(vinInput.value);
    if (vinInput.value !== normalized) vinInput.value = normalized;
    vinInput.setCustomValidity("");

    if (result.dataset.vin && result.dataset.vin !== normalized) {
      result.removeAttribute("data-vin");
      catalog.hidden = true;
      catalog.replaceChildren();
      lookupData = null;
      clearSelection();
      setResult("idle", "Enter your VIN to begin", "We will show the matching transmission options, prices and availability.");
    }
  });

  lookupButton.addEventListener("click", async () => {
    const vin = normalizeVin(vinInput.value);
    vinInput.value = vin;

    if (!vinPattern.test(vin)) {
      vinInput.setCustomValidity("Enter a valid 17-character VIN without I, O, or Q.");
      vinInput.reportValidity();
      setResult("error", "Check the VIN", "A modern VIN contains 17 letters and numbers and does not use I, O, or Q.");
      return;
    }

    vinInput.setCustomValidity("");
    lookupButton.disabled = true;
    lookupButton.textContent = "Checking Current Options…";
    catalog.hidden = true;
    setResult("loading", "Finding the right transmission", "Matching your vehicle and loading current packages, prices and availability.");
    track("vin_lookup_start");

    try {
      const response = await fetch("/api/reman-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || "The lookup could not be completed.");

      const vehicle = fillVehicle(data.vehicle || {});
      result.dataset.vin = vin;
      setResult(
        "success",
        vehicle.vehicleName || "Vehicle identified",
        `${[vehicle.engine, data.vehicle?.driveType].filter(Boolean).join(" • ") || "VIN match found"}. Choose from the available options below.`,
      );
      renderCatalog(data);
      track("vin_lookup_success", { candidate_count: data.candidates?.length || 0 });
    } catch (error) {
      console.warn("Reman catalog lookup unavailable", error);
      setResult("error", "We could not load your options", `${error.message} Try again or call us at (417) 815-3315.`);
      catalog.hidden = false;
      catalog.replaceChildren(node("p", "reman-alert", "Complete the vehicle and contact information below and we will look it up for you."));
      offerAssistance("Online catalog lookup unavailable");
      track("vin_lookup_error");
    } finally {
      lookupButton.disabled = false;
      lookupButton.textContent = "Find Options & Prices";
    }
  });

  vinInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!lookupButton.disabled) lookupButton.click();
  });

  const submitAssistedQuote = async ({ source = "manual", triggerButton = assistButton } = {}) => {
    if (assistanceSubmitted) return;
    const assistedFields = [
      vinInput,
      nameInput,
      phoneInput,
      vehicleInput,
    ];
    const missing = assistedFields.find((field) => !field?.value.trim() || !field.checkValidity());
    if (missing) {
      missing.reportValidity();
      missing.focus();
      return;
    }
    if (!validPhone(phoneInput?.value)) {
      phoneInput.setCustomValidity("Enter a valid phone number with at least 10 digits.");
      phoneInput.reportValidity();
      phoneInput.focus();
      return;
    }
    phoneInput.setCustomValidity("");

    const originalLabel = triggerButton?.textContent || "Request Help From Our Team";
    if (triggerButton) {
      triggerButton.disabled = true;
      triggerButton.textContent = "Sending Request…";
    }
    if (assistButton && assistButton !== triggerButton) assistButton.disabled = true;
    setCheckoutStatus("loading", "Sending your information to the Integrity team…");

    try {
      const params = new URLSearchParams();
      for (const [name, value] of new FormData(form).entries()) params.set(name, String(value));
      params.set("form-name", "reman-transmission-quote");
      params.set("request-type", "Assisted reman transmission quote");
      params.set("order-workflow", "Personal quote requested; no payment taken");
      params.set("assistance-source", source);
      if (leadReferenceInput && !leadReferenceInput.value) leadReferenceInput.value = newReference();
      params.set("lead-reference", leadReferenceInput?.value || newReference());
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      if (!response.ok) throw new Error("Your request could not be sent online.");
      assistanceSubmitted = true;
      track("assisted_quote_submit");
      const callbackNumber = validPhone(phoneInput?.value) ? ` at ${displayPhone(phoneInput.value)}` : "";
      setCheckoutStatus("success", `Your request was sent. A team member will contact you${callbackNumber} to finish the delivery quote. No payment was taken.`);
      setTimeout(() => window.location.assign("/thank-you?request=reman-freight"), 900);
    } catch (error) {
      setCheckoutStatus("error", `${error.message} Please call or text (417) 815-3315. No payment was taken.`);
    } finally {
      if (!assistanceSubmitted && triggerButton) {
        triggerButton.disabled = false;
        triggerButton.textContent = originalLabel;
      }
      if (!assistanceSubmitted && assistButton && assistButton !== triggerButton) assistButton.disabled = false;
    }
  };

  const requestCheckout = async (payload) => {
    const attemptLimit = 2;
    let lastError;

    for (let attempt = 1; attempt <= attemptLimit; attempt += 1) {
      try {
        const response = await fetch("/api/reman-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) return data;

        const error = new Error(data.error || "Secure checkout could not be opened.");
        error.data = data;
        lastError = error;
        if (!data.retryable || attempt === attemptLimit) throw error;

        const retryAfter = Math.min(6_000, Math.max(1_500, (Number(data.retryAfterSeconds) || 3) * 1_000));
        setCheckoutStatus("loading", `The delivery rate is taking longer than expected. Retrying checkout automatically (${attempt + 1} of ${attemptLimit})…`);
        await wait(retryAfter);
      } catch (error) {
        if (error.data || attempt === attemptLimit) throw error;
        lastError = error;
        setCheckoutStatus("loading", "The secure checkout connection was interrupted. Retrying once without creating a second order…");
        await wait(2_000);
      }
    }

    throw lastError || new Error("Secure checkout could not be opened.");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const vin = normalizeVin(vinInput.value);
    vinInput.value = vin;

    if (!vinPattern.test(vin)) {
      vinInput.setCustomValidity("A valid 17-character VIN is required for a reman transmission request.");
      vinInput.reportValidity();
      vinInput.focus();
      return;
    }

    if (event.submitter?.matches("[data-reman-assist]")) {
      await submitAssistedQuote();
      return;
    }

    if (!form.reportValidity()) return;

    if (!selectedOption) {
      setResult("error", "Choose an option first", "Select one of the available price and warranty packages before submitting the order details.");
      catalog.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!freightRateIdInput?.value) {
      setCheckoutStatus("error", "Calculate delivery and choose one of the current freight options before checkout.");
      freightButton?.focus();
      return;
    }

    const fields = Object.fromEntries(new FormData(form).entries());
    const nowSeconds = Math.floor(Date.now() / 1_000);
    if (!checkoutAttempt || checkoutAttempt.expiresAt < nowSeconds + 31 * 60) {
      checkoutAttempt = {
        id: newReference(),
        expiresAt: nowSeconds + 36 * 60,
      };
    }
    const originalLabel = checkoutButton?.textContent || "Continue to Secure Checkout";
    if (checkoutButton) {
      checkoutButton.disabled = true;
      checkoutButton.textContent = "Rechecking Order…";
    }
    setCheckoutStatus("loading", "Rechecking the VIN match, package price, availability and delivery rate before opening secure checkout…");
    track("begin_checkout", {
      transmission_family: selectedOption.candidate.application,
      upgrade_level: selectedOption.upgrade.name,
    });

    try {
      const data = await requestCheckout({
          ...fields,
          vin,
          selectionId: selectedIdInput?.value || "",
          freightRateId: freightRateIdInput.value,
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          addressLine1: fields["shipping-street"],
          addressLine2: fields["shipping-street-2"],
          city: fields["shipping-city"],
          state: fields["shipping-state"],
          postalCode: fields["shipping-zip"],
          deliveryLocation: fields["delivery-location"],
          coreReturnFreight: fields["core-return-freight"],
          coreStatus: fields["core-status"],
          installerStatus: fields["installer-status"],
          programmingCapability: fields["programming-capability"],
          vehicleUse: fields["vehicle-use-modifications"],
          driveType: fields["drive-type"],
          termsAccepted: fields["quote-acknowledgment"] === "Understood",
          checkoutAttemptId: checkoutAttempt.id,
          checkoutExpiresAt: checkoutAttempt.expiresAt,
      });

      if (!/^https:\/\/checkout\.stripe\.com\//i.test(data.checkoutUrl || "")) {
        throw new Error("The secure payment page did not load correctly. Please try again.");
      }
      setCheckoutStatus("success", "Secure checkout is ready. Taking you to Stripe…");
      track("checkout_redirect", {
        transmission_family: selectedOption.candidate.application,
        upgrade_level: selectedOption.upgrade.name,
      });
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      const data = error.data || {};
      if (data.freightChanged && Array.isArray(data.rates)) {
        renderFreight({
          rates: data.rates,
          checkedAt: data.checkedAt || new Date().toISOString(),
          roundTrip: data.roundTrip,
          notice: "The delivery price changed while we rechecked it. Choose one of the refreshed options below, then continue again.",
        });
      }
      if (data.priceChanged) {
        clearSelection();
        setResult(
          "error",
          "The package price changed",
          "Run the VIN lookup again to review the current options before continuing.",
        );
        result.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (data.freightPending) {
        renderFreightAssistance({ requestId: data.requestId || "checkout-recheck" });
      }
      setCheckoutStatus("error", `${error.message} No payment was taken.`);
    } finally {
      if (checkoutButton) {
        checkoutButton.textContent = originalLabel;
        updateCheckoutButton();
      }
    }
  });

  form.addEventListener("input", (event) => {
    if (event.target !== checkoutButton) checkoutAttempt = null;
    if (event.target === phoneInput) phoneInput.setCustomValidity("");
  });

  const requestedFamily = new URLSearchParams(window.location.search).get("family")?.replace(/[^A-Za-z0-9-]/g, "").slice(0, 20);
  if (requestedFamily && transmissionInput && !transmissionInput.value) {
    transmissionInput.value = requestedFamily.toUpperCase();
    setResult("idle", `${requestedFamily.toUpperCase()} search selected`, "Enter the 17-digit VIN to confirm the exact application, price and availability.");
  }

  const familySearch = document.querySelector("[data-reman-family-search]");
  const familyCards = [...document.querySelectorAll("[data-reman-family]")];
  const familyCount = document.querySelector("[data-reman-family-count]");
  familySearch?.addEventListener("input", () => {
    const query = familySearch.value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    let visible = 0;
    familyCards.forEach((card) => {
      const matches = !query || card.dataset.remanFamily.includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    if (familyCount) familyCount.textContent = `${visible} transmission ${visible === 1 ? "family" : "families"} shown`;
  });

  updateCheckoutButton();
}

document.addEventListener("DOMContentLoaded", initVinDecoder);
