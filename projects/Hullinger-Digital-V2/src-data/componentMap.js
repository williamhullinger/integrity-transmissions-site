export const componentGroups = [
  {
    id: "layout",
    name: "Layout Components",
    purpose:
      "Reusable structure used across the entire site, including header, footer, navigation, and page wrappers.",
  },
  {
    id: "ui",
    name: "UI Components",
    purpose:
      "Small reusable interface pieces such as buttons, cards, badges, sections, callouts, and form elements.",
  },
  {
    id: "sections",
    name: "Page Section Components",
    purpose:
      "Reusable page sections used on the homepage, service pages, pricing page, about page, and terms page.",
  },
  {
    id: "packages",
    name: "Package Components",
    purpose:
      "Components used to display website packages, included features, exclusions, pricing, best-fit guidance, and upgrade paths.",
  },
  {
    id: "builder",
    name: "Website Builder Components",
    purpose:
      "Interactive components used in the website builder/configurator.",
  },
  {
    id: "forms",
    name: "Form Components",
    purpose:
      "Reusable input, textarea, select, checkbox, upload, and validation components.",
  },
  {
    id: "visuals",
    name: "Visual / Mockup Components",
    purpose:
      "Styled mockups, diagrams, dashboard previews, process graphics, and future animation placeholders.",
  },
  {
    id: "pages",
    name: "Page Components",
    purpose:
      "Top-level page files that assemble sections, data, layout, and CTAs.",
  },
  {
    id: "utils",
    name: "Utility Functions",
    purpose:
      "Reusable JavaScript logic for calculations, filtering, validation, formatting, and builder state.",
  },
];

export const componentMap = [
  {
    id: "main-layout",
    groupId: "layout",
    filePath: "src/components/layout/MainLayout.jsx",
    componentName: "MainLayout",
    purpose:
      "Wraps all public pages with the shared header, footer, and main content area.",
    usesDataFrom: ["sitePages.js", "brandSystem.js"],
    receivesProps: ["children"],
    notes:
      "This should stay simple. Do not put page-specific content in the main layout.",
    buildPhase: 3,
  },
  {
    id: "header",
    groupId: "layout",
    filePath: "src/components/layout/Header.jsx",
    componentName: "Header",
    purpose:
      "Displays the top navigation, logo/brand mark, desktop menu, mobile menu trigger, and primary builder CTA.",
    usesDataFrom: ["sitePages.js", "brandSystem.js"],
    receivesProps: [],
    notes:
      "Navigation items should come from navigationItems in sitePages.js so links are not hardcoded twice.",
    buildPhase: 3,
  },
  {
    id: "footer",
    groupId: "layout",
    filePath: "src/components/layout/Footer.jsx",
    componentName: "Footer",
    purpose:
      "Displays footer navigation, brand positioning, service links, support links, and legal/terms links.",
    usesDataFrom: ["sitePages.js", "brandSystem.js"],
    receivesProps: [],
    notes:
      "Footer should reinforce premium positioning and include national-ready language.",
    buildPhase: 3,
  },
  {
    id: "nav-menu",
    groupId: "layout",
    filePath: "src/components/navigation/NavMenu.jsx",
    componentName: "NavMenu",
    purpose:
      "Renders desktop and mobile navigation items from the site navigation data.",
    usesDataFrom: ["sitePages.js"],
    receivesProps: ["items", "variant", "onNavigate"],
    notes:
      "Should support nested service links under Services.",
    buildPhase: 3,
  },

  {
    id: "button",
    groupId: "ui",
    filePath: "src/components/ui/Button.jsx",
    componentName: "Button",
    purpose:
      "Reusable button/link component for primary, secondary, ghost, and small CTA styles.",
    usesDataFrom: ["brandSystem.js"],
    receivesProps: ["children", "to", "href", "variant", "size", "type", "onClick"],
    notes:
      "Should support internal navigation links and normal buttons.",
    buildPhase: 3,
  },
  {
    id: "section",
    groupId: "ui",
    filePath: "src/components/ui/Section.jsx",
    componentName: "Section",
    purpose:
      "Reusable section wrapper for spacing, background style, max width, and layout consistency.",
    usesDataFrom: ["brandSystem.js"],
    receivesProps: ["children", "eyebrow", "headline", "intro", "theme", "layout"],
    notes:
      "Keeps page spacing consistent and prevents each page from reinventing layout.",
    buildPhase: 3,
  },
  {
    id: "card",
    groupId: "ui",
    filePath: "src/components/ui/Card.jsx",
    componentName: "Card",
    purpose:
      "Reusable card component for feature cards, package cards, pricing cards, callouts, and builder cards.",
    usesDataFrom: ["brandSystem.js"],
    receivesProps: ["children", "variant", "selected", "interactive", "className"],
    notes:
      "Should support selected state for builder cards.",
    buildPhase: 3,
  },
  {
    id: "badge",
    groupId: "ui",
    filePath: "src/components/ui/Badge.jsx",
    componentName: "Badge",
    purpose:
      "Small label component for recommended, review required, package category, price type, and status labels.",
    usesDataFrom: ["brandSystem.js"],
    receivesProps: ["children", "variant"],
    notes:
      "Badges should be subtle and premium, not loud.",
    buildPhase: 3,
  },
  {
    id: "callout",
    groupId: "ui",
    filePath: "src/components/ui/Callout.jsx",
    componentName: "Callout",
    purpose:
      "Reusable callout block for SEO quote, review notices, payment notices, warnings, and educational content.",
    usesDataFrom: ["contentBlocks.js", "brandSystem.js"],
    receivesProps: ["title", "body", "variant", "children"],
    notes:
      "Should visually support important explanations without feeling alarmist.",
    buildPhase: 3,
  },

  {
    id: "hero-section",
    groupId: "sections",
    filePath: "src/components/sections/HeroSection.jsx",
    componentName: "HeroSection",
    purpose:
      "Reusable hero section for the homepage and major pages.",
    usesDataFrom: ["sitePages.js", "visualSections.js"],
    receivesProps: ["eyebrow", "headline", "subheadline", "primaryCta", "secondaryCta", "visualId"],
    notes:
      "Should support a visual/mockup area from the beginning.",
    buildPhase: 4,
  },
  {
    id: "custom-vs-template-section",
    groupId: "sections",
    filePath: "src/components/sections/CustomVsTemplateSection.jsx",
    componentName: "CustomVsTemplateSection",
    purpose:
      "Explains template versus custom using the foundation analogy.",
    usesDataFrom: ["contentBlocks.js", "visualSections.js"],
    receivesProps: [],
    notes:
      "Should use reusable copy from contentBlocks.customVsTemplate.",
    buildPhase: 4,
  },
  {
    id: "seo-foundation-section",
    groupId: "sections",
    filePath: "src/components/sections/SeoFoundationSection.jsx",
    componentName: "SeoFoundationSection",
    purpose:
      "Explains why SEO structure matters before launch.",
    usesDataFrom: ["contentBlocks.js", "visualSections.js"],
    receivesProps: [],
    notes:
      "Must include the saved SEO quote exactly.",
    buildPhase: 4,
  },
  {
    id: "service-selector-section",
    groupId: "sections",
    filePath: "src/components/sections/ServiceSelectorSection.jsx",
    componentName: "ServiceSelectorSection",
    purpose:
      "Displays the four service/package levels and routes users to service pages or builder.",
    usesDataFrom: ["packages.js", "sitePages.js"],
    receivesProps: ["showPricing", "variant"],
    notes:
      "Package cards should pull from packages.js instead of duplicate copy.",
    buildPhase: 4,
  },
  {
    id: "process-section",
    groupId: "sections",
    filePath: "src/components/sections/ProcessSection.jsx",
    componentName: "ProcessSection",
    purpose:
      "Shows the guided builder and hands-on design process.",
    usesDataFrom: ["contentBlocks.js", "visualSections.js"],
    receivesProps: ["variant"],
    notes:
      "Use handsOnBuilderNotice process steps.",
    buildPhase: 4,
  },
  {
    id: "advanced-tools-preview",
    groupId: "sections",
    filePath: "src/components/sections/AdvancedToolsPreview.jsx",
    componentName: "AdvancedToolsPreview",
    purpose:
      "Previews advanced website possibilities such as portals, dashboards, payments, automations, and AI.",
    usesDataFrom: ["contentBlocks.js", "visualSections.js"],
    receivesProps: ["limit", "variant"],
    notes:
      "Should make Advanced feel useful for serious businesses, not only big companies.",
    buildPhase: 4,
  },
  {
    id: "pricing-preview",
    groupId: "sections",
    filePath: "src/components/sections/PricingPreview.jsx",
    componentName: "PricingPreview",
    purpose:
      "Shows homepage pricing preview cards without replacing the full pricing page.",
    usesDataFrom: ["packages.js", "paymentPlans.js"],
    receivesProps: [],
    notes:
      "Starting prices should always come from packages.js.",
    buildPhase: 4,
  },
  {
    id: "review-process-section",
    groupId: "sections",
    filePath: "src/components/sections/ReviewProcessSection.jsx",
    componentName: "ReviewProcessSection",
    purpose:
      "Explains structured review and revision process with scope guardrails.",
    usesDataFrom: ["contentBlocks.js"],
    receivesProps: [],
    notes:
      "Should not imply unlimited revisions.",
    buildPhase: 4,
  },
  {
    id: "final-cta-section",
    groupId: "sections",
    filePath: "src/components/sections/FinalCtaSection.jsx",
    componentName: "FinalCtaSection",
    purpose:
      "Reusable closing CTA section for major pages.",
    usesDataFrom: ["contentBlocks.js"],
    receivesProps: ["variant"],
    notes:
      "Variants should include buildWebsitePlan, requestReview, and advancedReview.",
    buildPhase: 4,
  },

  {
    id: "package-hero",
    groupId: "packages",
    filePath: "src/components/packages/PackageHero.jsx",
    componentName: "PackageHero",
    purpose:
      "Reusable hero for Starter, Launch, Lead-Generating, and Advanced package pages.",
    usesDataFrom: ["packages.js", "visualSections.js"],
    receivesProps: ["packageId"],
    notes:
      "Should pull package hero headline, description, price, CTA, and visual direction from data.",
    buildPhase: 5,
  },
  {
    id: "included-features",
    groupId: "packages",
    filePath: "src/components/packages/IncludedFeatures.jsx",
    componentName: "IncludedFeatures",
    purpose:
      "Displays included pages and included features for a package.",
    usesDataFrom: ["packages.js"],
    receivesProps: ["packageId"],
    notes:
      "Use package includedPages and includedFeatures arrays.",
    buildPhase: 5,
  },
  {
    id: "not-included",
    groupId: "packages",
    filePath: "src/components/packages/NotIncluded.jsx",
    componentName: "NotIncluded",
    purpose:
      "Shows what is not included in a package to protect scope and clarify fit.",
    usesDataFrom: ["packages.js"],
    receivesProps: ["packageId"],
    notes:
      "Important for reducing scope confusion.",
    buildPhase: 5,
  },
  {
    id: "best-for-list",
    groupId: "packages",
    filePath: "src/components/packages/BestForList.jsx",
    componentName: "BestForList",
    purpose:
      "Shows who the package is best for and example fit situations.",
    usesDataFrom: ["packages.js"],
    receivesProps: ["packageId"],
    notes:
      "Use goodFitExamples and bestForLabel.",
    buildPhase: 5,
  },
  {
    id: "upgrade-path",
    groupId: "packages",
    filePath: "src/components/packages/UpgradePath.jsx",
    componentName: "UpgradePath",
    purpose:
      "Explains when a visitor should move up to the next package.",
    usesDataFrom: ["packages.js", "contentBlocks.js"],
    receivesProps: ["packageId"],
    notes:
      "Should keep upgrade logic consistent across pages.",
    buildPhase: 5,
  },

  {
    id: "builder-layout",
    groupId: "builder",
    filePath: "src/components/builder/BuilderLayout.jsx",
    componentName: "BuilderLayout",
    purpose:
      "Main layout wrapper for the website builder with progress navigation, step content, and price summary.",
    usesDataFrom: ["builderSteps.js"],
    receivesProps: ["currentStepId", "children", "builderState"],
    notes:
      "Desktop should show sticky right summary. Mobile should show sticky bottom total bar.",
    buildPhase: 7,
  },
  {
    id: "builder-progress",
    groupId: "builder",
    filePath: "src/components/builder/BuilderProgress.jsx",
    componentName: "BuilderProgress",
    purpose:
      "Displays the builder steps and completion status.",
    usesDataFrom: ["builderSteps.js"],
    receivesProps: ["steps", "currentStepId", "completedStepIds", "stepsWithErrors"],
    notes:
      "Should support optional and required steps.",
    buildPhase: 7,
  },
  {
    id: "package-selector",
    groupId: "builder",
    filePath: "src/components/builder/PackageSelector.jsx",
    componentName: "PackageSelector",
    purpose:
      "Allows the client to select Starter, Launch, Lead-Generating, or Advanced.",
    usesDataFrom: ["packages.js"],
    receivesProps: ["selectedPackageId", "onSelectPackage"],
    notes:
      "Selecting a package should update payment options, add-on recommendations, and price summary.",
    buildPhase: 7,
  },
  {
    id: "addon-selector",
    groupId: "builder",
    filePath: "src/components/builder/AddOnSelector.jsx",
    componentName: "AddOnSelector",
    purpose:
      "Displays selectable add-ons by category and handles selected state.",
    usesDataFrom: ["addons.js"],
    receivesProps: ["categoryIds", "selectedAddons", "selectedPackageId", "onToggleAddon", "onUpdateAddon"],
    notes:
      "Must support fixed, quantity, monthly, package-restricted, dependent, and review-required add-ons.",
    buildPhase: 7,
  },
  {
    id: "quantity-selector",
    groupId: "builder",
    filePath: "src/components/builder/QuantitySelector.jsx",
    componentName: "QuantitySelector",
    purpose:
      "Allows quantity selection for per-page, per-product, per-user, and similar add-ons.",
    usesDataFrom: ["addons.js"],
    receivesProps: ["value", "min", "max", "onChange"],
    notes:
      "Should prevent values below min or above max.",
    buildPhase: 7,
  },
  {
    id: "notes-field",
    groupId: "builder",
    filePath: "src/components/builder/NotesField.jsx",
    componentName: "NotesField",
    purpose:
      "Collects required notes for selected add-ons, other selections, or scope details.",
    usesDataFrom: ["addons.js", "intakeQuestions.js"],
    receivesProps: ["label", "value", "required", "placeholder", "helperText", "onChange"],
    notes:
      "Required notes must be validated before review.",
    buildPhase: 7,
  },
  {
    id: "care-plan-selector",
    groupId: "builder",
    filePath: "src/components/builder/CarePlanSelector.jsx",
    componentName: "CarePlanSelector",
    purpose:
      "Allows client to choose an optional monthly care plan.",
    usesDataFrom: ["carePlans.js"],
    receivesProps: ["selectedPackageId", "selectedCarePlanId", "onSelectCarePlan"],
    notes:
      "Should show recommended care plan based on package.",
    buildPhase: 7,
  },
  {
    id: "payment-plan-selector",
    groupId: "builder",
    filePath: "src/components/builder/PaymentPlanSelector.jsx",
    componentName: "PaymentPlanSelector",
    purpose:
      "Allows client to choose the package payment option.",
    usesDataFrom: ["paymentPlans.js"],
    receivesProps: ["selectedPackageId", "selectedPaymentPlanId", "onSelectPaymentPlan"],
    notes:
      "Should show due today, total, monthly term, and payment notices.",
    buildPhase: 7,
  },
  {
    id: "intake-question-renderer",
    groupId: "builder",
    filePath: "src/components/builder/IntakeQuestionRenderer.jsx",
    componentName: "IntakeQuestionRenderer",
    purpose:
      "Renders intake questions based on question type, group, step, and conditional display rules.",
    usesDataFrom: ["intakeQuestions.js"],
    receivesProps: ["question", "value", "builderState", "onChange"],
    notes:
      "Should support text, email, tel, url, textarea, single-select, multi-select, and file-upload-notes.",
    buildPhase: 7,
  },
  {
    id: "price-summary",
    groupId: "builder",
    filePath: "src/components/builder/PriceSummary.jsx",
    componentName: "PriceSummary",
    purpose:
      "Displays selected package, add-ons, one-time total, monthly services, payment option, due today, and review notice.",
    usesDataFrom: ["packages.js", "addons.js", "carePlans.js", "paymentPlans.js", "builderSteps.js"],
    receivesProps: ["builderState", "totals"],
    notes:
      "This is central to the builder experience. It should stay visible on desktop and accessible on mobile.",
    buildPhase: 7,
  },
  {
    id: "review-summary",
    groupId: "builder",
    filePath: "src/components/builder/ReviewSummary.jsx",
    componentName: "ReviewSummary",
    purpose:
      "Shows final selected website plan before agreement and payment.",
    usesDataFrom: ["packages.js", "addons.js", "carePlans.js", "paymentPlans.js", "builderSteps.js", "contentBlocks.js"],
    receivesProps: ["builderState", "totals"],
    notes:
      "Should include review notice and required acknowledgements.",
    buildPhase: 7,
  },
  {
    id: "acknowledgement-list",
    groupId: "builder",
    filePath: "src/components/builder/AcknowledgementList.jsx",
    componentName: "AcknowledgementList",
    purpose:
      "Displays required scope, payment, ownership, monthly plan, advanced review, and client responsibility acknowledgements.",
    usesDataFrom: ["builderSteps.js"],
    receivesProps: ["acknowledgements", "checkedIds", "builderState", "onToggle"],
    notes:
      "Some acknowledgements are conditional based on package or payment type.",
    buildPhase: 7,
  },

  {
    id: "form-field",
    groupId: "forms",
    filePath: "src/components/forms/FormField.jsx",
    componentName: "FormField",
    purpose:
      "Reusable wrapper for labels, helper text, required labels, validation messages, and form controls.",
    usesDataFrom: ["brandSystem.js"],
    receivesProps: ["label", "helperText", "required", "error", "children"],
    notes:
      "All form controls should use this for consistent accessibility and spacing.",
    buildPhase: 7,
  },
  {
    id: "text-input",
    groupId: "forms",
    filePath: "src/components/forms/TextInput.jsx",
    componentName: "TextInput",
    purpose:
      "Reusable text, email, tel, and URL input component.",
    usesDataFrom: ["brandSystem.js"],
    receivesProps: ["type", "value", "placeholder", "onChange", "required"],
    notes:
      "Should support basic HTML input types.",
    buildPhase: 7,
  },
  {
    id: "textarea-input",
    groupId: "forms",
    filePath: "src/components/forms/TextareaInput.jsx",
    componentName: "TextareaInput",
    purpose:
      "Reusable textarea component for notes, project details, and long-form answers.",
    usesDataFrom: ["brandSystem.js"],
    receivesProps: ["value", "placeholder", "onChange", "required", "rows"],
    notes:
      "Should be comfortable to type in on mobile.",
    buildPhase: 7,
  },
  {
    id: "single-select",
    groupId: "forms",
    filePath: "src/components/forms/SingleSelect.jsx",
    componentName: "SingleSelect",
    purpose:
      "Reusable radio/card/select component for choosing one option.",
    usesDataFrom: ["brandSystem.js"],
    receivesProps: ["options", "value", "onChange", "variant"],
    notes:
      "Card style may be better than native select for important builder choices.",
    buildPhase: 7,
  },
  {
    id: "multi-select",
    groupId: "forms",
    filePath: "src/components/forms/MultiSelect.jsx",
    componentName: "MultiSelect",
    purpose:
      "Reusable checkbox/card component for choosing multiple options.",
    usesDataFrom: ["brandSystem.js"],
    receivesProps: ["options", "values", "onChange", "variant"],
    notes:
      "Must support notes when Other is selected.",
    buildPhase: 7,
  },

  {
    id: "device-mockup",
    groupId: "visuals",
    filePath: "src/components/visuals/DeviceMockup.jsx",
    componentName: "DeviceMockup",
    purpose:
      "Creates reusable desktop, laptop, tablet, or mobile website mockups.",
    usesDataFrom: ["visualSections.js", "brandSystem.js"],
    receivesProps: ["variant", "title", "children"],
    notes:
      "Use as a styled placeholder before final visuals are created.",
    buildPhase: 4,
  },
  {
    id: "floating-ui-cards",
    groupId: "visuals",
    filePath: "src/components/visuals/FloatingUICards.jsx",
    componentName: "FloatingUICards",
    purpose:
      "Displays floating feature cards around mockups.",
    usesDataFrom: ["visualSections.js", "brandSystem.js"],
    receivesProps: ["labels", "variant"],
    notes:
      "Useful in hero, advanced tools, and builder preview sections.",
    buildPhase: 4,
  },
  {
    id: "process-diagram",
    groupId: "visuals",
    filePath: "src/components/visuals/ProcessDiagram.jsx",
    componentName: "ProcessDiagram",
    purpose:
      "Displays process steps, SEO paths, review loops, and builder timelines.",
    usesDataFrom: ["contentBlocks.js", "visualSections.js"],
    receivesProps: ["steps", "variant"],
    notes:
      "Should support horizontal desktop and vertical mobile layout.",
    buildPhase: 4,
  },
  {
    id: "dashboard-mockup",
    groupId: "visuals",
    filePath: "src/components/visuals/DashboardMockup.jsx",
    componentName: "DashboardMockup",
    purpose:
      "Displays advanced website tool concepts like portals, staff dashboards, quote flows, automations, and AI cards.",
    usesDataFrom: ["visualSections.js"],
    receivesProps: ["variant", "cards"],
    notes:
      "Important for making Advanced Website feel real.",
    buildPhase: 5,
  },

  {
    id: "home-page",
    groupId: "pages",
    filePath: "src/pages/Home.jsx",
    componentName: "Home",
    purpose:
      "Top-level homepage assembled from site page data, content blocks, service selectors, and visual sections.",
    usesDataFrom: ["sitePages.js", "packages.js", "contentBlocks.js", "visualSections.js"],
    receivesProps: [],
    notes:
      "Homepage introduces, educates, routes, and sells the strategic value of Hullinger Digital.",
    buildPhase: 4,
  },
  {
    id: "starter-page",
    groupId: "pages",
    filePath: "src/pages/StarterWebPage.jsx",
    componentName: "StarterWebPage",
    purpose:
      "Top-level Starter Web Page service page.",
    usesDataFrom: ["packages.js", "sitePages.js", "visualSections.js"],
    receivesProps: [],
    notes:
      "Must make Starter feel polished, not cheap.",
    buildPhase: 5,
  },
  {
    id: "launch-page",
    groupId: "pages",
    filePath: "src/pages/LaunchWebsite.jsx",
    componentName: "LaunchWebsite",
    purpose:
      "Top-level Launch Website service page.",
    usesDataFrom: ["packages.js", "sitePages.js", "visualSections.js"],
    receivesProps: [],
    notes:
      "Should explain custom informational website clearly.",
    buildPhase: 5,
  },
  {
    id: "lead-page",
    groupId: "pages",
    filePath: "src/pages/LeadGeneratingWebsite.jsx",
    componentName: "LeadGeneratingWebsite",
    purpose:
      "Top-level Lead-Generating Website service page.",
    usesDataFrom: ["packages.js", "sitePages.js", "contentBlocks.js", "visualSections.js"],
    receivesProps: [],
    notes:
      "Should focus on SEO, service pages, trust, and inquiry flow.",
    buildPhase: 5,
  },
  {
    id: "advanced-page",
    groupId: "pages",
    filePath: "src/pages/AdvancedWebsite.jsx",
    componentName: "AdvancedWebsite",
    purpose:
      "Top-level Advanced Website service page.",
    usesDataFrom: ["packages.js", "sitePages.js", "contentBlocks.js", "visualSections.js"],
    receivesProps: [],
    notes:
      "Should show customer tools, internal tools, e-commerce, automations, and AI examples.",
    buildPhase: 5,
  },
  {
    id: "pricing-page",
    groupId: "pages",
    filePath: "src/pages/Pricing.jsx",
    componentName: "Pricing",
    purpose:
      "Top-level pricing and plans page.",
    usesDataFrom: ["packages.js", "addons.js", "carePlans.js", "paymentPlans.js", "contentBlocks.js"],
    receivesProps: [],
    notes:
      "Should be transparent without cheapening the brand.",
    buildPhase: 6,
  },
  {
    id: "about-page",
    groupId: "pages",
    filePath: "src/pages/About.jsx",
    componentName: "About",
    purpose:
      "Top-level about page.",
    usesDataFrom: ["sitePages.js", "brandSystem.js"],
    receivesProps: [],
    notes:
      "Should feel like a serious digital studio, not a personal employment portfolio.",
    buildPhase: 6,
  },
  {
    id: "website-review-page",
    groupId: "pages",
    filePath: "src/pages/WebsiteReview.jsx",
    componentName: "WebsiteReview",
    purpose:
      "Top-level review request page.",
    usesDataFrom: ["sitePages.js", "intakeQuestions.js"],
    receivesProps: [],
    notes:
      "Alternate path for users who need guidance before using the builder.",
    buildPhase: 6,
  },
  {
    id: "terms-page",
    groupId: "pages",
    filePath: "src/pages/TermsPreview.jsx",
    componentName: "TermsPreview",
    purpose:
      "Top-level terms and agreement preview page.",
    usesDataFrom: ["contentBlocks.js", "paymentPlans.js", "sitePages.js"],
    receivesProps: [],
    notes:
      "Should clarify expectations without replacing attorney-reviewed agreement.",
    buildPhase: 6,
  },
  {
    id: "builder-page",
    groupId: "pages",
    filePath: "src/pages/WebsiteBuilder.jsx",
    componentName: "WebsiteBuilder",
    purpose:
      "Top-level website builder/configurator page.",
    usesDataFrom: [
      "packages.js",
      "addons.js",
      "carePlans.js",
      "paymentPlans.js",
      "builderSteps.js",
      "intakeQuestions.js",
    ],
    receivesProps: [],
    notes:
      "This will be the most complex page and should be built after the marketing pages and data are stable.",
    buildPhase: 7,
  },

  {
    id: "calculate-project-total",
    groupId: "utils",
    filePath: "src/utils/calculateProjectTotal.js",
    functionName: "calculateProjectTotal",
    purpose:
      "Calculates one-time project total, monthly services total, amount due today, payment plan totals, and selected add-on totals.",
    usesDataFrom: ["packages.js", "addons.js", "carePlans.js", "paymentPlans.js"],
    receivesArgs: ["builderState"],
    returns: ["oneTimeTotal", "monthlyTotal", "amountDueToday", "paymentPlanTotal", "addonTotal"],
    notes:
      "Keep this logic outside React components so it can be tested and reused.",
    buildPhase: 7,
  },
  {
    id: "filter-addons-by-package",
    groupId: "utils",
    filePath: "src/utils/filterAddonsByPackage.js",
    functionName: "filterAddonsByPackage",
    purpose:
      "Filters or labels add-ons based on selected package restrictions and recommendations.",
    usesDataFrom: ["addons.js"],
    receivesArgs: ["addons", "selectedPackageId"],
    returns: ["availableAddons", "restrictedAddons", "recommendedAddons"],
    notes:
      "Advanced-only add-ons should not be silently hidden; they can be shown with an Advanced review warning.",
    buildPhase: 7,
  },
  {
    id: "validate-builder-step",
    groupId: "utils",
    filePath: "src/utils/validateBuilderStep.js",
    functionName: "validateBuilderStep",
    purpose:
      "Checks whether the current builder step is complete and returns errors if required information is missing.",
    usesDataFrom: ["builderSteps.js", "intakeQuestions.js", "addons.js"],
    receivesArgs: ["stepId", "builderState"],
    returns: ["isValid", "errors"],
    notes:
      "Validation should be clear and helpful, not vague.",
    buildPhase: 7,
  },
];

export const componentBuildOrder = [
  "main-layout",
  "header",
  "footer",
  "nav-menu",
  "button",
  "section",
  "card",
  "badge",
  "callout",
  "device-mockup",
  "floating-ui-cards",
  "process-diagram",
  "hero-section",
  "custom-vs-template-section",
  "seo-foundation-section",
  "service-selector-section",
  "process-section",
  "advanced-tools-preview",
  "pricing-preview",
  "review-process-section",
  "final-cta-section",
  "home-page",
  "package-hero",
  "included-features",
  "not-included",
  "best-for-list",
  "upgrade-path",
  "starter-page",
  "launch-page",
  "lead-page",
  "advanced-page",
  "pricing-page",
  "about-page",
  "website-review-page",
  "terms-page",
  "builder-layout",
  "builder-progress",
  "package-selector",
  "addon-selector",
  "quantity-selector",
  "notes-field",
  "care-plan-selector",
  "payment-plan-selector",
  "intake-question-renderer",
  "price-summary",
  "review-summary",
  "acknowledgement-list",
  "builder-page",
];

export const componentArchitectureRules = {
  dataFirst:
    "Components should pull from data files when possible instead of hardcoding package names, prices, add-ons, care plans, page titles, or navigation items.",
  reusableSections:
    "Reusable sections should accept props or data IDs so they can be used across multiple pages without duplicating code.",
  builderLogic:
    "Builder calculation and validation logic should live in utility files, not directly inside JSX components.",
  visualPlaceholders:
    "Early visual components should use real labels and styled mockups instead of blank placeholders.",
  minimalProps:
    "Pass only what the component needs. Avoid large prop chains when the component can look up data by ID from a clear source.",
  scopeProtection:
    "Components that display pricing, add-ons, or payment terms should also support review notices and scope warnings where appropriate.",
};