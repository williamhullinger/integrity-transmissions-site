export const schemaPlan = {
  purpose:
    "Plan SEO metadata, structured data, and search-related content for the Hullinger Digital V2 React build.",
  strategy:
    "SEO should be planned into the site structure before launch. Each major page should have a clear title, description, purpose, internal links, and structured data where appropriate.",
  importantNote:
    "This file is a planning file. During the React/Vite build, this information can be used to create page metadata, JSON-LD schema, sitemap entries, and SEO helper utilities.",
};

export const defaultSeoSettings = {
  siteName: "Hullinger Digital",
  baseUrl: "https://hullingerdigital.com",
  defaultTitle:
    "Hullinger Digital | Custom Websites, SEO & Business Website Tools",
  titleTemplate: "%s | Hullinger Digital",
  defaultDescription:
    "Hullinger Digital builds custom websites, SEO foundations, and advanced website tools for businesses that need more than a generic online presence.",
  defaultOgImage: "/images/hullinger-digital-og-image.jpg",
  defaultTwitterCard: "summary_large_image",
  language: "en-US",
  businessLocationLine: "Based in Missouri. Built for businesses anywhere.",
};

export const pageSeoPlan = [
  {
    pageId: "home",
    slug: "/",
    priority: 1.0,
    changeFrequency: "monthly",
    metaTitle:
      "Hullinger Digital | Custom Websites, SEO & Business Website Tools",
    metaDescription:
      "Hullinger Digital builds custom websites, SEO foundations, and advanced website tools for businesses that need more than a generic online presence.",
    targetIntent:
      "Business owners looking for a custom website company with strategy, SEO, lead generation, and advanced website tool capabilities.",
    primaryKeywords: [
      "custom websites",
      "business websites",
      "website design",
      "SEO website structure",
      "advanced website tools",
      "website builder process",
    ],
    secondaryKeywords: [
      "lead generating websites",
      "custom website design",
      "website strategy",
      "business website tools",
      "customer portals",
      "employee dashboards",
    ],
    recommendedSchemaTypes: ["Organization", "WebSite", "Service"],
    internalLinksToPrioritize: [
      "/starter-web-page",
      "/launch-website",
      "/lead-generating-website",
      "/advanced-website",
      "/pricing",
      "/website-builder",
      "/website-review",
    ],
  },

  {
    pageId: "starter-web-page",
    slug: "/starter-web-page",
    priority: 0.8,
    changeFrequency: "monthly",
    metaTitle: "Starter Web Page | Hullinger Digital",
    metaDescription:
      "A focused one-page web presence built to make your business look professional without overbuilding the project.",
    targetIntent:
      "Business owners who need a simple professional one-page website or starter web presence.",
    primaryKeywords: [
      "starter web page",
      "one page website",
      "professional web presence",
      "small business web page",
    ],
    secondaryKeywords: [
      "simple business website",
      "one page business website",
      "starter website package",
    ],
    recommendedSchemaTypes: ["Service", "FAQPage", "BreadcrumbList"],
    internalLinksToPrioritize: [
      "/launch-website",
      "/pricing",
      "/website-builder",
      "/website-review",
    ],
  },

  {
    pageId: "launch-website",
    slug: "/launch-website",
    priority: 0.85,
    changeFrequency: "monthly",
    metaTitle: "Launch Website | Hullinger Digital",
    metaDescription:
      "A custom informational website built around your business, services, credibility, and contact flow.",
    targetIntent:
      "Business owners who need a custom informational website with 1–3 pages.",
    primaryKeywords: [
      "launch website",
      "informational website",
      "custom business website",
      "professional website package",
    ],
    secondaryKeywords: [
      "small business website design",
      "custom informational website",
      "multi page website",
    ],
    recommendedSchemaTypes: ["Service", "FAQPage", "BreadcrumbList"],
    internalLinksToPrioritize: [
      "/starter-web-page",
      "/lead-generating-website",
      "/pricing",
      "/website-builder",
      "/website-review",
    ],
  },

  {
    pageId: "lead-generating-website",
    slug: "/lead-generating-website",
    priority: 0.95,
    changeFrequency: "monthly",
    metaTitle: "Lead-Generating Website | Hullinger Digital",
    metaDescription:
      "A custom website built to get found, build trust, and turn visitors into leads.",
    targetIntent:
      "Service businesses that want SEO structure, dedicated service pages, trust-building content, and better quote requests.",
    primaryKeywords: [
      "lead generating website",
      "SEO website",
      "service business website",
      "custom website for leads",
    ],
    secondaryKeywords: [
      "SEO service pages",
      "website for service business",
      "quote request website",
      "lead generation website design",
    ],
    recommendedSchemaTypes: ["Service", "FAQPage", "BreadcrumbList"],
    internalLinksToPrioritize: [
      "/launch-website",
      "/advanced-website",
      "/pricing",
      "/website-builder",
      "/website-review",
    ],
  },

  {
    pageId: "advanced-website",
    slug: "/advanced-website",
    priority: 0.95,
    changeFrequency: "monthly",
    metaTitle: "Advanced Website With Business Tools | Hullinger Digital",
    metaDescription:
      "A custom website with business tools built in, including portals, dashboards, workflows, e-commerce, automations, and AI-assisted features.",
    targetIntent:
      "Businesses that need custom website functionality such as portals, dashboards, workflows, payments, e-commerce, automations, or AI tools.",
    primaryKeywords: [
      "advanced website",
      "website with customer portal",
      "website with employee dashboard",
      "custom business website tools",
      "website automation",
    ],
    secondaryKeywords: [
      "custom web application",
      "customer login website",
      "business dashboard website",
      "AI website tools",
      "custom order workflow website",
    ],
    recommendedSchemaTypes: ["Service", "FAQPage", "BreadcrumbList"],
    internalLinksToPrioritize: [
      "/lead-generating-website",
      "/pricing",
      "/website-builder",
      "/website-review",
    ],
  },

  {
    pageId: "website-builder",
    slug: "/website-builder",
    priority: 0.9,
    changeFrequency: "monthly",
    metaTitle: "Build Your Website Plan | Hullinger Digital",
    metaDescription:
      "Choose your website level, add features, share project details, and see your estimated total before review.",
    targetIntent:
      "Ready or near-ready buyers who want to configure a website project and understand estimated pricing.",
    primaryKeywords: [
      "build website plan",
      "website pricing calculator",
      "website package builder",
      "custom website quote",
    ],
    secondaryKeywords: [
      "website project intake",
      "website add ons",
      "website cost estimate",
      "website configurator",
    ],
    recommendedSchemaTypes: ["WebPage", "BreadcrumbList"],
    internalLinksToPrioritize: [
      "/pricing",
      "/starter-web-page",
      "/launch-website",
      "/lead-generating-website",
      "/advanced-website",
      "/terms",
    ],
    noIndexConsideration:
      "Keep indexable if the page has useful public content. If later the builder becomes heavily app-like with little static content, consider whether indexing is still useful.",
  },

  {
    pageId: "pricing",
    slug: "/pricing",
    priority: 0.9,
    changeFrequency: "monthly",
    metaTitle: "Website Pricing & Plans | Hullinger Digital",
    metaDescription:
      "Compare website package starting prices, add-ons, payment options, care plans, and project terms.",
    targetIntent:
      "Visitors comparing website cost, service packages, payment options, and care plans.",
    primaryKeywords: [
      "website pricing",
      "website packages",
      "custom website cost",
      "website design pricing",
    ],
    secondaryKeywords: [
      "website care plans",
      "website payment plans",
      "SEO website pricing",
      "advanced website pricing",
    ],
    recommendedSchemaTypes: ["WebPage", "FAQPage", "BreadcrumbList"],
    internalLinksToPrioritize: [
      "/website-builder",
      "/starter-web-page",
      "/launch-website",
      "/lead-generating-website",
      "/advanced-website",
      "/terms",
    ],
  },

  {
    pageId: "about",
    slug: "/about",
    priority: 0.7,
    changeFrequency: "quarterly",
    metaTitle: "About Hullinger Digital",
    metaDescription:
      "Hullinger Digital is a digital studio built around strategy, structure, and practical business tools.",
    targetIntent:
      "Visitors who want to understand the company, approach, credibility, and philosophy behind Hullinger Digital.",
    primaryKeywords: [
      "Hullinger Digital",
      "digital studio",
      "website strategy",
      "custom website company",
    ],
    secondaryKeywords: [
      "business website partner",
      "website systems thinking",
      "founder-led digital studio",
    ],
    recommendedSchemaTypes: ["AboutPage", "Organization", "BreadcrumbList"],
    internalLinksToPrioritize: [
      "/website-builder",
      "/pricing",
      "/website-review",
    ],
  },

  {
    pageId: "website-review",
    slug: "/website-review",
    priority: 0.75,
    changeFrequency: "monthly",
    metaTitle: "Request a Website Review | Hullinger Digital",
    metaDescription:
      "Request a website review if you are not sure which website level, add-ons, or project scope fits your business.",
    targetIntent:
      "Visitors who need guidance before choosing a package or building a website plan.",
    primaryKeywords: [
      "website review",
      "website project review",
      "website consultation",
      "website scope review",
    ],
    secondaryKeywords: [
      "website redesign review",
      "business website review",
      "website package recommendation",
    ],
    recommendedSchemaTypes: ["ContactPage", "BreadcrumbList"],
    internalLinksToPrioritize: [
      "/website-builder",
      "/pricing",
      "/lead-generating-website",
      "/advanced-website",
    ],
  },

  {
    pageId: "terms-preview",
    slug: "/terms",
    priority: 0.45,
    changeFrequency: "quarterly",
    metaTitle: "Website Project Terms | Hullinger Digital",
    metaDescription:
      "Review general website project terms, payment expectations, scope rules, ownership transfer, and client responsibilities.",
    targetIntent:
      "Serious buyers reviewing project expectations before purchase or agreement.",
    primaryKeywords: [
      "website project terms",
      "website agreement",
      "website ownership terms",
    ],
    secondaryKeywords: [
      "website payment terms",
      "website scope terms",
      "website revision terms",
    ],
    recommendedSchemaTypes: ["WebPage", "BreadcrumbList"],
    internalLinksToPrioritize: [
      "/pricing",
      "/website-builder",
      "/website-review",
    ],
    legalNote:
      "This page should be described as a general terms preview and should not replace an attorney-reviewed agreement.",
  },
];

export const organizationSchemaPlan = {
  type: "Organization",
  name: "Hullinger Digital",
  url: "https://hullingerdigital.com",
  logo: "https://hullingerdigital.com/images/hullinger-digital-logo.png",
  description:
    "Hullinger Digital builds custom websites, SEO foundations, and advanced website tools for businesses that need more than a generic online presence.",
  areaServed:
    "Based in Missouri and available for businesses anywhere.",
  sameAs: [
    {
      platform: "Facebook",
      url: "",
      status: "add-when-ready",
    },
    {
      platform: "LinkedIn",
      url: "",
      status: "add-when-ready",
    },
    {
      platform: "Google Business Profile",
      url: "",
      status: "add-when-ready",
    },
  ],
  notes:
    "Add real social/profile links only when confirmed. Do not publish blank sameAs URLs in final schema.",
};

export const websiteSchemaPlan = {
  type: "WebSite",
  name: "Hullinger Digital",
  url: "https://hullingerdigital.com",
  potentialAction:
    "Future search action can be added if the website includes internal search.",
};

export const serviceSchemaPlan = [
  {
    serviceId: "starter-web-page",
    serviceName: "Starter Web Page",
    serviceType: "Website design service",
    provider: "Hullinger Digital",
    startingPrice: 395,
    priceCurrency: "USD",
    description:
      "A focused one-page web presence built to make a business look professional.",
  },
  {
    serviceId: "launch-website",
    serviceName: "Launch Website",
    serviceType: "Website design service",
    provider: "Hullinger Digital",
    startingPrice: 1295,
    priceCurrency: "USD",
    description:
      "A custom informational website built around a business, services, credibility, and contact flow.",
  },
  {
    serviceId: "lead-generating-website",
    serviceName: "Lead-Generating Website",
    serviceType: "Website design and SEO service",
    provider: "Hullinger Digital",
    startingPrice: 3950,
    priceCurrency: "USD",
    description:
      "A custom website built around SEO structure, service pages, trust-building content, and lead generation.",
  },
  {
    serviceId: "advanced-website",
    serviceName: "Advanced Website",
    serviceType: "Custom website and business tool development service",
    provider: "Hullinger Digital",
    startingPrice: 8500,
    priceCurrency: "USD",
    description:
      "A custom website with business tools built in, including portals, dashboards, workflows, e-commerce, automations, and AI-assisted features.",
  },
];

export const faqSchemaPlan = {
  strategy:
    "FAQ schema can be used on pages where public FAQ content is visible on the page. Do not add FAQ schema for questions that are not visible to users.",
  candidatePages: [
    "starter-web-page",
    "launch-website",
    "lead-generating-website",
    "advanced-website",
    "pricing",
    "terms-preview",
  ],
  faqSources: ["contentBlocks.js faqBlocks"],
};

export const breadcrumbSchemaPlan = {
  strategy:
    "Use BreadcrumbList schema on all pages except possibly the homepage.",
  examples: [
    {
      pageId: "lead-generating-website",
      breadcrumbs: [
        { name: "Home", item: "/" },
        { name: "Lead-Generating Website", item: "/lead-generating-website" },
      ],
    },
    {
      pageId: "pricing",
      breadcrumbs: [
        { name: "Home", item: "/" },
        { name: "Pricing", item: "/pricing" },
      ],
    },
  ],
};

export const sitemapPlan = {
  includePages: [
    "/",
    "/starter-web-page",
    "/launch-website",
    "/lead-generating-website",
    "/advanced-website",
    "/website-builder",
    "/pricing",
    "/about",
    "/website-review",
    "/terms",
  ],
  excludeForNow: [
    "/thank-you",
    "/builder-confirmation",
    "/payment-success",
    "/payment-cancelled",
    "/admin",
    "/private",
  ],
  notes:
    "Confirmation, payment, admin, or private pages should generally not be indexed.",
};

export const robotsPlan = {
  allow: ["/"],
  disallow: [
    "/admin",
    "/private",
    "/builder-confirmation",
    "/payment-success",
    "/payment-cancelled",
  ],
  sitemap: "https://hullingerdigital.com/sitemap.xml",
};

export const seoBuildNotes = {
  reactHelmet:
    "During React build, consider a metadata helper component or React Helmet-style solution if needed.",
  staticRendering:
    "Because Vite React is client-rendered by default, SEO-sensitive pages may eventually benefit from prerendering or a framework like Next.js if organic search becomes a major dependency. For the first version, strong static content, metadata, sitemap, and crawlable HTML strategy should still be planned carefully.",
  images:
    "Use descriptive alt text for mockups and visuals. Decorative visuals should use empty alt text or be handled appropriately.",
  headings:
    "Each page should have one clear H1. Sections should use logical H2/H3 hierarchy.",
  internalLinks:
    "Service pages should link to related packages, pricing, builder, and review path.",
};