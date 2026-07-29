import type { PhaseDef, TaskDef, EmploymentType } from "./types";

export const PHASES: PhaseDef[] = [
  {
    id: "financial",
    name: "Financial Preparation",
    shortName: "Financial Prep",
    description: "Get your money and credit ready before you shop for a mortgage.",
  },
  {
    id: "documents",
    name: "Prepare Your Documents",
    shortName: "Documents",
    description: "Gather the paperwork lenders will ask for.",
  },
  {
    id: "mortgage",
    name: "Mortgage Preparation",
    shortName: "Pre-Approval",
    description: "Compare loan options and get pre-approved.",
  },
  {
    id: "search",
    name: "Plan Your Home Search",
    shortName: "Home Search",
    description: "Refine your criteria and start reviewing homes.",
  },
  {
    id: "offer",
    name: "Offer & Due Diligence",
    shortName: "Offer",
    description: "Make an offer and complete inspection, appraisal, and insurance.",
  },
  {
    id: "closing",
    name: "Closing",
    shortName: "Closing",
    description: "Final review, funding, and keys.",
  },
];

const w2Doc = (ctx: { employment: EmploymentType | null }) =>
  !ctx.employment || ["w2", "multiple", "other", "retired"].includes(ctx.employment);
const selfEmpDoc = (ctx: { employment: EmploymentType | null }) =>
  !ctx.employment || ["self_employed", "1099", "multiple", "other"].includes(ctx.employment);

export const TASKS: TaskDef[] = [
  // Financial
  {
    id: "credit_score",
    phase: "financial",
    title: "Check your credit score",
    summary: "Lenders use your credit profile to help determine eligibility and rates.",
    why: "Higher scores generally unlock better rates and more loan options. Estimated ranges vary by lender and loan type.",
    effort: "10 min",
    category: "auto",
    autoSource: "Detected from your financial profile",
    cta: { label: "Add credit info", tab: "affordability" },
  },
  {
    id: "reduce_debt",
    phase: "financial",
    title: "Review and reduce high-interest debt",
    summary: "Lowering monthly debt often improves the loan amount you may qualify for.",
    effort: "Ongoing",
    category: "manual",
  },
  {
    id: "emergency_reserve",
    phase: "financial",
    title: "Build an emergency reserve",
    summary: "A cash cushion protects you after closing when unexpected costs come up.",
    effort: "Ongoing",
    category: "manual",
    cta: { label: "Open Savings Planner", tab: "savings" },
  },
  {
    id: "down_payment_goal",
    phase: "financial",
    title: "Set a down-payment goal",
    summary: "Pick a target amount so you can plan how much to save each month.",
    category: "auto",
    autoSource: "Detected from your Savings Planner goal",
    cta: { label: "Set goal in Savings Planner", tab: "savings" },
  },
  {
    id: "monthly_budget",
    phase: "financial",
    title: "Complete a monthly budget",
    summary: "Know your income and expenses so we can project a realistic timeline.",
    category: "auto",
    autoSource: "Detected from your Savings Planner budget",
    cta: { label: "Update budget", tab: "savings" },
  },
  {
    id: "closing_costs_budget",
    phase: "financial",
    title: "Estimate closing costs",
    summary: "Plan for lender fees, title services, prepaids, and other transaction costs.",
    why: "Closing costs vary widely by property, location, lender, and loan type.",
    category: "manual",
    cta: { label: "See in Savings Planner", tab: "savings" },
  },
  {
    id: "affordability_estimate",
    phase: "financial",
    title: "Complete an affordability estimate",
    summary: "See a monthly payment range and a target home price you can plan around.",
    category: "auto",
    autoSource: "Detected from your saved estimate",
    cta: { label: "Open affordability calculator", to: "/homebuying-estimate/financial-health" },
  },

  // Documents - shared
  {
    id: "doc_id",
    phase: "documents",
    title: "Government-issued ID",
    summary: "A valid photo ID (driver's license, passport, or state ID).",
    category: "document",
  },
  {
    id: "doc_bank",
    phase: "documents",
    title: "Recent bank statements",
    summary: "Typically the most recent 2–3 months for every account.",
    category: "document",
  },
  {
    id: "doc_assets",
    phase: "documents",
    title: "Asset statements",
    summary: "Retirement, brokerage, or other accounts that hold funds toward your purchase.",
    category: "document",
  },
  // Documents - W-2 lane
  {
    id: "doc_paystubs",
    phase: "documents",
    title: "Recent pay stubs",
    summary: "Typically the most recent 30 days from each employer.",
    category: "document",
    appliesTo: w2Doc,
  },
  {
    id: "doc_w2",
    phase: "documents",
    title: "Recent W-2s",
    summary: "Usually the last 2 years.",
    category: "document",
    appliesTo: w2Doc,
  },
  // Documents - self-employed lane
  {
    id: "doc_personal_tax",
    phase: "documents",
    title: "Personal tax returns",
    summary: "Usually the last 2 years, all schedules.",
    category: "document",
    appliesTo: selfEmpDoc,
  },
  {
    id: "doc_business_tax",
    phase: "documents",
    title: "Business tax returns",
    summary: "Applies if you own 25% or more of a business.",
    category: "document",
    appliesTo: selfEmpDoc,
  },
  {
    id: "doc_pl",
    phase: "documents",
    title: "Profit-and-loss statement",
    summary: "Year-to-date, ideally CPA-prepared.",
    category: "document",
    appliesTo: selfEmpDoc,
  },
  {
    id: "doc_1099",
    phase: "documents",
    title: "1099 forms",
    summary: "For any contract or freelance income.",
    category: "document",
    appliesTo: selfEmpDoc,
  },
  {
    id: "doc_gift",
    phase: "documents",
    title: "Gift-fund documentation",
    summary: "Only if any of your down payment or closing costs come from a gift.",
    category: "document",
  },

  // Mortgage
  {
    id: "explore_loans",
    phase: "mortgage",
    title: "Explore loan programs",
    summary: "Compare Conventional, FHA, VA, and USDA to see what may fit.",
    category: "manual",
    cta: { label: "See programs", to: "/buyers/programs" },
  },
  {
    id: "compare_lenders",
    phase: "mortgage",
    title: "Compare lenders",
    summary: "Getting quotes from a few lenders often surfaces meaningfully different terms.",
    category: "manual",
  },
  {
    id: "estimate_payment",
    phase: "mortgage",
    title: "Estimate mortgage payments",
    summary: "Model principal, interest, taxes, insurance, and any PMI.",
    category: "manual",
    cta: { label: "Open affordability calculator", to: "/homebuying-estimate/financial-health" },
  },
  {
    id: "preapproved",
    phase: "mortgage",
    title: "Get pre-approved",
    summary: "A pre-approval helps you understand a potential loan amount. It is not a final approval.",
    category: "manual",
  },
  {
    id: "preapproval_review",
    phase: "mortgage",
    title: "Review pre-approval terms",
    summary: "Check rate type, loan amount, expiration date, and any conditions.",
    category: "manual",
  },

  // Search
  {
    id: "locations",
    phase: "search",
    title: "Choose preferred locations",
    summary: "Set the states and cities you want to focus on.",
    category: "auto",
    autoSource: "Detected from your buyer preferences",
    cta: { label: "Update preferences", to: "/dashboard/client/preferences" },
  },
  {
    id: "must_haves",
    phase: "search",
    title: "Define must-haves and nice-to-haves",
    summary: "Bedrooms, property type, and features that matter most.",
    category: "auto",
    autoSource: "Detected from your buyer preferences",
    cta: { label: "Update preferences", to: "/dashboard/client/preferences" },
  },
  {
    id: "review_homes",
    phase: "search",
    title: "Review homes within budget",
    summary: "Browse listings that fit your target price range.",
    category: "manual",
    cta: { label: "Search properties", to: "/properties/search" },
  },
  {
    id: "save_properties",
    phase: "search",
    title: "Save properties you like",
    summary: "Track favorites so you can compare and revisit.",
    category: "manual",
    cta: { label: "Search properties", to: "/properties/search" },
  },

  // Offer
  {
    id: "submit_offer",
    phase: "offer",
    title: "Submit an offer",
    summary: "Price, contingencies, and timing on a specific home.",
    category: "manual",
  },
  {
    id: "cash_to_close",
    phase: "offer",
    title: "Review estimated cash needed",
    summary: "Down payment + closing costs + prepaids + earnest money.",
    category: "manual",
    cta: { label: "See in Savings Planner", tab: "savings" },
  },
  {
    id: "inspection",
    phase: "offer",
    title: "Schedule inspection",
    summary: "An inspection helps surface property issues before you commit.",
    category: "manual",
  },
  {
    id: "appraisal",
    phase: "offer",
    title: "Review appraisal",
    summary: "The lender's appraisal may impact your loan and negotiation.",
    category: "manual",
  },
  {
    id: "insurance",
    phase: "offer",
    title: "Secure homeowners insurance",
    summary: "Required before closing on most mortgages.",
    category: "manual",
  },
  {
    id: "final_conditions",
    phase: "offer",
    title: "Complete final lender conditions",
    summary: "Send any last documents or clarifications the underwriter requests.",
    category: "manual",
  },

  // Closing
  {
    id: "closing_disclosure",
    phase: "closing",
    title: "Review the closing disclosure",
    summary: "Compare final costs to your loan estimate at least 3 days before closing.",
    category: "manual",
  },
  {
    id: "funds_to_close",
    phase: "closing",
    title: "Confirm funds to close",
    summary: "Wire instructions and certified funds should be verified directly with your closer.",
    category: "manual",
  },
  {
    id: "walkthrough",
    phase: "closing",
    title: "Complete the final walkthrough",
    summary: "Confirm the property's condition just before signing.",
    category: "manual",
  },
  {
    id: "sign_closing",
    phase: "closing",
    title: "Sign closing documents",
    summary: "Bring ID and any required funds to the signing appointment.",
    category: "manual",
  },
  {
    id: "keys",
    phase: "closing",
    title: "Receive keys",
    summary: "Congratulations — you're a homeowner.",
    category: "manual",
  },
];

/** Migration map from the old localStorage checklist ids. */
export const LEGACY_ID_MAP: Record<string, string> = {
  credit: "credit_score",
  debts: "reduce_debt",
  savings: "emergency_reserve",
  downpayment: "down_payment_goal",
  closing: "closing_costs_budget",
  "pay-stubs": "doc_paystubs",
  w2s: "doc_w2",
  "tax-returns": "doc_personal_tax",
  "bank-statements": "doc_bank",
  id: "doc_id",
  preapproval: "preapproved",
  
  wants: "must_haves",
  neighborhoods: "locations",
  inspection: "inspection",
};
