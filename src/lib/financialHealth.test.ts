import { describe, it, expect } from "vitest";
import {
  computeFinancialHealth,
  computeUnifiedQualification,
  creditTier,
  nextCreditTierTarget,
  type HealthInputs,
} from "./financialHealth";
import type { FinancialProfile } from "./calculator";
import type { StateData } from "./states";

const state: StateData = {
  name: "Texas",
  abbreviation: "TX",
  avgPropertyTax: 1.6,
  avgHomeInsurance: 2000,
  avgClosingCost: 2.5,
  medianHomePrice: 320000,
  avgMortgageRate: 6.75,
  firstTimeBuyerPrograms: true,
};

const strongProfile: FinancialProfile = {
  yearlyIncome: 180000,
  monthlyDebt: 300,
  savings: 150000,
  creditScore: 780,
};

const weakProfile: FinancialProfile = {
  yearlyIncome: 40000,
  monthlyDebt: 1800,
  savings: 2000,
  creditScore: 590,
};

function inputs(profile: FinancialProfile, extra: Partial<HealthInputs> = {}): HealthInputs {
  return { state, profile, hoaMonthly: 0, loanTypeId: "conventional", ...extra };
}

describe("computeFinancialHealth", () => {
  it("orders budget tiers: comfortable <= stretch <= maximum", () => {
    for (const profile of [strongProfile, weakProfile]) {
      const r = computeFinancialHealth(inputs(profile));
      expect(r.comfortable.price).toBeLessThanOrEqual(r.stretch.price);
      expect(r.stretch.price).toBeLessThanOrEqual(r.maximum.price);
    }
  });

  it("returns zeroed tiers and empty-state descriptions when income is missing", () => {
    const r = computeFinancialHealth(inputs({ ...strongProfile, yearlyIncome: 0 }));
    expect(r.comfortable.price).toBe(0);
    expect(r.stretch.price).toBe(0);
    expect(r.maximum.price).toBe(0);
    expect(r.comfortable.description).toMatch(/add your yearly income/i);
  });

  it("produces six factors whose weights sum to 100 and scores stay within 0-100", () => {
    const r = computeFinancialHealth(inputs(strongProfile));
    expect(r.factors).toHaveLength(6);
    expect(r.factors.reduce((s, f) => s + f.weight, 0)).toBe(100);
    for (const f of r.factors) {
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(100);
    }
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("scores a strong profile higher than a weak one", () => {
    const strong = computeFinancialHealth(inputs(strongProfile));
    const weak = computeFinancialHealth(inputs(weakProfile));
    expect(strong.overallScore).toBeGreaterThan(weak.overallScore);
    expect(strong.status).toBe("strong");
    expect(weak.status).toBe("risk");
  });

  it("computes cash-to-close as down payment + closing costs + prepaids", () => {
    const r = computeFinancialHealth(inputs(strongProfile));
    expect(r.cash.cashToClose).toBe(
      Math.round(r.cash.downPayment + r.cash.closingCosts + r.cash.prepaids),
    );
    expect(r.cash.remainingAfterClosing).toBe(
      Math.round(strongProfile.savings - r.cash.cashToClose),
    );
  });

  it("flags cash status as risk when savings cannot cover closing", () => {
    const r = computeFinancialHealth(inputs({ ...strongProfile, savings: 1000 }));
    expect(r.cash.remainingAfterClosing).toBeLessThan(0);
    expect(r.cash.status).toBe("risk");
  });

  it("applies overrides on top of the base profile", () => {
    const base = computeFinancialHealth(inputs(strongProfile));
    const overridden = computeFinancialHealth(
      inputs(strongProfile, { overrides: { yearlyIncome: 60000 } }),
    );
    expect(overridden.comfortable.price).toBeLessThan(base.comfortable.price);

    const credit = computeFinancialHealth(
      inputs(strongProfile, { overrides: { creditScore: 600 } }),
    );
    const creditFactor = credit.factors.find((f) => f.key === "credit")!;
    expect(creditFactor.value).toContain("600");
  });

  it("scores DTI against the target home price when provided", () => {
    const noTarget = computeFinancialHealth(inputs(strongProfile));
    const bigTarget = computeFinancialHealth(
      inputs(strongProfile, { targetHomePrice: 2_000_000 }),
    );
    const dtiNoTarget = noTarget.factors.find((f) => f.key === "dti")!;
    const dtiBigTarget = bigTarget.factors.find((f) => f.key === "dti")!;
    expect(dtiBigTarget.score).toBeLessThan(dtiNoTarget.score);
  });

  it("falls back to the first loan type for an unknown loanTypeId", () => {
    const r = computeFinancialHealth(inputs(strongProfile, { loanTypeId: "not-a-loan" }));
    expect(r.loanType).toBeDefined();
    expect(r.loanType.id).toBeTruthy();
  });
});

describe("computeUnifiedQualification", () => {
  it("qualifies a strong profile with a positive reason", () => {
    const report = computeFinancialHealth(inputs(strongProfile));
    const q = computeUnifiedQualification(report, strongProfile, 20);
    expect(q.qualifies).toBe(true);
    expect(q.label).toBe("Qualifies");
  });

  it("does not qualify a weak profile and explains why", () => {
    const report = computeFinancialHealth(inputs(weakProfile));
    const q = computeUnifiedQualification(report, weakProfile, 3);
    expect(q.qualifies).toBe(false);
    expect(q.label).toBe("Needs work");
    expect(q.reason.length).toBeGreaterThan(0);
  });

  it("never qualifies when financial health status is attention or risk", () => {
    const report = computeFinancialHealth(inputs(weakProfile));
    expect(["attention", "risk"]).toContain(report.status);
    const q = computeUnifiedQualification(report, weakProfile, 20);
    expect(q.qualifies).toBe(false);
  });
});

describe("credit tier helpers", () => {
  it("maps scores to tiers at documented boundaries", () => {
    expect(creditTier(780)).toBe("Exceptional");
    expect(creditTier(740)).toBe("Excellent");
    expect(creditTier(700)).toBe("Good");
    expect(creditTier(660)).toBe("Fair");
    expect(creditTier(620)).toBe("Below average");
    expect(creditTier(580)).toBe("Poor");
  });

  it("returns the next tier cutoff, or null at the top", () => {
    expect(nextCreditTierTarget(600)).toBe(620);
    expect(nextCreditTierTarget(620)).toBe(660);
    expect(nextCreditTierTarget(779)).toBe(780);
    expect(nextCreditTierTarget(800)).toBeNull();
  });
});
