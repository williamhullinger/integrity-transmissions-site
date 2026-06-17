export const legalTermsPlan = {
  purpose:
    "Plan the website terms, agreement preview, scope rules, payment terms, ownership language, and contract structure for Hullinger Digital website projects.",
  importantNote:
    "This file is not legal advice and should not replace attorney-reviewed terms. It is a structured planning file for website copy, agreement drafting, and future checkout acknowledgements.",
  strategy:
    "Use clear, professional, non-threatening language that protects Hullinger Digital while helping clients understand scope, payments, responsibilities, revision limits, ownership, and project expectations before work begins.",
};

export const agreementSections = [
  {
    id: "project-scope",
    title: "Project Scope",
    plainEnglishSummary:
      "The project includes only the selected package, selected add-ons, approved notes, and written scope confirmed by Hullinger Digital.",
    customerFacingCopy:
      "Your project scope is based on the selected website package, selected add-ons, project details, approved written scope, and any written adjustments confirmed before production begins.",
    agreementDraft:
      "The scope of work is limited to the selected website package, selected add-ons, client-provided project details, and any written scope approved by Hullinger Digital. Any work not included in the selected package, selected add-ons, or approved written scope is excluded unless added by written approval.",
    keyRules: [
      "Selected package defines the base scope.",
      "Selected add-ons define additional approved work.",
      "Client notes help clarify the request but do not automatically expand scope.",
      "Out-of-scope requests require written approval and may require added cost.",
      "Scope may be adjusted after Hullinger Digital review before production begins.",
    ],
    recommendedPlacements: [
      "Terms page",
      "Builder review step",
      "Agreement",
      "Checkout acknowledgement",
    ],
  },

  {
    id: "order-review",
    title: "Order Review Before Production",
    plainEnglishSummary:
      "Every website order is reviewed before work begins to make sure the selected package and add-ons fit the actual request.",
    customerFacingCopy:
      "All website orders are reviewed by Hullinger Digital before production begins. If anything selected is unclear, technically incompatible, impossible to complete as selected, or outside the purchased package or add-ons, Hullinger Digital will contact you to review options.",
    agreementDraft:
      "All website orders and project submissions are subject to review by Hullinger Digital before production begins. If the submitted project details include requirements that are unclear, technically incompatible, impossible to complete as selected, or outside the purchased package or selected add-ons, Hullinger Digital may contact the Client to review available options. Options may include clarifying scope, adjusting scope, adding approved services, upgrading the package, revising the timeline, or canceling/refunding according to the agreement terms.",
    keyRules: [
      "Builder totals are estimates until reviewed.",
      "Hullinger Digital may require clarification before accepting the project.",
      "Incompatible or out-of-scope selections may require changes.",
      "Review protects both the client and Hullinger Digital.",
    ],
    recommendedPlacements: [
      "Builder intro",
      "Builder review step",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "payment-before-work",
    title: "Payment Required Before Work Begins",
    plainEnglishSummary:
      "A required setup payment, deposit, milestone payment, or pay-in-full payment must be received before production starts.",
    customerFacingCopy:
      "A required setup payment, deposit, milestone payment, or pay-in-full payment must be received before production begins.",
    agreementDraft:
      "No production work is required to begin until the required setup payment, deposit, milestone payment, or pay-in-full payment has been received and the project agreement has been accepted by the Client.",
    keyRules: [
      "Agreement must be accepted before production.",
      "Required payment must be received before production.",
      "Payment structure depends on selected package and payment option.",
      "Work may be paused if payments are not current.",
    ],
    recommendedPlacements: [
      "Pricing page",
      "Builder payment step",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "payment-options",
    title: "Payment Options",
    plainEnglishSummary:
      "Different packages may offer pay-in-full, deposit, milestone, or monthly payment options.",
    customerFacingCopy:
      "Depending on the selected package, payment options may include pay-in-full, deposit and balance, milestone payments, or setup plus monthly terms.",
    agreementDraft:
      "Available payment options may vary by package and project scope. Payment options may include pay-in-full, deposit and balance, milestone payments, or setup plus monthly payment terms. The selected payment option will be documented in the project order, invoice, agreement, or approved written scope.",
    keyRules: [
      "Not every payment option applies to every project.",
      "Advanced projects may require custom milestone review.",
      "Monthly plans require minimum term commitment.",
      "Pay-in-full discounts apply only where specifically stated.",
    ],
    recommendedPlacements: [
      "Pricing page",
      "Builder payment selector",
      "Agreement",
    ],
  },

  {
    id: "balance-before-launch",
    title: "Balance Due Before Launch",
    plainEnglishSummary:
      "Remaining balances must be paid before launch, transfer, final publication, or final file delivery unless the agreement says otherwise.",
    customerFacingCopy:
      "Any remaining project balance must be paid before launch, transfer, final publication, or delivery of final project files unless otherwise stated in the agreement.",
    agreementDraft:
      "Unless otherwise stated in the written agreement, all remaining balances must be paid before website launch, website transfer, final publication, or delivery of final project files.",
    keyRules: [
      "Final launch requires account to be current.",
      "Final files are not released until paid in full.",
      "Transfer rights are not released until paid in full.",
    ],
    recommendedPlacements: [
      "Pricing page",
      "Builder review step",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "monthly-payment-plans",
    title: "Monthly Payment Plans",
    plainEnglishSummary:
      "Monthly payment plans lower the upfront cost but the website remains under Hullinger Digital management until paid in full.",
    customerFacingCopy:
      "Payment plans are offered to make professional website projects more accessible. Websites built under a payment plan remain under Hullinger Digital management until the agreement is paid in full.",
    agreementDraft:
      "Websites built under a monthly payment plan remain under Hullinger Digital management until the payment agreement is paid in full. The Client agrees to complete the selected monthly term unless otherwise agreed in writing. Missed or failed payments may result in paused work, delayed launch, temporary website suspension, restricted access, or other remedies described in the agreement.",
    keyRules: [
      "Monthly plans require minimum term completion.",
      "Website remains under Hullinger Digital management until paid in full.",
      "Missed payments may affect work, launch, access, or availability.",
      "Cancellation before term completion may trigger remaining balance or cancellation terms.",
    ],
    recommendedPlacements: [
      "Pricing page",
      "Builder payment step",
      "Builder acknowledgement",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "missed-payments",
    title: "Missed or Failed Payments",
    plainEnglishSummary:
      "Missed payments may pause work, delay launch, restrict access, or temporarily suspend the website until the account is current.",
    customerFacingCopy:
      "Missed or failed payments may result in paused work, delayed launch, temporary website suspension, or restricted access until the account is brought current according to the agreement.",
    agreementDraft:
      "If a payment is missed, failed, reversed, or not received when due, Hullinger Digital may pause work, delay launch, restrict access, temporarily suspend the website, withhold transfer, or take other actions allowed by the agreement until the account is brought current.",
    keyRules: [
      "Language should be professional, not threatening.",
      "Suspension is temporary until account is current where appropriate.",
      "Work may pause during unpaid status.",
      "Access and transfer may be restricted during unpaid status.",
    ],
    recommendedPlacements: [
      "Pricing page",
      "Builder payment acknowledgement",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "ownership-transfer",
    title: "Ownership and Transfer",
    plainEnglishSummary:
      "Website ownership, transfer rights, and final project files are released only after the account is paid in full.",
    customerFacingCopy:
      "Website ownership, transfer rights, and final project files are released only after the account is paid in full according to the agreement.",
    agreementDraft:
      "Unless otherwise agreed in writing, ownership rights, transfer rights, and release of final project files are granted only after the Client has paid all amounts due under the project agreement. Until paid in full, the website may remain under Hullinger Digital management and control as described in the agreement.",
    keyRules: [
      "Ownership transfers after paid in full.",
      "Final files release after paid in full.",
      "Monthly plan sites remain managed by Hullinger Digital until paid in full.",
      "Third-party licenses may have separate ownership or usage terms.",
    ],
    recommendedPlacements: [
      "Pricing page",
      "Builder review step",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "client-responsibilities",
    title: "Client Responsibilities",
    plainEnglishSummary:
      "The client must provide content, information, access, approvals, and feedback on time to keep the project moving.",
    customerFacingCopy:
      "Project timelines depend on timely content, images, access, approvals, feedback, and business information from the client.",
    agreementDraft:
      "The Client is responsible for providing requested business information, content, images, logos, files, access credentials, platform access, approvals, feedback, and other materials reasonably required to complete the project. Delays in providing required materials or approvals may delay the project timeline.",
    keyRules: [
      "Client must provide business details.",
      "Client must provide or approve content.",
      "Client must provide access when needed.",
      "Client must provide timely feedback.",
      "Delays may extend timeline.",
    ],
    recommendedPlacements: [
      "Builder intake",
      "Review summary",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "revisions",
    title: "Revisions and Review Rounds",
    plainEnglishSummary:
      "Each package includes structured revision rounds within the approved scope.",
    customerFacingCopy:
      "Every project includes a structured review and revision process. The number of revision rounds depends on the selected package and applies within the approved project scope.",
    agreementDraft:
      "The project includes the number of revision rounds stated in the selected package or approved scope. Revisions apply only to work within the approved project scope. Revisions do not include unlimited redesigns, new pages, new features, new functionality, strategy changes, or work outside the selected package and approved add-ons unless separately approved in writing.",
    keyRules: [
      "Starter includes 1 revision round.",
      "Launch includes 2 revision rounds.",
      "Lead-Generating includes 3 revision rounds.",
      "Advanced includes 4 revision rounds unless adjusted by scope.",
      "Revisions do not equal unlimited redesigns or new scope.",
    ],
    recommendedPlacements: [
      "Package pages",
      "Pricing page",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "satisfaction-process",
    title: "Satisfaction Process",
    plainEnglishSummary:
      "Hullinger Digital will work within scope to get the direction right before launch, but this is not unlimited scope.",
    customerFacingCopy:
      "Your website should feel like your business at its best. If the first version does not feel right, Hullinger Digital will continue working with you within the agreed project scope until the direction is right and the site is ready to represent your business professionally.",
    agreementDraft:
      "Hullinger Digital provides a structured review and revision process intended to refine the design, message, and layout before launch. If the initial direction does not feel right, Hullinger Digital will work with the Client within the agreed project scope and included revision process to refine the website direction. This does not include unlimited revisions, unlimited redesigns, new pages, new features, or work outside the approved scope unless separately approved in writing.",
    keyRules: [
      "Promise refinement within scope.",
      "Avoid unlimited revision promise.",
      "Avoid unlimited redesign promise.",
      "Tie satisfaction language to approved scope.",
    ],
    recommendedPlacements: [
      "Homepage",
      "Pricing page",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "change-orders",
    title: "Change Orders and Added Work",
    plainEnglishSummary:
      "New requests outside approved scope may require added cost, timeline changes, and written approval.",
    customerFacingCopy:
      "Requests outside the approved project scope may require additional cost, timeline adjustments, or written approval before work continues.",
    agreementDraft:
      "Any request outside the approved scope may be treated as a change order. Change orders may require additional cost, revised timeline, added payment, or separate written approval before work continues.",
    keyRules: [
      "Out-of-scope work requires approval.",
      "Additional cost may apply.",
      "Timeline may change.",
      "Change orders protect the original scope.",
    ],
    recommendedPlacements: [
      "Terms page",
      "Agreement",
      "Builder review notice",
    ],
  },

  {
    id: "third-party-costs",
    title: "Third-Party Costs",
    plainEnglishSummary:
      "Domains, hosting upgrades, plugins, APIs, payment processors, SMS, AI usage, and outside platform costs are separate unless stated.",
    customerFacingCopy:
      "Third-party platform fees, domain fees, hosting upgrades, payment processor fees, plugin licenses, API usage, SMS fees, AI usage, and outside service costs are not included unless specifically stated.",
    agreementDraft:
      "Third-party costs are not included unless specifically stated in the approved scope or agreement. Third-party costs may include domain registration, hosting upgrades, premium plugins, software subscriptions, payment processor fees, API usage, AI usage, SMS fees, email platform fees, e-signature fees, stock media, or other outside platform costs.",
    keyRules: [
      "Do not silently absorb outside platform costs.",
      "Make processor fees separate.",
      "Make AI/SMS/API usage separate unless included.",
      "Clarify client may need own accounts for third-party services.",
    ],
    recommendedPlacements: [
      "Pricing page",
      "Care plan section",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "content-assets",
    title: "Content, Images, and Assets",
    plainEnglishSummary:
      "Client must have rights to the content/assets they provide. Stock, AI, or third-party assets may have separate licensing terms.",
    customerFacingCopy:
      "Clients are responsible for providing content, images, logos, files, and materials they have the right to use, unless Hullinger Digital is specifically hired to create or source those materials.",
    agreementDraft:
      "The Client represents that any content, images, logos, files, trademarks, media, or materials provided to Hullinger Digital may be lawfully used in the project. Stock assets, AI-generated assets, third-party media, fonts, plugins, or other licensed materials may be subject to separate usage or licensing terms.",
    keyRules: [
      "Client must have right to use provided materials.",
      "Third-party licenses may apply.",
      "AI assets should be reviewed before publication.",
      "Logo/brand ownership depends on scope and payment.",
    ],
    recommendedPlacements: [
      "Builder intake",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "timeline",
    title: "Timeline",
    plainEnglishSummary:
      "Estimated timelines depend on scope, client response time, content, access, revisions, and project complexity.",
    customerFacingCopy:
      "Project timelines are estimates and may change based on scope, client response time, content readiness, access, revisions, technical requirements, and approval speed.",
    agreementDraft:
      "Any project timeline provided is an estimate unless specifically stated otherwise in writing. Timelines may be affected by scope changes, delayed client content, delayed access, delayed approvals, third-party issues, technical requirements, revision rounds, or other factors outside Hullinger Digital’s control.",
    keyRules: [
      "Timelines are estimates.",
      "Client delays affect timeline.",
      "Scope changes affect timeline.",
      "Third-party issues affect timeline.",
    ],
    recommendedPlacements: [
      "Package pages",
      "Builder review step",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "launch",
    title: "Launch",
    plainEnglishSummary:
      "Launch happens after required payment, approvals, content, access, testing, and final review are complete.",
    customerFacingCopy:
      "Launch happens after the required payment, approvals, content, access, testing, and final review steps are complete.",
    agreementDraft:
      "Website launch, transfer, or final publication may require completion of required payments, client approvals, content delivery, access credentials, testing, domain or hosting steps, third-party configurations, and final review.",
    keyRules: [
      "Launch requires payment status to be current.",
      "Launch requires approvals.",
      "Launch may require domain/hosting access.",
      "Launch may require third-party setup.",
    ],
    recommendedPlacements: [
      "Terms page",
      "Agreement",
      "Builder agreement/payment step",
    ],
  },

  {
    id: "care-plans",
    title: "Care Plans and Ongoing Support",
    plainEnglishSummary:
      "Ongoing support after launch is covered only if a care plan or separate support agreement is selected.",
    customerFacingCopy:
      "Ongoing support, updates, monitoring, SEO work, advanced tool support, or post-launch changes are covered only according to the selected care plan or separate support agreement.",
    agreementDraft:
      "Post-launch support, website updates, monitoring, maintenance, SEO work, technical support, advanced tool support, or other ongoing services are not included unless covered by a selected care plan, written support agreement, or separately approved work order.",
    keyRules: [
      "Build package does not automatically include unlimited ongoing support.",
      "Care plans define support time and support scope.",
      "Unused care time does not roll over unless agreed.",
      "Advanced tools may require Advanced Care.",
    ],
    recommendedPlacements: [
      "Pricing page",
      "Care plan cards",
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "cancellation-refunds",
    title: "Cancellations and Refunds",
    plainEnglishSummary:
      "Cancellation and refund terms depend on project stage, completed work, purchased services, and agreement terms.",
    customerFacingCopy:
      "Cancellation and refund terms depend on the project stage, completed work, selected payment option, purchased services, and agreement terms.",
    agreementDraft:
      "Cancellation and refund eligibility depend on the project stage, completed work, selected payment option, approved scope, non-refundable costs, purchased services, third-party costs, and the terms of the agreement. Work already completed, time reserved, planning, design, development, third-party costs, and non-refundable purchases may not be refundable.",
    keyRules: [
      "Avoid promising broad refunds.",
      "Completed work may not be refundable.",
      "Third-party costs may not be refundable.",
      "Monthly plans may have remaining balance obligations.",
    ],
    recommendedPlacements: [
      "Terms page",
      "Agreement",
    ],
  },

  {
    id: "advanced-projects",
    title: "Advanced Projects",
    plainEnglishSummary:
      "Advanced projects require extra review because they may involve tools, workflows, databases, payments, AI, user roles, and integrations.",
    customerFacingCopy:
      "Advanced Website projects require review before production begins because they may involve databases, logins, user roles, integrations, payment flows, AI boundaries, workflows, and custom business logic.",
    agreementDraft:
      "Advanced Website projects may require additional planning, technical review, scope confirmation, timeline review, and payment structure review before production begins. Advanced functionality may include databases, customer accounts, employee accounts, user roles, dashboards, workflows, e-commerce, payments, integrations, automations, AI-assisted tools, or other custom logic.",
    keyRules: [
      "Advanced projects are review-gated.",
      "Final scope may change after review.",
      "Technical feasibility must be confirmed.",
      "AI and automation boundaries must be defined.",
    ],
    recommendedPlacements: [
      "Advanced Website page",
      "Builder advanced step",
      "Pricing page",
      "Terms page",
      "Agreement",
    ],
  },
];

export const requiredBuilderAcknowledgements = [
  {
    id: "acknowledge-scope-review",
    label: "Scope review acknowledgement",
    required: true,
    text:
      "I understand that all website orders are reviewed by Hullinger Digital before production begins, and that my selected package, add-ons, notes, or requested features may require scope adjustment, added services, a package upgrade, revised timeline, or cancellation/refund according to the agreement terms.",
    appliesTo: "all-projects",
  },
  {
    id: "acknowledge-payment-before-work",
    label: "Payment before work acknowledgement",
    required: true,
    text:
      "I understand that the required setup payment, deposit, milestone payment, or pay-in-full payment must be received before production begins.",
    appliesTo: "all-projects",
  },
  {
    id: "acknowledge-balance-before-launch",
    label: "Balance before launch acknowledgement",
    required: true,
    text:
      "I understand that any remaining balance must be paid before launch, transfer, final publication, or delivery of final project files unless otherwise stated in the agreement.",
    appliesTo: "all-projects",
  },
  {
    id: "acknowledge-ownership-transfer",
    label: "Ownership transfer acknowledgement",
    required: true,
    text:
      "I understand that website ownership, transfer rights, and final project files are released only after the account is paid in full according to the agreement.",
    appliesTo: "all-projects",
  },
  {
    id: "acknowledge-monthly-plan",
    label: "Monthly plan acknowledgement",
    required: true,
    text:
      "I understand that websites built under a monthly payment plan remain under Hullinger Digital management until the agreement is paid in full, and missed payments may result in paused work, delayed launch, temporary suspension, or restricted access according to the agreement.",
    appliesTo: "monthly-payment-plans",
  },
  {
    id: "acknowledge-client-responsibilities",
    label: "Client responsibilities acknowledgement",
    required: true,
    text:
      "I understand that delays in providing content, images, business details, access, approvals, feedback, logins, or required materials may delay the project timeline.",
    appliesTo: "all-projects",
  },
  {
    id: "acknowledge-advanced-review",
    label: "Advanced project review acknowledgement",
    required: true,
    text:
      "I understand that Advanced Website projects require review before production begins, and final scope, timeline, technical approach, and payment structure may be adjusted before approval.",
    appliesTo: "advanced-website",
  },
];

export const termsPageStructure = [
  {
    id: "terms-intro",
    headline: "Clear expectations before the work begins.",
    body:
      "Website projects work best when scope, payment, responsibilities, revisions, ownership, and support expectations are understood upfront.",
  },
  {
    id: "scope",
    sourceAgreementSectionId: "project-scope",
  },
  {
    id: "review",
    sourceAgreementSectionId: "order-review",
  },
  {
    id: "payments",
    sourceAgreementSectionIds: [
      "payment-before-work",
      "payment-options",
      "balance-before-launch",
      "monthly-payment-plans",
      "missed-payments",
    ],
  },
  {
    id: "ownership",
    sourceAgreementSectionId: "ownership-transfer",
  },
  {
    id: "responsibilities",
    sourceAgreementSectionId: "client-responsibilities",
  },
  {
    id: "revisions",
    sourceAgreementSectionIds: [
      "revisions",
      "satisfaction-process",
      "change-orders",
    ],
  },
  {
    id: "third-party-assets",
    sourceAgreementSectionIds: [
      "third-party-costs",
      "content-assets",
    ],
  },
  {
    id: "timeline-launch",
    sourceAgreementSectionIds: [
      "timeline",
      "launch",
    ],
  },
  {
    id: "care-support",
    sourceAgreementSectionId: "care-plans",
  },
  {
    id: "cancellation",
    sourceAgreementSectionId: "cancellation-refunds",
  },
  {
    id: "advanced",
    sourceAgreementSectionId: "advanced-projects",
  },
];

export const contractDraftingNotes = {
  recommendation:
    "Use one master Website Services Agreement with an attached project/order summary generated from the selected package, add-ons, payment option, and project notes.",
  why:
    "A master agreement keeps legal terms consistent while the order summary defines the specific scope for each project.",
  orderSummaryShouldInclude: [
    "Client name and business name",
    "Selected package",
    "Selected add-ons",
    "Selected care plan if applicable",
    "Selected payment option",
    "Amount due today",
    "Estimated project total",
    "Monthly service total if applicable",
    "Project notes",
    "Design direction summary",
    "Client responsibilities",
    "Required acknowledgements",
  ],
  attorneyReview:
    "Before using as a final client agreement, have the agreement reviewed by a qualified attorney familiar with website services, payment plans, intellectual property, and local business requirements.",
};

export const legalToneRules = {
  professional:
    "Use clear, calm, professional language. Do not sound threatening or defensive.",
  direct:
    "Terms should be easy to understand. Avoid unnecessary legal jargon where plain language works.",
  protective:
    "Protect scope, payment, ownership, third-party costs, and timeline boundaries.",
  noOverpromising:
    "Do not promise unlimited revisions, guaranteed SEO rankings, guaranteed lead volume, or guaranteed business results.",
  noScareTactics:
    "Payment/suspension language should be firm but not aggressive.",
};