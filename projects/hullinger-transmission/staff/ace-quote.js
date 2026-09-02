(() => {
  const form = document.querySelector("[data-ace-lookup-form]");
  if (!form) return;

  const tokenInput = document.querySelector("[data-ace-token]");
  const vinInput = document.querySelector("[data-ace-vin]");
  const submitButton = document.querySelector("[data-ace-submit]");
  const status = document.querySelector("[data-ace-status]");
  const results = document.querySelector("[data-ace-results]");
  const vehicle = document.querySelector("[data-ace-vehicle]");
  const candidates = document.querySelector("[data-ace-candidates]");
  const checkedAt = document.querySelector("[data-checked-at]");
  const quoteBuilder = document.querySelector("[data-quote-builder]");
  const selectedPackage = document.querySelector("[data-selected-package]");
  const unitInput = document.querySelector("[data-quote-unit]");
  const freightInput = document.querySelector("[data-quote-freight]");
  const coreInput = document.querySelector("[data-quote-core]");
  const otherInput = document.querySelector("[data-quote-other]");
  const taxInput = document.querySelector("[data-quote-tax]");
  const expirationInput = document.querySelector("[data-quote-expiration]");
  const total = document.querySelector("[data-quote-total]");
  const fitmentConfirmed = document.querySelector("[data-fitment-confirmed]");
  const copyButton = document.querySelector("[data-copy-quote]");
  const resetButton = document.querySelector("[data-reset-quote]");

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
  let lookupData = null;
  let activePackage = null;

  try {
    tokenInput.value = sessionStorage.getItem("integrityAceStaffToken") || "";
  } catch {
    tokenInput.value = "";
  }

  const normalizeVin = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17);
  const number = (input) => Number.parseFloat(input?.value) || 0;

  const setStatus = (state, heading, message) => {
    status.dataset.state = state;
    status.replaceChildren();
    const strong = document.createElement("strong");
    const span = document.createElement("span");
    strong.textContent = heading;
    span.textContent = message;
    status.append(strong, span);
  };

  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  };

  const calculateTotal = () => {
    const value = number(unitInput) + number(freightInput) + number(coreInput) + number(otherInput) + number(taxInput);
    total.textContent = currency.format(value);
    return value;
  };

  const formatStock = (stock) => {
    if (!stock) return "Stock requires confirmation";
    if (stock.quantity > 0) return `${stock.quantity} shown at ${stock.location || "ACE"}`;
    if (stock.externalQuantity > 0) return `${stock.externalQuantity} external unit(s) shown`;
    return stock.location ? `No finished unit shown at ${stock.location}` : "Lead time requires confirmation";
  };

  const renderVehicle = (data) => {
    vehicle.replaceChildren();
    [
      ["Year", data.year],
      ["Make", data.make],
      ["Model", data.model],
      ["Engine", [data.liter && `${data.liter}L`, data.cylinder && `${data.cylinder} cyl`].filter(Boolean).join(" / ")],
      ["Drive", data.driveType],
    ].filter(([, value]) => value).forEach(([label, value]) => {
      vehicle.append(node("span", "", `${label}: ${value}`));
    });
  };

  const choosePackage = (candidate, upgrade, packageData) => {
    activePackage = { candidate, upgrade, packageData };
    quoteBuilder.hidden = false;
    unitInput.value = packageData.integrityRecommendedRetail.toFixed(2);
    coreInput.value = Number(candidate.coreCharge || 0).toFixed(2);
    freightInput.value = "0";
    otherInput.value = "0";
    taxInput.value = "0";
    fitmentConfirmed.checked = false;
    copyButton.disabled = true;

    const expiration = new Date();
    expiration.setDate(expiration.getDate() + (lookupData?.quoteDefaults?.quoteExpirationDays || 7));
    expirationInput.value = expiration.toISOString().slice(0, 10);

    selectedPackage.replaceChildren();
    const strong = node("strong", "", `${candidate.partNumber} • ${candidate.family || candidate.transmission}`);
    const detail = node("span", "", ` — ${packageData.warranty}, ${upgrade.name || "Base"}. ACE price checked ${new Date(lookupData.checkedAt).toLocaleString()}.`);
    selectedPackage.append(strong, detail);
    calculateTotal();
    quoteBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderPackage = (candidate, upgrade, packageData) => {
    const card = node("article", "package-card");
    card.append(
      node("strong", "", packageData.warranty),
      node("p", "", `${upgrade.name || "Base"}${packageData.pricingLevel ? ` • ${packageData.pricingLevel}` : ""}`),
    );

    const details = document.createElement("dl");
    const rows = [
      ["ACE wholesale", currency.format(packageData.wholesale)],
      ["ACE suggested retail", packageData.aceSuggestedRetail ? currency.format(packageData.aceSuggestedRetail) : "Not provided"],
      ["Integrity price floor", currency.format(packageData.integrityRecommendedRetail), "retail-price"],
      ["Core deposit", currency.format(candidate.coreCharge || 0)],
    ];
    rows.forEach(([label, value, className]) => {
      const dt = node("dt", "", label);
      const dd = node("dd", className || "", value);
      details.append(dt, dd);
    });
    card.append(details);

    const button = node("button", "btn btn-primary", "Use This Package");
    button.type = "button";
    button.addEventListener("click", () => choosePackage(candidate, upgrade, packageData));
    card.append(button);
    return card;
  };

  const renderCandidate = (candidate) => {
    const card = node("article", "candidate-card");
    const header = node("div", "candidate-card__header");
    const heading = node("div");
    heading.append(
      node("h3", "", `${candidate.partNumber || "ACE match"} • ${candidate.family || candidate.transmission || "Transmission"}`),
      node("p", "", [candidate.tagId && `Tag ${candidate.tagId}`, candidate.oemNumber && `OEM ${candidate.oemNumber}`, candidate.description].filter(Boolean).join(" • ")),
    );
    header.append(heading, node("span", "stock-pill", formatStock(candidate.stock)));
    card.append(header);

    if (candidate.pricingError) {
      card.append(node("p", "candidate-error", candidate.pricingError));
      return card;
    }

    const grid = node("div", "package-grid");
    for (const upgrade of candidate.upgrades || []) {
      for (const packageData of upgrade.packages || []) {
        grid.append(renderPackage(candidate, upgrade, packageData));
      }
    }

    if (!grid.children.length) grid.append(node("p", "candidate-error", "ACE returned a fitment match but no active pricing package. Review it directly in the portal."));
    card.append(grid);

    if (candidate.stock?.warning) card.append(node("p", "candidate-warning", `${candidate.stock.warning.label}: ${candidate.stock.warning.detail}`));
    if (candidate.stock?.error) card.append(node("p", "candidate-error", `${candidate.stock.error.label}: ${candidate.stock.error.detail}`));
    if (candidate.stock?.nonReturnable) card.append(node("p", "candidate-warning", "ACE currently marks this application non-returnable. Confirm cancellation and hot-build terms before quoting."));
    return card;
  };

  const renderResults = (data) => {
    lookupData = data;
    results.hidden = false;
    quoteBuilder.hidden = true;
    activePackage = null;
    renderVehicle(data.vehicle || {});
    candidates.replaceChildren();
    checkedAt.textContent = `Checked ${new Date(data.checkedAt).toLocaleString()}`;

    if (!data.candidates?.length) {
      candidates.append(node("p", "candidate-error", "ACE did not return a matching part. Use ID Request or OEM Tag Search in the portal before quoting."));
      return;
    }

    data.candidates.forEach((candidate) => candidates.append(renderCandidate(candidate)));
  };

  const customerQuoteText = () => {
    const { candidate, upgrade, packageData } = activePackage;
    const vehicleText = [
      lookupData.vehicle.year,
      lookupData.vehicle.make,
      lookupData.vehicle.model,
      lookupData.vehicle.liter && `${lookupData.vehicle.liter}L`,
      lookupData.vehicle.driveType,
    ].filter(Boolean).join(" ");

    return [
      "Integrity Transmission & Drivetrain — Remanufactured Transmission Quote",
      "",
      `Vehicle: ${vehicleText}`,
      `Transmission: ${candidate.family || candidate.transmission} (${candidate.partNumber})`,
      `Package: ${upgrade.name || "Base"}`,
      `Warranty option: ${packageData.warranty}`,
      "",
      `Transmission package: ${currency.format(number(unitInput))}`,
      `Freight & accessorials: ${currency.format(number(freightInput))}`,
      `Core deposit: ${currency.format(number(coreInput))}`,
      `Other approved items: ${currency.format(number(otherInput))}`,
      `Sales tax: ${currency.format(number(taxInput))}`,
      `Total due before ordering: ${currency.format(calculateTotal())}`,
      `Quote valid through: ${expirationInput.value || "Confirm before ordering"}`,
      "",
      "The core deposit is separate and any later credit depends on returning an eligible, complete matching core in the required container by the stated deadline. Exact freight timing, programming, cooler service, installer documentation, cancellation and warranty requirements are controlled by the final written terms. Full payment is required before the transmission and supporting parts are ordered.",
    ].join("\n");
  };

  vinInput.addEventListener("input", () => {
    vinInput.value = normalizeVin(vinInput.value);
    vinInput.setCustomValidity("");
  });

  tokenInput.addEventListener("change", () => {
    try { sessionStorage.setItem("integrityAceStaffToken", tokenInput.value); } catch { /* session storage unavailable */ }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const vin = normalizeVin(vinInput.value);

    if (!vinPattern.test(vin)) {
      vinInput.setCustomValidity("Enter a valid 17-character VIN without I, O, or Q.");
      vinInput.reportValidity();
      return;
    }

    if (!tokenInput.value.trim()) {
      tokenInput.reportValidity();
      return;
    }

    try { sessionStorage.setItem("integrityAceStaffToken", tokenInput.value); } catch { /* session storage unavailable */ }
    submitButton.disabled = true;
    submitButton.textContent = "Checking ACE…";
    results.hidden = true;
    quoteBuilder.hidden = true;
    setStatus("loading", "Signing in to the ACE staff portal", "Checking VIN, fitment candidates, current account pricing and base stock status.");

    try {
      const response = await fetch("/api/ace-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenInput.value.trim()}`,
        },
        body: JSON.stringify({ vin }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || `Lookup failed with HTTP ${response.status}`);

      renderResults(data);
      setStatus("success", "ACE lookup complete", data.notice || "Review every match before preparing the customer quote.");
    } catch (error) {
      setStatus("error", "ACE lookup did not complete", error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Check ACE Fitment & Pricing";
    }
  });

  [unitInput, freightInput, coreInput, otherInput, taxInput].forEach((input) => input.addEventListener("input", calculateTotal));
  fitmentConfirmed.addEventListener("change", () => { copyButton.disabled = !fitmentConfirmed.checked; });

  copyButton.addEventListener("click", async () => {
    if (!activePackage || !fitmentConfirmed.checked) return;
    const text = customerQuoteText();
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = "Quote Copied";
      window.setTimeout(() => { copyButton.textContent = "Copy Customer Quote"; }, 1800);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  });

  resetButton.addEventListener("click", () => {
    activePackage = null;
    quoteBuilder.hidden = true;
    fitmentConfirmed.checked = false;
    copyButton.disabled = true;
  });
})();
