export const visualSectionTypes = [
  {
    id: "website-mockup",
    name: "Website Mockup",
    description:
      "A polished visual showing desktop, tablet, or mobile website screens.",
  },
  {
    id: "ui-cards",
    name: "Floating UI Cards",
    description:
      "Small interface cards used to show features, tools, SEO structure, forms, payments, portals, dashboards, or automations.",
  },
  {
    id: "process-diagram",
    name: "Process Diagram",
    description:
      "A visual path or timeline showing how a visitor, customer, or project moves through steps.",
  },
  {
    id: "comparison-visual",
    name: "Comparison Visual",
    description:
      "A side-by-side visual used to explain template vs custom, package differences, or before/after concepts.",
  },
  {
    id: "dashboard-mockup",
    name: "Dashboard Mockup",
    description:
      "A visual showing customer, employee, admin, lead, workflow, or reporting dashboard concepts.",
  },
  {
    id: "form-flow",
    name: "Form / Intake Flow",
    description:
      "A visual showing multi-step forms, quote requests, uploads, approvals, or customer intake.",
  },
  {
    id: "automation-flow",
    name: "Automation Flow",
    description:
      "A visual showing one customer action triggering emails, SMS, internal alerts, records, tasks, or follow-ups.",
  },
  {
    id: "ai-tool-preview",
    name: "AI Tool Preview",
    description:
      "A visual showing AI summaries, reply drafts, estimate help, content support, or knowledge-base assistance.",
  },
  {
    id: "video-reel-placeholder",
    name: "Video / Reel Placeholder",
    description:
      "A planned space for a future reel, animation, or short visual explanation.",
  },
];

export const visualSections = [
  {
    id: "home-hero-platform-mockup",
    pageId: "home",
    sectionId: "home-hero",
    typeId: "website-mockup",
    title: "Premium website and business tools hero mockup",
    purpose:
      "Immediately show that Hullinger Digital builds more than basic web pages.",
    description:
      "A layered desktop and mobile website mockup with floating cards for SEO Structure, Lead Forms, Customer Portal, Employee Dashboard, Online Payments, Automation, and AI Assistant.",
    visualStyle:
      "Dark premium interface, soft blue glow, clean device frames, subtle glass-style cards, modern dashboard details.",
    mustCommunicate: [
      "Premium custom website design",
      "SEO foundation",
      "Lead capture",
      "Advanced business tools",
      "Website plus operational functionality",
    ],
    contentElements: [
      "Desktop website screen",
      "Mobile website screen",
      "Floating SEO card",
      "Floating lead form card",
      "Floating customer portal card",
      "Floating employee dashboard card",
      "Floating payment card",
      "Floating automation card",
      "Floating AI assistant card",
    ],
    motionIdea:
      "Cards gently float or fade in around the main website mockup. Keep motion subtle and premium.",
    priority: "high",
  },

  {
    id: "home-visitor-path",
    pageId: "home",
    sectionId: "website-should-do-more",
    typeId: "process-diagram",
    title: "Visitor path from first impression to action",
    purpose:
      "Show that a website should guide visitors instead of just presenting information.",
    description:
      "A simple visual path showing a visitor moving from message, to trust, to service clarity, to call-to-action, to inquiry.",
    visualStyle:
      "Clean horizontal or vertical path with premium icons and concise labels.",
    mustCommunicate: [
      "Clear message",
      "Trust-building",
      "Service explanation",
      "Call to action",
      "Lead or inquiry",
    ],
    contentElements: [
      "Message",
      "Trust",
      "Services",
      "CTA",
      "Lead",
    ],
    motionIdea:
      "Each step can reveal in sequence as the section scrolls into view.",
    priority: "medium",
  },

  {
    id: "template-vs-custom-foundation",
    pageId: "home",
    sectionId: "template-vs-custom",
    typeId: "comparison-visual",
    title: "Template vs custom foundation comparison",
    purpose:
      "Explain why custom websites are different from templates without sounding unfair or exaggerated.",
    description:
      "A side-by-side visual comparing a prefab shed labeled Template Website with a custom foundation/building labeled Custom Website.",
    visualStyle:
      "Premium illustrated or semi-3D concept graphic. Avoid cartoon style.",
    mustCommunicate: [
      "Templates start with a layout",
      "Custom websites start with strategy",
      "Custom structure supports future growth",
      "SEO, lead flow, and business tools belong in the foundation",
    ],
    contentElements: [
      "Template Website",
      "Pre-made layout",
      "Limited flexibility",
      "Custom Website",
      "Strategy",
      "SEO structure",
      "Service pages",
      "Lead flow",
      "Business tools",
    ],
    motionIdea:
      "The custom foundation layers can stack in one by one: Strategy, SEO, Services, Lead Flow, Tools.",
    priority: "high",
  },

  {
    id: "seo-search-to-lead-path",
    pageId: "home",
    sectionId: "seo-structure",
    typeId: "process-diagram",
    title: "SEO search-to-lead path",
    purpose:
      "Make SEO feel practical and structural instead of vague or magical.",
    description:
      "A path showing a customer search leading to a search result, then an SEO service page, trust content, CTA, and form submission.",
    visualStyle:
      "Clean dark/light hybrid diagram with search UI, page preview, trust cards, and lead form card.",
    mustCommunicate: [
      "Search visibility begins with structure",
      "Service pages matter",
      "Trust content supports conversion",
      "SEO should lead toward action",
    ],
    contentElements: [
      "Customer search",
      "Search result",
      "Service page",
      "Reviews / FAQs / proof",
      "CTA",
      "Form submission",
    ],
    motionIdea:
      "Animate the path from search to form submission with subtle line movement.",
    priority: "high",
  },

  {
    id: "service-level-card-system",
    pageId: "home",
    sectionId: "service-selector",
    typeId: "ui-cards",
    title: "Website level selector cards",
    purpose:
      "Help visitors quickly understand the four service levels before entering the builder.",
    description:
      "Four premium cards for Starter, Launch, Lead-Generating, and Advanced with starting price, best-fit label, and short description.",
    visualStyle:
      "High-end pricing/service cards with clear hierarchy and restrained accent highlights.",
    mustCommunicate: [
      "There are clear starting points",
      "Each level has a different purpose",
      "Lower tiers are still professional",
      "Advanced means functional, not just large",
    ],
    contentElements: [
      "Starter Web Page",
      "Launch Website",
      "Lead-Generating Website",
      "Advanced Website",
      "Starting prices",
      "Best-fit labels",
      "Explore buttons",
    ],
    motionIdea:
      "Cards lift subtly on hover. Selected or recommended card can have a soft glow.",
    priority: "high",
  },

  {
    id: "builder-process-timeline",
    pageId: "home",
    sectionId: "online-process-hands-on-build",
    typeId: "process-diagram",
    title: "Builder process and hands-on design timeline",
    purpose:
      "Show that the online builder is a clear process, not an automated cookie-cutter generator.",
    description:
      "A timeline showing choose, configure, share details, sign, pay, review, design, build, and launch.",
    visualStyle:
      "Premium step timeline with small interface previews and completion indicators.",
    mustCommunicate: [
      "The process is clear",
      "The builder defines scope",
      "Hullinger Digital reviews the project",
      "The site is hands-on designed and built",
    ],
    contentElements: [
      "Choose",
      "Configure",
      "Share Details",
      "Sign",
      "Pay",
      "Review",
      "Design",
      "Build",
      "Launch",
    ],
    motionIdea:
      "Steps progress one at a time as the user scrolls or as a looped micro-animation.",
    priority: "high",
  },

  {
    id: "advanced-tools-dashboard-collage",
    pageId: "home",
    sectionId: "website-can-do-more",
    typeId: "dashboard-mockup",
    title: "Advanced website tools dashboard collage",
    purpose:
      "Show the difference between a normal website and a website that supports business operations.",
    description:
      "A collage of customer portal, employee dashboard, quote request, upload form, payment card, automation flow, and AI summary card.",
    visualStyle:
      "Dark premium interface panels with clean data, cards, labels, and workflow arrows.",
    mustCommunicate: [
      "Customer tools",
      "Employee tools",
      "Payments",
      "Lead/job tracking",
      "Automations",
      "AI assistance",
    ],
    contentElements: [
      "Customer Portal",
      "Employee Dashboard",
      "Quote Request",
      "Photo Upload",
      "Payment",
      "Automation",
      "AI Summary",
    ],
    motionIdea:
      "Panels can slide or fade into a layered dashboard composition.",
    priority: "high",
  },

  {
    id: "pricing-tier-preview",
    pageId: "home",
    sectionId: "pricing-preview",
    typeId: "ui-cards",
    title: "Pricing tier preview cards",
    purpose:
      "Show transparent starting prices without making the homepage feel like a full pricing table.",
    description:
      "A clean four-card pricing preview with package names, starting prices, and one-line best-fit descriptions.",
    visualStyle:
      "Premium pricing cards with strong spacing, simple numbers, and clear CTAs.",
    mustCommunicate: [
      "Transparent starting prices",
      "Scalable options",
      "Different levels for different needs",
      "Builder can calculate estimated total",
    ],
    contentElements: [
      "$395+",
      "$1,295+",
      "$3,950+",
      "$8,500+",
      "Build My Website Plan",
    ],
    motionIdea:
      "Cards can reveal in order or highlight the recommended middle option.",
    priority: "medium",
  },

  {
    id: "review-refinement-loop",
    pageId: "home",
    sectionId: "structured-review-process",
    typeId: "process-diagram",
    title: "Structured review and refinement loop",
    purpose:
      "Explain the satisfaction/revision process with guardrails.",
    description:
      "A circular or stepped loop showing first draft, feedback, refinement, approval, and launch.",
    visualStyle:
      "Clean professional process graphic with calm trust-focused styling.",
    mustCommunicate: [
      "Review is included",
      "Revisions are structured",
      "Scope still matters",
      "The site is refined before launch",
    ],
    contentElements: [
      "First Direction",
      "Feedback",
      "Refinement",
      "Approval",
      "Launch",
    ],
    motionIdea:
      "Loop can animate subtly with each step becoming active.",
    priority: "medium",
  },

  {
    id: "selected-work-cards",
    pageId: "home",
    sectionId: "selected-work",
    typeId: "website-mockup",
    title: "Selected work and systems thinking cards",
    purpose:
      "Show proof and capability without making the site feel like a personal portfolio.",
    description:
      "Three polished project cards showing Reign & Wilder, Integrity Transmission & Drivetrain, and Advanced Website Tools.",
    visualStyle:
      "Premium case study cards with device mockups, outcome labels, and system-thinking notes.",
    mustCommunicate: [
      "Design capability",
      "Business systems thinking",
      "Order/form/workflow planning",
      "Advanced tool planning",
    ],
    contentElements: [
      "Reign & Wilder",
      "Integrity Transmission & Drivetrain",
      "Advanced Website Tools",
    ],
    motionIdea:
      "Cards lift on hover with subtle detail reveal.",
    priority: "medium",
  },

  {
    id: "starter-one-page-mockup",
    pageId: "starter-web-page",
    sectionId: "starter-hero",
    typeId: "website-mockup",
    title: "Starter one-page website mockup",
    purpose:
      "Show that Starter is polished and professional, not cheap or throwaway.",
    description:
      "A focused one-page website mockup with hero, business overview, services, contact, map/service area, and mobile view.",
    visualStyle:
      "Clean, simple, polished one-page layout with strong contact path.",
    mustCommunicate: [
      "Professional first impression",
      "Simple service overview",
      "Easy contact",
      "Mobile-friendly",
    ],
    contentElements: [
      "Hero",
      "Services",
      "Contact",
      "Map / Service Area",
      "Mobile view",
    ],
    motionIdea:
      "Subtle scroll preview through the one-page layout.",
    priority: "high",
  },

  {
    id: "launch-three-page-mockup",
    pageId: "launch-website",
    sectionId: "launch-hero",
    typeId: "website-mockup",
    title: "Launch three-page website mockup",
    purpose:
      "Show the difference between a one-page presence and a small custom informational website.",
    description:
      "Three connected page previews: homepage, services overview, and about/contact.",
    visualStyle:
      "Polished multi-page website screens with simple navigation and clean hierarchy.",
    mustCommunicate: [
      "Multi-page structure",
      "Clearer services",
      "Credibility",
      "Professional contact flow",
    ],
    contentElements: [
      "Homepage",
      "Services Overview",
      "About / Contact",
    ],
    motionIdea:
      "Pages can fan out or slide to show the added structure.",
    priority: "high",
  },

  {
    id: "lead-seo-service-page-mockup",
    pageId: "lead-generating-website",
    sectionId: "lead-hero",
    typeId: "website-mockup",
    title: "Lead-generating service page mockup",
    purpose:
      "Show how dedicated service pages support trust, SEO, and better inquiries.",
    description:
      "A service page preview with search-focused headings, proof sections, FAQs, testimonials, service-area cues, and quote form.",
    visualStyle:
      "Professional SEO page layout with clear CTA and trust content.",
    mustCommunicate: [
      "SEO structure",
      "Dedicated service content",
      "Trust-building",
      "Quote request flow",
    ],
    contentElements: [
      "Service page",
      "SEO headings",
      "Trust proof",
      "FAQ",
      "Testimonials",
      "Quote form",
    ],
    motionIdea:
      "Highlight sections one by one: SEO, trust, CTA, form.",
    priority: "high",
  },

  {
    id: "advanced-front-door-back-office",
    pageId: "advanced-website",
    sectionId: "advanced-hero",
    typeId: "dashboard-mockup",
    title: "Public website plus private business tools visual",
    purpose:
      "Explain the advanced website concept clearly.",
    description:
      "A split visual showing the public website as the front door and private tools as the back office.",
    visualStyle:
      "Left side public website mockup, right side portal/dashboard/workflow panels, connected by arrows.",
    mustCommunicate: [
      "Public website",
      "Customer portal",
      "Employee dashboard",
      "Workflow tracking",
      "Payments",
      "AI assistance",
    ],
    contentElements: [
      "Public Website",
      "Customer Login",
      "Staff Dashboard",
      "Requests",
      "Approvals",
      "Payments",
      "Automations",
      "AI Tools",
    ],
    motionIdea:
      "A customer request moves from public site into internal workflow and customer status update.",
    priority: "high",
  },

  {
    id: "builder-interface-preview",
    pageId: "website-builder",
    sectionId: "builder-hero",
    typeId: "form-flow",
    title: "Website builder interface preview",
    purpose:
      "Preview the builder experience before the customer starts.",
    description:
      "A UI mockup showing package selection, add-ons, required notes, design direction fields, and sticky price summary.",
    visualStyle:
      "Clean app-style interface with cards, inputs, progress steps, and pricing summary.",
    mustCommunicate: [
      "Guided process",
      "Live pricing",
      "Add-ons",
      "Required notes",
      "Review before production",
    ],
    contentElements: [
      "Progress steps",
      "Package cards",
      "Add-on selectors",
      "Notes fields",
      "Estimated total",
      "Due today",
    ],
    motionIdea:
      "Price total updates when add-on cards are selected.",
    priority: "high",
  },

  {
    id: "pricing-comparison-table",
    pageId: "pricing",
    sectionId: "pricing-package-comparison",
    typeId: "ui-cards",
    title: "Package comparison pricing visual",
    purpose:
      "Make package differences easy to compare.",
    description:
      "A responsive pricing comparison with four tier cards and upgrade logic callouts.",
    visualStyle:
      "Premium table/card hybrid with clear hierarchy and restrained colors.",
    mustCommunicate: [
      "Each tier has a clear job",
      "Pricing is transparent",
      "Custom depth increases by package",
      "Add-ons and review still matter",
    ],
    contentElements: [
      "Starter",
      "Launch",
      "Lead-Generating",
      "Advanced",
      "Starting prices",
      "Best for",
      "Included highlights",
    ],
    motionIdea:
      "Cards can highlight on hover or selection.",
    priority: "high",
  },

  {
    id: "about-systems-approach",
    pageId: "about",
    sectionId: "about-positioning",
    typeId: "process-diagram",
    title: "Strategy, structure, and systems approach visual",
    purpose:
      "Make the About page feel professional and company-minded instead of just personal.",
    description:
      "A systems-style diagram showing business goals, customer journey, website structure, SEO, design, and tools connected together.",
    visualStyle:
      "Clean strategic diagram with premium technical styling.",
    mustCommunicate: [
      "Strategy",
      "Structure",
      "Customer journey",
      "SEO",
      "Design",
      "Business tools",
    ],
    contentElements: [
      "Business Goals",
      "Customer Journey",
      "Website Structure",
      "SEO Foundation",
      "Design System",
      "Business Tools",
    ],
    motionIdea:
      "Nodes connect subtly as the section enters view.",
    priority: "medium",
  },
];

export const visualProductionNotes = {
  general:
    "Visuals should be planned into the layout from the beginning. Avoid building text-only sections and trying to squeeze visuals in later.",
  style:
    "Keep visuals premium, clean, slightly technical, and business-focused. Avoid cartoonish graphics, cheesy stock imagery, or gimmicky effects.",
  motion:
    "Motion should support understanding. Use subtle reveals, floating UI cards, card hover states, and small progress animations. Avoid distracting movement.",
  placeholderRule:
    "During early development, use styled mockup placeholders with real labels instead of blank gray boxes or filler text.",
  futureReels:
    "Short reels or animations can later be created for template vs custom, SEO structure, service levels, builder process, and advanced website possibilities.",
};

export const futureReelConcepts = [
  {
    id: "reel-template-vs-custom",
    title: "Template vs Custom",
    concept:
      "A prefab layout appears quickly, then a custom foundation builds layer by layer: strategy, SEO, services, trust, lead flow, tools.",
    placement: ["home", "pricing"],
    priority: "high",
  },
  {
    id: "reel-seo-path",
    title: "SEO Structure Path",
    concept:
      "A customer search turns into a service page visit, then moves through trust proof, FAQ, CTA, and lead form.",
    placement: ["home", "lead-generating-website"],
    priority: "high",
  },
  {
    id: "reel-builder-process",
    title: "Builder Process",
    concept:
      "The customer selects a package, adds features, sees the total update, submits details, signs, pays, and Hullinger Digital reviews/builds.",
    placement: ["home", "website-builder"],
    priority: "high",
  },
  {
    id: "reel-advanced-tools",
    title: "Advanced Website Possibilities",
    concept:
      "A customer request flows from public website into portal, staff dashboard, approval, payment, automation, and AI summary.",
    placement: ["home", "advanced-website"],
    priority: "high",
  },
  {
    id: "reel-service-levels",
    title: "Website Service Levels",
    concept:
      "Starter, Launch, Lead-Generating, and Advanced stack upward to show increasing structure, strategy, and functionality.",
    placement: ["home", "pricing"],
    priority: "medium",
  },
];

export const mockupLabels = {
  seo: "SEO Structure",
  leads: "Lead Forms",
  portal: "Customer Portal",
  dashboard: "Employee Dashboard",
  payments: "Online Payments",
  automation: "Automation",
  ai: "AI Assistant",
  quote: "Quote Request",
  uploads: "Photo Uploads",
  approvals: "Approvals",
  status: "Status Updates",
  analytics: "Analytics",
  reviews: "Reviews",
  faq: "FAQ",
};