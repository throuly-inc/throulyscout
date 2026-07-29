import { StateData } from "./states";

export type PropertyType = "single-family" | "condo-coop" | "multi-family";

export interface PropertyTypeInfo {
  id: PropertyType;
  name: string;
  tooltip: string;
}

export const PROPERTY_TYPES: PropertyTypeInfo[] = [
  {
    id: "single-family",
    name: "Single-family",
    tooltip:
      "A house that stands alone on its own land, just for one family to live in. It has its own yard and you don't share walls with neighbors.",
  },
  {
    id: "condo-coop",
    name: "Condo / Co-op",
    tooltip:
      "An apartment that you own instead of rent. You share the building with other families, and everyone pays fees to take care of common areas like hallways and pools.",
  },
  {
    id: "multi-family",
    name: "Multi-family",
    tooltip:
      "A building with 2-4 separate homes inside it. You can live in one part and rent out the other parts to other families, which helps you pay your mortgage!",
  },
];

export interface FinancialProfile {
  yearlyIncome: number;
  monthlyDebt: number;
  savings: number;
  creditScore: number;
  employmentType?: "w2" | "self-employed" | "retired" | "other";
  isFirstTimeBuyer?: boolean;
  propertyType?: PropertyType;
  expectedRentalIncome?: number;
  rentalIncomePercentage?: number;
  totalSavings?: number;
  savingsContributionPct?: number;
}

export interface LoanType {
  id: "conventional" | "fha" | "va" | "usda";
  name: string;
  description: string;
  features: string[];
  minDownPayment: number;
  minCreditScore: number;
  maxFrontEndDTI: number;
  maxDTI: number;
  expandedFrontEndDTI: number;
  expandedBackEndDTI: number;
  requiresPMI: boolean;
  pmiRate: number;
  rateAdjustment: number;
  eligibilityReason?: string;
  occupancyType: "any" | "primary-only";
  governmentBacked: boolean;
}

// State-specific home insurance rates as a percentage of home value
export const STATE_INSURANCE_RATES: Record<string, number> = {
  AL: 0.0038,
  AK: 0.0045,
  AZ: 0.003,
  AR: 0.004,
  CA: 0.003,
  CO: 0.0045,
  CT: 0.0035,
  DE: 0.0033,
  FL: 0.0065,
  GA: 0.0037,
  HI: 0.0025,
  ID: 0.0035,
  IL: 0.0038,
  IN: 0.0036,
  IA: 0.004,
  KS: 0.0048,
  KY: 0.0042,
  LA: 0.006,
  ME: 0.0033,
  MD: 0.0033,
  MA: 0.0035,
  MI: 0.0038,
  MN: 0.0035,
  MS: 0.005,
  MO: 0.0045,
  MT: 0.004,
  NE: 0.0045,
  NV: 0.003,
  NH: 0.0033,
  NJ: 0.0035,
  NM: 0.0038,
  NY: 0.0035,
  NC: 0.0035,
  ND: 0.004,
  OH: 0.0035,
  OK: 0.0055,
  OR: 0.0033,
  PA: 0.0033,
  RI: 0.0038,
  SC: 0.0042,
  SD: 0.004,
  TN: 0.0038,
  TX: 0.005,
  UT: 0.003,
  VT: 0.0035,
  VA: 0.0033,
  WA: 0.003,
  WV: 0.004,
  WI: 0.0035,
  WY: 0.0035,
};

const DEFAULT_INSURANCE_RATE = 0.0035;

export function getStateInsuranceRate(stateAbbreviation: string): number {
  return STATE_INSURANCE_RATES[stateAbbreviation] ?? DEFAULT_INSURANCE_RATE;
}

export const LOAN_TYPES: LoanType[] = [
  {
    id: "conventional",
    name: "Conventional",
    description: "Traditional mortgage with flexible terms for any occupancy type",
    features: [
      "Borrower criteria varies by lender and loan type",
      "Can have a fixed or adjustable interest rate",
      "Lenders may require minimum 580 credit score",
      "Down payment requirements vary",
      "Used for any occupancy type",
    ],
    minDownPayment: 3,
    minCreditScore: 580,
    maxFrontEndDTI: 28,
    maxDTI: 36,
    expandedFrontEndDTI: 45,
    expandedBackEndDTI: 45,
    requiresPMI: true,
    pmiRate: 0.008, // 0.8% default PMI rate
    rateAdjustment: 0,
    occupancyType: "any",
    governmentBacked: false,
  },
  {
    id: "fha",
    name: "FHA",
    description: "Government-backed loan with low down payment for primary residences",
    features: [
      "Backed by the government",
      "Can have a fixed or adjustable interest rate",
      "Minimum 580 credit score for 3.5% down, 500-579 requires 10% down",
      "Available with a down payment as low as 3.5%",
      "Used for primary residence",
    ],
    minDownPayment: 3.5,
    minCreditScore: 500,
    maxFrontEndDTI: 31,
    maxDTI: 43,
    expandedFrontEndDTI: 46.99,
    expandedBackEndDTI: 56.99,
    requiresPMI: true,
    pmiRate: 0.0085, // FHA annual MIP rate
    rateAdjustment: 0.125,
    occupancyType: "primary-only",
    governmentBacked: true,
  },
  {
    id: "va",
    name: "VA",
    description: "For veterans, military members, and surviving spouses with no down payment",
    features: [
      "For Veterans, Military and surviving spouses",
      "Backed by the government",
      "Can have a fixed or adjustable interest rate",
      "Lenders may require minimum 580 credit score",
      "No down payment with full entitlement",
      "Used for primary residence",
    ],
    minDownPayment: 0,
    minCreditScore: 580,
    maxFrontEndDTI: 31,
    maxDTI: 41,
    expandedFrontEndDTI: 50,
    expandedBackEndDTI: 60,
    requiresPMI: false,
    pmiRate: 0,
    rateAdjustment: -0.25,
    occupancyType: "primary-only",
    governmentBacked: true,
  },
  {
    id: "usda",
    name: "USDA",
    description: "For buyers in eligible rural areas who meet income requirements",
    features: [
      "Available to buyers that meet specific income and location criteria",
      "Backed by the government",
      "Most are fixed-rate",
      "Requires additional fees",
      "Used for primary residence",
    ],
    minDownPayment: 0,
    minCreditScore: 640,
    maxFrontEndDTI: 29,
    maxDTI: 41,
    expandedFrontEndDTI: 32,
    expandedBackEndDTI: 44,
    requiresPMI: true,
    pmiRate: 0.0035,
    rateAdjustment: -0.125,
    occupancyType: "primary-only",
    governmentBacked: true,
  },
];

export interface RateConfidenceBand {
  low: number;
  mid: number;
  high: number;
}

export interface MortgageCalculation {
  homePrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  upfrontMIP: number;
  monthlyMortgage: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyPMI: number;
  monthlyHOA: number;
  totalMonthlyPayment: number;
  closingCosts: number;
  totalCashNeeded: number;
  qualifies: boolean;
  /** DTI + credit + down-payment-minimum qualification, independent of savings. */
  qualifiesLoan: boolean;
  /** True when savings cover the full cash-to-close. */
  hasSufficientCash: boolean;
  /** How much more cash is needed to close (0 when sufficient). */
  cashShortfall: number;
  frontEndDTI: number;
  backEndDTI: number;
  maxAffordablePrice: number;
  minIncomeRequired: number;
  minSavingsRequired: number;
  rateRange: RateConfidenceBand;
  loanType: LoanType;
}

export interface ProgramEligibility {
  programId: string;
  eligible: boolean;
  reason: string;
}

export const DOWN_PAYMENT_OPTIONS = [0, 3, 3.5, 5, 10, 20];

export const CREDIT_SCORE_RANGES = [
  { label: "Excellent (740+)", min: 740, max: 850 },
  { label: "Good (700-739)", min: 700, max: 739 },
  { label: "Fair (660-699)", min: 660, max: 699 },
  { label: "Below Average (620-659)", min: 620, max: 659 },
  { label: "Poor (580-619)", min: 580, max: 619 },
];

export function getRateConfidenceBand(baseRate: number, loanType: LoanType): RateConfidenceBand {
  const adjustedRate = baseRate + loanType.rateAdjustment;
  return {
    low: Math.round((adjustedRate - 0.375) * 1000) / 1000,
    mid: Math.round(adjustedRate * 1000) / 1000,
    high: Math.round((adjustedRate + 0.375) * 1000) / 1000,
  };
}

export function checkLoanEligibility(
  loanType: LoanType,
  financialProfile: FinancialProfile,
  downPaymentPercent: number,
  homePrice: number,
): ProgramEligibility {
  const reasons: string[] = [];

  // FHA special: 500-579 credit requires 10% down
  if (loanType.id === "fha") {
    if (financialProfile.creditScore < 500) {
      reasons.push("Requires minimum 500 credit score");
    } else if (financialProfile.creditScore < 580 && downPaymentPercent < 10) {
      reasons.push("Credit score 500-579 requires 10% down payment");
    }
  } else {
    if (downPaymentPercent < loanType.minDownPayment) {
      reasons.push(`Requires ${loanType.minDownPayment}% down payment minimum`);
    }
    if (financialProfile.creditScore < loanType.minCreditScore) {
      reasons.push(`Requires ${loanType.minCreditScore}+ credit score`);
    }
  }

  if (loanType.id === "va") {
    reasons.push("Requires military service verification");
  }

  if (loanType.id === "usda") {
    reasons.push("Requires eligible rural location and income limits");
  }

  return {
    programId: loanType.id,
    eligible: reasons.length === 0,
    reason: reasons.length > 0 ? reasons.join("; ") : "You appear eligible for this loan type",
  };
}

export function calculateRentalIncomeOffset(financialProfile: FinancialProfile): number {
  if (financialProfile.propertyType !== "multi-family" || !financialProfile.expectedRentalIncome) {
    return 0;
  }
  const percentage = financialProfile.rentalIncomePercentage ?? 75;
  return financialProfile.expectedRentalIncome * (percentage / 100);
}

export function calculateMinimumIncomeRequired(
  totalMonthlyPayment: number,
  monthlyDebt: number,
  rentalIncomeOffset: number = 0,
  maxFrontEndDTI: number = 28,
  maxBackEndDTI: number = 43,
): { minIncome: number; constraint: "front-end" | "back-end" } {
  const netHousingCost = Math.max(0, totalMonthlyPayment - rentalIncomeOffset);
  const minIncomeFromFrontEnd = (netHousingCost / (maxFrontEndDTI / 100)) * 12;
  const totalDebtPayments = netHousingCost + monthlyDebt;
  const minIncomeFromBackEnd = (totalDebtPayments / (maxBackEndDTI / 100)) * 12;

  if (minIncomeFromFrontEnd >= minIncomeFromBackEnd) {
    return { minIncome: Math.round(minIncomeFromFrontEnd), constraint: "front-end" };
  }
  return { minIncome: Math.round(minIncomeFromBackEnd), constraint: "back-end" };
}

/**
 * Calculate all mortgage-related numbers with loan type support
 */
export function calculateMortgage(
  homePrice: number,
  downPaymentPercent: number,
  stateData: StateData,
  financialProfile: FinancialProfile,
  hoaMonthly: number = 0,
  loanTypeId: string = "conventional",
  rateOverride?: number,
): MortgageCalculation {
  const loanType = LOAN_TYPES.find((lt) => lt.id === loanTypeId) || LOAN_TYPES[0];
  const loanTermYears = 30;

  const downPaymentAmount = homePrice * (downPaymentPercent / 100);
  const baseLoanAmount = homePrice - downPaymentAmount;

  // FHA upfront MIP (1.75%) is financed into the loan
  const upfrontMIP = loanType.id === "fha" ? baseLoanAmount * 0.0175 : 0;
  const loanAmount = baseLoanAmount + upfrontMIP;

  // Get rate range
  const rateRange = getRateConfidenceBand(stateData.avgMortgageRate, loanType);
  const effectiveRate = rateOverride ?? rateRange.mid;

  // Monthly mortgage payment (Principal & Interest) on full loan amount (including financed upfront MIP)
  const monthlyRate = effectiveRate / 100 / 12;
  const numPayments = loanTermYears * 12;
  const monthlyMortgage =
    loanAmount > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;

  // Property tax
  const monthlyPropertyTax = (homePrice * (stateData.avgPropertyTax / 100)) / 12;

  // Home insurance — percentage of home value, state-specific
  const insuranceRate = getStateInsuranceRate(stateData.abbreviation);
  const monthlyInsurance = (homePrice * insuranceRate) / 12;

  // PMI/MIP based on loan type
  let monthlyPMI = 0;
  if (loanType.id === "fha") {
    // FHA annual MIP: 0.85% of base loan amount / 12
    // Required for life of loan if down < 10%, or 11 years if >= 10%
    monthlyPMI = (baseLoanAmount * 0.0085) / 12;
  } else if (loanType.requiresPMI && downPaymentPercent < 20) {
    // Conventional PMI: 0.8% of loan amount / 12
    monthlyPMI = (baseLoanAmount * loanType.pmiRate) / 12;
  }

  // Total monthly housing payment
  const totalMonthlyPayment = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaMonthly;

  // Calculate rental income offset for multi-family
  const rentalIncomeOffset = calculateRentalIncomeOffset(financialProfile);

  // Closing costs
  const closingCosts = homePrice * (stateData.avgClosingCost / 100);

  // Total cash needed
  const totalCashNeeded = downPaymentAmount + closingCosts;

  // DTI calculations (adjusted for rental income)
  const grossMonthlyIncome = financialProfile.yearlyIncome / 12;
  const netHousingCost = Math.max(0, totalMonthlyPayment - rentalIncomeOffset);

  // Front-End DTI = housing / gross monthly income
  const frontEndDTI = grossMonthlyIncome > 0 ? (netHousingCost / grossMonthlyIncome) * 100 : 0;
  // Back-End DTI = (housing + debt) / gross monthly income
  const backEndDTI =
    grossMonthlyIncome > 0 ? ((netHousingCost + financialProfile.monthlyDebt) / grossMonthlyIncome) * 100 : 0;

  // Loan qualification (DTI + credit + minimum down) — independent of savings.
  // This mirrors the ceiling used by `maxAffordablePrice`, so a price at or
  // below the max never flips to "Not Qualified" purely because savings are
  // short. Savings sufficiency is surfaced separately as `hasSufficientCash`.
  const qualifiesLoan =
    backEndDTI <= loanType.expandedBackEndDTI &&
    frontEndDTI <= loanType.expandedFrontEndDTI &&
    financialProfile.creditScore >= loanType.minCreditScore &&
    downPaymentPercent >= loanType.minDownPayment;

  const hasSufficientCash = financialProfile.savings >= totalCashNeeded;
  const cashShortfall = Math.max(0, Math.round(totalCashNeeded - financialProfile.savings));

  // Overall qualification requires both loan qualification and cash on hand.
  const qualifies = qualifiesLoan && hasSufficientCash;

  // Calculate minimum income required using the same expanded DTI thresholds as the qualifies check,
  // so this figure never contradicts the qualification result.
  const { minIncome: minIncomeRequired } = calculateMinimumIncomeRequired(
    totalMonthlyPayment,
    financialProfile.monthlyDebt,
    rentalIncomeOffset,
    loanType.expandedFrontEndDTI,
    loanType.expandedBackEndDTI,
  );
  const minSavingsRequired = totalCashNeeded;

  // Max affordable price — capped by whichever expanded DTI limit (front-end or
  // back-end, accounting for existing debt) binds first, mirroring the same
  // expanded thresholds used by the qualifies check and minIncomeRequired.
  const maxMonthlyHousingFromFrontEnd = grossMonthlyIncome * (loanType.expandedFrontEndDTI / 100) + rentalIncomeOffset;
  const maxMonthlyHousingFromBackEnd =
    grossMonthlyIncome * (loanType.expandedBackEndDTI / 100) - financialProfile.monthlyDebt + rentalIncomeOffset;
  const maxMonthlyHousing = Math.max(0, Math.min(maxMonthlyHousingFromFrontEnd, maxMonthlyHousingFromBackEnd));
  const maxAffordablePrice = calculateMaxPrice(
    maxMonthlyHousing,
    stateData,
    downPaymentPercent,
    hoaMonthly,
    loanTermYears,
    loanType,
    rateOverride,
  );

  return {
    homePrice,
    downPaymentPercent,
    downPaymentAmount,
    loanAmount: baseLoanAmount,
    upfrontMIP,
    monthlyMortgage: Math.round(monthlyMortgage),
    monthlyPropertyTax: Math.round(monthlyPropertyTax),
    monthlyInsurance: Math.round(monthlyInsurance),
    monthlyPMI: Math.round(monthlyPMI),
    monthlyHOA: hoaMonthly,
    totalMonthlyPayment: Math.round(totalMonthlyPayment),
    closingCosts: Math.round(closingCosts),
    totalCashNeeded: Math.round(totalCashNeeded),
    qualifies,
    qualifiesLoan,
    hasSufficientCash,
    cashShortfall,
    frontEndDTI: Math.round(frontEndDTI * 10) / 10,
    backEndDTI: Math.round(backEndDTI * 10) / 10,
    maxAffordablePrice,
    minIncomeRequired,
    minSavingsRequired: Math.round(minSavingsRequired),
    rateRange,
    loanType,
  };
}

function calculateMaxPrice(
  maxMonthlyPayment: number,
  stateData: StateData,
  downPaymentPercent: number,
  hoaMonthly: number,
  loanTermYears: number,
  loanType: LoanType,
  rateOverride?: number,
): number {
  let low = 50000;
  let high = 3000000;

  while (high - low > 1000) {
    const mid = (low + high) / 2;
    const monthlyPayment = calculateMonthlyForPrice(
      mid,
      stateData,
      downPaymentPercent,
      hoaMonthly,
      loanTermYears,
      loanType,
      rateOverride,
    );

    if (monthlyPayment <= maxMonthlyPayment) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round(low);
}

function calculateMonthlyForPrice(
  homePrice: number,
  stateData: StateData,
  downPaymentPercent: number,
  hoaMonthly: number,
  loanTermYears: number,
  loanType: LoanType,
  rateOverride?: number,
): number {
  const downPaymentAmount = homePrice * (downPaymentPercent / 100);
  const baseLoanAmount = homePrice - downPaymentAmount;

  // FHA upfront MIP financed into loan
  const upfrontMIP = loanType.id === "fha" ? baseLoanAmount * 0.0175 : 0;
  const loanAmount = baseLoanAmount + upfrontMIP;

  const rateRange = getRateConfidenceBand(stateData.avgMortgageRate, loanType);
  const rate = rateOverride ?? rateRange.mid;
  const monthlyRate = rate / 100 / 12;
  const numPayments = loanTermYears * 12;
  const monthlyMortgage =
    loanAmount > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;

  const monthlyPropertyTax = (homePrice * (stateData.avgPropertyTax / 100)) / 12;
  const insuranceRate = getStateInsuranceRate(stateData.abbreviation);
  const monthlyInsurance = (homePrice * insuranceRate) / 12;

  let monthlyPMI = 0;
  if (loanType.id === "fha") {
    monthlyPMI = (baseLoanAmount * 0.0085) / 12;
  } else if (loanType.requiresPMI && downPaymentPercent < 20) {
    monthlyPMI = (baseLoanAmount * loanType.pmiRate) / 12;
  }

  return monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaMonthly;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get DTI color class based on loan type thresholds
 */
export function getDTIColor(
  dti: number,
  standardMax: number,
  expandedMax: number,
): "text-success" | "text-warning" | "text-destructive" {
  if (dti <= standardMax) return "text-success";
  if (dti <= expandedMax) return "text-warning";
  return "text-destructive";
}

export function getQualificationStatus(
  frontEndDTI: number,
  backEndDTI: number,
  creditScore: number,
  hasSufficientSavings: boolean,
  loanType?: LoanType,
): {
  status: "excellent" | "good" | "fair" | "unlikely";
  message: string;
} {
  const lt = loanType || LOAN_TYPES[0];

  if (!hasSufficientSavings) {
    return {
      status: "unlikely",
      message: "Insufficient savings for down payment and closing costs",
    };
  }

  if (creditScore < lt.minCreditScore) {
    return {
      status: "unlikely",
      message: `Credit score below minimum of ${lt.minCreditScore} for ${lt.name} loans`,
    };
  }

  // Excellent: within standard DTI limits
  if (backEndDTI <= lt.maxDTI && frontEndDTI <= lt.maxFrontEndDTI) {
    return {
      status: "excellent",
      message: "Strong qualification — well within standard lender guidelines",
    };
  }

  // Good: within expanded limits with room
  if (backEndDTI <= lt.maxDTI + 5 && frontEndDTI <= lt.expandedFrontEndDTI) {
    return {
      status: "good",
      message: "Likely to qualify with most lenders",
    };
  }

  // Fair: within expanded limits
  if (backEndDTI <= lt.expandedBackEndDTI && frontEndDTI <= lt.expandedFrontEndDTI) {
    return {
      status: "fair",
      message: "May qualify with compensating factors (cash reserves, residual income)",
    };
  }

  return {
    status: "unlikely",
    message: "Debt-to-income ratio exceeds expanded limits for this loan type",
  };
}

// ── Investor Metrics ──────────────────────────────────────────────────────────

export interface InvestorMetrics {
  grossRentalYield: number;
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  monthlyCashFlow: number;
  annualRentalIncome: number;
  annualExpenses: number;
  annualMortgagePayments: number;
}

export interface ExpenseAssumptions {
  vacancyRate: number;
  maintenanceRate: number;
  managementRate: number;
  capexRate: number;
}

export function calculateInvestorMetrics(
  homePrice: number,
  monthlyRentalIncome: number,
  expenses: ExpenseAssumptions,
  monthlyMortgage: number,
  monthlyPropertyTax: number,
  monthlyInsurance: number,
  monthlyPMI: number,
  monthlyHOA: number,
  totalCashInvested: number,
): InvestorMetrics {
  const annualRentalIncome = monthlyRentalIncome * 12;
  const totalExpenseRate =
    (expenses.vacancyRate + expenses.maintenanceRate + expenses.managementRate + expenses.capexRate) / 100;
  const annualExpenses = annualRentalIncome * totalExpenseRate;
  const annualFixedCosts = (monthlyPropertyTax + monthlyInsurance + monthlyPMI + monthlyHOA) * 12;
  const noi = annualRentalIncome - annualExpenses - annualFixedCosts;
  const annualMortgagePayments = monthlyMortgage * 12;

  const grossRentalYield = homePrice > 0 ? (annualRentalIncome / homePrice) * 100 : 0;
  const capRate = homePrice > 0 ? (noi / homePrice) * 100 : 0;
  const cashOnCashReturn = totalCashInvested > 0 ? ((noi - annualMortgagePayments) / totalCashInvested) * 100 : 0;
  const monthlyCashFlow = (noi - annualMortgagePayments) / 12;

  return {
    grossRentalYield: Math.round(grossRentalYield * 100) / 100,
    noi: Math.round(noi),
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualRentalIncome: Math.round(annualRentalIncome),
    annualExpenses: Math.round(annualExpenses + annualFixedCosts),
    annualMortgagePayments: Math.round(annualMortgagePayments),
  };
}

export function getFirstTimeBuyerPrograms(
  stateData: StateData,
  financialProfile: FinancialProfile,
  homePrice: number,
): ProgramEligibility[] {
  const programs: ProgramEligibility[] = [];

  programs.push({
    programId: "fha",
    eligible: financialProfile.creditScore >= 580 && financialProfile.isFirstTimeBuyer !== false,
    reason:
      financialProfile.creditScore < 580 ? "Requires 580+ credit score" : "Eligible for low down payment FHA loan",
  });

  programs.push({
    programId: "state-hfa",
    eligible: financialProfile.isFirstTimeBuyer === true && financialProfile.yearlyIncome <= 150000,
    reason:
      financialProfile.isFirstTimeBuyer !== true
        ? "Requires first-time buyer status"
        : financialProfile.yearlyIncome > 150000
          ? "Income exceeds program limits"
          : `May qualify for ${stateData.name} Housing Finance Agency programs`,
  });

  return programs;
}
