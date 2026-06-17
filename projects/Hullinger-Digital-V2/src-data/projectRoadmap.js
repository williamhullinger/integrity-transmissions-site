export const projectRoadmap = {
  projectName: "Hullinger Digital V2",
  buildStrategy:
    "Prepare the content, pricing data, builder logic, visual direction, and planning files first, then move into a full React/Vite build when the development computer is ready.",
  currentPhase:
    "Pre-build data and planning foundation",
  finalBuildStack: {
    frontend: "React",
    buildTool: "Vite",
    styling:
      "CSS first, with the option to move into Tailwind or component-level styling later if needed.",
    deployment:
      "Netlify or Vercel recommended after the production build is ready.",
    futureIntegrations: [
      "Payment processor",
      "E-signature or contract flow",
      "Form submissions",
      "Email notifications",
      "File uploads",
      "Analytics",
      "SEO metadata",
      "Possible CRM or project record storage",
    ],
  },
};

export const roadmapPhases = [
  {
    id: "phase-1-foundation-files",
    phaseNumber: 1,
    name: "Foundation Files",
    status: "in-progress",
    goal:
      "Create React-ready data, content, pricing, builder, brand, visual, and planning files before installing the full React/Vite environment.",
    reason:
      "This allows meaningful progress on a storage-limited computer without installing Node, Vite, dependencies, or node_modules yet.",
    deliverables: [
      "Package data",
      "Add-on data",
      "Care plan data",
      "Payment plan data",
      "Builder step data",
      "Intake question data",
      "Site page structure",
      "Brand system",
      "Reusable content blocks",
      "Visual section planning",
      "Project roadmap",
    ],
    files: [
      "src-data/packages.js",
      "src-data/addons.js",
      "src-data/carePlans.js",
      "src-data/paymentPlans.js",
      "src-data/builderSteps.js",
      "src-data/intakeQuestions.js",
      "src-data/sitePages.js",
      "src-data/brandSystem.js",
      "src-data/contentBlocks.js",
      "src-data/visualSections.js",
      "src-data/projectRoadmap.js",
    ],
    completionCriteria: [
      "All core data files are created and saved",
      "Package, add-on, care plan, and payment structures are consistent",
      "Builder flow has clear steps and validation rules",
      "Page structure is defined before React components are written",
      "Brand and visual direction are documented before styling begins",
    ],
  },

  {
    id: "phase-2-react-vite-setup",
    phaseNumber: 2,
    name: "React/Vite Setup",
    status: "future",
    goal:
      "Create the real React/Vite project once the development computer is ready.",
    reason:
      "React/Vite should be installed on a computer with enough storage and performance to handle Node, dependencies, local development, browser preview, Git, and future assets.",
    deliverables: [
      "Vite React project",
      "Clean folder structure",
      "Data files moved into src/data",
      "Base routing structure",
      "Global CSS foundation",
      "Initial layout components",
    ],
    filesToCreate: [
      "src/main.jsx",
      "src/App.jsx",
      "src/data/packages.js",
      "src/data/addons.js",
      "src/data/carePlans.js",
      "src/data/paymentPlans.js",
      "src/data/builderSteps.js",
      "src/data/intakeQuestions.js",
      "src/data/sitePages.js",
      "src/data/brandSystem.js",
      "src/data/contentBlocks.js",
      "src/data/visualSections.js",
      "src/styles/global.css",
      "src/styles/variables.css",
      "src/styles/layout.css",
    ],
    completionCriteria: [
      "npm install completes successfully",
      "npm run dev launches the local site",
      "Home page renders",
      "Navigation works",
      "Global styles load",
      "Data imports work without errors",
    ],
  },

  {
    id: "phase-3-core-layout",
    phaseNumber: 3,
    name: "Core Layout",
    status: "future",
    goal:
      "Build the reusable layout structure that every page will use.",
    reason:
      "The site should feel consistent, premium, and organized before individual pages are built out.",
    deliverables: [
      "Header",
      "Footer",
      "Main layout wrapper",
      "Navigation menu",
      "Mobile navigation",
      "CTA buttons",
      "Section wrapper",
      "Card components",
      "Callout components",
      "Responsive layout utilities",
    ],
    componentsToCreate: [
      "src/components/layout/Header.jsx",
      "src/components/layout/Footer.jsx",
      "src/components/layout/MainLayout.jsx",
      "src/components/navigation/NavMenu.jsx",
      "src/components/ui/Button.jsx",
      "src/components/ui/Section.jsx",
      "src/components/ui/Card.jsx",
      "src/components/ui/Callout.jsx",
      "src/components/ui/Badge.jsx",
    ],
    completionCriteria: [
      "Header and footer appear on all pages",
      "Navigation links are pulled from sitePages/navigationItems data",
      "Buttons and cards have consistent styling",
      "Mobile layout is usable",
      "No page-specific styling is hardcoded into global layout components",
    ],
  },

  {
    id: "phase-4-homepage-build",
    phaseNumber: 4,
    name: "Homepage Build",
    status: "future",
    goal:
      "Build the homepage as the premium first impression and main routing page.",
    reason:
      "The homepage needs to educate, position Hullinger Digital, explain the service ladder, and move visitors toward the builder or review path.",
    deliverables: [
      "Hero section",
      "Website should do more section",
      "Template vs custom section",
      "SEO foundation section",
      "Service selector section",
      "Hands-on builder process section",
      "Advanced possibilities section",
      "Pricing preview section",
      "Structured review section",
      "Selected work section",
      "Final CTA section",
    ],
    componentsToCreate: [
      "src/pages/Home.jsx",
      "src/components/sections/HeroSection.jsx",
      "src/components/sections/CustomVsTemplateSection.jsx",
      "src/components/sections/SeoFoundationSection.jsx",
      "src/components/sections/ServiceSelectorSection.jsx",
      "src/components/sections/ProcessSection.jsx",
      "src/components/sections/AdvancedToolsPreview.jsx",
      "src/components/sections/PricingPreview.jsx",
      "src/components/sections/ReviewProcessSection.jsx",
      "src/components/sections/SelectedWorkSection.jsx",
      "src/components/sections/FinalCtaSection.jsx",
    ],
    completionCriteria: [
      "Homepage feels premium and not generic",
      "Visual placeholders are included where final mockups/reels will go",
      "Service cards route to the correct service pages",
      "Builder CTA is clear",
      "Copy does not repeat service pages word-for-word",
    ],
  },

  {
    id: "phase-5-service-pages",
    phaseNumber: 5,
    name: "Service Pages",
    status: "future",
    goal:
      "Build the four website package pages with deeper education and clearer fit guidance.",
    reason:
      "Visitors should understand each offer before entering the builder.",
    deliverables: [
      "Starter Web Page page",
      "Launch Website page",
      "Lead-Generating Website page",
      "Advanced Website page",
      "Package-specific CTA sections",
      "Upgrade path explanations",
      "Included/not-included sections",
      "Visual mockup placeholders",
    ],
    pagesToCreate: [
      "src/pages/StarterWebPage.jsx",
      "src/pages/LaunchWebsite.jsx",
      "src/pages/LeadGeneratingWebsite.jsx",
      "src/pages/AdvancedWebsite.jsx",
    ],
    componentsToCreate: [
      "src/components/packages/PackageHero.jsx",
      "src/components/packages/IncludedFeatures.jsx",
      "src/components/packages/NotIncluded.jsx",
      "src/components/packages/BestForList.jsx",
      "src/components/packages/UpgradePath.jsx",
      "src/components/packages/PackageCta.jsx",
    ],
    completionCriteria: [
      "Each service page has a distinct purpose",
      "Lower tiers do not feel cheap",
      "Advanced page clearly explains business tools",
      "Each page has a direct builder CTA",
      "Package data is pulled from packages.js where possible",
    ],
  },

  {
    id: "phase-6-pricing-about-terms-review",
    phaseNumber: 6,
    name: "Supporting Pages",
    status: "future",
    goal:
      "Build the pricing, about, website review, and terms preview pages.",
    reason:
      "These pages support trust, clarify expectations, and create an alternate path for users who are not ready for the builder.",
    deliverables: [
      "Pricing page",
      "About page",
      "Website Review page",
      "Terms Preview page",
      "Package comparison",
      "Care plan comparison",
      "Payment terms explanation",
      "Review request form layout",
    ],
    pagesToCreate: [
      "src/pages/Pricing.jsx",
      "src/pages/About.jsx",
      "src/pages/WebsiteReview.jsx",
      "src/pages/TermsPreview.jsx",
    ],
    completionCriteria: [
      "Pricing is clear without feeling bargain-focused",
      "About page feels company-minded, not small freelancer-focused",
      "Terms page explains scope/payment/ownership responsibly",
      "Website Review page provides a clear alternate CTA",
    ],
  },

  {
    id: "phase-7-builder-v1",
    phaseNumber: 7,
    name: "Website Builder V1",
    status: "future",
    goal:
      "Build the first working version of the website builder/configurator.",
    reason:
      "The builder is the centerpiece of the buying experience and needs to calculate package, add-ons, care plans, payment options, and intake requirements.",
    deliverables: [
      "Package selection",
      "Add-on selection",
      "Quantity-based add-ons",
      "Required notes for selected add-ons",
      "Care plan selection",
      "Payment option selection",
      "Design direction questions",
      "Business/project intake questions",
      "Review summary",
      "Acknowledgements",
      "Sticky pricing summary",
    ],
    componentsToCreate: [
      "src/pages/WebsiteBuilder.jsx",
      "src/components/builder/BuilderLayout.jsx",
      "src/components/builder/BuilderProgress.jsx",
      "src/components/builder/PackageSelector.jsx",
      "src/components/builder/AddOnSelector.jsx",
      "src/components/builder/QuantitySelector.jsx",
      "src/components/builder/NotesField.jsx",
      "src/components/builder/CarePlanSelector.jsx",
      "src/components/builder/PaymentPlanSelector.jsx",
      "src/components/builder/IntakeQuestionRenderer.jsx",
      "src/components/builder/PriceSummary.jsx",
      "src/components/builder/ReviewSummary.jsx",
      "src/components/builder/AcknowledgementList.jsx",
    ],
    logicToCreate: [
      "src/utils/calculateProjectTotal.js",
      "src/utils/filterAddonsByPackage.js",
      "src/utils/getRecommendedCarePlan.js",
      "src/utils/getPaymentOptionsForPackage.js",
      "src/utils/validateBuilderStep.js",
    ],
    completionCriteria: [
      "Selecting a package updates the price summary",
      "Selecting add-ons updates one-time and monthly totals",
      "Quantity add-ons calculate correctly",
      "Monthly care plans show separately from one-time build totals",
      "Payment plans show amount due today and estimated total",
      "Required questions block review until completed",
      "Review acknowledgements are required before agreement step",
    ],
  },

  {
    id: "phase-8-visual-polish",
    phaseNumber: 8,
    name: "Visual Polish",
    status: "future",
    goal:
      "Replace rough placeholders with stronger mockups, visuals, motion, and final design polish.",
    reason:
      "The site needs to visually prove that Hullinger Digital can build premium, modern websites.",
    deliverables: [
      "Hero mockups",
      "SEO path visual",
      "Template vs custom visual",
      "Builder preview visual",
      "Advanced dashboard mockups",
      "Service page mockups",
      "Motion effects",
      "Responsive polish",
    ],
    completionCriteria: [
      "Site does not feel text-only",
      "Visuals support the message",
      "Motion is subtle and premium",
      "Mobile layout still works well",
      "No blank placeholder sections remain",
    ],
  },

  {
    id: "phase-9-forms-integrations",
    phaseNumber: 9,
    name: "Forms & Integrations",
    status: "future",
    goal:
      "Connect the builder and review forms to real submission, notification, payment, and agreement workflows.",
    reason:
      "The frontend should eventually support real business intake, not just a visual demo.",
    deliverables: [
      "Website review form submission",
      "Builder submission flow",
      "Client confirmation email",
      "Internal project notification",
      "Payment processor connection",
      "Agreement or e-signature flow",
      "Submission storage plan",
    ],
    possibleTools: [
      "Netlify Forms",
      "Formspree",
      "Zapier",
      "Make",
      "Airtable",
      "Google Sheets",
      "Stripe",
      "Square",
      "DocuSign",
      "Dropbox Sign",
    ],
    completionCriteria: [
      "A test builder submission can be received",
      "Client receives confirmation",
      "Hullinger Digital receives project details",
      "Payment path is defined",
      "Agreement path is defined",
      "No sensitive data is handled carelessly",
    ],
  },

  {
    id: "phase-10-seo-launch",
    phaseNumber: 10,
    name: "SEO, Testing & Launch",
    status: "future",
    goal:
      "Prepare the site for launch with SEO metadata, performance checks, responsive testing, accessibility checks, analytics, and deployment.",
    reason:
      "The site itself should demonstrate the quality Hullinger Digital sells.",
    deliverables: [
      "Page metadata",
      "Open Graph image",
      "Sitemap planning",
      "Robots.txt",
      "Analytics setup",
      "Search Console setup",
      "Performance review",
      "Mobile testing",
      "Form testing",
      "Deployment",
      "Domain connection",
    ],
    completionCriteria: [
      "Every page has title and meta description",
      "Navigation works",
      "Builder calculations work",
      "Forms are tested",
      "Mobile layout is checked",
      "Page speed is acceptable",
      "No obvious broken links",
      "Live domain points to the new site",
    ],
  },
];

export const immediateNextSteps = [
  {
    id: "finish-foundation-files",
    label: "Finish React-ready foundation files",
    status: "current",
    notes:
      "Continue creating lightweight src-data files before installing React/Vite.",
  },
  {
    id: "create-component-map",
    label: "Create the future React component map",
    status: "next",
    notes:
      "Define exactly which React components will be needed before writing the app.",
  },
  {
    id: "create-copy-files",
    label: "Create page copy files",
    status: "next",
    notes:
      "Write polished homepage, service page, pricing, about, and terms copy before building components.",
  },
  {
    id: "wait-for-dev-computer",
    label: "Wait for better development computer before installing React/Vite",
    status: "recommended",
    notes:
      "Current computer has limited storage. Avoid installing node_modules and extra dependencies until the new machine is ready.",
  },
];

export const buildPrinciples = [
  {
    id: "data-first",
    title: "Data-first structure",
    rule:
      "Packages, add-ons, care plans, payment options, builder steps, and intake questions should live in data files instead of being hardcoded into components.",
  },
  {
    id: "minimal-repetition",
    title: "Minimal repetition",
    rule:
      "Reusable content blocks should be imported or referenced instead of rewriting the same explanation across multiple pages.",
  },
  {
    id: "visual-ready",
    title: "Visual-ready layouts",
    rule:
      "Every major concept should have a planned visual area from the beginning, even if the first version uses styled mockups or placeholders.",
  },
  {
    id: "builder-as-scope",
    title: "Builder defines scope",
    rule:
      "The builder should make clear that selected packages, add-ons, quantities, and notes define the project scope before review.",
  },
  {
    id: "review-before-production",
    title: "Review before production",
    rule:
      "The website should consistently explain that all orders are reviewed before work begins.",
  },
  {
    id: "premium-not-cheap",
    title: "Premium, not cheap",
    rule:
      "Entry-level packages should feel professional and focused, not bargain-bin or throwaway.",
  },
  {
    id: "national-ready",
    title: "National-ready positioning",
    rule:
      "The site can mention Missouri, but should not position Hullinger Digital as only a local website provider.",
  },
  {
    id: "honest-scope",
    title: "Honest scope boundaries",
    rule:
      "The site should clearly explain what is included, what is not included, and when a project needs a higher package or custom review.",
  },
];

export const fileMovePlanForReact = [
  {
    currentPath: "src-data/packages.js",
    futurePath: "src/data/packages.js",
  },
  {
    currentPath: "src-data/addons.js",
    futurePath: "src/data/addons.js",
  },
  {
    currentPath: "src-data/carePlans.js",
    futurePath: "src/data/carePlans.js",
  },
  {
    currentPath: "src-data/paymentPlans.js",
    futurePath: "src/data/paymentPlans.js",
  },
  {
    currentPath: "src-data/builderSteps.js",
    futurePath: "src/data/builderSteps.js",
  },
  {
    currentPath: "src-data/intakeQuestions.js",
    futurePath: "src/data/intakeQuestions.js",
  },
  {
    currentPath: "src-data/sitePages.js",
    futurePath: "src/data/sitePages.js",
  },
  {
    currentPath: "src-data/brandSystem.js",
    futurePath: "src/data/brandSystem.js",
  },
  {
    currentPath: "src-data/contentBlocks.js",
    futurePath: "src/data/contentBlocks.js",
  },
  {
    currentPath: "src-data/visualSections.js",
    futurePath: "src/data/visualSections.js",
  },
  {
    currentPath: "src-data/projectRoadmap.js",
    futurePath: "src/data/projectRoadmap.js",
  },
];