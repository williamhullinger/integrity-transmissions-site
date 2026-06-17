export const brandSystem = {
  brandName: "Hullinger Digital",

  brandPositioning: {
    primaryDescriptor:
      "Custom websites, SEO foundations, and advanced website tools for serious businesses.",
    shortDescriptor:
      "Custom websites, SEO foundations, and business website tools.",
    locationLine: "Based in Missouri. Built for businesses anywhere.",
    coreMessage:
      "Hullinger Digital builds custom websites with strategy, structure, and purpose — from polished web presence projects to lead-generating websites and advanced business tools.",
    brandPromise:
      "A clearer website process, stronger structure, and a finished site built to represent the business professionally.",
  },

  tone: {
    personality: [
      "Premium",
      "Professional",
      "Confident",
      "Clear",
      "Practical",
      "Strategic",
      "Trustworthy",
      "System-minded",
    ],
    writingStyle:
      "Clear, direct, polished, and business-focused. Avoid hype, filler, over-promising, or bargain-bin language.",
    shouldFeelLike: [
      "A serious digital studio",
      "A strategic website partner",
      "A premium but approachable company",
      "A business that understands structure, systems, SEO, and practical outcomes",
    ],
    shouldNotFeelLike: [
      "A cheap website builder",
      "A small-time freelancer portfolio",
      "A local-only web guy",
      "A generic agency template",
      "A hype-heavy marketing company",
      "A one-size-fits-all website shop",
    ],
    avoidPhrases: [
      "Do you need a website?",
      "You’ve come to the right place",
      "One-stop shop",
      "Take your business to the next level",
      "Affordable websites for everyone",
      "Cheap website design",
      "Fast and easy websites",
      "We do it all",
      "Your business deserves the best",
    ],
    preferredPhrases: [
      "A better website starts with a better plan.",
      "A template starts with a layout. A custom website starts with a strategy.",
      "Templates give you pages. Custom websites create the path.",
      "A template gives you walls. A custom website gives you a foundation for growth.",
      "Simple websites are built to get you online. Custom websites are built to help you grow.",
      "A streamlined online ordering process does not mean automated, cookie-cutter websites.",
    ],
  },

  colorPalette: {
    strategy:
      "Use a premium dark foundation with bright, clean contrast and restrained accent colors. The site should feel modern, technical, and polished without looking flashy or gimmicky.",
    primary: {
      id: "deep-navy",
      name: "Deep Navy",
      hex: "#07111F",
      usage:
        "Primary background color for hero sections, premium panels, navigation, footer, and dark visual areas.",
    },
    secondary: {
      id: "midnight-blue",
      name: "Midnight Blue",
      hex: "#0D1B2E",
      usage:
        "Secondary background for cards, section blocks, builder panels, and layered visual depth.",
    },
    surface: {
      id: "soft-white",
      name: "Soft White",
      hex: "#F7F8FA",
      usage:
        "Light section background where readability and contrast are needed.",
    },
    surfaceMuted: {
      id: "cool-gray",
      name: "Cool Gray",
      hex: "#E7EBF0",
      usage:
        "Subtle borders, background contrast, input fields, comparison areas, and quiet dividers.",
    },
    textPrimary: {
      id: "near-white",
      name: "Near White",
      hex: "#F8FAFC",
      usage:
        "Main text on dark backgrounds.",
    },
    textDark: {
      id: "charcoal",
      name: "Charcoal",
      hex: "#162033",
      usage:
        "Main text on light backgrounds.",
    },
    textMuted: {
      id: "muted-slate",
      name: "Muted Slate",
      hex: "#64748B",
      usage:
        "Secondary text, helper text, form descriptions, and quiet metadata.",
    },
    accentPrimary: {
      id: "electric-blue",
      name: "Electric Blue",
      hex: "#3B82F6",
      usage:
        "Primary CTA buttons, selected states, active progress steps, important links, and subtle glow effects.",
    },
    accentSecondary: {
      id: "steel-cyan",
      name: "Steel Cyan",
      hex: "#22D3EE",
      usage:
        "Secondary highlights, technical feature accents, UI mockup details, and small visual energy.",
    },
    accentWarm: {
      id: "premium-gold",
      name: "Premium Gold",
      hex: "#D6A84F",
      usage:
        "Small premium accents only. Use sparingly for trust, featured badges, or high-value callouts.",
    },
    success: {
      id: "clean-green",
      name: "Clean Green",
      hex: "#22C55E",
      usage:
        "Success states, completed steps, selected confirmations, and positive system feedback.",
    },
    warning: {
      id: "amber",
      name: "Amber",
      hex: "#F59E0B",
      usage:
        "Review required notices, warnings, scope reminders, and important but non-error alerts.",
    },
    danger: {
      id: "red",
      name: "Red",
      hex: "#EF4444",
      usage:
        "Errors, destructive actions, failed validation, and payment issue warnings.",
    },
  },

  typography: {
    strategy:
      "Use modern, highly readable sans-serif typography with strong headlines and clean body text. The site should feel premium and corporate without looking stiff.",
    recommendedFontStack: {
      heading:
        "Inter, Manrope, Avenir Next, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      body:
        "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      mono:
        "JetBrains Mono, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
    },
    headingStyle:
      "Large, confident, spacious headlines. Avoid overly playful or decorative fonts.",
    bodyStyle:
      "Readable line height, moderate paragraph width, clear hierarchy, and enough spacing to avoid cramped sections.",
    scale: {
      eyebrow: {
        size: "0.78rem",
        weight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      },
      h1: {
        size: "clamp(3rem, 7vw, 6.5rem)",
        weight: 800,
        lineHeight: 0.95,
        letterSpacing: "-0.06em",
      },
      h2: {
        size: "clamp(2.2rem, 4vw, 4rem)",
        weight: 800,
        lineHeight: 1,
        letterSpacing: "-0.05em",
      },
      h3: {
        size: "clamp(1.4rem, 2vw, 2rem)",
        weight: 750,
        lineHeight: 1.1,
        letterSpacing: "-0.03em",
      },
      bodyLarge: {
        size: "1.125rem",
        weight: 400,
        lineHeight: 1.7,
      },
      body: {
        size: "1rem",
        weight: 400,
        lineHeight: 1.65,
      },
      small: {
        size: "0.875rem",
        weight: 400,
        lineHeight: 1.5,
      },
    },
  },

  layout: {
    strategy:
      "Use spacious sections, strong contrast, layered cards, visual mockups, and clear section transitions. Avoid a flat text-only brochure layout.",
    maxWidth: "1180px",
    wideMaxWidth: "1440px",
    sectionPaddingDesktop: "112px 24px",
    sectionPaddingTablet: "88px 22px",
    sectionPaddingMobile: "72px 18px",
    gridGap: "24px",
    borderRadius: {
      small: "10px",
      medium: "18px",
      large: "28px",
      xlarge: "36px",
      pill: "999px",
    },
    shadows: {
      soft: "0 18px 60px rgba(0, 0, 0, 0.18)",
      medium: "0 24px 80px rgba(0, 0, 0, 0.24)",
      glowBlue: "0 0 60px rgba(59, 130, 246, 0.28)",
      glowCyan: "0 0 48px rgba(34, 211, 238, 0.18)",
    },
    borders: {
      darkSubtle: "1px solid rgba(255, 255, 255, 0.10)",
      lightSubtle: "1px solid rgba(15, 23, 42, 0.10)",
      active: "1px solid rgba(59, 130, 246, 0.65)",
    },
  },

  components: {
    buttons: {
      primary: {
        label: "Primary CTA",
        style:
          "Solid electric blue button with strong contrast, rounded pill shape, subtle shadow, and clear hover state.",
        usage:
          "Use for main actions such as Build My Website Plan, Start Building, or Build My Advanced Website.",
      },
      secondary: {
        label: "Secondary CTA",
        style:
          "Transparent or dark glass button with border, clean hover state, and strong readability.",
        usage:
          "Use for comparison, review request, or learn-more actions.",
      },
      ghost: {
        label: "Ghost Button",
        style:
          "Minimal button or text link with arrow indicator.",
        usage:
          "Use inside cards and smaller feature sections.",
      },
    },
    cards: {
      packageCard:
        "Large premium cards with package name, price, fit description, included summary, CTA, and selected state for builder use.",
      featureCard:
        "Compact cards for SEO, lead capture, automation, portals, dashboards, and advanced tool examples.",
      pricingCard:
        "Clear cards with price, best-fit label, included highlights, payment options, and upgrade path.",
      calloutCard:
        "High-contrast card for important education, review notices, SEO quote, or payment-plan notes.",
      builderCard:
        "Interactive selectable card with checkbox/radio state, price, helper text, notes requirement, and review warning where applicable.",
    },
    forms: {
      inputStyle:
        "Large readable fields with subtle borders, clear labels, helper text, and strong focus state.",
      requiredStyle:
        "Required fields should be clearly marked without feeling aggressive.",
      helperTextStyle:
        "Helper text should be useful and specific, not generic filler.",
      validationStyle:
        "Validation messages should explain what is missing and how to fix it.",
    },
    priceSummary: {
      desktop:
        "Sticky right-side summary card showing selected package, add-ons, one-time total, monthly services, payment option, due today, and review notice.",
      mobile:
        "Sticky bottom bar showing estimated total and expandable summary.",
    },
  },

  visualLanguage: {
    strategy:
      "Use visuals to explain strategy, structure, SEO, custom vs template, the builder process, and advanced tools. Avoid relying on text alone.",
    recurringVisuals: [
      "Layered desktop and mobile website mockups",
      "Floating UI cards",
      "SEO path diagrams",
      "Template vs custom foundation visuals",
      "Builder step previews",
      "Customer portal mockups",
      "Employee dashboard mockups",
      "Quote form and upload flow mockups",
      "Payment and checkout cards",
      "Automation flow diagrams",
      "AI assistant summary cards",
    ],
    imageStyle:
      "High-end, clean, slightly technical, business-focused, and modern. Avoid cheesy stock photography and generic smiling-at-laptop images.",
    iconStyle:
      "Thin-line or softly filled icons with consistent stroke weight. Avoid cartoon-style icons.",
    mockupStyle:
      "Dark UI panels, glass effects, soft gradients, crisp borders, and realistic business interface details.",
  },

  motion: {
    strategy:
      "Motion should feel premium and intentional. Use subtle transitions, reveals, hover states, and mockup movement. Avoid distracting effects.",
    recommendedMotion: [
      "Subtle fade and slide section reveals",
      "Floating UI card movement",
      "Button hover lift",
      "Card hover border glow",
      "Progress step transitions",
      "Builder selection animations",
      "Accordion expand/collapse",
      "Sticky summary updates",
    ],
    avoidMotion: [
      "Bouncy animations",
      "Spinning elements",
      "Too many moving objects at once",
      "Animations that slow down reading",
      "Gimmicky scroll hijacking",
    ],
    timing: {
      fast: "150ms",
      normal: "250ms",
      slow: "450ms",
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
  },

  accessibility: {
    strategy:
      "The premium design should still be readable, keyboard-friendly, mobile-friendly, and clear.",
    rules: [
      "Maintain strong color contrast for all text.",
      "Do not rely on color alone to show selection or errors.",
      "Use visible focus states for buttons, links, form fields, and builder cards.",
      "Keep paragraphs readable with comfortable line length.",
      "Use semantic headings in order.",
      "Buttons should describe the action clearly.",
      "Form labels should remain visible.",
      "Helper text should be associated with the correct input in the final build.",
    ],
  },

  seoDefaults: {
    titleTemplate: "%s | Hullinger Digital",
    defaultMetaDescription:
      "Hullinger Digital builds custom websites, SEO foundations, and advanced website tools for businesses that need more than a generic online presence.",
    defaultOgImage: "/images/hullinger-digital-og-image.jpg",
    schemaTypesToConsider: [
      "Organization",
      "LocalBusiness",
      "Service",
      "FAQPage",
      "BreadcrumbList",
      "WebSite",
      "Article",
    ],
    seoPrinciple:
      "SEO should be planned into the page structure, service pages, headings, metadata, internal linking, and content strategy before launch.",
  },

  responsiveRules: {
    mobileFirst:
      "Mobile layouts should be clean, stacked, and easy to scan. The builder should never feel cramped on a phone.",
    tablet:
      "Tablet layouts can use two-column cards and simplified mockup visuals.",
    desktop:
      "Desktop layouts should use strong two-column sections, sticky summaries, wide mockups, and premium spacing.",
    builder:
      "Desktop builder should use a sticky right-side pricing summary. Mobile builder should use a sticky bottom total bar with expandable details.",
  },

  contentRules: {
    noFiller:
      "Do not use placeholder filler copy on finished pages. Every visible section should have real, polished copy.",
    pageRoles:
      "Homepage introduces and routes. Service pages deepen and educate. Builder configures and collects. Pricing clarifies. About builds trust. Terms sets expectations.",
    repetitionRule:
      "Repeat the core message consistently, but do not copy the same paragraphs across every page.",
    customVsTemplate:
      "Explain templates fairly. Templates can work for simple needs, but custom planning matters when credibility, SEO, lead flow, differentiation, and growth are important.",
    satisfactionGuarantee:
      "Use a structured review and revision promise, not unlimited revisions or unlimited scope.",
  },
};

export const cssVariableMap = {
  "--color-deep-navy": brandSystem.colorPalette.primary.hex,
  "--color-midnight-blue": brandSystem.colorPalette.secondary.hex,
  "--color-soft-white": brandSystem.colorPalette.surface.hex,
  "--color-cool-gray": brandSystem.colorPalette.surfaceMuted.hex,
  "--color-near-white": brandSystem.colorPalette.textPrimary.hex,
  "--color-charcoal": brandSystem.colorPalette.textDark.hex,
  "--color-muted-slate": brandSystem.colorPalette.textMuted.hex,
  "--color-electric-blue": brandSystem.colorPalette.accentPrimary.hex,
  "--color-steel-cyan": brandSystem.colorPalette.accentSecondary.hex,
  "--color-premium-gold": brandSystem.colorPalette.accentWarm.hex,
  "--color-success": brandSystem.colorPalette.success.hex,
  "--color-warning": brandSystem.colorPalette.warning.hex,
  "--color-danger": brandSystem.colorPalette.danger.hex,
  "--max-width": brandSystem.layout.maxWidth,
  "--wide-max-width": brandSystem.layout.wideMaxWidth,
  "--radius-small": brandSystem.layout.borderRadius.small,
  "--radius-medium": brandSystem.layout.borderRadius.medium,
  "--radius-large": brandSystem.layout.borderRadius.large,
  "--radius-xlarge": brandSystem.layout.borderRadius.xlarge,
  "--radius-pill": brandSystem.layout.borderRadius.pill,
  "--shadow-soft": brandSystem.layout.shadows.soft,
  "--shadow-medium": brandSystem.layout.shadows.medium,
  "--shadow-glow-blue": brandSystem.layout.shadows.glowBlue,
  "--motion-fast": brandSystem.motion.timing.fast,
  "--motion-normal": brandSystem.motion.timing.normal,
  "--motion-slow": brandSystem.motion.timing.slow,
  "--motion-easing": brandSystem.motion.timing.easing,
};