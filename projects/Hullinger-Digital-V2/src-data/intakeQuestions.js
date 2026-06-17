export const questionGroups = [
  {
    id: "design-direction",
    title: "Design Direction",
    description:
      "Helps Hullinger Digital understand the look, feel, style, and visual direction the client wants before design begins.",
    required: true,
  },
  {
    id: "business-intake",
    title: "Business Information",
    description:
      "Collects the basic business details needed to plan the website, write accurate content, and prepare the project.",
    required: true,
  },
  {
    id: "project-intake",
    title: "Project Goals & Scope",
    description:
      "Collects the client’s website goals, priorities, timeline, current problems, and project expectations.",
    required: true,
  },
  {
    id: "asset-intake",
    title: "Content, Assets & Access",
    description:
      "Collects information about logos, images, copy, website access, domain access, and other materials needed for the build.",
    required: true,
  },
  {
    id: "advanced-intake",
    title: "Advanced Website Tools",
    description:
      "Collects additional details for portals, dashboards, workflows, e-commerce, automations, AI tools, or internal business systems.",
    required: false,
  },
];

export const intakeQuestions = [
  {
    id: "reference-websites-liked",
    groupId: "design-direction",
    stepId: "design-direction",
    label: "Reference websites you like",
    type: "textarea",
    required: true,
    placeholder:
      "Paste links to websites you like and explain what you like about each one.",
    helperText:
      "Mention colors, layout, movement, images, navigation, wording, buttons, checkout flow, overall feel, or anything else that stands out.",
    minLength: 20,
    reviewPriority: "high",
  },
  {
    id: "reference-websites-disliked",
    groupId: "design-direction",
    stepId: "design-direction",
    label: "Websites or styles you do not like",
    type: "textarea",
    required: false,
    placeholder:
      "Paste links or describe styles you want to avoid.",
    helperText:
      "This helps avoid designs that feel too cheap, too busy, too plain, too playful, too corporate, too dark, too colorful, or off-brand.",
    reviewPriority: "medium",
  },
  {
    id: "preferred-style-mood",
    groupId: "design-direction",
    stepId: "design-direction",
    label: "Preferred style and mood",
    type: "multi-select",
    required: true,
    helperText:
      "Choose the words that best describe how the website should feel.",
    options: [
      { value: "premium", label: "Premium" },
      { value: "modern", label: "Modern" },
      { value: "clean", label: "Clean" },
      { value: "bold", label: "Bold" },
      { value: "minimal", label: "Minimal" },
      { value: "corporate", label: "Corporate / professional" },
      { value: "high-tech", label: "High-tech" },
      { value: "luxury", label: "Luxury" },
      { value: "warm", label: "Warm and approachable" },
      { value: "industrial", label: "Industrial" },
      { value: "creative", label: "Creative" },
      { value: "local-trustworthy", label: "Local and trustworthy" },
      { value: "simple-professional", label: "Simple and professional" },
      { value: "other", label: "Other" },
    ],
    requiresNotesWhenSelected: ["other"],
    notesPrompt:
      "Describe the style or mood if you selected Other.",
    reviewPriority: "high",
  },
  {
    id: "color-direction",
    groupId: "design-direction",
    stepId: "design-direction",
    label: "Color direction",
    type: "textarea",
    required: true,
    placeholder:
      "Describe preferred colors, colors to avoid, and whether any color should be dominant or used only as an accent.",
    helperText:
      "For example: dark navy as the main color, gold as an accent, white background, avoid bright red.",
    minLength: 10,
    reviewPriority: "high",
  },
  {
    id: "design-feeling",
    groupId: "design-direction",
    stepId: "design-direction",
    label: "What should the website make people feel?",
    type: "textarea",
    required: true,
    placeholder:
      "Examples: confident, safe, impressed, comfortable, ready to call, like we are the premium option, like we are easy to work with.",
    helperText:
      "This helps guide design, copy, imagery, and calls to action.",
    minLength: 10,
    reviewPriority: "high",
  },
  {
    id: "must-have-design-details",
    groupId: "design-direction",
    stepId: "design-direction",
    label: "Must-have design details",
    type: "textarea",
    required: false,
    placeholder:
      "List anything the website must include visually or structurally.",
    helperText:
      "Examples: hero video, gallery, before/after images, bold call buttons, dark theme, large photos, service cards, premium animations, simple navigation.",
    reviewPriority: "medium",
  },
  {
    id: "design-elements-to-avoid",
    groupId: "design-direction",
    stepId: "design-direction",
    label: "Design elements to avoid",
    type: "textarea",
    required: false,
    placeholder:
      "List anything you do not want on the website.",
    helperText:
      "Examples: cheesy stock photos, cartoon icons, too much animation, cluttered pages, bright colors, playful fonts, generic templates.",
    reviewPriority: "medium",
  },
  {
    id: "brand-assets-status",
    groupId: "design-direction",
    stepId: "design-direction",
    label: "Brand assets status",
    type: "single-select",
    required: true,
    helperText:
      "Choose the option that best describes the current logo and brand situation.",
    options: [
      {
        value: "complete-brand",
        label: "We already have a logo, colors, fonts, and brand direction",
      },
      {
        value: "logo-only",
        label: "We have a logo, but not much else",
      },
      {
        value: "rough-brand",
        label: "We have rough ideas but need polish",
      },
      {
        value: "need-brand-help",
        label: "We need help with logo, colors, or visual direction",
      },
      {
        value: "not-sure",
        label: "Not sure yet",
      },
    ],
    reviewPriority: "high",
  },

  {
    id: "business-name",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Business name",
    type: "text",
    required: true,
    placeholder: "Business name",
    helperText:
      "Enter the business name exactly as it should appear on the website.",
    reviewPriority: "high",
  },
  {
    id: "legal-business-name",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Legal business name, if different",
    type: "text",
    required: false,
    placeholder: "Legal business name",
    helperText:
      "Only include this if the legal name is different from the public-facing business name.",
    reviewPriority: "low",
  },
  {
    id: "primary-contact-name",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Primary contact name",
    type: "text",
    required: true,
    placeholder: "Full name",
    helperText:
      "This should be the person responsible for communication, approvals, and project decisions.",
    reviewPriority: "high",
  },
  {
    id: "primary-contact-email",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Primary contact email",
    type: "email",
    required: true,
    placeholder: "name@example.com",
    helperText:
      "Project updates, approvals, and important notices may be sent here.",
    reviewPriority: "high",
  },
  {
    id: "primary-contact-phone",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Primary contact phone",
    type: "tel",
    required: true,
    placeholder: "(555) 555-5555",
    helperText:
      "Used for project communication if email is not enough.",
    reviewPriority: "high",
  },
  {
    id: "business-location",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Business location",
    type: "textarea",
    required: false,
    placeholder:
      "Business address, city/state, service area, or note if the business is online-only.",
    helperText:
      "This helps with local SEO, contact sections, service-area messaging, maps, and trust signals.",
    reviewPriority: "medium",
  },
  {
    id: "business-phone-public",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Public business phone number",
    type: "tel",
    required: false,
    placeholder: "(555) 555-5555",
    helperText:
      "Enter the phone number that should appear on the website, if different from the primary contact phone.",
    reviewPriority: "medium",
  },
  {
    id: "business-email-public",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Public business email",
    type: "email",
    required: false,
    placeholder: "info@example.com",
    helperText:
      "Enter the email that should appear on the website, if applicable.",
    reviewPriority: "medium",
  },
  {
    id: "current-website-url",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Current website URL",
    type: "url",
    required: false,
    placeholder: "https://example.com",
    helperText:
      "Leave blank if there is no current website.",
    reviewPriority: "medium",
  },
  {
    id: "social-links",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Social media or profile links",
    type: "textarea",
    required: false,
    placeholder:
      "Paste Facebook, Instagram, LinkedIn, TikTok, YouTube, Google Business Profile, Yelp, or other links.",
    helperText:
      "These may be used for social links, trust signals, embedded content, or research.",
    reviewPriority: "medium",
  },
  {
    id: "business-description",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Describe the business",
    type: "textarea",
    required: true,
    placeholder:
      "What does the business do? Who does it serve? What makes it different?",
    helperText:
      "Write naturally. This does not need to sound polished. Hullinger Digital can use it to understand the business and prepare better copy.",
    minLength: 40,
    reviewPriority: "high",
  },
  {
    id: "primary-services",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Main services, products, or offers",
    type: "textarea",
    required: true,
    placeholder:
      "List the main services, products, packages, or offers that need to appear on the website.",
    helperText:
      "For SEO-focused websites, list services separately instead of lumping everything together.",
    minLength: 20,
    reviewPriority: "high",
  },
  {
    id: "ideal-customers",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Ideal customers",
    type: "textarea",
    required: true,
    placeholder:
      "Who are the best customers for this business? Who should the website speak to?",
    helperText:
      "This helps shape messaging, trust sections, calls to action, and page structure.",
    minLength: 20,
    reviewPriority: "high",
  },
  {
    id: "service-area-details",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Service area details",
    type: "textarea",
    required: false,
    placeholder:
      "List cities, counties, regions, states, or note if the business serves customers nationwide or online.",
    helperText:
      "Important for local SEO and service-area messaging.",
    reviewPriority: "medium",
  },
  {
    id: "competitors",
    groupId: "business-intake",
    stepId: "business-project-intake",
    label: "Competitors or similar businesses",
    type: "textarea",
    required: false,
    placeholder:
      "Paste competitor websites or names of similar businesses.",
    helperText:
      "This helps understand positioning, industry expectations, and opportunities to stand apart.",
    reviewPriority: "medium",
  },

  {
    id: "main-website-goal",
    groupId: "project-intake",
    stepId: "business-project-intake",
    label: "Main goal for the website",
    type: "single-select",
    required: true,
    helperText:
      "Choose the most important job the website needs to do.",
    options: [
      {
        value: "look-professional",
        label: "Look professional and credible",
      },
      {
        value: "explain-services",
        label: "Explain services clearly",
      },
      {
        value: "generate-leads",
        label: "Generate more leads or quote requests",
      },
      {
        value: "improve-seo",
        label: "Improve SEO and search visibility",
      },
      {
        value: "sell-online",
        label: "Sell products or services online",
      },
      {
        value: "collect-bookings",
        label: "Collect bookings or appointment requests",
      },
      {
        value: "support-customers",
        label: "Support customers with tools, uploads, approvals, or status updates",
      },
      {
        value: "support-internal-work",
        label: "Support internal staff, workflows, dashboards, or operations",
      },
      {
        value: "other",
        label: "Other",
      },
    ],
    requiresNotesWhenSelected: ["other"],
    notesPrompt:
      "Describe the main website goal if you selected Other.",
    reviewPriority: "high",
  },
  {
    id: "website-problems",
    groupId: "project-intake",
    stepId: "business-project-intake",
    label: "Problems with the current website or online presence",
    type: "textarea",
    required: false,
    placeholder:
      "Examples: outdated, hard to edit, not ranking, not getting leads, looks cheap, unclear services, bad mobile experience, slow, no forms, no trust.",
    helperText:
      "This helps identify what the redesign needs to fix.",
    reviewPriority: "high",
  },
  {
    id: "top-priorities",
    groupId: "project-intake",
    stepId: "business-project-intake",
    label: "Top project priorities",
    type: "multi-select",
    required: true,
    helperText:
      "Choose the priorities that matter most for this project.",
    options: [
      { value: "professional-look", label: "Professional appearance" },
      { value: "clear-message", label: "Clear message and service explanation" },
      { value: "mobile-friendly", label: "Better mobile experience" },
      { value: "seo-structure", label: "SEO structure" },
      { value: "lead-quality", label: "Better lead quality" },
      { value: "quote-requests", label: "Quote/request form" },
      { value: "trust-proof", label: "Reviews, proof, credibility, or authority" },
      { value: "speed-performance", label: "Speed and performance" },
      { value: "easy-updates", label: "Easier future updates" },
      { value: "payments", label: "Online payments" },
      { value: "booking", label: "Booking or scheduling" },
      { value: "customer-tools", label: "Customer tools or portal" },
      { value: "employee-tools", label: "Employee/internal tools" },
      { value: "automation", label: "Automations" },
      { value: "ai-tools", label: "AI-assisted tools" },
    ],
    reviewPriority: "high",
  },
  {
    id: "desired-actions",
    groupId: "project-intake",
    stepId: "business-project-intake",
    label: "What should visitors do on the website?",
    type: "multi-select",
    required: true,
    helperText:
      "Choose the actions the website should guide people toward.",
    options: [
      { value: "call", label: "Call the business" },
      { value: "submit-form", label: "Submit a contact or quote form" },
      { value: "book", label: "Book or request an appointment" },
      { value: "buy", label: "Buy a product or service" },
      { value: "pay-deposit", label: "Pay a deposit" },
      { value: "upload-files", label: "Upload photos or files" },
      { value: "request-review", label: "Request a project review" },
      { value: "create-account", label: "Create or access an account" },
      { value: "view-status", label: "View job, order, or request status" },
      { value: "learn", label: "Learn enough to trust the business" },
      { value: "other", label: "Other" },
    ],
    requiresNotesWhenSelected: ["other"],
    notesPrompt:
      "Describe the visitor action if you selected Other.",
    reviewPriority: "high",
  },
  {
    id: "timeline-preference",
    groupId: "project-intake",
    stepId: "business-project-intake",
    label: "Preferred timeline",
    type: "single-select",
    required: true,
    helperText:
      "This does not guarantee a launch date, but it helps with planning and review.",
    options: [
      { value: "asap", label: "As soon as reasonably possible" },
      { value: "1-2-weeks", label: "1–2 weeks" },
      { value: "3-5-weeks", label: "3–5 weeks" },
      { value: "6-10-weeks", label: "6–10 weeks" },
      { value: "flexible", label: "Flexible timeline" },
      { value: "specific-deadline", label: "I have a specific deadline" },
    ],
    requiresNotesWhenSelected: ["specific-deadline"],
    notesPrompt:
      "Enter the deadline and explain why it matters.",
    reviewPriority: "medium",
  },
  {
    id: "budget-awareness",
    groupId: "project-intake",
    stepId: "business-project-intake",
    label: "Budget comfort level",
    type: "single-select",
    required: false,
    helperText:
      "This helps Hullinger Digital recommend the right scope if the selected options need adjustment.",
    options: [
      { value: "stay-close-to-selected", label: "Stay as close to the selected total as possible" },
      { value: "some-flexibility", label: "Some flexibility if the value makes sense" },
      { value: "quality-over-lowest-price", label: "Quality and right fit matter more than lowest price" },
      { value: "need-payment-plan", label: "I need a payment plan option" },
      { value: "not-sure", label: "Not sure yet" },
    ],
    reviewPriority: "medium",
  },
  {
    id: "project-notes",
    groupId: "project-intake",
    stepId: "business-project-intake",
    label: "Additional project notes",
    type: "textarea",
    required: true,
    placeholder:
      "Share anything else Hullinger Digital should know before reviewing the project.",
    helperText:
      "Include concerns, expectations, must-haves, unknowns, special requests, or details that did not fit anywhere else.",
    minLength: 20,
    reviewPriority: "high",
  },

  {
    id: "logo-files-status",
    groupId: "asset-intake",
    stepId: "business-project-intake",
    label: "Logo files",
    type: "single-select",
    required: true,
    helperText:
      "Choose the option that best describes what logo files are available.",
    options: [
      { value: "vector-files", label: "We have vector files such as SVG, AI, EPS, or PDF" },
      { value: "image-files", label: "We have image files such as PNG or JPG" },
      { value: "low-quality-only", label: "We only have a low-quality logo image" },
      { value: "need-logo", label: "We need a logo created or cleaned up" },
      { value: "not-sure", label: "Not sure" },
    ],
    reviewPriority: "medium",
  },
  {
    id: "photos-status",
    groupId: "asset-intake",
    stepId: "business-project-intake",
    label: "Photos and media",
    type: "single-select",
    required: true,
    helperText:
      "Choose the option that best describes available website photos or media.",
    options: [
      { value: "professional-photos-ready", label: "We have professional photos ready" },
      { value: "some-photos", label: "We have some usable photos" },
      { value: "need-stock-photos", label: "We need stock photo direction" },
      { value: "need-ai-or-custom-visuals", label: "We need AI-generated or custom visuals" },
      { value: "not-sure", label: "Not sure" },
    ],
    reviewPriority: "medium",
  },
  {
    id: "copy-status",
    groupId: "asset-intake",
    stepId: "business-project-intake",
    label: "Website copy/content status",
    type: "single-select",
    required: true,
    helperText:
      "Choose the option that best describes current written content.",
    options: [
      { value: "copy-ready", label: "We already have website copy ready" },
      { value: "rough-notes", label: "We have rough notes or bullet points" },
      { value: "existing-website-content", label: "Use content from the existing website as a starting point" },
      { value: "need-copywriting", label: "We need copywriting help" },
      { value: "not-sure", label: "Not sure" },
    ],
    reviewPriority: "high",
  },
  {
    id: "domain-status",
    groupId: "asset-intake",
    stepId: "business-project-intake",
    label: "Domain status",
    type: "single-select",
    required: true,
    helperText:
      "Choose the option that best describes the website domain situation.",
    options: [
      { value: "domain-owned", label: "We already own the domain" },
      { value: "need-domain", label: "We need help choosing or buying a domain" },
      { value: "domain-with-old-provider", label: "The domain is tied to an old website/provider" },
      { value: "not-sure", label: "Not sure" },
    ],
    reviewPriority: "high",
  },
  {
    id: "domain-name",
    groupId: "asset-intake",
    stepId: "business-project-intake",
    label: "Domain name",
    type: "text",
    required: false,
    placeholder: "example.com",
    helperText:
      "Enter the domain if known.",
    reviewPriority: "medium",
  },
  {
    id: "hosting-status",
    groupId: "asset-intake",
    stepId: "business-project-intake",
    label: "Hosting or website platform status",
    type: "single-select",
    required: false,
    helperText:
      "Choose the option that best describes the current hosting or platform situation.",
    options: [
      { value: "no-current-hosting", label: "No current hosting" },
      { value: "current-host-known", label: "We know the current host/platform" },
      { value: "wordpress", label: "Current site is on WordPress" },
      { value: "wix-squarespace-godaddy", label: "Current site is on Wix, Squarespace, GoDaddy, or similar" },
      { value: "custom-site", label: "Current site is custom-built" },
      { value: "not-sure", label: "Not sure" },
    ],
    reviewPriority: "medium",
  },
  {
    id: "access-availability",
    groupId: "asset-intake",
    stepId: "business-project-intake",
    label: "Access availability",
    type: "multi-select",
    required: false,
    helperText:
      "Choose what the client can provide access to if needed.",
    options: [
      { value: "domain-registrar", label: "Domain registrar access" },
      { value: "hosting", label: "Hosting access" },
      { value: "current-website", label: "Current website login" },
      { value: "google-business-profile", label: "Google Business Profile" },
      { value: "analytics", label: "Google Analytics or tracking tools" },
      { value: "search-console", label: "Google Search Console" },
      { value: "email-platform", label: "Business email platform" },
      { value: "payment-processor", label: "Payment processor" },
      { value: "scheduling-tool", label: "Scheduling or booking tool" },
      { value: "not-sure", label: "Not sure" },
    ],
    reviewPriority: "medium",
  },
  {
    id: "upload-notes",
    groupId: "asset-intake",
    stepId: "business-project-intake",
    label: "Files, images, or assets to provide",
    type: "file-upload-notes",
    required: false,
    placeholder:
      "Describe any files you plan to upload or send later.",
    helperText:
      "Later the builder should support logo uploads, images, documents, brand files, written content, and other project assets.",
    reviewPriority: "medium",
  },

  {
    id: "advanced-tools-needed",
    groupId: "advanced-intake",
    stepId: "advanced-tools",
    label: "Advanced tools needed",
    type: "multi-select",
    required: false,
    helperText:
      "Choose any advanced tools the website may need.",
    options: [
      { value: "customer-login", label: "Customer login" },
      { value: "employee-login", label: "Employee login" },
      { value: "customer-dashboard", label: "Customer dashboard" },
      { value: "staff-dashboard", label: "Staff dashboard" },
      { value: "admin-panel", label: "Admin panel" },
      { value: "file-uploads", label: "File or photo uploads" },
      { value: "status-tracking", label: "Job, order, or request status tracking" },
      { value: "approvals", label: "Customer approvals" },
      { value: "payments", label: "Payments, deposits, or invoices" },
      { value: "ecommerce", label: "E-commerce or online ordering" },
      { value: "workflow-tracking", label: "Internal workflow or job tracking" },
      { value: "automation", label: "Automations" },
      { value: "ai-tools", label: "AI tools" },
      { value: "not-sure", label: "Not sure yet" },
    ],
    reviewPriority: "high",
    conditionalDisplay: {
      showWhenPackageIs: ["advanced-website"],
      showWhenAddOnCategoriesSelected: [
        "customer-tools",
        "employee-internal-tools",
        "ai-tools",
      ],
    },
  },
  {
    id: "advanced-workflow-description",
    groupId: "advanced-intake",
    stepId: "advanced-tools",
    label: "Describe the advanced workflow",
    type: "textarea",
    required: false,
    placeholder:
      "Describe what should happen from the moment a customer submits something to the final result.",
    helperText:
      "Example: customer submits a request, uploads photos, staff reviews it, estimate is created, customer approves, payment is collected, job status updates.",
    reviewPriority: "high",
    conditionalDisplay: {
      showWhenPackageIs: ["advanced-website"],
      showWhenAddOnCategoriesSelected: [
        "customer-tools",
        "employee-internal-tools",
        "online-sales-payments",
        "automations",
        "ai-tools",
      ],
    },
  },
  {
    id: "user-roles-needed",
    groupId: "advanced-intake",
    stepId: "advanced-tools",
    label: "User roles needed",
    type: "textarea",
    required: false,
    placeholder:
      "List the types of users who need access and what each should be able to do.",
    helperText:
      "Examples: owner, manager, employee, customer, vendor, admin.",
    reviewPriority: "high",
    conditionalDisplay: {
      showWhenAddOnsSelected: [
        "customer-account-login",
        "employee-login-starter",
        "role-based-access",
        "customer-dashboard",
        "staff-dashboard",
        "admin-panel",
      ],
    },
  },
  {
    id: "ai-tool-boundaries",
    groupId: "advanced-intake",
    stepId: "advanced-tools",
    label: "AI tool goals and boundaries",
    type: "textarea",
    required: false,
    placeholder:
      "Describe what AI should help with and what it should not be allowed to decide or send automatically.",
    helperText:
      "AI tools should have clear limits, review steps, and approved use cases.",
    reviewPriority: "high",
    conditionalDisplay: {
      showWhenAddOnCategoriesSelected: ["ai-tools"],
    },
  },
];

export const intakeValidationRules = {
  requiredQuestions:
    "Questions marked required must be completed before the client can review the final website plan.",
  minimumText:
    "Long-form answers may require a minimum length so Hullinger Digital has enough context to review the project.",
  conditionalQuestions:
    "Some questions should appear only when the selected package, add-ons, or answers make them relevant.",
  notesForOther:
    "If a client selects Other, the builder should require an explanation before allowing the client to continue.",
  advancedReview:
    "Advanced Website tools require careful review before production begins because scope, timeline, technical approach, and payment structure may need adjustment.",
};

export const intakeDisplayRules = {
  requiredLabel: "Required",
  optionalLabel: "Optional",
  otherExplanationRequired: true,
  showHelperText: true,
  showReviewPriorityInternally: true,
  allowSaveAndReturnLater: true,
  fileUploadsFutureNote:
    "The first version of the builder may collect file notes only. Later versions should support direct logo, image, document, and asset uploads.",
};

export const intakeInternalReviewPriorities = {
  high:
    "High-priority answers should be reviewed before accepting the project or beginning production.",
  medium:
    "Medium-priority answers help improve planning, content, design, and scope accuracy.",
  low:
    "Low-priority answers are useful but usually do not control core scope decisions.",
};