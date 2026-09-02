/* =========================================================
  VIN-ASSISTED REMAN QUOTE
  Uses NHTSA vPIC for basic vehicle information. Integrity
  still verifies the exact transmission and interchange.
========================================================= */

function initVinDecoder() {
  const form = document.querySelector("[data-reman-form]");
  const vinInput = document.querySelector("[data-vin-input]");
  const decodeButton = document.querySelector("[data-vin-decode]");
  const result = document.querySelector("[data-vin-result]");

  if (!form || !vinInput || !decodeButton || !result) return;

  const vehicleInput = form.querySelector("[name='vehicle']");
  const engineInput = form.querySelector("[name='engine']");
  const driveInput = form.querySelector("[name='drive-type']");
  const transmissionInput = form.querySelector("[name='transmission-details']");
  const decodedInput = form.querySelector("[name='decoded-vehicle']");
  const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;

  const normalizeVin = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const setResult = (state, title, message) => {
    result.dataset.state = state;
    const heading = document.createElement("strong");
    const detail = document.createElement("span");
    heading.textContent = title;
    detail.textContent = message;
    result.replaceChildren(heading, detail);
  };

  const fillIfBlank = (field, value) => {
    if (field && value && !field.value.trim()) field.value = value;
  };

  const fillDriveIfBlank = (value) => {
    if (!driveInput || driveInput.value || !value) return;

    const drive = value.toLowerCase();
    if (drive.includes("all-wheel") || drive.includes("all wheel") || drive.includes("awd")) {
      driveInput.value = "AWD";
    } else if (drive.includes("four-wheel") || drive.includes("four wheel") || drive.includes("4x4") || drive.includes("4wd")) {
      driveInput.value = "4WD";
    } else if (drive.includes("front-wheel") || drive.includes("front wheel") || drive.includes("fwd")) {
      driveInput.value = "FWD";
    } else if (drive.includes("rear-wheel") || drive.includes("rear wheel") || drive.includes("4x2") || drive.includes("rwd")) {
      driveInput.value = "RWD / 2WD";
    }
  };

  const buildEngine = (vehicle) => {
    const parts = [];
    if (vehicle.DisplacementL) parts.push(`${vehicle.DisplacementL}L`);
    if (vehicle.EngineCylinders) parts.push(`${vehicle.EngineCylinders}-cylinder`);
    if (vehicle.FuelTypePrimary) parts.push(vehicle.FuelTypePrimary);
    if (vehicle.EngineModel) parts.push(vehicle.EngineModel);
    return [...new Set(parts)].join(" • ");
  };

  const buildTransmission = (vehicle) => {
    const parts = [];
    if (vehicle.TransmissionStyle) parts.push(vehicle.TransmissionStyle);
    if (vehicle.TransmissionSpeeds) parts.push(`${vehicle.TransmissionSpeeds} speed`);
    return [...new Set(parts)].join(" • ");
  };

  vinInput.addEventListener("input", () => {
    const normalized = normalizeVin(vinInput.value).slice(0, 17);
    if (vinInput.value !== normalized) vinInput.value = normalized;
    vinInput.setCustomValidity("");

    if (result.dataset.vin && result.dataset.vin !== normalized) {
      result.removeAttribute("data-vin");
      setResult("idle", "VIN not decoded yet", "Enter all 17 characters, then identify the basic vehicle information.");
    }
  });

  decodeButton.addEventListener("click", async () => {
    const vin = normalizeVin(vinInput.value);

    if (!vinPattern.test(vin)) {
      vinInput.setCustomValidity("Enter a valid 17-character VIN without I, O, or Q.");
      vinInput.reportValidity();
      setResult("error", "Check the VIN", "A modern VIN contains 17 letters and numbers and does not use I, O, or Q.");
      return;
    }

    vinInput.setCustomValidity("");
    decodeButton.disabled = true;
    decodeButton.textContent = "Identifying vehicle…";
    setResult("loading", "Checking NHTSA vehicle data", "This identifies basic vehicle information. Integrity will still verify the exact transmission before quoting or ordering.");

    try {
      const endpoint = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });

      if (!response.ok) throw new Error(`VIN service returned ${response.status}`);

      const payload = await response.json();
      const vehicle = payload?.Results?.[0];

      if (!vehicle || (!vehicle.Make && !vehicle.Model && !vehicle.ModelYear)) {
        throw new Error("No usable vehicle information was returned");
      }

      const vehicleName = [vehicle.ModelYear, vehicle.Make, vehicle.Model, vehicle.Trim]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const engine = buildEngine(vehicle);
      const transmission = buildTransmission(vehicle);

      fillIfBlank(vehicleInput, vehicleName);
      fillIfBlank(engineInput, engine);
      fillDriveIfBlank(vehicle.DriveType);
      fillIfBlank(transmissionInput, transmission);

      const decodedSummary = [
        vehicleName,
        engine && `Engine: ${engine}`,
        vehicle.DriveType && `Drive: ${vehicle.DriveType}`,
        transmission && `NHTSA transmission data: ${transmission}`,
      ].filter(Boolean).join(" | ");

      if (decodedInput) decodedInput.value = decodedSummary;
      result.dataset.vin = vin;
      setResult(
        "success",
        vehicleName || "Vehicle identified",
        `${[engine, vehicle.DriveType, transmission].filter(Boolean).join(" • ") || "Basic VIN data found."} Exact transmission fitment and interchange remain pending Integrity confirmation.`,
      );
    } catch (error) {
      console.warn("VIN decode unavailable", error);
      setResult(
        "error",
        "Automatic identification is temporarily unavailable",
        "You can still submit the VIN and vehicle details. Integrity will identify the application manually before any order is placed.",
      );
    } finally {
      decodeButton.disabled = false;
      decodeButton.textContent = "Identify Vehicle";
    }
  });

  form.addEventListener("submit", (event) => {
    const vin = normalizeVin(vinInput.value);
    vinInput.value = vin;

    if (!vinPattern.test(vin)) {
      event.preventDefault();
      vinInput.setCustomValidity("A valid 17-character VIN is required for a reman transmission quote.");
      vinInput.reportValidity();
      vinInput.focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", initVinDecoder);
