import {
  FinancialProfile,
  LoanType,
  LOAN_TYPES,
  MortgageCalculation,
  calculateMortgage,
  checkLoanEligibility,
} from "./calculator";
import { StateData } from "./states";


export type StatusLevel = "strong" | "good" | "attention" | "risk";

export interface FactorScore {
  key: string;
  label: string;
  value: string;
  score: number; // 0-100
  status: StatusLevel;
  weight: number;
  explanation: string;
  whyItMatters: string;
}

export interface BudgetTier {
  price: number;
  monthly: number;
  description: string;
}

export interface CashReadiness {
  savings: number;
  downPayment: number;
  closingCosts: number;
  prepaids: number;
  cashToClose: number;
  recommendedReserve: number;
  remainingAfterClosing: number;
  reservesInMonths: number;
  status: StatusLevel;
}

export interface FinancialHealthReport {
  overallScore: number;
  status: StatusLevel;
  statusLabel: string; // Excellent / Good / Fair / Needs attention
  summarySentence: string;
  factors: FactorScore[];
  comfortable: BudgetTier;
  stretch: BudgetTier;
  maximum: BudgetTier;
  cash: CashReadiness;
  monthlyAtComfortable: MortgageCalculation;
  loanType: LoanType;
}

export interface HealthInputs {
  state: StateData;
  profile: FinancialProfile;
  hoaMonthly: number;
  loanTypeId: string;
  overrides?: {
    yearlyIncome?: number;
    monthlyDebt?: number;
    creditScore?: number;
    savings?: number;
    downPaymentPercent?: number;
    rateOverride?: number;
    loanTermYears?: number;
    hoaMonthly?: number;
  };
}

export const STATUS_LABEL: Record<StatusLevel, string> = {
  strong: "Strong",
  good: "Good",
  attention: "Needs attention",
  risk: "High risk",
};

function statusFromScore(score: number): StatusLevel {
  if (score >= 80) return "strong";
  if (score >= 65) return "good";
  if (score >= 45) return "attention";
  return "risk";
}

function overallLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Needs attention";
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function scoreDTI(dti: number, cap: number): number {
  if (!isFinite(dti) || dti <= 0) return 60;
  // Score 100 at 0%, ~85 at 28%, drops to 40 at cap, 0 at cap+15
  if (dti <= 28) return clamp(100 - (dti / 28) * 15);
  if (dti <= cap) return clamp(85 - ((dti - 28) / (cap - 28)) * 45);
  return clamp(40 - ((dti - cap) / 15) * 40);
}

function scoreCredit(score: number): number {
  if (score >= 780) return 100;
  if (score >= 740) return 92;
  if (score >= 720) return 82;
  if (score >= 700) return 72;
  if (score >= 680) return 62;
  if (score >= 660) return 52;
  if (score >= 640) return 42;
  if (score >= 620) return 32;
  if (score >= 580) return 22;
  return 10;
}

export function creditTier(score: number): string {
  if (score >= 780) return "Exceptional";
  if (score >= 740) return "Excellent";
  if (score >= 700) return "Good";
  if (score >= 660) return "Fair";
  if (score >= 620) return "Below average";
  return "Poor";
}

export function nextCreditTierTarget(score: number): number | null {
  const cuts = [620, 660, 680, 700, 720, 740, 760, 780];
  for (const c of cuts) if (score < c) return c;
  return null;
}

function scoreSavingsReadiness(savings: number, cashToClose: number): number {
  if (cashToClose <= 0) return 50;
  const ratio = savings / cashToClose;
  if (ratio >= 1.5) return 100;
  if (ratio >= 1.2) return 85;
  if (ratio >= 1.0) return 70;
  if (ratio >= 0.75) return 50;
  if (ratio >= 0.5) return 30;
  return 15;
}

function scoreReserves(months: number): number {
  if (months >= 12) return 100;
  if (months >= 6) return 90;
  if (months >= 3) return 75;
  if (months >= 1) return 45;
  if (months > 0) return 25;
  return 10;
}

function scoreMonthlyAffordability(housing: number, income: number): number {
  if (income <= 0) return 50;
  const ratio = (housing / (income / 12)) * 100;
  if (ratio <= 25) return 100;
  if (ratio <= 28) return 90;
  if (ratio <= 33) return 75;
  if (ratio <= 38) return 55;
  if (ratio <= 43) return 35;
  return 15;
}

function scoreIncomeStability(profile: FinancialProfile): {
  score: number;
  note: string;
} {
  const emp = profile.employmentType ?? "w2";
  if (emp === "w2") return { score: 90, note: "W-2 employment is typically viewed as stable income." };
  if (emp === "retired")
    return { score: 80, note: "Retirement income is generally acceptable when documented." };
  if (emp === "self-employed")
    return {
      score: 65,
      note: "Self-employment income typically requires 2 years of tax returns to be counted.",
    };
  return { score: 60, note: "Other income types may require additional documentation." };
}

/**
 * Solve for the maximum home price where total housing payment stays at or under
 * a target monthly housing budget, using the same math as calculateMortgage.
 */
function priceForMonthlyBudget(
  targetMonthly: number,
  state: StateData,
  profile: FinancialProfile,
  hoaMonthly: number,
  loanTypeId: string,
  downPaymentPercent: number,
  rateOverride?: number,
): number {
  if (targetMonthly <= 0) return 0;
  let low = 20000;
  let high = 5_000_000;
  for (let i = 0; i < 40 && high - low > 500; i++) {
    const mid = (low + high) / 2;
    const c = calculateMortgage(mid, downPaymentPercent, state, profile, hoaMonthly, loanTypeId, rateOverride);
    if (c.totalMonthlyPayment > targetMonthly) high = mid;
    else low = mid;
  }
  return Math.round(low / 1000) * 1000;
}

export function computeFinancialHealth(inputs: HealthInputs): FinancialHealthReport {
  const loanType = LOAN_TYPES.find((lt) => lt.id === inputs.loanTypeId) || LOAN_TYPES[0];

  const baseProfile: FinancialProfile = {
    ...inputs.profile,
    yearlyIncome: inputs.overrides?.yearlyIncome ?? inputs.profile.yearlyIncome,
    monthlyDebt: inputs.overrides?.monthlyDebt ?? inputs.profile.monthlyDebt,
    creditScore: inputs.overrides?.creditScore ?? inputs.profile.creditScore,
    savings: inputs.overrides?.savings ?? inputs.profile.savings,
  };
  const hoa = inputs.overrides?.hoaMonthly ?? inputs.hoaMonthly;
  const dpPct = inputs.overrides?.downPaymentPercent ?? Math.max(loanType.minDownPayment, 10);
  const rateOverride = inputs.overrides?.rateOverride;

  const grossMonthlyIncome = baseProfile.yearlyIncome / 12;
  const hasIncome = grossMonthlyIncome > 0;

  // Budgets:
  //  - Comfortable = 28% front-end of gross income (perfect, safe number).
  //  - Maximum    = expanded DTI ceiling (theoretical max a lender may approve).
  //  - Stretch    = what the buyer could qualify for if they paid down ~half
  //                 their monthly debt (i.e. "pushed a few things around").
  //                 Calculated at the program back-end DTI cap.
  const comfortableMonthlyBudget = hasIncome ? grossMonthlyIncome * 0.28 : 0;

  // Simulated profile for stretch: half the current monthly debt.
  const stretchProfile: FinancialProfile = {
    ...baseProfile,
    monthlyDebt: Math.max(0, Math.round(baseProfile.monthlyDebt * 0.5)),
  };
  const stretchMonthlyBudget = hasIncome
    ? Math.max(0, grossMonthlyIncome * (loanType.maxDTI / 100) - stretchProfile.monthlyDebt)
    : 0;

  const comfortablePrice = hasIncome
    ? priceForMonthlyBudget(comfortableMonthlyBudget, inputs.state, baseProfile, hoa, loanType.id, dpPct, rateOverride)
    : 0;
  let stretchPrice = hasIncome
    ? priceForMonthlyBudget(stretchMonthlyBudget, inputs.state, stretchProfile, hoa, loanType.id, dpPct, rateOverride)
    : 0;

  // Max approval — expanded DTI ceiling (mirrors calculator's qualification).
  const refCalc = calculateMortgage(
    comfortablePrice > 0 ? comfortablePrice : inputs.state.medianHomePrice,
    dpPct,
    inputs.state,
    baseProfile,
    hoa,
    loanType.id,
    rateOverride,
  );
  let maxPrice = hasIncome ? refCalc.maxAffordablePrice : 0;

  // Enforce ordering: comfortable ≤ stretch ≤ maximum.
  if (hasIncome) {
    if (maxPrice < comfortablePrice) maxPrice = comfortablePrice;
    if (stretchPrice < comfortablePrice) stretchPrice = comfortablePrice;
    if (stretchPrice > maxPrice) stretchPrice = maxPrice;
  }

  // Build calcs only when we have real numbers. When income is missing, return
  // zeroed calcs so the UI shows an empty state rather than fabricated figures.
  const emptyCalc = calculateMortgage(50000, dpPct, inputs.state, baseProfile, hoa, loanType.id, rateOverride);
  const comfortableCalc = hasIncome && comfortablePrice > 0
    ? calculateMortgage(comfortablePrice, dpPct, inputs.state, baseProfile, hoa, loanType.id, rateOverride)
    : emptyCalc;
  const stretchCalc = hasIncome && stretchPrice > 0
    ? calculateMortgage(stretchPrice, dpPct, inputs.state, baseProfile, hoa, loanType.id, rateOverride)
    : emptyCalc;
  const maxCalc = hasIncome && maxPrice > 0
    ? calculateMortgage(maxPrice, dpPct, inputs.state, baseProfile, hoa, loanType.id, rateOverride)
    : emptyCalc;

  // Cash readiness — at comfortable price
  const prepaids = Math.round(comfortableCalc.homePrice * 0.01);
  const cashToClose = comfortableCalc.downPaymentAmount + comfortableCalc.closingCosts + prepaids;
  const recommendedReserve = Math.round(comfortableCalc.totalMonthlyPayment * 3);
  const remainingAfterClosing = Math.round(baseProfile.savings - cashToClose);
  const reservesInMonths =
    comfortableCalc.totalMonthlyPayment > 0
      ? Math.max(0, remainingAfterClosing) / comfortableCalc.totalMonthlyPayment
      : 0;
  const cashStatus: StatusLevel =
    remainingAfterClosing >= recommendedReserve
      ? "strong"
      : remainingAfterClosing >= recommendedReserve * 0.5
        ? "good"
        : remainingAfterClosing >= 0
          ? "attention"
          : "risk";

  // Factor scores
  const dtiScoreVal = scoreDTI(comfortableCalc.backEndDTI, loanType.maxDTI);
  const creditScoreVal = scoreCredit(baseProfile.creditScore);
  const savingsScoreVal = scoreSavingsReadiness(baseProfile.savings, cashToClose);
  const reservesScoreVal = scoreReserves(reservesInMonths);
  const monthlyScoreVal = scoreMonthlyAffordability(
    comfortableCalc.totalMonthlyPayment,
    baseProfile.yearlyIncome,
  );
  const income = scoreIncomeStability(baseProfile);

  const factors: FactorScore[] = [
    {
      key: "income",
      label: "Income stability",
      value: baseProfile.employmentType ? baseProfile.employmentType.toUpperCase() : "W-2",
      score: income.score,
      status: statusFromScore(income.score),
      weight: 10,
      explanation: income.note,
      whyItMatters: "Lenders weight stable, documented income most heavily when qualifying you for a loan.",
    },
    {
      key: "dti",
      label: "Debt-to-income",
      value: `${comfortableCalc.backEndDTI.toFixed(1)}%`,
      score: dtiScoreVal,
      status: statusFromScore(dtiScoreVal),
      weight: 25,
      explanation: `Program target is ≤ ${loanType.maxDTI}% back-end; expanded up to ${loanType.expandedBackEndDTI}%.`,
      whyItMatters: "DTI is the single largest factor in how much a lender may let you borrow.",
    },
    {
      key: "credit",
      label: "Credit health",
      value: `${baseProfile.creditScore} · ${creditTier(baseProfile.creditScore)}`,
      score: creditScoreVal,
      status: statusFromScore(creditScoreVal),
      weight: 20,
      explanation: "Higher credit tiers typically qualify for lower rates and better loan pricing.",
      whyItMatters: "Rate pricing can change materially at 620, 660, 700, 720, and 740.",
    },
    {
      key: "savings",
      label: "Savings readiness",
      value: `${Math.round((baseProfile.savings / Math.max(cashToClose, 1)) * 100)}% of cash to close`,
      score: savingsScoreVal,
      status: statusFromScore(savingsScoreVal),
      weight: 20,
      explanation: "Compares your savings to the estimated cash needed at closing.",
      whyItMatters: "You need enough to cover down payment, closing costs, and prepaids on closing day.",
    },
    {
      key: "monthly",
      label: "Monthly affordability",
      value: `${Math.round((comfortableCalc.totalMonthlyPayment / Math.max(grossMonthlyIncome, 1)) * 100)}% of income`,
      score: monthlyScoreVal,
      status: statusFromScore(monthlyScoreVal),
      weight: 15,
      explanation: "Estimated total housing payment as a share of your gross monthly income.",
      whyItMatters: "Keeping housing at or below ~28% of gross income leaves room for savings and life.",
    },
    {
      key: "reserves",
      label: "Cash reserves after closing",
      value: `${reservesInMonths.toFixed(1)} mo PITI`,
      score: reservesScoreVal,
      status: statusFromScore(reservesScoreVal),
      weight: 10,
      explanation: "Estimated months of housing payment you'd have left in savings after closing.",
      whyItMatters: "Reserves help absorb repairs, income disruptions, and unexpected expenses.",
    },
  ];

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const overallScore = Math.round(
    factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight,
  );
  const status = statusFromScore(overallScore);
  const statusLabel = overallLabel(overallScore);

  const positives: string[] = [];
  const concerns: string[] = [];
  for (const f of factors) {
    if (f.status === "strong" || f.status === "good") positives.push(f.label);
    else concerns.push(f.label);
  }
  const summarySentence =
    concerns.length === 0
      ? "Based on the information provided, you appear well positioned to purchase a home in your target range."
      : `Based on the information provided, ${positives.slice(0, 2).join(" and ").toLowerCase() || "your profile"} look solid — improving ${concerns[0].toLowerCase()} would strengthen your buying position.`;

  return {
    overallScore,
    status,
    statusLabel,
    summarySentence,
    factors,
    comfortable: {
      price: hasIncome ? comfortablePrice : 0,
      monthly: hasIncome ? comfortableCalc.totalMonthlyPayment : 0,
      description: hasIncome
        ? "Your ideal number — fits within ~28% of your gross income and preserves reserves for savings and life."
        : "Add your yearly income to see this tier.",
    },
    stretch: {
      price: hasIncome ? stretchPrice : 0,
      monthly: hasIncome ? stretchCalc.totalMonthlyPayment : 0,
      description: hasIncome
        ? "What you could qualify for if you paid down some monthly debts or made small adjustments to your profile."
        : "Add your yearly income to see this tier.",
    },
    maximum: {
      price: hasIncome ? maxPrice : 0,
      monthly: hasIncome ? maxCalc.totalMonthlyPayment : 0,
      description: hasIncome
        ? "The theoretical maximum a lender may approve at expanded DTI limits — not a recommended target."
        : "Add your yearly income to see this tier.",
    },
    cash: {
      savings: baseProfile.savings,
      downPayment: Math.round(comfortableCalc.downPaymentAmount),
      closingCosts: Math.round(comfortableCalc.closingCosts),
      prepaids,
      cashToClose: Math.round(cashToClose),
      recommendedReserve,
      remainingAfterClosing,
      reservesInMonths,
      status: cashStatus,
    },
    monthlyAtComfortable: comfortableCalc,
    loanType,
  };
}

/**
 * SINGLE SOURCE OF TRUTH for the "do I qualify?" verdict shown across
 * Financial Health, Affordability Results, and the Dashboard.
 *
 * A user "qualifies" only when BOTH agree:
 *   1. Loan-program eligibility passes (credit / DTI / down payment for the
 *      selected loan type at the comfortable price), AND
 *   2. Financial Health composite status is "strong" or "good".
 *
 * Otherwise we surface "Needs work" with the first blocking reason so the
 * different screens can never contradict each other.
 */
export interface UnifiedQualification {
  qualifies: boolean;
  label: "Qualifies" | "Needs work";
  status: StatusLevel;
  reason: string;
}

export function computeUnifiedQualification(
  report: FinancialHealthReport,
  profile: FinancialProfile,
  downPaymentPercent: number,
): UnifiedQualification {
  const el = checkLoanEligibility(
    report.loanType,
    profile,
    Math.max(report.loanType.minDownPayment, downPaymentPercent),
    report.comfortable.price || report.monthlyAtComfortable.homePrice,
  );
  const fhOk = report.status === "strong" || report.status === "good";
  const qualifies = el.eligible && fhOk;
  let reason = "You appear eligible for this loan type and your financial health supports it.";
  if (!el.eligible) reason = el.reason;
  else if (!fhOk) {
    const weakest = [...report.factors].sort((a, b) => a.score - b.score)[0];
    reason = weakest
      ? `Financial health needs attention — start with ${weakest.label.toLowerCase()}.`
      : "Financial health needs attention.";
  }
  return {
    qualifies,
    label: qualifies ? "Qualifies" : "Needs work",
    status: report.status,
    reason,
  };
}

