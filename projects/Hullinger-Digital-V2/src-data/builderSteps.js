export const builderSteps = [
  {
    id: "choose-package",
    stepNumber: 1,
    title: "Choose Your Website Level",
    shortTitle: "Website Level",
    routeSegment: "website-level",
    purpose:
      "Help the client choose the right starting point before add-ons or custom features are selected.",
    customerIntro:
      "Start by choosing the website level that best matches what your website needs to do.",
    helperText:
      "You do not need to know every detail yet. Choose the closest fit. Hullinger Digital reviews every order before production begins.",
    required: true,
    dataSource: "websitePackages",
    displayType: "package-cards",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      requiresPackageSelection: true,
      errorMessage: "Please choose a website level before continuing.",
    },
    reviewNotes:
      "Package selection controls available add-ons, recommended care plans, payment options, and scope warnings.",
  },

  {
    id: "pages-content",
    stepNumber: 2,
    title: "Pages & Content",
    shortTitle: "Pages",
    routeSegment: "pages-content",
    purpose:
      "Collect page, copywriting, content migration, service-page, and case-study selections.",
    customerIntro:
      "Choose any additional pages, SEO service pages, content help, or content migration support your website may need.",
    helperText:
      "The selected website level includes a defined page scope. Add pages here if your project needs more than the included amount.",
    required: false,
    addonCategoryIds: ["pages-content"],
    displayType: "addon-category",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      allowSkip: true,
    },
    scopeReminder:
      "Extra pages are reviewed before production begins. More pages do not always mean a package upgrade, but deeper SEO strategy or advanced functionality may.",
  },

  {
    id: "design-media",
    stepNumber: 3,
    title: "Design & Media",
    shortTitle: "Design",
    routeSegment: "design-media",
    purpose:
      "Collect design polish, graphics, gallery, logo, branding, animation, and visual-section selections.",
    customerIntro:
      "Choose any design, media, logo, gallery, or visual polish options that should be included in the project.",
    helperText:
      "This helps define the visual depth of the project before design begins.",
    required: false,
    addonCategoryIds: ["design-media"],
    displayType: "addon-category",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      allowSkip: true,
    },
    scopeReminder:
      "Advanced animation, custom graphics, and brand work may affect project timeline depending on scope.",
  },

  {
    id: "seo-visibility",
    stepNumber: 4,
    title: "SEO & Local Visibility",
    shortTitle: "SEO",
    routeSegment: "seo-visibility",
    purpose:
      "Collect enhanced SEO, local SEO, Google Business Profile, schema, keyword research, and monthly SEO selections.",
    customerIntro:
      "Choose any search visibility, local SEO, or ongoing SEO support your website should include.",
    helperText:
      "SEO should be planned into the structure of the website instead of treated as an afterthought.",
    required: false,
    addonCategoryIds: ["seo-local-visibility"],
    displayType: "addon-category",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      allowSkip: true,
    },
    educationalCallout: {
      title: "A beautiful site still needs a way to be found.",
      body:
        "A beautiful site without SEO structure is like a beautiful shop with no road signs, no address, and no front entrance.",
    },
    scopeReminder:
      "SEO selections are reviewed before production begins. Larger keyword, service, or location strategies may require added planning or a Lead-Generating Website package.",
  },

  {
    id: "forms-leads",
    stepNumber: 5,
    title: "Forms & Lead Capture",
    shortTitle: "Forms",
    routeSegment: "forms-leads",
    purpose:
      "Collect form, quote request, file upload, multi-step intake, lead routing, CRM, and spam protection selections.",
    customerIntro:
      "Choose any forms or lead capture tools customers should use to contact, request, upload, or submit information.",
    helperText:
      "Better forms can improve lead quality by collecting the right information before the first conversation.",
    required: false,
    addonCategoryIds: ["forms-lead-capture"],
    displayType: "addon-category",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      allowSkip: true,
    },
    scopeReminder:
      "Advanced forms, conditional questions, file uploads, and routing may require project review before final approval.",
  },

  {
    id: "payments-sales-booking",
    stepNumber: 6,
    title: "Sales, Payments & Booking",
    shortTitle: "Sales",
    routeSegment: "payments-sales-booking",
    purpose:
      "Collect online payments, checkout, e-commerce, products, shipping, pickup, booking, scheduling, and appointment workflow selections.",
    customerIntro:
      "Choose any online payment, checkout, product, order, booking, or scheduling tools your website should support.",
    helperText:
      "Simple payment links are different from full checkout or e-commerce systems. Choose the options closest to how your business needs to sell or schedule.",
    required: false,
    addonCategoryIds: ["online-sales-payments", "booking-scheduling"],
    displayType: "addon-category-group",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      allowSkip: true,
    },
    scopeReminder:
      "E-commerce, custom order forms, subscriptions, shipping, and booking payments may require technical review before production begins.",
  },

  {
    id: "automations",
    stepNumber: 7,
    title: "Automations",
    shortTitle: "Automations",
    routeSegment: "automations",
    purpose:
      "Collect auto-replies, customer email sequences, SMS, lead follow-up, review request, internal notification, spreadsheet/database, and multi-step workflow selections.",
    customerIntro:
      "Choose any automated follow-up, notification, review request, or workflow support your website should include.",
    helperText:
      "Automations help move information where it needs to go after a customer takes action on the website.",
    required: false,
    addonCategoryIds: ["automations"],
    displayType: "addon-category",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      allowSkip: true,
    },
    scopeReminder:
      "Automation scope depends on the tools being connected, the number of steps, and the rules behind each workflow.",
  },

  {
    id: "advanced-tools",
    stepNumber: 8,
    title: "Advanced Business Tools",
    shortTitle: "Advanced Tools",
    routeSegment: "advanced-tools",
    purpose:
      "Collect customer tools, employee tools, portals, dashboards, workflows, internal tools, admin panels, and AI tool selections.",
    customerIntro:
      "Choose any customer portals, employee tools, dashboards, workflows, admin areas, or AI-assisted features your website may need.",
    helperText:
      "These options are for websites that need to function more like business tools, not just public pages.",
    required: false,
    addonCategoryIds: ["customer-tools", "employee-internal-tools", "ai-tools"],
    displayType: "advanced-addon-category-group",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      allowSkip: true,
      advancedPackageRecommended: true,
    },
    packageGate: {
      recommendedPackageId: "advanced-website",
      message:
        "Customer tools, employee tools, dashboards, portals, workflow systems, and AI tools usually require the Advanced Website package.",
      allowReviewRequestInstead: true,
    },
    scopeReminder:
      "Advanced tools require review before production begins. Final pricing, timeline, and technical approach may be adjusted after scope review.",
  },

  {
    id: "design-direction",
    stepNumber: 9,
    title: "Design Direction",
    shortTitle: "Direction",
    routeSegment: "design-direction",
    purpose:
      "Collect the client’s visual preferences, reference websites, colors, design mood, and must-have or must-avoid details.",
    customerIntro:
      "Tell us what the website should look and feel like so the first design direction is closer to what you have in mind.",
    helperText:
      "Reference websites are helpful even if you only like one part of them. Tell us what you like or dislike about colors, layout, movement, images, navigation, wording, or overall feel.",
    required: true,
    displayType: "question-form",
    questionGroupIds: ["design-direction"],
    showInProgressNav: true,
    showInPriceSummary: false,
    validation: {
      requiresRequiredQuestions: true,
      errorMessage:
        "Please complete the required design direction questions before continuing.",
    },
  },

  {
    id: "business-project-intake",
    stepNumber: 10,
    title: "Business & Project Intake",
    shortTitle: "Intake",
    routeSegment: "business-project-intake",
    purpose:
      "Collect business details, contact information, goals, audience, services, service areas, current website, assets, deadlines, and project notes.",
    customerIntro:
      "Share the core business and project details needed to review your website order and prepare for the build.",
    helperText:
      "The more accurate this information is, the easier it is to confirm scope, prepare the project, and avoid delays.",
    required: true,
    displayType: "question-form",
    questionGroupIds: ["business-intake", "project-intake", "asset-intake"],
    showInProgressNav: true,
    showInPriceSummary: false,
    validation: {
      requiresRequiredQuestions: true,
      errorMessage:
        "Please complete the required business and project intake questions before continuing.",
    },
  },

  {
    id: "review-summary",
    stepNumber: 11,
    title: "Review Your Website Plan",
    shortTitle: "Review",
    routeSegment: "review-summary",
    purpose:
      "Show selected package, add-ons, quantities, notes, care plan, payment options, estimated total, and required acknowledgements.",
    customerIntro:
      "Review your selected website level, add-ons, estimated total, and important scope notes before continuing.",
    helperText:
      "This summary is reviewed by Hullinger Digital before production begins. If anything selected does not fit the package or needs adjustment, we will contact you before moving forward.",
    required: true,
    displayType: "order-summary",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      requiresPackageSelection: true,
      requiresScopeAcknowledgement: true,
      requiresPaymentAcknowledgement: true,
      errorMessage:
        "Please review and acknowledge the project scope and payment terms before continuing.",
    },
    requiredAcknowledgements: [
      "scope-review",
      "payment-terms",
      "client-responsibilities",
    ],
  },

  {
    id: "agreement-payment",
    stepNumber: 12,
    title: "Agreement & Payment",
    shortTitle: "Agreement",
    routeSegment: "agreement-payment",
    purpose:
      "Prepare the client for agreement signature and payment before production begins.",
    customerIntro:
      "Before production begins, your project must be reviewed, approved, signed, and paid according to the selected payment option.",
    helperText:
      "The builder helps define your website plan, but every order is reviewed before production begins.",
    required: true,
    displayType: "agreement-payment-instructions",
    showInProgressNav: true,
    showInPriceSummary: true,
    validation: {
      requiresFinalConfirmation: true,
      errorMessage:
        "Please confirm that you understand the agreement and payment process.",
    },
    futureIntegrations: [
      "DocuSign or e-signature flow",
      "Stripe, Square, or approved payment processor",
      "Confirmation email",
      "Internal project notification",
    ],
  },
];

export const builderGlobalMessages = {
  builderIntroHeadline: "Build Your Website Plan",
  builderIntroText:
    "Choose your website level, add features, share project details, and see your estimated total as you build your plan.",
  handsOnBuildNoticeTitle:
    "A clear online process, backed by real strategy and hands-on design.",
  handsOnBuildNoticeBody:
    "The website builder helps define your scope, pricing, goals, design preferences, and project details upfront. But your website is not automatically generated and forgotten. Every project is reviewed, planned, designed, and built with hands-on attention to your business, your customers, and what the website needs to accomplish.",
  livePricingNotice:
    "Your estimated total updates as you choose packages, add-ons, quantities, care plans, and payment options.",
  reviewRequiredNotice:
    "All website orders are reviewed by Hullinger Digital before production begins. If your selected scope includes unclear, incompatible, impossible, or out-of-package requirements, we will contact you to review available options.",
  noAutoGeneratedWebsiteNotice:
    "A streamlined online ordering process does not mean automated, cookie-cutter websites.",
};

export const builderProgressLabels = {
  notStarted: "Not started",
  inProgress: "In progress",
  complete: "Complete",
  needsAttention: "Needs attention",
  reviewRequired: "Review required",
};

export const builderAcknowledgements = [
  {
    id: "scope-review",
    label: "Scope review acknowledgement",
    required: true,
    text:
      "I understand that all website orders are reviewed by Hullinger Digital before production begins. If my selected package, add-ons, notes, or requested features do not fit the selected scope, Hullinger Digital may contact me to adjust scope, add approved services, upgrade the package, revise the timeline, or cancel/refund according to the agreement terms.",
  },
  {
    id: "payment-terms",
    label: "Payment terms acknowledgement",
    required: true,
    text:
      "I understand that a required setup payment, deposit, milestone payment, or pay-in-full payment must be received before work begins, and that remaining balances are due according to the selected payment option and agreement.",
  },
  {
    id: "ownership-transfer",
    label: "Ownership and transfer acknowledgement",
    required: true,
    text:
      "I understand that website ownership, transfer rights, and final project files are released only after the account is paid in full according to the agreement.",
  },
  {
    id: "monthly-plan",
    label: "Monthly plan acknowledgement",
    requiredWhen: {
      selectedPaymentType: "monthly",
    },
    text:
      "I understand that websites built under a monthly payment plan remain under Hullinger Digital management until the agreement is paid in full, and missed payments may result in paused work, delayed launch, temporary suspension, or restricted access according to the agreement.",
  },
  {
    id: "advanced-review",
    label: "Advanced project review acknowledgement",
    requiredWhen: {
      selectedPackageId: "advanced-website",
    },
    text:
      "I understand that Advanced Website projects require review before production begins, and final scope, timeline, technical approach, and payment structure may be adjusted before approval.",
  },
  {
    id: "client-responsibilities",
    label: "Client responsibilities acknowledgement",
    required: true,
    text:
      "I understand that delays in providing content, images, access, approvals, logins, business details, or feedback may delay the project timeline.",
  },
];

export const builderPriceSummarySections = [
  {
    id: "selected-package",
    title: "Selected Website Level",
    source: "selectedPackage",
    showWhenEmpty: true,
    emptyText: "No website level selected yet.",
  },
  {
    id: "selected-addons",
    title: "Selected Add-Ons",
    source: "selectedAddons",
    showWhenEmpty: true,
    emptyText: "No add-ons selected yet.",
  },
  {
    id: "selected-care-plan",
    title: "Care Plan",
    source: "selectedCarePlan",
    showWhenEmpty: false,
  },
  {
    id: "one-time-total",
    title: "Estimated One-Time Project Total",
    source: "oneTimeTotal",
    showWhenEmpty: true,
  },
  {
    id: "monthly-total",
    title: "Estimated Monthly Services",
    source: "monthlyTotal",
    showWhenEmpty: false,
  },
  {
    id: "payment-option",
    title: "Payment Option",
    source: "selectedPaymentPlan",
    showWhenEmpty: true,
    emptyText: "Choose a payment option after selecting a website level.",
  },
];

export const builderNavigationRules = {
  allowBackNavigation: true,
  allowStepSkippingForOptionalSteps: true,
  requirePackageBeforeAddons: true,
  requireDesignDirectionBeforeReview: true,
  requireBusinessIntakeBeforeReview: true,
  requireAcknowledgementsBeforeAgreement: true,
  mobilePriceSummaryBehavior:
    "On mobile, show a sticky bottom bar with the current estimated total and an expandable summary.",
  desktopPriceSummaryBehavior:
    "On desktop, show a sticky right-side pricing summary while the client configures the project.",
};

export const builderFutureIntegrationNotes = {
  contract:
    "The selected package, add-ons, notes, totals, payment option, and acknowledgements should later feed into a project agreement or order summary.",
  payment:
    "The builder should eventually connect to a payment processor after review or as part of a reviewed checkout process.",
  email:
    "The builder should eventually send confirmation emails to the client and project notifications to Hullinger Digital.",
  storage:
    "Uploaded assets and intake responses should eventually be stored in an organized project record.",
};