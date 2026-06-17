export const carePlans = [
  {
    id: "essential-care",
    slug: "essential-care",
    name: "Essential Care",
    price: 79,
    priceLabel: "$79/month",
    billingCycle: "monthly",
    shortDescription:
      "Basic website care for smaller websites that need reliable hosting support, monitoring, backups, and minor updates.",
    bestFor:
      "Starter Web Page and Launch Website clients who want the website maintained after launch.",
    recommendedForPackages: ["starter-web-page", "launch-website"],
    includedSupportTime: {
      amount: 30,
      unit: "minutes",
      label: "Up to 30 minutes of minor text or image updates per month",
    },
    includedFeatures: [
      "Website hosting support",
      "Basic security monitoring",
      "Routine backups",
      "Basic uptime monitoring",
      "Minor text and image updates up to 30 minutes per month",
      "Basic technical support for website-related issues",
    ],
    notIncluded: [
      "New page design",
      "Major layout changes",
      "SEO campaign work",
      "Custom feature development",
      "Advanced form or workflow changes",
      "E-commerce management",
      "Emergency support outside normal support terms",
    ],
    rolloverPolicy:
      "Unused monthly update time does not roll over unless specifically agreed in writing.",
    overagePolicy:
      "Additional work outside the included monthly support time may be quoted separately or billed at the current hourly/project rate.",
    cancellationNote:
      "Care plans are billed monthly and may require notice before cancellation depending on the client agreement.",
    primaryCta: "Add Essential Care",
  },

  {
    id: "professional-care",
    slug: "professional-care",
    name: "Professional Care",
    price: 149,
    priceLabel: "$149/month",
    billingCycle: "monthly",
    shortDescription:
      "Ongoing website care for businesses that need more regular updates, form monitoring, analytics review, and priority support.",
    bestFor:
      "Launch Website and Lead-Generating Website clients that want more active website support after launch.",
    recommendedForPackages: ["launch-website", "lead-generating-website"],
    includedSupportTime: {
      amount: 1,
      unit: "hour",
      label: "Up to 1 hour of minor updates per month",
    },
    includedFeatures: [
      "Everything in Essential Care",
      "Up to 1 hour of minor website updates per month",
      "Form monitoring",
      "Basic analytics review",
      "Dependency, plugin, or integration checks when applicable",
      "Priority support compared to Essential Care",
      "Basic recommendations for small website improvements",
    ],
    notIncluded: [
      "Full SEO campaign management",
      "Large content writing projects",
      "New custom page builds",
      "Advanced automation changes",
      "Custom dashboard or portal development",
      "E-commerce product management unless added separately",
    ],
    rolloverPolicy:
      "Unused monthly update time does not roll over unless specifically agreed in writing.",
    overagePolicy:
      "Additional work outside the included monthly support time may be quoted separately or billed at the current hourly/project rate.",
    cancellationNote:
      "Care plans are billed monthly and may require notice before cancellation depending on the client agreement.",
    primaryCta: "Add Professional Care",
  },

  {
    id: "growth-care",
    slug: "growth-care",
    name: "Growth Care",
    price: 299,
    priceLabel: "$299/month",
    billingCycle: "monthly",
    shortDescription:
      "A stronger care plan for businesses that want regular improvement, SEO support, content direction, and performance review.",
    bestFor:
      "Lead-Generating Website clients who want the website to keep improving after launch.",
    recommendedForPackages: ["lead-generating-website"],
    includedSupportTime: {
      amount: 2,
      unit: "hours",
      label: "Up to 2 hours of website updates and improvement support per month",
    },
    includedFeatures: [
      "Everything in Professional Care",
      "Up to 2 hours of website updates or improvement support per month",
      "SEO improvement support",
      "Monthly performance review",
      "Landing page or content improvement planning",
      "Basic conversion improvement recommendations",
      "Support for small content, CTA, form, or page refinements",
    ],
    notIncluded: [
      "Full monthly blog/article writing unless selected separately",
      "Paid ad management",
      "Large new page builds",
      "Major redesigns",
      "Custom software development",
      "Advanced portal, dashboard, or workflow support unless covered by Advanced Care",
    ],
    rolloverPolicy:
      "Unused monthly update time does not roll over unless specifically agreed in writing.",
    overagePolicy:
      "Additional work outside the included monthly support time may be quoted separately or billed at the current hourly/project rate.",
    cancellationNote:
      "Care plans are billed monthly and may require notice before cancellation depending on the client agreement.",
    primaryCta: "Add Growth Care",
  },

  {
    id: "advanced-care",
    slug: "advanced-care",
    name: "Advanced Care",
    price: 599,
    priceLabel: "Starting at $599/month",
    billingCycle: "monthly",
    shortDescription:
      "Ongoing care for advanced websites with portals, dashboards, automations, workflows, e-commerce, or custom tools.",
    bestFor:
      "Advanced Website clients who need active technical support and monitoring after launch.",
    recommendedForPackages: ["advanced-website"],
    includedSupportTime: {
      amount: 4,
      unit: "hours",
      label: "Up to 4 hours of advanced website and tool support per month",
    },
    includedFeatures: [
      "Everything in Growth Care where applicable",
      "Up to 4 hours of website, workflow, portal, or dashboard support per month",
      "Workflow monitoring",
      "Customer portal or dashboard support",
      "Automation checks",
      "Priority technical support",
      "Basic troubleshooting for approved custom tools",
      "Support for small refinements to advanced website features",
    ],
    notIncluded: [
      "Large new feature development",
      "Major software rebuilds",
      "Third-party platform fees",
      "Payment processor fees",
      "API usage fees",
      "Emergency support outside the agreed support terms",
      "Ongoing AI usage costs unless specifically included",
    ],
    rolloverPolicy:
      "Unused monthly support time does not roll over unless specifically agreed in writing.",
    overagePolicy:
      "Additional work outside the included monthly support time may be quoted separately or billed at the current hourly/project rate.",
    cancellationNote:
      "Advanced Care may require a custom agreement depending on the tools, integrations, and workflows included in the website.",
    primaryCta: "Add Advanced Care",
  },
];

export const carePlanComparisonNotes = {
  essential:
    "Essential Care is for keeping a smaller website maintained, monitored, and supported without adding ongoing growth strategy.",
  professional:
    "Professional Care is for businesses that expect regular updates, form monitoring, basic analytics review, and stronger support.",
  growth:
    "Growth Care is for lead-focused websites that need ongoing improvement, SEO support, and performance review after launch.",
  advanced:
    "Advanced Care is for websites with custom functionality, portals, dashboards, workflows, automations, e-commerce, or AI-assisted tools.",
};

export const carePlanRules = {
  noRollover:
    "Unused monthly support or update time does not roll over unless specifically agreed in writing.",
  scopeBoundary:
    "Care plans cover maintenance, support, updates, and improvements within the plan scope. New pages, new features, major redesigns, custom development, and expanded integrations may require a separate quote.",
  thirdPartyFees:
    "Third-party platform fees, hosting upgrades, payment processor fees, plugin licenses, API usage, SMS fees, AI usage, and other outside service costs are not included unless specifically stated in the agreement.",
  activeAccount:
    "Care plan services require the client account to remain current. Missed payments may pause support and may affect website availability depending on the agreement.",
};

export const defaultCarePlanRecommendation = {
  "starter-web-page": "essential-care",
  "launch-website": "professional-care",
  "lead-generating-website": "growth-care",
  "advanced-website": "advanced-care",
};