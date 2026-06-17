export const addonCategories = [
  {
    id: "pages-content",
    name: "Pages & Content",
    description:
      "Add more pages, written content, service pages, case studies, or content migration support.",
  },
  {
    id: "seo-local-visibility",
    name: "SEO & Local Visibility",
    description:
      "Improve how the website is structured for search engines, local visibility, and service-based discovery.",
  },
  {
    id: "design-media",
    name: "Design & Media",
    description:
      "Add stronger visual polish, graphics, galleries, motion, brand direction, and media-focused sections.",
  },
  {
    id: "forms-lead-capture",
    name: "Forms & Lead Capture",
    description:
      "Add stronger contact, quote request, intake, file upload, lead routing, and CRM-style form flows.",
  },
  {
    id: "online-sales-payments",
    name: "Online Sales & Payments",
    description:
      "Add payment collection, deposits, checkout, products, shipping, pickup, subscriptions, or custom order flows.",
  },
  {
    id: "booking-scheduling",
    name: "Booking & Scheduling",
    description:
      "Add booking links, embedded calendars, service-based scheduling, appointment requests, or deposit-based booking.",
  },
  {
    id: "automations",
    name: "Automations",
    description:
      "Add email, SMS, review requests, lead follow-up, internal alerts, spreadsheet/database workflows, or multi-step automations.",
  },
  {
    id: "customer-tools",
    name: "Customer Tools",
    description:
      "Add customer-facing tools such as logins, portals, dashboards, approvals, uploads, status views, or payment areas.",
  },
  {
    id: "employee-internal-tools",
    name: "Employee / Internal Tools",
    description:
      "Add staff logins, internal dashboards, notes, task stages, job tracking, reporting, admin tools, or role-based access.",
  },
  {
    id: "ai-tools",
    name: "AI Tools",
    description:
      "Add AI-assisted summaries, replies, estimates, internal support tools, content help, or knowledge-base assistance.",
  },
];

export const addons = [
  {
    id: "additional-basic-page",
    categoryId: "pages-content",
    name: "Additional Basic Page",
    price: 250,
    priceType: "per-page",
    unitLabel: "page",
    shortDescription:
      "Adds one additional standard website page beyond the selected package scope.",
    builderDescription:
      "Use this for simple pages such as a basic about page, gallery page, contact page, simple FAQ page, or general information page.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 20,
    requiresNotes: true,
    notesPrompt:
      "Briefly describe what each additional page should be for.",
    upgradeWarning:
      "If the added pages require SEO strategy, advanced layouts, custom functionality, or a larger content plan, Hullinger Digital may recommend a package upgrade or custom scope adjustment.",
  },
  {
    id: "additional-seo-service-page",
    categoryId: "pages-content",
    name: "Additional SEO Service Page",
    price: 450,
    priceType: "per-page",
    unitLabel: "service page",
    shortDescription:
      "Adds a dedicated SEO-structured page for one specific service.",
    builderDescription:
      "Use this when a business needs separate pages for services customers may search for individually.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 30,
    requiresNotes: true,
    notesPrompt:
      "List the services that need dedicated SEO pages.",
    upgradeWarning:
      "A large number of SEO service pages may require expanded SEO planning, copywriting, or a custom content strategy.",
  },
  {
    id: "additional-service-area-page",
    categoryId: "pages-content",
    name: "Additional Service-Area Page",
    price: 350,
    priceType: "per-page",
    unitLabel: "service-area page",
    shortDescription:
      "Adds a location or service-area page for businesses targeting specific cities or regions.",
    builderDescription:
      "Use this for businesses that serve multiple areas and want a clearer location-based website structure.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 30,
    requiresNotes: true,
    notesPrompt:
      "List the cities, towns, counties, or regions you want to target.",
    upgradeWarning:
      "Service-area pages should be created carefully to avoid thin or duplicate content. Larger location strategies may require additional SEO planning.",
  },
  {
    id: "blog-news-setup",
    categoryId: "pages-content",
    name: "Blog / News Setup",
    price: 600,
    priceType: "fixed",
    shortDescription:
      "Adds a blog, news, or article section structure to the website.",
    builderDescription:
      "Includes the setup for publishing future articles, updates, resources, or educational content.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what type of articles or updates the business may publish.",
  },
  {
    id: "resource-article-template",
    categoryId: "pages-content",
    name: "Resource / Article Template",
    price: 500,
    priceType: "fixed",
    shortDescription:
      "Creates a reusable layout for future resources, guides, or educational articles.",
    builderDescription:
      "Useful for businesses that want a consistent structure for educational content, guides, FAQs, or SEO articles.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the type of resource or article layout needed.",
  },
  {
    id: "copywriting-support-light",
    categoryId: "pages-content",
    name: "Copywriting Support — Light",
    price: 350,
    priceType: "fixed",
    shortDescription:
      "Light editing and polishing of client-provided website copy.",
    builderDescription:
      "Best when the client already has rough copy, bullet points, notes, or existing website content that needs cleaned up.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what copy already exists and what needs polished.",
  },
  {
    id: "full-page-copywriting",
    categoryId: "pages-content",
    name: "Full Page Copywriting",
    price: 500,
    priceType: "per-page",
    unitLabel: "page",
    shortDescription:
      "Full website copywriting for one page based on client information, notes, and goals.",
    builderDescription:
      "Use this when Hullinger Digital needs to write the page from scratch or mostly from scratch.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 20,
    requiresNotes: true,
    notesPrompt:
      "List the pages that need full copywriting.",
  },
  {
    id: "content-migration-base",
    categoryId: "pages-content",
    name: "Content Migration — Base",
    price: 350,
    priceType: "fixed",
    shortDescription:
      "Base setup for moving existing website content into the new website structure.",
    builderDescription:
      "Covers initial review and organization of existing content before migration.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Provide the current website URL and describe what content needs moved.",
  },
  {
    id: "content-migration-per-page",
    categoryId: "pages-content",
    name: "Content Migration — Additional Pages",
    price: 75,
    priceType: "per-page",
    unitLabel: "page",
    shortDescription:
      "Moves one additional page of existing content into the new website.",
    builderDescription:
      "Use this with the content migration base option when several pages need moved.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 50,
    requiresNotes: true,
    notesPrompt:
      "List or estimate how many existing pages need migrated.",
    dependsOn: ["content-migration-base"],
  },
  {
    id: "portfolio-case-study-section",
    categoryId: "pages-content",
    name: "Portfolio / Case Study Section",
    price: 450,
    priceType: "fixed",
    shortDescription:
      "Adds a portfolio, project, or case study preview section to the website.",
    builderDescription:
      "Useful for showing past work, before-and-after results, featured projects, or selected examples.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the projects, examples, or results that should be featured.",
  },
  {
    id: "additional-case-study-page",
    categoryId: "pages-content",
    name: "Additional Case Study Page",
    price: 400,
    priceType: "per-page",
    unitLabel: "case study",
    shortDescription:
      "Adds one dedicated case study or project page.",
    builderDescription:
      "Use this for detailed project stories, before-and-after breakdowns, results, galleries, or proof-based content.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 20,
    requiresNotes: true,
    notesPrompt:
      "Describe the case studies or projects that need individual pages.",
  },

  {
    id: "enhanced-seo-setup",
    categoryId: "seo-local-visibility",
    name: "Enhanced SEO Setup",
    price: 750,
    priceType: "fixed",
    shortDescription:
      "Adds deeper SEO structure beyond the basic setup included with standard website packages.",
    builderDescription:
      "Includes stronger page-level SEO planning, improved headings, metadata direction, internal linking structure, and search-focused page organization.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the services, keywords, or search terms that matter most.",
  },
  {
    id: "local-seo-foundation",
    categoryId: "seo-local-visibility",
    name: "Local SEO Foundation",
    price: 650,
    priceType: "fixed",
    shortDescription:
      "Adds local search structure for businesses serving a defined area.",
    builderDescription:
      "Useful for service-area businesses that need clearer location signals, local trust sections, and location-aware page structure.",
    recommendedForPackages: ["launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "List the main cities, counties, or service areas the business wants to target.",
  },
  {
    id: "google-business-profile-optimization",
    categoryId: "seo-local-visibility",
    name: "Google Business Profile Optimization",
    price: 450,
    priceType: "fixed",
    shortDescription:
      "Improves the business’s Google Business Profile for better alignment with the website.",
    builderDescription:
      "Includes review of categories, description, service areas, services, photos, and website alignment.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Provide the Google Business Profile link if available.",
  },
  {
    id: "schema-structured-data-setup",
    categoryId: "seo-local-visibility",
    name: "Schema / Structured Data Setup",
    price: 500,
    priceType: "fixed",
    shortDescription:
      "Adds structured data markup where appropriate to help search engines better understand the website.",
    builderDescription:
      "May include organization, local business, FAQ, service, article, or other schema depending on the website scope.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe any special business information, FAQs, services, or content types that may need structured data.",
  },
  {
    id: "keyword-competitor-research",
    categoryId: "seo-local-visibility",
    name: "Keyword & Competitor Research",
    price: 650,
    priceType: "fixed",
    shortDescription:
      "Researches service keywords and competitors to guide website structure and content planning.",
    builderDescription:
      "Useful before creating SEO service pages, local visibility strategies, or a larger lead-generation site.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "List competitors, target services, and target areas if known.",
  },
  {
    id: "extra-page-seo-meta-rewrite",
    categoryId: "seo-local-visibility",
    name: "SEO Title / Meta Rewrite for Extra Pages",
    price: 125,
    priceType: "per-page",
    unitLabel: "page",
    shortDescription:
      "Adds SEO title and meta description writing for additional pages.",
    builderDescription:
      "Use this for pages outside the selected package scope that need stronger search presentation.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 50,
    requiresNotes: true,
    notesPrompt:
      "List the pages that need SEO titles and meta descriptions.",
  },
  {
    id: "monthly-seo-content-plan",
    categoryId: "seo-local-visibility",
    name: "Monthly SEO Content Plan",
    price: 450,
    priceType: "monthly",
    shortDescription:
      "Monthly planning support for future SEO-focused content topics.",
    builderDescription:
      "Provides topic direction, content priorities, and SEO content planning. Writing and publishing may be separate depending on scope.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the services or topics the business wants to grow around.",
  },
  {
    id: "monthly-seo-improvement-plan",
    categoryId: "seo-local-visibility",
    name: "Monthly SEO Improvement Plan",
    price: 750,
    priceType: "monthly",
    shortDescription:
      "Ongoing monthly SEO improvement support after launch.",
    builderDescription:
      "May include content improvements, page updates, technical checks, internal linking improvements, and search-focused recommendations.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the SEO goals and whether the business already has an existing website.",
  },

  {
    id: "custom-graphics-icon-set",
    categoryId: "design-media",
    name: "Custom Graphics / Icon Set",
    price: 500,
    priceType: "fixed",
    shortDescription:
      "Adds a custom set of graphics, icons, or visual elements to support the website design.",
    builderDescription:
      "Useful for services, process sections, feature cards, benefit sections, or visual explanations.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what types of graphics or icons would help explain the business.",
  },
  {
    id: "photo-gallery",
    categoryId: "design-media",
    name: "Photo Gallery",
    price: 300,
    priceType: "fixed",
    shortDescription:
      "Adds a clean image gallery section or page.",
    builderDescription:
      "Useful for project photos, work examples, products, shop images, team photos, or before-and-after visuals.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the type and approximate number of photos to include.",
  },
  {
    id: "video-reel-section",
    categoryId: "design-media",
    name: "Video / Reel Section",
    price: 350,
    priceType: "fixed",
    shortDescription:
      "Adds a section designed to feature a video, reel, or short visual explanation.",
    builderDescription:
      "Useful for homepage intros, process explanations, product showcases, or social proof videos.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the video or reel that will be featured.",
  },
  {
    id: "homepage-motion-polish",
    categoryId: "design-media",
    name: "Homepage Animation / Motion Polish",
    price: 600,
    priceType: "fixed",
    shortDescription:
      "Adds tasteful motion, transitions, or animated polish to the homepage.",
    builderDescription:
      "Best for premium sites that need subtle movement without feeling gimmicky.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the type of motion or visual feel desired.",
  },
  {
    id: "advanced-animation-package",
    categoryId: "design-media",
    name: "Advanced Animation Package",
    price: 1200,
    priceType: "fixed",
    shortDescription:
      "Adds a stronger animation or interactive visual package to the website.",
    builderDescription:
      "May include animated explainers, interactive sections, advanced scroll effects, or custom motion concepts.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the animation, visual concept, or section that needs advanced motion.",
  },
  {
    id: "brand-color-style-direction",
    categoryId: "design-media",
    name: "Brand Color / Style Direction",
    price: 350,
    priceType: "fixed",
    shortDescription:
      "Defines a more intentional visual style direction for the website.",
    builderDescription:
      "Useful when the business has limited brand direction and needs help choosing colors, visual mood, and design feel.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe any preferred colors, styles, examples, or designs to avoid.",
  },
  {
    id: "logo-cleanup-polish",
    categoryId: "design-media",
    name: "Logo Cleanup / Polish",
    price: 250,
    priceType: "fixed",
    shortDescription:
      "Cleans up or lightly polishes an existing logo for better website use.",
    builderDescription:
      "Best for businesses that already have a logo but need a cleaner file, better spacing, or improved presentation online.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what logo files are available and what needs improved.",
  },
  {
    id: "basic-logo-design",
    categoryId: "design-media",
    name: "Basic Logo Design",
    price: 650,
    priceType: "fixed",
    shortDescription:
      "Creates a simple professional logo direction for businesses that need a clean starting point.",
    builderDescription:
      "Best for businesses that need a usable logo, not a full brand identity system.",
    recommendedForPackages: ["starter-web-page", "launch-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the business name, preferred style, colors, and any logo ideas.",
  },
  {
    id: "premium-logo-brand-starter-kit",
    categoryId: "design-media",
    name: "Premium Logo / Brand Starter Kit",
    price: 1250,
    priceType: "fixed",
    shortDescription:
      "Creates a stronger starter brand system with logo direction and basic visual guidelines.",
    builderDescription:
      "Useful when the website needs a more polished brand foundation before design begins.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the desired brand feel, audience, colors, and examples of brands you like.",
  },
  {
    id: "before-after-slider-section",
    categoryId: "design-media",
    name: "Before / After Slider Section",
    price: 300,
    priceType: "fixed",
    shortDescription:
      "Adds an interactive before-and-after image comparison section.",
    builderDescription:
      "Useful for contractors, detailers, repair shops, designers, restoration work, fitness, beauty, and project-based services.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the before-and-after images or examples that will be used.",
  },
  {
    id: "interactive-comparison-section",
    categoryId: "design-media",
    name: "Interactive Comparison Section",
    price: 450,
    priceType: "fixed",
    shortDescription:
      "Adds a visual section comparing options, packages, services, or outcomes.",
    builderDescription:
      "Useful for explaining value differences, service comparisons, package tiers, or why one approach is better than another.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what needs compared.",
  },

  {
    id: "additional-simple-form",
    categoryId: "forms-lead-capture",
    name: "Additional Simple Form",
    price: 200,
    priceType: "fixed",
    shortDescription:
      "Adds one additional basic form beyond the standard contact form.",
    builderDescription:
      "Use this for simple forms such as a newsletter signup, basic request form, basic referral form, or simple question form.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 10,
    requiresNotes: true,
    notesPrompt:
      "Describe what each simple form should collect.",
  },
  {
    id: "advanced-quote-request-form",
    categoryId: "forms-lead-capture",
    name: "Advanced Quote / Request Form",
    price: 650,
    priceType: "fixed",
    shortDescription:
      "Adds a stronger quote or request form with more detailed customer intake fields.",
    builderDescription:
      "Useful for service businesses that need more than name, phone, email, and message.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "List the fields or information the form should collect.",
  },
  {
    id: "conditional-logic-form",
    categoryId: "forms-lead-capture",
    name: "Conditional Logic Form",
    price: 950,
    priceType: "fixed",
    shortDescription:
      "Adds a form that changes questions based on customer answers.",
    builderDescription:
      "Useful for quote forms, intake flows, service selection, product questions, or multi-path request forms.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the choices customers should make and what questions should appear based on those choices.",
  },
  {
    id: "file-photo-upload-form",
    categoryId: "forms-lead-capture",
    name: "File / Photo Upload Form",
    price: 500,
    priceType: "fixed",
    shortDescription:
      "Allows customers to upload photos or files through a website form.",
    builderDescription:
      "Useful for estimates, diagnostics, design requests, applications, proof documents, or project intake.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what customers need to upload and why.",
  },
  {
    id: "multi-step-intake-form",
    categoryId: "forms-lead-capture",
    name: "Multi-Step Intake Form",
    price: 950,
    priceType: "fixed",
    shortDescription:
      "Creates a guided multi-step form instead of one long form.",
    builderDescription:
      "Useful for more complex intake flows where customers need to answer several categories of questions.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the major steps or sections the intake form should include.",
  },
  {
    id: "lead-routing-by-service-location",
    categoryId: "forms-lead-capture",
    name: "Lead Routing by Service / Location",
    price: 750,
    priceType: "fixed",
    shortDescription:
      "Routes leads based on selected service, location, or request type.",
    builderDescription:
      "Useful for businesses with multiple service types, locations, departments, or team members.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe how leads should be sorted or routed.",
  },
  {
    id: "crm-contact-sheet-integration",
    categoryId: "forms-lead-capture",
    name: "CRM / Contact Sheet Integration",
    price: 500,
    priceType: "fixed",
    shortDescription:
      "Connects website form submissions to a CRM-style contact list, spreadsheet, or lead sheet.",
    builderDescription:
      "Useful for organizing leads instead of only receiving email notifications.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe where leads should go after submission.",
  },
  {
    id: "spam-protection-security-setup",
    categoryId: "forms-lead-capture",
    name: "Spam Protection / Security Setup",
    price: 150,
    priceType: "fixed",
    shortDescription:
      "Adds additional spam protection or security measures to forms.",
    builderDescription:
      "Useful for public-facing forms that may attract spam or low-quality submissions.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: false,
  },

  {
    id: "simple-payment-setup",
    categoryId: "online-sales-payments",
    name: "Simple Payment Setup",
    price: 350,
    priceType: "fixed",
    shortDescription:
      "Adds a simple way to accept payments online.",
    builderDescription:
      "Useful for businesses that need a basic payment link or simple payment flow without a full checkout system.",
    recommendedForPackages: ["launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what the payment is for and which payment processor will be used if known.",
  },
  {
    id: "deposit-payment-button-setup",
    categoryId: "online-sales-payments",
    name: "Deposit / Payment Button Setup",
    price: 300,
    priceType: "fixed",
    shortDescription:
      "Adds a button or simple payment path for deposits or fixed payments.",
    builderDescription:
      "Useful for service deposits, booking fees, retainers, consultations, or simple invoice-style payments.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the payment amount, purpose, and payment provider if known.",
  },
  {
    id: "basic-product-service-checkout",
    categoryId: "online-sales-payments",
    name: "Basic Product / Service Checkout",
    price: 750,
    priceType: "fixed",
    shortDescription:
      "Adds a basic checkout flow for a small number of products or services.",
    builderDescription:
      "Useful for simple service packages, digital services, small menus, or limited product offerings.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what products or services customers should be able to purchase.",
  },
  {
    id: "small-product-catalog",
    categoryId: "online-sales-payments",
    name: "Small Product Catalog — Up to 10 Products",
    price: 1250,
    priceType: "fixed",
    shortDescription:
      "Adds a small product catalog with up to 10 products.",
    builderDescription:
      "Useful for businesses selling a limited set of products online.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the product types and whether products need options like size, color, flavor, or quantity.",
  },
  {
    id: "additional-products",
    categoryId: "online-sales-payments",
    name: "Additional Products",
    price: 35,
    priceType: "per-product",
    unitLabel: "product",
    shortDescription:
      "Adds additional products beyond the included product count.",
    builderDescription:
      "Use this when the product catalog needs more than the included number of products.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 200,
    requiresNotes: true,
    notesPrompt:
      "Estimate how many additional products need added.",
    dependsOn: ["small-product-catalog", "basic-ecommerce-setup", "advanced-ecommerce-workflow"],
  },
  {
    id: "basic-ecommerce-setup",
    categoryId: "online-sales-payments",
    name: "Basic E-Commerce Setup",
    price: 2500,
    priceType: "fixed",
    shortDescription:
      "Adds a basic online store structure.",
    builderDescription:
      "Useful for businesses that need product pages, cart/checkout structure, and basic online selling functionality.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the products, categories, payment needs, shipping/pickup needs, and order process.",
    upgradeWarning:
      "Complex e-commerce workflows may require the Advanced E-Commerce Workflow option or a custom scope review.",
  },
  {
    id: "pickup-delivery-options",
    categoryId: "online-sales-payments",
    name: "Pickup / Delivery Options",
    price: 650,
    priceType: "fixed",
    shortDescription:
      "Adds pickup or local delivery options to an order or checkout flow.",
    builderDescription:
      "Useful for bakeries, restaurants, local shops, florists, service providers, and local delivery businesses.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe pickup locations, delivery areas, timing, and any rules customers need to know.",
  },
  {
    id: "shipping-setup",
    categoryId: "online-sales-payments",
    name: "Shipping Setup",
    price: 750,
    priceType: "fixed",
    shortDescription:
      "Adds shipping options to an online store or order flow.",
    builderDescription:
      "Useful for businesses that sell shippable products and need shipping rules, zones, or charges configured.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what products ship, where they ship, and any shipping rules or restrictions.",
  },
  {
    id: "gift-card-setup",
    categoryId: "online-sales-payments",
    name: "Gift Card Setup",
    price: 500,
    priceType: "fixed",
    shortDescription:
      "Adds gift card purchase or redemption structure.",
    builderDescription:
      "Useful for businesses that want to sell gift cards online or support gift-card-style purchases.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe gift card amounts, delivery method, and redemption process.",
  },
  {
    id: "subscription-payment-plan-setup",
    categoryId: "online-sales-payments",
    name: "Subscription / Payment Plan Setup",
    price: 900,
    priceType: "fixed",
    shortDescription:
      "Adds recurring payment, subscription, or payment-plan setup.",
    builderDescription:
      "Useful for memberships, monthly services, retainers, recurring products, or payment-plan offers.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the subscription or payment-plan structure.",
  },
  {
    id: "custom-order-form-with-payment",
    categoryId: "online-sales-payments",
    name: "Custom Order Form With Payment",
    price: 1500,
    priceType: "fixed",
    shortDescription:
      "Adds a custom order form connected to payment collection.",
    builderDescription:
      "Useful for custom products, special orders, quote-based payments, deposits, or order flows that need more than a standard cart.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the custom order process, required fields, pricing rules, and payment needs.",
  },
  {
    id: "advanced-ecommerce-workflow",
    categoryId: "online-sales-payments",
    name: "Advanced E-Commerce Workflow",
    price: 4500,
    priceType: "fixed",
    shortDescription:
      "Adds a more advanced e-commerce or order management workflow.",
    builderDescription:
      "Useful when the ordering process has custom rules, mixed fulfillment, customer accounts, approvals, deposits, subscriptions, or admin workflow needs.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the full sales, checkout, fulfillment, and admin workflow.",
    upgradeWarning:
      "This option requires project review before production to confirm technical feasibility and scope.",
  },

  {
    id: "booking-link-integration",
    categoryId: "booking-scheduling",
    name: "Booking Link Integration",
    price: 250,
    priceType: "fixed",
    shortDescription:
      "Adds a button or section linking to an existing scheduling tool.",
    builderDescription:
      "Useful when the business already uses a scheduling platform and only needs the website connected to it.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Provide the booking link or scheduling platform name.",
  },
  {
    id: "embedded-scheduling-calendar",
    categoryId: "booking-scheduling",
    name: "Embedded Scheduling Calendar",
    price: 400,
    priceType: "fixed",
    shortDescription:
      "Embeds a scheduling calendar directly into the website.",
    builderDescription:
      "Useful when customers should be able to see availability or request a time without leaving the site.",
    recommendedForPackages: ["launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the scheduling platform and what customers should book.",
  },
  {
    id: "service-based-booking-flow",
    categoryId: "booking-scheduling",
    name: "Service-Based Booking Flow",
    price: 750,
    priceType: "fixed",
    shortDescription:
      "Adds a booking flow where customers choose a service before scheduling.",
    builderDescription:
      "Useful for businesses with different service types, appointment lengths, or booking categories.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "List the services customers should choose from and any timing rules.",
  },
  {
    id: "booking-with-deposit-payment",
    categoryId: "booking-scheduling",
    name: "Booking With Deposit / Payment",
    price: 950,
    priceType: "fixed",
    shortDescription:
      "Adds deposit or payment collection to a booking flow.",
    builderDescription:
      "Useful when appointments, consultations, services, or reservations require payment before confirmation.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the booking deposit/payment amount and confirmation process.",
  },
  {
    id: "appointment-request-workflow",
    categoryId: "booking-scheduling",
    name: "Appointment Request Workflow",
    price: 650,
    priceType: "fixed",
    shortDescription:
      "Creates a request-based appointment workflow instead of direct booking.",
    builderDescription:
      "Useful when the business needs to review requests before confirming an appointment.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what customers request and how appointments should be approved or confirmed.",
  },
  {
    id: "automated-booking-confirmation",
    categoryId: "booking-scheduling",
    name: "Automated Booking Confirmation",
    price: 450,
    priceType: "fixed",
    shortDescription:
      "Adds automated confirmation messaging for booking or appointment requests.",
    builderDescription:
      "Useful for confirming next steps, setting expectations, or sending basic instructions after a booking/request.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what confirmation message customers should receive.",
  },

  {
    id: "basic-auto-reply-email",
    categoryId: "automations",
    name: "Basic Auto-Reply Email",
    price: 250,
    priceType: "fixed",
    shortDescription:
      "Sends a basic automatic email after a form submission.",
    builderDescription:
      "Useful for confirming receipt and setting expectations after a customer contacts the business.",
    recommendedForPackages: ["starter-web-page", "launch-website", "lead-generating-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what customers should be told after submitting the form.",
  },
  {
    id: "advanced-customer-email-sequence",
    categoryId: "automations",
    name: "Advanced Customer Email Sequence",
    price: 650,
    priceType: "fixed",
    shortDescription:
      "Adds a multi-email customer follow-up sequence.",
    builderDescription:
      "Useful for onboarding, quote follow-up, appointment prep, order updates, or lead nurturing.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe when emails should send and what each should communicate.",
  },
  {
    id: "sms-notification-setup",
    categoryId: "automations",
    name: "SMS Notification Setup",
    price: 500,
    priceType: "fixed",
    shortDescription:
      "Adds SMS notification setup for leads, customers, or internal alerts.",
    builderDescription:
      "Useful when form submissions, bookings, or requests should trigger text notifications.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe who should receive SMS messages and what should trigger them.",
  },
  {
    id: "lead-follow-up-workflow",
    categoryId: "automations",
    name: "Lead Follow-Up Workflow",
    price: 900,
    priceType: "fixed",
    shortDescription:
      "Adds a structured lead follow-up workflow after someone submits a request.",
    builderDescription:
      "Useful for businesses that do not want serious leads to get buried after the first inquiry.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe how leads should be followed up with and who should be notified.",
  },
  {
    id: "review-request-automation",
    categoryId: "automations",
    name: "Review Request Automation",
    price: 500,
    priceType: "fixed",
    shortDescription:
      "Adds an automated or semi-automated review request flow.",
    builderDescription:
      "Useful for businesses that want to ask customers for reviews after a completed job, order, or appointment.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe when customers should be asked for a review and where reviews should be directed.",
  },
  {
    id: "internal-notification-workflow",
    categoryId: "automations",
    name: "Internal Notification Workflow",
    price: 450,
    priceType: "fixed",
    shortDescription:
      "Sends internal notifications when important website actions happen.",
    builderDescription:
      "Useful for notifying staff about new leads, quote requests, uploads, payments, approvals, or bookings.",
    recommendedForPackages: ["launch-website", "lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe who should be notified and what should trigger the notification.",
  },
  {
    id: "form-to-spreadsheet-database-automation",
    categoryId: "automations",
    name: "Form-to-Spreadsheet / Database Automation",
    price: 500,
    priceType: "fixed",
    shortDescription:
      "Sends form data into a spreadsheet, database, or structured record system.",
    builderDescription:
      "Useful for organizing submissions beyond email notifications.",
    recommendedForPackages: ["lead-generating-website", "advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe where form data should be stored.",
  },
  {
    id: "multi-step-automation-workflow",
    categoryId: "automations",
    name: "Multi-Step Automation Workflow",
    price: 1250,
    priceType: "fixed",
    shortDescription:
      "Creates a more advanced workflow with multiple actions or steps.",
    builderDescription:
      "Useful when one submission needs to trigger several actions, notifications, records, or customer messages.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the full workflow from trigger to final action.",
    upgradeWarning:
      "Complex automation workflows may require technical review before final approval.",
  },

  {
    id: "customer-portal-starter",
    categoryId: "customer-tools",
    name: "Customer Portal Starter",
    price: 2500,
    priceType: "fixed",
    shortDescription:
      "Adds a starter customer portal structure.",
    builderDescription:
      "Useful when customers need a private area to view information, submit requests, upload files, or track status.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what customers should be able to see or do inside the portal.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "customer-account-login",
    categoryId: "customer-tools",
    name: "Customer Account Login",
    price: 1500,
    priceType: "fixed",
    shortDescription:
      "Adds customer account login functionality.",
    builderDescription:
      "Useful when customers need private access to request history, status, files, payments, or account-specific information.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe why customers need accounts and what they should access.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "customer-file-photo-uploads",
    categoryId: "customer-tools",
    name: "Customer File / Photo Uploads",
    price: 750,
    priceType: "fixed",
    shortDescription:
      "Allows customers to upload files or photos through a customer-facing tool.",
    builderDescription:
      "Useful for estimates, project requests, diagnostics, proofs, applications, or order details.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what customers need to upload and how it should be used.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "customer-request-status-view",
    categoryId: "customer-tools",
    name: "Customer Request / Status View",
    price: 1200,
    priceType: "fixed",
    shortDescription:
      "Lets customers view the status of a request, job, order, or project.",
    builderDescription:
      "Useful when customers need updates without calling or emailing for every status check.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what statuses customers should see.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "customer-approval-system",
    categoryId: "customer-tools",
    name: "Customer Approval System",
    price: 1000,
    priceType: "fixed",
    shortDescription:
      "Allows customers to approve estimates, designs, orders, changes, or project steps.",
    builderDescription:
      "Useful when work should not proceed until the customer approves something online.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what customers need to approve.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "customer-message-request-history",
    categoryId: "customer-tools",
    name: "Customer Message / Request History",
    price: 1250,
    priceType: "fixed",
    shortDescription:
      "Adds a history view for customer messages, requests, or submissions.",
    builderDescription:
      "Useful when customers or staff need to see prior requests or conversations in one place.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what history should be visible and who should access it.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "customer-invoice-payment-area",
    categoryId: "customer-tools",
    name: "Customer Invoice / Payment Area",
    price: 900,
    priceType: "fixed",
    shortDescription:
      "Adds a customer-facing area for invoices, deposits, or payment links.",
    builderDescription:
      "Useful when customers need a private or semi-private place to view payment-related information.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe how invoices, deposits, or payments should work.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "customer-dashboard",
    categoryId: "customer-tools",
    name: "Customer Dashboard",
    price: 1500,
    priceType: "fixed",
    shortDescription:
      "Adds a customer dashboard for key account, request, order, or project information.",
    builderDescription:
      "Useful when customers need a central place to view status, actions, files, approvals, or account details.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what dashboard cards, statuses, or actions customers should see.",
    packageRestriction: ["advanced-website"],
  },

  {
    id: "employee-login-starter",
    categoryId: "employee-internal-tools",
    name: "Employee Login Starter",
    price: 1500,
    priceType: "fixed",
    shortDescription:
      "Adds starter employee or staff login functionality.",
    builderDescription:
      "Includes basic staff access planning with up to 3 employee users.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe who needs employee access and what they should do after logging in.",
    includedQuantity: 3,
    includedQuantityLabel: "employee users",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "additional-employee-users",
    categoryId: "employee-internal-tools",
    name: "Additional Employee Users",
    price: 75,
    priceType: "per-user",
    unitLabel: "user",
    shortDescription:
      "Adds employee users beyond the included starter amount.",
    builderDescription:
      "Use this when more than the included employee users need access.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: true,
    minQuantity: 1,
    maxQuantity: 100,
    requiresNotes: true,
    notesPrompt:
      "Estimate how many additional employee users are needed.",
    dependsOn: ["employee-login-starter"],
    packageRestriction: ["advanced-website"],
  },
  {
    id: "role-based-access",
    categoryId: "employee-internal-tools",
    name: "Role-Based Access",
    price: 900,
    priceType: "fixed",
    shortDescription:
      "Adds different access levels for different users or roles.",
    builderDescription:
      "Useful when owners, managers, employees, contractors, or customers should see different tools or information.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the roles and what each role should be allowed to access.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "staff-dashboard",
    categoryId: "employee-internal-tools",
    name: "Staff Dashboard",
    price: 1500,
    priceType: "fixed",
    shortDescription:
      "Adds an internal dashboard for staff or management.",
    builderDescription:
      "Useful for showing leads, tasks, jobs, requests, approvals, notifications, or business activity in one place.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what staff should see on the dashboard.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "internal-notes-system",
    categoryId: "employee-internal-tools",
    name: "Internal Notes System",
    price: 750,
    priceType: "fixed",
    shortDescription:
      "Adds internal notes to leads, customers, jobs, requests, or records.",
    builderDescription:
      "Useful when staff need to document conversations, updates, decisions, or follow-up notes.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe where internal notes should appear and who should see them.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "task-list-work-stages",
    categoryId: "employee-internal-tools",
    name: "Task List / Work Stages",
    price: 1200,
    priceType: "fixed",
    shortDescription:
      "Adds task lists, work stages, or progress tracking for internal work.",
    builderDescription:
      "Useful for organizing jobs, projects, orders, follow-ups, or production steps.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the tasks or stages the business needs to track.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "lead-status-tracking",
    categoryId: "employee-internal-tools",
    name: "Lead Status Tracking",
    price: 1000,
    priceType: "fixed",
    shortDescription:
      "Adds internal lead status tracking.",
    builderDescription:
      "Useful for tracking new leads, contacted leads, quoted leads, follow-ups, won jobs, and lost opportunities.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "List the lead stages the business uses or wants to use.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "job-workflow-tracking",
    categoryId: "employee-internal-tools",
    name: "Job / Workflow Tracking",
    price: 2500,
    priceType: "fixed",
    shortDescription:
      "Adds internal job or workflow tracking.",
    builderDescription:
      "Useful for businesses that need to track work from request to completion through multiple stages.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the workflow from new request to completed job.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "internal-form-system",
    categoryId: "employee-internal-tools",
    name: "Internal Form System",
    price: 850,
    priceType: "fixed",
    shortDescription:
      "Adds internal forms for staff use.",
    builderDescription:
      "Useful for inspections, checklists, job notes, approvals, intake, reports, or internal requests.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what internal forms staff need to complete.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "reporting-dashboard",
    categoryId: "employee-internal-tools",
    name: "Reporting Dashboard",
    price: 1500,
    priceType: "fixed",
    shortDescription:
      "Adds reporting views for leads, jobs, sales, requests, or other business activity.",
    builderDescription:
      "Useful when owners or managers need summary information and visibility into business activity.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what reports, numbers, or charts should be visible.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "admin-panel",
    categoryId: "employee-internal-tools",
    name: "Admin Panel",
    price: 2500,
    priceType: "fixed",
    shortDescription:
      "Adds a custom admin panel for managing records, content, users, or workflows.",
    builderDescription:
      "Useful when the business needs an internal control area instead of only public website pages.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what admins need to manage.",
    packageRestriction: ["advanced-website"],
  },

  {
    id: "ai-intake-summarizer",
    categoryId: "ai-tools",
    name: "AI Intake Summarizer",
    price: 1250,
    priceType: "fixed",
    shortDescription:
      "Adds AI-assisted summaries for customer intake, requests, or form submissions.",
    builderDescription:
      "Useful when long customer submissions need to be turned into quick readable summaries for staff.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what type of intake or submissions AI should summarize.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "ai-reply-assistant",
    categoryId: "ai-tools",
    name: "AI Reply Assistant",
    price: 1500,
    priceType: "fixed",
    shortDescription:
      "Adds AI-assisted draft replies for customer communication.",
    builderDescription:
      "Useful when staff need help responding to leads, requests, quotes, updates, or support messages.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what types of replies AI should help draft.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "ai-estimate-helper",
    categoryId: "ai-tools",
    name: "AI Estimate Helper",
    price: 2500,
    priceType: "fixed",
    shortDescription:
      "Adds AI-assisted estimate or quote support.",
    builderDescription:
      "Useful when customer intake needs to be interpreted and turned into estimate guidance, scope notes, or draft pricing support.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the estimating process and what AI should help with.",
    packageRestriction: ["advanced-website"],
    upgradeWarning:
      "AI estimate tools require careful review because pricing logic, business rules, and liability boundaries must be defined clearly.",
  },
  {
    id: "ai-content-assistant",
    categoryId: "ai-tools",
    name: "AI Content Assistant",
    price: 1250,
    priceType: "fixed",
    shortDescription:
      "Adds AI-assisted content drafting or editing support.",
    builderDescription:
      "Useful when staff need help drafting website updates, posts, descriptions, FAQs, or customer-facing content.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what type of content AI should help create or edit.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "ai-internal-workflow-assistant",
    categoryId: "ai-tools",
    name: "AI Internal Workflow Assistant",
    price: 2500,
    priceType: "fixed",
    shortDescription:
      "Adds AI-assisted support for internal workflows, notes, summaries, or next-step recommendations.",
    builderDescription:
      "Useful when internal staff need help interpreting requests, summarizing records, organizing next steps, or preparing responses.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe the internal workflow AI should support.",
    packageRestriction: ["advanced-website"],
  },
  {
    id: "ai-knowledge-base-helper",
    categoryId: "ai-tools",
    name: "AI Knowledge-Base Helper",
    price: 1750,
    priceType: "fixed",
    shortDescription:
      "Adds an AI-assisted helper based on approved business information or knowledge-base content.",
    builderDescription:
      "Useful when customers or staff need help finding answers from approved business information.",
    recommendedForPackages: ["advanced-website"],
    requiresQuantity: false,
    requiresNotes: true,
    notesPrompt:
      "Describe what knowledge base or approved information AI should use.",
    packageRestriction: ["advanced-website"],
  },
];

export const addonSelectionRules = {
  scopeReviewRequired:
    "All selected add-ons are reviewed before production begins. If an add-on creates requirements outside the selected package, Hullinger Digital may recommend a scope adjustment, package upgrade, revised timeline, or custom project review.",
  advancedToolsRule:
    "Customer tools, employee tools, internal dashboards, advanced workflows, and AI tools generally require the Advanced Website package because they involve custom functionality beyond standard website pages.",
  quantityRule:
    "Quantity-based add-ons are estimates until reviewed. Final scope may be adjusted if the requested pages, products, users, or workflows require more complexity than the selected quantity reflects.",
  dependencyRule:
    "Some add-ons depend on another setup item. If a dependent item is selected without the required base item, the builder should prompt the client to add the required setup or request project review.",
};

export const addonPricingNotes = {
  fixed:
    "Fixed-price add-ons apply once unless the project details require expanded custom scope.",
  perPage:
    "Per-page add-ons multiply by the selected quantity and may require review if pages need unusual layouts, custom functionality, or extensive writing.",
  monthly:
    "Monthly add-ons are ongoing services and may require a separate service agreement or care plan.",
  advanced:
    "Advanced add-ons are starting-point prices and require review before final approval.",
};