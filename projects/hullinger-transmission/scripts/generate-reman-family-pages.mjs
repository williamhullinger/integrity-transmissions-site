import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const header = fs.readFileSync(path.join(siteRoot, "partials/header.html"), "utf8").trim();
const footer = fs.readFileSync(path.join(siteRoot, "partials/footer.html"), "utf8").trim();
const baseUrl = "https://integritydrivetrain.com";

const families = [
  {
    slug: "10r80",
    unit: "10R80",
    image: "/images/seo-10r80-hero.webp",
    applications: ["Ford F-150", "Ford Mustang", "Ford Expedition and Lincoln Navigator", "Ford Ranger", "Selected Ford Transit applications"],
    summary: "Ford's electronically controlled 10-speed automatic appears in several rear-wheel-drive and four-wheel-drive applications. Engine, drive type, model year, calibration and production changes can affect the correct unit.",
  },
  {
    slug: "6l80",
    unit: "6L80",
    image: "/images/seo-6l80-6l90-hero.webp",
    applications: ["Chevrolet Silverado 1500", "GMC Sierra 1500", "Tahoe, Suburban, Yukon and Escalade", "Camaro and Corvette", "Selected GM vans and utility vehicles"],
    summary: "The GM 6L80 six-speed automatic is used across trucks, SUVs and performance vehicles. The VIN, RPO information, engine, drive type and controller strategy all matter when matching a replacement.",
  },
  {
    slug: "6l90",
    unit: "6L90",
    image: "/images/seo-6l80-6l90-hero.webp",
    applications: ["Chevrolet Silverado HD", "GMC Sierra HD", "Chevrolet Express and GMC Savana", "Selected Cadillac and performance applications", "Commercial GM vehicles"],
    summary: "The heavier-duty GM 6L90 serves truck, van, commercial and selected performance applications. Vehicle weight rating, engine, output configuration and production information must be checked before ordering.",
  },
  {
    slug: "68rfe",
    unit: "68RFE",
    image: "/images/seo-68rfe-hero.webp",
    applications: ["Ram 2500 with 6.7L Cummins", "Ram 3500 with 6.7L Cummins", "Stock and modified diesel trucks", "Towing and work-truck applications"],
    summary: "The 68RFE six-speed automatic is widely used behind the 6.7L Cummins in Ram heavy-duty trucks. Tuning, tire size, towing weight, horsepower and vehicle use help determine the suitable upgrade level.",
  },
  {
    slug: "4l60e",
    unit: "4L60E",
    image: "/images/seo-4l60e-hero.webp",
    applications: ["Chevrolet and GMC half-ton trucks", "Tahoe, Suburban, Yukon and Escalade", "Camaro, Firebird and Corvette", "S-series trucks and utility vehicles", "Selected GM vans and rear-wheel-drive cars"],
    summary: "The 4L60E family covers many years and applications, with important differences in cases, shafts, converters, electronics and calibration. The VIN and transmission identification tag are essential.",
  },
  {
    slug: "4l80e",
    unit: "4L80E",
    image: "/images/seo-4l80e-hero.webp",
    applications: ["Chevrolet and GMC heavy-duty trucks", "Express and Savana vans", "Suburban and commercial utility applications", "Motorhome and fleet applications", "Performance and conversion projects requiring verification"],
    summary: "The GM 4L80E is a heavy-duty four-speed automatic used in trucks, vans, fleet vehicles and specialty applications. Case style, speed sensors, converter and controller details vary by year and use.",
  },
  {
    slug: "700r4",
    unit: "700R4",
    image: "/images/seo-700r4-hero.webp",
    applications: ["Classic Chevrolet and GMC trucks", "Camaro, Firebird and Corvette", "Full-size GM rear-wheel-drive cars", "Street rods and verified conversion projects"],
    summary: "The hydraulically controlled 700R4 combines overdrive with classic GM applications. Correct year range, input and output configuration, converter, gearing, TV-cable setup and intended use must be matched carefully.",
  },
];

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

const render = (family) => {
  const url = `${baseUrl}/reman-transmissions/${family.slug}`;
  const title = `${family.unit} Transmission for Sale | Reman Options & VIN Pricing`;
  const description = `Shop remanufactured ${family.unit} transmission options with VIN-matched fitment, package pricing, core deposit, warranty choices and nationwide freight from Integrity.`;
  const faq = [
    [`How much does a remanufactured ${family.unit} cost?`, `The price depends on the exact VIN-matched application, warranty and upgrade package. Enter the VIN to see current transmission pricing, the refundable core deposit and available options before freight and tax.`],
    [`Can I order a ${family.unit} online?`, `Yes, when the VIN lookup returns an orderable package and current freight rate. Integrity rechecks fitment, price and availability before Stripe Checkout opens and completes a final fitment review after payment.`],
    [`Is the core deposit refundable?`, `The core deposit is refundable after the correct, complete original transmission is returned within 30 days and accepted under Integrity's published core-return terms.`],
    [`Does the displayed build time include shipping?`, `No. Build time applies before the unit ships. Carrier transit time is shown separately with the freight options for the delivery address.`],
  ];
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        isPartOf: { "@id": `${baseUrl}/reman-transmissions#webpage` },
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: `Remanufactured ${family.unit} transmission sourcing and nationwide delivery`,
        serviceType: `VIN-matched remanufactured ${family.unit} transmission`,
        provider: { "@type": "AutomotiveBusiness", name: "Integrity Transmission & Drivetrain", url: `${baseUrl}/` },
        areaServed: { "@type": "Country", name: "United States" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Reman Transmissions", item: `${baseUrl}/reman-transmissions` },
          { "@type": "ListItem", position: 3, name: family.unit, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
      },
    ],
  };
  const shopUrl = `/reman-transmissions?family=${encodeURIComponent(family.unit)}#vin-quote`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Integrity Transmission & Drivetrain">
  <meta name="theme-color" content="#f47b20">
  <link rel="canonical" href="${url}">
  <link rel="icon" type="image/png" href="/images/integrity-logo-ITD.png">
  <link rel="preload" as="image" href="${family.image}" type="image/webp">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=20260903-header-fix">
  <link rel="stylesheet" href="/modern-pages.css">
  <link rel="stylesheet" href="/seo-landing.css">
  <link rel="stylesheet" href="/commerce-guides.css?v=20260903-customer-reman">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${baseUrl}${family.image}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body class="subpage-modern reman-family-page">
  <!-- SITE_HEADER_START -->
${header}
  <!-- SITE_HEADER_END -->
  <main id="main-content">
    <section class="page-hero" style="--page-hero-image: url('${family.image}'); --page-hero-position: center;">
      <div class="page-hero__grid"><div class="page-hero__content">
        <ol class="seo-breadcrumb" aria-label="Breadcrumb"><li><a href="/">Home</a></li><li><a href="/reman-transmissions">Reman Transmissions</a></li><li aria-current="page">${family.unit}</li></ol>
        <p class="eyebrow">Nationwide Reman Options</p>
        <h1>${family.unit} remanufactured transmissions for sale</h1>
        <p class="seo-hero__lead">Use your VIN to see the matching ${family.unit} package, current price, warranty, availability, refundable core deposit and delivery options.</p>
        <div class="page-hero__actions"><a class="btn btn-primary" href="${shopUrl}">Check My VIN & Price</a><a class="btn btn-secondary" href="tel:14178153315">Call (417) 815-3315</a></div>
      </div></div>
    </section>

    <section class="seo-proofbar" aria-label="${family.unit} ordering highlights"><div class="container seo-proofbar__inner">
      <div class="seo-proofbar__item"><strong>VIN-Matched</strong><span>Confirm the correct application before payment.</span></div>
      <div class="seo-proofbar__item"><strong>Current Pricing</strong><span>See the package price and core deposit.</span></div>
      <div class="seo-proofbar__item"><strong>Nationwide Freight</strong><span>Calculate delivery for your address.</span></div>
      <div class="seo-proofbar__item"><strong>Secure Checkout</strong><span>Pay Integrity through Stripe.</span></div>
    </div></section>

    <section class="section"><div class="container seo-intro-grid">
      <div><p class="eyebrow">About the ${family.unit}</p><h2>Match the exact transmission—not just the name.</h2></div>
      <div class="seo-intro-copy"><p>${escapeHtml(family.summary)}</p><p>A transmission-family name alone is not enough to guarantee fitment. Integrity uses the VIN and current application data to show the available package and then verifies the order again before fulfillment.</p><aside class="seo-notice"><strong>Price requires a VIN</strong><p>Current package, core and availability data are tied to the exact vehicle. Enter the 17-digit VIN for a price you can review before checkout.</p></aside></div>
    </div></section>

    <section class="section section-soft"><div class="container"><div class="seo-section-heading"><p class="eyebrow">Common Applications</p><h2>Vehicles that may use a ${family.unit}</h2><p>This is a starting list, not a fitment guarantee. Model year, engine, drive type and production configuration can change the required unit.</p></div><div class="seo-card-grid">
      ${family.applications.map((application, index) => `<article class="seo-card"><span class="seo-card__number">${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(application)}</h3><p>Enter the VIN to confirm whether this vehicle uses a supported ${family.unit} application.</p></article>`).join("\n      ")}
    </div></div></section>

    <section class="section"><div class="container"><div class="seo-section-heading"><p class="eyebrow">Package Choices</p><h2>Compare what is available for your VIN.</h2><p>Depending on the application, results may include Base, 1000, 2000 or 3000 upgrades and more than one warranty choice. Only packages currently returned for the vehicle are displayed.</p></div><div class="seo-process-list">
      <article class="seo-process-step"><span>01</span><h3>Enter the VIN</h3><p>Identify the vehicle and possible transmission application.</p></article>
      <article class="seo-process-step"><span>02</span><h3>Choose a Package</h3><p>Compare upgrade level, warranty, price and build availability.</p></article>
      <article class="seo-process-step"><span>03</span><h3>Calculate Freight</h3><p>Choose current delivery and core-return shipping for the address.</p></article>
      <article class="seo-process-step"><span>04</span><h3>Pay Securely</h3><p>Review tax and the complete total in Stripe Checkout.</p></article>
    </div></div></section>

    <section class="section reman-family-cta"><div class="container seo-final"><p class="eyebrow">Shop ${family.unit} Options</p><h2>Get the current VIN-matched price.</h2><p>Have the VIN ready. You can review the package, warranty, core deposit, availability and freight before making a payment.</p><div class="seo-final__actions"><a class="btn btn-primary" href="${shopUrl}">Find My ${family.unit}</a><a class="btn btn-dark" href="/reman-order-terms">Read Order & Core Terms</a></div></div></section>

    <section class="section section-soft"><div class="container"><div class="seo-section-heading"><p class="eyebrow">Questions</p><h2>${family.unit} ordering questions</h2></div><div class="seo-faq-list">
      ${faq.map(([question, answer]) => `<article class="seo-faq-item"><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("\n      ")}
    </div></div></section>

    <section class="section"><div class="container seo-final"><p class="eyebrow">Related Information</p><h2>Research before you order.</h2><div class="seo-final__actions"><a class="btn btn-secondary" href="/transmissions/${family.slug === "6l80" || family.slug === "6l90" ? "6l80-6l90" : family.slug}">${family.unit} Service Guide</a><a class="btn btn-secondary" href="/guides/transmission-problems">Transmission Problems Guide</a><a class="btn btn-secondary" href="/reman-transmissions">All Reman Options</a></div></div></section>
  </main>
  <!-- SITE_FOOTER_START -->
${footer}
  <!-- SITE_FOOTER_END -->
  <script src="/script.js" defer></script>
</body>
</html>
`;
};

const outputDirectory = path.join(siteRoot, "reman-transmissions");
fs.mkdirSync(outputDirectory, { recursive: true });
for (const family of families) fs.writeFileSync(path.join(outputDirectory, `${family.slug}.html`), render(family), "utf8");
console.log(`Generated ${families.length} reman transmission family pages.`);
