import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { areaNames, seoPages } from "./seo-pages-data.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const header = fs.readFileSync(path.join(siteRoot, "partials/header.html"), "utf8").trim();
const footer = fs.readFileSync(path.join(siteRoot, "partials/footer.html"), "utf8").trim();
const baseUrl = "https://integritydrivetrain.com";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const renderParagraphs = (paragraphs) => paragraphs
  .map((paragraph) => `          <p>${escapeHtml(paragraph)}</p>`)
  .join("\n");

const renderSchema = (page) => {
  const canonical = `${baseUrl}${page.path}`;
  const breadcrumbs = [
    { name: "Home", item: `${baseUrl}/` },
    ...(page.parent ? [{ name: page.parent[0], item: `${baseUrl}${page.parent[1]}` }] : []),
    { name: page.eyebrow, item: canonical },
  ];

  const graph = [
    {
      "@type": "AutoRepair",
      "@id": `${baseUrl}/#business`,
      name: "Integrity Transmission & Drivetrain",
      url: `${baseUrl}/`,
      telephone: "+14178153315",
      email: "info@integritydrivetrain.com",
      logo: `${baseUrl}/images/integrity-logo-ITD.png`,
      image: `${baseUrl}${page.hero}`,
      priceRange: "$$",
      description: "Appointment-based transmission and drivetrain service for Springfield and Southwest Missouri, with remanufactured replacement, selective rebuilding and installation coordinated through qualified local repair shops.",
      areaServed: areaNames.map((name) => name === "Southwest Missouri"
        ? { "@type": "AdministrativeArea", name }
        : { "@type": "City", name: `${name}, Missouri` }),
    },
    {
      "@type": "Service",
      "@id": `${canonical}#service`,
      name: page.serviceName,
      serviceType: page.serviceName,
      url: canonical,
      description: page.description,
      provider: { "@id": `${baseUrl}/#business` },
      areaServed: areaNames.map((name) => name === "Southwest Missouri"
        ? { "@type": "AdministrativeArea", name }
        : { "@type": "City", name: `${name}, Missouri` }),
    },
    {
      "@type": page.type === "area" ? "CollectionPage" : "WebPage",
      "@id": `${canonical}#page`,
      url: canonical,
      name: page.title,
      description: page.description,
      isPartOf: { "@id": `${baseUrl}/#website` },
      about: { "@id": `${baseUrl}/#business` },
      mainEntity: { "@id": `${canonical}#service` },
      inLanguage: "en-US",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: page.faqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ];

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)
    .replaceAll("<", "\\u003c");
};

const renderBreadcrumb = (page) => {
  const parent = page.parent
    ? `<li><a href="${escapeHtml(page.parent[1])}">${escapeHtml(page.parent[0])}</a></li>`
    : "";

  return `
            <ol class="seo-breadcrumb" aria-label="Breadcrumb">
              <li><a href="/">Home</a></li>
              ${parent}
              <li aria-current="page">${escapeHtml(page.eyebrow)}</li>
            </ol>`;
};

const renderPage = (page) => {
  const canonical = `${baseUrl}${page.path}`;
  const parentLabel = page.parent?.[0] || "Local Service";
  const parentHref = page.parent?.[1] || "/service-area";

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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/modern-pages.css">
  <link rel="stylesheet" href="/seo-landing.css">
  <meta property="og:type" content="website">
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
<body class="subpage-modern seo-page">
  <!-- SITE_HEADER_START -->
${header}
  <!-- SITE_HEADER_END -->

  <main id="main-content">
    <section class="page-hero" style="--page-hero-image: url('${escapeHtml(page.hero)}'); --page-hero-position: center;">
      <div class="page-hero__grid">
        <div class="page-hero__content">
${renderBreadcrumb(page)}
          <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
          <h1>${escapeHtml(page.h1)}</h1>
          <p class="seo-hero__lead">${escapeHtml(page.lead)}</p>
          <div class="page-hero__actions">
            <a href="/contact#quote-form" class="btn btn-primary">Request a VIN-Based Quote</a>
            <a href="sms:14178153315" class="btn btn-secondary">Text Vehicle Details</a>
          </div>
          <nav class="section-jump-nav" aria-label="Jump to page sections">
            <a href="#overview">Overview</a>
            <a href="#details">What Matters</a>
            <a href="#process">Process</a>
            <a href="#questions">Questions</a>
          </nav>
        </div>
      </div>
    </section>

    <section class="seo-proofbar" aria-label="Service highlights">
      <div class="container seo-proofbar__inner">
${page.proof.map(([title, text]) => `        <div class="seo-proofbar__item"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`).join("\n")}
      </div>
    </section>

    <section class="section" id="overview">
      <div class="container seo-intro-grid">
        <div>
          <p class="eyebrow">${escapeHtml(parentLabel)}</p>
          <h2>${escapeHtml(page.introTitle)}</h2>
        </div>
        <div class="seo-intro-copy">
${renderParagraphs(page.intro)}
          <aside class="seo-notice">
            <strong>${escapeHtml(page.notice[0])}</strong>
            <p>${escapeHtml(page.notice[1])}</p>
          </aside>
        </div>
      </div>
    </section>

    <section class="section section-soft" id="details">
      <div class="container">
        <div class="seo-section-heading">
          <p class="eyebrow">What Matters</p>
          <h2>${escapeHtml(page.cardsTitle)}</h2>
          <p>${escapeHtml(page.cardsLead)}</p>
        </div>
        <div class="seo-card-grid">
${page.cards.map((card, index) => `          <article class="seo-card">
            <span class="seo-card__number">${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.text)}</p>
            <ul>
${card.items.map((item) => `              <li>${escapeHtml(item)}</li>`).join("\n")}
            </ul>
          </article>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section seo-process" id="process">
      <div class="container">
        <div class="seo-section-heading">
          <p class="eyebrow">A Clear Path</p>
          <h2>${escapeHtml(page.processTitle)}</h2>
          <p>${escapeHtml(page.processLead)}</p>
        </div>
        <div class="seo-process-list">
${page.process.map(([title, text], index) => `          <article class="seo-process-step">
            <span>STEP ${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(text)}</p>
          </article>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container seo-local">
        <div>
          <p class="eyebrow">Local & Appointment Based</p>
          <h2>Serving Springfield and Southwest Missouri.</h2>
        </div>
        <div class="seo-local__copy">
          <p>${escapeHtml(page.localText)}</p>
          <div class="seo-local__areas" aria-label="Primary service communities">
${areaNames.slice(0, 6).map((area) => `            <span>${escapeHtml(area)}, MO</span>`).join("\n")}
          </div>
          <p><a href="/service-area"><strong>Review the full service-area and appointment process →</strong></a></p>
        </div>
      </div>
    </section>

    <section class="section seo-related">
      <div class="container">
        <p class="eyebrow">Related Next Steps</p>
        <h2>Continue with the information that fits your vehicle.</h2>
        <div class="seo-related__grid">
${page.related.map(([href, kicker, title]) => `          <a class="seo-related__link" href="${escapeHtml(href)}"><span>${escapeHtml(kicker)}</span><strong>${escapeHtml(title)} →</strong></a>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="questions">
      <div class="container">
        <div class="seo-section-heading">
          <p class="eyebrow">Common Questions</p>
          <h2>Answers before you schedule.</h2>
          <p>These answers provide a starting point. The vehicle, evidence, written quote and warranty terms control the final recommendation.</p>
        </div>
        <div class="seo-faq-grid">
${page.faqs.map(([question, answer]) => `          <article class="seo-faq-item"><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section section-soft">
      <div class="container seo-final">
        <p class="eyebrow">Start With the VIN</p>
        <h2>Get the correct application before choosing the repair.</h2>
        <p>Send the VIN, mileage, symptoms, codes, prior repair information and whether the vehicle is drivable. Integrity will review the available path and follow up with the next step.</p>
        <div class="seo-final__actions">
          <a href="/contact#quote-form" class="btn btn-primary">Request a Quote</a>
          <a href="tel:14178153315" class="btn btn-dark">Call (417) 815-3315</a>
          <a href="${escapeHtml(parentHref)}" class="btn btn-secondary">Back to ${escapeHtml(parentLabel)}</a>
        </div>
      </div>
    </section>
  </main>

  <!-- SITE_FOOTER_START -->
${footer}
  <!-- SITE_FOOTER_END -->
  <script src="/script.js" defer></script>
</body>
</html>
`;
};

for (const page of seoPages) {
  const outputPath = path.join(siteRoot, page.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderPage(page), "utf8");
}

console.log(`Generated ${seoPages.length} focused SEO landing pages.`);
