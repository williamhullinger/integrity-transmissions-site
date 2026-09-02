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
  const freightTotalInput = form.querySelector("[name='catalog-freight-total']");
  const freightTransitInput = form.querySelector("[name='catalog-freight-transit']");
  const freightCheckedInput = form.querySelector("[name='catalog-freight-checked-at']");
  const freightButton = form.querySelector("[data-reman-freight]");
  const freightResults = form.querySelector("[data-reman-freight-results]");
  const streetInput = form.querySelector("[name='shipping-street']");
  const cityInput = form.querySelector("[name='shipping-city']");
  const stateInput = form.querySelector("[name='shipping-state']");
  const postalInput = form.querySelector("[name='shipping-zip']");
  const deliveryInput = form.querySelector("[name='delivery-location']");
  const coreFreightInput = form.querySelector("[name='core-return-freight']");
  const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  let lookupData = null;
  let selectedOption = null;

  const normalizeVin = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17);

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

  const clearFreight = () => {
    [freightCarrierInput, freightTotalInput, freightTransitInput, freightCheckedInput]
      .filter(Boolean)
      .forEach((input) => { input.value = ""; });
    if (freightResults) {
      freightResults.hidden = true;
      freightResults.replaceChildren();
    }
    form.querySelector("[data-selected-summary] [data-order-total]")?.remove();
  };

  const clearSelection = () => {
    selectedOption = null;
    [selectedIdInput, selectedPackageInput, unitPriceInput, coreInput, availabilityInput, checkedAtInput]
      .filter(Boolean)
      .forEach((input) => { input.value = ""; });
    catalog.querySelectorAll(".reman-package-card.is-selected").forEach((card) => card.classList.remove("is-selected"));
    catalog.querySelector("[data-selected-summary]")?.remove();
    clearFreight();
    if (freightButton) freightButton.disabled = true;
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

    if (selectedIdInput) selectedIdInput.value = packageData.selectionId;
    if (selectedPackageInput) selectedPackageInput.value = `${candidate.application} • ${upgrade.name} • ${packageData.warranty}`;
    if (unitPriceInput) unitPriceInput.value = packageData.customerPrice.toFixed(2);
    if (coreInput) coreInput.value = packageData.coreDeposit.toFixed(2);
    if (availabilityInput) availabilityInput.value = `${upgrade.availability.code}: ${upgrade.availability.title}`;
    if (checkedAtInput) checkedAtInput.value = lookupData.checkedAt;
    if (transmissionInput) transmissionInput.value = candidate.application;
    if (freightButton) freightButton.disabled = false;

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
    if (packageData.orderable) {
      button.addEventListener("click", () => selectPackage(card, candidate, upgrade, packageData));
    } else {
      button.addEventListener("click", () => {
        if (transmissionInput) transmissionInput.value = candidate.application;
        if (availabilityInput) availabilityInput.value = `${upgrade.availability.code}: ${upgrade.availability.title}`;
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
    card.classList.add("is-selected");
    if (freightCarrierInput) freightCarrierInput.value = rate.carrier;
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
  };

  const renderFreight = (data) => {
    clearFreight();
    freightResults.hidden = false;
    freightResults.append(node("p", "reman-freight-notice", data.notice));
    const grid = node("div", "reman-freight-grid");

    data.rates.forEach((rate, index) => {
      const card = node("button", "reman-freight-rate");
      card.type = "button";
      const transit = rate.transitDays ? `${rate.transitDays} ${rate.transitDays === 1 ? "day" : "days"} after shipment` : "Transit time to be confirmed";
      card.append(
        node("span", "", index === 0 ? "Lowest available rate" : "Another delivery option"),
        node("strong", "", currency.format(rate.customerFreightTotal)),
        node("small", "", `${rate.carrier} • ${transit}`),
      );
      card.addEventListener("click", () => chooseFreight(card, rate, data.checkedAt));
      grid.append(card);
    });
    freightResults.append(grid);
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

    const delivery = deliveryInput.value.toLowerCase();
    const freightPreference = coreFreightInput.value;
    const roundTrip = freightPreference !== "Quote outbound first" && freightPreference !== "Customer has freight account";
    freightButton.disabled = true;
    freightButton.textContent = "Checking Freight…";
    clearFreight();
    freightResults.hidden = false;
    freightResults.append(node("p", "reman-freight-notice", "Checking current delivery rates for this address…"));

    try {
      const response = await fetch("/api/reman-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: vinInput.value,
          selectionId: selectedOption.packageData.selectionId,
          addressLine1: streetInput.value,
          city: cityInput.value,
          state: stateInput.value,
          postalCode: postalInput.value,
          roundTrip,
          liftgate: delivery.includes("without dock") || delivery.includes("liftgate") || delivery.includes("residential"),
          residentialDelivery: delivery.includes("residential"),
          insideDelivery: false,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || "Delivery rates could not be loaded.");
      renderFreight(data);
    } catch (error) {
      freightResults.hidden = false;
      freightResults.replaceChildren(node("p", "reman-alert", `${error.message} Send the request and we will confirm the delivery cost for you.`));
    } finally {
      freightButton.disabled = false;
      freightButton.textContent = "Calculate Current Freight";
    }
  });

  [streetInput, cityInput, stateInput, postalInput, deliveryInput, coreFreightInput].forEach((input) => {
    input?.addEventListener("change", () => {
      if (freightTotalInput?.value) clearFreight();
    });
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
    } catch (error) {
      console.warn("Reman catalog lookup unavailable", error);
      setResult("error", "We could not load your options", `${error.message} Try again or call us at (417) 815-3315.`);
      catalog.hidden = false;
      catalog.replaceChildren(node("p", "reman-alert", "Complete the vehicle and contact information below and we will look it up for you."));
    } finally {
      lookupButton.disabled = false;
      lookupButton.textContent = "Find Options & Prices";
    }
  });

  form.addEventListener("submit", (event) => {
    const vin = normalizeVin(vinInput.value);
    vinInput.value = vin;

    if (!vinPattern.test(vin)) {
      event.preventDefault();
      vinInput.setCustomValidity("A valid 17-character VIN is required for a reman transmission request.");
      vinInput.reportValidity();
      vinInput.focus();
      return;
    }

    if (lookupData?.orderableSelections > 0 && !selectedOption) {
      event.preventDefault();
      setResult("error", "Choose an option first", "Select one of the available price and warranty packages before submitting the order details.");
      catalog.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

document.addEventListener("DOMContentLoaded", initVinDecoder);
