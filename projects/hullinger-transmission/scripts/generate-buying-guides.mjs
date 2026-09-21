import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const header = fs.readFileSync(path.join(siteRoot, "partials/header.html"), "utf8").trim();
const footer = fs.readFileSync(path.join(siteRoot, "partials/footer.html"), "utf8").trim();
const baseUrl = "https://integritydrivetrain.com";

const pages = [
  {
    output: "guides.html",
    path: "/guides",
    title: "Powertrain Knowledge Center | Integrity Drivetrain",
    description: "Practical powertrain guides covering symptoms, diagnosis, reman cost, fitment, freight, core returns, warranties, installation, and replacement choices.",
    eyebrow: "Powertrain Knowledge Center",
    h1: "Understand the symptom, verify the unit, and make the complete decision.",
    lead: "Use these guides to document transmission symptoms, understand responsible diagnosis, and compare fitment, freight, core return, warranty, installation, and replacement choices before money changes hands.",
    hero: "/images/reman-nationwide-shipping-hero.webp",
    heroAlt: "Crated remanufactured transmission prepared for nationwide freight shipment",
    introTitle: "The questions that prevent expensive ordering mistakes.",
    intro: [
      "Buying a transmission online can work well when the application, package contents, delivery requirements, installer obligations, warranty, and core return are all confirmed before payment. A low unit price is not a complete delivered-and-installed price.",
      "These guides explain the commercial details that are easy to miss on a generic marketplace listing. They are written for vehicle owners, repair shops, fleet operators, and project builders who want a documented, VIN-based purchase instead of guessing from year, make, and model alone.",
      "Use the information to prepare for a quote, compare real alternatives, and ask better questions. The written quote and the warranty issued for the exact unit always control the final transaction.",
    ],
    notice: ["Start With the VIN", "A VIN narrows the application, but tags, RPO codes, production dates, calibration, drivetrain, and connector details may still be required before a unit is released."],
    cardsTitle: "Practical guides for symptoms, diagnosis, and the complete purchase.",
    cardsLead: "Start with the problem you are seeing or the buying decision in front of you. Each guide explains what the evidence can show and the next responsible step.",
    cards: [
      { title: "Reman Cost", text: "See what creates the final delivered price, including configuration, package, freight, core, tax, installer work, fluid, cooling, and programming.", href: "/guides/remanufactured-transmission-cost", link: "Understand the full cost" },
      { title: "Reman vs. Rebuilt vs. Used", text: "Compare process, predictability, warranty, lead time, and risk without treating three very different products as interchangeable.", href: "/guides/reman-vs-rebuilt-vs-used-transmission", link: "Compare replacement choices" },
      { title: "Core Returns", text: "Understand deposits, eligibility, deadlines, packaging, pickup, documentation, and the conditions that can reduce or eliminate a refund.", href: "/guides/transmission-core-return", link: "Plan the core return" },
      { title: "Freight & Delivery", text: "Choose commercial dock, forklift, terminal, liftgate, or residential delivery and prepare to inspect a heavy freight shipment correctly.", href: "/guides/shipping-transmission", link: "Prepare for delivery" },
      { title: "Warranty Coverage", text: "Learn how parts, labor, time, mileage, installer requirements, maintenance, authorization, and exclusions work together.", href: "/guides/transmission-warranty-coverage", link: "Read warranty questions" },
      { title: "Identify the Unit", text: "Collect the VIN, transmission tag, RPO or build codes, drivetrain, connectors, calibration, and production details needed for fitment.", href: "/guides/how-to-identify-transmission", link: "Identify your transmission" },
      { title: "Transmission Slipping", text: "Learn what drivers mean by slipping, which details help separate it from a delayed shift or engine problem, and when continued driving can cause more damage.", href: "/guides/transmission-slipping", link: "Document a slipping symptom" },
      { title: "Delayed Drive or Reverse", text: "Work through delayed engagement when selecting Drive or Reverse, including cold-versus-hot behavior, fluid clues, codes, and safe next steps.", href: "/guides/delayed-engagement-drive-reverse", link: "Review delayed engagement" },
      { title: "Shudder or Misfire?", text: "Compare torque-converter or driveline shudder with an engine misfire without replacing parts based on a sensation alone.", href: "/guides/transmission-shudder-vs-engine-misfire", link: "Compare shudder symptoms" },
      { title: "No Reverse", text: "See why a vehicle can retain forward movement while losing Reverse and which scan, fluid, pressure, electrical, and mechanical evidence matters.", href: "/guides/no-reverse-transmission", link: "Investigate loss of Reverse" },
      { title: "All Transmission Symptoms", text: "Compare slipping, delayed engagement, harsh shifts, no movement, shudder, overheating, leaks, noises, and limp mode before choosing a repair path.", href: "/guides/transmission-problems", link: "Open the symptom guide" },
      { title: "CVT Problems", text: "Understand normal versus abnormal CVT behavior, delayed engagement, flare, judder, heat, fail-safe operation, fluid requirements, and next steps.", href: "/guides/cvt-transmission-problems", link: "Review CVT symptoms" },
      { title: "Shipping & Returns", text: "Keep outbound freight, delivery damage, cancellation, convenience returns, wrong or defective units, and refundable core returns in the correct process.", href: "/shipping-returns", link: "Review shipping and returns" },
    ],
    processTitle: "A safer way to move from research to installation.",
    processLead: "The sequence matters. Confirming fitment after a unit ships is too late.",
    process: [
      ["Document the Vehicle", "Collect the VIN, mileage, engine, drivetrain, production details, codes, tags, and current symptoms."],
      ["Confirm the Package", "Review the exact unit, converter or included components, build level, warranty, lead time, freight, and core terms."],
      ["Prepare the Installer", "Verify who will install, program, fill, flush or replace the cooler, perform relearn procedures, and preserve documentation."],
      ["Inspect and Complete", "Inspect the freight before signing, install to the written requirements, register the warranty if required, and return the eligible core on time."],
    ],
    faqs: [
      ["Can I order a transmission using only year, make, and model?", "Not responsibly in many applications. The same model can use different units, calibrations, connectors, ratios, drive configurations, or production changes. VIN and tag-level verification may be necessary."],
      ["Why is the online price not always the complete price?", "The complete amount can include the transmission package, freight, refundable core deposit, tax, liftgate or residential service, fluid, cooler work, programming, and installation."],
      ["Does Integrity sell nationwide?", "Integrity can source and ship supported remanufactured units within the United States when fitment, availability, delivery, core, warranty, and payment requirements are confirmed."],
      ["Can I install the unit myself?", "That depends on the warranty and application. Some programs require a licensed repair facility, documented cooler service, programming, relearn procedures, invoices, and prior authorization for claims."],
      ["Are all remanufactured transmissions built the same way?", "No. Inspection, replacement standards, known-failure corrections, testing, included components, warranty support, and quality controls vary by program and transmission family."],
      ["What should I send for a quote?", "Send the full VIN, mileage, engine, two- or four-wheel drive, transmission tag or build codes when available, delivery ZIP code, commercial or residential delivery type, installer details, and intended vehicle use."],
    ],
    related: [
      ["/reman-transmissions", "Shop Transmissions", "Use the VIN-assisted reman storefront"],
      ["/warranty", "Coverage Overview", "Compare Integrity and reman warranty categories"],
      ["/guides/transmission-problems", "Symptoms", "Review warning signs and next steps"],
    ],
    isHub: true,
  },
  {
    output: "guides/remanufactured-transmission-cost.html",
    path: "/guides/remanufactured-transmission-cost",
    title: "Remanufactured Transmission Cost: Complete Price Guide",
    description: "Learn what affects remanufactured transmission cost, including fitment, build level, freight, core deposit, tax, fluid, programming, and installation.",
    eyebrow: "Reman Transmission Cost",
    h1: "What does a remanufactured transmission really cost?",
    lead: "The useful number is the complete delivered-and-installed cost for the correct application—not a bare unit price disconnected from freight, core, programming, fluid, cooling, and labor.",
    hero: "/images/seo-transmission-replacement-hero.webp",
    heroAlt: "Complete automatic transmission assembly prepared for replacement service",
    introTitle: "Why two quotes for the same vehicle can look far apart.",
    intro: [
      "Transmission pricing changes by exact application, supplier availability, build level, included electronics and converter, warranty program, and current freight. A year and model alone often do not identify those details.",
      "A lower advertised number may exclude the refundable core deposit, delivery services, tax, fluid, cooler work, programming, installation, or a required torque converter. Another quote may include some or all of them. Compare line items, not only headlines.",
      "Integrity prices supported reman transmission packages after fitment and live supplier information are confirmed. That prevents a stale catalog number or guessed freight charge from becoming a false promise.",
    ],
    notice: ["No Responsible Universal Price", "A useful quote needs the VIN, delivery ZIP code and delivery type. Installer, vehicle use, core condition, programming, and supporting parts can change the complete total."],
    cardsTitle: "The six parts of a complete transmission budget.",
    cardsLead: "Ask whether each item is included, separate, refundable, estimated, or still subject to inspection.",
    cards: [
      { title: "Unit & Build Level", text: "Stock replacement, towing, commercial, diesel, performance, and known-failure upgrade packages can use different parts, calibration, testing, and warranty terms.", items: ["Exact transmission family and variation", "Included converter and electronics", "Standard or upgraded configuration"] },
      { title: "Freight", text: "Origin, destination, commercial access, liftgate, residential service, terminal pickup, crate size, and return-core movement affect the freight total.", items: ["Outbound delivery", "Prepaid or separate core return", "Accessorial charges"] },
      { title: "Core Deposit", text: "The core charge is commonly collected up front and refunded only when the correct, eligible, rebuildable core is returned within the written deadline.", items: ["Refundable only if eligible", "Packaging and pickup requirements", "Damage or missing parts may reduce credit"] },
      { title: "Tax", text: "Sales tax depends on the transaction, delivery jurisdiction, taxable items, and the seller's active registrations. It should be calculated through the checkout or written invoice.", items: ["Destination can matter", "Freight and core treatment can vary", "Final invoice controls"] },
      { title: "Installation", text: "Removal and installation labor can include fluid, seals, mounts, cooler service, converter installation, programming, relearn, road testing, and correction of related vehicle faults.", items: ["Installer labor", "Fluids and supporting parts", "Programming and relearn"] },
      { title: "Downtime & Risk", text: "Lead time, diagnostic certainty, warranty labor terms, installer capability, and the cost of receiving the wrong unit all affect the real economic choice.", items: ["Build and transit time", "Return or restocking exposure", "Warranty claim support"] },
    ],
    processTitle: "How to compare quotes on equal terms.",
    processLead: "Make every seller answer the same questions before deciding which number is actually lower.",
    process: [
      ["Verify Fitment", "Match the VIN, tag, drivetrain, engine, production details, and calibration—not only the vehicle description."],
      ["Normalize Line Items", "List unit, converter, freight, core, tax, fluid, cooler work, programming, installation, and optional upgrades separately."],
      ["Read the Warranty", "Compare time, mileage, labor reimbursement, installer requirements, exclusions, authorization, and nationwide support."],
      ["Confirm Final Terms", "Use a written quote with current availability, delivery method, core deadline, and responsibilities before payment."],
    ],
    faqs: [
      ["Why do remanufactured transmission prices change?", "Supplier cost, inventory, core availability, build level, included components, warranty, and freight can change. A current VIN-matched quote is more reliable than a static price copied from an old catalog."],
      ["Is the core deposit part of the transmission price?", "It is usually collected with the order but may be refundable after an eligible matching core is returned on time and accepted under the written policy."],
      ["Does a reman transmission price include installation?", "Not unless the quote explicitly says so. Online unit prices usually exclude removal, installation, fluid, cooler work, programming, relearn, and related vehicle repairs."],
      ["Is the torque converter included?", "Many complete automatic-transmission programs include or require an approved converter, but package contents vary. The written quote should identify it."],
      ["Can freight be quoted without an address?", "A ZIP code and delivery type are normally required. Commercial dock or forklift delivery can price differently from residential liftgate or limited-access service."],
      ["How do I get an exact price from Integrity?", "Use the VIN lookup or quote form and provide delivery ZIP code, delivery type, vehicle use, installer information, and any available transmission tag or build codes."],
    ],
    related: [
      ["/reman-transmissions", "Live Quote", "Check VIN-matched reman options"],
      ["/guides/shipping-transmission", "Freight", "Choose the right delivery service"],
      ["/guides/transmission-core-return", "Core Deposit", "Protect the refundable core credit"],
    ],
  },
  {
    output: "guides/reman-vs-rebuilt-vs-used-transmission.html",
    path: "/guides/reman-vs-rebuilt-vs-used-transmission",
    title: "Reman vs Rebuilt vs Used Transmission: Key Differences",
    description: "Compare remanufactured, rebuilt, and used transmissions by process, testing, warranty, fitment, price, lead time, and long-term replacement risk.",
    eyebrow: "Compare Transmission Options",
    h1: "Remanufactured, rebuilt, or used: which transmission makes sense?",
    lead: "The labels describe different products and different kinds of risk. Compare what was inspected, corrected, tested, documented, and warranted—not simply whether the unit shifts today.",
    hero: "/images/rebuild-options-hero.webp",
    heroAlt: "Transmission components arranged during a professional rebuild process",
    introTitle: "Three paths, three very different evidence standards.",
    intro: [
      "A used transmission normally carries the wear, service history, and failure exposure of the donor vehicle. A rebuilt transmission is disassembled and repaired to a scope determined by the rebuilder and the condition of that core. A remanufactured unit is processed through a defined production program intended to restore the complete unit to that program's specifications.",
      "None of those labels alone guarantees quality. A responsible comparison asks who performed the work, what parts and known-failure areas were addressed, how the valve body and electronics were handled, what testing was completed, and exactly what the written warranty supports.",
      "The best choice depends on the vehicle's value, intended use, downtime, exact application, installer capability, core condition, and how much uncertainty the owner is willing to accept.",
    ],
    notice: ["Ask for the Written Scope", "Words such as rebuilt, remanufactured, tested, upgraded, and warrantied can mean different things. Package contents and written terms matter more than the label."],
    cardsTitle: "How the three replacement paths differ.",
    cardsLead: "Use the same decision categories for every option so a low purchase price does not hide a higher total risk.",
    cards: [
      { title: "Remanufactured", text: "A complete unit is disassembled, cleaned, inspected, updated as required by the program, reassembled, and tested using repeatable production controls.", items: ["Defined process across units", "Known-failure corrections may be standardized", "Often broader nationwide warranty options"] },
      { title: "Rebuilt", text: "The original or supplied core is disassembled and rebuilt to the shop's documented scope, with reusable hard parts evaluated after teardown.", items: ["Scope can be tailored to the application", "Core condition changes final cost", "Quality depends on parts, measurement, and workmanship"] },
      { title: "Used", text: "A salvage or take-out unit is installed with its existing mileage, wear, calibration, and unknown service history unless documented otherwise.", items: ["Often lowest initial unit price", "Fast when the exact unit is available", "Highest uncertainty about remaining service life"] },
      { title: "Testing", text: "A road test in a donor vehicle, a bench air check, hydraulic or valve-body testing, and end-of-line dynamometer testing are not equivalent evidence.", items: ["Ask what was actually tested", "Confirm electronics and valve-body process", "Request documented results when offered"] },
      { title: "Warranty", text: "Time and mileage are only part of coverage. Labor reimbursement, installer qualifications, maintenance, authorization, shipping, and excluded causes change the practical value.", items: ["Parts versus labor", "Local versus nationwide support", "Claim procedure and caps"] },
      { title: "Total Risk", text: "Consider wrong-part returns, repeat labor, towing, downtime, programming, freight, core obligations, and the chance that an external vehicle problem damages the replacement.", items: ["Complete installed cost", "Vehicle value and intended use", "Ability to absorb a second repair"] },
    ],
    processTitle: "Choose based on evidence and use.",
    processLead: "A daily driver, fleet truck, tow vehicle, restoration, and short-term resale do not have the same priorities.",
    process: [
      ["Define the Goal", "Document vehicle value, expected ownership, annual mileage, towing, payload, modifications, performance, and acceptable downtime."],
      ["Verify the Unit", "Confirm exact fitment, mileage or rebuild/reman process, included components, test method, lead time, and return terms."],
      ["Compare Coverage", "Read the complete warranty and installer obligations, not only the headline duration."],
      ["Price the Whole Job", "Include freight, core, fluid, cooler service, programming, installation, tax, and repeat-labor exposure."],
    ],
    faqs: [
      ["Is remanufactured always better than rebuilt?", "Not automatically. A high-quality application-specific rebuild can be an excellent solution, while remanufacturing offers a repeatable program and often broader support. Compare the actual process and warranty."],
      ["Is a used transmission a bad choice?", "It can be reasonable for a low-value vehicle or short-term need when exact fitment, mileage, testing, return rights, and labor risk are acceptable. The remaining service life is inherently uncertain."],
      ["Does rebuilt mean every part is new?", "No. Rebuilding normally replaces wear items and damaged or out-of-spec parts while reusing acceptable hard parts. The written build scope should explain what is included."],
      ["Does remanufactured mean factory new?", "No. A remanufactured unit uses a previously manufactured core processed to the remanufacturer's defined standards. It is not a brand-new original-equipment transmission unless explicitly sold as one."],
      ["Which option usually has the best warranty?", "Professionally remanufactured programs often offer broader nationwide coverage, but terms vary. A shorter well-supported warranty can be more useful than a longer warranty with narrow labor coverage or difficult claim requirements."],
      ["Can external vehicle problems damage any replacement?", "Yes. Cooler contamination, wiring faults, low voltage, programming errors, incorrect fluid, engine problems, driveline issues, overheating, and installation mistakes can damage reman, rebuilt, or used units."],
    ],
    related: [
      ["/reman-transmissions", "Reman Options", "Check supported VIN-matched units"],
      ["/services/transmission-rebuild", "Rebuilding", "See what a responsible rebuild includes"],
      ["/guides/transmission-warranty-coverage", "Warranty", "Compare practical coverage details"],
    ],
  },
  {
    output: "guides/transmission-core-return.html",
    path: "/guides/transmission-core-return",
    title: "Transmission Core Return Guide: Deposit, Freight & Refund",
    description: "Protect your transmission core refund with the correct unit, complete parts, proper fluid drainage, secure packaging, on-time pickup, and documentation.",
    eyebrow: "Transmission Core Returns",
    h1: "How a transmission core return works—and how to protect the refund.",
    lead: "The core deposit is not an automatic rebate. It is security for the correct, complete, rebuildable transmission returning in the required container, condition, and time window.",
    hero: "/images/reman-nationwide-shipping-hero.webp",
    heroAlt: "Heavy-duty freight crate used to deliver and return a remanufactured transmission",
    introTitle: "Why suppliers require a core.",
    intro: [
      "Remanufacturing depends on a supply of correct rebuildable housings and hard parts. The core deposit encourages the removed transmission to return to the program instead of disappearing, being scrapped, or arriving as a different application.",
      "The deposit is normally collected with the order and evaluated after the returned core is received. Wrong units, broken cases, fire or water damage, missing major components, disassembly, late return, improper packaging, and freight damage can affect eligibility.",
      "The exact written core policy controls. Before ordering, know the deadline, who schedules pickup, whether return freight is prepaid, which container must be reused, and what documentation proves the shipment was tendered on time.",
    ],
    notice: ["Do Not Disassemble the Core", "Unless the written policy specifically allows it, return the transmission complete and assembled. Removing valve bodies, electronics, pumps, converters, hard parts, or identification can reduce or eliminate credit."],
    cardsTitle: "Six details that determine core credit.",
    cardsLead: "Treat the return as a second freight shipment with its own fitment, condition, packaging, and documentation requirements.",
    cards: [
      { title: "Correct Application", text: "The returned unit normally must match the family or acceptable core specified for the purchased transmission.", items: ["Preserve tags and identification", "Do not substitute another core", "Confirm exceptions in writing"] },
      { title: "Complete Assembly", text: "Major components and housings should remain present and assembled unless the policy says otherwise.", items: ["Case and extension housing", "Valve body and electronics", "Converter if required by the program"] },
      { title: "Rebuildable Condition", text: "Normal internal failure may be acceptable, while broken cases, collision damage, fire, water, heavy corrosion, or prior destructive disassembly may not be.", items: ["Photograph visible damage", "Disclose known case damage", "Do not weld or alter before return"] },
      { title: "Fluid & Openings", text: "Drain the unit as directed, install plugs or caps, secure the pan, and prevent leaks that can damage the crate or cause a carrier refusal.", items: ["Use approved drain procedure", "Cap cooler and vent openings", "Absorb residual fluid safely"] },
      { title: "Original Packaging", text: "Reuse the supplied crate, pallet, brackets, bag, straps, fasteners, and protective material exactly as the return instructions require.", items: ["Center and restrain the unit", "Keep weight inside the pallet", "Do not use a damaged container"] },
      { title: "Deadline & Proof", text: "Schedule pickup early enough to meet the written return window and keep photos, bill of lading, pickup number, tracking, and delivery confirmation.", items: ["Know when the clock starts", "Record carrier handoff", "Follow up until received and inspected"] },
    ],
    processTitle: "A core-return workflow that preserves evidence.",
    processLead: "Complete these steps before the installer discards packaging or moves the removed unit out of reach.",
    process: [
      ["Read the Policy", "Confirm eligible core, deadline, converter requirement, return freight, packaging, pickup method, and refund timing."],
      ["Inspect and Photograph", "Capture identification, all sides, case condition, major components, fluid drainage, and the empty return container."],
      ["Package and Schedule", "Secure the complete core in the required container and arrange pickup through the specified channel before the deadline."],
      ["Track the Credit", "Keep the bill of lading and tracking; verify receipt, inspection outcome, and refund posting against the original payment."],
    ],
    faqs: [
      ["Is a core deposit refundable?", "It is potentially refundable when the correct eligible core is returned complete, packaged correctly, within the deadline, and accepted under the written policy."],
      ["Can I return a different transmission core?", "Usually not unless the supplier approves that exact substitute in writing. Similar appearance does not prove the core is acceptable."],
      ["What if the old transmission has internal damage?", "Ordinary internal failure is often why a core exists and may be acceptable. Broken cases, missing parts, fire, flood, corrosion, or destructive damage can change eligibility."],
      ["Should the torque converter be returned?", "Some programs require it and others do not. Follow the unit-specific instructions; do not assume."],
      ["Who pays return freight?", "It may be prepaid, included in round-trip freight, deducted from the core, or paid separately. The quote and core policy should state the arrangement."],
      ["How long does the refund take?", "Timing depends on transit, receiving, inspection, approval, and payment processing. Keep proof of pickup and ask what event starts the stated refund window."],
    ],
    related: [
      ["/guides/shipping-transmission", "Freight", "Prepare the outbound and return shipments"],
      ["/guides/remanufactured-transmission-cost", "Complete Cost", "See how the core affects cash due"],
      ["/customer-policies", "Customer Terms", "Review current purchase and return policies"],
    ],
  },
  {
    output: "guides/shipping-transmission.html",
    path: "/guides/shipping-transmission",
    title: "Shipping a Transmission: Freight, Delivery & Inspection",
    description: "Plan safe transmission freight with commercial dock, forklift, terminal, liftgate, or residential delivery, plus shipment inspection and core return steps.",
    eyebrow: "Transmission Freight & Delivery",
    h1: "Shipping a transmission safely starts before the carrier arrives.",
    lead: "A complete transmission is heavy freight, not a parcel. The correct delivery service, unloading equipment, inspection, documentation, and return-core plan prevent avoidable delays and charges.",
    hero: "/images/reman-nationwide-shipping-hero.webp",
    heroAlt: "Crated powertrain unit secured on a pallet for commercial freight delivery",
    introTitle: "Choose the delivery scope that matches the destination.",
    intro: [
      "The least expensive freight option usually assumes a commercial address with normal tractor-trailer access and a dock or forklift ready to unload. A repair shop can still require liftgate service if it lacks dock-height equipment.",
      "Residential, limited-access, inside-delivery, appointment, redelivery, storage, and liftgate services can add cost. Describing the location accurately before dispatch is better than receiving a carrier bill or refusal at the curb.",
      "Inspect the crate and unit before signing. Damage exceptions on the delivery receipt, clear photographs, and prompt notice preserve evidence for a freight claim. A clean signature can make concealed or visible damage harder to resolve.",
    ],
    notice: ["A Lift Does Not Equal a Dock", "An automotive two-post lift is not freight-unloading equipment. Confirm whether the destination has a dock-height door, forklift, pallet jack plus liftgate, or will use carrier-terminal pickup."],
    cardsTitle: "Common delivery choices and responsibilities.",
    cardsLead: "The correct selection depends on access, equipment, carrier rules, and who will be present to receive the unit.",
    cards: [
      { title: "Commercial Dock", text: "A business address with tractor-trailer access and a dock-height door can usually receive standard commercial freight without a liftgate.", items: ["Confirm receiving hours", "Have staff ready", "Inspect before release"] },
      { title: "Commercial Forklift", text: "A forklift can unload a pallet where there is no dock, but the carrier must be able to position the trailer safely and the business must supply the equipment and operator.", items: ["Verify pallet weight", "Confirm outdoor access", "Do not rely on an engine hoist alone"] },
      { title: "Liftgate Service", text: "A hydraulic liftgate lowers the pallet from trailer height to the ground. A pallet jack and safe hard surface may still be needed to move it.", items: ["Request before dispatch", "Provide a flat unloading area", "Confirm pallet dimensions and weight"] },
      { title: "Residential Delivery", text: "A home address normally requires residential service and often liftgate or appointment service. Carriers may limit access on narrow, steep, gravel, or restricted roads.", items: ["Disclose the location honestly", "Keep pets and traffic clear", "Know where the pallet will be placed"] },
      { title: "Terminal Pickup", text: "Carrier-terminal pickup can avoid residential or accessorial charges when the customer has a suitable truck, trailer, restraints, and unloading plan.", items: ["Confirm terminal hours", "Bring identification and reference", "Secure the load for transport"] },
      { title: "Damage Inspection", text: "Check the pallet, crate, straps, punctures, tilt indicators, leaks, exposed components, and visible case or connector damage before accepting.", items: ["Write exceptions on the receipt", "Photograph before moving", "Notify the seller promptly"] },
    ],
    processTitle: "From quote to core pickup.",
    processLead: "Freight works best when the seller, carrier, receiver, and installer all have the same delivery plan.",
    process: [
      ["Describe the Destination", "Provide ZIP code, business or residential status, hours, access limits, dock or forklift, liftgate need, and a receiving contact."],
      ["Prepare for Arrival", "Track the shipment, reserve unloading equipment, clear a safe area, and give the receiver the inspection instructions."],
      ["Inspect Before Signing", "Examine every side, note visible exceptions on the carrier receipt, take photographs, and keep all packaging."],
      ["Reuse the Container", "After installation, package the eligible core in the supplied container and schedule return pickup under the written core instructions."],
    ],
    faqs: [
      ["Can a transmission ship to my house?", "Often yes, when residential and liftgate requirements are quoted in advance and the road and unloading area are suitable for the carrier. Terminal pickup may be a better option."],
      ["Does a repair shop automatically count as a commercial dock?", "No. It is a commercial address, but standard dock delivery normally requires dock-height access or a forklift. Otherwise liftgate service may still be necessary."],
      ["Will the driver move the transmission into my garage?", "Standard freight is typically curbside or tailgate delivery, not inside placement. Confirm any inside-delivery service in writing before dispatch."],
      ["What should I do if the crate is damaged?", "Photograph it before unloading, describe the damage on the delivery receipt, keep copies, preserve packaging, and notify the seller immediately. Refusal may be appropriate for severe damage after contacting the seller."],
      ["How long does freight take?", "Transit varies by origin, destination, carrier, weather, terminal handling, appointments, and service level. Build or preparation time is separate from transit time."],
      ["Is core-return freight included?", "It depends on the quote. Some rates include round-trip freight or a prepaid return; others price return freight separately. Confirm before purchasing."],
    ],
    related: [
      ["/guides/transmission-core-return", "Core Return", "Package and document the removed unit"],
      ["/guides/remanufactured-transmission-cost", "Complete Cost", "Understand freight in the full price"],
      ["/reman-transmissions", "VIN Quote", "Get live delivery options when available"],
    ],
  },
  {
    output: "guides/transmission-warranty-coverage.html",
    path: "/guides/transmission-warranty-coverage",
    title: "Transmission Warranty Coverage: What to Check Before Buying",
    description: "Compare transmission warranty time, mileage, parts, labor, installer rules, maintenance, authorization, exclusions, transferability, and claim support.",
    eyebrow: "Transmission Warranty Guide",
    h1: "A transmission warranty is only as useful as its written coverage and claim process.",
    lead: "Three years can mean very different protection depending on mileage limits, labor reimbursement, installer requirements, excluded causes, authorization, maintenance records, and who supports the claim.",
    hero: "/images/warranty-coverage-hero.webp",
    heroAlt: "Transmission technician documenting inspection details for warranty support",
    introTitle: "Compare practical protection, not headline duration.",
    intro: [
      "A warranty may cover replacement parts while excluding removal and installation labor, fluids, diagnostics, towing, rental vehicles, freight, programming, or consequential damage. Another program may reimburse approved labor up to a stated rate and number of hours.",
      "Coverage also depends on installation and vehicle conditions. Cooler contamination, incorrect fluid, overheating, external electrical faults, modifications, commercial duty, tuning, improper programming, or continued driving after a warning can affect a claim.",
      "Read the complete warranty before installation. Keep the sales invoice, installer invoice, mileage, fluid specification, cooler-service documentation, programming or relearn records, and maintenance history. Obtain authorization before removing or disassembling a suspected failed unit when required.",
    ],
    notice: ["The Unit-Specific Warranty Controls", "Website summaries are educational. The written warranty issued for the exact supplier, package, vehicle use, purchaser, and installation date is the binding source of coverage."],
    cardsTitle: "Eight lines of fine print that matter in real life.",
    cardsLead: "A long term is valuable only when the covered event, responsible parties, and claim steps are clear.",
    cards: [
      { title: "Time & Mileage", text: "Coverage may end at the first of a time limit or mileage limit, while some programs advertise unlimited mileage for qualifying use.", items: ["Start date and registration", "Mileage documentation", "Commercial or fleet limitations"] },
      { title: "Parts Coverage", text: "Confirm whether the remedy is repair, replacement, supplier-selected parts, or credit, and who owns the diagnostic and return decision.", items: ["Covered internal components", "Converter and electronics", "Replacement versus repair discretion"] },
      { title: "Labor Coverage", text: "Labor may be excluded, capped, reimbursed at a stated rate, or limited to published hours after approval.", items: ["Hourly-rate cap", "Allowed labor time", "Customer responsibility for the balance"] },
      { title: "Installer Rules", text: "Some warranties require a licensed repair facility and detailed invoices showing cooler service, fluid, programming, and other installation steps.", items: ["Qualified installer", "Written installation invoice", "Required supporting parts and procedures"] },
      { title: "Maintenance", text: "Fluid type, level procedure, service intervals, cooling, leaks, and vehicle operating conditions can be warranty obligations.", items: ["Correct approved fluid", "Maintenance receipts", "Overheat and leak response"] },
      { title: "Authorization", text: "The warrantor may require diagnosis, codes, pressure data, fluid or pan inspection, photographs, and prior approval before removal or teardown.", items: ["Call before disassembly", "Preserve evidence", "Follow shipping instructions"] },
      { title: "Exclusions", text: "External failures, abuse, racing, tuning, overloading, collision, contamination, incorrect installation, and unauthorized repair commonly require special review or are excluded.", items: ["Vehicle modifications", "Related system failures", "Commercial and off-road use"] },
      { title: "Transfer & Geography", text: "Coverage may be limited to the original purchaser or vehicle and can differ across the United States, Canada, or other locations.", items: ["Transferability", "Nationwide claim network", "Freight and travel responsibility"] },
    ],
    processTitle: "Protect coverage from day one.",
    processLead: "Most claim problems begin with missing documentation, skipped installation requirements, or work performed before authorization.",
    process: [
      ["Read Before Purchase", "Compare full written warranties for the exact unit and vehicle use, including labor, exclusions, installer rules, and claim contact."],
      ["Document Installation", "Keep invoices, mileage, cooler procedure, fluid, programming, relearn, supporting parts, scan results, and initial road test."],
      ["Maintain the Vehicle", "Follow the written fluid, inspection, cooling, service, and operating requirements and preserve receipts."],
      ["Stop and Authorize", "If a problem develops, stop additional damage, record symptoms and codes, and contact the warrantor before removal, teardown, or repair."],
    ],
    faqs: [
      ["Does a transmission warranty include labor?", "Not always. Some programs exclude labor; others reimburse approved labor at a capped rate and time. Read the unit-specific terms."],
      ["Who pays for diagnostics?", "Policies vary. Diagnostic time, fluids, towing, rental, programming, freight, and incidental costs may be excluded even when a covered transmission repair is approved."],
      ["Can any shop perform the installation?", "Some programs require a licensed or professional repair facility and a detailed invoice. Confirm installer qualifications before the unit ships."],
      ["Will tuning or towing void the warranty?", "Modified power, nonfactory calibration, racing, overloading, commercial duty, or towing beyond vehicle limits may affect coverage. Disclose use before purchase and follow the written terms."],
      ["What should I do if the replacement transmission has a problem?", "Stop driving if continued operation could cause damage, preserve codes and evidence, verify fluid and external systems without unauthorized disassembly, and contact the warranty administrator for instructions."],
      ["Is a nationwide warranty the same as nationwide free repair?", "No. Nationwide support describes where claims can be handled, but authorization, labor caps, excluded costs, installer requirements, and customer responsibilities still apply."],
    ],
    related: [
      ["/warranty", "Integrity Coverage", "Review current warranty categories"],
      ["/guides/reman-vs-rebuilt-vs-used-transmission", "Compare Units", "See how coverage changes the choice"],
      ["/reman-transmissions", "Shop Reman", "Review VIN-matched warranty options"],
    ],
  },
  {
    output: "guides/how-to-identify-transmission.html",
    path: "/guides/how-to-identify-transmission",
    title: "How to Identify Your Transmission Before Ordering",
    description: "Identify the correct transmission using VIN, tag, RPO or build codes, engine, drivetrain, production date, connectors, calibration, and vehicle configuration.",
    eyebrow: "Transmission Identification",
    h1: "How to identify the correct transmission before ordering a replacement.",
    lead: "Year, make, and model are a starting point—not always a fitment decision. The VIN, unit tag, build codes, drivetrain, production date, connectors, calibration, and hardware must agree.",
    hero: "/images/supported-units-hero.webp",
    heroAlt: "Technician reviewing transmission identification and vehicle application details",
    introTitle: "Why visually similar transmissions can be incompatible.",
    intro: [
      "Manufacturers can use more than one transmission within the same model year and body style. Engine, drive type, axle ratio, gross-weight package, emissions configuration, production split, electronic strategy, and factory options can change the required unit.",
      "A case may bolt to the engine but still have a different internal ratio, output, speed sensor, connector, valve body, control module, calibration, cooler fitting, mount, extension housing, or transfer-case interface. Those differences can cause a no-start, no-communication, incorrect shifts, installation delays, or a nonreturnable special-order problem.",
      "Start with the complete VIN and then confirm secondary identifiers when requested. Do not guess a missing tag from an internet photograph or rely on a marketplace compatibility list without supplier verification.",
    ],
    notice: ["Photograph Before Removal", "Capture the tag, barcode, stamp, connector side, bellhousing, pan, tail or transfer-case interface, cooler fittings, sensors, and overall unit while identification points are still accessible."],
    cardsTitle: "The identifiers that narrow a transmission application.",
    cardsLead: "Not every vehicle uses every identifier, but the correct combination should be preserved before ordering.",
    cards: [
      { title: "VIN", text: "The 17-character vehicle identification number establishes manufacturer, vehicle line, model year, plant, and configuration data used by fitment catalogs.", items: ["Send all 17 characters", "Photograph the dash or label", "Do not post a full VIN publicly"] },
      { title: "Transmission Tag", text: "A barcode label, metal tag, etched code, or case stamp can identify family, build code, serial number, calibration, and production information.", items: ["Clean gently—do not grind", "Photograph straight and close", "Record every line and character"] },
      { title: "RPO or Build Codes", text: "Option labels, build sheets, service data, or manufacturer systems may list transmission, axle, transfer-case, towing, or calibration codes.", items: ["GM RPO labels or digital build data", "Manufacturer build sheets", "Fleet or commercial option packages"] },
      { title: "Engine & Drivetrain", text: "Engine size or code, two- or four-wheel drive, transfer case, axle, and vehicle weight package affect torque capacity, case, output, and calibration.", items: ["Exact engine code", "2WD, AWD, or 4WD", "GVWR, towing, and commercial configuration"] },
      { title: "Production Details", text: "Model-year changes can occur midyear. Door-label build date, transmission build date, plant, and serial break may determine the correct version.", items: ["Month and year built", "Early or late production", "Supersession or update history"] },
      { title: "Physical & Electronic Match", text: "Pan shape is only a clue. Compare bellhousing, mounting, output, connectors, sensors, cooler fittings, valve body, modules, and programming requirements.", items: ["Connector count and keying", "Output and transfer-case pattern", "Module and strategy requirements"] },
    ],
    processTitle: "Build a fitment packet before requesting price.",
    processLead: "Complete information gets a more reliable answer faster and creates a record if the application is questioned later.",
    process: [
      ["Capture Vehicle Data", "Record VIN, year, make, model, engine, drive type, build date, mileage, and intended use."],
      ["Capture Unit Data", "Photograph and transcribe tag, barcode, stamp, connectors, pan, case, output, cooler fittings, and transfer-case interface."],
      ["Check Service Information", "Use manufacturer or supplier catalog data to reconcile production splits, codes, calibration, and superseded part numbers."],
      ["Get Written Confirmation", "Make the quote identify the verified application and preserve the VIN, tag photographs, and supplier response with the order."],
    ],
    faqs: [
      ["Can the VIN identify the transmission by itself?", "Sometimes, but not always. The VIN narrows the vehicle configuration; transmission tags, production splits, build codes, calibration, and physical details may still be required."],
      ["Where is the transmission identification tag?", "Location varies by family. It may be on the case side, bellhousing, pan rail, extension housing, top of the case, or an electronic component. Service information can identify the correct location."],
      ["Can I identify a transmission by pan shape?", "Pan shape can narrow the family, but it is not reliable enough for final ordering because related units can share cases or pans while using different electronics, ratios, outputs, or calibrations."],
      ["What if the tag is missing or unreadable?", "Provide VIN and build data plus clear photographs of the case, connectors, pan, bellhousing, output, sensors, casting numbers, and any remaining stamps. Additional measurement or teardown may be needed."],
      ["Does two-wheel drive versus four-wheel drive matter?", "Yes. Output shafts, extension housings, transfer-case adapters, sensors, and calibration can differ. AWD can be a separate application again."],
      ["Why does the installer need the quote before removing the old unit?", "It preserves accessible identification, allows supporting parts and programming to be planned, and reduces the chance that the vehicle occupies a lift while a wrong or unavailable unit is corrected."],
    ],
    related: [
      ["/reman-transmissions", "VIN Lookup", "Start a verified reman quote"],
      ["/transmissions", "Supported Families", "Review transmission-family information"],
      ["/guides/remanufactured-transmission-cost", "Pricing", "Understand the complete replacement cost"],
    ],
  },
  {
    output: "shipping-returns.html",
    path: "/shipping-returns",
    title: "Reman Unit Shipping, Delivery & Returns | Integrity",
    description: "Understand reman freight, delivery inspection, delays, cancellation timing, authorized returns, wrong or defective units, and the separate core-return process.",
    eyebrow: "Shipping & Returns",
    h1: "Shipping, delivery, cancellations, and returns for reman powertrain units.",
    lead: "Heavy freight, application-specific units, refundable cores, and installer requirements make this different from returning an ordinary parcel. Review the complete path before ordering.",
    hero: "/images/reman-nationwide-shipping-hero.webp",
    heroAlt: "Crated remanufactured transmission prepared for nationwide freight shipment",
    introTitle: "Know which process applies before the unit moves.",
    intro: [
      "Outbound delivery, a refundable core return, a customer-requested convenience return, freight damage, a wrong unit, and a possible warranty claim are separate situations. Each has different evidence, timing, authorization, freight, and refund requirements.",
      "The current written quote identifies the unit, delivery service, freight amount, core arrangement, estimated timing, and warranty offered for that order. The final checkout summary and signed purchase terms control the transaction; this page is a plain-language overview, not a substitute for those records.",
      "Contact Integrity as soon as information changes or a problem appears. Do not install, alter, disassemble, discard packaging, authorize third-party work, or ship a unit back until the applicable written instructions are confirmed.",
    ],
    notice: ["Core Return Is Not a Merchandise Return", "The original core is returned to resolve a refundable deposit. Returning the reman unit itself requires separate authorization and may follow cancellation, convenience-return, freight-damage, fitment, or warranty terms."],
    cardsTitle: "The six shipping and return situations to keep separate.",
    cardsLead: "Identify the situation first, preserve evidence, and obtain the correct written authorization before money or equipment moves again.",
    cards: [
      { title: "Outbound Freight", text: "The freight quote uses the destination and service selected for the order. Residential, liftgate, limited-access, storage, redelivery, and address changes can affect carrier charges.", items: ["Confirm the complete address", "Describe dock or forklift access accurately", "Requote freight after a destination change"] },
      { title: "Delivery Inspection", text: "Inspect the crate and unit before signing. Note visible damage on the carrier receipt, keep the packaging, take clear photographs, and contact Integrity promptly.", items: ["Photograph every side", "Record damage on the delivery receipt", "Keep crate, unit, labels, and documents"] },
      { title: "Delay or Unavailability", text: "Shipping estimates depend on current availability and production. If a material delay occurs, Integrity will provide the available information and the applicable choice to accept the delay or cancel for a prompt refund.", items: ["Estimate is not a carrier guarantee", "Material changes require communication", "Do not schedule installation from an unconfirmed estimate"] },
      { title: "Cancellation", text: "Before the supplier order is placed, a customer-requested cancellation receives a full refund. Once production, special configuration, or shipment begins, documented nonrecoverable charges may apply.", items: ["Contact Integrity immediately", "Timing changes the available remedy", "Written amount and approval before an authorized return"] },
      { title: "Wrong or Defective Unit", text: "A unit that is materially not as described, not the verified application, damaged in freight, or potentially defective is not handled as an ordinary convenience return.", items: ["Stop installation or operation", "Preserve codes, photos, documents, and packaging", "Obtain fitment, carrier, or warranty instructions"] },
      { title: "Refundable Core", text: "The correct, complete original unit must follow the supplied container, authorization, deadline, carrier, and inspection instructions. The approved amount is refunded after acceptance.", items: ["Thirty-day tender deadline for current transmission terms", "Wrong, incomplete, or damaged cores may receive reduced credit", "Refund follows final inspection and approval"] },
    ],
    processTitle: "A safer freight and return sequence.",
    processLead: "The record created at each step protects the customer, Integrity, the carrier, and the warranty process.",
    process: [
      ["Confirm Before Shipment", "Verify application, address, location type, delivery services, installer, core arrangement, timing estimate, package contents, warranty and contact details."],
      ["Inspect at Delivery", "Check the crate and unit, note visible damage before signing, photograph the condition, preserve all materials, and report concerns promptly."],
      ["Pause When Something Is Wrong", "Do not install, run, alter, disassemble, discard, or return-ship the unit until Integrity confirms the fitment, carrier, warranty, or return path in writing."],
      ["Follow the Issued Instructions", "Use the correct authorization, container, carrier, evidence, destination and deadline, then retain tracking and refund records."],
    ],
    faqs: [
      ["Can I return a correctly supplied reman unit because I changed my mind?", "A convenience return may be possible only with written authorization. Production, special configuration, shipment, return freight, supplier charges, restocking, installation, alteration, or damage can limit eligibility or reduce the refund."],
      ["What happens if the verified unit cannot be supplied?", "If Integrity cannot supply the verified unit and you do not accept an offered substitute or material change, the order is canceled and the full amount paid is refunded to the original method."],
      ["What should I do if freight arrives damaged?", "Note visible damage on the carrier receipt before signing, keep the unit and all packaging, take clear photographs, and contact Integrity promptly. Do not install or discard anything while the claim path is reviewed."],
      ["Is the thirty-day deadline a general return window?", "No. It is the current transmission core-return tender deadline for a full core-credit request. It is not a thirty-day merchandise return policy."],
      ["When is an approved refund started?", "Current purchase terms state that Integrity initiates an approved cancellation refund, or an accepted core-credit refund after the final determination, within seven business days. Stripe, the card network, and the financial institution control when the credit appears."],
      ["Where are the binding terms?", "The final checkout summary, the accepted Reman Transmission Purchase Agreement, and the written warranty for the selected unit control. Review them before payment and keep a copy with the order records."],
    ],
    related: [
      ["/legal/reman-policy-bundle-2026-09-04", "Complete Agreement", "Read the binding reman purchase terms"],
      ["/guides/shipping-transmission", "Freight Guide", "Prepare a commercial or residential delivery"],
      ["/guides/transmission-core-return", "Core Returns", "Protect the refundable core credit"],
    ],
    published: "2026-09-21",
  },
  {
    output: "guides/transmission-slipping.html",
    path: "/guides/transmission-slipping",
    title: "Transmission Slipping: Symptoms, Evidence & Next Steps",
    description: "Learn what transmission slipping feels like, what can cause similar symptoms, what evidence to record, and when to stop driving and arrange diagnosis.",
    eyebrow: "Transmission Slipping",
    h1: "Transmission slipping: what it feels like and what to record before diagnosis.",
    lead: "A flare in engine speed, lost acceleration, or an unexpected ratio change can feel like slipping—but the sensation alone does not identify the failed part or prove that the complete transmission needs replacement.",
    hero: "/images/transmission-problems-diagnostics-hero.webp",
    heroAlt: "Technician evaluating an automatic transmission during diagnostic work",
    introTitle: "Describe the event before naming the failure.",
    intro: [
      "Drivers often use the word slipping for several different events: engine speed rises without matching vehicle acceleration, a shift takes too long to complete, the transmission drops out of gear, the converter clutch cycles, or the engine loses power under load. Those events can require very different repairs.",
      "Useful diagnosis starts with the operating conditions. Record which gear or shift is involved, road speed, throttle, temperature, incline, load, warning messages, and whether the event happens cold, hot, once, or repeatedly. Preserve fault codes and freeze-frame data before clearing them.",
      "Low or incorrect fluid, leaks, hydraulic pressure loss, worn friction elements, valve-body problems, solenoids, speed-sensor signals, calibration, converter operation, and engine or driveline faults can overlap. Testing should separate them before repair, rebuild, or replacement is recommended.",
    ],
    notice: ["Stop Before Damage Escalates", "Stop driving if the vehicle loses reliable movement, cannot merge safely, overheats, leaks heavily, smells burned, makes new mechanical noise, or displays a stop-driving warning. Arrange a tow when control or lubrication is uncertain."],
    cardsTitle: "Evidence that makes a slipping complaint useful.",
    cardsLead: "A repeatable description helps a technician reproduce the event and avoid replacing parts from a vague symptom alone.",
    cards: [
      { title: "RPM Versus Road Speed", text: "Note whether engine speed rises sharply while road speed stays flat, whether the event occurs during a specific shift, and whether lifting the throttle changes it.", items: ["Which shift or gear", "Approximate RPM and speed", "Light, moderate, or heavy throttle"] },
      { title: "Cold Versus Hot", text: "Fluid viscosity, seal leakage, control strategy, and component expansion change with temperature. Record time from startup and whether the symptom appears after extended driving.", items: ["First start of the day", "Normal operating temperature", "After towing or traffic"] },
      { title: "Fluid and Leaks", text: "Fluid level and condition must be checked with the correct procedure. The wrong fluid, an incorrect level, or an active leak can affect operation and cause damage.", items: ["Correct temperature and procedure", "Leak location", "Recent service or fluid addition"] },
      { title: "Codes and Data", text: "Transmission, engine, ABS, network, voltage, speed-sensor, ratio, pressure, and solenoid faults can all change shift behavior. Save codes before disconnecting the battery.", items: ["All modules, not only engine", "Freeze-frame information", "Commanded and actual gear"] },
      { title: "Operating Load", text: "Grade, payload, towing, tire size, tuning, engine output, and converter state can expose a problem that does not appear during an unloaded shop drive.", items: ["Trailer or payload", "Road grade and speed", "Modifications or recent work"] },
      { title: "What It Is Not", text: "Wheelspin, traction-control intervention, an engine misfire, throttle reduction, converter-clutch cycling, or a driveline vibration may be described as slipping even when the transmission ratio is correct.", items: ["Warning lights or traction event", "Engine stumble or flashing lamp", "Vibration without RPM flare"] },
    ],
    processTitle: "Move from symptom to repair decision.",
    processLead: "The right sequence protects the vehicle and keeps a preliminary symptom from becoming an expensive assumption.",
    process: [
      ["Preserve the Event", "Record conditions, video the gauges only if a passenger can do so safely, save codes, and note recent service or repairs."],
      ["Check the Basics Correctly", "Inspect for leaks, verify fluid by the manufacturer procedure, check battery/charging health, and review related engine or network faults."],
      ["Reproduce and Measure", "Use a controlled road test and scan data, then perform pressure, electrical, pan, cooler-flow, or other tests appropriate to the application."],
      ["Choose the Narrowest Sound Repair", "Compare external repair, valve-body or control work, overhaul, reman replacement, vehicle value, warranty, downtime, and contamination risk."],
    ],
    faqs: [
      ["Can low transmission fluid cause slipping?", "Yes, an incorrect level or loss of fluid can affect hydraulic pressure and lubrication, but the correct checking procedure varies. Driving with a leak or low level can rapidly increase damage."],
      ["Does slipping mean I need a new transmission?", "Not automatically. The cause could be external, electrical, hydraulic, calibration-related, converter-related, or internal. The repair decision should follow application-specific testing."],
      ["Will changing the fluid fix a slipping transmission?", "Fluid service can correct an improper fluid or maintenance issue in some cases, but it does not restore worn friction material or damaged hardware. Service should follow diagnosis and the correct specification."],
      ["Why does it slip only when hot?", "Heat can change fluid viscosity, clearances, electrical behavior, control strategy, and leakage across worn hydraulic circuits. Hot-only behavior is useful evidence, not a diagnosis by itself."],
      ["Can an engine problem feel like transmission slipping?", "Yes. A misfire, airflow or fuel problem, throttle intervention, or reduced engine torque can create poor acceleration. Scan data should compare engine torque, RPM, vehicle speed, and commanded gear."],
      ["What information should I send for help?", "Provide the VIN, mileage, exact symptom, gear or shift, temperature, speed, load, warning messages, all stored codes, recent work, leaks, modifications, and whether the vehicle still moves reliably."],
    ],
    related: [
      ["/guides/transmission-problems", "Symptom Guide", "Compare other transmission warning signs"],
      ["/services/transmission-repair", "Local Diagnosis", "Arrange Springfield-area transmission service"],
      ["/reman-transmissions", "Replacement Options", "Check VIN-matched reman availability"],
    ],
    published: "2026-09-21",
  },
  {
    output: "guides/delayed-engagement-drive-reverse.html",
    path: "/guides/delayed-engagement-drive-reverse",
    title: "Delayed Engagement Into Drive or Reverse: What to Check",
    description: "Understand delayed transmission engagement into Drive or Reverse, the details that narrow the cause, and when to stop driving and seek diagnosis.",
    eyebrow: "Delayed Engagement",
    h1: "A delay into Drive or Reverse is a symptom—timing and conditions reveal the pattern.",
    lead: "If the vehicle pauses after a range is selected and then engages with a bump, the seconds, temperature, fluid condition, selected range, slope, and recent service history matter more than a general description.",
    hero: "/images/seo-transmission-repair-hero.webp",
    heroAlt: "Automatic transmission on a professional repair bench",
    introTitle: "Do not cover a delay by raising engine speed.",
    intro: [
      "A brief manufacturer-defined engagement time can be normal, especially during particular cold-start strategies, but a new or worsening delay deserves attention. Revving the engine while waiting can make the eventual engagement harsher and increase stress on clutches, shafts, mounts, and driveline parts.",
      "The pattern may point toward fluid drain-back, low fluid, filter or pickup problems, a worn seal or clutch circuit, valve-body leakage, a sticking control valve, solenoid or electrical commands, converter fill, linkage or range recognition, or an application-specific control issue. Reverse and forward circuits do not use every component in the same way.",
      "Measure the delay from selecting the range until the vehicle clearly takes load. Record whether it occurs after an overnight park, after a hot soak, on an incline, only in Reverse, or in both Drive and Reverse.",
    ],
    notice: ["Avoid Repeated Neutral Drops", "Do not rev the engine in Neutral or Park and then select a drive range to force engagement. If normal idle engagement is unreliable, park safely and arrange diagnosis or towing."],
    cardsTitle: "Details that separate delayed-engagement patterns.",
    cardsLead: "Small observations can distinguish a fluid-level or drain-back concern from a range-specific hydraulic, electrical, or internal problem.",
    cards: [
      { title: "Length of Delay", text: "Count the time at normal idle from range selection to a definite load. Note whether it is consistent, intermittent, or getting longer.", items: ["Seconds at normal idle", "Gentle or harsh engagement", "First attempt or every attempt"] },
      { title: "Drive, Reverse, or Both", text: "A delay limited to one range can narrow which clutch elements, servos, valves, circuits, or commands deserve testing.", items: ["Reverse only", "Drive only", "Both forward and reverse"] },
      { title: "Cold, Hot, and Park Time", text: "An overnight delay that disappears after the first engagement differs from a hot-idle delay after extended driving.", items: ["Hours parked", "Ambient and operating temperature", "Restart after a short or long soak"] },
      { title: "Fluid Procedure", text: "Some units use a dipstick while others require a temperature-specific level plug or scan procedure. Guessing the level can create an overfill or underfill.", items: ["Correct fluid specification", "Specified temperature", "Engine running and range procedure"] },
      { title: "Range Recognition", text: "The instrument display, manual linkage, range sensor, brake input, network messages, and control-module data should agree with the selected range.", items: ["Correct gear displayed", "Shifter/linkage condition", "Range and communication faults"] },
      { title: "Recent Work", text: "A fluid service, cooler repair, battery event, module programming, engine work, transmission installation, or collision can change the diagnostic starting point.", items: ["Date and mileage of work", "Parts and fluid used", "Symptom before versus after"] },
    ],
    processTitle: "Diagnose the delay without creating a second problem.",
    processLead: "Start with repeatable observations and noninvasive checks before deciding that the complete unit has failed.",
    process: [
      ["Park Safely", "Use the parking brake, avoid grades and traffic, allow normal idle, and stop attempts if engagement becomes violent or movement is unpredictable."],
      ["Document the Pattern", "Record delay length, selected range, temperature, park time, fluid evidence, warning messages, codes, and recent work."],
      ["Verify Controls and Hydraulics", "Confirm range input, fluid level/specification, leaks and scan data; perform pressure, drain-back, pan or circuit tests when justified."],
      ["Match the Repair to the Cause", "Correct an external or control problem when supported; compare rebuild or reman replacement only when internal evidence and total cost justify it."],
    ],
    faqs: [
      ["Is a one-second delay normal?", "Acceptable engagement time varies by transmission, temperature, software strategy, vehicle condition, and manufacturer procedure. A change from the vehicle's established behavior is worth documenting."],
      ["Why does Reverse engage later than Drive?", "Reverse can use different clutch elements, hydraulic circuits, pressure commands, and valve-body passages. A Reverse-only delay narrows testing but does not identify one universal failed part."],
      ["Why is the delay worse after sitting overnight?", "Fluid drain-back, converter or circuit refill, seal leakage, filter/pickup concerns, temperature, and control strategy can contribute. The first-start pattern should be reproduced and measured."],
      ["Can I add a transmission additive?", "An additive is not a substitute for confirming level, specification, codes, pressure, and the cause. Products outside the required fluid specification can create compatibility or warranty problems."],
      ["Should I keep driving if it eventually engages?", "Not if movement is unpredictable, the delay is worsening, engagement is harsh, there is a leak or warning, or safe entry into traffic cannot be assured. Continued operation may increase damage."],
      ["What should a repair shop know?", "Share the VIN, mileage, exact delay in each range, temperature, park duration, slope, fluid/service history, codes, warning messages, leaks, and any recent electrical or driveline work."],
    ],
    related: [
      ["/guides/transmission-slipping", "Slipping", "Compare delayed engagement with ratio flare"],
      ["/guides/transmission-problems", "All Symptoms", "Review other warning signs"],
      ["/services/transmission-repair", "Diagnosis", "Schedule Springfield-area testing"],
    ],
    published: "2026-09-21",
  },
  {
    output: "guides/transmission-shudder-vs-engine-misfire.html",
    path: "/guides/transmission-shudder-vs-engine-misfire",
    title: "Transmission Shudder vs Engine Misfire: How to Tell",
    description: "Compare transmission or torque-converter shudder with an engine misfire using operating conditions, scan data, codes, and safe diagnostic steps.",
    eyebrow: "Shudder vs. Misfire",
    h1: "Transmission shudder or engine misfire? The sensation is only the starting point.",
    lead: "A vibration under light acceleration can come from converter-clutch operation, the engine, mounts, axles, tires, driveline angles, or road input. Replacing a transmission from feel alone is an expensive way to guess.",
    hero: "/images/seo-torque-converter-hero.webp",
    heroAlt: "Torque converter and transmission components inspected during diagnosis",
    introTitle: "Use the operating window to separate overlapping symptoms.",
    intro: [
      "Torque-converter clutch shudder is often described as driving over a rumble strip during light throttle when the clutch is applying or modulating. An engine misfire can produce a similar shake under load, and modern controls may unlock the converter or change line pressure in response, making the original cause harder to feel.",
      "Driveline vibrations can also follow road speed rather than engine load. Tires, wheels, axles, universal joints, CV joints, mounts, propeller shafts, differentials, and transfer cases should remain in the comparison when the data does not show a ratio or combustion problem.",
      "A controlled test uses scan data to compare misfire counters, commanded converter-clutch state, converter slip speed, engine load, selected gear, input/output speeds, and the exact moment the vibration begins and ends.",
    ],
    notice: ["A Flashing Engine Light Is Urgent", "Reduce load and stop driving when the malfunction indicator flashes or the engine is severely misfiring. Unburned fuel can damage the catalytic converter, and unstable power can make continued driving unsafe."],
    cardsTitle: "Clues that help locate the vibration.",
    cardsLead: "No single clue proves the cause, but several measurements that change together can support the next test.",
    cards: [
      { title: "Engine Load", text: "A misfire may appear under load in more than one gear, while converter behavior often occurs in a narrower speed, gear, temperature, and clutch-command window.", items: ["Light versus heavy throttle", "Same RPM in another gear", "Uphill or towing sensitivity"] },
      { title: "Converter Command", text: "Compare the vibration with commanded clutch apply/release and measured slip speed. The command alone does not prove the converter is healthy or faulty.", items: ["Commanded clutch state", "Slip RPM during event", "Fluid temperature and gear"] },
      { title: "Misfire Data", text: "Current and history codes, cylinder misfire counters, fuel trims, ignition data, injector balance, and compression evidence can identify an engine-side cause.", items: ["All-cylinder versus one-cylinder", "Pending and history codes", "Load and fuel-trim pattern"] },
      { title: "Road Speed", text: "A vibration that remains at the same road speed while engine RPM or selected gear changes may point toward wheels, shafts, axles, joints, or another rotating driveline component.", items: ["Speed-dependent frequency", "Coast versus power", "Gear and RPM changes"] },
      { title: "Recent Service", text: "Fluid, plugs, coils, injectors, tires, driveshaft, suspension, mounts, software, or engine repairs can move the diagnostic starting point.", items: ["What changed and when", "Correct parts and specifications", "Symptom before and after"] },
      { title: "Fluid and Contamination", text: "Incorrect or degraded fluid, cooler contamination, clutch material, and hydraulic-control problems can affect converter operation, but service should follow application-specific evidence.", items: ["Correct fluid and level", "Pan or sample findings", "Service and overheating history"] },
    ],
    processTitle: "Separate the systems before authorizing repair.",
    processLead: "A repeatable test route and synchronized data are more useful than a parts-swapping sequence.",
    process: [
      ["Define the Window", "Record speed, RPM, gear, throttle, grade, temperature, load, duration, warning lights, and whether the vibration occurs on coast."],
      ["Scan the Whole Vehicle", "Preserve engine, transmission, ABS, transfer-case and network faults plus freeze-frame and misfire information."],
      ["Compare Commands and Results", "Observe converter command/slip, gear ratios, misfire counters and engine torque while safely reproducing the event."],
      ["Confirm Before Repair", "Use the appropriate ignition, fuel, compression, mount, driveline, fluid, hydraulic or converter test before selecting parts."],
    ],
    faqs: [
      ["What does torque-converter shudder feel like?", "It is often described as a brief rumble-strip sensation during light-throttle converter-clutch operation, but that description is not exclusive to the converter."],
      ["Can a bad ignition coil feel like a transmission problem?", "Yes. A weak coil or other misfire cause may appear only under load and feel like a shudder, hesitation, harsh shift, or converter issue."],
      ["Does a converter code prove the converter is bad?", "No. Codes identify a monitored condition or control result. Fluid, valve-body, solenoid, wiring, calibration, pressure, engine and internal transmission causes may need testing."],
      ["Will a fluid service cure shudder?", "It can help when the problem is specifically related to fluid condition or specification and no damage is present, but it will not repair every converter, hydraulic, engine, or driveline fault."],
      ["Why does the vibration stop when I press the brake lightly?", "Some vehicles release the converter clutch with brake input, which can be a useful diagnostic clue. It is not a safe DIY test in traffic and does not by itself prove which component failed."],
      ["When should I stop driving?", "Stop for a flashing engine light, severe misfire, overheating, loss of power, unsafe vibration, burning odor, major leak, mechanical noise, or an inability to maintain safe speed."],
    ],
    related: [
      ["/services/torque-converter", "Torque Converter", "See the local diagnostic and repair pathway"],
      ["/guides/transmission-problems", "Symptom Guide", "Compare shudder with other warning signs"],
      ["/reman-transmissions", "Reman Options", "Check supported replacement units after diagnosis"],
    ],
    published: "2026-09-21",
  },
  {
    output: "guides/no-reverse-transmission.html",
    path: "/guides/no-reverse-transmission",
    title: "Transmission Has No Reverse but Drives Forward: Causes",
    description: "Learn why a vehicle can lose Reverse while forward gears still work, what evidence matters, and how diagnosis separates controls from internal damage.",
    eyebrow: "No Reverse",
    h1: "No Reverse but forward gears still work: what that pattern can—and cannot—prove.",
    lead: "Losing one range can narrow the diagnostic path, but the exact components differ across transmission families. Range input, fluid, electronics, hydraulics, hard parts, and driveline load all need the right checks.",
    hero: "/images/seo-bench-rebuild-hero.webp",
    heroAlt: "Disassembled automatic transmission components arranged for inspection",
    introTitle: "The vehicle can move forward even when a Reverse-specific path cannot apply.",
    intro: [
      "Automatic transmissions combine different clutches, bands, brakes, one-way devices, planetary elements, valves, solenoids, and pressure commands for each range. Reverse may rely on a component or circuit that is not required for the forward ranges the driver is using.",
      "The same complaint can also come from low or incorrect fluid, a manual linkage or range-sensor problem, control-module commands, wiring, valve-body leakage, a failed servo or apply component, a broken hard part, or an external driveline condition. Some units have well-known patterns, but the unit must be identified before applying them.",
      "Do not repeatedly raise engine speed or cycle ranges to force the vehicle backward. A sudden engagement can cause a collision, and repeated attempts can circulate debris or worsen internal damage.",
    ],
    notice: ["Plan Recovery Before Testing", "If Reverse is unreliable, park where the vehicle can leave safely without backing. Use the parking brake, keep people clear, and arrange professional recovery rather than forcing engagement."],
    cardsTitle: "Evidence that narrows a no-Reverse complaint.",
    cardsLead: "The exact transmission family and behavior in every manual range determine which tests belong next.",
    cards: [
      { title: "Exact Unit", text: "Use VIN, tag, RPO or build code, engine, drivetrain, production split, and calibration to identify the transmission before relying on a failure pattern.", items: ["All 17 VIN characters", "Transmission tag or stamp", "2WD, AWD, or 4WD"] },
      { title: "Range Display and Linkage", text: "Confirm the shifter reaches the correct detent and the vehicle and scan tool recognize Reverse. Mechanical linkage and electronic range input can disagree.", items: ["Correct indicator", "Cable/linkage movement", "Range-sensor data and codes"] },
      { title: "Cold and Hot Behavior", text: "Record whether Reverse works cold, hot, after a delay, with throttle, on level ground, or only after another range is selected.", items: ["Time to engage", "Temperature and park time", "Bump, flare, noise, or no load"] },
      { title: "Other Gears", text: "Manual low ranges, engine braking, specific upshifts, limp mode, and forward engagement can reveal which shared elements still operate.", items: ["All forward shifts", "Manual range behavior", "Engine braking and limp mode"] },
      { title: "Fluid and Pan Evidence", text: "Correct fluid level/specification, leaks, odor, discoloration, clutch material and metal can change both the urgency and likely repair scope.", items: ["Manufacturer checking procedure", "Leak or recent service", "Debris type and amount"] },
      { title: "Pressure and Commands", text: "Application-specific pressure tests, solenoid commands, speed data, electrical checks, and hydraulic diagrams can separate control loss from an internal apply failure.", items: ["Commanded versus actual range", "Line or circuit pressure", "Wiring and solenoid integrity"] },
    ],
    processTitle: "Use the range pattern to choose the right test.",
    processLead: "Avoid turning a diagnostic clue into a universal parts list.",
    process: [
      ["Identify and Secure", "Confirm the unit and park safely where Reverse is not required for vehicle recovery."],
      ["Preserve Codes and Behavior", "Record all module faults, range indication, temperature, engagement delay, other gear behavior, fluid evidence and recent work."],
      ["Test the Correct Circuit", "Use the transmission's hydraulic and electrical information to check range input, command, pressure and shared apply components."],
      ["Set the Repair Scope", "Compare an external, electrical or valve-body repair with overhaul or reman replacement based on verified internal evidence, contamination, warranty and total cost."],
    ],
    faqs: [
      ["Can low fluid cause no Reverse?", "It can reduce hydraulic apply pressure, though other ranges may also be affected. Confirm the level by the exact procedure and inspect for the source of any loss."],
      ["Why would Drive work if Reverse does not?", "Forward and Reverse use different combinations of clutches, brakes, valves, solenoids and planetary reaction elements. A range-specific component or circuit can fail while some forward ratios remain."],
      ["Can an electrical problem cause no Reverse?", "Yes on some applications. Range recognition, wiring, solenoids, modules, voltage and network faults can affect commanded operation, while other designs retain hydraulic or mechanical Reverse functions."],
      ["Does no Reverse mean the transmission must be replaced?", "Not necessarily. An external adjustment, sensor, wiring, control or valve-body repair may be possible, but internal failure, contamination or total economics can make rebuild or reman replacement more responsible."],
      ["Can I keep driving if forward gears work?", "Driving can leave you unable to maneuver safely and may worsen an internal failure. Avoid continued operation when engagement is harsh, fluid is low, debris or noise is present, or other ranges are changing."],
      ["What should I provide for a quote or diagnosis?", "Provide VIN, mileage, unit tag, drivetrain, exact behavior cold and hot, all codes, fluid/leak history, other affected gears, recent work, vehicle use, and delivery details if replacement is being considered."],
    ],
    related: [
      ["/guides/how-to-identify-transmission", "Identification", "Confirm the exact unit before applying failure patterns"],
      ["/services/bench-transmission-rebuild", "Bench Rebuild", "Review the local unit-only rebuild pathway"],
      ["/reman-transmissions", "Replacement", "Check VIN-matched reman options"],
    ],
    published: "2026-09-21",
  },
];

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const renderSchema = (page) => {
  const canonical = `${baseUrl}${page.path}`;
  const graph = [
    {
      "@type": "AutoRepair",
      "@id": `${baseUrl}/#business`,
      name: "Integrity Transmission & Drivetrain",
      url: `${baseUrl}/`,
      telephone: "+14178153315",
      email: "info@integritydrivetrain.com",
      logo: `${baseUrl}/images/integrity-logo-ITD.png`,
    },
    page.isHub ? {
      "@type": "CollectionPage",
      "@id": `${canonical}#page`,
      url: canonical,
      name: page.title,
      description: page.description,
      isPartOf: { "@id": `${baseUrl}/#website` },
      about: { "@id": `${baseUrl}/#business` },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: page.cards.map((card, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: card.title,
          url: `${baseUrl}${card.href}`,
        })),
      },
    } : {
      "@type": "Article",
      "@id": `${canonical}#article`,
      headline: page.h1,
      description: page.description,
      image: `${baseUrl}${page.hero}`,
      datePublished: page.published || "2026-09-20",
      dateModified: page.published || "2026-09-21",
      author: { "@id": `${baseUrl}/#business` },
      publisher: { "@id": `${baseUrl}/#business` },
      mainEntityOfPage: canonical,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
        ...(page.isHub ? [] : [{ "@type": "ListItem", position: 2, name: "Buying Guides", item: `${baseUrl}/guides` }]),
        { "@type": "ListItem", position: page.isHub ? 2 : 3, name: page.eyebrow, item: canonical },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: page.faqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2).replaceAll("<", "\\u003c");
};

const renderCards = (page) => page.cards.map((card, index) => `          <article class="seo-card">
            <span class="seo-card__number">${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.text)}</p>
            ${card.items ? `<ul>${card.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p><a href="${escapeHtml(card.href)}"><strong>${escapeHtml(card.link)} →</strong></a></p>`}
          </article>`).join("\n");

const renderPage = (page) => {
  const canonical = `${baseUrl}${page.path}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="author" content="Integrity Transmission & Drivetrain">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#f47b20">
  <meta name="format-detection" content="telephone=yes">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/images/integrity-logo-ITD.png">
  <link rel="apple-touch-icon" href="/images/integrity-logo-ITD.png">
  <link rel="preload" as="image" href="${escapeHtml(page.hero)}" fetchpriority="high">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;family=Oswald:wght@500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=20260920.4">
  <link rel="stylesheet" href="/modern-pages.css?v=20260903.1">
  <link rel="stylesheet" href="/seo-landing.css?v=20260920.2">
  <link rel="stylesheet" href="/commerce-guides.css?v=20260920.4">
  <meta property="og:type" content="${page.isHub ? "website" : "article"}">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="Integrity Transmission & Drivetrain">
  <meta property="og:locale" content="en_US">
  <meta property="og:image" content="${baseUrl}${escapeHtml(page.hero)}">
  <meta property="og:image:alt" content="${escapeHtml(page.heroAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${baseUrl}${escapeHtml(page.hero)}">
  <script type="application/ld+json">
${renderSchema(page)}
  </script>
</head>
<body class="subpage-modern seo-page transmission-guide-page buying-guide-page" data-analytics-category="transmission-buying-guide">
  <!-- SITE_HEADER_START -->
${header}
  <!-- SITE_HEADER_END -->

  <main id="main-content">
    <section class="page-hero" style="--page-hero-image: url('${escapeHtml(page.hero)}'); --page-hero-position: center;">
      <div class="page-hero__grid"><div class="page-hero__content">
        <ol class="seo-breadcrumb" aria-label="Breadcrumb"><li><a href="/">Home</a></li>${page.isHub ? "" : "<li><a href=\"/guides\">Buying Guides</a></li>"}<li aria-current="page">${escapeHtml(page.eyebrow)}</li></ol>
        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p class="seo-hero__lead">${escapeHtml(page.lead)}</p>
        <div class="page-hero__actions"><a href="#overview" class="btn btn-primary">Read the Guide</a><a href="/reman-transmissions#vin-quote" class="btn btn-secondary">Check Reman Options</a></div>
        <nav class="section-jump-nav" aria-label="Jump to page sections"><a href="#overview">Overview</a><a href="#details">What Matters</a><a href="#process">Process</a><a href="#questions">Questions</a></nav>
      </div></div>
    </section>

    <section class="seo-proofbar" aria-label="Buying guide principles"><div class="container seo-proofbar__inner">
      <div class="seo-proofbar__item"><strong>Fitment First</strong><span>Verify the application before price or payment.</span></div>
      <div class="seo-proofbar__item"><strong>Written Terms</strong><span>The quote, warranty, freight, and core policy control.</span></div>
      <div class="seo-proofbar__item"><strong>Complete Cost</strong><span>Include delivery, core, tax, installer, and setup.</span></div>
      <div class="seo-proofbar__item"><strong>No Guesswork</strong><span>Use current supplier and vehicle information.</span></div>
    </div></section>

    <section class="section" id="overview"><div class="container seo-intro-grid">
      <div><p class="eyebrow">Buyer Education</p><h2>${escapeHtml(page.introTitle)}</h2></div>
      <div class="seo-intro-copy">${page.intro.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}<aside class="seo-notice"><strong>${escapeHtml(page.notice[0])}</strong><p>${escapeHtml(page.notice[1])}</p></aside></div>
    </div></section>

    <section class="section section-soft" id="details"><div class="container">
      <div class="seo-section-heading"><p class="eyebrow">What Matters</p><h2>${escapeHtml(page.cardsTitle)}</h2><p>${escapeHtml(page.cardsLead)}</p></div>
      <div class="seo-card-grid">${renderCards(page)}</div>
    </div></section>

    <section class="section seo-process" id="process"><div class="container">
      <div class="seo-section-heading"><p class="eyebrow">A Clear Path</p><h2>${escapeHtml(page.processTitle)}</h2><p>${escapeHtml(page.processLead)}</p></div>
      <div class="seo-process-list">${page.process.map(([title, text], index) => `<article class="seo-process-step"><span>STEP ${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join("")}</div>
    </div></section>

    <section class="section seo-related"><div class="container"><p class="eyebrow">Related Resources</p><h2>Continue with the next useful answer.</h2><div class="seo-related__grid">${page.related.map(([href, kicker, title]) => `<a class="seo-related__link" href="${escapeHtml(href)}"><span>${escapeHtml(kicker)}</span><strong>${escapeHtml(title)} →</strong></a>`).join("")}</div></div></section>

    <section class="section" id="questions"><div class="container">
      <div class="seo-section-heading"><p class="eyebrow">Common Questions</p><h2>Details to confirm before ordering.</h2><p>These answers are educational. The vehicle, written quote, supplier policy, carrier terms, and unit-specific warranty control the purchase.</p></div>
      <div class="seo-faq-grid">${page.faqs.map(([question, answer]) => `<article class="seo-faq-item"><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("")}</div>
    </div></section>

    <section class="section section-soft"><div class="container seo-final"><p class="eyebrow">Ready for a Verified Quote?</p><h2>Start with the VIN and delivery details.</h2><p>Send the full VIN, mileage, drivetrain, unit tag or build codes when available, delivery ZIP code and delivery type. Integrity will confirm supported fitment, current options, freight, core, and written warranty terms.</p><div class="seo-final__actions"><a href="/reman-transmissions#vin-quote" class="btn btn-primary">Check Reman Options</a><a href="/contact#quote-form" class="btn btn-dark">Request Help</a><a href="/guides" class="btn btn-secondary">All Buying Guides</a></div></div></section>
  </main>

  <!-- SITE_FOOTER_START -->
${footer}
  <!-- SITE_FOOTER_END -->
  <script src="/script.js?v=20260921.1" defer></script>
</body>
</html>
`;
};

for (const page of pages) {
  const outputPath = path.join(siteRoot, page.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderPage(page), "utf8");
}

console.log(`Generated ${pages.length} transmission buying guides.`);
