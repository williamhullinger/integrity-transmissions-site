export const paymentPlanTypes = [
  {
    id: "pay-in-full",
    name: "Pay in Full",
    shortName: "Pay in Full",
    description:
      "Best for clients who want the simplest project terms and the lowest total price when a pay-in-full discount is available.",
    customerFacingDescription:
      "Pay the project balance upfront and move forward with the simplest payment structure.",
    ownershipNote:
      "Website ownership and transfer terms still follow the project agreement, but pay-in-full projects avoid ongoing build-payment balances.",
    riskLevel: "lowest",
    requiresAgreement: true,
  },
  {
    id: "deposit-balance",
    name: "Deposit + Balance",
    shortName: "Deposit",
    description:
      "Best for smaller projects where the client pays a deposit to begin and the remaining balance before launch.",
    customerFacingDescription:
      "Start with a deposit, then pay the remaining balance before the website goes live.",
    ownershipNote:
      "Website ownership transfers only after the account is paid in full according to the agreement.",
    riskLevel: "standard",
    requiresAgreement: true,
  },
  {
    id: "milestone",
    name: "Milestone Plan",
    shortName: "Milestones",
    description:
      "Best for larger projects where payments are divided across approved project stages.",
    customerFacingDescription:
      "Split the project into staged payments tied to major project checkpoints.",
    ownershipNote:
      "Website ownership transfers only after all milestone payments and approved balances are paid in full.",
    riskLevel: "standard",
    requiresAgreement: true,
  },
  {
    id: "monthly",
    name: "Setup + Monthly Plan",
    shortName: "Monthly",
    description:
      "Best for clients who want a lower upfront cost and are willing to complete a minimum monthly payment term.",
    customerFacingDescription:
      "Start with a setup payment, then continue with monthly payments for the agreed term.",
    ownershipNote:
      "Websites built under a monthly payment plan remain under Hullinger Digital management until the agreement is paid in full.",
    riskLevel: "higher",
    requiresAgreement: true,
    requiresMinimumTerm: true,
  },
];

export const packagePaymentPlans = {
  "starter-web-page": [
    {
      id: "starter-pay-in-full",
      packageId: "starter-web-page",
      typeId: "pay-in-full",
      label: "Pay in full",
      amountDueToday: 395,
      projectTotal: 395,
      discountAmount: 0,
      monthlyPayment: 0,
      termMonths: 0,
      remainingBalance: 0,
      isRecommended: true,
      customerNote:
        "Best for the fastest start and simplest project terms.",
      internalNote:
        "Starter projects are small enough that pay-in-full should be encouraged.",
    },
    {
      id: "starter-deposit",
      packageId: "starter-web-page",
      typeId: "deposit-balance",
      label: "Deposit today + balance before launch",
      amountDueToday: 195,
      projectTotal: 395,
      discountAmount: 0,
      monthlyPayment: 0,
      termMonths: 0,
      remainingBalance: 200,
      isRecommended: false,
      customerNote:
        "Pay $195 to begin. The remaining $200 is due before launch.",
      internalNote:
        "Use when the client needs a lower upfront start but still keep the balance due before launch.",
    },
    {
      id: "starter-monthly-6",
      packageId: "starter-web-page",
      typeId: "monthly",
      label: "$150 setup + $49/month for 6 months",
      amountDueToday: 150,
      projectTotal: 444,
      discountAmount: 0,
      monthlyPayment: 49,
      termMonths: 6,
      remainingBalance: 294,
      isRecommended: false,
      customerNote:
        "Start with $150 down and continue at $49/month for 6 months. Website remains under Hullinger Digital management until paid in full.",
      internalNote:
        "Monthly plan costs more than base price to account for financing/admin risk.",
    },
  ],

  "launch-website": [
    {
      id: "launch-pay-in-full",
      packageId: "launch-website",
      typeId: "pay-in-full",
      label: "Pay in full with 10% discount",
      amountDueToday: 1165,
      projectTotal: 1165,
      originalPrice: 1295,
      discountAmount: 130,
      monthlyPayment: 0,
      termMonths: 0,
      remainingBalance: 0,
      isRecommended: true,
      customerNote:
        "Pay in full and receive a 10% discount from the standard Launch Website price.",
      internalNote:
        "Rounded discount from $1,295 to $1,165 for cleaner checkout pricing.",
    },
    {
      id: "launch-deposit",
      packageId: "launch-website",
      typeId: "deposit-balance",
      label: "$650 deposit + $645 before launch",
      amountDueToday: 650,
      projectTotal: 1295,
      discountAmount: 0,
      monthlyPayment: 0,
      termMonths: 0,
      remainingBalance: 645,
      isRecommended: false,
      customerNote:
        "Pay $650 to begin. The remaining $645 is due before launch.",
      internalNote:
        "Standard deposit structure for Launch projects.",
    },
    {
      id: "launch-monthly-8",
      packageId: "launch-website",
      typeId: "monthly",
      label: "$395 setup + $149/month for 8 months",
      amountDueToday: 395,
      projectTotal: 1587,
      discountAmount: 0,
      monthlyPayment: 149,
      termMonths: 8,
      remainingBalance: 1192,
      isRecommended: false,
      customerNote:
        "Start with $395 down and continue at $149/month for 8 months. Website remains under Hullinger Digital management until paid in full.",
      internalNote:
        "Monthly plan includes added risk/admin margin compared to standard project price.",
    },
  ],

  "lead-generating-website": [
    {
      id: "lead-gen-pay-in-full",
      packageId: "lead-generating-website",
      typeId: "pay-in-full",
      label: "Pay in full with 10% discount",
      amountDueToday: 3555,
      projectTotal: 3555,
      originalPrice: 3950,
      discountAmount: 395,
      monthlyPayment: 0,
      termMonths: 0,
      remainingBalance: 0,
      isRecommended: true,
      customerNote:
        "Pay in full and receive a 10% discount from the standard Lead-Generating Website price.",
      internalNote:
        "Pay-in-full discount rewards faster payment and lowers collection risk.",
    },
    {
      id: "lead-gen-milestone",
      packageId: "lead-generating-website",
      typeId: "milestone",
      label: "$1,500 deposit + two $1,225 milestone payments",
      amountDueToday: 1500,
      projectTotal: 3950,
      discountAmount: 0,
      monthlyPayment: 0,
      termMonths: 0,
      milestonePayments: [
        {
          label: "Midpoint payment",
          amount: 1225,
          dueTrigger:
            "Due at the approved midpoint or before continued production, as defined in the agreement.",
        },
        {
          label: "Final payment",
          amount: 1225,
          dueTrigger:
            "Due before launch, transfer, or final publication.",
        },
      ],
      remainingBalance: 2450,
      isRecommended: false,
      customerNote:
        "Start with $1,500 down. The remaining balance is divided into midpoint and final payments.",
      internalNote:
        "Milestone plan is the standard non-monthly option for Lead-Generating projects.",
    },
    {
      id: "lead-gen-monthly-12",
      packageId: "lead-generating-website",
      typeId: "monthly",
      label: "$995 setup + $349/month for 12 months",
      amountDueToday: 995,
      projectTotal: 5183,
      discountAmount: 0,
      monthlyPayment: 349,
      termMonths: 12,
      remainingBalance: 4188,
      isRecommended: false,
      customerNote:
        "Start with $995 down and continue at $349/month for 12 months. Website remains under Hullinger Digital management until paid in full.",
      internalNote:
        "Monthly plan makes larger lead-gen projects accessible while covering financing/admin risk.",
    },
  ],

  "advanced-website": [
    {
      id: "advanced-pay-in-full",
      packageId: "advanced-website",
      typeId: "pay-in-full",
      label: "Pay in full with 10% discount",
      amountDueToday: 7650,
      projectTotal: 7650,
      originalPrice: 8500,
      discountAmount: 850,
      monthlyPayment: 0,
      termMonths: 0,
      remainingBalance: 0,
      isRecommended: false,
      customerNote:
        "Pay in full and receive a 10% discount from the standard Advanced Website starting price.",
      internalNote:
        "Advanced projects often need custom review before final approval. Pay-in-full should still be review-gated.",
    },
    {
      id: "advanced-milestone",
      packageId: "advanced-website",
      typeId: "milestone",
      label: "$2,500 deposit + approved milestone payments",
      amountDueToday: 2500,
      projectTotal: 8500,
      discountAmount: 0,
      monthlyPayment: 0,
      termMonths: 0,
      remainingBalance: 6000,
      milestonePayments: [
        {
          label: "Planning / design milestone",
          amount: null,
          dueTrigger:
            "Amount and timing are defined after project review based on approved scope.",
        },
        {
          label: "Build milestone",
          amount: null,
          dueTrigger:
            "Amount and timing are defined after project review based on approved scope.",
        },
        {
          label: "Final launch payment",
          amount: null,
          dueTrigger:
            "Final balance is due before launch, transfer, or final publication.",
        },
      ],
      isRecommended: true,
      customerNote:
        "Start with $2,500 down. Remaining payments are divided by approved project milestones before launch.",
      internalNote:
        "This should be the preferred Advanced Website structure because scope can vary widely.",
    },
    {
      id: "advanced-monthly-12",
      packageId: "advanced-website",
      typeId: "monthly",
      label: "$2,000 setup + $699/month for 12 months",
      amountDueToday: 2000,
      projectTotal: 10388,
      discountAmount: 0,
      monthlyPayment: 699,
      termMonths: 12,
      remainingBalance: 8388,
      isRecommended: false,
      customerNote:
        "Start with $2,000 down and continue at $699/month for 12 months. Website remains under Hullinger Digital management until paid in full.",
      internalNote:
        "Use only after review confirms the selected advanced scope can be supported under monthly terms.",
    },
    {
      id: "advanced-monthly-18",
      packageId: "advanced-website",
      typeId: "monthly",
      label: "$1,500 setup + $499/month for 18 months",
      amountDueToday: 1500,
      projectTotal: 10482,
      discountAmount: 0,
      monthlyPayment: 499,
      termMonths: 18,
      remainingBalance: 8982,
      isRecommended: false,
      customerNote:
        "Start with $1,500 down and continue at $499/month for 18 months. Website remains under Hullinger Digital management until paid in full.",
      internalNote:
        "Lower upfront cost but longer term. Use carefully for approved scopes only.",
    },
  ],
};

export const paymentTerms = {
  requiredAgreement:
    "All website projects require an approved agreement before production begins.",
  paymentBeforeWork:
    "A required setup payment, deposit, milestone payment, or pay-in-full payment must be received before work begins.",
  balanceBeforeLaunch:
    "Any remaining project balance must be paid before launch, transfer, final publication, or delivery of final project files unless otherwise stated in the agreement.",
  ownershipTransfer:
    "Website ownership, transfer rights, and final project files are released only after the account is paid in full according to the agreement.",
  monthlyManagement:
    "Websites built under a monthly payment plan remain under Hullinger Digital management until the agreement is paid in full.",
  missedPayments:
    "Missed or failed payments may result in paused work, delayed launch, temporary website suspension, or restricted access until the account is brought current.",
  cancellation:
    "If a client cancels before the payment term is complete, remaining balances, completed work, non-refundable costs, or cancellation terms may apply according to the agreement.",
  thirdPartyFees:
    "Third-party platform fees, domain fees, hosting upgrades, payment processor fees, plugin licenses, API usage, AI usage, SMS fees, and other outside costs are not included unless specifically stated.",
};

export const paymentPlanDisplayRules = {
  showPayInFullFirst: true,
  showRecommendedBadge: true,
  showAmountDueToday: true,
  showEstimatedTotal: true,
  showMonthlyTerm: true,
  requireClientAcknowledgementForMonthly: true,
  monthlyAcknowledgementText:
    "I understand this website remains under Hullinger Digital management until the agreement is paid in full, and missed payments may affect website availability according to the agreement.",
  depositAcknowledgementText:
    "I understand the remaining balance is due before launch, transfer, final publication, or delivery of final files unless otherwise stated in the agreement.",
  advancedReviewAcknowledgementText:
    "I understand Advanced Website projects require review before production begins, and final scope, timeline, and payment structure may be adjusted before approval.",
};

export const defaultPaymentPlanByPackage = {
  "starter-web-page": "starter-pay-in-full",
  "launch-website": "launch-pay-in-full",
  "lead-generating-website": "lead-gen-pay-in-full",
  "advanced-website": "advanced-milestone",
};

export const paymentCalculatorRules = {
  addonPaymentHandling:
    "Selected add-ons should be added to the project total unless the add-on is monthly. Monthly add-ons should be shown separately from one-time project costs.",
  carePlanHandling:
    "Care plans are monthly services and should be shown separately from one-time website build costs.",
  payInFullDiscountHandling:
    "Package pay-in-full discounts apply to the base package price only unless a separate promotion says otherwise.",
  monthlyPlanHandling:
    "Monthly website build plans should use the package-specific monthly plan total and then add selected add-ons according to the approved agreement.",
  reviewBeforeFinalApproval:
    "The builder should show estimated totals before review. Hullinger Digital must review the selected package, add-ons, notes, and scope before production begins.",
};